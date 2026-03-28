import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"
import { getPreset, listPresetIds, typePromptSuffix } from "./comfy-presets.mjs"
import { resolveCharacterAssetDir } from "./character-asset-paths.mjs"
import { resolveMonsterAssetRelativePath } from "./monster-asset-paths.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const configPath = path.join(projectRoot, "comfyui.config.json")
const defaultGeneratedManifestPath = path.join(projectRoot, "assets.generated.js")
const allowedTypes = new Set(["monster", "character", "scene", "tile"])

main().catch((error) => {
  if (process.argv.includes("--json")) {
    console.log(
      `__GBIT_RESULT__ ${JSON.stringify({
        ok: false,
        error: error.message,
      })}`
    )
  }
  console.error(error.message)
  process.exit(1)
})

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  if (args.list) {
    const type = args.type || "monster"
    ensureType(type)
    console.log(`${type} presets:`)
    for (const id of listPresetIds(type)) {
      console.log(`- ${id}`)
    }
    return
  }

  const type = args.type || "monster"
  ensureType(type)

  if (!args.id) {
    throw new Error("Missing required --id. Use --list to inspect available presets.")
  }

  const config = await readJson(configPath)
  const preset = getPreset(type, args.id)
  const generatedManifestPath = resolveManifestPath(args.manifest)
  const outputRoot = (args["output-root"] || "assets").replace(/\\/g, "/").replace(/\/+$/g, "") || "assets"

  const finalConfig = buildRenderConfig({
    args,
    config,
    preset,
    type,
  })

  await ensureComfyConnection(finalConfig.baseUrl)

  const checkpointName = await resolveCheckpointName(finalConfig)
  const prompt = buildPrompt(type, preset, args.prompt)
  const negativePrompt = buildNegativePrompt(config, preset, args.negative)
  const output = resolveOutput(type, args.id, args.output, outputRoot)

  console.log(`Submitting ${type}:${args.id}`)
  console.log(`Checkpoint: ${checkpointName}`)
  console.log(`Output: ${path.relative(projectRoot, output.absolutePath)}`)

  const workflow = createWorkflow({
    checkpointName,
    prompt,
    negativePrompt,
    width: finalConfig.width,
    height: finalConfig.height,
    steps: finalConfig.steps,
    cfg: finalConfig.cfg,
    sampler: finalConfig.sampler,
    scheduler: finalConfig.scheduler,
    seed: finalConfig.seed,
    filenamePrefix: `GBIT/${type}/${args.id}`,
  })

  const promptId = await queuePrompt(finalConfig.baseUrl, workflow)
  const imageInfo = await waitForImage(finalConfig.baseUrl, promptId, {
    timeoutMs: config.timeoutMs || 300000,
    pollIntervalMs: config.pollIntervalMs || 1500,
  })
  const imageBuffer = await downloadImage(finalConfig.baseUrl, imageInfo)

  await fs.mkdir(path.dirname(output.absolutePath), { recursive: true })
  await fs.writeFile(output.absolutePath, imageBuffer)
  await upsertGeneratedAsset(generatedManifestPath, output.group, output.key, output.browserPath)

  console.log("Done.")
  console.log(`Saved image to ${output.absolutePath}`)
  console.log(`Registered asset as ${output.group}.${output.key}`)

  if (args.json) {
    console.log(
      `__GBIT_RESULT__ ${JSON.stringify({
        ok: true,
        type,
        id: args.id,
        prompt,
        negativePrompt,
        checkpointName,
        absolutePath: output.absolutePath,
        browserPath: output.browserPath,
        group: output.group,
        key: output.key,
        promptId,
        seed: finalConfig.seed,
        width: finalConfig.width,
        height: finalConfig.height,
      })}`
    )
  }
}

