function getObjectiveText() {
  if (state.storyStage === 0) {
    if (!state.flags?.goldenPrologueCompleted) {
      return "观看神兽序章并选择你的流派（融合 / 吞噬），完成梦境引导后再前往研究站。"
    }
    return "去星辉城研究站前找教授雪松，领取你的第一位伙伴。"
  }

  if (state.storyStage === 1) {
    if (state.flags.goldenLegendCubCaptured && !state.flags.ideologyConflictResolved) {
      if (!state.flags.ideologyConflictStarted) {
        return "前往花冠大道寻找同盟教众辰铃，接取主线《理念之争》。"
      }
      return "推进《理念之争》：先完成流派对应的特殊进化，再击败追猎者赫恩。"
    }
    return `前往花冠大道，捕捉 2 只野生怪兽。当前进度 ${state.progress.wildCaptures} / 2。`
  }

  if (state.storyStage === 2) {
    if (!state.flags.ideologyConflictResolved) {
      return "主线优先：完成《理念之争》（辰铃求援）后，反派封锁战才会继续开放。"
    }
    if (!state.flags.alchemyPracticeDone) {
      return "前往家园完成 1 次吞噬或融合实操，再挑战蚀星先遣洛克。"
    }
    if (!state.flags.scoutDefeated) {
      return "在花冠大道击败蚀星先遣洛克，突破反派第一道封锁。"
    }
    if (!state.flags.vanguardDefeated) {
      return "前往蒙德草原后段，击败蚀星执旗维萝，解除道馆前封锁。"
    }
    return "返回星辉城与教授雪松对话，领取星辉道馆通行证。"
  }

  if (state.storyStage === 3) {
    if ((state.progress?.preGymLegendEncounterCount || 0) <= 0) {
      return "先在蒙德草原完成至少 1 次传说遭遇，再回城领取星辉道馆通行证。"
    }
    return "返回星辉城，与教授雪松对话，领取星辉道馆通行证。"
  }

  if (state.storyStage === 4) {
    if (state.flags.gymAideDefeated) {
      return "进入星辉道馆并挑战馆主阿斯特拉，赢下第一枚徽章并完成首个闭环。"
    }
    return "进入星辉道馆。可选：先与试炼官赛弥热身，再挑战馆主阿斯特拉完成首个闭环。"
  }

  if (state.flags.firstGymRewardPending) {
    return "可选：回城与教授雪松对话，领取首个道馆奖励三选一。"
  }

  if (state.flags.gymWon && !state.flags.breederDefeated) {
    return "前往摇叶草原 O 门进入晨露果园，挑战育成师玛芙解锁海湾航线。"
  }

  if (state.flags.breederDefeated && !state.flags.captainDefeated) {
    return "从 11 号水路 K 门进入镜潮海湾，击败队长赛伦。"
  }

  if (state.flags.captainDefeated && !state.flags.aceDefeated) {
    return "前往深层断崖 P 门进入流星高岭，挑战王牌维迦。"
  }

  if (state.flags.aceDefeated && !state.flags.wardenDefeated) {
    return "前往曜风群岛击败守望者伊诺，解锁潮门直达遗迹。"
  }

  if (!state.flags.oldRodClaimed && state.storyStage >= 2) {
    return "可选：旧钓竿可通过补给员诺亚、水系伙伴线索或野外宝箱获得；主线过图不再受阻。"
  }

  if (!state.flags.sanctumOpen) {
    return `探索卷尘地面(d)、水纹水面(r)、摇动草丛(s)，收集遗迹纹章。当前 ${state.progress.sanctumSigils || 0} / 3。`
  }

  if (!state.flags.legendaryCaptured && !state.progress.legendaryCleared) {
    return "前往深层断崖进入天穹遗迹，在祭坛 Z 触发传说宝可梦遭遇。"
  }

  return "传说遭遇已完成。继续扩充图鉴、培养家园仓库阵容并挑战更高难度。"
}

function syncUi() {
  renderMetrics()
  renderStoryPortraitPanel()
  renderDialogueLog()
  renderTeamPanel()
  renderHomePanel()
  renderBagPanel()
  renderPokedexPanel()
  renderAlchemyPanel()
  renderBattlePanel()
  renderChoice()
  if (typeof renderPlayerArtPanel === "function") {
    renderPlayerArtPanel()
  }
  if (typeof renderNpcArtPanel === "function") {
    renderNpcArtPanel()
  }
}

function renderMetrics() {
  ui.badgeCount.textContent = state.player.badges
  ui.ballCount.textContent = state.player.balls
  ui.mapName.textContent = maps[state.currentMap].name
  const repelSteps = Number(state.player.repelSteps) || 0
  ui.stepCount.textContent =
    repelSteps > 0 ? `步数 ${state.player.steps} | 避怪 ${repelSteps}` : `步数 ${state.player.steps}`
  ui.partySummary.textContent = `队伍 ${state.player.party.length} / ${MAX_PARTY_SIZE}`
  ui.objectiveText.textContent = getObjectiveText()

  const caught = Object.keys(state.pokedex.caught).length
  const total = Object.keys(speciesData).length
  const seen = Object.keys(state.pokedex.seen).length

  ui.caughtCount.textContent = `${caught} / ${total}`
  ui.seenCount.textContent = `发现 ${seen}`
  ui.reserveCount.textContent = `后备 ${state.player.reserve.length} / ${MAX_RESERVE_SIZE}`
  if (ui.homeCount) {
    ui.homeCount.textContent = `仓库 ${state.player.home.length} / ${MAX_HOME_STORAGE_SIZE}`
  }
  ui.coinsCount.textContent = `${state.player.coins} 金币`
}

function renderDialogueLog() {
  const entries = state.dialogue.slice(-8).reverse()
  ui.dialogueLog.innerHTML = entries
    .map((entry) => `<p>${formatDialogueEntryHtml(entry)}</p>`)
    .join("")
}

function escapeDialogueHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatDialogueEntryHtml(entry) {
  const escaped = escapeDialogueHtml(entry)
  const shouldHighlight = state.playerProfile?.dialogueNameHighlight !== false
  const name = String(state.playerName || "").trim()
  if (!shouldHighlight || !name) {
    return escaped
  }
  const escapedName = escapeDialogueHtml(name)
  return escaped.split(escapedName).join(`<span class="dialogue-highlight-player">${escapedName}</span>`)
}

function formatSkillNameLine(skills) {
  const names = normalizeSkillSlots(skills)
    .map((skillId) => moveData[skillId]?.name)
    .filter(Boolean)
  return names.length > 0 ? names.join(" / ") : "暂无可用招式"
}

function getMonsterTraitLabel(monster) {
  const trait = normalizeMutation(monster?.mutation).trait
  return typeof trait === "string" && trait ? trait : ""
}

function formatSkillAndTraitLine(monster) {
  const skillLine = formatSkillNameLine(monster?.skills || [])
  const traitLabel = getMonsterTraitLabel(monster)
  if (!traitLabel) {
    return skillLine
  }
  return `${skillLine} · 特性：${traitLabel}`
}

function renderStoryPortraitPanel() {
  if (!ui.storyPortraitFrame) {
    return
  }

  const lastDialogue = state.dialogue[state.dialogue.length - 1] || ""
  const focus = state.storyFocus || normalizeLoadedStoryFocus(null, lastDialogue)

  state.storyFocus = focus
  const line = focus.line || lastDialogue || getObjectiveText()
  applyStoryFocusView(
    {
      tagElement: ui.storyPortraitTag,
      nameElement: ui.storyPortraitName,
      lineElement: ui.storyPortraitLine,
      frameElement: ui.storyPortraitFrame,
      fallbackElement: ui.storyPortraitFallback,
    },
    focus,
    line
  )

  if (ui.inGameMenuStoryFocus) {
    applyStoryFocusView(
      {
        tagElement: ui.inGameMenuStoryPortraitTag,
        nameElement: ui.inGameMenuStoryPortraitName,
        lineElement: ui.inGameMenuStoryPortraitLine,
        frameElement: ui.inGameMenuStoryPortraitFrame,
        fallbackElement: ui.inGameMenuStoryPortraitFallback,
      },
      focus,
      line
    )
  }
}

function applyStoryFocusView(view, focus, line) {
  if (!view?.frameElement || !view?.fallbackElement || !focus) {
    return
  }

  if (view.tagElement) {
    view.tagElement.textContent = focus.tag || "Story Focus"
  }
  if (view.nameElement) {
    view.nameElement.textContent = focus.name
  }
  if (view.lineElement) {
    view.lineElement.textContent = line
  }

  applyCharacterPortrait(
    view.frameElement,
    view.fallbackElement,
    focus.artKeys,
    focus.symbol,
    focus.color
  )
}

