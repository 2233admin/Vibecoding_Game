import http from "node:http"
import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import { loadLocalEnv } from "./load-local-env.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
loadLocalEnv(projectRoot)
const serverPort = Number.parseInt(process.env.PORT || "4310", 10)
const host = process.env.HOST || "127.0.0.1"
const cacheFilePath = path.join(projectRoot, ".ai-portrait-cache.json")
const runtimeImageProvider = normalizeRuntimeImageProvider(process.env.RUNTIME_IMAGE_PROVIDER || "proxy")
const proxyApiKey = process.env.AISERVICEPROXY_API_KEY || ""
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
const geminiTextModel = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash"
const geminiApiKey = process.env.GEMINI_API_KEY || ""

const tasks = new Map()
const taskQueue = []
let activeTaskId = null

const server = http.createServer(async (request, response) => {
  try {
    if (!request.url) {
      sendJson(response, 400, { error: "Missing request URL." })
      return
    }

    const url = new URL(request.url, `http://${request.headers.host || `${host}:${serverPort}`}`)

    if (url.pathname.startsWith("/api/")) {
      await handleApiRequest(request, response, url)
      return
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed." })
      return
    }

    await serveStaticFile(response, url.pathname)
  } catch (error) {
    sendJson(response, 500, {
      error: error.message || "Unexpected server error.",
    })
  }
})

server.listen(serverPort, host, () => {
  console.log(`GBIT AI server running at http://${host}:${serverPort}`)
})

async function handleApiRequest(request, response, url) {
  if (request.method === "OPTIONS") {
    sendEmpty(response, 204)
    return
  }

  if (request.method === "GET" && url.pathname === "/api/ai/health") {
    const providerState = resolveRuntimeImageProviderState()

    sendJson(response, 200, {
      ok: true,
      server: true,
      imageProvider: providerState.primaryProvider,
      imageProviderReady: providerState.ready,
      availableProviders: providerState.availableProviders,
      // Keep legacy keys for frontend backward compatibility.
      comfyBaseUrl: null,
      comfyReachable: providerState.ready,
      activeTaskId,
      queuedCount: taskQueue.length,
      publicBaseUrl: `http://${host}:${serverPort}`,
      providerHint: providerState.hint,
    })
    return
  }

  if (request.method === "POST" && url.pathname === "/api/ai/generate-monster") {
    const payload = await readRequestJson(request)
    const speciesId = String(payload.speciesId || "").trim()
    const prompt = normalizePrompt(payload.prompt)

    if (!speciesId) {
      sendJson(response, 400, { error: "speciesId is required." })
      return
    }

    if (!prompt) {
      sendJson(response, 400, { error: "prompt is required." })
      return
    }

    const task = await enqueueGenerationTask(response, {
      type: "monster",
      assetId: speciesId,
      prompt,
      options: payload.options || {},
      outputRoot: "assets",
      manifestPath: "assets.generated.js",
    })
    sendJson(response, task.statusCode, { ok: true, task: task.payload })
    return
  }

  if (request.method === "POST" && url.pathname === "/api/ai/generate-character") {
    const payload = await readRequestJson(request)
    const characterId = String(payload.characterId || "player").trim() || "player"
    const prompt = normalizePrompt(payload.prompt)

    if (!prompt) {
      sendJson(response, 400, { error: "prompt is required." })
      return
    }

    const outputRoot = payload.publishRuntime === false ? "art-pipeline/generated" : "assets"
    const manifestPath =
      payload.publishRuntime === false ? "art-pipeline/assets.generated.js" : "assets.generated.js"

    const task = await enqueueGenerationTask(response, {
      type: "character",
      assetId: characterId,
      prompt,
      options: payload.options || {},
      outputRoot,
      manifestPath,
    })
    sendJson(response, task.statusCode, { ok: true, task: task.payload })
    return
  }

  if (request.method === "POST" && url.pathname === "/api/ai/evolution-design") {
    const payload = await readRequestJson(request)
    const design = await resolveEvolutionDesign(payload)
    sendJson(response, 200, { ok: true, design })
    return
  }

  if (request.method === "POST" && url.pathname === "/api/fusion/evolve") {
    const payload = await readRequestJson(request)
    const result = await handleFusionEvolve(payload, response)
    sendJson(response, result.statusCode, result.body)
    return
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/ai/tasks/")) {
    const taskId = url.pathname.slice("/api/ai/tasks/".length)
    const task = tasks.get(taskId)

    if (!task) {
      sendJson(response, 404, { error: "Task not found." })
      return
    }

    sendJson(response, 200, { ok: true, task: sanitizeTask(task, response) })
    return
  }

  sendJson(response, 404, { error: "API route not found." })
}

