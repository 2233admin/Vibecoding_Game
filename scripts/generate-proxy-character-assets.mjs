import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { generatePixelCharacterAssets } from "./generate-pixel-character-assets.mjs"
import { loadLocalEnv } from "./load-local-env.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
loadLocalEnv(projectRoot)
const artPipelineRoot = path.join(projectRoot, "art-pipeline")
const manifestPath = path.join(artPipelineRoot, "assets.generated.js")
const outputDir = path.join(artPipelineRoot, "generated", "characters")
const logDir = path.join(artPipelineRoot, "logs", "asset-generation")
const selectedKeys = new Set(process.argv.slice(2))
const runId = new Date().toISOString().replace(/[:.]/g, "-")
const logPath = path.join(logDir, `generate-proxy-character-assets-${runId}.jsonl`)

const proxyApiBaseUrl = readEnv(
  "AISERVICEPROXY_BASE_URL",
  "http://aitools.g-bits.com/aiserviceproxy"
)
const proxyApiKey = process.env.AISERVICEPROXY_API_KEY
const proxyImageModel = readEnv("AISERVICEPROXY_IMAGE_MODEL", "banana-pro")
const proxyFallbackImageModels = parseCsv(
  readEnv("AISERVICEPROXY_FALLBACK_IMAGE_MODELS", "gemini-3-pro")
)
const removeBgModel = readEnv("AISERVICEPROXY_REMOVE_BG_MODEL", "bytedance")

const geminiApiBaseUrl = readEnv("GEMINI_API_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")
const geminiApiKey = process.env.GEMINI_API_KEY
const geminiImageModel = readEnv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")
const geminiFallbackImageModels = parseCsv(
  readEnv("GEMINI_FALLBACK_IMAGE_MODELS", "gemini-3-pro-image-preview")
)
const geminiResponseModalities = parseCsv(readEnv("GEMINI_RESPONSE_MODALITIES", "Image"))

const imageProvider = normalizeImageProvider(readEnv("CHARACTER_IMAGE_PROVIDER", getDefaultImageProvider()))
const imageFallbackProvider = normalizeOptionalProvider(
  readEnv(
    "CHARACTER_IMAGE_FALLBACK_PROVIDER",
    imageProvider === "proxy" && geminiApiKey ? "gemini-official" : "none"
  )
)

const imageModel = imageProvider === "gemini-official" ? geminiImageModel : proxyImageModel
const fallbackImageModels =
  imageProvider === "gemini-official" ? geminiFallbackImageModels : proxyFallbackImageModels
const fallbackMode = readEnv("AISERVICEPROXY_FALLBACK_MODE", "pixel-svg")
const maxRetries = parsePositiveInt(process.env.AISERVICEPROXY_MAX_RETRIES, 3)
const retryBaseDelayMs = parsePositiveInt(process.env.AISERVICEPROXY_RETRY_DELAY_MS, 1500)
const requestTimeoutMs = parsePositiveInt(process.env.AISERVICEPROXY_TIMEOUT_MS, 120000)
const keepOriginalOnRemoveBgFailure = parseBoolean(
  process.env.AISERVICEPROXY_KEEP_ORIGINAL_ON_REMOVE_BG_FAILURE,
  true
)
const enableRemoveBg = parseBoolean(
  readEnv("CHARACTER_REMOVE_BG", proxyApiKey ? "true" : "false"),
  Boolean(proxyApiKey)
)

