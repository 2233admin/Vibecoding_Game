# CLAUDE.md — AI 修改记录

本文件记录由 AI（Claude）对游戏代码所做的修改，供后续 AI 或开发者参考。

---

## 2026-03-27 战斗系统大修（伤害公式、暴击、经验、Buff阶段制）

### 背景
玩家反馈：9级火系主宠被2级岩系野怪打到濒死，被8级水系野怪一招秒杀，数值严重失衡。

---

### 修改 8：伤害公式重平衡

**文件**：`src/game/battle-system.js`

```js
// 修改前
const defenseFactor = (defenseBase + defenderBattleDefenseBonus) * 0.34 + defender.level * 0.6

// 修改后
const defenseFactor = defenseBase * 0.52 + defender.level * 1.9
```

**根因**：原公式防御系数（0.34）远低于攻击系数（0.56），且防御方等级贡献（×0.6）与攻击方（×1.9）严重不对称，导致低等级野怪仍可造成大量伤害。

**验证**：Lv.2 岩系攻击 Lv.9 火系（STAB+克制 3×），修改前约 58 伤害（80% HP），修改后约 1 伤害（可忽略）。

---

### 修改 9：属性阶段制 Buff

**文件**：`src/game/battle-system.js`

原公式将 Buff bucket 的绝对值直接加到属性上，现改为阶段倍率：

```js
// 修改后
const stageMult = s => Math.max(2, 2 + s) / Math.max(2, 2 - s)
const atkMult = stageMult(attackerBuff?.attack || 0)   // 0阶=1.0×, +2=2.0×, -2=0.5×
const defMult = stageMult(defenderBuff?.defense || 0)
// offenseBase 和 defenseBase 分别乘以对应倍率
```

同时修复道具（战斗强化剂/护盾剂）buffValue 从 6 改为 2（代表 +2 阶段），并对道具使用添加上限 clamp(-6, 6)。

---

### 修改 10：会心一击（暴击）系统

**文件**：`src/game/battle-system.js`

```js
const isCrit = Math.random() < 0.0625   // 6.25% 基础暴击率
const critMult = isCrit ? 1.5 : 1.0
// 暴击跳过 70% HP 上限，普通攻击单次最多造成 70% 最大 HP 伤害
const rawDamage = Math.floor((attackFactor - defenseFactor) * STAB * eff * variance * critMult)
const damage = clamp(isCrit ? rawDamage : Math.min(rawDamage, Math.floor(defender.maxHp * 0.70)), 1, 999)
if (isCrit) messages.push("会心一击！")
```

---

### 修改 11：每种族独立经验值（baseExp）

**文件**：`src/game/globals.js`（所有 speciesData 条目新增 `baseExp` 字段）

**文件**：`src/game/battle-system.js`

```js
// 修改前
const experience = 10 + enemy.level * 4

// 修改后
const baseExp = speciesData[enemy.speciesId]?.baseExp || 40
const experience = Math.max(1, Math.floor(baseExp * enemy.level / 7))
```

**经验值设计原则**：
| 类别 | baseExp 范围 | 示例 |
|------|-------------|------|
| 传说级 | 260-280 | solaraith=280, verdion=270 |
| Apex 进化终态 | 210-220 | warmaul=220, blazedrake=215 |
| 主宠进化形态 | 165-175 | blazehound=175, thornlynx=168 |
| 野怪进化形态 | 108-145 | quakeburrow=145, bloomantis=128 |
| 主宠基础形态 | 63-65（高于普通野怪） | embercub=65, sprigoon=63 |
| 中级野怪（无进化） | 63-95 | shardillo=95, flarehawk=90 |
| 普通路边野怪 | 38-50 | stonehorn=50, beetbit=38 |

捕捉经验 = baseExp × level / 14（击败奖励的一半）。

---

## 2026-03-27 游戏平衡调整（早期难度优化）

### 背景
玩家反馈：新手教程结束后立即被路边野怪暴打，游戏体验差。
设计目标：
- 教程后能轻松击败路边野怪
- 道馆战需要属性克制策略才能通过

---

### 修改 1：初始伙伴等级提升

**文件**：`src/game/world-events.js` 第 2759 行

```js
// 修改前
const starter = createMonster(speciesId, 5)
// 修改后
const starter = createMonster(speciesId, 6)
```

**原因**：玩家 Lv.5 与路边最高 Lv.5 野怪同级，毫无等级优势。

---

### 修改 2：初始道具数量增加

**文件**：`src/game/bootstrap-ai.js` 第 66 行

```js
// 修改前
potion: 2,
// 修改后
potion: 5,
```

**原因**：2 瓶药水不够支撑教程后的连续路边战斗，资源耗尽是被暴打的次要原因。

---

### 修改 3：花冠大道野怪等级降低

**文件**：`src/game/globals.js` 第 1638-1645 行（花冠大道 encounters）

