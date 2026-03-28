import { generateImage, resolveImageBuffer } from "../../../lib/image-generator.js"
import { buildTask, createTask, updateTask, getCached, setCached, makeTaskId, hashPrompt, sanitizeTask } from "../../../lib/task-store.js"

const LEGENDARY_SPECIES = new Set(["solaraith", "abyssalor", "verdion", "stormcrest", "frostplume"])
const EVOLUTION_EDGES = Object.freeze({
  sprigoon: "thornlynx",
  embercub: "blazehound",
  aquaffin: "tideshell",
  beetbit: "mosscarab",
  drillmole: "quakeburrow",
  rivulet: "torrentail",
  reedimp: "bloomantis",
  pixibud: "aurorabbit",
  coralyn: "tidecelest",
  mossfawn: "florastag",
  cinderpup: "sunfang",
  sunfang: "warmaul",
  snowkit: "aurorafang",
})
const STAGE_BY_SPECIES = buildSpeciesStageMap(EVOLUTION_EDGES)

export async function onRequestPost(ctx) {
  const { request, env, waitUntil } = ctx

  let payload
  try {
    payload = await request.json()
  } catch (_) {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  const speciesId = String(payload.speciesId || "").trim()
  const prompt = normalizePrompt(payload.prompt)
  if (!speciesId) return jsonResponse(400, { error: "speciesId is required." })
  if (!prompt) return jsonResponse(400, { error: "prompt is required." })

  const promptHash = hashPrompt(prompt)
  const cached = await getCached(env.AI_CACHE, "monster", speciesId, promptHash)
  if (cached) {
    return jsonResponse(200, {
      ok: true,
      task: {
        id: `cached-monster-${speciesId}-${promptHash.slice(0, 8)}`,
        type: "monster",
        assetId: speciesId,
        speciesId,
        characterId: null,
        status: "completed",
        prompt,
        promptHash,
        cached: true,
        assetPath: cached.assetPath,
        assetUrl: cached.assetUrl,
        assetVersion: cached.assetVersion || Date.now(),
        completedAt: cached.completedAt || new Date().toISOString(),
        logs: ["命中缓存，已直接复用上一张生成结果。"],
      },
    })
  }

  const task = buildTask({
    id: makeTaskId(),
    type: "monster",
    assetId: speciesId,
    prompt,
    promptHash,
    options: payload.options || {},
  })
  await createTask(env.AI_CACHE, task)

  const origin = new URL(request.url).origin
  waitUntil(runGeneration(env, task, origin))

  return jsonResponse(202, { ok: true, task: sanitizeTask(task) })
}

async function runGeneration(env, task, origin) {
  try {
    await updateTask(env.AI_CACHE, task.id, {
      status: "processing",
      startedAt: new Date().toISOString(),
      logs: [...task.logs, "生成开始，正在提交 AI 图像任务。"],
    })

    const result = await generateImage({
      type: "monster",
      prompt: task.prompt,
      options: task.options,
      env,
      origin,
    })
    const { bytes, extension } = await resolveImageBuffer(result.image)
    const relativePath = resolveMonsterAssetRelativePath(task.assetId, extension)
    const r2Key = relativePath.replace(/^assets\//, "")
    await env.R2_BUCKET.put(r2Key, bytes, {
      httpMetadata: { contentType: `image/${extension === "jpg" ? "jpeg" : extension}` },
    })

    const assetUrl = `${env.R2_PUBLIC_URL || ""}/${r2Key}`
    const assetVersion = Date.now()
    await updateTask(env.AI_CACHE, task.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      assetPath: r2Key,
      assetUrl,
      assetVersion,
      logs: [...task.logs, `资源生成完成，已上传 R2: ${r2Key}`],
    })
    await setCached(env.AI_CACHE, "monster", task.assetId, task.promptHash, {
      assetPath: r2Key,
      assetUrl,
      assetVersion,
      completedAt: new Date().toISOString(),
    })
  } catch (error) {
    await updateTask(env.AI_CACHE, task.id, {
      status: "failed",
      completedAt: new Date().toISOString(),
      error: error.message || "Generation failed.",
      logs: [...(task.logs || []), `生成失败: ${error.message}`],
    })
  }
}

function normalizePrompt(prompt) {
  return String(prompt || "").replace(/\s+/g, " ").trim()
}

function buildSpeciesStageMap(edges) {
  const stageMap = new Map()
  const children = new Set(Object.values(edges))
  const speciesSet = new Set([...Object.keys(edges), ...children])
  const roots = [...speciesSet].filter((speciesId) => !children.has(speciesId))
  const queue = roots.map((speciesId) => ({ speciesId, stage: 0 }))

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }
    const { speciesId, stage } = current
    if (stageMap.has(speciesId) && stageMap.get(speciesId) <= stage) {
      continue
    }
    stageMap.set(speciesId, stage)
    const next = edges[speciesId]
    if (next) {
      queue.push({ speciesId: next, stage: Math.min(stage + 1, 2) })
    }
  }

  return stageMap
}