async function serveStaticFile(response, pathname) {
  const safePathname = pathname === "/" ? "/index.html" : pathname
  const normalizedPath = path.normalize(safePathname).replace(/^(\.\.[/\\])+/, "")
  const absolutePath = path.resolve(projectRoot, `.${normalizedPath}`)

  if (!absolutePath.startsWith(projectRoot)) {
    sendJson(response, 403, { error: "Forbidden." })
    return
  }

  try {
    const stat = await fs.stat(absolutePath)
    const filePath = stat.isDirectory() ? path.join(absolutePath, "index.html") : absolutePath
    const fileBuffer = await fs.readFile(filePath)

    response.writeHead(200, {
      "content-type": getContentType(filePath),
      "cache-control": filePath.endsWith(".png") ? "no-cache" : "no-store",
      ...corsHeaders(),
    })
    response.end(fileBuffer)
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: "Not found." })
      return
    }
    throw error
  }
}

function createTask({ type, assetId, prompt, promptHash, options }) {
  return {
    id: crypto.randomUUID(),
    type,
    assetId,
    prompt,
    promptHash,
    options,
    outputRoot: "assets",
    manifestPath: "assets.generated.js",
    status: "queued",
    logs: ["任务已排队，等待 AI 图像服务处理。"],
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    assetPath: null,
    assetVersion: null,
    error: null,
    metadata: null,
  }
}

function findExistingTask(type, assetId, promptHash) {
  for (const task of tasks.values()) {
    if (
      task.type === type &&
      task.assetId === assetId &&
      task.promptHash === promptHash &&
      (task.status === "queued" || task.status === "processing")
    ) {
      return task
    }
  }
  return null
}

function processQueue() {
  if (activeTaskId || taskQueue.length === 0) {
    return
  }

  const nextTaskId = taskQueue.shift()
  const task = tasks.get(nextTaskId)
  if (!task) {
    processQueue()
    return
  }

  activeTaskId = task.id
  runTask(task)
}

