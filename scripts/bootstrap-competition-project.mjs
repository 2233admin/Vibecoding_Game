import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")
const contestWindowStart = "2026-03-24"
const contestWindowEnd = "2026-03-29"
const contestWindowLabel = `${contestWindowStart} to ${contestWindowEnd}`

const args = parseArgs(process.argv.slice(2))
const profile = args.profile || "web-minimal"
const targetArg = args.target || ""
const dryRun = Boolean(args["dry-run"])
const force = Boolean(args.force)

if (!targetArg) {
  printHelp("Missing required --target.")
  process.exit(1)
}

const targetRoot = path.resolve(process.cwd(), targetArg)
const copied = []

const profiles = {
  "web-minimal": {
    files: [
      "index.html",
      "styles.css",
      "game.js",
      "assets.js",
      "assets.generated.js",
      "package.json",
      "package-lock.json",
      ".gitignore",
      ".env.example",
    ],
    dirs: [
      "src",
      "assets",
      "scripts/dev-server.mjs",
      "scripts/generate-runtime-asset.mjs",
      "scripts/load-local-env.mjs",
      "scripts/acceptance-interaction.mjs",
    ],
  },
  "web-full": {
    files: [
      "index.html",
      "styles.css",
      "game.js",
      "assets.js",
      "assets.generated.js",
      "package.json",
      "package-lock.json",
      ".gitignore",
      ".env.example",
      "README.md",
    ],
    dirs: [
      "src",
      "assets",
      "scripts",
      "rules",
      "docs",
      "tasks",
    ],
  },
}

if (!profiles[profile]) {
  printHelp(`Unsupported --profile "${profile}".`)
  process.exit(1)
}

run().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

async function run() {
  const targetExists = await exists(targetRoot)
  if (targetExists && !force) {
    throw new Error(`Target already exists: ${targetRoot}. Use --force to continue.`)
  }

  if (!dryRun) {
    await fs.mkdir(targetRoot, { recursive: true })
  }

  const selection = profiles[profile]
  for (const relativeFile of selection.files) {
    await copyOne(relativeFile)
  }

  for (const relativeEntry of selection.dirs) {
    const absoluteSource = path.resolve(projectRoot, relativeEntry)
    const stat = await safeStat(absoluteSource)
    if (!stat) {
      continue
    }
    if (stat.isDirectory()) {
      await copyDirectory(relativeEntry)
      continue
    }
    await copyOne(relativeEntry)
  }

  await writeComplianceBundle()
  await writeReadmeIfMissing()

  console.log("")
  console.log("Competition project bootstrap completed.")
  console.log(`Profile: ${profile}`)
  console.log(`Target : ${targetRoot}`)
  console.log(`Files  : ${copied.length}`)
  if (dryRun) {
    console.log("Mode   : dry-run (no files written)")
  }
}

async function copyDirectory(relativeDir) {
  const absoluteSource = path.resolve(projectRoot, relativeDir)
  const entries = await fs.readdir(absoluteSource, { withFileTypes: true })
  for (const entry of entries) {
    const childRelative = path.join(relativeDir, entry.name)
    if (shouldIgnore(childRelative)) {
      continue
    }
    if (entry.isDirectory()) {
      await copyDirectory(childRelative)
      continue
    }
    if (entry.isFile()) {
      await copyOne(childRelative)
    }
  }
}

async function copyOne(relativePath) {
  if (shouldIgnore(relativePath)) {
    return
  }

  const sourceAbs = path.resolve(projectRoot, relativePath)
  const stat = await safeStat(sourceAbs)
  if (!stat || !stat.isFile()) {
    return
  }

  const targetAbs = path.resolve(targetRoot, relativePath)
  const sourceContent = await fs.readFile(sourceAbs)
  const hash = sha256(sourceContent)

  if (!dryRun) {
    await fs.mkdir(path.dirname(targetAbs), { recursive: true })
    await fs.writeFile(targetAbs, sourceContent)
  }

  copied.push({
    path: normalizePath(relativePath),
    size: sourceContent.byteLength,
    sha256: hash,
    source: normalizePath(path.relative(projectRoot, sourceAbs)),
  })
}

