# Game Architecture

## 项目概述
GBIT Monster Quest 是一个持续演进中的类宝可梦 RPG 项目，当前以“可扩展架构 + 可运行主循环 + AI 立绘管线”作为核心。

当前主目标：
- 地图探索、捕捉、训练、道馆与区域挑战可持续扩展。
- 玩法层与美术/AI 资源生产层解耦。
- 每次功能迭代后，知识库与规则同步更新。

Demo 周策略（2026-03-24 ~ 2026-03-29）：
- 技术栈锁定 Web，优先交付“可打完一个道馆”的演示闭环。
- 暂不进行 Godot 迁移，避免冲刺周引擎切换风险。

## 关键文件索引

### 前端入口与界面
- `index.html`：页面结构、战斗面板、功能面板、AI 面板、模块加载顺序。
- `styles.css`：整体视觉样式、战斗 HUD、底部功能区布局。
- `game.js`：轻量入口，仅负责初始化状态并启动 `bootstrap()`。

### 游戏核心模块（`src/game/`）
- `globals.js`：常量、地图数据、精灵/技能/道具数据、NPC 定义、UI 引用。
- `bootstrap-ai.js`：启动流程、AI 服务探测、玩家/NPC 立绘生成交互。
- `world-events.js`：移动、过图、NPC 交互、特殊地块事件、商店与任务流程。
- `battle-system.js`：回合结算、伤害/克制、状态异常、训练师奖励、战败复活。
- `evolution-pipeline.js`：融合/吞噬共用的多图参考编辑 skill（提示词、参考图策略、预设批次）。
- `ui-panels.js`：目标提示、队伍/背包/图鉴/进化工坊/战斗面板渲染。
- `rendering.js`：地图与角色渲染、对话气泡、资源加载、存档读写、通用工具。

### 本地服务与 AI 生成
- `scripts/dev-server.mjs`：本地 API、任务队列、`/api/ai/health`、任务轮询接口。
- `scripts/load-local-env.mjs`：统一加载 `.env` / `.env.local`（仅补齐未注入环境变量，不覆盖系统环境变量）。
- `scripts/generate-runtime-asset.mjs`：运行时图像生成脚本（Gemini/Proxy provider）。
- `scripts/acceptance-interaction.mjs`：Puppeteer 交互验收脚本（NPC 互动立绘、商店分页、融合+立绘选择、吞噬回滚恢复、首遇图鉴二选一）。
- `scripts/bootstrap-competition-project.mjs`：竞赛项目一键导入脚本（可选 `web-minimal / web-full`，并自动生成合规追溯文件）。
- `assets.generated.js` / `assets.js`：运行时资源清单。
- `.env.example`：AI provider 与模型配置模板（默认 `proxy`），不包含真实密钥。

### 世界观与知识库
- `version.json`：项目版本真源（MAJOR.MINOR.PATCH-STAGE.BUILD）。
- `version.js`：前端运行时版本注入文件（由脚本生成）。
- `docs/versioning.md`：版本号规则、升级判定、发布前流程。
- `docs/world-lore.md`：核心神话、权能体系、道馆与权能试炼规则、三派关系、进化体系平衡结论。
- `rules/knowledge-base-rules.md`：知识库强制维护规则（子任务/bug/交互/关键文件的同步更新映射）。
- `rules/project-rules.md`：项目级规则与竞赛约束口径。
- `tasks/competition-import-quickstart.md`：竞赛开局导入手册（创建新项目、运行、来源声明流程）。
- `tasks/inheritance-priority-matrix.md`：比赛周重启迭代时的继承/重做/暂缓分级矩阵，用于压缩范围并保护核心体验。
- `C:/Users/cenjy/.codex/skills/contest-reset-prioritizer/SKILL.md`：将“保留已验证价值、重做阻塞实现、暂缓非核心扩量”抽象为可复用 skill，供后续新会话快速重建优先级判断。
- `C:/Users/cenjy/.codex/skills/ai-game-skill/SKILL.md`：项目主 skill，封装世界观、AI 美术管线、比赛周 demo 范围、内容基线、玩法闭环、快速重建清单、验收标准、模块地图与关键规则，供新会话快速建立项目上下文并重建 demo。

## 核心系统（当前）

