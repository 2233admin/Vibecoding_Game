import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadLocalEnv } from "./load-local-env.mjs"
import { resolveCharacterAssetDir } from "./character-asset-paths.mjs"
import { resolveMonsterAssetRelativePath } from "./monster-asset-paths.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
loadLocalEnv(projectRoot)
const defaultManifestPath = path.join(projectRoot, "assets.generated.js")
const allowedTypes = new Set(["monster", "character"])

const proxyApiBaseUrl = process.env.AISERVICEPROXY_BASE_URL || "http://aitools.g-bits.com/aiserviceproxy"
const proxyApiKey = process.env.AISERVICEPROXY_API_KEY || ""
const proxyImageModel = process.env.AISERVICEPROXY_IMAGE_MODEL || "banana-pro"
const proxyFallbackImageModels = parseCsv(process.env.AISERVICEPROXY_FALLBACK_IMAGE_MODELS || "gemini-3-pro")

const geminiApiBaseUrl =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
const geminiApiKey = process.env.GEMINI_API_KEY || ""
const geminiImageModel = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview"
const geminiFallbackImageModels = parseCsv(
  process.env.GEMINI_FALLBACK_IMAGE_MODELS || "gemini-3-pro-image-preview"
)
const geminiResponseModalities = parseCsv(process.env.GEMINI_RESPONSE_MODALITIES || "Image")

const preferredProvider = normalizeProvider(process.env.RUNTIME_IMAGE_PROVIDER || "proxy")
const requestTimeoutMs = parsePositiveInt(process.env.RUNTIME_IMAGE_TIMEOUT_MS, 120000)
const maxRetries = parsePositiveInt(process.env.RUNTIME_IMAGE_MAX_RETRIES, 2)
const retryDelayMs = parsePositiveInt(process.env.RUNTIME_IMAGE_RETRY_DELAY_MS, 1500)

main().catch((error) => {
  if (process.argv.includes("--json")) {
    console.log(
      `__GBIT_RESULT__ ${JSON.stringify({
        ok: false,
        error: error.message,
      })}`
    )
  }
  console.error(error.message || error)
  process.exit(1)
})

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const type = args.type || "character"
  ensureType(type)

  const assetId = String(args.id || "").trim()
  if (!assetId) {
    throw new Error("Missing required --id.")
  }

  const prompt = String(args.prompt || "").trim()
  if (!prompt) {
    throw new Error("Missing required --prompt.")
  }

  const outputRoot = normalizeOutputRoot(args["output-root"] || "assets")
  const manifestPath = resolveManifestPath(args.manifest)
  const runtimeOptions = parseOptionsJson(args["options-json"])
  const output = resolveOutput(type, assetId, outputRoot)

  const providerChain = resolveProviderChain()
  if (providerChain.length === 0) {
    throw new Error(
      "No available image provider. Set AISERVICEPROXY_API_KEY or GEMINI_API_KEY first."
    )
  }

  const generated = await generateWithFallback({
    providerChain,
    type,
    assetId,
    prompt: applyPromptDefaults(type, prompt),
    options: runtimeOptions,
  })
  const { buffer, extension } = await resolveImageBuffer(generated.image)

  const finalOutput = {
    ...output,
    absolutePath: path.join(output.absoluteDir, `${assetId}.${extension}`),
    browserPath: path.posix.join(output.browserDir, `${assetId}.${extension}`),
    extension,
  }

  await fs.mkdir(finalOutput.absoluteDir, { recursive: true })
  await fs.writeFile(finalOutput.absolutePath, buffer)
  await cleanupStaleFiles(finalOutput.absoluteDir, assetId, extension)
  await upsertGeneratedAsset(manifestPath, finalOutput.group, assetId, finalOutput.browserPath)

  const result = {
    ok: true,
    type,
    id: assetId,
    provider: generated.provider,
    model: generated.model,
    absolutePath: finalOutput.absolutePath,
    browserPath: finalOutput.browserPath,
    group: finalOutput.group,
    key: assetId,
    prompt,
    referenceCount: Array.isArray(runtimeOptions.referenceImages)
      ? runtimeOptions.referenceImages.length
      : 0,
  }

  console.log(`Saved image to ${path.relative(projectRoot, finalOutput.absolutePath)}`)
  if (args.json) {
    console.log(`__GBIT_RESULT__ ${JSON.stringify(result)}`)
  }
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith("--")) {
      continue
    }
    const key = token.slice(2)
    if (key === "help" || key === "json") {
      args[key] = true
      continue
    }
    const next = argv[index + 1]
    if (next == null || next.startsWith("--")) {
      throw new Error(`Flag --${key} requires a value.`)
    }
    args[key] = next
    index += 1
  }
  return args
}

