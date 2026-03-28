import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveMonsterAssetRelativePath } from "./monster-asset-paths.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const generatedManifestPath = path.join(projectRoot, "assets.generated.js")
const portraitCachePath = path.join(projectRoot, ".ai-portrait-cache.json")

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

async function main() {
  const manifest = await readGeneratedManifest(generatedManifestPath)
  if (!manifest.monsters || typeof manifest.monsters !== "object") {
    throw new Error("assets.generated.js has no monsters manifest section.")
  }

  const migration = await migrateMonsterManifestEntries(manifest.monsters)
  await writeGeneratedManifest(generatedManifestPath, manifest)

  const cacheMigration = await migratePortraitCache()

  console.log(
    [
      `Monster manifest updated: ${migration.updated} entries`,
      `Monster files copied to new layout: ${migration.copied}`,
      `Monster paths already in target layout: ${migration.already}`,
      `Monster sources missing: ${migration.missing.length}`,
      `Portrait cache updated: ${cacheMigration.updated}`,
    ].join("\n")
  )

  if (migration.missing.length > 0) {
    console.log("Missing source files:")
    for (const line of migration.missing) {
      console.log(`- ${line}`)
    }
  }
}

async function migrateMonsterManifestEntries(monstersMap) {
  let updated = 0
  let copied = 0
  let already = 0
  const missing = []

  for (const [assetId, oldRelativePathRaw] of Object.entries(monstersMap)) {
    const oldRelativePath = String(oldRelativePathRaw || "")
    const extension = path.posix.extname(oldRelativePath) || ".png"
    const nextRelativePath = resolveMonsterAssetRelativePath(assetId, extension)
    const sourceAbsolutePath = path.resolve(projectRoot, oldRelativePath)
    const targetAbsolutePath = path.resolve(projectRoot, nextRelativePath)

    if (oldRelativePath === nextRelativePath) {
      already += 1
    } else {
      updated += 1
      monstersMap[assetId] = nextRelativePath
    }

    if (await fileExists(targetAbsolutePath)) {
      continue
    }
    if (!(await fileExists(sourceAbsolutePath))) {
      missing.push(`${assetId} -> ${oldRelativePath}`)
      continue
    }

    await fs.mkdir(path.dirname(targetAbsolutePath), { recursive: true })
    await fs.copyFile(sourceAbsolutePath, targetAbsolutePath)
    copied += 1
  }

  return {
    updated,
    copied,
    already,
    missing,
  }
}

async function migratePortraitCache() {
  if (!(await fileExists(portraitCachePath))) {
    return { updated: 0 }
  }

  const raw = await fs.readFile(portraitCachePath, "utf8")
  const cache = JSON.parse(raw)
  let updated = 0

  for (const value of Object.values(cache)) {
    if (!value || typeof value !== "object") {
      continue
    }
    const currentPath = String(value.assetPath || "")
    if (!currentPath.startsWith("assets/monsters/")) {
      continue
    }
    const extension = path.posix.extname(currentPath) || ".png"
    const assetId = path.posix.basename(currentPath, extension)
    const nextPath = resolveMonsterAssetRelativePath(assetId, extension)
    if (nextPath === currentPath) {
      continue
    }
    value.assetPath = nextPath
    updated += 1
  }

  if (updated > 0) {
    await fs.writeFile(portraitCachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8")
  }

  return { updated }
}

async function readGeneratedManifest(filePath) {
  const raw = await fs.readFile(filePath, "utf8")
  const prefix = "window.GBIT_ASSETS_GENERATED = "
  if (!raw.startsWith(prefix)) {
    throw new Error(`Unexpected generated manifest format: ${filePath}`)
  }
  return JSON.parse(raw.slice(prefix.length))
}

async function writeGeneratedManifest(filePath, manifest) {
  await fs.writeFile(filePath, `window.GBIT_ASSETS_GENERATED = ${JSON.stringify(manifest, null, 2)}\n`, "utf8")
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch (_) {
    return false
  }
}

