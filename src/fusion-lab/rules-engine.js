/**
 * Fusion Lab — Rules Engine (pure functions, no DOM/window/state deps)
 * Mirrors logic from ui-panels.js but decoupled for standalone + server use.
 */

const ELEMENT_TYPES = ["grass", "fire", "water", "bug", "electric", "rock", "fairy"]
const SPECIAL_ELEMENTS = ["sun", "weapon"]
const ALL_ELEMENTS = [...ELEMENT_TYPES, ...SPECIAL_ELEMENTS]
const MAX_SKILLS = 4

const FUSION_SKILL_BY_ELEMENT = {
  grass: "thorn_whip",
  fire: "flame_dash",
  water: "tidal_arc",
  bug: "spore_dust",
  electric: "static_bolt",
  rock: "horn_rush",
  fairy: "fairy_pulse",
  sun: "solar_slice",
  weapon: "shell_breaker",
}

const TYPE_NAMES = {
  normal: "普通", grass: "草", fire: "火", water: "水",
  bug: "虫", electric: "电", rock: "岩", fairy: "妖精",
}

// ── Fusion ────────────────────────────────────────────────────────────────────

function getFusionRequirements(element) {
  if (element === "sun") return { sun: 2, fire: 1, electric: 1 }
  if (element === "weapon") return { weapon: 2, rock: 1, normal: 1 }
  return { [element]: 2 }
}

function getFusionArchetype(baseTypes, element) {
  if (element === "sun" && baseTypes[0] === "normal") return "shiny"
  if (element === "weapon") return "warrior"
  if (ELEMENT_TYPES.includes(element) && baseTypes.includes(element)) return "resonance"
  return "elemental"
}

function getFusionTraitLabel(element, archetype) {
  const name = TYPE_NAMES[element] || element
  if (archetype === "shiny") return `${name}耀辉`
  if (archetype === "warrior") return `${name}武装`
  if (archetype === "resonance") return `${name}共鸣`
  return `${name}同调`
}

function computeFusionTypes(baseTypes, element) {
  const result = [...baseTypes]
  if (ELEMENT_TYPES.includes(element) && !result.includes(element)) {
    result.push(element)
  }
  if (element === "weapon" && !result.includes("rock")) {
    result.push("rock")
  }
  return result.slice(0, 2)
}

function computeFusionSkills(currentSkills, element) {
  const newSkill = FUSION_SKILL_BY_ELEMENT[element]
  if (!newSkill) return { skills: [...currentSkills], replaced: null }
  if (currentSkills.includes(newSkill)) return { skills: [...currentSkills], replaced: null }
  if (currentSkills.length < MAX_SKILLS) {
    return { skills: [...currentSkills, newSkill], replaced: null }
  }
  const replaced = currentSkills[0]
  return { skills: [...currentSkills.slice(1), newSkill], replaced }
}

/**
 * @param {object} base - { speciesId, name, types: string[], skills: string[], mutation: object }
 * @param {string} element
 * @returns {object} evolution result (no side effects)
 */
function computeFusionResult(base, element) {
  if (!ALL_ELEMENTS.includes(element)) {
    return { ok: false, error: `Invalid element: ${element}` }
  }
  const baseTypes = base.types || ["normal"]
  const archetype = getFusionArchetype(baseTypes, element)
  const newTypes = computeFusionTypes(baseTypes, element)
  const trait = getFusionTraitLabel(element, archetype)
  const { skills, replaced } = computeFusionSkills(base.skills || [], element)
  const prevTier = (base.mutation?.tier) || 0
  return {
    ok: true,
    mode: "fusion",
    speciesId: base.speciesId,
    name: base.name,
    element,
    archetype,
    types: newTypes,
    trait,
    skills,
    replacedSkill: replaced,
    tier: Math.min(prevTier + 1, 8),
  }
}

// ── Devour ────────────────────────────────────────────────────────────────────

function getDevourTraitLabel(donorName) {
  return `吞噬印记·${donorName || "素材"}`
}

function computeDevourTypes(baseTypes, donorTypes) {
  const result = [...baseTypes]
  const absorbed = donorTypes.find(t => ELEMENT_TYPES.includes(t)) || donorTypes[0]
  if (absorbed && !result.includes(absorbed)) result.push(absorbed)
  return result.slice(0, 2)
}

function computeDevourSkills(currentSkills, donorSkills, moveData) {
  const ranked = [...(donorSkills || [])]
    .filter(id => moveData[id])
    .sort((a, b) => (moveData[b]?.power || 0) - (moveData[a]?.power || 0))
  const best = ranked[0]
  if (!best) return { skills: [...currentSkills], replaced: null }
  if (currentSkills.includes(best)) return { skills: [...currentSkills], replaced: null }
  if (currentSkills.length < MAX_SKILLS) {
    return { skills: [...currentSkills, best], replaced: null }
  }
  const replaced = currentSkills[0]
  return { skills: [...currentSkills.slice(1), best], replaced }
}

/**
 * @param {object} base - { speciesId, name, types, skills, mutation }
 * @param {object} donor - { speciesId, name, types, skills }
 * @param {object} moveData - full move dictionary
 */
function computeDevourResult(base, donor, moveData) {
  if (!donor) return { ok: false, error: "Donor missing" }
  const baseTypes = base.types || ["normal"]
  const donorTypes = donor.types || ["normal"]
  const newTypes = computeDevourTypes(baseTypes, donorTypes)
  const trait = getDevourTraitLabel(donor.name)
  const { skills, replaced } = computeDevourSkills(base.skills || [], donor.skills || [], moveData)
  const prevTier = (base.mutation?.tier) || 0
  const absorbedType = donorTypes.find(t => ELEMENT_TYPES.includes(t)) || donorTypes[0]
  return {
    ok: true,
    mode: "devour",
    speciesId: base.speciesId,
    name: base.name,
    donorSpeciesId: donor.speciesId,
    donorName: donor.name,
    archetype: "devour",
    types: newTypes,
    absorbedType,
    trait,
    skills,
    replacedSkill: replaced,
    tier: Math.min(prevTier + 2, 8),
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function formatTypeLabel(types) {
  return types.map(t => `${TYPE_NAMES[t] || t}系`).join(" / ")
}

function isValidElement(element) {
  return ALL_ELEMENTS.includes(element)
}

// Export for Node (server) and browser (fusion-lab page)
const FusionRules = {
  ELEMENT_TYPES,
  SPECIAL_ELEMENTS,
  ALL_ELEMENTS,
  FUSION_SKILL_BY_ELEMENT,
  TYPE_NAMES,
  getFusionRequirements,
  getFusionArchetype,
  getFusionTraitLabel,
  computeFusionResult,
  computeDevourResult,
  formatTypeLabel,
  isValidElement,
}

if (typeof module !== "undefined") module.exports = FusionRules
else window.FusionRules = FusionRules