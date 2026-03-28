/**
 * Fusion Lab — Main entry point
 * Orchestrates rules + image generation.
 */

const LabMain = {
  // ── Fusion ──────────────────────────────────────────────────────────────────
  async runFusion() {
    const targetId = document.getElementById("fusion-target").value
    const element  = document.getElementById("fusion-element").value
    const customPrompt = document.getElementById("fusion-prompt").value.trim()

    const base = buildBaseFromSpecies(targetId)
    if (!base) return alert("请选择目标精灵")
    if (!FusionRules.isValidElement(element)) return alert("请选择有效元素")

    LabState.setRunning()

    const result = FusionRules.computeFusionResult(base, element)
    if (!result.ok) { LabState.setFailed(new Error(result.error)); return }

    try {
      const task = await this._requestImage(result, customPrompt)
      LabState.setSuccess(result, task)
    } catch (err) {
      // Rules succeeded, image failed — still surface result with error note
      LabState.setSuccess(result, { status: "failed", error: err.message })
    }
  },

  // ── Devour ──────────────────────────────────────────────────────────────────
  async runDevour() {
    const targetId = document.getElementById("devour-target").value
    const donorId  = document.getElementById("devour-donor").value
    const customPrompt = document.getElementById("devour-prompt").value.trim()

    if (targetId === donorId) return alert("目标和供体不能是同一物种")
    const base  = buildBaseFromSpecies(targetId)
    const donor = buildBaseFromSpecies(donorId)
    if (!base || !donor) return alert("请选择目标和供体精灵")

    LabState.setRunning()

    const result = FusionRules.computeDevourResult(base, donor, MOVE_CATALOG)
    if (!result.ok) { LabState.setFailed(new Error(result.error)); return }

    try {
      const task = await this._requestImage(result, customPrompt)
      LabState.setSuccess(result, task)
    } catch (err) {
      LabState.setSuccess(result, { status: "failed", error: err.message })
    }
  },

  // ── Shared image request ─────────────────────────────────────────────────────
  async _requestImage(result, customPrompt) {
    // Ask backend to build prompt + submit task via /api/fusion/evolve
    const res = await fetch("/api/fusion/evolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: result.mode,
        speciesId: result.speciesId,
        speciesName: result.name,
        element: result.element || null,
        donorSpeciesId: result.donorSpeciesId || null,
        donorName: result.donorName || null,
        types: result.types,
        archetype: result.archetype,
        trait: result.trait,
        customPrompt: customPrompt || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Evolution request failed")

    const task = data.task
    if (task.status === "completed") return task

    // Poll
    return ImageService.poll(task.id, t => LabState.setTaskProgress(t))
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildBaseFromSpecies(speciesId) {
  const s = SPECIES_CATALOG[speciesId]
  if (!s) return null
  const profile = SPECIES_PROFILES[speciesId]
  return {
    speciesId,
    name: s.name,
    types: profile?.types || [s.type || "normal"],
    skills: [...(s.skills || [])],
    mutation: {},
  }
}

if (typeof module !== "undefined") module.exports = LabMain
else window.LabMain = LabMain