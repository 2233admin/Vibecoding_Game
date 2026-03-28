import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveCharacterAssetDir } from "./character-asset-paths.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const defaultOutputDir = path.join(projectRoot, "assets", "characters")
const defaultManifestPath = path.join(projectRoot, "assets.generated.js")
const width = 24
const height = 32
const selectedKeys = new Set(process.argv.slice(2))

export const pixelCharacterJobs = [
  {
    key: "player",
    label: "Player Trainer",
    palette: {
      hair: "#6b4a30",
      skin: "#f0d2b0",
      eyes: "#3e2d26",
      top: "#5b86d5",
      accent: "#dfb35d",
      lower: "#334768",
      shoes: "#554237",
      accessory: "#b37a4b",
    },
    draw(grid, colors) {
      drawBaseHair(grid, colors, { bangs: 0, sideLength: 2 })
      drawFace(grid, colors)
      drawTorso(grid, colors, { topY: 12, bottomY: 20, sleeveY: 12, accentY: 19 })
      drawLegs(grid, colors, { lowerY: 20 })
      paintRect(grid, 7, 14, 1, 6, colors.accent)
      paintRect(grid, 6, 17, 2, 3, colors.accessory)
      paintRect(grid, 16, 12, 2, 3, colors.accent)
    },
  },
  {
    key: "professor",
    label: "Professor Song",
    palette: {
      hair: "#c9d0d9",
      skin: "#eecbaa",
      eyes: "#3c312d",
      top: "#f4f3ef",
      accent: "#7cb5a8",
      lower: "#8f9aa6",
      shoes: "#645a54",
      accessory: "#d9be7b",
    },
    draw(grid, colors) {
      drawBaseHair(grid, colors, { bangs: 1, sideLength: 3 })
      drawFace(grid, colors)
      drawTorso(grid, colors, { topY: 12, bottomY: 24, sleeveY: 12, accentY: 15 })
      paintRect(grid, 10, 24, 4, 3, colors.top)
      paintRect(grid, 8, 16, 8, 1, colors.accent)
      paintRect(grid, 16, 17, 2, 4, colors.accessory)
      paintRect(grid, 17, 16, 1, 1, "#ffffff")
      drawLegs(grid, colors, { lowerY: 24 })
    },
  },
  {
    key: "caretaker",
    label: "Caretaker Lin",
    palette: {
      hair: "#7b573f",
      skin: "#f0ceb1",
      eyes: "#3f322d",
      top: "#7cc2b6",
      accent: "#f5f0df",
      lower: "#9ab38a",
      shoes: "#645951",
      accessory: "#f0b8c6",
    },
    draw(grid, colors) {
      drawBaseHair(grid, colors, { bangs: 0, sideLength: 3 })
      paintRect(grid, 7, 8, 1, 3, colors.hair)
      paintRect(grid, 16, 8, 1, 3, colors.hair)
      drawFace(grid, colors)
      drawTorso(grid, colors, { topY: 12, bottomY: 19, sleeveY: 12, accentY: 14 })
      paintRect(grid, 9, 15, 6, 8, colors.accent)
      paintRect(grid, 8, 20, 8, 4, colors.lower)
      paintRect(grid, 8, 18, 8, 1, colors.accessory)
      drawLegs(grid, colors, { lowerY: 24 })
    },
  },
  {
    key: "scout",
    label: "Route Scout Mira",
    palette: {
      hair: "#8b5f3d",
      skin: "#efccac",
      eyes: "#3d312d",
      top: "#d98667",
      accent: "#f1d8a4",
      lower: "#8c7d60",
      shoes: "#5a4d45",
      accessory: "#fff2d8",
    },
    draw(grid, colors) {
      drawBaseHair(grid, colors, { bangs: 2, sideLength: 2 })
      paintRect(grid, 15, 6, 2, 4, colors.hair)
      paintRect(grid, 16, 10, 1, 4, colors.hair)
      drawFace(grid, colors)
      drawTorso(grid, colors, { topY: 12, bottomY: 18, sleeveY: 12, accentY: 15 })
      paintRect(grid, 8, 18, 8, 3, colors.lower)
      paintRect(grid, 10, 10, 4, 1, colors.accessory)
      paintRect(grid, 6, 13, 2, 1, colors.accent)
      paintRect(grid, 16, 13, 2, 1, colors.accent)
      drawLegs(grid, colors, { lowerY: 21 })
    },
  },
  {
    key: "leader",
    label: "Gym Leader Astra",
    palette: {
      hair: "#6f6cb3",
      skin: "#efd0b1",
      eyes: "#332c38",
      top: "#f2efe8",
      accent: "#d8b35d",
      lower: "#6a6d92",
      shoes: "#524b57",
      accessory: "#a2c9ec",
    },
    draw(grid, colors) {
      drawBaseHair(grid, colors, { bangs: 1, sideLength: 2 })
      paintRect(grid, 7, 5, 1, 2, colors.hair)
      paintRect(grid, 16, 5, 1, 2, colors.hair)
      drawFace(grid, colors)
      paintRect(grid, 6, 12, 12, 2, colors.accent)
      drawTorso(grid, colors, { topY: 12, bottomY: 20, sleeveY: 12, accentY: 17 })
      paintRect(grid, 5, 14, 2, 7, colors.accessory)
      paintRect(grid, 17, 14, 2, 7, colors.accessory)
      paintRect(grid, 8, 20, 8, 2, colors.lower)
      paintRect(grid, 10, 15, 4, 1, colors.accent)
      drawLegs(grid, colors, { lowerY: 22 })
    },
  },
]

