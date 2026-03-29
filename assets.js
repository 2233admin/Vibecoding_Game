const generatedAssets = window.GBIT_ASSETS_GENERATED || {
  scene: {},
  tiles: {},
  characters: {},
  monsters: {},
}

const manualAssets = {
  scene: {
    town: "assets/scene/town.jpg",
    home: "assets/scene/home.jpg",
    route: "assets/scene/route.jpg",
    meadow: "assets/scene/meadow.jpg",
    lake: "assets/scene/lake.jpg",
    orchard: "assets/scene/orchard.jpg",
    reef: "assets/scene/reef.jpg",
    cave: "assets/scene/cave.jpg",
    deep_cave: "assets/scene/deep_cave.jpg",
    ridge: "assets/scene/ridge.jpg",
    islet: "assets/scene/islet.jpg",
    sanctum: "assets/scene/sanctum.jpg",
    gym: "assets/scene/gym.jpg",
  },
  tiles: {
    // town_ground: "assets/tiles/town-ground.png",
    // town_wall: "assets/tiles/town-wall.png",
    // route_ground: "assets/tiles/route-ground.png",
    // route_grass: "assets/tiles/route-grass.png",
    // gym_ground: "assets/tiles/gym-ground.png",
    // gym_wall: "assets/tiles/gym-wall.png",
    // fountain: "assets/tiles/fountain.png",
    // lab: "assets/tiles/lab.png",
    // gym_door: "assets/tiles/gym-door.png",
    // exit_right: "assets/tiles/exit-right.png",
    // exit_left: "assets/tiles/exit-left.png",
    // exit_down: "assets/tiles/exit-down.png",
  },
  ui: {
    // 镜前登记主视觉插画
    ui_identity_register_keyart_v1: "assets/ui/identity/ui_identity_register_keyart_v1.jpg",
    // 全局地图面板
    "world-map-bg":        "assets/ui/map/world-map-bg.jpg",
    "map-pin-unlocked":    "assets/ui/map/map-pin-unlocked.png",
    "map-pin-locked":      "assets/ui/map/map-pin-locked.png",
    "map-panel-frame":     "assets/ui/map/map-panel-frame.png",
  },
  characters: {
    // player: "assets/characters/player/player.png",
    // professor: "assets/characters/npc/professor.png",
    // caretaker: "assets/characters/npc/caretaker.png",
    // scout: "assets/characters/npc/scout.png",
    // leader: "assets/characters/npc/leader.png",
    leader: "assets/characters/npc/leader.jpg",
  },
  monsters: {
    // ---- 普通物种：plain speciesId 别名，指向最佳 v1 立绘 ----
    // starter 进化链
    sprigoon:     "assets/monsters/normal/sprigoon/base/stage0/dex_sprigoon_v1.jpg",
    thornlynx:    "assets/monsters/normal/thornlynx/base/stage1/dex_thornlynx_v1.jpg",
    embercub:     "assets/monsters/normal/embercub/base/stage0/dex_embercub_v1.jpg",
    blazehound:   "assets/monsters/normal/blazehound/base/stage1/dex_blazehound_v1.jpg",
    aquaffin:     "assets/monsters/normal/aquaffin/base/stage0/dex_aquaffin_v1.jpg",
    tideshell:    "assets/monsters/normal/tideshell/base/stage1/dex_tideshell_v1.jpg",
    cinderpup:    "assets/monsters/normal/cinderpup/base/stage0/dex_cinderpup_v1.jpg",
    sunfang:      "assets/monsters/normal/sunfang/base/stage1/dex_sunfang_v1.jpg",
    warmaul:      "assets/monsters/normal/warmaul/base/stage2/dex_warmaul_v1.jpg",
    snowkit:      "assets/monsters/normal/snowkit/base/stage0/snowkit.png",
    aurorafang:   "assets/monsters/normal/aurorafang/base/stage1/aurorafang.png",
    // 野怪：无进化
    voltkit:      "assets/monsters/normal/voltkit/base/stage0/dex_voltkit_v1.jpg",
    stonehorn:    "assets/monsters/normal/stonehorn/base/stage0/dex_stonehorn_v1.jpg",
    flarehawk:    "assets/monsters/normal/flarehawk/base/stage0/dex_flarehawk_v1.jpg",
    windthorn:    "assets/monsters/normal/windthorn/base/stage0/dex_windthorn_v1.jpg",
    galeafawn:    "assets/monsters/normal/galeafawn/base/stage0/dex_galeafawn_v1.jpg",
    // 野怪：有进化
    beetbit:      "assets/monsters/normal/beetbit/base/stage0/dex_beetbit_v1.jpg",
    mosscarab:    "assets/monsters/normal/mosscarab/base/stage1/dex_mosscarab_v1.jpg",
    drillmole:    "assets/monsters/normal/drillmole/base/stage0/dex_drillmole_v1.jpg",
    quakeburrow:  "assets/monsters/normal/quakeburrow/base/stage1/dex_quakeburrow_v1.jpg",
    rivulet:      "assets/monsters/normal/rivulet/base/stage0/dex_rivulet_v1.jpg",
    torrentail:   "assets/monsters/normal/torrentail/base/stage1/dex_torrentail_v1.jpg",
    reedimp:      "assets/monsters/normal/reedimp/base/stage0/dex_reedimp_v1.jpg",
    bloomantis:   "assets/monsters/normal/bloomantis/base/stage1/dex_bloomantis_v1.jpg",
    pixibud:      "assets/monsters/normal/pixibud/base/stage0/dex_pixibud_v1.jpg",
    aurorabbit:   "assets/monsters/normal/aurorabbit/base/stage1/dex_aurorabbit_v1.jpg",
    coralyn:      "assets/monsters/normal/coralyn/base/stage0/dex_coralyn_v1.jpg",
    tidecelest:   "assets/monsters/normal/tidecelest/base/stage1/dex_tidecelest_v1.jpg",
    mossfawn:     "assets/monsters/normal/mossfawn/base/stage0/dex_mossfawn_v1.jpg",
    florastag:    "assets/monsters/normal/florastag/base/stage1/dex_florastag_v1.jpg",
    // ---- 传说级 ----
    verdion:      "assets/monsters/legendary/verdion/base/stage0/dex_verdion_v1.jpg",
    solaraith:    "assets/monsters/legendary/solaraith/base/stage0/dex_solaraith_v1.jpg",
    abyssalor:    "assets/monsters/legendary/abyssalor/base/stage0/dex_abyssalor_v1.png",
    stormcrest:   "assets/monsters/legendary/stormcrest/base/stage0/dex_stormcrest_v1.jpg",
    frostplume:   "assets/monsters/legendary/frostplume/base/stage0/dex_frostplume_v1.jpg",
    // ---- 黄金10分钟神兽资产 ----
    // solaraith 完全体（开场演出 + 融合流派标志）v2: 双翼火/晶对比，融合感明确
    solaraith_full:      "assets/monsters/legendary/solaraith/base/stage2/solaraith_s2_full_v3.jpg",
    // abyssalor 完全体（开场演出 + 吞噬流派标志）v3: 深渊宇宙恐怖，void core 明确
    abyssalor_full:      "assets/monsters/legendary/abyssalor/base/stage2/abyssalor_s2_full_v3.jpg",
    // 幼体（出村后必遇必捕）v2: 保持龙形血统，solaraith 幼体改为四足金色小龙
    solaraith_cub:       "assets/monsters/legendary/solaraith/base/stage0/solaraith_s0_cub_v2.jpg",
    abyssalor_cub:       "assets/monsters/legendary/abyssalor/base/stage0/abyssalor_s0_cub_v1.jpg",
    // 教学素材（融合教学：地面系 + 有翼系）
    quakeburrow_tutorial: "assets/monsters/normal/quakeburrow/base/stage0/quakeburrow_s0_tutorial_v1.jpg",
    windthorn_tutorial:  "assets/monsters/normal/windthorn/base/stage0/windthorn_tutorial_v1.jpg",
    // 吞噬教学演示（传说兽 + 神剑吞噬）
    abyssalor_devour_sword: "assets/monsters/legendary/abyssalor/devour/stage2/evo_abyssalor_devour_sword_t2.jpg",
    // 神剑单体图（吞噬教学步骤2/3 注入权能）
    divine_sword:        "assets/monsters/normal/divine/base/stage0/divine_sword_v1.jpg",
  },
}

window.GBIT_ASSETS = {
  scene: {
    ...(generatedAssets.scene || {}),
    ...(manualAssets.scene || {}),
  },
  tiles: {
    ...(generatedAssets.tiles || {}),
    ...(manualAssets.tiles || {}),
  },
  characters: {
    ...(generatedAssets.characters || {}),
    ...(manualAssets.characters || {}),
  },
  monsters: {
    ...(generatedAssets.monsters || {}),
    ...(manualAssets.monsters || {}),
  },
  ui: {
    ...(manualAssets.ui || {}),
  },
}
