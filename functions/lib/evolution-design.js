// Evolution design via Gemini text API
// Ported from scripts/dev-server.mjs resolveEvolutionDesign()

const ELEMENT_FORMULAS = {
  grass: {
    archetype: "resonance",
    title: (n) => `${n}·翠叶共鸣形`,
    promptStyle: "large leaf mantle draped over shoulders, flower bud sprouting from back, vine tendrils coiling around limbs, forest-green body accents, pollen spore particles floating around",
  },
  fire: {
    archetype: "elemental",
    title: (n) => `${n}·炽焰迸发形`,
    promptStyle: "flame markings etched along spine and tail, fire crown or flame mane on head, glowing ember eyes, orange-red rim light, heat shimmer distortion rising from body",
  },
  water: {
    archetype: "elemental",
    title: (n) => `${n}·潮浪守卫形`,
    promptStyle: "translucent fin crest on head and back, teardrop water-drop scale patterns on body, teal-blue glow at edges, foam and bubble particles around feet, cool wet sheen on skin",
  },
  bug: {
    archetype: "resonance",
    title: (n) => `${n}·甲壳共鸣形`,
    promptStyle: "iridescent insect wings sprouting from back, chitin shell plating on limbs and torso, compound-eye glow, thin antennae on head, bioluminescent vein patterns across body",
  },
  electric: {
    archetype: "elemental",
    title: (n) => `${n}·弧电驱动形`,
    promptStyle: "jagged yellow lightning-bolt stripes running along body, electric spark burst at claw tips and tail end, glowing neon-yellow eyes, crackling static aura surrounding silhouette",
  },
  rock: {
    archetype: "elemental",
    title: (n) => `${n}·花岗要塞形`,
    promptStyle: "rough crystal-ore armor plates fused to shoulders and back, gem shards embedded in forehead and knuckles, heavy broad silhouette, grey-brown stone texture on outer surface, dust cloud aura",
  },
  fairy: {
    archetype: "shiny",
    title: (n) => `${n}·月誓精灵形`,
    promptStyle: "crescent moon halo floating above head, delicate translucent fairy wings, star-sparkle particle trail behind body, pastel pink-lavender color accent on ears and tips, soft ethereal glow",
  },
  sun: {
    archetype: "shiny",
    title: (n) => `${n}·太阳辉耀形`,
    promptStyle: "golden solar crown with radiating light-ray spikes, warm white-gold full-body glow, sun-disc emblem on chest, confident heroic upright pose, lens-flare rim light",
  },
  weapon: {
    archetype: "warrior",
    title: (n) => `${n}·战甲融合形`,
    promptStyle: "creature gripping or biting a fantasy weapon (sword or spear or axe) in its mouth or claws, weapon design echoes creature body color, forged-metal blade fused with natural body features, battle-ready combat stance, sharp metallic glint",
  },
}

export async function resolveEvolutionDesign(payload, env) {
  const speciesName = String(payload.speciesName || "monster").trim()
  const recipe = String(payload.recipe || "fusion").trim().toLowerCase()
  const donorName = String(payload.donorName || "").trim()
  const typeLabel = String(payload.typeLabel || "").trim()

  const fallback = buildFallbackEvolutionDesign({ speciesName, recipe, donorName, typeLabel })

  if (recipe === "devour" || ELEMENT_FORMULAS[recipe]) {
    return { ...fallback, source: "formula" }
  }

  const geminiApiKey = env.GEMINI_API_KEY || ""
  if (!geminiApiKey) return { ...fallback, source: "fallback-no-key" }

  try {
    const raw = await requestGeminiEvolutionDesign({ speciesName, recipe, donorName, typeLabel, env })
    const parsed = parseJsonFromText(raw)
    if (!parsed || typeof parsed !== "object") return { ...fallback, source: "fallback-parse" }
    return {
      archetype: String(parsed.archetype || fallback.archetype).toLowerCase(),
      title: String(parsed.title || fallback.title).trim() || fallback.title,
      promptStyle: String(parsed.promptStyle || fallback.promptStyle).trim() || fallback.promptStyle,
      source: "gemini",
    }
  } catch (error) {
    return { ...fallback, source: "fallback-error", error: error.message }
  }
}

async function requestGeminiEvolutionDesign({ speciesName, recipe, donorName, typeLabel, env }) {
  const apiKey = env.GEMINI_API_KEY
  const baseUrl = env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
  const model = env.GEMINI_TEXT_MODEL || "gemini-2.5-flash"

  const instruction = [
    "You are a game evolution designer.",
    "Return ONLY JSON with keys: archetype, title, promptStyle.",
    "archetype must be one of: elemental, shiny, warrior, devour, resonance.",
    "title must be short Chinese title.",
    "promptStyle must be one short English phrase for image prompt style.",
    `speciesName=${speciesName}`,
    `recipe=${recipe}`,
    `donorName=${donorName || "none"}`,
    `typeLabel=${typeLabel || "unknown"}`,
  ].join("\n")

  const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: instruction }] }],
      generationConfig: { temperature: 0.5 },
    }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result?.error?.message || `Gemini HTTP ${response.status}`)
  const text = result?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").filter(Boolean).join("\n").trim() || ""
  if (!text) throw new Error("Gemini returned empty text")
  return text
}

function buildFallbackEvolutionDesign({ speciesName, recipe, donorName, typeLabel }) {
  if (recipe === "devour") {
    return {
      archetype: "devour",
      title: donorName ? `${speciesName}·吞噬${donorName}` : `${speciesName}·吞噬形态`,
      promptStyle: "predatory evolved creature, darker edge details, absorbed donor trait echoes on body, high-pressure intimidating posture",
    }
  }
  const formula = ELEMENT_FORMULAS[recipe]
  if (formula) {
    return { archetype: formula.archetype, title: formula.title(speciesName), promptStyle: formula.promptStyle }
  }
  return {
    archetype: "elemental",
    title: `${speciesName}·融合形态`,
    promptStyle: `${recipe || typeLabel || "elemental"} type visual effects added to body, dual-type color blending`,
  }
}

function parseJsonFromText(rawText) {
  if (!rawText) return null
  try { return JSON.parse(rawText) } catch (_) {}
  const fenced = rawText.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) { try { return JSON.parse(fenced[1].trim()) } catch (_) {} }
  const objMatch = rawText.match(/\{[\s\S]*\}/)
  if (objMatch?.[0]) { try { return JSON.parse(objMatch[0]) } catch (_) {} }
  return null
}