if (path.resolve(process.argv[1] || "") === __filename) {
  main().catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })
}

async function main() {
  await generatePixelCharacterAssets({
    keys: selectedKeys.size > 0 ? [...selectedKeys] : null,
    log: (message) => console.log(message),
    updateManifest: true,
    outputDir: defaultOutputDir,
    manifestPath: defaultManifestPath,
    relativeBaseDir: "assets/characters",
  })
  console.log("Pixel character asset generation complete.")
}

export async function generatePixelCharacterAssets({
  keys = null,
  log = () => {},
  updateManifest = true,
  outputDir = defaultOutputDir,
  manifestPath = defaultManifestPath,
  relativeBaseDir = "assets/characters",
} = {}) {
  await fs.mkdir(outputDir, { recursive: true })

  const manifest = updateManifest ? await readGeneratedManifest(manifestPath) : null
  if (manifest && !manifest.characters) {
    manifest.characters = {}
  }

  const requestedKeys = keys == null ? null : new Set(keys)
  const targetJobs =
    requestedKeys == null
      ? pixelCharacterJobs
      : pixelCharacterJobs.filter((job) => requestedKeys.has(job.key))

  if (targetJobs.length === 0) {
    throw new Error("No matching pixel character jobs found.")
  }

  const results = []

  for (const job of targetJobs) {
    const grid = createGrid(width, height)
    job.draw(grid, job.palette)

    const svg = renderSpriteSvg(grid)
    const characterDir = resolveCharacterAssetDir(job.key)
    const relativePath = path.posix.join(relativeBaseDir, characterDir, `${job.key}.svg`)
    const absolutePath = path.join(outputDir, characterDir, `${job.key}.svg`)
    await fs.mkdir(path.dirname(absolutePath), { recursive: true })

    await fs.writeFile(absolutePath, svg, "utf8")

    if (manifest) {
      manifest.characters[job.key] = relativePath
    }

    results.push({
      key: job.key,
      label: job.label,
      relativePath,
      absolutePath,
    })
    log(`Saved ${relativePath}`)
  }

  if (manifest) {
    await writeGeneratedManifest(manifestPath, manifest)
  }

  return results
}

function createGrid(spriteWidth, spriteHeight) {
  return Array.from({ length: spriteHeight }, () => Array.from({ length: spriteWidth }, () => null))
}

function paintRect(grid, x, y, rectWidth, rectHeight, color) {
  for (let row = y; row < y + rectHeight; row += 1) {
    for (let column = x; column < x + rectWidth; column += 1) {
      if (!grid[row] || (grid[row][column] == null && color == null)) {
        continue
      }
      if (grid[row] && grid[row][column] !== undefined) {
        grid[row][column] = color
      }
    }
  }
}

function drawBaseHair(grid, colors, { bangs = 0, sideLength = 2 }) {
  paintRect(grid, 8, 2, 8, 3, colors.hair)
  paintRect(grid, 7, 4, 1, sideLength + 2, colors.hair)
  paintRect(grid, 16, 4, 1, sideLength + 2, colors.hair)
  paintRect(grid, 9, 5, 6, 1 + bangs, colors.hair)
}

function drawFace(grid, colors) {
  paintRect(grid, 8, 5, 8, 6, colors.skin)
  paintRect(grid, 10, 7, 1, 1, colors.eyes)
  paintRect(grid, 13, 7, 1, 1, colors.eyes)
  paintRect(grid, 11, 11, 2, 1, colors.skin)
}

function drawTorso(grid, colors, { topY, bottomY, sleeveY, accentY }) {
  paintRect(grid, 8, topY, 8, bottomY - topY, colors.top)
  paintRect(grid, 6, sleeveY, 2, 6, colors.top)
  paintRect(grid, 16, sleeveY, 2, 6, colors.top)
  paintRect(grid, 6, sleeveY + 6, 2, 2, colors.skin)
  paintRect(grid, 16, sleeveY + 6, 2, 2, colors.skin)
  paintRect(grid, 8, accentY, 8, 1, colors.accent)
}

function drawLegs(grid, colors, { lowerY }) {
  paintRect(grid, 9, lowerY, 3, 6, colors.lower)
  paintRect(grid, 12, lowerY, 3, 6, colors.lower)
  paintRect(grid, 8, lowerY + 6, 4, 2, colors.shoes)
  paintRect(grid, 12, lowerY + 6, 4, 2, colors.shoes)
}

function renderSpriteSvg(grid) {
  const rects = []

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const color = grid[y][x]
      if (!color) {
        continue
      }
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />`)
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">`,
    `  <rect width="${width}" height="${height}" fill="transparent" />`,
    ...rects.map((line) => `  ${line}`),
    `</svg>`,
    ``,
  ].join("\n")
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
  await fs.mkdir(path.dirname(manifestPath), { recursive: true })
  await fs.writeFile(manifestPath, content, "utf8")
}