function printHelp() {
  console.log(`Usage:
node scripts/generate-runtime-asset.mjs --type character --id player --prompt "..."
Options:
  --type        monster | character
  --id          asset id
  --prompt      generation prompt
  --output-root assets | art-pipeline/generated (default assets)
  --manifest    generated manifest path (default assets.generated.js)
  --options-json runtime generation options JSON
  --json        print machine-readable result
  --help        show help`)
}

function ensureType(type) {
  if (!allowedTypes.has(type)) {
    throw new Error(`Unsupported --type "${type}". Expected: monster or character.`)
  }
}

function normalizeOutputRoot(value) {
  return String(value || "assets").replace(/\\/g, "/").replace(/\/+$/g, "")
}

function resolveManifestPath(manifestPathArg) {
  if (!manifestPathArg) {
    return defaultManifestPath
  }
  return path.resolve(projectRoot, manifestPathArg.replace(/\\/g, "/"))
}

function resolveOutput(type, assetId, outputRoot) {
  const relativeFilePath =
    type === "character"
      ? path.posix.join(outputRoot, "characters", resolveCharacterAssetDir(assetId), `${assetId}.png`)
      : resolveMonsterAssetRelativePath(assetId, ".png").replace(/^assets\//, `${outputRoot}/`)
  const browserDir = path.posix.dirname(relativeFilePath)
  const absoluteDir = path.resolve(projectRoot, browserDir)
  return {
    group: type === "character" ? "characters" : "monsters",
    browserDir,
    absoluteDir,
    key: assetId,
  }
}

function normalizeProvider(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
  if (["proxy", "aiserviceproxy"].includes(normalized)) {
    return "proxy"
  }
  if (["gemini", "gemini-official", "google"].includes(normalized)) {
    return "gemini-official"
  }
  return "auto"
}

function resolveProviderChain() {
  const providers = []
  const proxyAvailable = Boolean(proxyApiKey)
  const geminiAvailable = Boolean(geminiApiKey)

  if (preferredProvider === "proxy") {
    if (proxyAvailable) {
      providers.push("proxy")
    }
    if (geminiAvailable) {
      providers.push("gemini-official")
    }
    return providers
  }

  if (preferredProvider === "gemini-official") {
    if (geminiAvailable) {
      providers.push("gemini-official")
    }
    if (proxyAvailable) {
      providers.push("proxy")
    }
    return providers
  }

  if (proxyAvailable) {
    providers.push("proxy")
  }
  if (geminiAvailable) {
    providers.push("gemini-official")
  }
  return providers
}

function getModelCandidates(provider) {
  if (provider === "proxy") {
    return unique([proxyImageModel, ...proxyFallbackImageModels])
  }
  return unique([geminiImageModel, ...geminiFallbackImageModels])
}

async function generateWithFallback({ providerChain, type, assetId, prompt, options = {} }) {
  let lastError = null
  for (const provider of providerChain) {
    const models = getModelCandidates(provider)
    for (const model of models) {
      try {
        const image =
          provider === "proxy"
            ? await generateViaProxy({
                model,
                prompt,
                options,
              })
            : await generateViaGemini({
                model,
                prompt,
                options,
              })
        return {
          provider,
          model,
          image,
        }
      } catch (error) {
        lastError = error
        console.warn(
          `[runtime-image] ${provider}:${model} failed for ${type}:${assetId} -> ${error.message || error}`
        )
      }
    }
  }
  throw lastError || new Error("Image generation failed with all providers.")
}

async function generateViaProxy({ model, prompt, options = {} }) {
  if (!proxyApiKey) {
    throw new Error("AISERVICEPROXY_API_KEY is not set.")
  }

  // Build input_images from referenceImages option (base64 data URIs or local paths)
  const inputImages = await buildProxyReferenceImages(options.referenceImages)

  const body = {
    model,
    prompt,
    negative_prompt:
      "photo, realistic, watercolor, detailed scenery, multiple characters, text, watermark, signature, blurry",
    size: [768, 1024],
    n: 1,
    response_format: "b64_json",
    async: false,
  }

  if (inputImages.length > 0) {
    body.input_images = inputImages
  }

  const payload = await postJsonWithRetry({
    url: `${proxyApiBaseUrl}/api/v1/image/generate`,
    body,
    headers: {
      authorization: `Bearer ${proxyApiKey}`,
      "content-type": "application/json",
    },
  })

  const image = payload?.data?.images?.[0]
  if (!image) {
    throw new Error("AISERVICEPROXY returned no image.")
  }
  return image
}

async function buildProxyReferenceImages(referenceImages) {
  if (!Array.isArray(referenceImages) || referenceImages.length === 0) return []
  const results = []
  for (const ref of referenceImages.slice(0, 4)) {
    try {
      const inline = await resolveReferenceInlineData(ref)
      if (inline?.data) {
        results.push(`data:${inline.mimeType || "image/jpeg"};base64,${inline.data}`)
      }
    } catch (err) {
      console.warn(`[proxy-ref] skipped reference: ${err.message}`)
    }
  }
  return results
}

async function generateViaGemini({ model, prompt, options = {} }) {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set.")
  }

  const referenceParts = await buildReferenceInlineParts(options.referenceImages)
  const responseModalities = normalizeResponseModalities(options.responseModalities)
  const imageConfig = normalizeImageConfig(options.imageConfig ?? { aspectRatio: "3:4" })

  const parts = [{ text: prompt }, ...referenceParts]
  const generationConfig = {
    responseModalities,
  }
  if (imageConfig) {
    generationConfig.imageConfig = imageConfig
  }

  const payload = await postJsonWithRetry({
    url: `${geminiApiBaseUrl}/models/${model}:generateContent`,
    body: {
      contents: [{ role: "user", parts }],
      generationConfig,
    },
    headers: {
      "x-goog-api-key": geminiApiKey,
      "content-type": "application/json",
    },
  })

  const inline = extractGeminiInlineImage(payload)
  if (!inline?.data) {
    throw new Error("Gemini returned no inline image.")
  }
  return {
    b64_json: inline.data,
    mime_type: inline.mimeType || "",
  }
}

