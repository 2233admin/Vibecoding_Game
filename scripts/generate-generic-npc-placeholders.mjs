import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const outputDir = path.join(projectRoot, "art-pipeline", "generated", "characters")
const manifestPath = path.join(projectRoot, "art-pipeline", "assets.generated.js")
const count = 20

const palettes = [
  { hair: "#4a2f2a", skin: "#f3d6bd", coat: "#5f83c6", accent: "#f4c56a", pants: "#384f74" },
  { hair: "#6b4e2f", skin: "#efcfb3", coat: "#4f9a8b", accent: "#ffe08a", pants: "#3f665d" },
  { hair: "#6f5b7b", skin: "#f0d3c0", coat: "#7e7fcf", accent: "#a8d6ff", pants: "#4a4d78" },
  { hair: "#8b5f4a", skin: "#efccb2", coat: "#d98363", accent: "#ffe0c0", pants: "#6e4d3e" },
  { hair: "#3d3d45", skin: "#f1d7c4", coat: "#8b9ab0", accent: "#f9d89b", pants: "#4e5969" },
]

await fs.mkdir(outputDir, { recursive: true })
const manifest = await readManifest(manifestPath)
manifest.characters = manifest.characters || {}

for (let index = 0; index < count; index += 1) {
  const key = `npc_generic_${String(index + 1).padStart(2, "0")}`
  const palette = palettes[index % palettes.length]
  const variant = index % 4
  const svg = drawNpcSvg(palette, variant)
  const fileName = `${key}.svg`
  const filePath = path.join(outputDir, fileName)
  await fs.writeFile(filePath, svg, "utf8")
  manifest.characters[key] = `art-pipeline/generated/characters/${fileName}`
  console.log(`Generated ${key}`)
}

await writeManifest(manifestPath, manifest)
console.log("Generic NPC placeholder generation complete.")

function drawNpcSvg(colors, variant) {
  const hairTop = variant === 1 ? 18 : 16
  const hairHeight = variant === 2 ? 26 : 22
  const coatRound = variant === 3 ? 18 : 10
  const accessoryColor = variant % 2 === 0 ? colors.accent : "#ffffff"

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460" width="320" height="460">
  <defs>
    <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#f8fbff"/>
      <stop offset="100%" stop-color="#e8eef8"/>
    </linearGradient>
  </defs>
  <rect width="320" height="460" fill="url(#bg)"/>
  <ellipse cx="160" cy="442" rx="82" ry="12" fill="#d6deeb"/>
  <rect x="95" y="165" width="130" height="190" rx="${coatRound}" fill="${colors.coat}"/>
  <rect x="128" y="184" width="64" height="18" rx="8" fill="${accessoryColor}" opacity="0.92"/>
  <rect x="120" y="352" width="30" height="80" rx="8" fill="${colors.pants}"/>
  <rect x="170" y="352" width="30" height="80" rx="8" fill="${colors.pants}"/>
  <rect x="116" y="426" width="38" height="14" rx="6" fill="#4a3f3b"/>
  <rect x="166" y="426" width="38" height="14" rx="6" fill="#4a3f3b"/>
  <rect x="78" y="190" width="24" height="90" rx="10" fill="${colors.coat}"/>
  <rect x="218" y="190" width="24" height="90" rx="10" fill="${colors.coat}"/>
  <circle cx="160" cy="126" r="62" fill="${colors.skin}"/>
  <rect x="98" y="${hairTop}" width="124" height="${hairHeight}" rx="36" fill="${colors.hair}"/>
  <rect x="96" y="52" width="26" height="80" rx="12" fill="${colors.hair}"/>
  <rect x="198" y="52" width="26" height="80" rx="12" fill="${colors.hair}"/>
  <circle cx="138" cy="122" r="5" fill="#2f2c31"/>
  <circle cx="182" cy="122" r="5" fill="#2f2c31"/>
  <path d="M143 154 Q160 166 177 154" stroke="#8e5e4f" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>
`
}

async function readManifest(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8")
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

async function writeManifest(filePath, manifest) {
  const content = `window.GBIT_ASSETS_GENERATED = ${JSON.stringify(manifest, null, 2)}\n`
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}