function runTask(task) {
  task.status = "processing"
  task.startedAt = new Date().toISOString()
  task.logs.push("生成开始，正在提交 AI 图像任务。")

  const commandArgs = [
    "scripts/generate-runtime-asset.mjs",
    "--json",
    "--type",
    task.type,
    "--id",
    task.assetId,
    "--prompt",
    task.prompt,
    "--output-root",
    task.outputRoot,
    "--manifest",
    task.manifestPath,
  ]

  if (task.options && typeof task.options === "object" && Object.keys(task.options).length > 0) {
    commandArgs.push("--options-json", JSON.stringify(task.options))
  }

  const child = spawn(process.execPath, commandArgs, {
    cwd: projectRoot,
    windowsHide: true,
    env: { ...process.env, PYTHONUTF8: "1" },
  })

  let stdoutBuffer = ""
  let stderrBuffer = ""
  let resultPayload = null

  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk.toString("utf8")
    const lines = stdoutBuffer.split(/\r?\n/u)
    stdoutBuffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        continue
      }
      if (trimmed.startsWith("__GBIT_RESULT__ ")) {
        try {
          resultPayload = JSON.parse(trimmed.slice("__GBIT_RESULT__ ".length))
        } catch (error) {
          task.logs.push("生成脚本返回了无法解析的结果。")
        }
        continue
      }
      task.logs.push(trimmed)
      trimTaskLogs(task)
    }
  })

  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk.toString("utf8")
    const lines = stderrBuffer.split(/\r?\n/u)
    stderrBuffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        continue
      }
      task.logs.push(trimmed)
      trimTaskLogs(task)
    }
  })

  child.on("error", (error) => {
    task.status = "failed"
    task.completedAt = new Date().toISOString()
    task.error = error.message
    task.logs.push(`本地生成进程启动失败: ${error.message}`)
    trimTaskLogs(task)
    activeTaskId = null
    processQueue()
  })

  child.on("close", async (code) => {
    if (stdoutBuffer.trim()) {
      task.logs.push(stdoutBuffer.trim())
    }
    if (stderrBuffer.trim()) {
      task.logs.push(stderrBuffer.trim())
    }
    trimTaskLogs(task)

    if (code === 0 && resultPayload?.ok) {
      task.status = "completed"
      task.completedAt = new Date().toISOString()
      task.metadata = resultPayload
      task.assetPath = resultPayload.browserPath
      task.assetVersion = Date.now()
      task.logs.push(`资源生成完成，已写入 ${task.outputRoot}。`)
      trimTaskLogs(task)
      await writeCacheEntry(task)
    } else {
      task.status = "failed"
      task.completedAt = new Date().toISOString()
      task.error =
        resultPayload?.error ||
        `生成脚本退出码 ${code == null ? "unknown" : code}，请检查 AI provider 配置。`
      task.logs.push(task.error)
      trimTaskLogs(task)
    }

    activeTaskId = null
    processQueue()
  })
}

function trimTaskLogs(task) {
  task.logs = task.logs.slice(-16)
}

async function writeCacheEntry(task) {
  if (!task.assetPath) {
    return
  }

  const cache = await readCache()
  cache[`${task.type}:${task.assetId}`] = {
    promptHash: task.promptHash,
    prompt: task.prompt,
    assetPath: task.assetPath,
    assetVersion: task.assetVersion,
    completedAt: task.completedAt,
  }
  await fs.writeFile(cacheFilePath, JSON.stringify(cache, null, 2), "utf8")
}

async function readCache() {
  try {
    const raw = await fs.readFile(cacheFilePath, "utf8")
    return JSON.parse(raw)
  } catch (error) {
    return {}
  }
}

function sanitizeTask(task, response) {
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
    assetUrl: task.assetPath ? absoluteAssetUrl(response, task.assetPath) : null,
    assetVersion: task.assetVersion,
    cached: false,
    error: task.error,
    logs: task.logs,
  }
}

async function enqueueGenerationTask(response, taskInput) {
  const { type, assetId, prompt, options = {}, outputRoot, manifestPath } = taskInput
  const promptHash = hashPrompt(prompt)
  const cache = await readCache()
  const cacheKey = `${type}:${assetId}`
  const cachedEntry = cache[cacheKey]
  const cachedAbsolutePath = cachedEntry?.assetPath ? path.resolve(projectRoot, cachedEntry.assetPath) : null

  if (
    cachedEntry &&
    cachedEntry.promptHash === promptHash &&
    cachedAbsolutePath &&
    (await fileExists(cachedAbsolutePath))
  ) {
    return {
      statusCode: 200,
      payload: {
        id: `cached-${type}-${assetId}-${promptHash.slice(0, 8)}`,
        type,
        assetId,
        speciesId: type === "monster" ? assetId : null,
        characterId: type === "character" ? assetId : null,
        status: "completed",
        prompt,
        promptHash,
        cached: true,
        assetPath: cachedEntry.assetPath,
        assetUrl: absoluteAssetUrl(response, cachedEntry.assetPath),
        assetVersion: cachedEntry.assetVersion || Date.now(),
        completedAt: cachedEntry.completedAt || new Date().toISOString(),
        logs: ["命中本地缓存，已直接复用上一张生成结果。"],
      },
    }
  }

  const existingTask = findExistingTask(type, assetId, promptHash)
  if (existingTask) {
    return {
      statusCode: 202,
      payload: sanitizeTask(existingTask, response),
    }
  }

  const task = createTask({
    type,
    assetId,
    prompt,
    promptHash,
    options,
  })
  task.outputRoot = outputRoot
  task.manifestPath = manifestPath

  tasks.set(task.id, task)
  taskQueue.push(task.id)
  processQueue()

  return {
    statusCode: 202,
    payload: sanitizeTask(task, response),
  }
}

