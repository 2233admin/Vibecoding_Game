// Image generation for Cloudflare Workers
// Ported from scripts/generate-runtime-asset.mjs — no Node.js dependencies

const DEFAULT_TIMEOUT_MS = 28000 // under 30s worker wall-clock limit
const MAX_RETRIES = 2

export async function generateImage({ type, prompt, options = {}, env, origin }) {
  const finalPrompt = applyPromptDefaults(type, prompt)
  const providerChain = resolveProviderChain(env)
  if (providerChain.length === 0) {
    throw new Error("No AI provider configured. Set AISERVICEPROXY_API_KEY or GEMINI_API_KEY.")
  }

  let lastError = null
  for (const provider of providerChain) {
    const models = getModelCandidates(provider, env)
    for (const model of models) {
      try {
        const image =
          provider === "proxy"
            ? await generateViaProxy({ model, prompt: finalPrompt, options, env, origin })
            : await generateViaGemini({ model, prompt: finalPrompt, options, env, origin })
        return { provider, model, image }
      } catch (error) {
        lastError = error
        console.warn(`[image-gen] ${provider}:${model} failed: ${error.message}`)
      }
    }
  }
  throw lastError || new Error("Image generation failed with all providers.")
}

async function generateViaProxy({ model, prompt, options, env, origin }) {
  const apiKey = env.AISERVICEPROXY_API_KEY || ""
  if (!apiKey) throw new Error("AISERVICEPROXY_API_KEY is not set.")
  const baseUrl = env.AISERVICEPROXY_BASE_URL || "http://aitools.g-bits.com/aiserviceproxy"

  const inputImages = await buildProxyReferenceImages(options.referenceImages, origin)
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
  if (inputImages.length > 0) body.input_images = inputImages

  const payload = await postJsonWithRetry({
    url: `${baseUrl}/api/v1/image/generate`,
    body,
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
  })

  const image = payload?.data?.images?.[0]
  if (!image) throw new Error("AISERVICEPROXY returned no image.")
  return image
}

async function generateViaGemini({ model, prompt, options, env, origin }) {
  const apiKey = env.GEMINI_API_KEY || ""
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.")
  const baseUrl = env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
  const responseModalities = normalizeResponseModalities(options.responseModalities)
  const imageConfig = normalizeImageConfig(options.imageConfig ?? { aspectRatio: "3:4" })
  const referenceParts = await buildGeminiReferenceInlineParts(options.referenceImages, origin)

  const parts = [{ text: prompt }, ...referenceParts]
  const generationConfig = { responseModalities }
  if (imageConfig) generationConfig.imageConfig = imageConfig

  const payload = await postJsonWithRetry({
    url: `${baseUrl}/models/${model}:generateContent`,
    body: { contents: [{ role: "user", parts }], generationConfig },
    headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
  })

  const inline = extractGeminiInlineImage(payload)
  if (!inline?.data) throw new Error("Gemini returned no inline image.")
  return { b64_json: inline.data, mime_type: inline.mimeType || "" }
}

// ── Reference image helpers ────────────────────────────────────────────────

async function buildProxyReferenceImages(referenceImages, origin) {
  if (!Array.isArray(referenceImages) || referenceImages.length === 0) return []
  const results = []
  for (const ref of referenceImages.slice(0, 4)) {
    try {
      const inline = await resolveReferenceInlineData(ref, origin)
      if (inline?.data) {
        results.push(`data:${inline.mimeType || "image/jpeg"};base64,${inline.data}`)
      }
    } catch (err) {
      console.warn(`[proxy-ref] skipped reference: ${err.message}`)
    }
  }
  return results
}

async function buildGeminiReferenceInlineParts(referenceImages, origin) {
  if (!Array.isArray(referenceImages) || referenceImages.length === 0) return []
  const parts = []
  for (const ref of referenceImages.slice(0, 5)) {
    try {
      const inlineData = await resolveReferenceInlineData(ref, origin)
      if (inlineData?.data) parts.push({ inlineData })
    } catch (err) {
      console.warn(`[gemini-ref] skipped reference: ${err.message}`)
    }
  }
  return parts
}

async function resolveReferenceInlineData(reference, origin) {
  if (!reference || typeof reference !== "object") return null
  const mimeType = normalizeMimeType(reference.mimeType)
  const directData = String(reference.data || "").trim()
  if (directData) {
    const dataUriMatch = directData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (dataUriMatch) {
      return { mimeType: normalizeMimeType(dataUriMatch[1]) || mimeType || "image/png", data: dataUriMatch[2] }
    }
    return { mimeType: mimeType || "image/png", data: directData }
  }
  const src = String(reference.src || "").trim()
  if (!src) return null
  return loadReferenceImageSource(src, mimeType, origin)
}

