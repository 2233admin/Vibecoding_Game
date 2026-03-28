# System Data Flow

## 1. 启动与模块加载

加载顺序（`index.html`）：
1. `globals.js`
2. `bootstrap-ai.js`
3. `world-events.js`
4. `battle-system.js`
5. `evolution-pipeline.js`
6. `ui-panels.js`
7. `rendering.js`
8. `game.js`

启动流程：
- `game.js` 初始化 `state = createInitialState()`。
- 调用 `bootstrap()`：绑定事件、预加载资源、加载存档、渲染 UI、启动 AI 健康探测与主渲染循环。
- `scripts/dev-server.mjs` 启动时先执行 `loadLocalEnv(projectRoot)`，按 `.env -> .env.local` 顺序补齐运行时环境变量。

Demo 周运行约束（2026-03-24 ~ 2026-03-29）：
1. 所有功能增量必须在现有 Web 主循环内完成。
2. 本周不引入 Godot 并行实现或迁移分支，避免双栈状态分叉。

知识库同步约束（强制）：
1. 每完成子任务/功能、重要 bug、系统交互变更、关键文件变更，必须同轮更新：
   - `docs/game-architecture.md`
   - `docs/system-data-flow.md`
   - `docs/debugging-guide.md`（涉及 bug 时）
   - `docs/context-log.md`
2. 同步检查：
   - `rules/knowledge-base-rules.md`
   - `rules/project-rules.md`

比赛周重启分级流（新增）：
1. 先读取 `tasks/inheritance-priority-matrix.md`，判断当前改动对象属于哪一档优先级。
2. 若为 `Must Inherit / Recommend Inherit`，优先在现有实现上修复与精简。
3. 若为 `Recommend Rebuild`，保留产品目标，重做实现路径，避免继续堆补丁。
4. 若为 `Optional Inherit / Defer This Week`，只有在不影响首个道馆闭环的情况下才继续投入。
5. 所有判断结果需同步回 `docs/context-log.md`，确保后续 agent 延续同一口径。
6. 若在新会话中需要快速复用这套方法，直接调用本地 skill：`C:/Users/cenjy/.codex/skills/contest-reset-prioritizer/SKILL.md`。
7. 若需要快速恢复项目完整上下文，优先调用项目主 skill：`C:/Users/cenjy/.codex/skills/ai-game-skill/SKILL.md`，再按需读取其中 references。
8. 若需要快速判断 demo 当前是否“还活着”，可运行 skill 自带检查脚本：`node C:/Users/cenjy/.codex/skills/ai-game-skill/scripts/run-demo-recovery-check.mjs --project-root <project_root>`。

竞赛项目导入流（新增）：
1. 在源项目执行：`npm run contest:bootstrap -- --target <new_project_path> --profile web-minimal`。
2. 脚本复制最小可运行 Web 结构（`src/`、`assets/`、核心脚本、入口文件）。
3. 同步生成 `COMPLIANCE/import-manifest.json`（文件来源 + SHA256）。
4. 在新项目补全 `COMPLIANCE/third-party-declaration.md` 与 `creation-journal.md` 后进入开发。
5. 对最终提交使用的 AI 产出，必须在 `2026-03-24 ~ 2026-03-29` 内重生成，并在声明/日志中记录时间、模型与证据路径。
6. 若使用赛前资源（灵感、模板、代码片段、素材基线），必须在声明文档标明来源、用途、是否赛期重做。

## 2. 大地图移动与事件流

`attemptMove()`：
1. 计算目标格。
2. 判定可通行与 NPC 阻挡。
3. 更新玩家坐标与步数。
4. 消耗避怪丹步数（若生效）。
5. 触发 `handleTileEvent()`。
6. `syncUi()` + `queueSave()`。

`handleTileEvent()` 优先级：
1. 地图切换 `handleMapTransition()`。
2. 引导地块（A/S/W）。
3. 传说祭坛（Z）。
4. 传送石像（M，激活记录）。
5. 特殊生态点（d/r/s）。
6. 普通遭遇（g/w，受避怪丹抑制）。

野生遭遇补充：
- `startWildBattle()` 会在首次（及未定稿）物种遭遇时触发图鉴候选立绘任务：
  - `requestFirstEncounterPokedexPortraitChoices(speciesId)`
  - 2 张候选任务并行生成 -> 轮询 -> 候选落盘 -> 二选一定稿。
- 新增主题精灵遭遇已接入各区刷怪池：
  - 花冠大道/洞穴/高岭：炎狼线与焚棘翼龙
  - 草原/11 号水路/群岛：霜电狐线

## 3. 过图与进度门

关键门位：
- `O`：`meadow <-> orchard`
- `K`：`lake <-> reef`
- `P`：`deep_cave <-> ridge`
- `U`：`islet -> sanctum`

