// KV-backed task store for Cloudflare Workers
// Replaces the in-memory tasks Map and .ai-portrait-cache.json from dev-server.mjs

const TASK_TTL_SECONDS = 3600 // 1 hour

function taskKey(taskId) {
  return `task:${taskId}`
}

function cacheKey(type, assetId, promptHash) {
  return `cache:${type}:${assetId}:${promptHash}`
}

export async function createTask(kv, task) {
  await kv.put(taskKey(task.id), JSON.stringify(task), {
    expirationTtl: TASK_TTL_SECONDS,
  })
  return task
}

export async function getTask(kv, taskId) {
  return kv.get(taskKey(taskId), "json")
}

export async function updateTask(kv, taskId, updates) {
  const task = await getTask(kv, taskId)
  if (!task) return null
  const updated = { ...task, ...updates }
  await kv.put(taskKey(task.id), JSON.stringify(updated), {
    expirationTtl: TASK_TTL_SECONDS,
  })
  return updated
}

export async function getCached(kv, type, assetId, promptHash) {
  return kv.get(cacheKey(type, assetId, promptHash), "json")
}

export async function setCached(kv, type, assetId, promptHash, entry) {
  await kv.put(cacheKey(type, assetId, promptHash), JSON.stringify(entry), {
    expirationTtl: 86400 * 7, // 7 days
  })
}

export function makeTaskId() {
  return crypto.randomUUID()
}

export function hashPrompt(prompt) {
  // Simple FNV-1a hash (no Node.js crypto in Workers edge runtime)
  let hash = 2166136261
  for (let i = 0; i < prompt.length; i++) {
    hash ^= prompt.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}

export function buildTask({ id, type, assetId, prompt, promptHash, options = {} }) {
  return {
    id,
    type,
    assetId,
    prompt,
    promptHash,
    options,
    status: "queued",
    logs: ["任务已排队，等待 AI 图像服务处理。"],
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    assetPath: null,
    assetUrl: null,
    assetVersion: null,
    error: null,
  }
}

export function sanitizeTask(task) {
  return {
    id: task.id,
    type: task.type,
    assetId: task.assetId,
    speciesId: task.type === "monster" ? task.assetId : null,
    characterId: task.type === "character" ? task.assetId : null,
    prompt: task.prompt,
    status: task.status,
    createdAt: task.createdAt,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    assetPath: task.assetPath,
    assetUrl: task.assetUrl,
    assetVersion: task.assetVersion,
    cached: task.cached || false,
    error: task.error,
    logs: (task.logs || []).slice(-16),
  }
}