async function loadReferenceImageSource(src, mimeType, origin) {
  // Data URI
  const dataUriMatch = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (dataUriMatch) {
    return { mimeType: normalizeMimeType(dataUriMatch[1]) || "image/png", data: dataUriMatch[2] }
  }

  // Absolute URL or relative path — fetch it
  const url = /^https?:\/\//i.test(src) ? src : new URL(src, origin).toString()
  const response = await fetchWithTimeout(url, { method: "GET", headers: { accept: "image/*" } })
  if (!response.ok) {
    throw new Error(`Reference image fetch failed: ${response.status} ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const resolvedMime = normalizeMimeType(response.headers.get("content-type")) || mimeTypeFromPath(src) || "image/png"
  return { mimeType: resolvedMime, data: uint8ToBase64(bytes) }
}

// ── Image buffer resolution ────────────────────────────────────────────────

export async function resolveImageBuffer(image) {
  if (image?.b64_json) {
    const bytes = base64ToUint8(image.b64_json)
    const extension = detectImageExtension(bytes, image.mime_type || "")
    return { bytes, extension }
  }
  if (image?.url) {
    const response = await fetchWithTimeout(image.url)
    if (!response.ok) throw new Error(`Failed to download image: ${response.status}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    const extension = detectImageExtension(bytes, response.headers.get("content-type") || "")
    return { bytes, extension }
  }
  throw new Error("Image payload does not contain b64_json or url.")
}

function detectImageExtension(bytes, contentType = "") {
  if (contentType.includes("image/png")) return "png"
  if (contentType.includes("image/jpeg")) return "jpg"
  if (contentType.includes("image/webp")) return "webp"
  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png"
  }
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg"
  // WEBP: RIFF????WEBP
  if (bytes.length >= 12) {
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
    const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
    if (riff === "RIFF" && webp === "WEBP") return "webp"
  }
  return "png"
}

// ── Provider helpers ────────────────────────────────────────────────────────

function resolveProviderChain(env) {
  const preferred = normalizeProvider(env.RUNTIME_IMAGE_PROVIDER || "proxy")
  const hasProxy = Boolean(env.AISERVICEPROXY_API_KEY)
  const hasGemini = Boolean(env.GEMINI_API_KEY)
  const providers = []
  if (preferred === "proxy") {
    if (hasProxy) providers.push("proxy")
    if (hasGemini) providers.push("gemini-official")
  } else if (preferred === "gemini-official") {
    if (hasGemini) providers.push("gemini-official")
    if (hasProxy) providers.push("proxy")
  } else {
    if (hasProxy) providers.push("proxy")
    if (hasGemini) providers.push("gemini-official")
  }
  return providers
}

function getModelCandidates(provider, env) {
  if (provider === "proxy") {
    const primary = env.AISERVICEPROXY_IMAGE_MODEL || "banana-pro"
    const fallbacks = parseCsv(env.AISERVICEPROXY_FALLBACK_IMAGE_MODELS || "gemini-3-pro")
    return unique([primary, ...fallbacks])
  }
  const primary = env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview"
  const fallbacks = parseCsv(env.GEMINI_FALLBACK_IMAGE_MODELS || "gemini-3-pro-image-preview")
  return unique([primary, ...fallbacks])
}

export function resolveProviderState(env) {
  const chain = resolveProviderChain(env)
  const ready = chain.length > 0
  return {
    ready,
    primaryProvider: chain[0] || null,
    availableProviders: chain,
    hint: ready
      ? `AI provider ready: ${chain[0]}.`
      : "No provider key found. Set AISERVICEPROXY_API_KEY or GEMINI_API_KEY.",
  }
}

function normalizeProvider(value) {
  const v = String(value || "").trim().toLowerCase()
  if (["proxy", "aiserviceproxy"].includes(v)) return "proxy"
  if (["gemini", "gemini-official", "google"].includes(v)) return "gemini-official"
  return "auto"
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

async function postJsonWithRetry({ url, body, headers }) {
  let lastError = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(body) })
      const text = await response.text()
      const payload = text ? JSON.parse(text) : {}
      if (!response.ok || payload?.error || payload?.success === false) {
        const detail = payload?.error?.message || payload?.message || `HTTP ${response.status}`
        throw new Error(detail)
      }
      return payload
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) await sleep(1500 * attempt)
    }
  }
  throw lastError || new Error("Request failed.")
}

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

// ── Util ────────────────────────────────────────────────────────────────────

function applyPromptDefaults(type, prompt) {
  if (type !== "character") return prompt
  return `${prompt}, solid white background, no transparency checkerboard, no alpha grid`
}

function normalizeResponseModalities(rawValue) {
  const candidates = Array.isArray(rawValue) ? rawValue : ["IMAGE"]
  const normalized = unique(
    candidates.map((e) => String(e || "").trim().toUpperCase()).filter((e) => e === "IMAGE" || e === "TEXT")
  )
  if (!normalized.includes("IMAGE")) normalized.push("IMAGE")
  return normalized.length > 0 ? normalized : ["IMAGE"]
}

function normalizeImageConfig(rawValue) {
  if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) return null
  const normalized = {}
  const aspectRatio = String(rawValue.aspectRatio || "").trim()
  const imageSize = String(rawValue.imageSize || "").trim()
  if (aspectRatio) normalized.aspectRatio = aspectRatio
  if (imageSize) normalized.imageSize = imageSize
  return Object.keys(normalized).length > 0 ? normalized : null
}

function extractGeminiInlineImage(payload) {
  for (const candidate of (payload?.candidates || [])) {
    const match = (candidate?.content?.parts || []).find((p) => p?.inlineData?.data)
    if (match?.inlineData?.data) return match.inlineData
  }
  return null
}

function normalizeMimeType(value) {
  const v = String(value || "").toLowerCase().split(";")[0].trim()
  if (v === "image/png") return "image/png"
  if (v === "image/jpeg" || v === "image/jpg") return "image/jpeg"
  if (v === "image/webp") return "image/webp"
  return ""
}

function mimeTypeFromPath(p) {
  const ext = p.split(".").pop().toLowerCase()
  if (ext === "png") return "image/png"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "webp") return "image/webp"
  return ""
}

function uint8ToBase64(bytes) {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToUint8(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function parseCsv(value) {
  return String(value || "").split(",").map((s) => s.trim()).filter(Boolean)
}

function unique(arr) {
  return [...new Set(arr)]
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