const baseCharacterJobs = [
  {
    key: "player",
    label: "Player Trainer",
    prompt:
      "original teen monster trainer, front-facing full body standing portrait, confident but warm expression, refined travel jacket, short cape accent, satchel, sporty boots, vivid cyan-gold palette, stylized anime splash art, crisp cel shading, glossy highlights, clean linework, isolated single character, exactly one character, one front view only, no duplicate figures, no turnaround sheet, no character sheet, transparent background, no scenery, no text",
  },
  {
    key: "professor",
    label: "Professor Song",
    prompt:
      "original friendly monster research professor, front-facing full body standing portrait, elegant long research coat, notebook in hand, polished scholar silhouette, cream and blue palette, stylized anime splash art, crisp cel shading, glossy highlights, clean linework, isolated single character, exactly one character, one front view only, no duplicate figures, no turnaround sheet, no character sheet, transparent background, no scenery, no text",
  },
  {
    key: "caretaker",
    label: "Caretaker Lin",
    prompt:
      "original gentle caretaker NPC, front-facing full body standing portrait, boutique town clothing, soft mint and cream palette, healer vibe, gentle smile, elegant apron details, stylized anime splash art, crisp cel shading, glossy highlights, clean linework, isolated single character, exactly one character, one front view only, no duplicate figures, no turnaround sheet, no character sheet, transparent background, no scenery, no text",
  },
  {
    key: "scout",
    label: "Route Scout Mira",
    prompt:
      "original junior route scout and rising trainer, front-facing full body standing portrait, sporty explorer outfit, warm coral and tan palette, energetic pose, confident but approachable expression, stylized anime splash art, crisp cel shading, glossy highlights, clean linework, isolated single character, exactly one character, one front view only, no duplicate figures, no turnaround sheet, no character sheet, transparent background, no scenery, no text",
  },
  {
    key: "leader",
    label: "Gym Leader Astra",
    prompt:
      "original luminous city gym leader, front-facing full body standing portrait, elegant champion outfit with rock and electric motifs, gold and ivory accents, fashion-forward silhouette, composed expression, stylized anime splash art, crisp cel shading, glossy highlights, clean linework, isolated single character, exactly one character, one front view only, no duplicate figures, no turnaround sheet, no character sheet, transparent background, no scenery, no text",
  },
  {
    key: "merchant",
    label: "Merchant Rowan",
    prompt:
      "original item shop merchant NPC, front-facing full body standing portrait, practical urban fantasy outfit, green and amber palette, belt pouches and register tablet, friendly business smile, stylized anime splash art, crisp cel shading, glossy highlights, clean linework, isolated single character, exactly one character, one front view only, no duplicate figures, no turnaround sheet, no character sheet, transparent background, no scenery, no text",
  },
  {
    key: "quartermaster",
    label: "Quartermaster Noah",
    prompt:
      "original supply officer NPC, front-facing full body standing portrait, utility vest, gloves, courier satchel, sand and blue palette, upbeat and reliable expression, stylized anime splash art, crisp cel shading, glossy highlights, clean linework, isolated single character, exactly one character, one front view only, no duplicate figures, no turnaround sheet, no character sheet, transparent background, no scenery, no text",
  },
]

const genericNpcJobs = buildGenericNpcJobs(20)
const characterJobs = [...baseCharacterJobs, ...genericNpcJobs]

main().catch(async (error) => {
  await safeWriteLog({
    event: "run_failed",
    runId,
    error: serializeError(error),
  })
  console.error(error.message || error)
  process.exit(1)
})