function applyCharacterPortrait(frameElement, fallbackElement, artKeys, fallbackSymbol, accentColor) {
  const lookupKeys = Array.isArray(artKeys) ? artKeys : [artKeys]
  const image = lookupKeys.map((key) => getArtImage("characters", key)).find(Boolean) || null

  frameElement.style.setProperty("--portrait-accent", accentColor || "#5aa8d8")

  if (!image) {
    frameElement.classList.remove("has-art")
    frameElement.style.backgroundImage = ""
    fallbackElement.textContent = fallbackSymbol || "?"
    fallbackElement.style.opacity = "1"
    return
  }

  frameElement.classList.add("has-art")
  frameElement.style.backgroundImage = `url("${image.src}")`
  fallbackElement.textContent = fallbackSymbol || "?"
  fallbackElement.style.opacity = "0"
}

function escapeHtmlAttr(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;")
}

function getMonsterPortraitForPanel(monsterOrSpeciesId) {
  const keys = getMonsterArtKeys(monsterOrSpeciesId)
  return keys.map((key) => getArtImage("monsters", key)).find(Boolean) || null
}

function getMonsterFallbackSymbol(monsterOrSpeciesId) {
  const speciesId =
    typeof monsterOrSpeciesId === "string" ? monsterOrSpeciesId : monsterOrSpeciesId?.speciesId
  const speciesName = speciesData[speciesId]?.name || "?"
  return speciesName.charAt(0) || "?"
}

function buildMonsterThumbnailMarkup(monsterOrSpeciesId, options = {}) {
  const image = getMonsterPortraitForPanel(monsterOrSpeciesId)
  const fallbackSymbol = options.fallbackSymbol || getMonsterFallbackSymbol(monsterOrSpeciesId)
  const compactClass = options.compact ? " compact" : ""
  const toneClass = options.tone === "battle" ? " battle-tone" : ""

  if (!image) {
    return `
      <div class="monster-thumb${compactClass}${toneClass}">
        <span>${fallbackSymbol}</span>
      </div>
    `
  }

  const source = escapeHtmlAttr(image.src)
  return `
    <div class="monster-thumb has-art${compactClass}${toneClass}" style="background-image:url(&quot;${source}&quot;);">
      <span>${fallbackSymbol}</span>
    </div>
  `
}

function renderTeamPanel() {
  const homeCount = Array.isArray(state.player.home) ? state.player.home.length : 0
  const canMoveAnyPartyToHome = state.player.party.length > 1 && homeCount < MAX_HOME_STORAGE_SIZE
  const partyContent =
    state.player.party.length === 0
      ? "<p>还没有伙伴。先去找教授雪松吧。</p>"
      : state.player.party
          .map((monster, index) => {
            const ratio = monster.currentHp / monster.maxHp
            const activeClass = index === state.player.activeIndex ? "active" : ""
            const hpWidth = `${Math.max(0, ratio * 100)}%`

            return `
              <article class="team-card ${activeClass}">
                <div class="team-head">
                  <div class="team-head-main">
                    ${buildMonsterThumbnailMarkup(monster)}
                    <div class="team-head-copy">
                      <strong>${formatMonsterDisplayName(monster)}</strong>
                      <span>${formatTypeLabel(getSpeciesTypes(monster))} · Lv.${monster.level}</span>
                    </div>
                  </div>
                  <strong>${monster.currentHp} / ${monster.maxHp}</strong>
                </div>
                <p class="team-meta">${formatSkillAndTraitLine(monster)}</p>
                <div class="team-hp"><div style="width:${hpWidth};"></div></div>
                <button class="mini-button team-switch-button" data-action="set-active" data-index="${index}" ${
                  index === state.player.activeIndex || monster.currentHp <= 0 ? "disabled" : ""
                }>
                  ${monster.currentHp <= 0 ? "已倒下" : "切换为出战"}
                </button>
                <button class="mini-button team-switch-button" data-action="party-to-home" data-party-index="${index}" ${
                  canMoveAnyPartyToHome ? "" : "disabled"
                }>
                  ${canMoveAnyPartyToHome ? "送入家园仓库" : state.player.party.length <= 1 ? "至少保留 1 只" : "家园仓库已满"}
                </button>
              </article>
            `
          })
          .join("")

  const reserveContent =
    state.player.reserve.length === 0
      ? "<p>后备区为空。</p>"
      : state.player.reserve
          .map((monster, index) => {
            const canAddToParty = state.player.party.length < MAX_PARTY_SIZE
            return `
              <article class="team-card">
                <div class="team-head">
                  <div class="team-head-main">
                    ${buildMonsterThumbnailMarkup(monster)}
                    <div class="team-head-copy">
                      <strong>${formatMonsterDisplayName(monster)}</strong>
                      <span>${formatTypeLabel(getSpeciesTypes(monster))} · Lv.${monster.level}</span>
                    </div>
                  </div>
                  <strong>后备</strong>
                </div>
                <p class="team-meta">${formatSkillAndTraitLine(monster)}</p>
                <button class="mini-button team-switch-button" data-action="reserve-to-party" data-reserve-index="${index}" ${
                  canAddToParty ? "" : "disabled"
                }>
                  ${canAddToParty ? "调入队伍" : "队伍已满"}
                </button>
                <button class="mini-button team-switch-button" data-action="reserve-to-home" data-reserve-index="${index}">
                  送回家园仓库
                </button>
              </article>
            `
          })
          .join("")

  ui.teamPanel.innerHTML = `
    <div class="panel-subtitle">当前队伍</div>
    ${partyContent}
    <div class="panel-subtitle">后备区（最多 ${MAX_RESERVE_SIZE}）</div>
    ${reserveContent}
  `
}

function renderHomePanel() {
  if (!ui.homePanel) {
    return
  }

  const homeList = Array.isArray(state.player.home) ? state.player.home : []
  if (homeList.length === 0) {
    ui.homePanel.innerHTML =
      "<p>家园仓库为空。你可以把队伍或后备区精灵手动送入这里。</p>"
    return
  }

  ui.homePanel.innerHTML = homeList
    .map((monster, index) => {
      const canMoveToReserve = state.player.reserve.length < MAX_RESERVE_SIZE
      const canMoveToParty = state.player.party.length < MAX_PARTY_SIZE
      return `
        <article class="team-card">
          <div class="team-head">
            <div class="team-head-main">
              ${buildMonsterThumbnailMarkup(monster)}
              <div class="team-head-copy">
                <strong>${formatMonsterDisplayName(monster)}</strong>
                <span>${formatTypeLabel(getSpeciesTypes(monster))} · Lv.${monster.level}</span>
              </div>
            </div>
            <strong>仓库</strong>
          </div>
          <p class="team-meta">${formatSkillAndTraitLine(monster)}</p>
          <button class="mini-button team-switch-button" data-action="home-to-reserve" data-home-index="${index}" ${
            canMoveToReserve ? "" : "disabled"
          }>
            ${canMoveToReserve ? "调入后备区" : "后备区已满"}
          </button>
          <button class="mini-button team-switch-button" data-action="home-to-party" data-home-index="${index}" ${
            canMoveToParty ? "" : "disabled"
          }>
            ${canMoveToParty ? "调入队伍" : "队伍已满"}
          </button>
        </article>
      `
    })
    .join("")
}

function renderBagPanel() {
  const activeMonster = getActiveMonster()
  const entries = Object.entries(itemCatalog)
    .filter(([itemId]) => (state.player.inventory[itemId] || 0) > 0)
    .sort((left, right) => {
      const leftCategory = left[1].category || "other"
      const rightCategory = right[1].category || "other"
      if (leftCategory === rightCategory) {
        return left[1].name.localeCompare(right[1].name, "zh-CN")
      }
      return leftCategory.localeCompare(rightCategory, "zh-CN")
    })

  if (entries.length === 0) {
    ui.bagPanel.innerHTML = "<p>背包当前为空。可通过商店购买或野外探索获取道具。</p>"
    return
  }

  ui.bagPanel.innerHTML = entries
    .map(([itemId, item]) => {
      const count = state.player.inventory[itemId] || 0
      const actionState = getBagItemActionState(item, activeMonster)
      return `
        <article class="team-card">
          <div class="team-head">
            <div>
              <strong>${item.name}</strong>
              <span>${itemCategoryNames[item.category] || "道具"} · x ${count}</span>
            </div>
            <strong>${item.description}</strong>
          </div>
          <button class="mini-button team-switch-button" data-action="use-item" data-item-id="${itemId}" ${
            actionState.disabled ? "disabled" : ""
          }>
            ${actionState.label}
          </button>
        </article>
      `
    })
    .join("")
}