async function postJsonWithRetry({ url, body, headers }) {
  let lastError = null
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
      const text = await response.text()
      const payload = text ? JSON.parse(text) : {}

      if (!response.ok || payload?.error || payload?.success === false) {
        const detail =
          payload?.error?.message ||
          payload?.message ||
          payload?.error?.detail ||
          `HTTP ${response.status}`
        throw new Error(detail)
      }
      return payload
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt)
        continue
      }
    }
  }
  throw lastError || new Error("Request failed.")
}

function extractGeminiInlineImage(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : []
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
    const match = parts.find((part) => part?.inlineData?.data)
    if (match?.inlineData?.data) {
      return match.inlineData
    }
  }
  return null
}

async function resolveImageBuffer(image) {
  if (image?.b64_json) {
    const buffer = Buffer.from(image.b64_json, "base64")
    const extension = detectImageExtension(buffer, image.mime_type || "")
    return { buffer, extension }
  }

  if (image?.url) {
    const response = await fetchWithTimeout(image.url)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    const extension = detectImageExtension(buffer, response.headers.get("content-type") || "")
    return { buffer, extension }
  }

  throw new Error("Image payload does not contain b64_json or url.")
}

function detectImageExtension(buffer, contentType = "") {
  if (contentType.includes("image/png")) {
    return "png"
  }
  if (contentType.includes("image/jpeg")) {
    return "jpg"
  }
  if (contentType.includes("image/webp")) {
    return "webp"
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return "png"
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg"
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp"
  }
  return "png"
}

async function cleanupStaleFiles(outputDir, assetId, keepExt) {
  const extensions = ["png", "jpg", "jpeg", "webp", "svg"]
  await Promise.all(
    extensions
      .filter((ext) => ext !== keepExt)
      .map((ext) =>
        fs.rm(path.join(outputDir, `${assetId}.${ext}`), {
          force: true,
        })
      )
  )
}

async function upsertGeneratedAsset(generatedManifestPath, group, key, browserPath) {
  const manifest = await readGeneratedManifest(generatedManifestPath)
  if (!manifest[group]) {
    manifest[group] = {}
  }
  manifest[group][key] = browserPath

  const fileBody = `window.GBIT_ASSETS_GENERATED = ${JSON.stringify(manifest, null, 2)}\n`
  await fs.mkdir(path.dirname(generatedManifestPath), { recursive: true })
  await fs.writeFile(generatedManifestPath, fileBody, "utf8")
}

async function readGeneratedManifest(generatedManifestPath) {
  try {
    const raw = await fs.readFile(generatedManifestPath, "utf8")
    const prefix = "window.GBIT_ASSETS_GENERATED = "
    if (!raw.startsWith(prefix)) {
      throw new Error("Unexpected generated manifest format.")
    }
    return JSON.parse(raw.slice(prefix.length))
  } catch (error) {
    return {
      scene: {},
      tiles: {},
      characters: {},
      monsters: {},
    }
  }
}

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function applyPromptDefaults(type, prompt) {
  if (type !== "character") {
    return prompt
  }
  const whiteBgHints = [
    "solid white background",
    "no transparency checkerboard",
    "no alpha grid",
  ]
  return `${prompt}, ${whiteBgHints.join(", ")}`
}

