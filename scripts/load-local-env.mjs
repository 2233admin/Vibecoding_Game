import fs from "node:fs"
import path from "node:path"

const DEFAULT_ENV_FILES = [".env", ".env.local"]

export function loadLocalEnv(projectRoot, options = {}) {
  const root = path.resolve(projectRoot || process.cwd())
  const files = Array.isArray(options.files) && options.files.length > 0 ? options.files : DEFAULT_ENV_FILES
  const override = Boolean(options.override)
  const loadedFiles = []

  for (const relativePath of files) {
    const filePath = path.resolve(root, relativePath)
    if (!fs.existsSync(filePath)) {
      continue
    }

    const raw = fs.readFileSync(filePath, "utf8")
    applyEnvContent(raw, { override })
    loadedFiles.push(filePath)
  }

  return loadedFiles
}

function applyEnvContent(raw, { override }) {
  const lines = String(raw || "").split(/\r?\n/u)
  for (const line of lines) {
    const entry = parseEnvLine(line)
    if (!entry) {
      continue
    }

    if (!override && Object.prototype.hasOwnProperty.call(process.env, entry.key)) {
      continue
    }

    process.env[entry.key] = entry.value
  }
}

function parseEnvLine(line) {
  const trimmed = String(line || "").trim()
  if (!trimmed || trimmed.startsWith("#")) {
    return null
  }

  const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u.exec(trimmed)
  if (!match) {
    return null
  }

  const key = match[1]
  const value = parseEnvValue(match[2])
  return { key, value }
}

function parseEnvValue(rawValue) {
  const raw = String(rawValue || "").trim()
  if (!raw) {
    return ""
  }

  const quote = raw[0]
  if ((quote === '"' || quote === "'") && raw.endsWith(quote)) {
    const body = raw.slice(1, -1)
    if (quote === '"') {
      return body
        .replace(/\\n/gu, "\n")
        .replace(/\\r/gu, "\r")
        .replace(/\\t/gu, "\t")
        .replace(/\\"/gu, '"')
        .replace(/\\\\/gu, "\\")
    }
    return body.replace(/\\'/gu, "'")
  }

  return raw.replace(/\s+#.*$/u, "").trim()
}