function getBagItemActionState(item, activeMonster) {
  if (!item) {
    return { disabled: true, label: "不可用" }
  }

  if (item.kind === "key") {
    return { disabled: true, label: "关键道具" }
  }

  if (state.scene === "battle") {
    if (!["heal", "battle_buff"].includes(item.kind)) {
      return { disabled: true, label: "战斗不可用" }
    }
    if (item.kind === "heal") {
      if (!activeMonster || activeMonster.currentHp <= 0 || activeMonster.currentHp >= activeMonster.maxHp) {
        return { disabled: true, label: "当前不可用" }
      }
    }
    return { disabled: false, label: "战斗使用" }
  }

  if (item.kind === "battle_buff") {
    return { disabled: true, label: "仅战斗可用" }
  }

  if (item.kind === "repel") {
    return { disabled: false, label: "野外使用" }
  }

  if (item.kind === "heal") {
    if (!activeMonster || activeMonster.currentHp <= 0 || activeMonster.currentHp >= activeMonster.maxHp) {
      return { disabled: true, label: "无需使用" }
    }
    return { disabled: false, label: "使用" }
  }

  if (item.kind === "treasure") {
    return { disabled: false, label: "出售" }
  }

  return { disabled: false, label: "使用" }
}

function renderPokedexPanel() {
  const entries = Object.keys(speciesData)
    .map((speciesId) => {
      const species = speciesData[speciesId]
      const seen = Boolean(state.pokedex.seen[speciesId])
      const caught = Boolean(state.pokedex.caught[speciesId])
      const selectedPortraitKey = state.pokedex?.portraits?.[speciesId] || ""
      const portraitReady = getMonsterArtKeys(speciesId).some((key) => Boolean(ART_MANIFEST.monsters?.[key]))
      const title = seen ? species.name : "???"
      const description = seen ? species.description : "还没有发现这只怪兽。"
      const status = caught ? "已捕获" : seen ? "已发现" : "未记录"
      const portraitHint = selectedPortraitKey
        ? "图鉴立绘已定稿。"
        : portraitReady
          ? "已有候选立绘，等待定稿。"
          : "暂无图鉴立绘。"
      const detail = `${description} ${portraitHint}`
      const thumbMarkup = seen
        ? buildMonsterThumbnailMarkup(speciesId, { compact: true })
        : '<div class="monster-thumb compact"><span>?</span></div>'

      return `
        <article class="pokedex-entry">
          <div class="team-head-main">
            ${thumbMarkup}
            <div>
              <strong>${title}</strong>
              <span>${detail}</span>
            </div>
          </div>
          <strong>${status}</strong>
        </article>
      `
    })
    .join("")

  ui.pokedexPanel.innerHTML = entries
}

function renderAlchemyPanel() {
  if (!ui.alchemyResourceSummary) {
    return
  }

  const essence = getPlayerEssence()
  const arcane = essence.arcane || 0
  const voidEnergy = essence.void || 0
  const fairy = essence.fairy || 0
  ui.alchemyResourceSummary.textContent = `Arcane ${arcane} | Void ${voidEnergy} | Normal ${
    essence.normal || 0
  } | Fairy ${fairy} | Sun ${essence.sun || 0} | Weapon ${essence.weapon || 0}`

  const partyOptions = state.player.party
    .map((monster) => {
      const species = speciesData[monster.speciesId]
      const mutationTag = getMonsterMutationTag(monster)
      return `<option value="${monster.uid}">${species.name} Lv.${monster.level}${mutationTag}</option>`
    })
    .join("")

  const reserveOptions = state.player.reserve
    .map((monster) => {
      const species = speciesData[monster.speciesId]
      return `<option value="${monster.uid}">${species.name} Lv.${monster.level}</option>`
    })
    .join("")

  const fusionSelected = ui.fusionTargetSelect?.value || ""
  const devourSelected = ui.devourTargetSelect?.value || ""
  const fusionPartnerSelected = ui.fusionPartnerSelect?.value || ""

  if (ui.fusionTargetSelect) {
    ui.fusionTargetSelect.innerHTML = partyOptions || '<option value="">No target</option>'
    if (fusionSelected && state.player.party.some((monster) => monster.uid === fusionSelected)) {
      ui.fusionTargetSelect.value = fusionSelected
    }
  }

  if (ui.fusionPartnerSelect) {
    ui.fusionPartnerSelect.innerHTML = reserveOptions || '<option value="">No reserve monster</option>'
    if (fusionPartnerSelected && state.player.reserve.some((monster) => monster.uid === fusionPartnerSelected)) {
      ui.fusionPartnerSelect.value = fusionPartnerSelected
    }
  }

  if (ui.devourTargetSelect) {
    ui.devourTargetSelect.innerHTML = partyOptions || '<option value="">No target</option>'
    if (devourSelected && state.player.party.some((monster) => monster.uid === devourSelected)) {
      ui.devourTargetSelect.value = devourSelected
    }
  }

  if (ui.fusionActionButton) {
    ui.fusionActionButton.textContent = "执行融合（消耗 Arcane x1）"
    ui.fusionActionButton.disabled =
      alchemyOperationBusy ||
      state.scene === "battle" ||
      !ui.fusionTargetSelect?.value ||
      !ui.fusionPartnerSelect?.value ||
      arcane < 1
  }

  if (ui.fusionPresetBatchButton) {
    const presetCount =
      window.evolutionBlendPipeline &&
      typeof window.evolutionBlendPipeline.getDefaultFusionPresetElements === "function"
        ? window.evolutionBlendPipeline.getDefaultFusionPresetElements().length
        : 0
    ui.fusionPresetBatchButton.textContent =
      presetCount > 0 ? `生成默认融合立绘批次（${presetCount} 套）` : "生成默认融合立绘批次"
    ui.fusionPresetBatchButton.disabled =
      alchemyOperationBusy || state.scene === "battle" || !ui.fusionTargetSelect?.value
  }

  if (ui.devourActionButton) {
    const element = ui.devourElementSelect?.value || "grass"
    const elementCount = Number(essence[element]) || 0
    ui.devourActionButton.disabled =
      alchemyOperationBusy ||
      state.scene === "battle" ||
      !ui.devourTargetSelect?.value ||
      !ui.devourElementSelect?.value ||
      elementCount < 2 ||
      voidEnergy < 1 ||
      state.player.party.length === 0
  }

  if (ui.alchemyTaskStatus) {
    if (alchemyOperationBusy) {
      ui.alchemyTaskStatus.textContent = "Arcane workshop busy..."
    } else if (!ui.alchemyTaskStatus.textContent) {
      ui.alchemyTaskStatus.textContent = "Arcane workshop ready."
    }
  }

  if (ui.alchemyLog) {
    const logs = Array.isArray(state.alchemyLog) ? state.alchemyLog : []
    ui.alchemyLog.innerHTML =
      logs.length > 0 ? logs.slice(-10).map((line) => `<p>${line}</p>`).join("") : "<p>No arcane logs yet.</p>"
  }
}

function cloneAlchemyOperationState() {
  return {
    party: JSON.parse(JSON.stringify(state.player.party || [])),
    reserve: JSON.parse(JSON.stringify(state.player.reserve || [])),
    essence: JSON.parse(JSON.stringify(state.player.essence || {})),
    activeIndex: Number.isInteger(state.player.activeIndex) ? state.player.activeIndex : 0,
    alchemyLog: Array.isArray(state.alchemyLog) ? [...state.alchemyLog] : [],
  }
}

let alchemyOperationBusy = false

function pushAlchemyOperationHistory(kind, summary) {
  if (!state.progress || typeof state.progress !== "object") {
    state.progress = {}
  }
  if (!Array.isArray(state.progress.alchemyHistory)) {
    state.progress.alchemyHistory = []
  }
  state.progress.alchemyHistory.push({
    kind,
    summary: String(summary || ""),
    capturedAt: Date.now(),
    snapshot: cloneAlchemyOperationState(),
  })
  if (state.progress.alchemyHistory.length > 20) {
    state.progress.alchemyHistory = state.progress.alchemyHistory.slice(-20)
  }
}

function rollbackLastAlchemyOperation() {
  const history = state.progress?.alchemyHistory
  if (!Array.isArray(history) || history.length === 0) {
    addDialogue("回退失败：当前没有可回退的吞噬/融合记录。")
    syncUi()
    return false
  }

  const last = history.pop()
  if (!last?.snapshot) {
    addDialogue("回退失败：历史快照损坏。")
    syncUi()
    return false
  }

  state.player.party = (last.snapshot.party || []).map(normalizeMonster)
  state.player.reserve = (last.snapshot.reserve || []).map(normalizeMonster)
  state.player.essence = {
    ...(state.player.essence || {}),
    ...(last.snapshot.essence || {}),
  }
  state.player.activeIndex = clamp(
    Number(last.snapshot.activeIndex) || 0,
    0,
    Math.max(0, state.player.party.length - 1)
  )
  state.alchemyLog = Array.isArray(last.snapshot.alchemyLog) ? [...last.snapshot.alchemyLog] : []
  pushAlchemyLog(`Rollback applied for ${last.kind || "alchemy"} operation.`)
  addDialogue(`已回退上一条${last.kind === "devour" ? "吞噬" : "融合"}操作：${last.summary || "未命名记录"}。`)
  syncUi()
  queueSave()
  return true
}

