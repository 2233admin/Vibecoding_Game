const evolutionBlendSkill = Object.freeze({
  id: "evolution-blend-skill",
  version: "1.0.1",
  summary:
    "Unified multi-reference image editing skill for Fusion and Devour evolutions.",
  model: "gemini-3.1-flash-image-preview",
  generationDefaults: Object.freeze({
    responseModalities: Object.freeze(["TEXT", "IMAGE"]),
    imageConfig: Object.freeze({
      aspectRatio: "5:4",
      imageSize: "2K",
    }),
  }),
  guardrails: Object.freeze([
    "official Pokemon-style art, flat cel-shading, bold clean outlines, smooth color fills, chibi proportions, no realistic textures, no painterly brush strokes",
    "single creature only, no human, no text, no watermark",
    "solid white background, no checkerboard, no transparency pattern",
  ]),
  modes: Object.freeze({
    fusion: Object.freeze({
      key: "fusion",
      label: "Fusion Evolution",
      defaultArchetype: "elemental",
      referencePolicy: Object.freeze({
        includeTarget: true,
        includeDonor: false,
        maxReferences: 3,
      }),
    }),
    devour: Object.freeze({
      key: "devour",
      label: "Devour Evolution",
      defaultArchetype: "devour",
      referencePolicy: Object.freeze({
        includeTarget: true,
        includeDonor: true,
        maxReferences: 4,
      }),
    }),
  }),
  fusionPresets: Object.freeze({
    grass: Object.freeze({
      title: "Verdant Resonance Form",
      archetype: "resonance",
      promptStyle:
        "large leaf mantle draped over shoulders, flower bud or seedling sprouting from back, vine tendrils coiling around limbs, forest-green body accents, pollen spore particles floating around",
    }),
    fire: Object.freeze({
      title: "Blazing Surge Form",
      archetype: "elemental",
      promptStyle:
        "flame markings etched along spine and tail, fire crown or flame mane on head, glowing ember eyes, orange-red rim light, heat shimmer distortion rising from body",
    }),
    water: Object.freeze({
      title: "Tidal Warden Form",
      archetype: "elemental",
      promptStyle:
        "translucent fin crest on head and back, teardrop water-drop scale patterns on body, teal-blue glow at edges, foam and bubble particles around feet, cool wet sheen on skin",
    }),
    bug: Object.freeze({
      title: "Carapace Sync Form",
      archetype: "resonance",
      promptStyle:
        "iridescent insect wings sprouting from back, chitin shell plating on limbs and torso, compound-eye glow, thin antennae on head, bioluminescent vein patterns across body",
    }),
    electric: Object.freeze({
      title: "Arc Drive Form",
      archetype: "elemental",
      promptStyle:
        "jagged yellow lightning-bolt stripes running along body, electric spark burst at claw tips and tail end, glowing neon-yellow eyes, crackling static aura surrounding silhouette",
    }),
    rock: Object.freeze({
      title: "Granite Bastion Form",
      archetype: "elemental",
      promptStyle:
        "rough crystal-ore armor plates fused to shoulders and back, gem shards embedded in forehead and knuckles, heavy broad silhouette, grey-brown stone texture on outer surface, dust cloud aura",
    }),
    fairy: Object.freeze({
      title: "Moon Oath Form",
      archetype: "shiny",
      promptStyle:
        "crescent moon halo floating above head, delicate translucent fairy wings, star-sparkle particle trail behind body, pastel pink-lavender color accent on ears and tips, soft ethereal glow",
    }),
    sun: Object.freeze({
      title: "Solar Radiance Form",
      archetype: "shiny",
      promptStyle:
        "golden solar crown with radiating light-ray spikes, warm white-gold full-body glow, sun-disc emblem on chest, confident heroic upright pose, lens-flare rim light",
    }),
    weapon: Object.freeze({
      title: "Warframe Form",
      archetype: "warrior",
      promptStyle:
        "creature gripping or biting a fantasy weapon (sword or spear or axe) in its mouth or claws, weapon design echoes creature body color, forged-metal blade fused with natural body features, battle-ready combat stance, sharp metallic glint",
    }),
  }),
  devourPreset: Object.freeze({
    title: "Void Ravager Form",
    archetype: "devour",
    promptStyle:
      "void tendrils, predator aura, absorbed trait echoes, unstable power distortion",
  }),
})

function normalizeMutationLite(rawMutation = null) {
  const mutation = rawMutation && typeof rawMutation === "object" ? rawMutation : {}
  const tierValue = Number.parseInt(mutation.tier, 10)
  const tier = Number.isFinite(tierValue) ? clampNumber(tierValue, 0, 8) : 0
  const archetype = String(mutation.archetype || "none").trim() || "none"
  const mode = mutation.mode === "fusion" || mutation.mode === "devour" ? mutation.mode : "none"
  const lastRecipe = typeof mutation.lastRecipe === "string" && mutation.lastRecipe ? mutation.lastRecipe : null
  const portraitKey =
    typeof mutation.portraitKey === "string" && mutation.portraitKey ? mutation.portraitKey : null
  const trait = typeof mutation.trait === "string" && mutation.trait ? mutation.trait : null

  return {
    tier,
    archetype,
    mode,
    lastRecipe,
    portraitKey,
    trait,
  }
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function sanitizeToken(value, fallback = "base") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
  return normalized || fallback
}