async function resolveEvolutionDesign(payload) {
  const speciesName = String(payload.speciesName || "monster").trim()
  const recipe = String(payload.recipe || "fusion").trim().toLowerCase()
  const donorName = String(payload.donorName || "").trim()
  const typeLabel = String(payload.typeLabel || "").trim()

  const fallback = buildFallbackEvolutionDesign({
    speciesName,
    recipe,
    donorName,
    typeLabel,
  })

  // Known elements use fixed formulas — skip Gemini to ensure visual stability
  if (recipe === "devour" || ELEMENT_FORMULAS[recipe]) {
    return { ...fallback, source: "formula" }
  }

  if (!geminiApiKey) {
    return {
      ...fallback,
      source: "fallback-no-key",
    }
  }

  try {
    const raw = await requestGeminiEvolutionDesign({
      speciesName,
      recipe,
      donorName,
      typeLabel,
    })
    const parsed = parseJsonFromText(raw)
    if (!parsed || typeof parsed !== "object") {
      return {
        ...fallback,
        source: "fallback-parse",
      }
    }

    const archetype = String(parsed.archetype || fallback.archetype).toLowerCase()
    const title = String(parsed.title || fallback.title).trim() || fallback.title
    const promptStyle = String(parsed.promptStyle || fallback.promptStyle).trim() || fallback.promptStyle
    const result = {
      archetype,
      title,
      promptStyle,
      source: "gemini",
    }
    return result
  } catch (error) {
    return {
      ...fallback,
      source: "fallback-error",
      error: error.message || "Gemini request failed",
    }
  }
}

const ELEMENT_FORMULAS = {
  grass: {
    archetype: "resonance",
    title: (n) => `${n}·翠叶共鸣形`,
    promptStyle: "large leaf mantle draped over shoulders, flower bud sprouting from back, vine tendrils coiling around limbs, forest-green body accents, pollen spore particles floating around",
  },
  fire: {
    archetype: "elemental",
    title: (n) => `${n}·炽焰迸发形`,
    promptStyle: "flame markings etched along spine and tail, fire crown or flame mane on head, glowing ember eyes, orange-red rim light, heat shimmer distortion rising from body",
  },
  water: {
    archetype: "elemental",
    title: (n) => `${n}·潮浪守卫形`,
    promptStyle: "translucent fin crest on head and back, teardrop water-drop scale patterns on body, teal-blue glow at edges, foam and bubble particles around feet, cool wet sheen on skin",
  },
  bug: {
    archetype: "resonance",
    title: (n) => `${n}·甲壳共鸣形`,
    promptStyle: "iridescent insect wings sprouting from back, chitin shell plating on limbs and torso, compound-eye glow, thin antennae on head, bioluminescent vein patterns across body",
  },
  electric: {
    archetype: "elemental",
    title: (n) => `${n}·弧电驱动形`,
    promptStyle: "jagged yellow lightning-bolt stripes running along body, electric spark burst at claw tips and tail end, glowing neon-yellow eyes, crackling static aura surrounding silhouette",
  },
  rock: {
    archetype: "elemental",
    title: (n) => `${n}·花岗要塞形`,
    promptStyle: "rough crystal-ore armor plates fused to shoulders and back, gem shards embedded in forehead and knuckles, heavy broad silhouette, grey-brown stone texture on outer surface, dust cloud aura",
  },
  fairy: {
    archetype: "shiny",
    title: (n) => `${n}·月誓精灵形`,
    promptStyle: "crescent moon halo floating above head, delicate translucent fairy wings, star-sparkle particle trail behind body, pastel pink-lavender color accent on ears and tips, soft ethereal glow",
  },
  sun: {
    archetype: "shiny",
    title: (n) => `${n}·太阳辉耀形`,
    promptStyle: "golden solar crown with radiating light-ray spikes, warm white-gold full-body glow, sun-disc emblem on chest, confident heroic upright pose, lens-flare rim light",
  },
  weapon: {
    archetype: "warrior",
    title: (n) => `${n}·战甲融合形`,
    promptStyle: "creature gripping or biting a fantasy weapon (sword or spear or axe) in its mouth or claws, weapon design echoes creature body color, forged-metal blade fused with natural body features, battle-ready combat stance, sharp metallic glint",
  },
}

