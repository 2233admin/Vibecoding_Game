export const typePromptSuffix = {
  monster:
    "single creature portrait, premium collectible RPG key art, bright elegant fantasy palette, French-inspired adventure mood, centered composition, clean silhouette, readable anatomy, polished anime illustration, refined materials, soft rim light",
  character:
    "single JRPG character concept, full body, stylish adventure fashion, bright luxury palette, clear silhouette, polished digital illustration, readable costume shapes, clean background",
  scene:
    "fantasy game background, wide establishing shot, layered depth, bright cinematic lighting, readable paths and landmarks, polished environment concept art, inviting adventure atmosphere",
  tile:
    "game asset concept, isolated object or tile, readable top-down shape, clean edges, elegant decorative trim, stylized fantasy material rendering",
}

export const presetLibrary = {
  monster: {
    sprigoon: {
      prompt:
        "cute grass seed cat creature, small round body, fresh leaf sprouting from its back, playful expression, emerald and cream palette, bright boutique fantasy companion design",
    },
    thornlynx: {
      prompt:
        "evolved grass lynx creature, agile wildcat body, thorn vine mane, leaf-blade tail, elegant emerald and bark palette, confident expression, collectible evolution design",
    },
    embercub: {
      prompt:
        "cute fire puppy creature, fluffy ember mane, warm orange and gold palette, sparkling highlights, eager battle-ready expression, premium starter creature design",
    },
    blazehound: {
      prompt:
        "evolved fire hound creature, fast athletic body, blazing mane, glowing paws, orange red and ivory palette, heroic fierce expression, polished adventure key art creature",
    },
    aquaffin: {
      prompt:
        "cute water fin creature, small amphibious body, bubble fins, aqua blue and pearl palette, curious lively expression, glossy watery details, elegant mascot design",
    },
    tideshell: {
      prompt:
        "evolved water guardian creature, shell armor, tidal wave motifs, blue teal and ivory palette, sturdy defensive posture, noble expression, polished guardian silhouette",
    },
    beetbit: {
      prompt:
        "cute bug beetle creature, glowing dots on shell, compact rounded body, moss and amber palette, sneaky woodland vibe, bright readable collectible design",
    },
    mosscarab: {
      prompt:
        "evolved moss scarab creature, thick armored shell covered with moss, earthy green and brass palette, heavy durable stance, noble insect guardian vibe",
    },
    voltkit: {
      prompt:
        "cute electric fox creature, fluffy tail charged with sparks, yellow gold and cream palette, quick nimble pose, bright energetic expression, chic fantasy mascot vibe",
    },
    stonehorn: {
      prompt:
        "rock rhinoceros creature, heavy stone armor, thick horn, gray brown and gold trim palette, sturdy tank-like body, intimidating but readable silhouette, polished gym challenger vibe",
    },
  },
  character: {
    player: {
      prompt:
        "young monster trainer, adventurous teen, stylish travel outfit, tailored jacket, satchel, bright city-adventure palette, optimistic expression",
    },
    professor: {
      prompt:
        "friendly monster research professor, field notebook, elegant long coat, scholarly but warm, modern fantasy researcher energy",
    },
    caretaker: {
      prompt:
        "kind monster caretaker, gentle smile, boutique city clothing, healer vibe, supportive presence",
    },
    scout: {
      prompt:
        "route scout and junior trainer, sporty explorer outfit, bright outdoor palette, alert posture, competitive but approachable expression",
    },
    leader: {
      prompt:
        "gym leader of a luminous city arena, striking outfit with rock and electric motifs, elegant champion fashion, composed aura",
    },
  },
  scene: {
    town: {
      prompt:
        "sunlit fantasy starter metropolis plaza, glass arcades, research pavilion, long fountain promenade, radiant boulevards, bright early adventure mood",
    },
    route: {
      prompt:
        "lush garden boulevard route with tall grass, flower meadows, elegant hedges, winding beginner road, bright adventurous daylight, creature encounter atmosphere",
    },
    gym: {
      prompt:
        "stylized luminous gym interior, ceremonial battle hall, geometric floor, gold trim, bright banners, heroic challenge atmosphere",
    },
  },
  tile: {
    town_ground: {
      prompt: "fantasy city plaza ground tile, pale stone paving with gold inlay and soft blue accents, top-down readable texture",
    },
    town_wall: {
      prompt: "fantasy city facade tile, cream stone wall with glass accent and elegant trim, top-down readable structure",
    },
    route_ground: {
      prompt: "garden route path tile, warm trail with grassy flowered edges, top-down readable texture",
    },
    route_grass: {
      prompt: "tall grass encounter tile, lush green with flower highlights, top-down readable texture",
    },
    gym_ground: {
      prompt: "gym floor tile, polished pale stone with ceremonial gold pattern, top-down readable texture",
    },
    gym_wall: {
      prompt: "gym wall tile, polished arena masonry with elegant luminous trim, top-down readable structure",
    },
    fountain: {
      prompt: "fantasy boulevard fountain tile, refined pale stone basin with clear water, top-down readable",
    },
    lab: {
      prompt: "research pavilion tile, glass roof, pale stone base, refined fantasy architecture, top-down readable",
    },
    gym_door: {
      prompt: "gym entrance tile, elegant ceremonial gate with gold trim, top-down readable structure",
    },
  },
}

export function listPresetIds(type) {
  return Object.keys(presetLibrary[type] || {}).sort()
}

export function getPreset(type, id) {
  return presetLibrary[type]?.[id] || null
}
