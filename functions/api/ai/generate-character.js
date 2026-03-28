import { generateImage, resolveImageBuffer } from "../../../lib/image-generator.js"
import { buildTask, createTask, updateTask, getCached, setCached, makeTaskId, hashPrompt, sanitizeTask } from "../../../lib/task-store.js"

export async function onRequestPost(ctx) {
  const { request, env, waitUntil } = ctx

  let payload
  try {
    payload = await request.json()
  } catch (_) {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  const characterId = String(payload.characterId || "player").trim() || "player"
  const prompt = normalizePrompt(payload.prompt)
  if (!prompt) return jsonResponse(400, { error: "prompt is required." })

  const promptHash = hashPrompt(prompt)
  const cached = await getCached(env.AI_CACHE, "character", characterId, promptHash)
  if (cached) {
    return jsonResponse(200, {
      ok: true,
      task: {
        id: `cached-character-${characterId}-${promptHash.slice(0, 8)}`,
        type: "character",
        assetId: characterId,
        speciesId: null,
        characterId,
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
    type: "character",
    assetId: characterId,
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
      type: "character",
      prompt: task.prompt,
      options: task.options,
      env,
      origin,
    })
    const { bytes, extension } = await resolveImageBuffer(result.image)
    const r2Dir = isPlayerCharacterAssetId(task.assetId) ? "player" : "npc"
    const r2Key = `characters/${r2Dir}/${task.assetId}.${extension}`
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
    await setCached(env.AI_CACHE, "character", task.assetId, task.promptHash, {
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

function isPlayerCharacterAssetId(assetId) {
  const normalized = String(assetId || "").trim().toLowerCase()
  if (!normalized) {
    return false
  }
  return (
    normalized === "player" ||
    normalized.startsWith("player_") ||
    normalized.startsWith("female_") ||
    normalized.startsWith("male_")
  )
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}