function parseOptionsJson(rawValue) {
  if (!rawValue) {
    return {}
  }
  try {
    const parsed = JSON.parse(rawValue)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("options-json must be an object.")
    }
    return parsed
  } catch (error) {
    throw new Error(`Invalid --options-json: ${error.message || "JSON parse failed"}`)
  }
}

function normalizeResponseModalities(rawValue) {
  const candidates = Array.isArray(rawValue)
    ? rawValue
    : typeof rawValue === "string"
      ? parseCsv(rawValue)
      : geminiResponseModalities

  const normalized = unique(
    candidates
      .map((entry) => String(entry || "").trim().toUpperCase())
      .filter((entry) => entry === "IMAGE" || entry === "TEXT")
  )

  if (normalized.length === 0) {
    return ["IMAGE"]
  }
  if (!normalized.includes("IMAGE")) {
    normalized.push("IMAGE")
  }
  return normalized
}

function normalizeImageConfig(rawValue) {
  if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) {
    return null
  }
  const aspectRatio = String(rawValue.aspectRatio || "").trim()
  const imageSize = String(rawValue.imageSize || "").trim()
  const normalized = {}
  if (aspectRatio) {
    normalized.aspectRatio = aspectRatio
  }
  if (imageSize) {
    normalized.imageSize = imageSize
  }
  return Object.keys(normalized).length > 0 ? normalized : null
}

async function buildReferenceInlineParts(referenceImages) {
  if (!Array.isArray(referenceImages) || referenceImages.length === 0) {
    return []
  }

  const parts = []
  const cappedRefs = referenceImages.slice(0, 5)
  for (const reference of cappedRefs) {
    const inlineData = await resolveReferenceInlineData(reference)
    if (inlineData?.data) {
      parts.push({ inlineData })
    }
  }
  return parts
}

async function resolveReferenceInlineData(reference) {
  if (!reference || typeof reference !== "object") {
    return null
  }

  const mimeType = normalizeMimeType(reference.mimeType)
  const directData = String(reference.data || "").trim()
  if (directData) {
    const dataUriMatch = directData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (dataUriMatch) {
      return {
        mimeType: normalizeMimeType(dataUriMatch[1]) || mimeType || "image/png",
        data: dataUriMatch[2],
      }
    }
    return {
      mimeType: mimeType || "image/png",
      data: directData,
    }
  }

  const src = String(reference.src || "").trim()
  if (!src) {
    return null
  }

  const resolved = await loadReferenceImageSource(src)
  return {
    mimeType: mimeType || resolved.mimeType || "image/png",
    data: resolved.data,
  }
}

async function loadReferenceImageSource(src) {
  const dataUriMatch = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (dataUriMatch) {
    return {
      mimeType: normalizeMimeType(dataUriMatch[1]) || "image/png",
      data: dataUriMatch[2],
    }
  }

  if (/^https?:\/\//i.test(src)) {
    const response = await fetchWithTimeout(src, {
      method: "GET",
      headers: {
        accept: "image/*",
      },
    })
    if (!response.ok) {
      throw new Error(`Reference image download failed: ${response.status} ${response.statusText}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      mimeType: normalizeMimeType(response.headers.get("content-type")) || "image/png",
      data: buffer.toString("base64"),
    }
  }

  const localPath = resolveReferenceLocalPath(src)
  const buffer = await fs.readFile(localPath)
  return {
    mimeType: mimeTypeFromPath(localPath) || "image/png",
    data: buffer.toString("base64"),
  }
}

function resolveReferenceLocalPath(src) {
  const withoutQuery = String(src || "")
    .split("#")[0]
    .split("?")[0]
    .trim()

  if (!withoutQuery) {
    throw new Error("Reference image source is empty.")
  }

  if (path.isAbsolute(withoutQuery)) {
    return withoutQuery
  }

  const relativePath = withoutQuery.replace(/^\/+/, "").replace(/\//g, path.sep)
  const absolutePath = path.resolve(projectRoot, relativePath)
  if (!absolutePath.startsWith(projectRoot)) {
    throw new Error(`Reference image path is outside project: ${src}`)
  }
  return absolutePath
}

function normalizeMimeType(value) {
  const mimeType = String(value || "")
    .split(";")[0]
    .trim()
    .toLowerCase()
  return mimeType.startsWith("image/") ? mimeType : ""
}

function mimeTypeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".png") {
    return "image/png"
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg"
  }
  if (ext === ".webp") {
    return "image/webp"
  }
  if (ext === ".gif") {
    return "image/gif"
  }
  return ""
}

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(value || "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue
}

function unique(values) {
  return values.filter((value, index, array) => value && array.indexOf(value) === index)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
