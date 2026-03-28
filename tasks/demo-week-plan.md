# Demo Week Plan (Web Only)

## Window

- Start: 2026-03-24
- Target demo freeze: 2026-03-29

## Hard Constraints

1. Keep current Web stack; no engine migration this week.
2. No Godot rewrite or dual-stack maintenance in this sprint.
3. Every day must produce a runnable increment with validation evidence.
4. Any AI-generated outputs included in final submission must be regenerated during `2026-03-24` to `2026-03-29`, with trace evidence in `COMPLIANCE/`.
5. Prioritize core experience expression over asset volume; avoid spending sprint budget on non-critical polish that does not improve the first-gym playable loop.

## Lore Guardrails (from `world-lore.md` + `context-log.md`)

1. Gym badge proves trainer strength; it is not equal to divine authority inheritance.
2. Keep three evolution paths coexisting:
   - normal evolution (mainstream)
   - fusion evolution (connection/symbiosis)
   - devour evolution (seize/assimilation)
3. Special evolution must not become pure stat inflation; player choice and team strategy stay primary.
4. Apex is below Legendary in narrative and system hierarchy.
5. Breeding-depth rules (perfect fusion qualification, devour-trace inheritance) are lore-locked for future phases, not required for first-gym demo.

## Demo Exit Criteria

A build is considered "demo-ready" only if all items pass in one run:

1. New game opening guidance is clear and playable.
2. Player can capture wild monsters and progress tutorial counters.
3. Level-up loop works and supports party switch + battle item usage.
4. Gym entry gating and leader battle can be completed.
5. Gym victory grants rewards and updates progression flags.
6. Save/load preserves core progress and remains compatible with old saves.

## Version-Spec Lock (Newbie Village -> Mond Meadow -> Grass Gym)

### Experience Spine

Use a strict onboarding loop:
- 教学 -> 实践 -> 受挫 -> 引导 -> 掌握

Stage mapping:
1. 新手村（选择与代入）
   - 选择初始精灵（草/火/水），触发首次剧情战（无惩罚）。
   - 领取图鉴与基础道具，明确目标：前往蒙德草原与草系道馆。
2. 蒙德草原入口（基础实践）
   - 野外遇敌与捕捉教学（NPC 示范一次）。
   - 轻量草系机制首次实操（特殊进化仅做低门槛体验）。
3. 蒙德草原中段（主线冲突）
   - 反派组织首次登场并进行第 1 战。
   - 战后给出“草系道馆 + 神兽线索”剧情钩子。
4. 蒙德草原后段 / 道馆前（难度抬升）
   - 劲敌战或训练师连战，检验队伍构建。
   - 反派第 2 战（道馆前拦截），通过后开放道馆挑战。
5. 草系道馆（闭环收口）
   - 强调属性克制与队伍搭配。
   - 道馆前提供对策资源，避免卡关。
   - 击败馆主后发放主线线索，并进入流派/神兽后续分支。

### Mond Meadow Scope Additions

1. 新增 4 只“稀有精灵”（命名避免王/古等传说感词汇）。
2. 草系前期战斗定位：持续作战 + 控制节奏（吸取/寄生/睡眠/麻痹）。
3. 新增冰属性并接入克制：
   - 进攻：冰 -> 草/飞行/地面 = x2
   - 防守弱点：火/格斗/岩石 = x2
   - 抗性：冰 = x0.5

### Legendary Encounter Rules (Before First Gym Clear)

1. 道馆前最多可遭遇/交手 3 只传说精灵（允许低概率捕捉）。
2. 道馆前传说捕捉率为低概率档（默认 0.8%，状态/残血加成后封顶 <= 3%）。
3. 保证“道馆前至少遇到 1 只传说”的概率 >= 80%：
   - 采用“基础概率 + 递增保底”机制（推荐 10 次判定窗口）。
4. 当玩家击败草系道馆或获得草系神兽权能后：
   - 森律神使的捕捉概率进入提升档（建议基础 4%，条件达成后上限 8-10%）。
5. 口径统一：
   - 曜辉圣兽与炽脉兽视作同一传说位（同一物种口径，不重复开物种）。

## Day-by-Day Milestones

### Day 1 (03-24): Scope Lock + Baseline

- Freeze sprint scope to first-gym loop.
- Clean board and assign owners for gameplay/UI/content/QA.
- Baseline run: existing acceptance script + manual smoke notes.

Deliverable:
- Sprint artifacts created (`tasks/board.md`, this file).

### Day 2 (03-25): Opening Guidance + Capture Loop

- Tighten opening dialogues, objective text, and route clarity.
- Verify capture tutorial progression to `storyStage >= 2`.
- Ensure first encounter portrait popup does not block tutorial flow.
- Add one short lore beat: “badge is training proof, true authority needs trial.”

Deliverable:
- Opening-to-capture path reaches scout battle trigger reliably.

### Day 3 (03-26): Growth Loop (Leveling/Switch/Items)

- Balance early encounter levels and coin economy for gym prep.
- Verify battle switch UI and bag item flow under low/high HP cases.
- Add missing feedback text where decisions are unclear.
- Keep move/evolution decisions framed as “strategy first, numbers second.”

Deliverable:
- Player can build a viable 3-4 monster gym team naturally.

### Day 4 (03-27): Gym Access + Leader Battle

- Ensure gym pass progression, gate prompts, and map entry are clear.
- Tune leader team curve for "winnable but not free" experience.
- Validate lose->recover->retry flow via statue/return path.
- Add leader dialogue that separates “徽章胜利” from “权能试炼资格”.

Deliverable:
- One full run can enter gym and beat leader.

### Day 5 (03-28): Rewards + Save/Load

- Validate reward bundle on gym win (coins/items/flags/dialogue).
- Validate save after gym win, reload, and continue correctly.
- Add regression checks for key flags (`gymWon`, `storyStage`, `inventory`).
- Ensure post-gym narrative points to next phase trial instead of immediate god-tier leap.

Deliverable:
- "Defeat gym -> save -> reload -> continue" works.

### Day 6 (03-29): Polish + Demo Freeze + Hand-off

- Fix high-impact UX bugs only (text overflow, blocked buttons, dead-ends).
- Clean inconsistent prompts and map direction hints.
- Re-run acceptance and manual scripted playthrough.
- Freeze gameplay scope.
- Final smoke test + acceptance logs.
- Update docs/rules/context-log and prepare show script.

Deliverable:
- Demo package and operator checklist.

## Validation Commands

```powershell
node scripts/acceptance-interaction.mjs
```

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4310/api/ai/health
```

## Out of Scope This Week

1. Godot migration and engine-level rendering rewrite.
2. Large refactors unrelated to first-gym loop delivery.
3. Non-critical system overhauls without direct demo impact.
4. Full breeding system implementation (keep lore notes only).
