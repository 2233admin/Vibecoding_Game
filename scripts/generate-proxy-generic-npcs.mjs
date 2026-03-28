import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const generatorScript = path.join(projectRoot, "scripts", "generate-proxy-character-assets.mjs")

const npcKeys = Array.from({ length: 20 }, (_, index) =>
  `npc_generic_${String(index + 1).padStart(2, "0")}`
)

const child = spawn(process.execPath, [generatorScript, ...npcKeys], {
  cwd: projectRoot,
  stdio: "inherit",
  windowsHide: true,
})

child.on("close", (code) => {
  process.exit(code ?? 0)
})

child.on("error", (error) => {
  console.error(error.message || error)
  process.exit(1)
})
