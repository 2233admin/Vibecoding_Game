const BALANCE_CONFIG_STORAGE_KEY = "gbit_balance_config_v1"
const BALANCE_CONFIG_PATH = "config/balance-config.json"

const DEFAULT_BALANCE_CONFIG = Object.freeze({
  version: 1,
  encounter: {
    wildLevelOffsetGlobal: 0,
    wildLevelOffsetByMap: {},
    trainerLevelOffsetGlobal: 0,
    trainerLevelOffsetByTrainer: {},
  },
  economy: {
    shopPriceMultiplier: 1,
    sellPriceMultiplier: 1,
    battleCoinMultiplier: 1,
  },
  qa: {
    enabled: false,
    quickKeysEnabled: false,
    starterKitOnNewGame: false,
    showHomeFacilitiesFromStart: false,
    battleAnimationMultiplier: 1,
  },
})

let balanceConfigRuntime = JSON.parse(JSON.stringify(DEFAULT_BALANCE_CONFIG))

function clampBalanceNumber(value, min, max, fallback) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return fallback
  }
  return Math.min(max, Math.max(min, numeric))
}

function sanitizeNumberMap(raw, min, max) {
  if (!raw || typeof raw !== "object") {
    return {}
  }
  const next = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!key) {
      continue
    }
    const normalized = Number(value)
    if (!Number.isFinite(normalized)) {
      continue
    }
    next[key] = clampBalanceNumber(normalized, min, max, 0)
  }
  return next
}

function sanitizeBalanceConfig(raw) {
  const source = raw && typeof raw === "object" ? raw : {}
  const encounter = source.encounter && typeof source.encounter === "object" ? source.encounter : {}
  const economy = source.economy && typeof source.economy === "object" ? source.economy : {}
  const qa = source.qa && typeof source.qa === "object" ? source.qa : {}
  return {
    version: 1,
    encounter: {
      wildLevelOffsetGlobal: clampBalanceNumber(encounter.wildLevelOffsetGlobal, -20, 20, 0),
      wildLevelOffsetByMap: sanitizeNumberMap(encounter.wildLevelOffsetByMap, -20, 20),
      trainerLevelOffsetGlobal: clampBalanceNumber(encounter.trainerLevelOffsetGlobal, -20, 20, 0),
      trainerLevelOffsetByTrainer: sanitizeNumberMap(encounter.trainerLevelOffsetByTrainer, -20, 20),
    },
    economy: {
      shopPriceMultiplier: clampBalanceNumber(economy.shopPriceMultiplier, 0.2, 5, 1),
      sellPriceMultiplier: clampBalanceNumber(economy.sellPriceMultiplier, 0.2, 5, 1),
      battleCoinMultiplier: clampBalanceNumber(economy.battleCoinMultiplier, 0.2, 5, 1),
    },
    qa: {
      enabled: Boolean(qa.enabled),
      quickKeysEnabled: Boolean(qa.quickKeysEnabled),
      starterKitOnNewGame: Boolean(qa.starterKitOnNewGame),
      showHomeFacilitiesFromStart: Boolean(qa.showHomeFacilitiesFromStart),
      battleAnimationMultiplier: clampBalanceNumber(qa.battleAnimationMultiplier, 0.1, 3, 1),
    },
  }
}

function mergeBalanceConfig(...configs) {
  let next = sanitizeBalanceConfig(DEFAULT_BALANCE_CONFIG)
  for (const cfg of configs) {
    if (!cfg) {
      continue
    }
    next = sanitizeBalanceConfig({
      ...next,
      ...cfg,
      encounter: {
        ...next.encounter,
        ...(cfg.encounter || {}),
        wildLevelOffsetByMap: {
          ...next.encounter.wildLevelOffsetByMap,
          ...((cfg.encounter && cfg.encounter.wildLevelOffsetByMap) || {}),
        },
        trainerLevelOffsetByTrainer: {
          ...next.encounter.trainerLevelOffsetByTrainer,
          ...((cfg.encounter && cfg.encounter.trainerLevelOffsetByTrainer) || {}),
        },
      },
      economy: {
        ...next.economy,
        ...(cfg.economy || {}),
      },
      qa: {
        ...next.qa,
        ...(cfg.qa || {}),
      },
    })
  }
  return next
}

function tryReadLocalBalanceConfig() {
  try {
    const raw = localStorage.getItem(BALANCE_CONFIG_STORAGE_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

async function tryFetchBalanceConfigFile() {
  try {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 1400)
    const response = await fetch(`${BALANCE_CONFIG_PATH}?v=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
    window.clearTimeout(timeoutId)
    if (!response.ok) {
      return null
    }
    const text = await response.text()
    if (!text.trim()) {
      return null
    }
    return JSON.parse(text)
  } catch (error) {
    return null
  }
}

async function initBalanceConfig() {
  const fileConfig = await tryFetchBalanceConfigFile()
  const localConfig = tryReadLocalBalanceConfig()
  balanceConfigRuntime = mergeBalanceConfig(DEFAULT_BALANCE_CONFIG, fileConfig, localConfig)
  return balanceConfigRuntime
}

function getBalanceConfig() {
  return balanceConfigRuntime
}

function getQaConfig() {
  const config = getBalanceConfig()
  const qa = config.qa && typeof config.qa === "object" ? config.qa : {}
  return {
    enabled: Boolean(qa.enabled),
    quickKeysEnabled: Boolean(qa.quickKeysEnabled),
    starterKitOnNewGame: Boolean(qa.starterKitOnNewGame),
    showHomeFacilitiesFromStart: Boolean(qa.showHomeFacilitiesFromStart),
    battleAnimationMultiplier: clampBalanceNumber(qa.battleAnimationMultiplier, 0.1, 3, 1),
  }
}

function getWildLevelOffsetForMap(mapId) {
  const config = getBalanceConfig()
  const mapDelta = Number(config.encounter.wildLevelOffsetByMap?.[mapId] || 0)
  return Math.round(config.encounter.wildLevelOffsetGlobal + mapDelta)
}

function getTrainerLevelOffset(trainerId) {
  const config = getBalanceConfig()
  const trainerDelta = Number(config.encounter.trainerLevelOffsetByTrainer?.[trainerId] || 0)
  return Math.round(config.encounter.trainerLevelOffsetGlobal + trainerDelta)
}

function getBalancedPrice(basePrice) {
  const config = getBalanceConfig()
  const multiplier = Number(config.economy.shopPriceMultiplier || 1)
  return Math.max(0, Math.round(Number(basePrice || 0) * multiplier))
}

function getBalancedSellPrice(basePrice) {
  const config = getBalanceConfig()
  const multiplier = Number(config.economy.sellPriceMultiplier || 1)
  return Math.max(0, Math.round(Number(basePrice || 0) * multiplier))
}

function getBalancedCoinReward(baseCoins) {
  const config = getBalanceConfig()
  const multiplier = Number(config.economy.battleCoinMultiplier || 1)
  return Math.max(0, Math.round(Number(baseCoins || 0) * multiplier))
}