```js
// 修改前（最高 Lv.5）
{ speciesId: "beetbit",   minLevel: 2, maxLevel: 3 }
{ speciesId: "voltkit",   minLevel: 2, maxLevel: 4 }
{ speciesId: "stonehorn", minLevel: 2, maxLevel: 4 }
{ speciesId: "reedimp",   minLevel: 3, maxLevel: 4 }
{ speciesId: "drillmole", minLevel: 3, maxLevel: 5 }
{ speciesId: "cinderpup", minLevel: 3, maxLevel: 5 }

// 修改后（最高 Lv.3）
{ speciesId: "beetbit",   minLevel: 1, maxLevel: 2 }
{ speciesId: "voltkit",   minLevel: 1, maxLevel: 3 }
{ speciesId: "stonehorn", minLevel: 1, maxLevel: 3 }
{ speciesId: "reedimp",   minLevel: 2, maxLevel: 3 }
{ speciesId: "drillmole", minLevel: 2, maxLevel: 3 }
{ speciesId: "cinderpup", minLevel: 2, maxLevel: 3 }
```

**原因**：玩家 Lv.6 对阵最高 Lv.3，才有明显的"碾压感"。

---

### 修改 4：道馆馆主等级提升

**文件**：`src/game/globals.js` 第 1473-1475 行（leader.team）

```js
// 修改前
["reedimp",    5],
["sporemarch", 5],
["bloomantis", 6],

// 修改后
["reedimp",    8],
["sporemarch", 9],
["bloomantis", 10],
```

**原因**：馆主全草系，玩家若不带火/飞行/虫系克制，Lv.8-10 足以让暴力流失败，迫使玩家思考属性策略。

---

### 修改 5：战斗伤害公式——防御加入等级系数

**文件**：`src/game/battle-system.js` 第 430 行

```js
// 修改前
const defenseFactor = (defenseBase + defenderBattleDefenseBonus) * 0.34

// 修改后
const defenseFactor = (defenseBase + defenderBattleDefenseBonus) * 0.34 + defender.level * 0.6
```

**原因**：原公式中攻击方等级贡献 `level × 1.9`，但防御方没有对应的等级缩放，导致即使玩家等级更高，野怪依然造成过高伤害。新公式让防御随等级成长，等级优势才真正体现在"抗揍"能力上。

---

## 注意事项

- 修改 1-5 均针对早期游戏（教程 → 第一道馆）的平衡，中后期区域未调整
- 战斗公式修改（修改 5）影响全局所有战斗，如出现高级区域敌人过弱，可适当提高 `0.6` 系数或降低该值
- 道馆难度仍可进一步微调（如给馆主怪物添加更多变化技能/状态技能）

---

## 2026-03-27 属性系统升级（IV 个体值 + 进化种族值调整）

### 背景
原系统无个体差异，所有同种同级怪物属性完全相同。进化后防御/速度提升极小（如 sprigoon→thornlynx 防御仅 +2），玩家感知不到进化收益。

---

### 修改 6：IV（个体值）系统

**文件**：`src/game/rendering.js`

新增两个辅助函数，修改 `createMonster`、`normalizeMonster`、`refreshMonsterStats`、`computeStats`：

```js
// 新增：生成随机 IV（每项 0-15）
function generateIvs() {
  return {
    hp:      Math.floor(Math.random() * 16),
    attack:  Math.floor(Math.random() * 16),
    defense: Math.floor(Math.random() * 16),
    speed:   Math.floor(Math.random() * 16),
  }
}

// 新增：规范化/合法化 IV 数据（用于读取存档）
function normalizeIvs(raw) { ... }

// createMonster 加入 ivs 字段
ivs: generateIvs()

// normalizeMonster 保留 ivs 字段
ivs: normalizeIvs(rawMonster.ivs)

// computeStats 签名变更，IV 直接叠加到最终属性
function computeStats(speciesId, level, ivs = {}) {
  return {
    maxHp:   floor(baseHp   + level * growth.hp)   + (ivs.hp      || 0),
    attack:  floor(baseAtk  + level * growth.atk)  + (ivs.attack  || 0),
    defense: floor(baseDef  + level * growth.def)  + (ivs.defense || 0),
    speed:   floor(baseSpd  + level * growth.spd)  + (ivs.speed   || 0),
  }
}

// refreshMonsterStats 传入 monster.ivs
const baseStats = computeStats(monster.speciesId, monster.level || 1, monster.ivs || {})
```

**效果**：每只捕获的怪物拥有独立 IV，同种怪物之间有 0~60 点总属性差异，有"好个体"追求空间。

---

### 修改 7：进化形态种族值提升（防御/速度）

**文件**：`src/game/globals.js`