function shouldIgnore(relativePath) {
  const normalized = normalizePath(relativePath)
  if (normalized.startsWith(".git/")) {
    return true
  }
  if (normalized.startsWith("node_modules/")) {
    return true
  }
  if (normalized.startsWith("logs/")) {
    return true
  }
  if (normalized.startsWith("art-pipeline/logs/")) {
    return true
  }
  if (normalized === ".env.local") {
    return true
  }
  if (normalized.endsWith(".tmp")) {
    return true
  }
  return false
}

async function writeComplianceBundle() {
  const createdAt = new Date().toISOString()
  const complianceRoot = path.resolve(targetRoot, "COMPLIANCE")

  const manifest = {
    generatedAt: createdAt,
    sourceProject: projectRoot,
    targetProject: targetRoot,
    profile,
    files: copied,
  }

  const declarationTemplate = [
    "# Third-Party / Prior Work Declaration",
    "",
    "Fill this file before submission. Do not leave hidden imports.",
    `Contest window: ${contestWindowLabel}.`,
    "All AI-generated assets/code/content used in the final submission must be regenerated during the contest window.",
    "Evaluation emphasis: express the core playable idea clearly within the timebox; avoid replacing core design with pure asset accumulation.",
    "",
    "## 0) Pre-Contest Ideas / References (optional)",
    "",
    "| Item | First Noted Time | How It Was Re-created During Contest |",
    "|---|---|---|",
    "| Example mechanic idea | 2026-03-20 | Reimplemented from scratch on 2026-03-25 |",
    "",
    "## 1) Imported Code / Assets",
    "",
    "| Path | Source | Purpose | Modified During Contest (Y/N) | Included In Final Build (Y/N) |",
    "|---|---|---|---|---|",
    "| example/path | source url or repo | why used | Y | Y |",
    "",
    "## 2) External Dependencies",
    "",
    "| Dependency | Version | License | Usage |",
    "|---|---|---|---|",
    "| package-name | 1.0.0 | MIT | runtime |",
    "",
    "## 3) AI-Generated Outputs (must be regenerated during contest)",
    "",
    "| Output Path | Prompt Summary | Model/Provider | Generated At (local time) | Regenerated In Contest Window (Y/N) | Evidence Path |",
    "|---|---|---|---|---|---|",
    "| assets/monsters/example.png | fire wolf | proxy/gemini | 2026-03-24 20:30 | Y | logs/ai/example.json |",
    "",
    "If an old AI output is referenced from pre-contest learning, regenerate an equivalent output in contest period and use the regenerated one in final build.",
    "",
    "## 4) Self-Check",
    "",
    "- [ ] No hidden pre-contest files are included.",
    `- [ ] All final implementation work was completed during ${contestWindowLabel}.`,
    "- [ ] All final AI outputs are regenerated during contest window and have evidence paths.",
    "- [ ] All third-party code/material is declared with source and purpose.",
    "- [ ] Contest-period modifications are clearly marked.",
    "- [ ] Any pre-contest references are explicitly declared and traced.",
  ].join("\n")

  const creationJournal = [
    "# Creation Journal",
    "",
    `- Contest window: ${contestWindowLabel}`,
    `- Contest bootstrap time: ${createdAt}`,
    `- Source project: ${projectRoot}`,
    `- Target project: ${targetRoot}`,
    `- Profile: ${profile}`,
    "",
    "## Daily Log",
    "",
    "### 2026-03-24",
    "- Time range: HH:mm - HH:mm",
    "- Work completed:",
    "- Core experience progress (what became more playable/fun today):",
    "- AI outputs regenerated today (path + prompt summary + provider):",
    "- Imported/Referenced old resources declared?:",
    "- Validation evidence (command/log/screenshot path):",
    "- Notes for tomorrow:",
  ].join("\n")

  const submitChecklist = [
    "# Submit Checklist",
    "",
    "## Timeline",
    `- [ ] All final work completed during contest window (${contestWindowLabel}).`,
    "- [ ] If pre-contest drafts existed, final deliverables were reimplemented/refined during contest window.",
    "",
    "## AI Fairness",
    "- [ ] All AI-generated code/design/copy/assets used in final build were regenerated during contest window.",
    "- [ ] Every final AI output has a trace entry (time, prompt summary, provider, artifact path).",
    "",
    "## Source Disclosure",
    "- [ ] Third-party code/material declared in `COMPLIANCE/third-party-declaration.md`.",
    "- [ ] No hidden references or undeclared borrowed content.",
    "- [ ] Any pre-contest resources are listed with source/purpose and contest-period rework status.",
    "",
    "## Process Evidence",
    "- [ ] `COMPLIANCE/creation-journal.md` has daily entries for contest days with concrete evidence.",
    "",
    "## Demo Scope",
    "- [ ] Opening guide -> capture -> level/switch/items -> gym battle -> rewards -> save/load.",
    "- [ ] Core idea and key experience are clearly playable; no over-reliance on asset quantity to mask missing gameplay loop.",
    "",
    "## Technical",
    "- [ ] `npm install` runs successfully.",
    "- [ ] `npm run dev` launches.",
    "- [ ] Acceptance checks pass.",
  ].join("\n")

  if (!dryRun) {
    await fs.mkdir(complianceRoot, { recursive: true })
    await fs.writeFile(
      path.resolve(complianceRoot, "import-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8"
    )
    await fs.writeFile(
      path.resolve(complianceRoot, "third-party-declaration.md"),
      `${declarationTemplate}\n`,
      "utf8"
    )
    await fs.writeFile(path.resolve(complianceRoot, "creation-journal.md"), `${creationJournal}\n`, "utf8")
    await fs.writeFile(path.resolve(complianceRoot, "submit-checklist.md"), `${submitChecklist}\n`, "utf8")
  }
}

async function writeReadmeIfMissing() {
  const readmePath = path.resolve(targetRoot, "README-COMPETITION-BOOTSTRAP.md")
  if (dryRun) {
    return
  }
  const content = [
    "# Competition Bootstrap Notes",
    "",
    `This project was bootstrapped for the contest window (${contestWindowLabel}).`,
    "",
    "## Quick Start",
    "1. `npm install`",
    "2. `npm run dev`",
    "3. Open `http://127.0.0.1:4310`",
    "",
    "## Compliance",
    "- Re-generate final AI outputs during contest window; do not submit pre-contest AI artifacts directly.",
    "- Keep scope decisions aligned to core-experience-first: ship the smallest complete loop first, then add packaging.",
    "- Fill `COMPLIANCE/third-party-declaration.md` before submission.",
    "- Keep `COMPLIANCE/creation-journal.md` updated daily.",
    "- Keep `COMPLIANCE/import-manifest.json` as import evidence.",
  ].join("\n")
  await fs.writeFile(readmePath, `${content}\n`, "utf8")
}

function parseArgs(argv) {
  const output = {}
  let index = 0
  while (index < argv.length) {
    const current = argv[index]
    if (!current.startsWith("--")) {
      index += 1
      continue
    }
    const key = current.slice(2)
    if (["dry-run", "force", "help"].includes(key)) {
      output[key] = true
      index += 1
      continue
    }
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) {
      output[key] = ""
      index += 1
      continue
    }
    output[key] = next
    index += 2
  }
  if (output.help) {
    printHelp()
    process.exit(0)
  }
  return output
}

function printHelp(errorMessage = "") {
  if (errorMessage) {
    console.error(errorMessage)
    console.error("")
  }
  console.log("Usage:")
  console.log("node scripts/bootstrap-competition-project.mjs --target <path> [--profile web-minimal|web-full] [--dry-run] [--force]")
  console.log("")
  console.log("Examples:")
  console.log("node scripts/bootstrap-competition-project.mjs --target ..\\GBIT_GAME_CONTEST --profile web-minimal")
  console.log("node scripts/bootstrap-competition-project.mjs --target E:\\\\Contest\\\\GBIT_GAME --profile web-full --force")
}

function normalizePath(filePath) {
  return String(filePath || "").replace(/\\/g, "/")
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex")
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch (error) {
    return false
  }
}

async function safeStat(targetPath) {
  try {
    return await fs.stat(targetPath)
  } catch (error) {
    return null
  }
}