### 1) 世界地图与区域扩展
当前主要地图网络：
- `town -> route -> meadow -> lake`
- `meadow -> orchard`
- `lake -> reef`
- `route -> cave -> deep_cave -> sanctum`
- `deep_cave -> ridge`
- `ridge <-> islet`
- `islet -> sanctum`（经守望者进度）

本轮新增野外精灵分布（持续补充中）：
- `mistowl`（雾潮鸮）：海湾/群岛水域与沿岸遭遇
- `gearcub`（齿岩熊崽）：高岭山地遭遇
- `petalisk`（花翼灵蜥）：果园/群岛草系遭遇
- `cinderpup -> sunfang -> warmaul`（焰纹幼狼 -> 曜炎圣狼 -> 炎铠战狼）：
  - 图感来源：熔岩火冠圣狼 + 炎铠战狼形态
  - 分布：花冠大道/洞穴/高岭/群岛（后期高等级形态）
- `blazedrake`（焚棘翼龙）：
  - 图感来源：绿焰森林龙
  - 分布：深层断崖、高岭
- `snowkit -> aurorafang`（霜电狐 -> 星霜灵狐）：
  - 图感来源：冰蓝电弧九尾狐
  - 分布：草原/水路/群岛（后期形态更稀有）

特殊地块：
- `d` 卷尘地面
- `r` 水纹水面
- `s` 摇动草丛
- `M` 传送石像
- `O/K/P/U` 区域门
- `A/S/W` 进化引导点
- `Z` 传说祭坛

### 2) 传送石像系统（新增）
- 触碰 `M` 会激活石像并记录复活点。
- 与石像互动可：
  - 恢复队伍
  - 传送到已激活石像
- 战败后优先复活到最近记录石像；无记录时回 `town`。

状态字段：
- `progress.unlockedStatues`
- `progress.lastStatue`

### 3) 避怪丹系统（新增）
- 新道具：`repel_orb`（`kind: "repel"`，默认 80 步）。
- 生效时抑制普通草丛/水面遭遇（`g/w`）。
- 不抑制特殊生态点事件（`d/r/s`）。
- HUD 显示剩余避怪步数。

状态字段：
- `player.repelSteps`

### 4) 战斗系统
- 每只精灵最多 4 招，学第 5 招会按规则替换旧招。
- 招式分类：`physical / special / status`。
- 支持状态：中毒、灼伤、混乱。
- 支持同属性加成（STAB）与双属性克制乘算。
- 训练师战胜奖励可驱动区域解锁与资源发放。
- 新增主题招式（用于新精灵体系）：
  - `lava_claw`、`inferno_halberd`、`verdant_inferno`
  - `frost_arc`、`ember_howl`、`glacial_veil`

### 4.1) 地区霸主（Apex）分层与奖励（新增）
- 分层定位：`普通 -> 稀有 -> 地区霸主(Apex) -> 传说`。
- `Apex` 通过 `speciesData.<id>.isApex = true` 声明，不等同于 `isLegendary`。
- 本轮已定义为 Apex 的精灵：`sunfang`、`warmaul`、`blazedrake`、`aurorafang`。
- 野外遭遇命名会显示“地区霸主 <名称>”。
- 击败 Apex 时触发专属奖励：
  - 首次击败该物种：`+220 金币 + 月辉之核x1 + 武装之核x1 + 高额精华奖励`
  - 重复击败：`+90 金币 + 野外口粮x1 + 常规精华奖励`
- 奖励持久化字段：`progress.apexDefeated[speciesId] = count`。

### 4.2) 首个道馆可选热身战（新增）
- 在道馆内新增可选 NPC：`gym_aide`（试炼官赛弥），用于馆主战前热身。
- 热身战不作为强制门槛，玩家可直接挑战馆主，不阻断首个闭环。
- 首次进入道馆会提示“可选热身”，并通过 flags 持久化：
  - `flags.gymAideIntroShown`
  - `flags.gymAideDefeated`
- 热身战胜利后发放小额资源奖励，帮助玩家更平滑进入馆主战节奏。

### 5) 属性与资源系统
新增并接通 `fairy`：
- `typeNames / typeColors / typeEffectiveness` 已加入。
- `alchemyElementTypes` 已加入。
- 融合元素可选 `fairy`，并映射 `fairy_pulse`。

