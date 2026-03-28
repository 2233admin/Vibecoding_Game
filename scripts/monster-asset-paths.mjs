import path from "node:path"

const LEGENDARY_SPECIES = new Set(["solaraith", "abyssalor", "verdion", "stormcrest", "frostplume"])

const EVOLUTION_EDGES = Object.freeze({
  sprigoon: "thornlynx",
  embercub: "blazehound",
  aquaffin: "tideshell",
  beetbit: "mosscarab",
  drillmole: "quakeburrow",
  rivulet: "torrentail",
  reedimp: "bloomantis",
  pixibud: "aurorabbit",
  coralyn: "tidecelest",
  mossfawn: "florastag",
  cinderpup: "sunfang",
  sunfang: "warmaul",
  snowkit: "aurorafang",
})

const STAGE_BY_SPECIES = buildSpeciesStageMap(EVOLUTION_EDGES)

function buildSpeciesStageMap(edges) {
  const stageMap = new Map()
  const children = new Set(Object.values(edges))
  const speciesSet = new Set([...Object.keys(edges), ...children])
  const roots = [...speciesSet].filter((speciesId) => !children.has(speciesId))

  const queue = roots.map((speciesId) => ({ speciesId, stage: 0 }))
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }
    const { speciesId, stage } = current
    if (stageMap.has(speciesId) && stageMap.get(speciesId) <= stage) {
      continue
    }
    stageMap.set(speciesId, stage)
    const next = edges[speciesId]
    if (next) {
      queue.push({
        speciesId: next,
        stage: Math.min(stage + 1, 2),
      })
    }
  }

  return stageMap
}

function normalizeAssetId(assetId) {
  return String(assetId || "")
    .trim()
    .toLowerCase()
}

function normalizeExtension(extension) {
  const normalized = String(extension || "")
    .trim()
    .toLowerCase()
  if (!normalized) {
    return ".png"
  }
  if (normalized === ".jpeg") {
    return ".jpg"
  }
  if (normalized.startsWith(".")) {
    return normalized
  }
  return `.${normalized}`
}

function inferSpeciesId(assetId) {
  const key = normalizeAssetId(assetId)
  if (!key) {
    return "unknown"
  }

  const dexMatch = key.match(/^dex_([a-z0-9]+)_v\d+$/)
  if (dexMatch) {
    return dexMatch[1]
  }

  const presetMatch = key.match(/^preset_([a-z0-9]+)_.+$/)
  if (presetMatch) {
    return presetMatch[1]
  }

  const evoMatch = key.match(/^evo_([a-z0-9]+)_.+_t\d+$/)
  if (evoMatch) {
    return evoMatch[1]
  }

  const fusionMatch = key.match(/^([a-z0-9]+)_.+_fusion$/)
  if (fusionMatch) {
    return fusionMatch[1]
  }

  if (STAGE_BY_SPECIES.has(key) || LEGENDARY_SPECIES.has(key)) {
    return key
  }

  return key.split("_")[0] || key
}

function inferFormGroup(assetId) {
  const key = normalizeAssetId(assetId)
  if (!key) {
    return "base"
  }

  if (key.startsWith("dex_")) {
    return "base"
  }

  if (key.startsWith("preset_")) {
    return "fusion"
  }

  const evoMatch = key.match(/^evo_[a-z0-9]+_(.+)_([a-z0-9]+)_t(\d+)$/)
  if (evoMatch) {
    const recipe = evoMatch[1]
    const archetype = evoMatch[2]
    if (recipe.startsWith("devour_") || archetype === "devour") {
      return "devour"
    }
    return "fusion"
  }

  if (key.includes("_fusion")) {
    return "fusion"
  }

  if (key.includes("devour")) {
    return "devour"
  }

  return "base"
}

function inferStage(assetId, speciesId, formGroup) {
  const key = normalizeAssetId(assetId)
  const speciesStage = STAGE_BY_SPECIES.has(speciesId) ? STAGE_BY_SPECIES.get(speciesId) : 0

  const stageToken = key.match(/(?:^|_)s([0-2])(?:_|$)/)
  if (stageToken) {
    return Number(stageToken[1])
  }

  if (formGroup !== "base") {
    const tierToken = key.match(/_t(\d+)$/)
    if (tierToken) {
      const tier = Number.parseInt(tierToken[1], 10)
      if (Number.isFinite(tier)) {
        return Math.max(speciesStage, Math.min(tier <= 1 ? 1 : 2, 2))
      }
    }
  }

  return Math.min(Math.max(speciesStage, 0), 2)
}

export function classifyMonsterAsset(assetId) {
  const key = normalizeAssetId(assetId)
  const speciesId = inferSpeciesId(key)
  const formGroup = inferFormGroup(key)
  const stage = inferStage(key, speciesId, formGroup)
  const rarity = LEGENDARY_SPECIES.has(speciesId) ? "legendary" : "normal"

  return {
    assetId: key,
    speciesId,
    formGroup,
    rarity,
    stage,
  }
}

export function resolveMonsterAssetRelativePath(assetId, extension = ".png") {
  const info = classifyMonsterAsset(assetId)
  const ext = normalizeExtension(extension)
  return path.posix.join(
    "assets",
    "monsters",
    info.rarity,
    info.speciesId,
    info.formGroup,
    `stage${info.stage}`,
    `${info.assetId}${ext}`
  )
}