| 物种 | 属性 | 修改前 | 修改后 | 变化 |
|------|------|--------|--------|------|
| thornlynx（棘影猫） | baseDef | 11 | 15 | +4 |
| thornlynx | baseSpd | 10 | 12 | +2 |
| blazehound（烈焰猎犬） | baseDef | 9 | 13 | +4 |
| blazehound | baseSpd | 11 | 13 | +2 |
| tideshell（潮甲灵） | baseDef | 12 | 16 | +4 |
| tideshell | baseSpd | 9 | 11 | +2 |
| mosscarab（苔盔甲虫） | baseDef | 10 | 14 | +4 |
| mosscarab | baseSpd | 8 | 10 | +2 |
| quakeburrow（震铠龙鼹） | baseDef | 12 | 17 | +5 |
| quakeburrow | baseSpd | 9 | 10 | +1 |
| torrentail（潮怒尾鲸） | baseDef | 12 | 16 | +4 |
| torrentail | baseSpd | 11 | 13 | +2 |
| bloomantis（花刃螳灵） | baseDef | 11 | 15 | +4 |
| bloomantis | baseSpd | 12 | 14 | +2 |

**原因**：进化前后种族值差太小（DEF 仅 +1~2），玩家感知不到进化收益。调整后进化 DEF 至少 +4，进化价值更明确。

---

## 注意事项（更新）

- IV 系统：旧存档中的怪物读取时 `normalizeIvs()` 会将缺失 IV 补 0，不影响存档兼容性
- IV 系统当前仅有生成和计算，暂无 UI 显示（如需展示个体值评级，需在怪物详情面板添加）
- 进化种族值调整只影响 Tier-2 进化形态，原始形态（starter 等）未动

---

## 2026-03-27 属性规范化：进化成长档位 Bug 修复

### 背景
原代码中进化后形态的 growthProfile 和进化前不一致（45只精灵中9条链有问题），玩家培养一只速攻型进化后变肉盾，体验割裂。确认为 Bug，全部修复。

### 修改（globals.js — speciesBattleProfiles 段）

| 物种 | 修改前 | 修改后 | 进化自（基准档位） |
|------|--------|--------|-----------------|
| thornlynx（棘影猫） | swift | **balanced** | sprigoon=balanced |
| tideshell（潮甲灵） | tank | **balanced** | aquaffin=balanced |
| mosscarab（苔盔甲虫） | tank | **swift** | beetbit=swift |
| quakeburrow（震铠龙鼹） | tank | **striker** | drillmole=striker |
| bloomantis（花刃螳灵） | swift | **balanced** | reedimp=balanced |
| torrentail（潮怒尾鲸） | balanced | **swift** | rivulet=swift |
| tidecelest（潮辉海姬） | tank | **balanced** | coralyn=balanced |
| florastag（花冠鹿王） | tank | **balanced** | mossfawn=balanced |
| warmaul（炎铠战狼） | tank | **striker** | cinderpup/sunfang=striker |

### 修复后进化链档位一致性

| 进化链 | 档位（全程一致） |
|--------|----------------|
| sprigoon→thornlynx | balanced |
| embercub→blazehound | striker |
| aquaffin→tideshell | balanced |
| beetbit→mosscarab | swift |
| drillmole→quakeburrow | striker |
| rivulet→torrentail | swift |
| reedimp→bloomantis | balanced |
| pixibud→aurorabbit | swift |
| coralyn→tidecelest | balanced |
| mossfawn→florastag | balanced |
| cinderpup→sunfang→warmaul | striker |
| snowkit→aurorafang | swift |

### 当前属性系统状态
- **4属性**（HP/攻击/防御/速度），无特攻/特防，保持现有设计
- **IV个体值**：每只怪物各属性 0-15 随机，已实现
- **成长档位**：4种（balanced/striker/tank/swift），进化链已对齐

---

## 2026-03-27 架构升级：数值独立模块（balance-config）

### 背景
开发者将可调数值从玩法代码中解耦，建立了独立配置系统。**后续 AI 调整数值只需改 JSON，不改 JS。**

### 新增文件

| 文件 | 作用 |
|------|------|
| `src/game/balance-config.js` | 配置加载模块，带类型检查和非法值兜底 |
| `config/balance-config.json` | 外置配置文件，AI 调参入口 |
| `docs/balance-config.md` | 用法说明文档 |

### 当前可调项（config/balance-config.json）

```json
{
  "encounter": {
    "wildLevelOffsetGlobal": 0,
    "wildLevelOffsetByMap": { "route": 0, "meadow": 0, "lake": 0 },
    "trainerLevelOffsetGlobal": 0,
    "trainerLevelOffsetByTrainer": {
      "tutorial_aide": 0, "scout": 0, "vanguard": 0, "leader": 0
    }
  },
  "economy": {
    "shopPriceMultiplier": 1,
    "sellPriceMultiplier": 1,
    "battleCoinMultiplier": 1
  }
}
```

### 重要：当前 globals.js 基准值（已被本次调整修改）

| 位置 | 当前基准 | 原始值 |
|------|---------|--------|
| 花冠大道野怪等级 | Lv.1-3 | Lv.2-5 |
| 馆主队伍等级 | Lv.8/9/10 | Lv.5/5/6 |

balance-config.json 的 offset 叠加在上述基准上。例如设 `"route": 2` → 实际 Lv.3-5。

### AI 操作守则
1. 只改 `config/balance-config.json`，不改 `src/game/*.js`
2. 配置写错会自动回退默认值，游戏不会崩溃