### 6) AI 立绘与进化图生成
- 运行时 provider 模式：默认 `RUNTIME_IMAGE_PROVIDER=proxy`，并允许回退到 `gemini-official`。
- `scripts/dev-server.mjs`、`scripts/generate-runtime-asset.mjs`、`scripts/generate-proxy-character-assets.mjs` 启动时会自动读取 `.env` / `.env.local`，避免仅依赖外部 shell 注入。
- 密钥仅允许放在系统环境变量或本地 `.env.local`，不得写入仓库跟踪文件。
- 健康检查：`GET /api/ai/health` 返回 `imageProviderReady`。
- 玩家/NPC 立绘支持任务排队与轮询。
- NPC 立绘支持“回车交互自动触发”：首次互动时可自动提交该 NPC 的立绘任务，完成后强制刷新剧情焦点到该 NPC。
- 玩家立绘收藏系统（第一期）：
  - 初始收藏上限 3。
  - 每获得 1 枚徽章，收藏上限 +1。
  - 支持“最近生成”和“收藏夹”两区管理。
  - 支持“设为当前立绘”和“移出收藏”。
- 融合/吞噬统一走 `evolutionBlendSkill`（多图参考编辑底层）。
- 融合机制已重构为“双精灵融合”：主体 + 后备素材精灵。
- 吞噬机制已重构为“元素渊噬”：主体 + 元素消耗（不再吞噬后备精灵）。
- 自动化回归已覆盖吞噬/融合核心稳定链路：融合生效、融合立绘 A/B/暂不选择、吞噬后回滚快照恢复。
- 吞噬/融合执行入口增加运行锁，前端按钮会在操作进行中自动禁用，避免连点重入。
- 进化立绘支持参考图（目标/素材）与 Gemini 图像配置参数。
- 新增“默认融合立绘批次”，可一次性提交全元素预设图生成任务。
- 融合/吞噬进化回写 `mutation.trait`，并将“属性/特性/技能/立绘任务”完整反馈到日志与对话。
- 融合立绘已升级为“候选 A/B + 暂不选择”：
  - 选择 A/B：立即设为 `mutation.portraitKey`
  - 暂不选择：保持当前立绘，后续可在许愿台重生成
- 玩家立绘任务完成后会强制刷新剧情焦点为主角，避免“已生成但前端未显示”。
- 队伍/后备/仓库/战斗切换面板接入精灵缩略立绘与实时热更新。
- 功能面板展开后支持纵向滚动（含滚动条样式），避免长内容被裁切不可操作。
- 进化新增演出层（Fusion/Devour 两套视觉调性），不影响主循环逻辑。
- 已通过运行时生成管线为新增主题精灵产出首版立绘并注册资源键：
  - `cinderpup`、`sunfang`、`warmaul`
  - `blazedrake`
  - `snowkit`、`aurorafang`

### 6.1) 竞赛导入与合规追溯（新增）
- 新增竞赛项目导入脚本：`npm run contest:bootstrap -- --target <path> --profile web-minimal`。
- 导入时自动生成 `COMPLIANCE/`：
  - `import-manifest.json`（每个导入文件的路径/哈希/来源）
  - `third-party-declaration.md`（来源与用途声明模板）
  - `creation-journal.md`（每日创作记录）
  - `submit-checklist.md`（提交前核对）
- 合规模板已内置比赛公平性硬约束：
  - 最终提交使用的 AI 产出必须在 `2026-03-24 ~ 2026-03-29` 赛期内重生成并记录证据路径。
  - 允许复用赛前灵感，但赛前资源必须在声明文件中标注来源、用途与赛期重做状态。
- 目的：快速开新项目同时满足“来源可追溯、引用可声明、过程可审计”。

### 6.2) 比赛周重启迭代分级（新增）
- 当前项目采用 5 档分级：
  - `Must Inherit`
  - `Recommend Inherit`
  - `Optional Inherit`
  - `Recommend Rebuild`
  - `Defer This Week`
- 目标：在“保留已验证价值”的前提下，快速识别哪些模块值得继承、哪些模块应停止打补丁并改为重构。
- 决策基准不是资产规模，而是是否能明显提升“开场 -> 抓宠 -> 练级/换宠/道具 -> 道馆战 -> 奖励 -> 存档”的首个闭环体验。
- 具体分级与本周动作维护在 `tasks/inheritance-priority-matrix.md`。