function hasAlchemyRollbackHistory() {
  return Array.isArray(state.progress?.alchemyHistory) && state.progress.alchemyHistory.length > 0
}

async function performFusionEvolution() {
  if (alchemyOperationBusy) {
    pushAlchemyLog("Fusion ignored: previous alchemy operation is still running.")
    syncUi()
    return
  }

  if (state.scene === "battle") {
    pushAlchemyLog("Fusion unavailable during battle.")
    syncUi()
    return
  }

  alchemyOperationBusy = true
  syncUi()
  try {

  const targetUid = ui.fusionTargetSelect?.value
  const partnerUid = ui.fusionPartnerSelect?.value
  const target = state.player.party.find((monster) => monster.uid === targetUid)
  const partnerIndex = state.player.reserve.findIndex((monster) => monster.uid === partnerUid)
  const partner = partnerIndex >= 0 ? state.player.reserve[partnerIndex] : null
  const essence = getPlayerEssence()

  if (!target || !partner) {
    pushAlchemyLog("Fusion failed: target not found.")
    syncUi()
    return
  }

  if ((essence.arcane || 0) < 1) {
    pushAlchemyLog("Fusion failed: insufficient arcane resource.")
    syncUi()
    return
  }

  pushAlchemyOperationHistory("fusion", `${speciesData[target.speciesId].name} + ${speciesData[partner.speciesId].name}`)

  essence.arcane -= 1
  state.player.reserve.splice(partnerIndex, 1)

  const partnerTypes = getSpeciesTypes(partner)
  const inheritedType = partnerTypes.find((type) => alchemyElementTypes.includes(type)) || partnerTypes[0]
  target.mutation = normalizeMutation(target.mutation)
  target.mutation.tier = clamp(target.mutation.tier + 2, 0, 8)
  target.mutation.mode = "fusion"
  target.mutation.fusedElement = inheritedType
  target.mutation.archetype = getFusionArchetype(target, inheritedType)
  target.mutation.lastRecipe = `fusion:${partner.speciesId}`
  target.mutation.trait = `双体共鸣·${speciesData[partner.speciesId].name}`

  const partnerSkill = [...(partner.skills || [])]
    .filter((skillId) => moveData[skillId])
    .sort((left, right) => (moveData[right]?.power || 0) - (moveData[left]?.power || 0))[0]
  const taught = teachSkillWithReplacement(target, partnerSkill, "Fusion")
  refreshMonsterStats(target, { preserveHpRatio: true })
  target.currentHp = clamp(
    target.currentHp + Math.floor(target.maxHp * 0.28),
    target.currentHp <= 0 ? 1 : target.currentHp,
    target.maxHp
  )

  const monsterName = speciesData[target.speciesId].name
  const partnerName = speciesData[partner.speciesId].name
  const traitLabel = target.mutation.trait || "融合同调"
  const updatedTypes = formatTypeLabel(getSpeciesTypes(target))
  const newSkillName = partnerSkill ? moveData[partnerSkill]?.name || "融合技能" : "融合技能"
  pushAlchemyLog(
    `${monsterName} completed Dual Fusion with ${partnerName} (Tier ${target.mutation.tier}).`
  )
  pushAlchemyLog(`Fusion result -> 属性: ${updatedTypes} | 特性: ${traitLabel}`)
  pushAlchemyLog(`Fusion skill slot update -> ${newSkillName}`)
  if (taught) {
    pushAlchemyLog(taught)
  }
  addDialogue(
    `${monsterName} 与 ${partnerName} 完成双体融合：属性 ${updatedTypes}，特性 ${traitLabel}，并重组了技能。`
  )
  await playEvolutionAnimation({
    mode: "fusion",
    element: inheritedType || "normal",
    monsterName,
  })

  void queueFusionPortraitChoices({
    monster: target,
    partner,
    recipe: inheritedType || "normal",
  })
  if (ui.alchemyTaskStatus) {
    ui.alchemyTaskStatus.textContent = `${monsterName} 融合成功，立绘候选任务已提交。`
  }
  if (!state.flags.alchemyPracticeDone) {
    state.flags.alchemyPracticeDone = true
    addDialogue("系统提示: 你已完成首次进化实操，可继续推进反派封锁战与道馆主线。")
  }
  addDialogue(`${monsterName} 融合成功，正在生成立绘候选（A/B）。`)
  syncUi()

  syncUi()
  queueSave()
  } finally {
    alchemyOperationBusy = false
    syncUi()
  }
}

async function performDevourEvolution() {
  if (alchemyOperationBusy) {
    pushAlchemyLog("Devour ignored: previous alchemy operation is still running.")
    syncUi()
    return
  }

  if (state.scene === "battle") {
    pushAlchemyLog("Devour unavailable during battle.")
    syncUi()
    return
  }

  alchemyOperationBusy = true
  syncUi()
  try {

  const targetUid = ui.devourTargetSelect?.value
  const element = ui.devourElementSelect?.value || "grass"
  const target = state.player.party.find((monster) => monster.uid === targetUid)
  const essence = getPlayerEssence()
  const elementCount = Number(essence[element]) || 0

  if (!target) {
    pushAlchemyLog("Devour failed: target missing.")
    syncUi()
    return
  }

  if (!fusionSelectableElements.includes(element) || elementCount < 2 || (essence.void || 0) < 1) {
    pushAlchemyLog("Devour failed: insufficient element/Void resource.")
    syncUi()
    return
  }

  pushAlchemyOperationHistory("devour", `${speciesData[target.speciesId].name} <- ${getFusionDisplayName(element)}`)

  essence[element] = elementCount - 2
  essence.void -= 1
  target.mutation = normalizeMutation(target.mutation)
  target.mutation.tier = clamp(target.mutation.tier + 2, 0, 8)
  target.mutation.mode = "devour"
  target.mutation.devourType = element
  target.mutation.archetype = "devour"
  target.mutation.lastRecipe = `devour:${element}`
  target.mutation.trait = `渊噬印记·${getFusionDisplayName(element)}`

  const expGain = 36
  const expMessages = await grantExperience(target, expGain)
  const taught = teachSkillWithReplacement(target, fusionSkillByElement[element], "Devour")

  refreshMonsterStats(target, { preserveHpRatio: true })
  target.currentHp = clamp(
    target.currentHp + Math.floor(target.maxHp * 0.3),
    target.currentHp <= 0 ? 1 : target.currentHp,
    target.maxHp
  )

  const targetName = speciesData[target.speciesId].name
  const traitLabel = target.mutation.trait || "吞噬印记"
  const updatedTypes = formatTypeLabel(getSpeciesTypes(target))
  pushAlchemyLog(`${targetName} devoured ${getFusionDisplayName(element)} essence and evolved further.`)
  pushAlchemyLog(`Devour result -> 属性: ${updatedTypes} | 特性: ${traitLabel}`)
  for (const message of expMessages.slice(-3)) {
    pushAlchemyLog(message)
  }
  if (taught) {
    pushAlchemyLog(taught)
  }
  addDialogue(
    `${targetName} 吞噬了 ${getFusionDisplayName(element)} 元素：属性 ${updatedTypes}，特性 ${traitLabel}，并完成技能重组。`
  )
  await playEvolutionAnimation({
    mode: "devour",
    element: element || "void",
    monsterName: targetName,
  })
  void requestEvolutionMonsterPortrait({
    monster: target,
    recipe: element,
    source: "devour",
    donor: null,
    variant: "live",
    applyToMonster: true,
  })
  if (ui.alchemyTaskStatus) {
    ui.alchemyTaskStatus.textContent = `${targetName} 吞噬进化成功，立绘任务已提交。`
  }
  if (!state.flags.alchemyPracticeDone) {
    state.flags.alchemyPracticeDone = true
    addDialogue("系统提示: 你已完成首次进化实操，可继续推进反派封锁战与道馆主线。")
  }

  syncUi()
  queueSave()
  } finally {
    alchemyOperationBusy = false
    syncUi()
  }
}

