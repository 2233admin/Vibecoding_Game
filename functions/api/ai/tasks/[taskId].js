import { getTask, sanitizeTask } from "../../../../lib/task-store.js"

export async function onRequestGet(ctx) {
  const { params, env } = ctx
  const taskId = params.taskId

  if (!taskId) {
    return jsonResponse(400, { error: "taskId is required." })
  }

  const task = await getTask(env.AI_CACHE, taskId)
  if (!task) {
    // Support cached task IDs (they are virtual, not stored in KV)
    if (taskId.startsWith("cached-")) {
      return jsonResponse(404, { error: "Cached task details not available. Use the returned assetUrl directly." })
    }
    return jsonResponse(404, { error: "Task not found." })
  }

  return jsonResponse(200, { ok: true, task: sanitizeTask(task) })
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}
