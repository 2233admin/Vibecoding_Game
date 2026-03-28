import { generateImage, resolveImageBuffer } from "../../lib/image-generator.js"
import { resolveEvolutionDesign } from "../../lib/evolution-design.js"
import { buildTask, createTask, updateTask, getCached, setCached, makeTaskId, hashPrompt, sanitizeTask } from "../../lib/task-store.js"

export async function onRequestPost(ctx) {
  const { request, env, waitUntil } = ctx

  let payload
  try {
    payload = await request.json()
  } catch (_) {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  const mode = String(payload.mode || "fusion")
  const speciesId = String(payload.speciesId || "").trim()
  const speciesName = String(payload.speciesName || speciesId).trim()
  const element = String(payload.element || "").trim()
  const donorSpeciesId = String(payload.donorSpeciesId || "").trim()
  const donorName = String(payload.donorName || donorSpeciesId).trim()
  const types = Array.isArray(payload.types) ? payload.types : []
  const archetype = String(payload.archetype || "elemental")
  const customPrompt = typeof payload.customPrompt === "string" ? payload.customPrompt.trim() : ""

  if (!speciesId) return jsonResponse(400, { error: "speciesId is required." })

  const assetSuffix = mode === "devour" ? `devour_${donorSpeciesId || "void"}` : `${element}_fusion`
  const assetId = `${speciesId}_${assetSuffix}`

  const design = await resolveEvolutionDesign({
    speciesName,
    recipe: mode === "devour" ? "devour" : element,
    donorName: donorName || "",
    typeLabel: types.join("/"),
  }, env)

  const guardrails = [
    "official Pokemon-style art, flat cel-shading, bold clean outlines, smooth color fills, chibi proportions, no realistic textures, no painterly brush strokes",
    "single creature only, no human, no text, no watermark",
    "solid white background, no checkerboard, no transparency pattern",
  ].join(", ")

  let basePrompt
  if (customPrompt) {
    basePrompt = customPrompt
  } else if (mode === "devour") {
    basePrompt = [
      `evolved creature that has devoured and absorbed ${donorName || "another monster"}`,
      `based on the appearance of ${speciesName} in the reference image`,
      `incorporate absorbed traits and features from ${donorName || "the donor"}`,
      `${types.join("/")} dual-type creature`,
      design.promptStyle,
      design.title,
    ].join(", ")
  } else {
    basePrompt = [
      `evolved form of ${speciesName} fused with ${element} element`,
      `KEEP the core body silhouette shape and face of ${speciesName} unchanged from the reference image`,
      `ADD ${element}-type visual effects on top of the existing body: ${design.promptStyle}`,
      `DO NOT redesign the base creature, only layer elemental effects`,
      `${types.join("/")} dual-type creature`,
      design.title,
    ].join(", ")
  }
  const finalPrompt = normalizePrompt(`${basePrompt}, ${guardrails}`)

  // Build reference image list using relative URLs (Worker fetches from Pages static assets)
  const origin = new URL(request.url).origin
  const referenceImages = []
  const basePortraitUrl = await resolveMonsterPortraitUrl(speciesId, origin)
  if (basePortraitUrl) referenceImages.push({ src: basePortraitUrl })
  if (mode === "devour" && donorSpeciesId) {
    const donorPortraitUrl = await resolveMonsterPortraitUrl(donorSpeciesId, origin)
    if (donorPortraitUrl) referenceImages.push({ src: donorPortraitUrl })
  }

  const options = { archetype, mode, element: element || null, donorSpeciesId: donorSpeciesId || null }
  if (referenceImages.length > 0) options.referenceImages = referenceImages

  const promptHash = hashPrompt(finalPrompt)
  const cached = await getCached(env.AI_CACHE, "monster", assetId, promptHash)
  if (cached) {
    return jsonResponse(200, {
      ok: true,
      task: {
        id: `cached-monster-${assetId}-${promptHash.slice(0, 8)}`,
        type: "monster",
        assetId,
        speciesId: assetId,
        characterId: null,
        status: "completed",
        prompt: finalPrompt,
        promptHash,
        cached: true,
        assetPath: cached.assetPath,
        assetUrl: cached.assetUrl,
        assetVersion: cached.assetVersion || Date.now(),
        completedAt: cached.completedAt || new Date().toISOString(),
        logs: ["命中缓存，已直接复用上一张生成结果。"],
      },
      design,
      referenceCount: referenceImages.length,
    })
  }

  const task = buildTask({ id: makeTaskId(), type: "monster", assetId, prompt: finalPrompt, promptHash, options })
  await createTask(env.AI_CACHE, task)
  waitUntil(runGeneration(env, task, origin))

  return jsonResponse(202, { ok: true, task: sanitizeTask(task), design, referenceCount: referenceImages.length })
}

async function runGeneration(env, task, origin) {
  try {
    await updateTask(env.AI_CACHE, task.id, {
      status: "processing",
      startedAt: new Date().toISOString(),
      logs: [...task.logs, "融合进化生成开始。"],
    })

    const result = await generateImage({ type: "monster", prompt: task.prompt, options: task.options, env, origin })
    const { bytes, extension } = await resolveImageBuffer(result.image)
    const r2Key = `monsters/${task.assetId}.${extension}`
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
      logs: [...task.logs, `融合进化完成: ${r2Key}`],
    })
    await setCached(env.AI_CACHE, "monster", task.assetId, task.promptHash, {
      assetPath: r2Key, assetUrl, assetVersion, completedAt: new Date().toISOString(),
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

async function resolveMonsterPortraitUrl(speciesId, origin) {
  if (!speciesId) return null
  const extensions = ["jpg", "jpeg", "png", "webp"]
  for (const ext of extensions) {
    const url = `${origin}/assets/monsters/${speciesId}.${ext}`
    try {
      const res = await fetch(url, { method: "HEAD" })
      if (res.ok) return url
    } catch (_) {}
  }
  return null
}

function normalizePrompt(prompt) {
  return String(prompt || "").replace(/\s+/g, " ").trim()
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}
