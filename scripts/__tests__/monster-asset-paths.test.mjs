import test from "node:test"
import assert from "node:assert/strict"
import {
  classifyMonsterAsset,
  resolveMonsterAssetRelativePath,
} from "../monster-asset-paths.mjs"

test("classifies base dex portrait with stage", () => {
  const info = classifyMonsterAsset("dex_sprigoon_v1")
  assert.equal(info.rarity, "normal")
  assert.equal(info.speciesId, "sprigoon")
  assert.equal(info.formGroup, "base")
  assert.equal(info.stage, 0)
  assert.equal(
    resolveMonsterAssetRelativePath("dex_sprigoon_v1", ".jpg"),
    "assets/monsters/normal/sprigoon/base/stage0/dex_sprigoon_v1.jpg"
  )
})

test("classifies fusion keys", () => {
  const info = classifyMonsterAsset("sprigoon_fire_fusion")
  assert.equal(info.formGroup, "fusion")
  assert.equal(info.speciesId, "sprigoon")
  assert.equal(
    resolveMonsterAssetRelativePath("sprigoon_fire_fusion", ".png"),
    "assets/monsters/normal/sprigoon/fusion/stage0/sprigoon_fire_fusion.png"
  )
})

test("classifies devour keys", () => {
  const info = classifyMonsterAsset("evo_solaraith_devour_fire_devour_t4")
  assert.equal(info.rarity, "legendary")
  assert.equal(info.speciesId, "solaraith")
  assert.equal(info.formGroup, "devour")
  assert.equal(info.stage, 2)
  assert.equal(
    resolveMonsterAssetRelativePath("evo_solaraith_devour_fire_devour_t4", ".jpg"),
    "assets/monsters/legendary/solaraith/devour/stage2/evo_solaraith_devour_fire_devour_t4.jpg"
  )
})

test("classifies legendary base portraits", () => {
  const info = classifyMonsterAsset("dex_verdion_v2")
  assert.equal(info.rarity, "legendary")
  assert.equal(info.speciesId, "verdion")
  assert.equal(info.formGroup, "base")
  assert.equal(info.stage, 0)
})

