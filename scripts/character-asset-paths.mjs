const PLAYER_KEY_PREFIXES = ["player", "female_", "male_"]

export function isPlayerCharacterAssetId(assetId) {
  const normalized = String(assetId || "").trim().toLowerCase()
  if (!normalized) {
    return false
  }
  return PLAYER_KEY_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix))
}

export function resolveCharacterAssetDir(assetId) {
  return isPlayerCharacterAssetId(assetId) ? "player" : "npc"
}