### 7) 图鉴立绘定稿（新增）
- 首次（以及后续未定稿时）遭遇野生精灵，会触发该物种的图鉴立绘候选生成。
- 每个物种会生成 2 张候选图（A/B），并在任务完成后弹出带缩略图的二选一面板。
- 玩家定稿写入 `state.pokedex.portraits[speciesId]`，并在队伍/战斗/图鉴优先显示该立绘。
- 候选历史写入 `state.pokedex.candidates[speciesId]`，用于存档兼容与后续追踪。

### 8) 商店交互（优化）
- 商店入口改为“分类菜单 -> 分页货架”，替代原单页平铺。
- 分类依据 `item.category` 聚合；每页默认 6 项，支持上一页/下一页。
- 购买后返回当前分类页，减少长列表重复定位成本。

### 9) 启动存档系统（三槽位）
- 启动流程改为“先进入存档菜单，再进入地图”：
  - `开始新游戏`
  - `继续游戏（上次槽位）`
  - `选择存档（slot1/slot2/slot3）`
- 存档写入从单键升级为槽位键：
  - profile：`gbit_monster_quest_save_profile_v2`
  - slot：`gbit_monster_quest_save_slot_v2_slot1/2/3`
- profile 元信息记录每槽位摘要：
  - `updatedAt / storyStage / badges / map / partySize`
- 兼容策略：
  - 若仅存在旧单档 `gbit_monster_quest_save_v1`，启动时自动迁移到 `slot1`。
- 演示友好策略：
  - 可单独覆盖某个槽位开新档，不影响其他槽位。
  - 右下角“重新开始”仅清空当前槽位并立即重开。

## 已知问题与修复记录

### 2026-03-19（本轮）
1. 问题：新增地图与训练师数据存在但未接入可玩逻辑。  
   根因：仅完成数据层，未完成过图、交互、胜利奖励、UI 目标链路。  
   修复：补齐 `world-events.js` 与 `battle-system.js` 的地图门、训练师交互、奖励与复活流程。  
   影响范围：区域推进、NPC 战斗、主循环可玩性。

2. 问题：`fairy`、`moon_core`、`repel_orb` 未真正接入运行时。  
   根因：仅初始化了部分字段，未同步属性表/道具逻辑/UI 展示。  
   修复：完成属性表、融合元素、道具效果、资源显示与商店补货接线。  
   影响范围：战斗策略、融合玩法、野外探索。

3. 问题：UI 出现中文乱码与按钮文案异常。  
   根因：`index.html` 编码内容损坏。  
   修复：整页 UTF-8 重写，保留原有 DOM id/class 并同步新增选项（新 NPC、fairy 融合）。  
   影响范围：战斗按钮、功能面板、AI 面板、操作说明。

4. 问题：本地 AI 任务日志存在乱码，进化后备标题异常。  
   根因：`scripts/dev-server.mjs` 早期文本编码污染。  
   修复：重写任务日志与进化 fallback 标题文案（UTF-8）。  
   影响范围：AI 任务状态可读性、进化设计 fallback 输出。

5. 问题：玩家/精灵立绘任务显示“已完成”，但前端面板偶发不立即更新。  
   根因：玩家立绘完成后剧情焦点未强制落到主角；怪兽图像加载完成后未回刷队伍类面板。  
   修复：`handlePlayerPortraitTask` 强制刷新主角 `storyFocus`；`loadArtImage` 在怪兽资源加载后回刷队伍/仓库/图鉴/切换面板。  
   影响范围：剧情立绘可见性、队伍与背包系面板的立绘即时性。

6. 问题：缓存命中后日志提示“已应用”，但立绘肉眼几乎不可见。  
   根因：剧情立绘与精灵缩略图叠加了近乎不透明的白色渐变遮罩（alpha 0.96~0.98），导致图像被“洗白”。  
   修复：去除 JS 内联白色遮罩层，改为直接使用 `url(...)` 作为立绘背景图。  
   影响范围：剧情立绘、队伍卡片、战斗头像、切换面板立绘可见性。  

7. 问题：玩家立绘仅能“覆盖当前”，无法回滚到喜欢的旧图。  
   根因：生成任务固定写入 `player` 资源键，缺少历史与收藏层。  
   修复：新增提示词哈希资源键（`player_<hash>`）+ 生成历史 + 收藏夹；用 `player` 作为当前映射别名。  
   影响范围：玩家美术个性化、长期养成反馈、徽章奖励价值。  

