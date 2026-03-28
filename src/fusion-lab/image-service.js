/**
 * Fusion Lab — Image Service
 * Wraps task submission + polling against the existing dev-server API.
 */

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 120000

const ImageService = {
  /**
   * Submit a generate-monster task and return the task object.
   * @param {string} assetId  - e.g. "sproutle_fire_v1"
   * @param {string} prompt
   * @param {object} options  - passed through to generate-runtime-asset
   * @returns {Promise<object>} task
   */
  async submit(assetId, prompt, options = {}) {
    const res = await fetch("/api/ai/generate-monster", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ speciesId: assetId, prompt, options }),
    })
    const data = await res.json()
    if (!res.ok || !data.task) throw new Error(data.error || "Submit failed")
    return data.task
  },

  /**
   * Poll a task until completed/failed or timeout.
   * @param {string} taskId
   * @param {function} onProgress - called with task on each poll
   * @returns {Promise<object>} final task
   */
  async poll(taskId, onProgress) {
    const deadline = Date.now() + POLL_TIMEOUT_MS
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS)
      const res = await fetch(`/api/ai/tasks/${taskId}`)
      const data = await res.json()
      if (!res.ok || !data.task) throw new Error(data.error || "Poll failed")
      const task = data.task
      if (typeof onProgress === "function") onProgress(task)
      if (task.status === "completed" || task.status === "failed") return task
    }
    throw new Error("Image task timed out")
  },

  /**
   * Submit + poll in one call.
   * @param {string} assetId
   * @param {string} prompt
   * @param {object} options
   * @param {function} onProgress
   * @returns {Promise<object>} final task
   */
  async generate(assetId, prompt, options = {}, onProgress) {
    const task = await this.submit(assetId, prompt, options)
    if (task.status === "completed") {
      if (typeof onProgress === "function") onProgress(task)
      return task
    }
    return this.poll(task.id, onProgress)
  },
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

if (typeof module !== "undefined") module.exports = ImageService
else window.ImageService = ImageService