function buildFallbackEvolutionDesign({ speciesName, recipe, donorName, typeLabel }) {
  if (recipe === "devour") {
    return {
      archetype: "devour",
      title: donorName
        ? `${speciesName}·吞噬${donorName}`
        : `${speciesName}·吞噬形态`,
      promptStyle: "predatory evolved creature, darker edge details, absorbed donor trait echoes on body, high-pressure intimidating posture",
    }
  }

  const formula = ELEMENT_FORMULAS[recipe]
  if (formula) {
    return {
      archetype: formula.archetype,
      title: formula.title(speciesName),
      promptStyle: formula.promptStyle,
    }
  }

  return {
    archetype: "elemental",
    title: `${speciesName}·融合形态`,
    promptStyle: `${recipe || typeLabel || "elemental"} type visual effects added to body, dual-type color blending`,
  }
}

async function requestGeminiEvolutionDesign({ speciesName, recipe, donorName, typeLabel }) {
  const instruction = [
    "You are a game evolution designer.",
    "Return ONLY JSON with keys: archetype, title, promptStyle.",
    "archetype must be one of: elemental, shiny, warrior, devour, resonance.",
    "title must be short Chinese title.",
    "promptStyle must be one short English phrase for image prompt style.",
    `speciesName=${speciesName}`,
    `recipe=${recipe}`,
    `donorName=${donorName || "none"}`,
    `typeLabel=${typeLabel || "unknown"}`,
  ].join("\n")

  const response = await fetch(`${geminiApiBaseUrl}/models/${geminiTextModel}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: instruction }] }],
      generationConfig: {
        temperature: 0.5,
      },
    }),
  })

  const payload = await response.json()
  if (!response.ok) {
    const detail = payload?.error?.message || `Gemini HTTP ${response.status}`
    throw new Error(detail)
  }

  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .filter(Boolean)
      .join("\n")
      .trim() || ""

  if (!text) {
    throw new Error("Gemini returned empty text")
  }
  return text
}

function parseJsonFromText(rawText) {
  if (!rawText) {
    return null
  }

  try {
    return JSON.parse(rawText)
  } catch (error) {
    const fenced = rawText.match(/```json\s*([\s\S]*?)```/i)
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim())
      } catch (nestedError) {
        return null
      }
    }
    const objectMatch = rawText.match(/\{[\s\S]*\}/)
    if (objectMatch?.[0]) {
      try {
        return JSON.parse(objectMatch[0])
      } catch (nestedError) {
        return null
      }
    }
    return null
  }
}

function resolveRuntimeImageProviderState() {
  const availableProviders = []
  if (proxyApiKey) {
    availableProviders.push("proxy")
  }
  if (geminiApiKey) {
    availableProviders.push("gemini-official")
  }

  const primaryProvider = selectPrimaryProvider(availableProviders)
  const ready = Boolean(primaryProvider)
  const hint = ready
    ? `AI provider ready: ${primaryProvider}.`
    : "No provider key found. Set AISERVICEPROXY_API_KEY or GEMINI_API_KEY."

  return {
    ready,
    primaryProvider,
    availableProviders,
    hint,
  }
}

function selectPrimaryProvider(availableProviders) {
  if (!Array.isArray(availableProviders) || availableProviders.length === 0) {
    return null
  }
  if (runtimeImageProvider === "proxy" && availableProviders.includes("proxy")) {
    return "proxy"
  }
  if (
    runtimeImageProvider === "gemini-official" &&
    availableProviders.includes("gemini-official")
  ) {
    return "gemini-official"
  }
  return availableProviders[0]
}

function normalizeRuntimeImageProvider(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
  if (["proxy", "aiserviceproxy"].includes(normalized)) {
    return "proxy"
  }
  if (["gemini", "google", "gemini-official"].includes(normalized)) {
    return "gemini-official"
  }
  return "auto"
}

function normalizePrompt(prompt) {
  return String(prompt || "")
    .replace(/\s+/gu, " ")
    .trim()
}

function hashPrompt(prompt) {
  return crypto.createHash("sha1").update(prompt).digest("hex")
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
}

async function readRequestJson(request) {
  const chunks = []
  for await (const chunk of request) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString("utf8")
  return raw ? JSON.parse(raw) : {}
}

function absoluteAssetUrl(response, assetPath) {
  const address = server.address()
  const port = typeof address === "object" && address ? address.port : serverPort
  return `http://${host}:${port}/${assetPath.replace(/\\/g, "/")}`
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...corsHeaders(),
  })
  response.end(JSON.stringify(payload))
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode, corsHeaders())
  response.end()
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  }
  return contentTypes[ext] || "application/octet-stream"
}