function resolveModeKey(source) {
  return source === "devour" ? "devour" : "fusion"
}

function resolveTypeLabel(monster) {
  if (typeof getSpeciesTypes !== "function") {
    return "normal"
  }
  const types = getSpeciesTypes(monster)
  if (typeof formatTypeLabel === "function") {
    return formatTypeLabel(types)
  }
  return Array.isArray(types) ? types.join("/") : "normal"
}

function resolveSpeciesName(speciesId) {
  if (typeof speciesData !== "object" || !speciesData?.[speciesId]) {
    return speciesId || "monster"
  }
  return speciesData[speciesId].name
}

function resolveFusionPreset(element) {
  const key = sanitizeToken(element, "grass")
  return (
    evolutionBlendSkill.fusionPresets[key] || {
      title: `${key} resonance form`,
      archetype: "elemental",
      promptStyle: `${key} elemental motif, polished anime creature redesign`,
    }
  )
}

function resolveEvolutionPreset(modeKey, recipe) {
  if (modeKey === "devour") {
    return evolutionBlendSkill.devourPreset
  }
  return resolveFusionPreset(recipe)
}

function resolveEvolutionArchetype({ design, preset, mutation, modeConfig }) {
  const designed = String(design?.archetype || "").trim()
  if (designed) {
    return sanitizeToken(designed, modeConfig.defaultArchetype)
  }
  if (preset?.archetype) {
    return sanitizeToken(preset.archetype, modeConfig.defaultArchetype)
  }
  if (mutation?.archetype && mutation.archetype !== "none") {
    return sanitizeToken(mutation.archetype, modeConfig.defaultArchetype)
  }
  return sanitizeToken(modeConfig.defaultArchetype, "elemental")
}

function buildEvolutionArtKey(profile) {
  const safeRecipe = sanitizeToken(profile.recipe, "base")
  const safeArchetype = sanitizeToken(profile.archetype, "elemental")
  if (profile.variant === "preset") {
    return `preset_${profile.speciesId}_${safeRecipe}_${safeArchetype}`
  }
  return `evo_${profile.speciesId}_${safeRecipe}_${safeArchetype}_t${profile.tier}`
}

function buildEvolutionBlendProfile({
  monster,
  recipe,
  source,
  donor = null,
  design = null,
  variant = "live",
} = {}) {
  if (!monster || !monster.speciesId) {
    return null
  }

  const modeKey = resolveModeKey(source)
  const modeConfig = evolutionBlendSkill.modes[modeKey]
  const mutation = normalizeMutationLite(monster.mutation)
  const preset = resolveEvolutionPreset(modeKey, recipe)
  const speciesName = resolveSpeciesName(monster.speciesId)
  const donorName = donor?.speciesId ? resolveSpeciesName(donor.speciesId) : ""
  const tier = clampNumber(mutation.tier || 0, 0, 8)
  const archetype = resolveEvolutionArchetype({
    design,
    preset,
    mutation,
    modeConfig,
  })
  const fallbackTitle =
    modeKey === "devour" ? `${speciesName} devour form` : `${speciesName} ${preset.title || "fusion form"}`
  const title = String(design?.title || preset.title || fallbackTitle).trim() || fallbackTitle
  const designedStyle = String(design?.promptStyle || "").trim()
  const presetStyle = String(preset.promptStyle || "").trim()
  const promptStyle = [presetStyle, designedStyle].filter(Boolean).join(", ")
  const typeLabel = resolveTypeLabel(monster)
  const recipeLabel =
    modeKey === "devour"
      ? donorName
        ? `devour ${donorName}`
        : "devour evolution"
      : `fusion ${resolveFusionDisplayName(recipe)}`

  const profile = {
    skillId: evolutionBlendSkill.id,
    modeKey,
    modeConfig,
    preset,
    speciesId: monster.speciesId,
    speciesName,
    donorName,
    recipe: recipe || modeKey,
    recipeLabel,
    title,
    promptStyle,
    typeLabel,
    tier,
    archetype,
    variant: variant === "preset" ? "preset" : "live",
  }
  profile.artKey = buildEvolutionArtKey(profile)
  return profile
}

function resolveFusionDisplayName(element) {
  if (typeof getFusionDisplayName === "function") {
    return getFusionDisplayName(element)
  }
  if (typeof typeNames === "object" && typeNames?.[element]) {
    return typeNames[element]
  }
  return String(element || "element")
}

