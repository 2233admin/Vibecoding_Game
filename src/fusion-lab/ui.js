/**
 * Fusion Lab — UI rendering & event binding
 */

const LabUI = {
  // ── Element refs ────────────────────────────────────────────────────────────
  $ (id) { return document.getElementById(id) },

  // ── Init ────────────────────────────────────────────────────────────────────
  init() {
    LabState.onChange(() => this.render())
    this.$("btn-fusion").addEventListener("click", () => LabMain.runFusion())
    this.$("btn-devour").addEventListener("click", () => LabMain.runDevour())
    this.$("tab-fusion").addEventListener("click", () => this.switchTab("fusion"))
    this.$("tab-devour").addEventListener("click", () => this.switchTab("devour"))
    this.populateSpeciesSelects()
    this.render()
  },

  switchTab(tab) {
    this.$("panel-fusion").hidden = tab !== "fusion"
    this.$("panel-devour").hidden = tab !== "devour"
    this.$("tab-fusion").classList.toggle("active", tab === "fusion")
    this.$("tab-devour").classList.toggle("active", tab === "devour")
  },

  populateSpeciesSelects() {
    const opts = Object.entries(SPECIES_CATALOG)
      .map(([id, s]) => `<option value="${id}">${s.name}</option>`)
      .join("")
    this.$("fusion-target").innerHTML = opts
    this.$("devour-target").innerHTML = opts
    this.$("devour-donor").innerHTML = opts
  },

  // ── Main render ─────────────────────────────────────────────────────────────
  render() {
    const status = LabState.status
    const result = LabState.result
    const task   = LabState.task

    // Status bar
    const statusEl = this.$("status-bar")
    statusEl.textContent = this._statusText(status, result, task)
    statusEl.className = `status-bar status-${status}`

    // Running spinner
    this.$("spinner").hidden = status !== "running"

    // Result card
    this.renderResult(result, task)

    // History
    this.renderHistory()

    // Buttons
    const busy = status === "running"
    this.$("btn-fusion").disabled = busy
    this.$("btn-devour").disabled = busy
  },

  _statusText(status, result, task) {
    if (status === "idle") return "就绪 — 选择精灵和模式后点击执行"
    if (status === "running") {
      if (task) return `生成中… 任务 ${task.id?.slice(0, 8)} [${task.status}]`
      return "规则计算中…"
    }
    if (status === "success") return "进化完成"
    if (status === "failed") return `失败：${result?.error || "未知错误"}`
    return ""
  },

  renderResult(result, task) {
    const el = this.$("result-card")
    if (!result || !result.ok) { el.innerHTML = ""; return }

    const types = FusionRules.formatTypeLabel(result.types || [])
    const skills = (result.skills || []).map(id => {
      const m = MOVE_CATALOG[id]
      return m ? `${m.name}（${m.type}/${m.category}）` : id
    }).join("、")
    const replaced = result.replacedSkill
      ? `<p class="replaced">遗忘：${MOVE_CATALOG[result.replacedSkill]?.name || result.replacedSkill}</p>`
      : ""
    const portrait = task?.assetUrl
      ? `<img class="portrait" src="${task.assetUrl}" alt="进化立绘">`
      : `<div class="portrait-placeholder">${task?.status === "completed" ? "图像加载中" : "立绘生成中…"}</div>`

    el.innerHTML = `
      <div class="result-inner">
        ${portrait}
        <div class="result-info">
          <h2>${result.name} <span class="tier">Tier ${result.tier}</span></h2>
          <p><b>模式：</b>${result.mode === "fusion" ? "融合" : "吞噬"}${result.mode === "fusion" ? ` + ${FusionRules.TYPE_NAMES[result.element] || result.element}` : ` ${result.donorName}`}</p>
          <p><b>属性：</b>${types}</p>
          <p><b>特性：</b>${result.trait}</p>
          <p><b>技能：</b>${skills}</p>
          ${replaced}
        </div>
      </div>
    `
  },

  renderHistory() {
    const el = this.$("history-list")
    const history = LabState.history
    if (!history.length) { el.innerHTML = "<li class='empty'>暂无记录</li>"; return }
    el.innerHTML = history.slice(0, 10).map((entry, i) => {
      const r = entry.result
      const label = r.mode === "fusion"
        ? `${r.name} + ${FusionRules.TYPE_NAMES[r.element] || r.element}`
        : `${r.name} 吞噬 ${r.donorName}`
      const time = entry.createdAt.slice(11, 19)
      return `<li><span class="hist-label">${label}</span><span class="hist-time">${time}</span></li>`
    }).join("")
  },
}

if (typeof module !== "undefined") module.exports = LabUI
else window.LabUI = LabUI