// ── /api/fusion/evolve ────────────────────────────────────────────────────────

async function handleFusionEvolve(payload, response) {
  const mode = String(payload.mode || "fusion")
  const speciesId = String(payload.speciesId || "").trim()
  const speciesName = String(payload.speciesName || speciesId).trim()
  const element = String(payload.element || "").trim()
  const donorSpeciesId = String(payload.donorSpeciesId || "").trim()
  const donorName = String(payload.donorName || donorSpeciesId).trim()
  const types = Array.isArray(payload.types) ? payload.types : []
  const archetype = String(payload.archetype || "elemental")
  const customPrompt = typeof payload.customPrompt === "string" ? payload.customPrompt.trim() : ""

  if (!speciesId) {
    return { statusCode: 400, body: { error: "speciesId is required." } }
  }

  const assetSuffix = mode === "devour"
    ? `devour_${donorSpeciesId || "void"}`
    : `${element}_fusion`
  const assetId = `${speciesId}_${assetSuffix}`

  const design = await resolveEvolutionDesign({
    speciesName,
    recipe: mode === "devour" ? "devour" : element,
    donorName: donorName || "",
    typeLabel: types.join("/"),
  })

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

  // Build reference images: base monster portrait + donor portrait (devour mode)
  const referenceImages = []
  const basePortraitPath = await resolveMonsterPortraitPath(speciesId)
  if (basePortraitPath) referenceImages.push({ src: basePortraitPath })
  if (mode === "devour" && donorSpeciesId) {
    const donorPortraitPath = await resolveMonsterPortraitPath(donorSpeciesId)
    if (donorPortraitPath) referenceImages.push({ src: donorPortraitPath })
  }

  const taskResult = await enqueueGenerationTask(response, {
    type: "monster",
    assetId,
    prompt: finalPrompt,
    options: {
      archetype, mode,
      element: element || null,
      donorSpeciesId: donorSpeciesId || null,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
    },
    outputRoot: "assets",
    manifestPath: "assets.generated.js",
  })

  return {
    statusCode: taskResult.statusCode,
    body: { ok: true, task: taskResult.payload, design, referenceCount: referenceImages.length },
  }
}

async function resolveMonsterPortraitPath(speciesId) {
  if (!speciesId) return null
  const extensions = ["jpg", "jpeg", "png", "webp"]
  for (const ext of extensions) {
    const p = path.join(projectRoot, "assets", "monsters", `${speciesId}.${ext}`)
    if (await fileExists(p)) return p
  }
  return null
}