function buildEvolutionBlendPrompt(profile) {
  if (!profile) {
    return ""
  }
  return [
    `${profile.speciesName}, evolved monster portrait, ${profile.recipeLabel}`,
    `evolution title: ${profile.title}`,
    `dual-type style: ${profile.typeLabel}`,
    `mutation tier ${profile.tier}, archetype ${profile.archetype}`,
    profile.promptStyle,
    ...evolutionBlendSkill.guardrails,
  ]
    .filter(Boolean)
    .join(", ")
}

function buildMonsterFallbackArtKeys(monster) {
  if (!monster || !monster.speciesId) {
    return []
  }
  const mutation = normalizeMutationLite(monster.mutation)
  const keys = []
  if (mutation.portraitKey) {
    keys.push(mutation.portraitKey)
  }
  if (mutation.tier > 0) {
    const recipe = mutation.lastRecipe || mutation.mode || "base"
    keys.push(`evo_${monster.speciesId}_${sanitizeToken(recipe)}_${sanitizeToken(mutation.archetype)}_t${mutation.tier}`)
  }
  keys.push(monster.speciesId)
  return keys
}

function resolveMonsterPortraitSource(monster) {
  if (!monster) {
    return null
  }
  const manifest = ART_MANIFEST?.monsters || {}
  const keys =
    typeof getMonsterArtKeys === "function"
      ? getMonsterArtKeys(monster)
      : buildMonsterFallbackArtKeys(monster)

  for (const key of keys) {
    const src = manifest[key]
    if (typeof src === "string" && src.trim()) {
      return src
    }
  }
  return null
}

function buildEvolutionBlendReferenceImages({
  monster,
  donor = null,
  profile = null,
  extraReferences = [],
} = {}) {
  const modeKey = profile?.modeKey || resolveModeKey(profile?.source || "fusion")
  const modeConfig = evolutionBlendSkill.modes[modeKey]
  const refs = []

  if (modeConfig.referencePolicy.includeTarget) {
    const targetSrc = resolveMonsterPortraitSource(monster)
    if (targetSrc) {
      refs.push({ src: targetSrc })
    }
  }

  if (modeConfig.referencePolicy.includeDonor && donor) {
    const donorSrc = resolveMonsterPortraitSource(donor)
    const targetSrc = refs[0]?.src || ""
    if (donorSrc && donorSrc !== targetSrc) {
      refs.push({ src: donorSrc })
    }
  }

  if (Array.isArray(extraReferences)) {
    for (const ref of extraReferences) {
      if (!ref || typeof ref !== "object") {
        continue
      }
      const src = String(ref.src || "").trim()
      const data = String(ref.data || "").trim()
      const mimeType = String(ref.mimeType || "").trim()
      if (!src && !data) {
        continue
      }
      refs.push({
        ...(src ? { src } : {}),
        ...(data ? { data } : {}),
        ...(mimeType ? { mimeType } : {}),
      })
    }
  }

  const maxReferences = modeConfig.referencePolicy.maxReferences || 4
  return refs.slice(0, maxReferences)
}

function buildEvolutionBlendRequestPayload({
  monster,
  recipe,
  source,
  donor = null,
  design = null,
  variant = "live",
  extraReferences = [],
} = {}) {
  const profile = buildEvolutionBlendProfile({
    monster,
    recipe,
    source,
    donor,
    design,
    variant,
  })
  if (!profile) {
    return null
  }

  const prompt = buildEvolutionBlendPrompt(profile)
  const referenceImages = buildEvolutionBlendReferenceImages({
    monster,
    donor,
    profile,
    extraReferences,
  })

  return {
    profile,
    artKey: profile.artKey,
    prompt,
    referenceImages,
    options: {
      referenceImages,
      imageConfig: {
        ...evolutionBlendSkill.generationDefaults.imageConfig,
      },
      responseModalities: [...evolutionBlendSkill.generationDefaults.responseModalities],
    },
  }
}

function getDefaultFusionPresetElements() {
  return Object.keys(evolutionBlendSkill.fusionPresets)
}

function buildDefaultFusionBatchRequests(monster, options = {}) {
  if (!monster || !monster.speciesId) {
    return []
  }
  const elements =
    Array.isArray(options.elements) && options.elements.length > 0
      ? options.elements.map((entry) => sanitizeToken(entry))
      : getDefaultFusionPresetElements()
  return elements.map((element) => ({
    monster,
    recipe: element,
    source: "fusion",
    donor: null,
    variant: "preset",
    applyToMonster: false,
  }))
}

window.evolutionBlendSkill = evolutionBlendSkill
window.evolutionBlendPipeline = {
  buildProfile: buildEvolutionBlendProfile,
  buildPrompt: buildEvolutionBlendPrompt,
  buildReferenceImages: buildEvolutionBlendReferenceImages,
  buildRequestPayload: buildEvolutionBlendRequestPayload,
  getDefaultFusionPresetElements,
  buildDefaultFusionBatchRequests,
  getFusionPreset: resolveFusionPreset,
}