async function queueDefaultFusionPresetBatch() {
  if (state.scene === "battle") {
    pushAlchemyLog("Preset batch unavailable during battle.")
    syncUi()
    return
  }

  const targetUid = ui.fusionTargetSelect?.value
  const target = state.player.party.find((monster) => monster.uid === targetUid)
  if (!target) {
    pushAlchemyLog("Preset batch failed: target not found.")
    syncUi()
    return
  }

  const pipeline = getEvolutionPipeline()
  if (!pipeline) {
    pushAlchemyLog("Preset batch failed: evolution skill pipeline unavailable.")
    syncUi()
    return
  }

  const requests = pipeline.buildDefaultFusionBatchRequests(target)
  if (!requests.length) {
    pushAlchemyLog("Preset batch skipped: no default fusion presets configured.")
    syncUi()
    return
  }

  const monsterName = speciesData[target.speciesId]?.name || target.speciesId
  pushAlchemyLog(`Preset batch started for ${monsterName}, ${requests.length} recipes.`)
  for (const request of requests) {
    const recipeLabel = getFusionDisplayName(request.recipe)
    pushAlchemyLog(`Preset queued: ${monsterName} + ${recipeLabel}`)
    void requestEvolutionMonsterPortrait({
      ...request,
      monster: target,
    })
    await sleep(80)
  }

  if (ui.alchemyTaskStatus) {
    ui.alchemyTaskStatus.textContent = `${monsterName} 的默认融合立绘批次已提交。`
  }
  syncUi()
}

function getFusionRequirements(element) {
  if (element === "sun") {
    return { sun: 2, fire: 1, electric: 1 }
  }
  if (element === "weapon") {
    return { weapon: 2, rock: 1, normal: 1 }
  }
  return { [element]: 2 }
}

function hasFusionResources(essence, need) {
  return Object.entries(need).every(([key, value]) => (essence[key] || 0) >= value)
}

function consumeFusionResources(essence, need) {
  for (const [key, value] of Object.entries(need)) {
    essence[key] = Math.max(0, (essence[key] || 0) - value)
  }
}

function getFusionArchetype(monster, element) {
  const baseType = getSpeciesTypes(monster)[0] || "normal"
  if (element === "sun" && baseType === "normal") {
    return "shiny"
  }
  if (element === "weapon") {
    return "warrior"
  }
  if (alchemyElementTypes.includes(element) && getSpeciesTypes(monster).includes(element)) {
    return "resonance"
  }
  return "elemental"
}

function getFusionDisplayName(element) {
  if (element === "sun") {
    return "太阳"
  }
  if (element === "weapon") {
    return "武器"
  }
  return typeNames[element] || element
}

function getFusionTraitLabel(element, archetype) {
  const elementName = getFusionDisplayName(element)
  if (archetype === "shiny") {
    return `${elementName}耀辉`
  }
  if (archetype === "warrior") {
    return `${elementName}武装`
  }
  if (archetype === "resonance") {
    return `${elementName}共鸣`
  }
  return `${elementName}同调`
}

function getDevourTraitLabel(donor) {
  const donorName = donor && speciesData[donor.speciesId] ? speciesData[donor.speciesId].name : "素材"
  return `吞噬印记·${donorName}`
}

function buildMonsterArtKey(monster) {
  const mutation = normalizeMutation(monster.mutation)
  const recipe = mutation.lastRecipe || mutation.fusedElement || mutation.devourType || "base"
  const archetype = mutation.archetype || "none"
  const safeRecipe = String(recipe).replace(/[^a-z0-9_-]/gi, "_").toLowerCase()
  return `evo_${monster.speciesId}_${safeRecipe}_${archetype}_t${mutation.tier}`
}

function getPokedexPortraitKey(speciesId) {
  const key = state.pokedex?.portraits?.[speciesId]
  if (typeof key === "string" && key) {
    return key
  }
  return ""
}

function getMonsterArtKeys(monsterOrSpeciesId) {
  if (!monsterOrSpeciesId) {
    return []
  }
  if (typeof monsterOrSpeciesId === "string") {
    const selectedPortrait = getPokedexPortraitKey(monsterOrSpeciesId)
    const previewPortrait =
      typeof getPokedexPortraitJobSnapshot === "function"
        ? getPokedexPortraitJobSnapshot(monsterOrSpeciesId)?.previewKey || ""
        : ""
    if (selectedPortrait) {
      return [selectedPortrait, monsterOrSpeciesId]
    }
    if (previewPortrait) {
      return [previewPortrait, monsterOrSpeciesId]
    }
    return [monsterOrSpeciesId]
  }

  const mutation = normalizeMutation(monsterOrSpeciesId.mutation)
  const keys = []
  if (mutation.portraitKey) {
    keys.push(mutation.portraitKey)
  }
  if (mutation.tier > 0) {
    keys.push(buildMonsterArtKey(monsterOrSpeciesId))
  }
  const selectedPortrait = getPokedexPortraitKey(monsterOrSpeciesId.speciesId)
  const previewPortrait =
    typeof getPokedexPortraitJobSnapshot === "function"
      ? getPokedexPortraitJobSnapshot(monsterOrSpeciesId.speciesId)?.previewKey || ""
      : ""
  if (selectedPortrait) {
    keys.push(selectedPortrait)
  } else if (previewPortrait) {
    keys.push(previewPortrait)
  }
  keys.push(monsterOrSpeciesId.speciesId)
  return [...new Set(keys)]
}

function getEvolutionPipeline() {
  const pipeline = window.evolutionBlendPipeline
  if (pipeline && typeof pipeline.buildRequestPayload === "function") {
    return pipeline
  }
  return null
}

let evolutionAnimationToken = 0

async function playEvolutionAnimation({ mode = "fusion", element = "", monsterName = "伙伴" } = {}) {
  if (!ui.evolutionOverlay) {
    return
  }

  evolutionAnimationToken += 1
  const token = evolutionAnimationToken
  const modeLabel =
    mode === "devour" ? "吞噬进化" : mode === "level" ? "等级进化" : "融合进化"
  const elementLabel =
    mode === "devour"
      ? "虚空同调"
      : mode === "level"
        ? `${getFusionDisplayName(element || "normal")} 觉醒`
        : `${getFusionDisplayName(element)} 同调`
  if (ui.evolutionOverlayText) {
    ui.evolutionOverlayText.textContent = `${monsterName} · ${modeLabel} · ${elementLabel} · 能量汇聚中...`
  }

  ui.evolutionOverlay.dataset.mode = mode
  ui.evolutionOverlay.classList.remove("hidden")

  await sleep(900)
  if (token !== evolutionAnimationToken) {
    return
  }
  if (ui.evolutionOverlayText) {
    ui.evolutionOverlayText.textContent = `${monsterName} · ${modeLabel} · ${elementLabel} · 形态重构中...`
  }

  await sleep(900)
  if (token !== evolutionAnimationToken) {
    return
  }
  if (ui.evolutionOverlayText) {
    ui.evolutionOverlayText.textContent = `${monsterName} · ${modeLabel} · ${elementLabel} · 进化完成`
  }

  await sleep(650)
  if (token !== evolutionAnimationToken) {
    return
  }
  ui.evolutionOverlay.classList.add("hidden")
  delete ui.evolutionOverlay.dataset.mode
}

async function ensureEvolutionArtService() {
  const now = Date.now()
  if (now - evolutionArtState.serviceCheckedAt < 10000) {
    return evolutionArtState.serviceAvailable
  }

  evolutionArtState.serviceCheckedAt = now
  try {
    const response = await fetch(`${AI_API_BASE}/api/ai/health`, { cache: "no-store" })
    const payload = await response.json()
    const providerReady = Boolean(payload?.imageProviderReady ?? payload?.comfyReachable)
    evolutionArtState.serviceAvailable = Boolean(response.ok && payload.ok && providerReady)
  } catch (error) {
    evolutionArtState.serviceAvailable = false
  }
  return evolutionArtState.serviceAvailable
}

