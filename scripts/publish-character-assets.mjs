import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveCharacterAssetDir } from "./character-asset-paths.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const pipelineManifestPath = path.join(projectRoot, "art-pipeline", "assets.generated.js")
const runtimeManifestPath = path.join(projectRoot, "assets.generated.js")
const runtimeCharactersRootDir = path.join(projectRoot, "assets", "characters")
const selectedKeys = new Set(process.argv.slice(2))

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

async function main() {
  const pipelineManifest = await readGeneratedManifest(pipelineManifestPath)
  const runtimeManifest = await readGeneratedManifest(runtimeManifestPath)

  if (!pipelineManifest.characters || Object.keys(pipelineManifest.characters).length === 0) {
    throw new Error("No character assets found in art-pipeline manifest. Generate assets first.")
  }

  if (!runtimeManifest.characters) {
    runtimeManifest.characters = {}
  }

  await fs.mkdir(runtimeCharactersRootDir, { recursive: true })

  const entries = Object.entries(pipelineManifest.characters).filter(([key]) =>
    selectedKeys.size === 0 ? true : selectedKeys.has(key)
  )

  if (entries.length === 0) {
    throw new Error("No matching character keys to publish.")
  }

  for (const [key, relativeSourcePath] of entries) {
    const sourcePath = path.resolve(projectRoot, relativeSourcePath)
    const exists = await fileExists(sourcePath)
    if (!exists) {
      throw new Error(`Missing source asset for ${key}: ${relativeSourcePath}`)
    }

    const extension = normalizeExtension(path.extname(sourcePath))
    const fileName = `${key}${extension}`
    const characterDir = resolveCharacterAssetDir(key)
    const runtimeCharactersDir = path.join(runtimeCharactersRootDir, characterDir)
    await fs.mkdir(runtimeCharactersDir, { recursive: true })
    const targetPath = path.join(runtimeCharactersDir, fileName)
    await fs.copyFile(sourcePath, targetPath)
    await cleanupStaleRuntimeFiles(runtimeCharactersDir, key, extension)

    runtimeManifest.characters[key] = path.posix.join("assets", "characters", characterDir, fileName)
    console.log(`Published ${key} -> assets/characters/${characterDir}/${fileName}`)
  }

  await writeGeneratedManifest(runtimeManifestPath, runtimeManifest)
  console.log("Runtime character assets published.")
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

async function cleanupStaleRuntimeFiles(runtimeCharactersDir, key, keepExtension) {
  const extensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"]
  await Promise.all(
    extensions
      .filter((extension) => extension !== keepExtension)
      .map((extension) =>
        fs.rm(path.join(runtimeCharactersDir, `${key}${extension}`), {
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