8. 问题：功能面板展开后底部按钮/卡片被裁切，无法滚动到末尾操作。  
   根因：`.utility-panel` 固定 `max-height` 且 `overflow: hidden`，超出内容被直接截断。  
   修复：将展开态改为 `overflow-y: auto` + `scrollbar-gutter: stable`，并设置响应式 `max-height`；折叠态维持 `overflow: hidden`。  
   影响范围：玩家立绘、进化工坊、队伍、背包、图鉴等所有功能面板的可达性与可操作性。  

9. 问题：NPC 立绘需要手动点面板生成，回车互动时不能直接触发。  
   根因：`interact()` 与 NPC 立绘任务队列未打通。  
   修复：在 NPC 互动入口接入自动立绘请求，并增加交互冷却节流避免重复排队。  
   影响范围：NPC 交互体验、剧情立绘触达路径。  

10. 问题：商店条目过多时“塞不下”，单页选择效率低。  
    根因：商店使用单层列表平铺库存，缺少分类与分页。  
    修复：重构为分类菜单 + 分页货架（每页 6 项）。  
    影响范围：商店可读性、移动端与小窗口操作体验。  

11. 问题：融合/吞噬已执行但玩家难以确认“特性与技能变化”是否真正生效。  
    根因：进化写入偏内部状态，缺少显式反馈链路。  
    修复：新增 `mutation.trait`，并在日志/对话里同步输出属性、特性、技能变化及立绘任务状态。  
    影响范围：进化系统可解释性、策略反馈。  

12. 问题：图鉴没有“首遇生成双候选并定稿”的流程。  
    根因：遭遇流、AI 生成流、图鉴持久化流未串联。  
    修复：新增首遇双候选任务、任务轮询、带缩略图二选一 UI、`pokedex.portraits/candidates` 存档字段。  
    影响范围：捕捉循环、图鉴收藏、立绘一致性。  

13. 问题：AI 面板偶发显示“缺少 Key”，但团队已提供 AISERVICEPROXY 密钥。  
    根因：`dev-server` 与资源脚本仅依赖启动 shell 的环境变量；重启后若变量未注入，运行时会退化为“无 provider”。  
   修复：新增 `scripts/load-local-env.mjs` 并接入核心 AI 脚本，支持从本地 `.env/.env.local` 自动加载；同时将默认 provider 固定为 `proxy`。  
   影响范围：玩家/NPC 立绘生成、融合进化图像任务、AI 健康状态判断。  

14. 问题：融合立绘“选中候选后没有下文”，玩家感知为流程卡住。  
   根因：候选弹窗出现时可能被既有 `state.choice` 占用；同时面板 toggle 在多步流程中可能反复折叠。  
   修复：融合候选弹窗打开前先清理冲突 choice；工坊面板改为“仅在折叠时打开”，避免反复开关打断流程。  
   影响范围：家园融合流程稳定性、立绘二选一可达性。  

15. 问题：吞噬/融合概念混淆（吞噬吃精灵、融合吃元素）不符合当前设计目标。  
   根因：旧实现与新设定未完全对齐。  
   修复：重构为“吞噬=精灵+元素”“融合=两只精灵”；并同步更新 UI 选择器、家园交互流程、验收脚本。  
   影响范围：进化系统语义、资源消耗路径、玩家理解成本。  

16. 问题：蒙德草原到道馆流程中，部分玩家在道馆前未稳定体验到“传说遭遇”，导致主线体验不完整。  
   根因：仅依赖摇动草丛概率触发，低采样玩家可能在有限回合内未命中。  
   修复：提升草丛传说触发曲线（更早进入 pity），并在教授发放通行证前增加一次脚本保底遭遇。  
   影响范围：首章主线完整度、传说系统触达率、演示稳定性。  

17. 问题：道馆挑战前缺少“整备决策”节点，新手在资源不足时首战挫败感偏高。  
   根因：馆主交互直接开战，缺少可选补给与心理预热。  
   修复：新增“道馆试炼前整备”选择（一次性对策补给/直接挑战），并追加首进草原与首进道馆的一次性机制提示。  
   影响范围：道馆首战成功率、节奏引导、演示观感。  

## 兼容性约束
- 必须保持与现有存档结构兼容：新增字段需有默认值与加载兜底。
- 不得破坏主循环：移动、遭遇、战斗、结算、保存必须闭环。
- 新功能优先落在 `src/game/*`，避免回流到大单文件。