async function requestEvolutionMonsterPortrait({
  monster,
  recipe,
  source,
  donor = null,
  variant = "live",
  applyToMonster = true,
}) {
  if (!monster || !monster.uid) {
    return { ok: false, reason: "invalid-monster", artKey: "", src: "" }
  }

  const pipeline = getEvolutionPipeline()
  if (!pipeline) {
    if (applyToMonster && monster?.speciesId && ART_MANIFEST?.monsters?.[monster.speciesId]) {
      monster.mutation = normalizeMutation(monster.mutation)
      monster.mutation.portraitKey = monster.speciesId
      pushAlchemyLog("AI evolution portrait fallback: applied local species portrait.")
      syncUi()
      queueSave()
    }
    pushAlchemyLog("AI evolution portrait skipped: evolution blend pipeline unavailable.")
    return { ok: false, reason: "pipeline-unavailable", artKey: "", src: "" }
  }

  const serviceOk = await ensureEvolutionArtService()
  if (!serviceOk) {
    if (applyToMonster && monster?.speciesId && ART_MANIFEST?.monsters?.[monster.speciesId]) {
      monster.mutation = normalizeMutation(monster.mutation)
      monster.mutation.portraitKey = monster.speciesId
      pushAlchemyLog("AI evolution portrait fallback: local portrait applied (service unavailable).")
      syncUi()
      queueSave()
      return {
        ok: true,
        reason: "fallback-local",
        artKey: monster.speciesId,
        src: String(ART_MANIFEST.monsters[monster.speciesId]),
      }
    }
    pushAlchemyLog("AI evolution portrait skipped: local AI service unavailable.")
    return { ok: false, reason: "service-unavailable", artKey: "", src: "" }
  }

  const design = await fetchEvolutionDesign({
    speciesName: speciesData[monster.speciesId]?.name || monster.speciesId,
    recipe,
    donorName: donor ? speciesData[donor.speciesId]?.name || donor.speciesId : "",
    typeLabel: formatTypeLabel(getSpeciesTypes(monster)),
  })

  const requestPayload = pipeline.buildRequestPayload({
    monster,
    recipe,
    source,
    donor,
    design,
    variant,
  })

  if (!requestPayload) {
    pushAlchemyLog("AI portrait failed: cannot build evolution request payload.")
    return { ok: false, reason: "invalid-request", artKey: "", src: "" }
  }

  const profile = requestPayload.profile || null
  if (profile?.archetype && applyToMonster) {
    monster.mutation = normalizeMutation(monster.mutation)
    monster.mutation.archetype = profile.archetype
  }

  const artKey = requestPayload.artKey
  const prompt = requestPayload.prompt
  const requestOptions = requestPayload.options
  const ownerUid = monster.uid
  const pendingKey = `${ownerUid}:${artKey}`
  if (evolutionArtState.pendingTaskIds.has(pendingKey)) {
    return { ok: false, reason: "duplicate", artKey, src: "" }
  }
  evolutionArtState.pendingTaskIds.add(pendingKey)
  const jobTag = applyToMonster ? "live" : "preset"
  pushAlchemyLog(`AI portrait queued for ${speciesData[monster.speciesId].name} (${artKey} · ${jobTag}).`)

  try {
    const response = await fetch(`${AI_API_BASE}/api/ai/generate-monster`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        speciesId: artKey,
        prompt,
        options: requestOptions,
      }),
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload.error || "Failed to queue evolution portrait task.")
    }

    const task = payload.task
    pushAlchemyLog(`AI evolution task created: ${task.id || "unknown"} (${task.status}).`)
    if (task.status === "completed" && task.assetUrl) {
      const src = applyEvolutionPortraitAsset(task, ownerUid, artKey, {
        applyToMonster,
      })
      return { ok: true, artKey, src }
    }

    const src = await pollEvolutionMonsterTask(task.id, ownerUid, artKey, {
      applyToMonster,
    })
    return { ok: Boolean(src), artKey, src: src || "" }
  } catch (error) {
    pushAlchemyLog(`AI portrait failed: ${error.message || "unknown error"}`)
    return { ok: false, reason: error.message || "unknown-error", artKey, src: "" }
  } finally {
    evolutionArtState.pendingTaskIds.delete(pendingKey)
  }
}

async function fetchEvolutionDesign(payload) {
  try {
    const response = await fetch(`${AI_API_BASE}/api/ai/evolution-design`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "evolution-design failed")
    }
    return data.design || null
  } catch (error) {
    return null
  }
}

async function pollEvolutionMonsterTask(taskId, ownerUid, artKey, options = {}) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    await sleep(1200)
    const response = await fetch(`${AI_API_BASE}/api/ai/tasks/${taskId}`, {
      cache: "no-store",
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload.error || "Cannot query evolution task.")
    }

    const task = payload.task
    if (task.status === "queued" || task.status === "processing") {
      continue
    }

    if (task.status === "failed") {
      throw new Error(task.error || "Evolution portrait generation failed.")
    }

    if (task.status === "completed" && task.assetUrl) {
      return applyEvolutionPortraitAsset(task, ownerUid, artKey, options)
    }

    return ""
  }

  throw new Error("Evolution portrait timed out.")
}

function applyEvolutionPortraitAsset(task, ownerUid, artKey, options = {}) {
  const applyToMonster = options.applyToMonster !== false
  const runtimeSource = `${task.assetUrl}?v=${task.assetVersion || Date.now()}`
  registerRuntimeArtAsset("monsters", artKey, runtimeSource)
  const ownerMonster = [...state.player.party, ...state.player.reserve, ...state.player.home].find(
    (monster) => monster.uid === ownerUid
  )
  if (ownerMonster && applyToMonster) {
    ownerMonster.mutation = normalizeMutation(ownerMonster.mutation)
    ownerMonster.mutation.portraitKey = artKey
  }
  pushAlchemyLog(`${applyToMonster ? "AI portrait applied" : "AI preset generated"}: ${artKey}`)
  syncUi()
  queueSave()
  return runtimeSource
}

async function queueFusionPortraitChoices({ monster, partner, recipe }) {
  if (!monster?.uid) {
    return
  }

  const speciesName = speciesData[monster.speciesId]?.name || monster.speciesId
  const partnerName = speciesData[partner?.speciesId]?.name || "未知素材"

  const [candidateA, candidateB] = await Promise.all([
    requestEvolutionMonsterPortrait({
      monster,
      recipe,
      source: "fusion",
      donor: partner,
      variant: "fusion_choice_a",
      applyToMonster: false,
    }),
    requestEvolutionMonsterPortrait({
      monster,
      recipe,
      source: "fusion",
      donor: partner,
      variant: "fusion_choice_b",
      applyToMonster: false,
    }),
  ])

  const ready = [candidateA, candidateB].filter((entry) => entry?.ok && entry.src && entry.artKey)
  if (ready.length === 0) {
    addDialogue(`${speciesName} 的融合立绘候选生成失败。你可稍后在许愿台重试。`)
    syncUi()
    return
  }

  const options = ready.map((entry, index) => ({
    label: `候选 ${index === 0 ? "A" : "B"}`,
    description: `${speciesName} × ${partnerName} 的融合立绘候选。`,
    imageSrc: entry.src,
    buttonLabel: "设为融合立绘",
    onSelect: () => {
      closeChoice()
      monster.mutation = normalizeMutation(monster.mutation)
      monster.mutation.portraitKey = entry.artKey
      addDialogue(`${speciesName} 的融合立绘已定稿。`)
      syncUi()
      queueSave()
    },
  }))

  options.push({
    label: "暂不选择",
    description: "保留现状，后续可在许愿台重新生成立绘。",
    buttonLabel: "稍后再选",
    onSelect: () => {
      closeChoice()
      addDialogue(`${speciesName} 暂未切换融合立绘。你可后续在许愿台重生成。`)
      syncUi()
      queueSave()
    },
  })

  if (state.scene === "battle") {
    addDialogue(`${speciesName} 的融合立绘候选已生成。当前场景无法弹窗，请稍后在许愿台处理。`)
    syncUi()
    return
  }

  if (state.choice) {
    closeChoice()
  }

  openChoice(`${speciesName} · 融合立绘二选一`, options)
}

function teachSkillWithReplacement(monster, skillId, sourceLabel = "Arcane") {
  if (!monster || !skillId || !moveData[skillId] || monster.skills.includes(skillId)) {
    return ""
  }

  const species = speciesData[monster.speciesId]
  monster.skills = normalizeSkillSlots(monster.skills)
  const learned = learnSkillWithLimit(monster.skills, skillId, {
    limit: MAX_SKILL_SLOTS,
  })
  if (!learned.learned) {
    return ""
  }
  if (!learned.replacedSkillId) {
    return `${sourceLabel}: ${species.name} learned ${moveData[skillId].name}.`
  }

  return `${sourceLabel}: ${species.name} learned ${moveData[skillId].name} and replaced ${
    moveData[learned.replacedSkillId].name
  }.`
}

function getMonsterMutationTag(monster) {
  const mutation = normalizeMutation(monster?.mutation)
  if (mutation.tier <= 0) {
    return ""
  }
  const archetypeLabel = {
    shiny: "闪光",
    warrior: "武者",
    resonance: "共鸣",
    elemental: "元素",
    devour: "吞噬",
  }[mutation.archetype]
  const suffix = archetypeLabel ? ` ${archetypeLabel}` : ""
  const traitSuffix = mutation.trait ? `·${mutation.trait}` : ""
  return ` [T${mutation.tier}${suffix}${traitSuffix}]`
}

function formatMonsterDisplayName(monster) {
  const species = speciesData[monster?.speciesId]
  if (!species) {
    return "未知怪兽"
  }
  return `${species.name}${getMonsterMutationTag(monster)}`
}

