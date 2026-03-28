# 黄金10分钟美术需求单（给美术 Agent）

最后更新：2026-03-28  
项目路径：`E:/Ai/Vibecoding_Game`

## 1. 目标
- 支撑“黄金10分钟”开场体验：神兽对决 -> 流派二选一 -> 教学实操 -> 梦醒命名 -> 进入主线。
- 本轮仅做视觉资产，不改玩法代码。

## 2. 硬性规则（必须遵守）
- 教学阶段使用的“神兽/素材体”是**教学借用体**，后续会回收（程序侧处理）。
- 玩家出新手村后，遇到自己选择流派对应的神兽幼体，流程是**必遇且必捕**（程序侧处理）。
- 神兽相关立绘走**预设资源优先**，不依赖实时 AI 生图。
- 神兽立绘精度、细节、完成度必须显著高于普通精灵。

## 3. 本轮交付范围

### P0（必须本轮完成）
1. 两大神兽完全体（开场对决主角）
- `solaraith`：融合神兽（融合流派代表）
- `abyssalor`：吞噬神兽（吞噬流派代表）

2. 两大神兽幼体（出村后遭遇）
- `solaraith` 幼体版
- `abyssalor` 幼体版

3. 融合教学素材精灵（用于“地面 + 有翼”演示）
- 地面系：`quakeburrow`
- 有翼系：`windthorn`（飞行感明确）

4. 吞噬教学关键立绘（“传说兽 + 神剑”）
- 以 `abyssalor` 为主体，制作“与神剑结合”的吞噬演示立绘（1 张主图）

### P1（有余力再做）
1. 开场神兽战关键帧（用于20秒演出）
- 6 张关键帧即可（不是逐帧动画）：
  - 对峙
  - 首次交锋
  - 能量对冲
  - 吞噬压制
  - 融合反击
  - 白光收束（梦醒前）

## 4. 目录与命名规范（按现有项目结构）

### 4.1 精灵立绘目录
- 普通精灵：`assets/monsters/normal/<species_id>/<base|fusion|devour>/stage<0|1|2>/`
- 传说精灵：`assets/monsters/legendary/<species_id>/<base|fusion|devour>/stage<0|1|2>/`

### 4.2 本轮建议落位
- `solaraith` 完全体：`assets/monsters/legendary/solaraith/base/stage2/`
- `abyssalor` 完全体：`assets/monsters/legendary/abyssalor/base/stage2/`
- `solaraith` 幼体：`assets/monsters/legendary/solaraith/base/stage0/`
- `abyssalor` 幼体：`assets/monsters/legendary/abyssalor/base/stage0/`
- `quakeburrow` 教学图：`assets/monsters/normal/quakeburrow/base/stage0/`
- `windthorn` 教学图：`assets/monsters/normal/windthorn/base/stage0/`
- 吞噬神剑演示图：`assets/monsters/legendary/abyssalor/devour/stage2/`

### 4.3 文件命名
- 统一：`dex_<species_id>_<variant>_v1.jpg`
- 例：
  - `dex_solaraith_full_v1.jpg`
  - `dex_solaraith_cub_v1.jpg`
  - `dex_abyssalor_sword-devour_v1.jpg`
  - `dex_quakeburrow_tutorial_v1.jpg`

## 5. 风格与质量标准
- 风格关键词：传说感、庄严、自然神性、非机甲、非赛博。
- 视觉层级：
  - 神兽：高细节材质、发光器官/纹路、明确轮廓剪影、强辨识色。
  - 普通教学素材：简洁但干净，保证与神兽形成档次差异。
- 背景：
  - 立绘建议白底（便于现有管线与替换）。
  - 关键帧演出图可带环境光氛围，但避免复杂噪点背景。

## 6. 技术规格
- 神兽与关键资产：建议 `1536x1536` 或以上（最小 `1024x1024`）。
- 普通教学素材：建议 `1024x1024`。
- 关键帧演出图：建议 `1920x1080`（16:9）。
- 格式：`.jpg` 优先（如需透明可 `.png`，需在交接说明标注）。

## 7. 验收标准（程序接入前）
- 能一眼区分“融合神兽 / 吞噬神兽”。
- 幼体与完全体必须有清晰年龄阶段差异（体型、角/翼、纹路成熟度）。
- `quakeburrow` 体现地面感，`windthorn` 体现飞行/有翼感。
- “神剑吞噬”图要明确看出“融合武器权能”，不是普通武器装饰。

## 8. 交付清单模板（请美术 Agent 回传）
```md
## 本轮目标
- 

## 资产路径
- 

## 对应 species_id / 用途
- 

## 风格说明
- 

## 质量自检
- 神兽 vs 普通精灵档次差异：通过/未通过
- 幼体 vs 完全体差异：通过/未通过
- 神剑吞噬辨识度：通过/未通过

## 需要程序侧配合
- 
```