function parseArgs(argv) {
  const args = {}
  const positional = []

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (!token.startsWith("--")) {
      positional.push(token)
      continue
    }

    const key = token.slice(2)

    if (key === "help" || key === "list" || key === "json") {
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

  if (!args.type && positional[0] && allowedTypes.has(positional[0])) {
    args.type = positional.shift()
  }

  if (!args.id && positional[0] && positional[0] !== "list") {
    args.id = positional.shift()
  }

  if (!args.list && positional[0] === "list") {
    args.list = true
    positional.shift()
  }

  if (!args.prompt && positional.length > 0) {
    args.prompt = positional.join(" ")
  }

  return args
}

function printHelp() {
  console.log(`Usage:
  npm run generate:asset -- --type monster --id sprigoon
  npm run generate:asset -- --type scene --id town
  npm run generate:asset -- --type monster --id sprigoon --prompt "custom prompt"
  npm run generate:asset -- --type monster --list

Options:
  --type       monster | character | scene | tile
  --id         asset id and output file name
  --prompt     optional custom positive prompt override
  --negative   optional custom negative prompt override
  --output     optional custom relative output path
  --output-root optional output root dir for default paths (e.g. art-pipeline/generated)
  --manifest   optional generated manifest path (default assets.generated.js)
  --width      override width
  --height     override height
  --steps      override steps
  --cfg        override cfg scale
  --sampler    override sampler name
  --scheduler  override scheduler
  --seed       override seed
  --json       print a machine-readable result line
  --list       list preset ids for the selected type
  --help       print this message`)
}

function ensureType(type) {
  if (!allowedTypes.has(type)) {
    throw new Error(`Unsupported --type "${type}". Expected one of: ${[...allowedTypes].join(", ")}`)
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8")
  return JSON.parse(raw)
}

function buildRenderConfig({ args, config, preset, type }) {
  const defaults = config.defaults?.[type] || {}
  return {
    baseUrl: args["base-url"] || config.baseUrl || "http://127.0.0.1:8188",
    width: toInt(args.width, preset?.width ?? defaults.width ?? 1024),
    height: toInt(args.height, preset?.height ?? defaults.height ?? 1024),
    steps: toInt(args.steps, preset?.steps ?? defaults.steps ?? 28),
    cfg: toNumber(args.cfg, preset?.cfg ?? defaults.cfg ?? 5.5),
    sampler: args.sampler || preset?.sampler || defaults.sampler || "euler",
    scheduler: args.scheduler || preset?.scheduler || defaults.scheduler || "normal",
    seed: toSeed(args.seed),
    checkpointName: args.checkpoint || config.checkpointName || null,
    checkpointPath: config.checkpointPath || null,
  }
}

function toInt(value, fallback) {
  return value == null ? fallback : Number.parseInt(value, 10)
}

function toNumber(value, fallback) {
  return value == null ? fallback : Number.parseFloat(value)
}

function toSeed(value) {
  if (value == null) {
    return randomSeed()
  }
  const numeric = Number.parseInt(value, 10)
  return Number.isNaN(numeric) ? randomSeed() : numeric
}

function randomSeed() {
  return crypto.randomInt(0, 2 ** 31 - 1)
}

function buildPrompt(type, preset, overridePrompt) {
  const basePrompt = overridePrompt || preset?.prompt
  if (!basePrompt) {
    throw new Error(`No preset prompt found for this asset. Pass --prompt or add a preset for the id.`)
  }
  return `${basePrompt}, ${typePromptSuffix[type]}`
}

function buildNegativePrompt(config, preset, overrideNegative) {
  return overrideNegative || preset?.negative || config.defaultNegativePrompt
}

function resolveManifestPath(manifestPathArg) {
  if (!manifestPathArg) {
    return defaultGeneratedManifestPath
  }
  const normalized = manifestPathArg.replace(/\\/g, "/")
  return path.resolve(projectRoot, normalized)
}

function resolveOutput(type, id, explicitOutput, outputRoot = "assets") {
  const folderMap = {
    monster: "monsters",
    character: "characters",
    scene: "scene",
    tile: "tiles",
  }

  const relativeFolder =
    type === "character"
      ? path.posix.join(folderMap.character, resolveCharacterAssetDir(id))
      : type === "monster"
        ? path.posix.dirname(resolveMonsterAssetRelativePath(id, ".png").replace(/^assets\//, ""))
        : folderMap[type]

  const relativePath =
    explicitOutput || path.posix.join(outputRoot, relativeFolder, `${id}.png`)
  const normalizedRelativePath = relativePath.replace(/\\/g, "/")

  return {
    absolutePath: path.resolve(projectRoot, normalizedRelativePath),
    browserPath: normalizedRelativePath,
    group: folderMap[type] === "scene" ? "scene" : folderMap[type],
    key: id,
  }
}

async function ensureComfyConnection(baseUrl) {
  let response
  try {
    response = await fetch(`${baseUrl}/system_stats`)
  } catch (error) {
    throw new Error(
      `Could not reach ComfyUI at ${baseUrl}. Start ComfyUI first or edit comfyui.config.json to the correct baseUrl.`
    )
  }

  if (!response.ok) {
    throw new Error(`ComfyUI responded with ${response.status} on /system_stats.`)
  }
}

async function resolveCheckpointName(finalConfig) {
  const fallbackName =
    finalConfig.checkpointName ||
    (finalConfig.checkpointPath ? path.basename(finalConfig.checkpointPath) : null)

  if (!fallbackName) {
    throw new Error("No checkpointName or checkpointPath configured in comfyui.config.json.")
  }

  try {
    const response = await fetch(`${finalConfig.baseUrl}/models/checkpoints`)
    if (!response.ok) {
      return fallbackName
    }

    const checkpoints = await response.json()
    if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
      return fallbackName
    }

    const basename = finalConfig.checkpointPath ? path.basename(finalConfig.checkpointPath) : fallbackName
    const directMatch = checkpoints.find((item) => item === fallbackName || item === basename)
    if (directMatch) {
      return directMatch
    }

    const fuzzyMatch = checkpoints.find((item) => item.endsWith(basename))
    if (fuzzyMatch) {
      return fuzzyMatch
    }

    throw new Error(
      `Configured checkpoint was not found in ComfyUI. Available checkpoints include: ${checkpoints
        .slice(0, 10)
        .join(", ")}`
    )
  } catch (error) {
    if (error.message.startsWith("Configured checkpoint")) {
      throw error
    }
    return fallbackName
  }
}

function createWorkflow({
  checkpointName,
  prompt,
  negativePrompt,
  width,
  height,
  steps,
  cfg,
  sampler,
  scheduler,
  seed,
  filenamePrefix,
}) {
  return {
    "4": {
      inputs: {
        ckpt_name: checkpointName,
      },
      class_type: "CheckpointLoaderSimple",
    },
    "5": {
      inputs: {
        width,
        height,
        batch_size: 1,
      },
      class_type: "EmptyLatentImage",
    },
    "6": {
      inputs: {
        text: prompt,
        clip: ["4", 1],
      },
      class_type: "CLIPTextEncode",
    },
    "7": {
      inputs: {
        text: negativePrompt,
        clip: ["4", 1],
      },
      class_type: "CLIPTextEncode",
    },
    "3": {
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: sampler,
        scheduler,
        denoise: 1,
        model: ["4", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["5", 0],
      },
      class_type: "KSampler",
    },
    "8": {
      inputs: {
        samples: ["3", 0],
        vae: ["4", 2],
      },
      class_type: "VAEDecode",
    },
    "9": {
      inputs: {
        filename_prefix: filenamePrefix,
        images: ["8", 0],
      },
      class_type: "SaveImage",
    },
  }
}

async function queuePrompt(baseUrl, workflow) {
  const response = await fetch(`${baseUrl}/prompt`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: crypto.randomUUID(),
      prompt: workflow,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`ComfyUI rejected the prompt (${response.status}). ${body}`)
  }

  const payload = await response.json()
  if (!payload.prompt_id) {
    throw new Error("ComfyUI did not return a prompt_id.")
  }

  return payload.prompt_id
}

async function waitForImage(baseUrl, promptId, { timeoutMs, pollIntervalMs }) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const response = await fetch(`${baseUrl}/history/${promptId}`)
    if (response.ok) {
      const payload = await response.json()
      const historyItem = payload[promptId] || payload
      const image = extractImageFromHistory(historyItem)
      if (image) {
        return image
      }
    }

    await sleep(pollIntervalMs)
  }

  throw new Error(`Timed out waiting for ComfyUI to finish prompt ${promptId}.`)
}

function extractImageFromHistory(historyItem) {
  const outputs = historyItem?.outputs
  if (!outputs || typeof outputs !== "object") {
    return null
  }

  for (const nodeOutput of Object.values(outputs)) {
    if (!nodeOutput?.images?.length) {
      continue
    }
    return nodeOutput.images[0]
  }

  return null
}

async function downloadImage(baseUrl, imageInfo) {
  const url = new URL(`${baseUrl}/view`)
  url.searchParams.set("filename", imageInfo.filename)
  url.searchParams.set("type", imageInfo.type || "output")
  if (imageInfo.subfolder) {
    url.searchParams.set("subfolder", imageInfo.subfolder)
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download rendered image (${response.status}).`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