function pushAlchemyLog(message) {
  if (!Array.isArray(state.alchemyLog)) {
    state.alchemyLog = []
  }
  state.alchemyLog.push(message)
  state.alchemyLog = state.alchemyLog.slice(-16)
}

function renderBattlePanel() {
  if (!state.battle) {
    ui.battleOverlay.classList.add("hidden")
    if (ui.actionCapture) {
      ui.actionCapture.classList.remove("capture-highlight")
    }
    if (ui.evolutionPortraitStatus) {
      ui.evolutionPortraitStatus.classList.add("hidden")
    }
    if (ui.battleSwitchPanel) {
      ui.battleSwitchPanel.classList.add("hidden")
      ui.battleSwitchPanel.innerHTML = ""
    }
    return
  }

  ui.battleOverlay.classList.remove("hidden")

  const enemy = getEnemyMonster()
  const player = getActiveMonster()

  if (!enemy || !player) {
    return
  }

  const enemySpecies = speciesData[enemy.speciesId]
  const playerSpecies = speciesData[player.speciesId]
  const enemyTypes = getSpeciesTypes(enemy)
  const playerTypes = getSpeciesTypes(player)
  const battleTitle =
    state.battle.kind === "wild" ? "野外遭遇" : `对战 ${state.battle.enemyName}`
  const captureTutorialStage = String(state.battle.captureTutorialStage || "capture")
  const captureTargetHp = Math.max(
    1,
    Math.floor(
      enemy.maxHp * Math.max(0.05, Math.min(0.6, Number(state.battle.captureTutorialTargetHpRate) || 0.2))
    )
  )
  const battleHint = state.battle.captureTutorial
    ? captureTutorialStage === "weaken"
      ? `教学：先把目标压到残血（≤ ${captureTargetHp} HP，锁血 1 HP），再投掷精灵球。`
      : "教学：时机已到，投掷精灵球完成缔约捕捉。"
    : state.battle.kind === "wild"
      ? "先用招式压低血量，再决定捕捉或切换。"
      : "训练家战强调属性与节奏，可用切换和道具拉开优势。"

  ui.battleTitle.textContent = battleTitle
  ui.battleHint.textContent = battleHint
  renderEvolutionPortraitStatusCard(player)

  ui.enemySprite.textContent = enemySpecies.name.charAt(0)
  applyMonsterPortrait(ui.enemySprite.parentElement, ui.enemySprite, enemy)
  ui.enemyName.textContent = formatMonsterDisplayName(enemy)
  ui.enemyLevel.textContent = `Lv.${enemy.level}`
  ui.enemyType.textContent = formatTypeLabel(enemyTypes)
  ui.enemyType.style.background = buildTypeBadgeBackground(enemyTypes)
  ui.enemyHpText.textContent = `${enemy.currentHp} / ${enemy.maxHp} HP`
  setHpBar(ui.enemyHpFill, enemy.currentHp / enemy.maxHp)

  ui.playerSprite.textContent = playerSpecies.name.charAt(0)
  applyMonsterPortrait(ui.playerSprite.parentElement, ui.playerSprite, player)
  ui.playerName.textContent = formatMonsterDisplayName(player)
  ui.playerLevel.textContent = `Lv.${player.level}`
  ui.playerType.textContent = formatTypeLabel(playerTypes)
  ui.playerType.style.background = buildTypeBadgeBackground(playerTypes)
  ui.playerHpText.textContent = `${player.currentHp} / ${player.maxHp} HP`
  setHpBar(ui.playerHpFill, player.currentHp / player.maxHp)

  ui.battleLog.innerHTML = state.battle.log.slice(-8).map((line) => `<p>${line}</p>`).join("")
  ui.battleLog.scrollTop = ui.battleLog.scrollHeight

  const skills = normalizeSkillSlots(player.skills)
  const skill0 = moveData[skills[0]]
  const skill1 = moveData[skills[1]]
  const skill2 = moveData[skills[2]]
  const skill3 = moveData[skills[3]]
  ui.actionSkill0.textContent = buildBattleSkillLabel(skill0, "技能 1")
  ui.actionSkill1.textContent = buildBattleSkillLabel(skill1, "技能 2")
  if (ui.actionSkill2) {
    ui.actionSkill2.textContent = buildBattleSkillLabel(skill2, "技能 3")
  }
  if (ui.actionSkill3) {
    ui.actionSkill3.textContent = buildBattleSkillLabel(skill3, "技能 4")
  }
  ui.actionCapture.textContent =
    state.battle.kind === "wild" ? "投掷捕捉球" : "训练家战不可捕捉"
  if (state.battle.captureTutorial) {
    if (captureTutorialStage === "weaken") {
      ui.actionCapture.textContent = "教学中：先压低血量"
      ui.actionCapture.classList.remove("capture-highlight")
    } else {
      ui.actionCapture.textContent = "缔约捕捉（高成功率）"
      ui.actionCapture.classList.add("capture-highlight")
    }
  } else {
    ui.actionCapture.classList.remove("capture-highlight")
  }
  ui.actionRun.textContent =
    state.battle.kind === "wild"
      ? state.battle.disableRun
        ? "本场不可逃跑"
        : "尝试逃跑"
      : "训练家战不可逃跑"
  if (ui.actionSwitch) {
    ui.actionSwitch.textContent = "切换精灵"
  }
  const battleItemStacks =
    typeof getAvailableBattleItemStacks === "function" ? getAvailableBattleItemStacks() : []
  if (ui.actionItem) {
    const itemTotalCount = battleItemStacks.reduce(
      (sum, entry) => sum + (Number(entry?.count) || 0),
      0
    )
    ui.actionItem.textContent = itemTotalCount > 0 ? `使用道具 (${itemTotalCount})` : "使用道具"
  }

  const disabled = state.battle.locked
  const captureTutorialActive = Boolean(state.battle.captureTutorial)
  const captureTutorialOnly = captureTutorialActive && String(state.battle.captureTutorialStage || "capture") === "capture"
  ui.actionSkill0.disabled = disabled || !skill0 || captureTutorialOnly
  ui.actionSkill1.disabled = disabled || !skill1 || captureTutorialOnly
  if (ui.actionSkill2) {
    ui.actionSkill2.disabled = disabled || !skill2 || captureTutorialOnly
  }
  if (ui.actionSkill3) {
    ui.actionSkill3.disabled = disabled || !skill3 || captureTutorialOnly
  }
  ui.actionCapture.disabled = disabled || state.battle.kind !== "wild"
  if (ui.actionItem) {
    ui.actionItem.disabled = disabled || battleItemStacks.length <= 0 || captureTutorialActive
  }
  ui.actionRun.disabled = disabled || state.battle.kind !== "wild" || state.battle.disableRun || captureTutorialActive
  if (ui.actionSwitch) {
    const hasBenchMonster = state.player.party.some(
      (monster, index) => index !== state.player.activeIndex && monster.currentHp > 0
    )
    ui.actionSwitch.disabled = disabled || !hasBenchMonster || captureTutorialActive
  }

  renderBattleSwitchPanel()
}

function renderEvolutionPortraitStatusCard(monster) {
  if (!ui.evolutionPortraitStatus || !monster || !monster.speciesId) {
    return
  }

  const feedback = state.progress?.lastEvolutionFeedback
  const feedbackActive =
    feedback &&
    feedback.speciesId === monster.speciesId &&
    Date.now() - Number(feedback.startedAt || 0) <= 12 * 60 * 1000

  if (!feedbackActive && !state.pokedex?.candidates?.[monster.speciesId]) {
    ui.evolutionPortraitStatus.classList.add("hidden")
    return
  }

  const snapshot =
    typeof getPokedexPortraitJobSnapshot === "function"
      ? getPokedexPortraitJobSnapshot(monster.speciesId)
      : null
  if (!snapshot) {
    ui.evolutionPortraitStatus.classList.add("hidden")
    return
  }

  const speciesName = speciesData[monster.speciesId]?.name || "该精灵"
  let statusText = `${speciesName} 进化后立绘准备中`
  if (snapshot.selectedKey) {
    statusText = `${speciesName} 进化立绘已定稿，可继续冒险。`
  } else if (snapshot.total > 0 && snapshot.completed < snapshot.total) {
    statusText = `${speciesName} 进化立绘生成中：${snapshot.completed}/${snapshot.total}`
  } else if (snapshot.total > 0 && snapshot.completed >= snapshot.total) {
    statusText = `${speciesName} 候选立绘已生成，离开战斗后可二选一定稿。`
  } else if (snapshot.failed > 0) {
    statusText = `${speciesName} 立绘任务失败，可点击刷新重试。`
  }

  ui.evolutionPortraitStatus.classList.remove("hidden")
  if (ui.evolutionPortraitStatusText) {
    ui.evolutionPortraitStatusText.textContent = statusText
  }
  if (ui.evolutionPortraitProgressFill) {
    const width = snapshot.selectedKey ? 100 : Math.max(0, Math.min(100, snapshot.percent))
    ui.evolutionPortraitProgressFill.style.width = `${width}%`
  }
  if (ui.evolutionPortraitRefresh) {
    ui.evolutionPortraitRefresh.dataset.speciesId = monster.speciesId
    ui.evolutionPortraitRefresh.disabled = Boolean(snapshot.pending)
    ui.evolutionPortraitRefresh.textContent = snapshot.pending ? "生成中..." : "刷新进化立绘"
  }
}