async function main() {
  if (imageProvider === "gemini-official" && !geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY. Set it in the environment before running this script.")
  }

  if (imageProvider === "proxy" && !proxyApiKey) {
    throw new Error(
      "Missing AISERVICEPROXY_API_KEY. Set it in the environment before running this script."
    )
  }

  const jobs =
    selectedKeys.size > 0
      ? characterJobs.filter((job) => selectedKeys.has(job.key))
      : characterJobs

  if (jobs.length === 0) {
    throw new Error("No matching character jobs found for the provided keys.")
  }

  await fs.mkdir(outputDir, { recursive: true })
  await fs.mkdir(logDir, { recursive: true })
  await fs.mkdir(path.dirname(manifestPath), { recursive: true })

  const manifest = await readGeneratedManifest()
  if (!manifest.characters) {
    manifest.characters = {}
  }

  await writeLog({
    event: "run_started",
    runId,
    imageProvider,
    imageFallbackProvider,
    imageModel,
    fallbackImageModels: buildModelCandidates(imageModel, fallbackImageModels).slice(1),
    removeBgEnabled: canUseProxyRemoveBg(),
    removeBgModel: canUseProxyRemoveBg() ? removeBgModel : null,
    fallbackMode,
    maxRetries,
    retryBaseDelayMs,
    requestTimeoutMs,
    selectedKeys: jobs.map((job) => job.key),
  })

  const results = []

  for (const job of jobs) {
    console.log(`Generating ${job.label} (${job.key}) with ${imageModel} via ${imageProvider}...`)

    try {
      const result = await generateCharacterAsset(job)
      manifest.characters[job.key] = result.relativePath
      results.push(result)
      console.log(`Saved ${result.relativePath}`)
      continue
    } catch (error) {
      await writeLog({
        event: "job_failed",
        runId,
        key: job.key,
        label: job.label,
        imageProvider,
        error: serializeError(error),
      })
    }

    const fallbackResult = await runFallback(job)
    if (!fallbackResult) {
      throw new Error(`Remote generation failed for ${job.key} and no fallback is enabled.`)
    }

    manifest.characters[job.key] = fallbackResult.relativePath
    results.push(fallbackResult)
    console.log(`Fell back to ${fallbackResult.relativePath} for ${job.key}`)
  }

  await writeGeneratedManifest(manifest)
  await writeLog({
    event: "run_completed",
    runId,
    results: results.map((result) => ({
      key: result.key,
      source: result.source,
      relativePath: result.relativePath,
      model: result.model || null,
      fallbackUsed: Boolean(result.fallbackUsed),
    })),
  })
  console.log(`Character asset generation complete. Log: ${path.relative(projectRoot, logPath)}`)
}

async function generateCharacterAsset(job) {
  const generated = await generateImage(job)
  const finalImage = await finalizeImage(job, generated)
  const { buffer, extension } = await resolveImageBuffer(finalImage, {
    jobKey: job.key,
    stage: "download",
    model: finalImage.model || generated.model || imageModel,
  })

  const relativePath = path.posix.join("art-pipeline", "generated", "characters", `${job.key}.${extension}`)
  const absolutePath = path.join(outputDir, `${job.key}.${extension}`)
  await fs.writeFile(absolutePath, buffer)
  await cleanupStaleCharacterFiles(job.key, extension)

  return {
    key: job.key,
    label: job.label,
    relativePath,
    absolutePath,
    source: finalImage._source || imageProvider,
    model: finalImage.model || generated.model || imageModel,
    fallbackUsed: false,
  }
}

async function generateImage(job) {
  const strategies = buildGenerationStrategies()
  let lastError = null

  for (const strategy of strategies) {
    for (const model of strategy.models) {
      try {
        if (strategy.provider !== imageProvider) {
          console.log(`Falling back to ${strategy.provider} for ${job.key}...`)
        } else if (model !== strategy.primaryModel) {
          console.log(`Switching ${job.key} to fallback image model ${model}...`)
        }

        const image =
          strategy.provider === "gemini-official"
            ? await generateImageWithOfficialGemini(job, model)
            : await generateImageViaProxy(job, model)

        await writeLog({
          event: "generate_completed",
          runId,
          key: job.key,
          imageProvider: strategy.provider,
          model,
          requestId: image._requestId || null,
        })

        return image
      } catch (error) {
        lastError = error
        await writeLog({
          event: "generate_model_failed",
          runId,
          key: job.key,
          imageProvider: strategy.provider,
          model,
          error: serializeError(error),
        })
      }
    }
  }

  throw lastError || new Error(`Image generation failed for ${job.key}.`)
}