进度控制：
- `gymWon` 控制果园开放。
- `breederDefeated` 控制海湾开放。
- `captainDefeated` 控制高岭入口与海湾外航线。
- `aceDefeated` 控制高岭主航路指引。
- `wardenDefeated`（或 `sanctumOpen`）控制群岛潮门直达遗迹。

## 3.1 NPC 交互触发立绘

`interact()`：
1. 查找邻近 NPC。
2. 若存在 NPC，先异步触发 `requestNpcPortraitOnInteract(npc.id)`（不阻塞主交互）。
3. 执行原 NPC 对话/战斗逻辑。

`requestNpcPortraitOnInteract()`：
- 检查是否已有 NPC 立绘；
- 若无立绘，按冷却节流后自动提交 `POST /api/ai/generate-character`；
- 任务完成后 `handleNpcPortraitTask()` 强制刷新 `storyFocus` 到目标 NPC，立绘即刻生效。

## 3.2 首个道馆可选热身战流程（新增）

入口与提示：
1. 玩家从 `town` 进入 `gym` 时，若未热身且未通关道馆，触发一次性可选提示。
2. 提示由 `flags.gymAideIntroShown` 控制，避免重复打断。

互动与结算：
1. 与 `gym_aide` 交互时，若 `flags.gymAideDefeated=false`，进入训练师战 `startTrainerBattle("gym_aide")`。
2. 胜利后由 `handleTrainerVictory("gym_aide")` 发放奖励并设置 `flags.gymAideDefeated=true`。
3. 该分支不修改 `storyStage`，不设置主线门槛，保持“可选热身”定位。

## 4. 石像与复活数据流

触碰石像：
- 更新 `progress.unlockedStatues[key] = { mapId, x, y, name }`
- 更新 `progress.lastStatue = key`

石像互动：
- 恢复队伍（`healParty()`）
- 打开传送列表并切图

战败结算：
- `finishBattle("lose")` 调用 `resolveRevivePoint()`
- 优先读取 `lastStatue` 对应坐标复活；失败时回城默认点

## 5. 战斗回合流

入口：`handleBattleAction(action)`
- 校验动作合法性（技能/道具/切换/捕捉/逃跑）
- 锁定战斗状态
- 执行动作并触发敌方回合（按动作类型）
- 解锁并刷新 UI

动作链：
- `skill` -> 伤害/克制/STAB/状态结算
- `item` -> 战斗中仅允许治疗/战斗强化
- `switch` -> 切换后消耗回合，敌方出手
- `capture` / `run` -> 仅野外战可用

胜负结算：
- 训练师胜利触发 `handleTrainerVictory(trainerId)`，写入旗标与奖励。
- 战败后通过石像系统复活并恢复队伍。
- 野外胜利时会检查敌方分层：
  - `isLegendary`：传说记录提示。
  - `isApex`：触发 `grantApexVictoryRewards()`，并更新 `progress.apexDefeated` 计数。

## 6. 道具与资源流

背包使用入口：`useBagItem(itemId)`
- 战斗中：委托给 `handleBattleAction({ type: "item" })`
- 野外：按 `item.kind` 执行效果

新增关键分支：
- `kind: "repel"` -> 增加 `player.repelSteps`
- `kind: "essence"` -> 更新元素资源（含 `fairy`）

## 7. AI 生成数据流

健康检查：`GET /api/ai/health`
- 前端根据 `imageProviderReady` 决定按钮可用性

提交任务：
- `POST /api/ai/generate-character`（玩家/NPC）
- `POST /api/ai/generate-monster`（进化立绘）

进化请求组装：
- `evolution-pipeline.js` 统一产出 `prompt + referenceImages + imageConfig/responseModalities`。
- 融合与吞噬共享同一 skill 配置，差异由 mode/preset 决定。
- 默认融合批次通过 `buildDefaultFusionBatchRequests()` 生成多配方任务清单。

任务轮询：
- `GET /api/ai/tasks/:id`
- 完成后更新 `assets.generated.js` 对应资源键并热加载。

热更新刷新：
- `loadArtImage()` 在角色图加载后刷新剧情立绘。
- `loadArtImage()` 在怪兽图加载后刷新队伍/仓库/背包图鉴/战斗切换面板，保证前端即时可见。

Provider 选择与环境加载（新增）：
1. `loadLocalEnv(projectRoot)` 读取 `.env` 与 `.env.local`（不覆盖已注入系统环境变量）。
2. 默认 `RUNTIME_IMAGE_PROVIDER=proxy`。
3. `resolveRuntimeImageProviderState()` 根据 key 可用性生成 `availableProviders`：
   - 有 `AISERVICEPROXY_API_KEY` -> `proxy`
   - 有 `GEMINI_API_KEY` -> `gemini-official`
4. 若首选 provider 不可用，自动回退到可用 provider。