async function handleEvolutionPortraitRefreshAction(speciesId) {
  if (!speciesId || !speciesData[speciesId]) {
    return
  }
  if (typeof requestPokedexPortraitRegenerate !== "function") {
    addDialogue("立绘服务暂不可用，无法刷新。")
    return
  }

  const speciesName = speciesData[speciesId].name
  addDialogue(`${speciesName}：已提交进化立绘刷新任务。`)
  const result = await requestPokedexPortraitRegenerate(speciesId)
  if (!result?.ok) {
    addDialogue(`${speciesName}：刷新失败（${result?.message || "服务不可用"}）。`)
  } else {
    addDialogue(`${speciesName}：进化立绘刷新中，可先继续战斗。`)
  }
  syncUi()
}

function buildBattleSkillLabel(skill, fallback) {
  if (!skill) {
    return fallback
  }
  const typeLabel = typeNames[skill.type] || skill.type
  const categoryLabel = moveCategoryNames[skill.category] || moveCategoryNames.physical
  return `${skill.name} · ${typeLabel}/${categoryLabel}`
}

function renderBattleSwitchPanel() {
  if (!ui.battleSwitchPanel) {
    return
  }
  if (!state.battle || !state.battle.showSwitchPanel) {
    ui.battleSwitchPanel.classList.add("hidden")
    ui.battleSwitchPanel.innerHTML = ""
    return
  }

  const disabled = state.battle.locked
  const rows = state.player.party
    .map((monster, index) => {
      const isActive = index === state.player.activeIndex
      const canSwitch = !isActive && monster.currentHp > 0 && !disabled
      const traitLabel = getMonsterTraitLabel(monster)
      return `
        <article class="battle-switch-card ${isActive ? "is-active" : ""}">
          <div class="battle-switch-main">
            ${buildMonsterThumbnailMarkup(monster, { compact: true, tone: "battle" })}
            <div>
              <strong>${formatMonsterDisplayName(monster)}</strong>
              <span>${formatTypeLabel(getSpeciesTypes(monster))} · Lv.${monster.level}${
                traitLabel ? ` · ${traitLabel}` : ""
              }</span>
            </div>
          </div>
          <div class="battle-switch-actions">
            <span>${monster.currentHp} / ${monster.maxHp} HP</span>
            <button class="mini-button team-switch-button" data-action="battle-switch-select" data-index="${index}" ${
              canSwitch ? "" : "disabled"
            }>
              ${isActive ? "当前出战" : monster.currentHp <= 0 ? "已倒下" : "切换上场"}
            </button>
          </div>
        </article>
      `
    })
    .join("")

  ui.battleSwitchPanel.innerHTML = `
    <div class="battle-switch-head">
      <strong>队伍切换</strong>
      <button class="mini-button team-switch-button" data-action="battle-switch-close">关闭</button>
    </div>
    <div class="battle-switch-list">${rows}</div>
  `
  ui.battleSwitchPanel.classList.remove("hidden")
}

function toggleBattleSwitchPanel(forceOpen) {
  if (!state.battle) {
    return
  }
  if (typeof forceOpen === "boolean") {
    state.battle.showSwitchPanel = forceOpen
  } else {
    state.battle.showSwitchPanel = !state.battle.showSwitchPanel
  }
  renderBattlePanel()
}

function applyMonsterPortrait(badgeElement, labelElement, monsterOrSpeciesId) {
  const keys = getMonsterArtKeys(monsterOrSpeciesId)
  const image = keys.map((key) => getArtImage("monsters", key)).find(Boolean) || null

  if (!image) {
    badgeElement.classList.remove("has-art")
    badgeElement.style.backgroundImage = ""
    labelElement.style.opacity = "1"
    return
  }

  badgeElement.classList.add("has-art")
  badgeElement.style.backgroundImage = `url("${image.src}")`
  labelElement.style.opacity = "0"
}

function renderChoice() {
  if (!state.choice) {
    ui.choiceOverlay.classList.add("hidden")
    ui.choiceOptions.innerHTML = ""
    delete ui.choiceOptions.dataset.count
    delete ui.choiceOverlay.dataset.theme
    return
  }

  ui.choiceOverlay.classList.remove("hidden")
  ui.choiceTitle.textContent = state.choice.title
  ui.choiceOptions.innerHTML = ""
  ui.choiceOptions.dataset.count = String(state.choice.options.length)
  const choiceTitle = String(state.choice.title || "")
  ui.choiceOverlay.dataset.theme = choiceTitle.includes("镜前")
    ? "mirror"
    : choiceTitle.includes("试炼")
      ? "trial"
      : "default"

  for (const option of state.choice.options) {
    const wrapper = document.createElement("article")
    wrapper.className = "choice-option"
    const formFieldElements = {}

    if (option.imageSrc) {
      const media = document.createElement("div")
      media.className = "choice-option-media"

      const image = document.createElement("img")
      image.className = "choice-option-image"
      image.src = option.imageSrc
      image.alt = option.imageAlt || option.label || "choice preview"
      image.loading = "lazy"
      media.append(image)
      wrapper.append(media)
    }

    const title = document.createElement("strong")
    title.textContent = option.label

    const description = document.createElement("span")
    description.textContent = option.description || ""
    wrapper.append(title, description)

    if (Array.isArray(option.formFields) && option.formFields.length > 0) {
      for (const field of option.formFields) {
        const key = String(field?.key || "").trim()
        if (!key) {
          continue
        }
        const fieldWrap = document.createElement("label")
        fieldWrap.className = "choice-field-wrap"

        const fieldLabel = document.createElement("em")
        fieldLabel.className = "choice-field-label"
        fieldLabel.textContent = String(field.label || "输入")

        const fieldType = String(field.type || "text").trim()
        const multiline = fieldType === "textarea"
        const isSelect = fieldType === "select"
        const control = multiline
          ? document.createElement("textarea")
          : isSelect
            ? document.createElement("select")
            : document.createElement("input")
        control.className = `choice-field-input${multiline ? " input-area" : ""}`
        if (!multiline && !isSelect) {
          control.type = fieldType || "text"
        }
        if (Number.isFinite(field.rows) && multiline) {
          control.rows = Math.max(2, Math.floor(field.rows))
        }
        if (Number.isFinite(field.maxLength) && !isSelect) {
          control.maxLength = Math.max(1, Math.floor(field.maxLength))
        }
        if (!isSelect) {
          control.placeholder = String(field.placeholder || "").trim()
          control.value = String(field.value || "")
        } else {
          const options = Array.isArray(field.options) ? field.options : []
          for (const optionItem of options) {
            const optionElement = document.createElement("option")
            if (typeof optionItem === "string") {
              optionElement.value = optionItem
              optionElement.textContent = optionItem
            } else {
              optionElement.value = String(optionItem?.value || "")
              optionElement.textContent = String(optionItem?.label || optionElement.value || "选项")
            }
            control.append(optionElement)
          }
          control.value = String(field.value || "")
          if (!control.value && options.length > 0) {
            const firstOption = options[0]
            control.value = typeof firstOption === "string" ? firstOption : String(firstOption?.value || "")
          }
        }

        formFieldElements[key] = control
        fieldWrap.append(fieldLabel, control)
        wrapper.append(fieldWrap)
      }
    }

    const button = document.createElement("button")
    button.textContent = option.buttonLabel || "选择它"
    button.addEventListener("click", () => {
      if (Array.isArray(option.formFields) && option.formFields.length > 0) {
        const payload = {}
        for (const field of option.formFields) {
          const key = String(field?.key || "").trim()
          if (!key || !formFieldElements[key]) {
            continue
          }
          payload[key] = formFieldElements[key].value
        }
        option.onSelect(payload)
        return
      }
      option.onSelect()
    })

    wrapper.append(button)
    ui.choiceOptions.append(wrapper)
  }
}

function openChoice(title, options) {
  state.choice = { title, options }
  syncUi()
}

function closeChoice() {
  state.choice = null
  syncUi()
  if (typeof flushPendingPokedexPortraitChoices === "function") {
    flushPendingPokedexPortraitChoices()
  }
}

