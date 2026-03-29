// VN Dialogue Engine 鈥?鏄庢棩鏂硅垷椋庢牸鍙岀珛缁樿瑙夊皬璇村璇濈郴缁?
// 绾?DOM overlay锛屼笉鏀?Canvas 娓叉煋锛屼笉寮曞叆澶栭儴渚濊禆

;(function () {
  // 鈹€鈹€鈹€ 甯搁噺 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const TYPEWRITER_INTERVAL_MS = 40
  const VN_LAYER_ID = "vn-dialogue-layer"

  // 鈹€鈹€鈹€ 杩愯鏃剁姸鎬?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  let _script = []
  let _cursor = 0
  let _typewriterTimer = null
  let _charIndex = 0
  let _fullText = ""
  let _typing = false
  let _onComplete = null
  let _activeSide = null
  let _focusShiftTimer = null

  // 鈹€鈹€鈹€ DOM 寮曠敤锛堝欢杩熷垵濮嬪寲锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  let _layer = null
  let _leftSlot = null
  let _rightSlot = null
  let _nameEl = null
  let _textEl = null
  let _hintEl = null
  let _choicesEl = null

  // 鈹€鈹€鈹€ DOM 鏋勫缓 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  function _buildDOM() {
    if (_layer) return

    _layer = document.createElement("div")
    _layer.id = VN_LAYER_ID
    _layer.className = "vn-dialogue-layer hidden"
    _layer.setAttribute("aria-hidden", "true")

    _layer.innerHTML = `
      <div class="vn-stage">
        <div class="vn-char-left">
          <div class="vn-portrait-inner" data-side="left"></div>
        </div>
        <div class="vn-char-right">
          <div class="vn-portrait-inner" data-side="right"></div>
        </div>
      </div>
      <div class="vn-dialogue-box">
        <div class="vn-name-bar">
          <span class="vn-name-text"></span>
        </div>
        <p class="vn-text-line"></p>
        <span class="vn-next-hint hidden">鈻?/span>
        <div class="vn-choices hidden"></div>
      </div>
    `

    // 娉ㄥ叆鍒?canvas-frame 鍐咃紙鍜屽叾浠?overlay 鍚岀骇锛?
    const canvasFrame = document.querySelector(".canvas-frame")
    if (canvasFrame) {
      canvasFrame.appendChild(_layer)
    } else {
      document.body.appendChild(_layer)
    }

    _leftSlot = _layer.querySelector(".vn-char-left .vn-portrait-inner")
    _rightSlot = _layer.querySelector(".vn-char-right .vn-portrait-inner")
    _nameEl = _layer.querySelector(".vn-name-text")
    _textEl = _layer.querySelector(".vn-text-line")
    _hintEl = _layer.querySelector(".vn-next-hint")
    _choicesEl = _layer.querySelector(".vn-choices")

    // 鐐瑰嚮瀵硅瘽妗嗭細璺宠繃鎵撳瓧鏈?/ 缈婚〉
    _layer.querySelector(".vn-dialogue-box").addEventListener("click", _onDialogueClick)
  }

  // 鈹€鈹€鈹€ 绔嬬粯鍔犺浇 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  function _collectPortraitLookupKeys(portraitId) {
    const id = String(portraitId || "").trim()
    if (!id) {
      return []
    }

    const keys = []
    if (id === "player") {
      const activeKey =
        typeof state !== "undefined"
          ? String(state?.playerPortrait?.activeKey || state?.playerProfile?.portraitKey || "").trim()
          : ""
      if (activeKey) {
        keys.push(activeKey)
      }
      keys.push("player")
    } else {
      keys.push(`npc_${id}`)
      keys.push(id)
    }

    return [...new Set(keys.filter(Boolean))]
  }

  function _getPortraitSrc(portraitId) {
    if (!portraitId) return null

    if (String(portraitId).trim() === "player") {
      const activeSrc =
        typeof state !== "undefined" ? String(state?.playerPortrait?.activeSrc || "").trim() : ""
      if (activeSrc) {
        return { type: "img", src: activeSrc }
      }
    }

    const keys = _collectPortraitLookupKeys(portraitId)

    // 优先从 artState.images（运行时立绘）查找
    if (typeof artState !== "undefined" && artState.images) {
      for (const key of keys) {
        const image = artState.images[`characters:${key}`]
        if (typeof image === "string" && image.trim()) {
          return { type: "img", src: image.trim() }
        }
        if (image?.src) {
          return { type: "img", src: image.src }
        }
      }
    }

    // 尝试 ART_MANIFEST（assets.generated.js）
    if (typeof ART_MANIFEST !== "undefined" && ART_MANIFEST) {
      for (const key of keys) {
        const entry = ART_MANIFEST?.characters?.[key]
        if (!entry) {
          continue
        }
        const src = typeof entry === "string" ? entry : entry.src || entry.url
        if (src) {
          return { type: "img", src }
        }
      }
    }

    return null
  }

  function _getPortraitFallbackLabel(portraitId) {
    if (String(portraitId || "").trim() === "player") {
      const playerName = typeof state !== "undefined" ? String(state?.playerName || "").trim() : ""
      return { symbol: playerName ? playerName.charAt(0) : "你", color: "#5aa8d8" }
    }

    // 浠?npcDefinitions 鍙?symbol + color
    if (typeof npcDefinitions !== "undefined" && Array.isArray(npcDefinitions)) {
      const npc = npcDefinitions.find((n) => n.id === portraitId)
      if (npc) return { symbol: npc.symbol || npc.name?.[0] || "?", color: npc.color || "#aaa" }
    }
    // speciesData fallback
    if (typeof speciesData !== "undefined" && speciesData[portraitId]) {
      const s = speciesData[portraitId]
      return { symbol: s.symbol || s.name?.[0] || "?", color: "#4fa" }
    }
    return { symbol: portraitId?.[0]?.toUpperCase() || "?", color: "#888" }
  }

  function _renderPortrait(slot, portraitId) {
    slot.innerHTML = ""
    if (!portraitId) return

    const result = _getPortraitSrc(portraitId)
    if (result && result.type === "img") {
      const img = document.createElement("img")
      img.src = result.src
      img.className = "vn-portrait-img"
      const normalizedSrc = String(result.src || "").toLowerCase().split("?")[0]
      const isPng =
        normalizedSrc.endsWith(".png") || normalizedSrc.startsWith("data:image/png")
      img.classList.add(isPng ? "vn-portrait-alpha" : "vn-portrait-opaque")
      img.alt = portraitId
      slot.appendChild(img)
      return
    }

    // fallback锛氳壊鍧?+ 鏂囧瓧鍗犱綅
    const fb = _getPortraitFallbackLabel(portraitId)
    const div = document.createElement("div")
    div.className = "vn-portrait-fallback"
    div.style.setProperty("--vn-fb-color", fb.color)
    div.textContent = fb.symbol
    slot.appendChild(div)
  }

  // 鈹€鈹€鈹€ 璇磋瘽鏂归珮浜垏鎹?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  function _setActiveSide(side) {
    if (_activeSide && _activeSide !== side) {
      _layer.classList.add("vn-focus-shift")
      clearTimeout(_focusShiftTimer)
      _focusShiftTimer = setTimeout(() => {
        if (_layer) {
          _layer.classList.remove("vn-focus-shift")
        }
      }, 200)
    }
    _activeSide = side
    _layer.querySelector(".vn-char-left").classList.toggle("vn-active", side === "left")
    _layer.querySelector(".vn-char-right").classList.toggle("vn-active", side === "right")
    _layer.querySelector(".vn-char-left").classList.toggle("vn-silent", side === "right")
    _layer.querySelector(".vn-char-right").classList.toggle("vn-silent", side === "left")
  }

  // 鈹€鈹€鈹€ 鎵撳瓧鏈?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  function _startTypewriter(text) {
    _fullText = text
    _charIndex = 0
    _typing = true
    _textEl.textContent = ""
    _hintEl.classList.add("hidden")

    _typewriterTimer = setInterval(() => {
      _charIndex++
      _textEl.textContent = _fullText.slice(0, _charIndex)
      if (_charIndex >= _fullText.length) {
        _finishTypewriter()
      }
    }, TYPEWRITER_INTERVAL_MS)
  }

  function _finishTypewriter() {
    clearInterval(_typewriterTimer)
    _typewriterTimer = null
    _typing = false
    _textEl.textContent = _fullText

    const line = _script[_cursor]
    if (line && line.choices && line.choices.length > 0) {
      _showChoices(line.choices)
    } else {
      _hintEl.classList.remove("hidden")
    }
  }

  function _skipTypewriter() {
    if (!_typing) return
    clearInterval(_typewriterTimer)
    _typewriterTimer = null
    _typing = false
    _textEl.textContent = _fullText

    const line = _script[_cursor]
    if (line && line.choices && line.choices.length > 0) {
      _showChoices(line.choices)
    } else {
      _hintEl.classList.remove("hidden")
    }
  }

  // 鈹€鈹€鈹€ 閫夐」鍒嗘敮 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  function _showChoices(choices) {
    _hintEl.classList.add("hidden")
    _choicesEl.innerHTML = ""
    _choicesEl.classList.remove("hidden")

    choices.forEach((choice) => {
      const btn = document.createElement("button")
      btn.className = "vn-choice-btn"
      btn.textContent = choice.label
      btn.addEventListener("click", () => {
        _choicesEl.classList.add("hidden")
        _choicesEl.innerHTML = ""
        if (choice.branch && choice.branch.length > 0) {
          // 鎻掑叆鍒嗘敮鑴氭湰鍒板綋鍓嶄綅缃箣鍚?
          const before = _script.slice(0, _cursor + 1)
          const after = _script.slice(_cursor + 1)
          _script = [...before, ...choice.branch, ...after]
        }
        _advance()
      })
      _choicesEl.appendChild(btn)
    })
  }

  // 鈹€鈹€鈹€ 閫愯鎺ㄨ繘 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  function _playLine(line) {
    // 鏇存柊绔嬬粯
    if (line.portrait !== undefined) {
      const slot = line.position === "right" ? _rightSlot : _leftSlot
      _renderPortrait(slot, line.portrait)
    }

    // 楂樹寒璇磋瘽鏂?
    _setActiveSide(line.position || "left")

    // 鏇存柊瑙掕壊鍚?
    _nameEl.textContent = line.name || ""

    // 娓呯┖閫夐」
    _choicesEl.classList.add("hidden")
    _choicesEl.innerHTML = ""
    _hintEl.classList.add("hidden")

    // 鎵撳瓧鏈?
    _startTypewriter(line.text || "")
  }

  function _advance() {
    _cursor++
    if (_cursor >= _script.length) {
      _close()
      return
    }
    _playLine(_script[_cursor])
  }

  function _onDialogueClick() {
    if (_typing) {
      _skipTypewriter()
      return
    }
    // 濡傛灉閫夐」姝ｅ湪鏄剧ず锛岀偣鍑绘棤鏁堬紙璁╃敤鎴风偣鎸夐挳锛?
    if (!_choicesEl.classList.contains("hidden")) return
    _advance()
  }

  // 鈹€鈹€鈹€ 閿洏浜嬩欢锛堢敱 world-events.js handleKeyDown 杞彂锛?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  function handleVNKeyDown(event) {
    const key = (event.key || "").toLowerCase()
    if (key === " " || key === "enter" || key === "e") {
      if (_typing) {
        _skipTypewriter()
      } else if (_choicesEl.classList.contains("hidden")) {
        _advance()
      }
    }
  }

  // 鈹€鈹€鈹€ 鎵撳紑 / 鍏抽棴 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  function _open() {
    _buildDOM()
    _layer.classList.remove("hidden")
    _layer.setAttribute("aria-hidden", "false")
    _activeSide = null
    if (_leftSlot) {
      _leftSlot.classList.remove("vn-enter-left")
      void _leftSlot.offsetWidth
      _leftSlot.classList.add("vn-enter-left")
    }
    if (_rightSlot) {
      _rightSlot.classList.remove("vn-enter-right")
      void _rightSlot.offsetWidth
      _rightSlot.classList.add("vn-enter-right")
    }
    if (typeof state !== "undefined") {
      state.vnActive = true
    }
  }

  function _close() {
    if (!_layer) return
    _layer.classList.add("hidden")
    _layer.setAttribute("aria-hidden", "true")
    _layer.classList.remove("vn-focus-shift")
    clearTimeout(_focusShiftTimer)
    _focusShiftTimer = null
    _activeSide = null

    // 娓呯┖绔嬬粯
    if (_leftSlot) _leftSlot.innerHTML = ""
    if (_rightSlot) _rightSlot.innerHTML = ""

    if (typeof state !== "undefined") {
      state.vnActive = false
    }

    const cb = _onComplete
    _onComplete = null
    if (typeof cb === "function") {
      cb()
    }
  }

  // 鈹€鈹€鈹€ 鍏紑 API 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  /**
   * showVNDialogue(script, options)
   *
   * script: Array of lines:
   *   {
   *     position: "left" | "right",
   *     name: string,
   *     text: string,
   *     portrait: string,          // NPC id 鎴?species id锛屽彲鐪佺暐锛堟部鐢ㄤ笂涓€甯э級
   *     choices: [                 // 鍙€夊垎鏀?
   *       { label: string, branch: [...lines] }
   *     ]
   *   }
   *
   * options:
   *   { onComplete: Function }
   */
  function showVNDialogue(script, options) {
    if (!Array.isArray(script) || script.length === 0) return

    _buildDOM()
    _script = script
    _cursor = 0
    _onComplete = (options && options.onComplete) || null

    // 棰勫姞杞藉叏閮ㄧ珛缁?
    const seen = new Set()
    for (const line of script) {
      if (line.portrait && !seen.has(line.portrait)) {
        seen.add(line.portrait)
        const slot = line.position === "right" ? _rightSlot : _leftSlot
        _renderPortrait(slot, line.portrait)
      }
    }

    _open()
    _playLine(_script[0])
  }

  // 鎸傝浇鍒板叏灞€
  window.showVNDialogue = showVNDialogue
  window.handleVNKeyDown = handleVNKeyDown

  // Console demo: showVNDialogue(demoScript)
  window.demoScript = [
    {
      position: "left",
      name: "教授 雪松",
      portrait: "professor",
      text: "欢迎来到星辉城。你是新来的训练家吗？",
    },
    {
      position: "right",
      name: "馆主 阿斯特拉",
      portrait: "leader",
      text: "我听说过你。准备好接受真正的试炼了吗？",
    },
    {
      position: "left",
      name: "教授 雪松",
      portrait: "professor",
      text: "先选一位伙伴，再去面对她的挑战。",
      choices: [
        { label: "我准备好了", branch: [] },
        {
          label: "再等等我",
          branch: [
            {
              position: "right",
              name: "馆主 阿斯特拉",
              portrait: "leader",
              text: "我会在道馆等你，不要让我久等。",
            },
          ],
        },
      ],
    },
  ]
})()