新增精灵落地流程（新增）：
1. 在 `speciesData` 注册基础数值、初始技能、进化链与图鉴文案。
2. 在 `speciesBattleProfiles` 注册双属性、成长曲线与 learnset。
3. 在 `maps.<zone>.*Encounters` 注入出现分布与等级区间。
4. 使用 `scripts/generate-runtime-asset.mjs` 生成立绘并写入 `assets.generated.js`。
5. 运行 `node scripts/acceptance-interaction.mjs` 进行回归验收，确保不破坏主循环。

图鉴首遇候选流（新增）：
1. 首遇野生物种时，前端提交 2 个 `generate-monster` 任务（`dex_<species>_v1/v2`）。
2. 候选任务轮询完成后，注册运行时资源到 `ART_MANIFEST.monsters`。
3. 触发带缩略图的 `openChoice` 二选一面板。
4. 玩家确认后写入 `state.pokedex.portraits[speciesId]`，候选明细写入 `state.pokedex.candidates[speciesId]`。
5. `getMonsterArtKeys()` 优先读取图鉴定稿立绘，再回退默认物种图。

玩家立绘收藏流（第一期）：
1. 提交玩家生成时，前端按提示词生成稳定资源键 `player_<promptHash>`。
2. 任务完成后：
   - 注册 `characters:<player_hash>` 资源；
   - 同步映射到 `characters:player` 作为当前展示。
3. 生成历史写入 `state.playerPortrait.generated`。
4. 收藏操作受容量限制：
   - `maxSlots = baseSlots(3) + badges`。
   - 收藏列表写入 `state.playerPortrait.favorites`。
5. 切换收藏时仅更新当前映射（`player` 别名），不覆盖历史条目。

功能面板展开流（可滚动）：
1. 玩家点击 `utility-button`，`toggleUtilityPanel(panelId)` 切换唯一展开面板。
2. 展开态 `utility-panel` 使用 `overflow-y: auto` 承载长内容滚动。
3. 折叠态 `utility-panel.collapsed` 保持 `max-height: 0 + overflow: hidden`，保证动画与布局稳定。

## 8. 进化演出流（新增）

入口：
- `performFusionEvolution()` / `performDevourEvolution()`

流程：
1. 完成资源校验与属性/成长写入。
2. 触发 `playEvolutionAnimation()` 显示演出层（Fusion/Devour 区分视觉）。
3. 异步提交进化立绘任务（不阻塞主循环）。
4. 任务完成后注册运行时资源，并按模式选择是否回写 `mutation.portraitKey`。

## 8.1 家园进化台流程（当前）

渊噬祭台（吞噬）：
1. 选择受体（队伍）。
2. 选择元素（草/火/水/虫/电/岩/妖精/太阳/武器）。
3. 二次确认后执行：
   - 消耗 `元素 x2 + Void x1`
   - 不消耗后备精灵
   - 写入 `mutation.devourType / trait / tier`

共鸣融合台（融合）：
1. 选择主体（队伍）。
2. 选择素材（后备精灵）。
3. 二次确认后执行：
   - 消耗 `Arcane x1`
   - 消耗后备素材精灵
   - 继承素材类型倾向与技能倾向，写入主体 mutation

融合立绘二选一：
1. 融合成功后并行生成候选 A/B。
2. 弹窗提供 `候选A / 候选B / 暂不选择`。
3. 选择 A/B：写入 `mutation.portraitKey`。
4. 暂不选择：保持当前立绘不变，后续走许愿台重生成。

防重入保护：
1. 吞噬/融合执行函数使用运行锁，操作进行中忽略重复触发。
2. 进化工坊按钮在 busy 状态自动禁用，直到本次流程完成。

## 9. 存档流

保存：`queueSave() -> saveGame()`
- 持久化 `state`（战斗态与选择态清空）

读取：`loadGame()`
- 合并默认状态，补齐新增字段（如 `repelSteps`、石像数据）
- 合并并兜底 Apex 进度字段：`progress.apexDefeated`
- 合并图鉴扩展字段：`pokedex.portraits`、`pokedex.candidates`
- 规范化队伍、后备、仓库、变异信息

## 10. 商店分类分页流（新增）

`openMerchantMainMenu()`：
1. 根据 `item.category` 聚合库存，展示分类入口。
2. 进入分类后调用 `openMerchantCategoryPage(category, pageIndex)`。
3. 分类页按 `MERCHANT_PAGE_SIZE` 分页，并提供上一页/下一页导航。
4. 购买后回到当前分类页继续交易。

## 11. 自动化回归流（吞噬/融合）

命令：
- `node scripts/acceptance-interaction.mjs`

当前覆盖：
1. NPC 回车互动自动触发立绘任务。
2. 商店分类与分页导航。
3. 融合进化生效 + 融合立绘候选弹窗与选择闭环。
4. 吞噬进化后回滚快照恢复（资源/变异状态回归）。
5. 融合立绘 A/B/暂不选择三分支行为。
6. 首遇图鉴双候选立绘与二选一定稿。
