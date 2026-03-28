import test from "node:test"
import assert from "node:assert/strict"
import { isPlayerCharacterAssetId, resolveCharacterAssetDir } from "../character-asset-paths.mjs"

test("player-like ids route to player directory", () => {
  assert.equal(resolveCharacterAssetDir("player"), "player")
  assert.equal(resolveCharacterAssetDir("player_9dc5d6c1"), "player")
  assert.equal(resolveCharacterAssetDir("female_urban_v1"), "player")
  assert.equal(resolveCharacterAssetDir("male_hotblood_v1"), "player")
  assert.equal(isPlayerCharacterAssetId("player_abc"), true)
})

test("npc-like ids route to npc directory", () => {
  assert.equal(resolveCharacterAssetDir("professor"), "npc")
  assert.equal(resolveCharacterAssetDir("caretaker"), "npc")
  assert.equal(resolveCharacterAssetDir("home_spring"), "npc")
  assert.equal(resolveCharacterAssetDir("npc_guard_a"), "npc")
  assert.equal(isPlayerCharacterAssetId("npc_guard_a"), false)
})

