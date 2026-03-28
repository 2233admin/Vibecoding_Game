import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveCharacterAssetDir } from "./character-asset-paths.mjs"
import { resolveMonsterAssetRelativePath } from "./monster-asset-paths.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const pipelineManifestPath = path.join(projectRoot, "art-pipeline", "assets.generated.js")
const runtimeManifestPath = path.join(projectRoot, "assets.generated.js")
const selectedArgs = process.argv.slice(2)

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

async function main() {
  const args = parseArgs(selectedArgs)
  if (args.help) {
    printHelp()
    return
  }

  const type = args.type
  if (!type) {
    throw new Error("Missing --type. Use monster | character | scene | tile.")
  }

  const config = getTypeConfig(type)
  const selectedKeys = new Set(args.keys)
  const pipelineManifest = await readGeneratedManifest(pipelineManifestPath)
  const runtimeManifest = await readGeneratedManifest(runtimeManifestPath)

  if (!pipelineManifest[config.group] || Object.keys(pipelineManifest[config.group]).length === 0) {
    throw new Error(`No ${config.group} assets found in art-pipeline manifest.`)
  }

  if (!runtimeManifest[config.group]) {
    runtimeManifest[config.group] = {}
  }

  const entries = Object.entries(pipelineManifest[config.group]).filter(([key]) =>
    selectedKeys.size === 0 ? true : selectedKeys.has(key)
  )

  if (entries.length === 0) {
    throw new Error("No matching keys to publish.")
  }

  const runtimeBaseDir = path.join(projectRoot, "assets", config.runtimeFolder)
  await fs.mkdir(runtimeBaseDir, { recursive: true })

  for (const [key, sourceRelativePath] of entries) {
    const sourcePath = path.resolve(projectRoot, sourceRelativePath)
    if (!(await fileExists(sourcePath))) {
      throw new Error(`Missing source asset for ${key}: ${sourceRelativePath}`)
    }

    const extension = normalizeExtension(path.extname(sourcePath))
    const targetName = `${key}${extension}`
    const targetRelativePath = resolveRuntimeRelativePath(config, key, targetName)
    const targetPath = path.join(projectRoot, targetRelativePath)
    const targetDir = path.dirname(targetPath)
    await fs.mkdir(targetDir, { recursive: true })
    await fs.copyFile(sourcePath, targetPath)
    await cleanupStaleRuntimeFiles(targetDir, key, extension)

    runtimeManifest[config.group][key] = targetRelativePath.replace(/\\/g, "/")
    console.log(`Published ${config.group}.${key} -> ${runtimeManifest[config.group][key]}`)
  }

  await writeGeneratedManifest(runtimeManifestPath, runtimeManifest)
  console.log("Publish completed.")
}

function resolveRuntimeRelativePath(config, key, targetName) {
  if (config.group === "monsters") {
    const extension = path.posix.extname(targetName) || ".png"
    return resolveMonsterAssetRelativePath(key, extension)
  }
  if (config.group !== "characters") {
    return path.posix.join("assets", config.runtimeFolder, targetName)
  }
  const characterDir = resolveCharacterAssetDir(key)
  return path.posix.join("assets", config.runtimeFolder, characterDir, targetName)
}

function parseArgs(argv) {
  const args = {
    keys: [],
    positional: [],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === "--help") {
      args.help = true
      continue
    }
    if (token === "--type") {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) {
        throw new Error("--type requires a value.")
      }
      args.type = value
      index += 1
      continue
    }

    args.positional.push(token)
  }

  if (!args.type && args.positional.length > 0) {
    args.type = args.positional.shift()
  }

  args.keys.push(...args.positional)

  return args
}

function printHelp() {
  console.log(`Usage:
  npm run publish:assets -- character
  npm run publish:assets -- character scout leader
  npm run publish:assets -- monster sprigoon
  npm run publish:assets -- --type character scout

Options:
  --type    monster | character | scene | tile
  --help    print this message`)
  }

function getTypeConfig(type) {
  const map = {
    monster: {
      group: "monsters",
      runtimeFolder: "monsters",
    },
    character: {
      group: "characters",
      runtimeFolder: "characters",
    },
    scene: {
      group: "scene",
      runtimeFolder: "scene",
    },
    tile: {
      group: "tiles",
      runtimeFolder: "tiles",
    },
  }

  const config = map[type]
  if (!config) {
    throw new Error(`Unsupported --type "${type}". Expected monster | character | scene | tile.`)
  }
  return config
}

function normalizeExtension(extension) {
  const normalized = (extension || "").toLowerCase()
  if (normalized === ".jpeg") {
    return ".jpg"
  }
  if ([".png", ".jpg", ".webp", ".svg"].includes(normalized)) {
    return normalized
  }
  return ".png"
}

async function cleanupStaleRuntimeFiles(runtimeDir, key, keepExtension) {
  const extensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"]
  await Promise.all(
    extensions
      .filter((extension) => extension !== keepExtension)
      .map((extension) =>
        fs.rm(path.join(runtimeDir, `${key}${extension}`), {
          force: true,
        })
      )
  )
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
}

async function readGeneratedManifest(manifestPath) {
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

async function writeGeneratedManifest(manifestPath, manifest) {
  const content = `window.GBIT_ASSETS_GENERATED = ${JSON.stringify(manifest, null, 2)}\n`
  await fs.writeFile(manifestPath, content, "utf8")
}