function normalizeAssetId(assetId) {
  return String(assetId || "")
    .trim()
    .toLowerCase()
}

function inferMonsterSpeciesId(assetId) {
  const key = normalizeAssetId(assetId)
  if (!key) {
    return "unknown"
  }

  const dexMatch = key.match(/^dex_([a-z0-9]+)_v\d+$/)
  if (dexMatch) {
    return dexMatch[1]
  }

  const presetMatch = key.match(/^preset_([a-z0-9]+)_.+$/)
  if (presetMatch) {
    return presetMatch[1]
  }

  const evoMatch = key.match(/^evo_([a-z0-9]+)_.+_t\d+$/)
  if (evoMatch) {
    return evoMatch[1]
  }

  const fusionMatch = key.match(/^([a-z0-9]+)_.+_fusion$/)
  if (fusionMatch) {
    return fusionMatch[1]
  }

  if (STAGE_BY_SPECIES.has(key) || LEGENDARY_SPECIES.has(key)) {
    return key
  }
  return key.split("_")[0] || key
}

function inferMonsterFormGroup(assetId) {
  const key = normalizeAssetId(assetId)
  if (!key || key.startsWith("dex_")) {
    return "base"
  }
  if (key.startsWith("preset_")) {
    return "fusion"
  }

  const evoMatch = key.match(/^evo_[a-z0-9]+_(.+)_([a-z0-9]+)_t(\d+)$/)
  if (evoMatch) {
    const recipe = evoMatch[1]
    const archetype = evoMatch[2]
    if (recipe.startsWith("devour_") || archetype === "devour") {
      return "devour"
    }
    return "fusion"
  }

  if (key.includes("_fusion")) {
    return "fusion"
  }
  if (key.includes("devour")) {
    return "devour"
  }
  return "base"
}

function inferMonsterStage(assetId, speciesId, formGroup) {
  const key = normalizeAssetId(assetId)
  const speciesStage = STAGE_BY_SPECIES.has(speciesId) ? STAGE_BY_SPECIES.get(speciesId) : 0
  const explicitStage = key.match(/(?:^|_)s([0-2])(?:_|$)/)
  if (explicitStage) {
    return Number(explicitStage[1])
  }
  if (formGroup !== "base") {
    const tierToken = key.match(/_t(\d+)$/)
    if (tierToken) {
      const tier = Number.parseInt(tierToken[1], 10)
      if (Number.isFinite(tier)) {
        return Math.max(speciesStage, Math.min(tier <= 1 ? 1 : 2, 2))
      }
    }
  }
  return Math.min(Math.max(speciesStage, 0), 2)
}

function normalizeExtension(extension) {
  const normalized = String(extension || "")
    .trim()
    .toLowerCase()
  if (!normalized) {
    return "png"
  }
  if (normalized === "jpeg") {
    return "jpg"
  }
  return normalized.replace(/^\./, "")
}

function resolveMonsterAssetRelativePath(assetId, extension) {
  const key = normalizeAssetId(assetId)
  const speciesId = inferMonsterSpeciesId(key)
  const formGroup = inferMonsterFormGroup(key)
  const stage = inferMonsterStage(key, speciesId, formGroup)
  const rarity = LEGENDARY_SPECIES.has(speciesId) ? "legendary" : "normal"
  const ext = normalizeExtension(extension)
  return `assets/monsters/${rarity}/${speciesId}/${formGroup}/stage${stage}/${key}.${ext}`
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}