async function generateImageViaProxy(job, model) {
  const payload = await postProxyJson(
    "/api/v1/image/generate",
    {
      model,
      prompt: job.prompt,
      negative_prompt:
        "photo, realistic, painterly, watercolor, smooth shading, detailed background, scenery, multiple characters, text, watermark, signature, blurry, side view, back view, weapon pose, dark background, heavy shadow",
      size: [768, 1024],
      n: 1,
      response_format: "b64_json",
      async: false,
    },
    {
      jobKey: job.key,
      stage: "generate",
      model,
    }
  )

  const image = payload.data?.images?.[0]
  if (!image) {
    throw new Error(`Image generate endpoint returned no image data for ${job.key}.`)
  }

  return {
    ...image,
    model: image.model || model,
    _source: "proxy-generate",
    _requestId: payload._requestId || null,
  }
}

async function generateImageWithOfficialGemini(job, model) {
  const payload = await postGeminiGenerateContent(
    model,
    {
      contents: [
        {
          parts: [
            {
              text: job.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: geminiResponseModalities.length > 0 ? geminiResponseModalities : ["Image"],
      },
    },
    {
      jobKey: job.key,
      stage: "generate",
      model,
    }
  )

  const inlineImage = extractGeminiInlineImage(payload)
  if (!inlineImage?.data) {
    throw new Error(`Official Gemini returned no inline image for ${job.key}.`)
  }

  return {
    b64_json: inlineImage.data,
    mime_type: inlineImage.mimeType || null,
    model,
    _source: "gemini-official-generate",
    _requestId: payload._requestId || null,
  }
}

async function finalizeImage(job, generated) {
  if (!canUseProxyRemoveBg()) {
    return generated
  }

  try {
    const payload = await postProxyJson(
      "/api/v1/image/remove-bg",
      {
        image: generated.b64_json || generated.url,
        model: removeBgModel,
        async: false,
      },
      {
        jobKey: job.key,
        stage: "remove-bg",
        model: removeBgModel,
      }
    )

    const cutout = payload.data?.images?.[0]
    if (!cutout) {
      throw new Error(`Remove background endpoint returned no image data for ${job.key}.`)
    }

    return {
      ...cutout,
      model: generated.model,
      _source: "proxy-remove-bg",
      _requestId: payload._requestId || null,
    }
  } catch (error) {
    await writeLog({
      event: "remove_bg_failed",
      runId,
      key: job.key,
      removeBgModel,
      error: serializeError(error),
    })

    if (keepOriginalOnRemoveBgFailure && (generated.b64_json || generated.url)) {
      console.log(`Remove background failed for ${job.key}; keeping the original render.`)
      return {
        ...generated,
        _source: `${generated._source || imageProvider}-original`,
      }
    }

    throw error
  }
}

async function runFallback(job) {
  if (fallbackMode !== "pixel-svg") {
    await writeLog({
      event: "fallback_skipped",
      runId,
      key: job.key,
      reason: `Unsupported fallback mode: ${fallbackMode}`,
    })
    return null
  }

  await writeLog({
    event: "fallback_started",
    runId,
    key: job.key,
    fallbackMode,
  })

  const [result] = await generatePixelCharacterAssets({
    keys: [job.key],
    updateManifest: false,
    log: (message) => console.log(message),
    outputDir,
    manifestPath,
    relativeBaseDir: "art-pipeline/generated/characters",
  })

  await cleanupStaleCharacterFiles(job.key, "svg")

  await writeLog({
    event: "fallback_completed",
    runId,
    key: job.key,
    fallbackMode,
    relativePath: result.relativePath,
  })

  return {
    ...result,
    source: "local-pixel-fallback",
    model: null,
    fallbackUsed: true,
  }
}

async function postProxyJson(endpoint, body, context = {}) {
  return postJsonWithRetries({
    endpoint,
    url: `${proxyApiBaseUrl}${endpoint}`,
    body,
    context,
    headers: {
      authorization: `Bearer ${proxyApiKey}`,
      "content-type": "application/json",
    },
  })
}

async function postGeminiGenerateContent(model, body, context = {}) {
  return postJsonWithRetries({
    endpoint: `/models/${model}:generateContent`,
    url: `${geminiApiBaseUrl}/models/${model}:generateContent`,
    body,
    context,
    headers: {
      "x-goog-api-key": geminiApiKey,
      "content-type": "application/json",
    },
  })
}

async function postJsonWithRetries({ endpoint, url, body, context = {}, headers }) {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const startedAt = Date.now()

    await writeLog({
      event: "request_started",
      runId,
      endpoint,
      url,
      attempt,
      imageProvider,
      jobKey: context.jobKey || null,
      stage: context.stage || null,
      model: context.model || body.model || null,
      request: summarizeRequestBody(body),
    })

    let response
    let raw = ""
    let payload = null

    try {
      response = await fetchWithTimeout(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
      raw = await response.text()
      payload = raw ? JSON.parse(raw) : null
    } catch (error) {
      const transportError = normalizeTransportError(error, endpoint, raw)
      await writeLog({
        event: "request_failed",
        runId,
        endpoint,
        url,
        attempt,
        imageProvider,
        jobKey: context.jobKey || null,
        stage: context.stage || null,
        model: context.model || body.model || null,
        latencyMs: Date.now() - startedAt,
        error: serializeError(transportError),
      })

      if (attempt < maxRetries && isRetryableError(transportError)) {
        await scheduleRetry(endpoint, url, attempt, context, transportError)
        continue
      }

      throw transportError
    }

    const requestId =
      response.headers.get("x-request-id") ||
      response.headers.get("x-goog-request-id") ||
      payload?.metadata?.request_id ||
      payload?.responseId ||
      null

    if (!response.ok || hasErrorPayload(payload)) {
      const requestError = buildRequestError(endpoint, response, payload, requestId, raw)
      await writeLog({
        event: "request_failed",
        runId,
        endpoint,
        url,
        attempt,
        imageProvider,
        jobKey: context.jobKey || null,
        stage: context.stage || null,
        model: context.model || body.model || null,
        requestId,
        latencyMs: Date.now() - startedAt,
        providerLatencyMs: payload?.metadata?.latency_ms || null,
        error: serializeError(requestError),
      })

      if (attempt < maxRetries && isRetryableError(requestError)) {
        await scheduleRetry(endpoint, url, attempt, context, requestError, requestId)
        continue
      }

      throw requestError
    }

    const enrichedPayload =
      payload && typeof payload === "object"
        ? {
            ...payload,
            _requestId: requestId,
          }
        : payload

    await writeLog({
      event: "request_succeeded",
      runId,
      endpoint,
      url,
      attempt,
      imageProvider,
      jobKey: context.jobKey || null,
      stage: context.stage || null,
      model: context.model || body.model || null,
      requestId,
      latencyMs: Date.now() - startedAt,
      providerLatencyMs: payload?.metadata?.latency_ms || null,
      response: summarizeSuccessPayload(enrichedPayload),
    })

    return enrichedPayload
  }

  throw new Error(`Request failed for ${endpoint} after ${maxRetries} attempts.`)
}

async function scheduleRetry(endpoint, url, attempt, context, error, requestId = null) {
  const delayMs = retryBaseDelayMs * 2 ** (attempt - 1)
  await writeLog({
    event: "request_retry_scheduled",
    runId,
    endpoint,
    url,
    attempt,
    nextAttempt: attempt + 1,
    delayMs,
    imageProvider,
    jobKey: context.jobKey || null,
    stage: context.stage || null,
    model: context.model || null,
    requestId,
    error: serializeError(error),
  })
  await sleep(delayMs)
}

async function resolveImageBuffer(image, context = {}) {
  if (image.b64_json) {
    const buffer = Buffer.from(image.b64_json, "base64")
    const extension = detectImageExtension(buffer, image.mime_type || "")
    await writeLog({
      event: "image_buffer_ready",
      runId,
      jobKey: context.jobKey || null,
      stage: context.stage || null,
      model: context.model || null,
      source: "b64_json",
      bytes: buffer.byteLength,
      extension,
    })
    return { buffer, extension }
  }

  if (image.url) {
    const response = await fetchWithTimeout(image.url)
    if (!response.ok) {
      throw new Error(
        `Failed to download generated image: ${response.status} ${response.statusText}`
      )
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const extension = detectImageExtension(buffer, response.headers.get("content-type"))
    await writeLog({
      event: "image_buffer_ready",
      runId,
      jobKey: context.jobKey || null,
      stage: context.stage || null,
      model: context.model || null,
      source: "url",
      bytes: buffer.byteLength,
      extension,
    })
    return { buffer, extension }
  }

  throw new Error("Image payload did not contain b64_json or url.")
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

function canUseProxyRemoveBg() {
  return Boolean(proxyApiKey) && enableRemoveBg && removeBgModel !== "none"
}

function extractGeminiInlineImage(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : []

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
    const imagePart = parts.find((part) => part?.inlineData?.data)
    if (imagePart?.inlineData?.data) {
      return imagePart.inlineData
    }
  }

  return null
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
  if (contentType.includes("image/svg+xml")) {
    return "svg"
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
  if (buffer.subarray(0, 5).toString("utf8").toLowerCase() === "<?xml") {
    return "svg"
  }

  return "png"
}

async function cleanupStaleCharacterFiles(key, keepExtension) {
  const extensions = ["png", "jpg", "jpeg", "webp", "svg"]
  await Promise.all(
    extensions
      .filter((extension) => extension !== keepExtension)
      .map((extension) =>
        fs.rm(path.join(outputDir, `${key}.${extension}`), {
          force: true,
        })
      )
  )
}

function buildModelCandidates(primaryModel, extraModels) {
  return [primaryModel, ...extraModels].filter(
    (value, index, array) => value && array.indexOf(value) === index
  )
}

function buildGenerationStrategies() {
  const strategies = []

  const primaryModels = getProviderModelCandidates(imageProvider)
  if (primaryModels.length > 0) {
    strategies.push({
      provider: imageProvider,
      primaryModel: primaryModels[0],
      models: primaryModels,
    })
  }

  if (imageFallbackProvider && imageFallbackProvider !== imageProvider) {
    const fallbackModels = getProviderModelCandidates(imageFallbackProvider)
    if (fallbackModels.length > 0) {
      strategies.push({
        provider: imageFallbackProvider,
        primaryModel: fallbackModels[0],
        models: fallbackModels,
      })
    }
  }

  return strategies
}

function getProviderModelCandidates(provider) {
  if (provider === "gemini-official") {
    return buildModelCandidates(geminiImageModel, geminiFallbackImageModels)
  }

  if (provider === "proxy") {
    return buildModelCandidates(proxyImageModel, proxyFallbackImageModels)
  }

  return []
}

function hasErrorPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return false
  }

  if (payload.success === false) {
    return true
  }

  return Boolean(payload.error)
}

function buildRequestError(endpoint, response, payload, requestId, raw) {
  const detail = payload?.error?.details || payload?.error?.detail || payload?.details || null
  const message =
    payload?.error?.message ||
    payload?.message ||
    (typeof detail === "string" ? detail : null) ||
    response.statusText ||
    `HTTP ${response.status}`

  const error = new Error(`Request failed for ${endpoint}: ${message}`)
  error.name = "ApiRequestError"
  error.status = response.status
  error.code = payload?.error?.code || payload?.error?.status || payload?.status || null
  error.requestId = requestId
  error.detail = detail
  error.rawSnippet = truncateText(raw, 300)
  return error
}

function normalizeTransportError(error, endpoint, raw = "") {
  if (error instanceof SyntaxError) {
    const wrapped = new Error(
      raw
        ? `Invalid JSON from ${endpoint}: ${truncateText(raw, 300)}`
        : `Invalid JSON from ${endpoint}: ${error.message}`
    )
    wrapped.name = "ApiParseError"
    wrapped.code = "INVALID_JSON"
    wrapped.cause = error
    return wrapped
  }

  if (error?.name === "AbortError") {
    const wrapped = new Error(`Request timed out for ${endpoint} after ${requestTimeoutMs}ms`)
    wrapped.name = "ApiTimeoutError"
    wrapped.code = "REQUEST_TIMEOUT"
    wrapped.cause = error
    return wrapped
  }

  return error instanceof Error ? error : new Error(String(error))
}

function isRetryableError(error) {
  if (!error) {
    return false
  }

  if (error.name === "ApiTimeoutError") {
    return true
  }

  if (error.status == null) {
    return true
  }

  if (error.status === 408 || error.status === 425 || error.status === 429) {
    return true
  }

  if (error.status >= 500) {
    return true
  }

  return ["INTERNAL_ERROR", "REQUEST_TIMEOUT", "RATE_LIMITED", "UNAVAILABLE"].includes(error.code)
}

function summarizeRequestBody(body) {
  const summary = { ...body }

  if (typeof summary.prompt === "string") {
    summary.prompt = truncateText(summary.prompt, 160)
    summary.prompt_length = body.prompt.length
  }

  if (typeof summary.negative_prompt === "string") {
    summary.negative_prompt = truncateText(summary.negative_prompt, 160)
    summary.negative_prompt_length = body.negative_prompt.length
  }

  if (Array.isArray(summary.contents)) {
    summary.contents = summary.contents.map((content) => ({
      parts: Array.isArray(content?.parts)
        ? content.parts.map((part) => {
            if (typeof part?.text === "string") {
              return {
                text: truncateText(part.text, 160),
                text_length: part.text.length,
              }
            }
            if (part?.inlineData?.data) {
              return {
                inlineData: {
                  mimeType: part.inlineData.mimeType || null,
                  data: summarizeBinaryField(part.inlineData.data),
                },
              }
            }
            return "[part]"
          })
        : [],
    }))
  }

  if (summary.image) {
    summary.image = summarizeBinaryField(summary.image)
  }

  if (summary.mask) {
    summary.mask = summarizeBinaryField(summary.mask)
  }

  if (Array.isArray(summary.input_images)) {
    summary.input_images = summary.input_images.map((value) => summarizeBinaryField(value))
  }

  return summary
}

function summarizeSuccessPayload(payload) {
  if (Array.isArray(payload?.data?.images)) {
    return {
      imageCount: payload.data.images.length,
      requestId: payload?._requestId || payload?.metadata?.request_id || null,
      providerLatencyMs: payload?.metadata?.latency_ms || null,
      timestamp: payload?.metadata?.timestamp || null,
    }
  }

  if (Array.isArray(payload?.candidates)) {
    return {
      candidateCount: payload.candidates.length,
      inlineImageCount: payload.candidates.reduce((count, candidate) => {
        const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
        return count + parts.filter((part) => part?.inlineData?.data).length
      }, 0),
      requestId: payload?._requestId || payload?.responseId || null,
    }
  }

  return {}
}

function summarizeBinaryField(value) {
  if (typeof value !== "string") {
    return `[${typeof value}]`
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return truncateText(value, 120)
  }

  return `[inline-data:${value.length} chars]`
}

function serializeError(error) {
  if (!error) {
    return null
  }

  return {
    name: error.name || "Error",
    message: error.message || String(error),
    code: error.code || null,
    status: error.status || null,
    requestId: error.requestId || null,
    detail: error.detail || null,
    rawSnippet: error.rawSnippet || null,
  }
}

function truncateText(value, limit) {
  if (typeof value !== "string" || value.length <= limit) {
    return value
  }

  return `${value.slice(0, limit)}...`
}

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function buildGenericNpcJobs(count) {
  const archetypes = [
    { role: "street guide", outfit: "layered city guide uniform", palette: "cobalt and silver", mood: "welcoming and confident" },
    { role: "cafe host", outfit: "apron and tailored vest", palette: "cream and teal", mood: "friendly and energetic" },
    { role: "bookshop clerk", outfit: "soft cardigan and satchel", palette: "moss and ivory", mood: "calm and thoughtful" },
    { role: "metro officer", outfit: "modern transit jacket", palette: "navy and amber", mood: "alert and reliable" },
    { role: "festival volunteer", outfit: "light summer layers", palette: "coral and sky blue", mood: "cheerful and lively" },
    { role: "workshop mechanic", outfit: "utility overalls and gloves", palette: "slate and orange", mood: "focused and upbeat" },
    { role: "courier rider", outfit: "windbreaker and cargo pack", palette: "indigo and lime", mood: "fast and determined" },
    { role: "park ranger", outfit: "practical explorer uniform", palette: "forest green and khaki", mood: "steady and kind" },
    { role: "music teacher", outfit: "refined casual coat", palette: "violet gray and cream", mood: "elegant and patient" },
    { role: "lab assistant", outfit: "short research coat", palette: "white and aqua", mood: "curious and bright" },
  ]

  return Array.from({ length: count }, (_, index) => {
    const archetype = archetypes[index % archetypes.length]
    const key = `npc_generic_${String(index + 1).padStart(2, "0")}`
    return {
      key,
      label: `Generic NPC ${String(index + 1).padStart(2, "0")}`,
      prompt: [
        `original ${archetype.role} NPC`,
        "front-facing full body standing portrait",
        archetype.outfit,
        `${archetype.palette} palette`,
        `${archetype.mood} expression`,
        "stylized anime splash art",
        "crisp cel shading",
        "glossy highlights",
        "clean linework",
        "isolated single character",
        "exactly one character",
        "one front view only",
        "no duplicate figures",
        "no turnaround sheet",
        "no character sheet",
        "transparent background",
        "no scenery",
        "no text",
      ].join(", "),
    }
  })
}

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(value || "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue
}

function parseBoolean(value, fallbackValue) {
  if (value == null) {
    return fallbackValue
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase())
}

function readEnv(name, fallbackValue) {
  return Object.prototype.hasOwnProperty.call(process.env, name) ? process.env[name] : fallbackValue
}

function normalizeImageProvider(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()

  if (["gemini", "google", "gemini-official", "official-gemini"].includes(normalized)) {
    return "gemini-official"
  }

  return "proxy"
}

function normalizeOptionalProvider(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()

  if (!normalized || normalized === "none" || normalized === "off") {
    return null
  }

  return normalizeImageProvider(normalized)
}

function getDefaultImageProvider() {
  if (proxyApiKey) {
    return "proxy"
  }

  if (geminiApiKey) {
    return "gemini-official"
  }

  return "proxy"
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function safeWriteLog(entry) {
  try {
    await writeLog(entry)
  } catch (error) {
    console.error("Failed to write log entry.", error.message || error)
  }
}

async function writeLog(entry) {
  await fs.mkdir(logDir, { recursive: true })
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  })
  await fs.appendFile(logPath, `${line}\n`, "utf8")
}

async function readGeneratedManifest() {
  try {
    const raw = await fs.readFile(manifestPath, "utf8")
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

async function writeGeneratedManifest(manifest) {
  const content = `window.GBIT_ASSETS_GENERATED = ${JSON.stringify(manifest, null, 2)}\n`
  await fs.mkdir(path.dirname(manifestPath), { recursive: true })
  await fs.writeFile(manifestPath, content, "utf8")
}
