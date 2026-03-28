# Debugging Guide

## 常见问题排查

### 1) 战斗后总是回城，石像复活不生效
检查项：
1. 当前地图是否触碰过 `M` 石像。
2. 存档中 `progress.lastStatue` 是否存在。
3. `progress.unlockedStatues[lastStatue]` 是否包含有效 `mapId/x/y`。
4. 对应坐标是否可通行（`isPassable`）。

定位文件：
- `src/game/world-events.js`（石像激活与传送）
- `src/game/battle-system.js`（`resolveRevivePoint`）

### 2) 使用避怪丹后仍频繁遇怪
预期行为：
- 避怪丹仅屏蔽普通 `g/w` 遭遇。
- 不屏蔽 `d/r/s` 特殊生态点。

检查项：
1. `player.repelSteps` 是否大于 0。
2. `attemptMove()` 是否在每步调用 `consumeRepelStep()`。
3. `handleTileEvent()` 中普通遭遇前是否判断 `hasRepelEffect()`。

定位文件：
- `src/game/world-events.js`
- `src/game/rendering.js`（`useBagItem` 的 repel 分支）

### 3) 新地图门（O/K/P/U）不触发
检查项：
1. 地图字符串中是否包含对应字符。
2. `handleMapTransition()` 是否包含当前 map + tile 分支。
3. 是否被前置旗标拦截（`gymWon`、`breederDefeated` 等）。
4. 角色是否真的踩在门位字符上。

定位文件：
- `src/game/globals.js`（地图数据）
- `src/game/world-events.js`（过图逻辑）
- `src/game/rendering.js`（门位标记渲染）

### 4) 战斗中无法切换精灵
检查项：
1. 是否有可上场后备精灵（非当前且 HP > 0）。
2. `state.battle.showSwitchPanel` 是否正确切换。
3. `handleBattleAction({ type: "switch" })` 是否被锁定状态拦截。

定位文件：
- `src/game/ui-panels.js`（切换面板渲染）
- `src/game/world-events.js`（切换按钮事件）
- `src/game/battle-system.js`（切换回合结算）

### 5) AI 面板显示在线但仍不能生成
检查项：
1. `GET /api/ai/health` 的 `imageProviderReady` 是否为 `true`。
2. 当前 dev-server 是否为最新进程（避免旧进程占用端口）。
3. 是否有可用 key：`GEMINI_API_KEY` 或 `AISERVICEPROXY_API_KEY`。

快速命令（PowerShell）：
```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4310/api/ai/health
```

### 6) 任务日志或页面文本出现乱码
检查项：
1. 相关文件是否按 UTF-8 保存。
2. 是否仍有历史乱码字符串残留。
3. 重启本地服务后复测日志输出。

重点文件：
- `index.html`
- `scripts/dev-server.mjs`
- `docs/*.md`

### 7) 立绘任务显示完成，但队伍或剧情面板没更新
检查项：
1. 玩家立绘完成后是否写入 `characters:player`，并刷新 `state.storyFocus` 到主角。
2. 怪兽立绘加载完成后，`loadArtImage()` 是否触发了队伍/仓库/图鉴/切换面板刷新。
3. `assets.generated.js` 是否包含最新 key，且 key 与渲染时查询 key 一致。

定位文件：
- `src/game/bootstrap-ai.js`（`handlePlayerPortraitTask`、`loadArtImage`）
- `src/game/ui-panels.js`（`getMonsterArtKeys`、队伍/仓库/战斗切换渲染）

### 8) 与 NPC 互动后立绘没有自动弹出
检查项：
1. `interact()` 是否调用了 `requestNpcPortraitOnInteract(npc.id)`。
2. 当前 NPC 是否已有可用资源键（`characters:<npcId>` / `characters:npc_<npcId>`）。
3. 自动触发是否被冷却节流（`npcArtState.interactCooldownMs`）限制。
4. 任务完成后 `handleNpcPortraitTask()` 是否刷新了 `state.storyFocus` 到目标 NPC。

定位文件：
- `src/game/world-events.js`
- `src/game/bootstrap-ai.js`

### 9) 商店页面过大/选项塞不下
检查项：
1. 是否走了 `openMerchantMainMenu -> openMerchantCategoryPage` 两层流程。
2. `MERCHANT_PAGE_SIZE` 是否生效。
3. 分类页是否包含上一页/下一页导航项。

定位文件：
- `src/game/world-events.js`

### 10) 融合/吞噬后看不到“特性变化”
检查项：
1. `performFusionEvolution/performDevourEvolution` 是否写入 `mutation.trait`。
2. `normalizeMutation()` 是否保留 `trait` 字段（避免读档或归一化丢失）。
3. 队伍卡片是否使用 `formatSkillAndTraitLine()`。

定位文件：
- `src/game/ui-panels.js`
- `src/game/rendering.js`

### 11) 首遇精灵没有弹出“图鉴立绘二选一”
检查项：
1. `startWildBattle()` 是否调用 `requestFirstEncounterPokedexPortraitChoices(speciesId)`。
2. `/api/ai/health` 中 `imageProviderReady` 是否为 `true`。
3. 两个候选任务是否都完成并写入 `state.pokedex.candidates[speciesId]`。
4. 当前是否处于战斗或已有选择框（`state.scene === "battle"` / `state.choice`），导致延后弹窗。
5. 若两张候选都失败，系统会清理本轮 pending；再次遭遇该物种时应自动重试。

定位文件：
- `src/game/world-events.js`
- `src/game/bootstrap-ai.js`
- `src/game/ui-panels.js`

### 12) 已配置内网 Key，但 AI 面板仍显示“缺少 Key”
检查项：
1. 项目根目录是否存在 `.env.local`，且包含 `AISERVICEPROXY_API_KEY`。
2. 当前服务是否为新进程（旧进程可能未加载 `.env.local`）。
3. `GET /api/ai/health` 的 `imageProvider` 是否为 `proxy`，`imageProviderReady` 是否为 `true`。
4. `.env.local` 是否被误提交；密钥应仅保存在本地文件或系统环境变量。

快速命令（PowerShell）：
```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4310/api/ai/health
```

定位文件：
- `scripts/load-local-env.mjs`
- `scripts/dev-server.mjs`
- `scripts/generate-runtime-asset.mjs`

### 13) 新增精灵在游戏里不出现或立绘不显示
检查项：
1. `speciesData` 是否存在该 `speciesId`，且 `skills` 都在 `moveData` 中可用。
2. `speciesBattleProfiles` 是否包含该物种（尤其是双属性与成长曲线）。
3. 对应地图的 `encounters / dustEncounters / rippleEncounters / shakingEncounters` 是否真的注入该物种。
4. `assets.generated.js` 中是否存在同名 `monsters.<speciesId>` 资源键。
5. 若资源键存在但画面无图，检查文件路径是否存在（如 `assets/monsters/<speciesId>.png`）。

快速命令（PowerShell）：
```powershell
node scripts/generate-runtime-asset.mjs --type monster --id <speciesId> --prompt "<prompt>" --json
```

定位文件：
- `src/game/globals.js`
- `assets.generated.js`
- `assets/monsters/*`

### 14) 已击败 Apex，但没有收到奖励
检查项：
1. 该物种是否在 `speciesData` 中标记了 `isApex: true`。
2. 遭遇对象是否在开战时写入 `enemy.isApex`（`startWildBattle`）。
3. 战斗结算是否命中 `finishBattle("win")` 的 Apex 分支。
4. 存档中 `progress.apexDefeated[speciesId]` 是否被写入与递增。
5. 若是捕捉结束（`captured`）而不是击败结束（`win`），当前版本不会触发 Apex 击败奖励。

定位文件：
- `src/game/world-events.js`
- `src/game/battle-system.js`
- `src/game/bootstrap-ai.js`
- `src/game/rendering.js`

### 15) 新建竞赛项目后无法启动或缺少合规文件
检查项：
1. 是否通过脚本创建（`npm run contest:bootstrap -- --target ...`），而不是手工不完整拷贝。
2. 新项目是否执行过 `npm install`。
3. `COMPLIANCE/` 下四个文件是否存在：
   - `import-manifest.json`
   - `third-party-declaration.md`
   - `creation-journal.md`
   - `submit-checklist.md`
4. 如果目标目录已存在，是否带了 `--force` 导致旧文件混杂。

快速命令（PowerShell）：
```powershell
npm run contest:bootstrap -- --target ..\GBIT_GAME_CONTEST --profile web-minimal --force
```

定位文件：
- `scripts/bootstrap-competition-project.mjs`
- `tasks/competition-import-quickstart.md`

### 16) 提交前被指出“AI 产出时间不合规”或“赛前资源未声明”
检查项：
1. `COMPLIANCE/third-party-declaration.md` 的 AI 输出表是否逐条填写：
   - 生成时间（本地时间）
   - provider/model
   - 证据路径（日志、截图、任务记录）
   - 是否赛期内重生成（Y/N）
2. `COMPLIANCE/creation-journal.md` 是否按天记录了实际产出与证据。
3. 赛前参考/模板/素材是否在声明文档中标注来源、用途与赛期重做状态。
4. 若存在赛前 AI 旧图或旧代码，最终构建是否替换为赛期内重新生成版本。

快速命令（PowerShell）：
```powershell
Get-Content COMPLIANCE\\third-party-declaration.md -Raw
Get-Content COMPLIANCE\\creation-journal.md -Raw
```

定位文件：
- `COMPLIANCE/third-party-declaration.md`
- `COMPLIANCE/creation-journal.md`
- `COMPLIANCE/submit-checklist.md`
- `scripts/bootstrap-competition-project.mjs`

### 17) 页面看不到最新改动（仍是旧逻辑/旧文案）
检查项：
1. `index.html` 中 `styles.css` 与脚本资源是否带版本戳（如 `?v=20260326e`）。
2. 浏览器是否执行过 `Ctrl+F5` 强刷。
3. 当前端口是否由正确项目进程提供（避免旧项目占用同端口）。
4. 若本地有 Service Worker（本项目默认无），确认未缓存旧 bundle。

快速命令（PowerShell）：
```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4310/ | Select-Object -ExpandProperty Content
```

定位文件：
- `index.html`
- `scripts/dev-server.mjs`

### 18) 融合立绘二选一“选了没下文”
检查项：
1. 融合后是否先出现“融合成功，正在生成立绘候选（A/B）”对话。
2. 候选弹窗打开前是否已有 `state.choice` 占用（冲突会导致新弹窗不可见）。
3. `queueFusionPortraitChoices()` 是否在 `state.choice` 冲突时先 `closeChoice()` 再 `openChoice(...)`。
4. 家园工坊面板是否被重复 toggle 折叠，导致交互中断（应只在折叠态打开）。
5. AI 健康状态是否可用（候选生成失败会回退到“稍后许愿台重试”）。

定位文件：
- `src/game/ui-panels.js`
- `src/game/world-events.js`
- `src/game/bootstrap-ai.js`

### 19) 吞噬回退后看起来“没还原干净”
检查项：
1. 回退后 `mutation.mode` 预期为 `none`（不是空字符串）。
2. `state.progress.alchemyHistory` 是否被正常弹栈（长度减少）。
3. 元素资源是否恢复到吞噬前（例如 `grass` 与 `void`）。
4. 若玩家感知异常，先跑自动验收中的回滚用例确认是否可复现。

定位文件：
- `src/game/ui-panels.js`
- `scripts/acceptance-interaction.mjs`

### 20) 连点吞噬/融合按钮导致重复执行
检查项：
1. `alchemyOperationBusy` 是否在流程开始后置为 `true`，结束后回落。
2. 进化工坊按钮在 busy 状态是否被禁用。
3. 日志是否出现 `ignored: previous alchemy operation is still running`，用于确认防重入已生效。

定位文件：
- `src/game/ui-panels.js`

## 一键回归（新增）

可运行自动交互验收脚本（需本机可用 Chrome/Edge）：

```powershell
node scripts/acceptance-interaction.mjs
```

覆盖项：
1. NPC 回车互动自动触发立绘任务。
2. 商店分类与分页导航。
3. 融合进化生效 + 融合立绘候选弹窗与选择闭环。
4. 吞噬进化后回滚快照恢复（资源/变异状态回归）。
5. 融合立绘 A/B/暂不选择三分支行为。
6. 首遇图鉴双候选立绘与二选一定稿。

## 本轮新增排查案例（2026-03-19）

### 案例 A：新增地图/训练师“有数据没玩法”
- 现象：地图和训练师在数据里存在，但无法进入或无法触发战斗。
- 根因：缺少 `handleMapTransition` 与 `interact*` 连接。
- 处理：补齐过图分支、NPC 交互函数、训练师胜利奖励与旗标。

### 案例 B：`repel_orb` 道具存在但无效果
- 现象：背包能看到避怪丹，但野外遇怪频率不变。
- 根因：缺少 `useBagItem` 中 `kind: "repel"` 执行分支与移动消耗逻辑。
- 处理：在 `rendering.js` 添加道具效果，在 `world-events.js` 添加每步消耗与遭遇抑制判定。

### 案例 C：AI 任务日志乱码
- 现象：任务状态中文显示异常，部分文本不可读。
- 根因：`scripts/dev-server.mjs` 历史编码污染。
- 处理：重写任务日志文本与 fallback 标题为 UTF-8 文案。

### 案例 D：立绘任务成功但前端未即时替换
- 现象：日志显示“玩家立绘已生成完成并应用”，但侧栏或队伍卡片仍显示旧图/文字占位。
- 根因：剧情焦点未固定到主角；怪兽图像加载后未主动刷新队伍类面板。
- 处理：玩家任务完成后强制刷新 `storyFocus`，并在资源加载回调中补齐面板级 refresh。

### 案例 E：立绘其实已加载，但几乎看不见
- 现象：日志显示命中缓存并已应用，但立绘区域只剩极浅轮廓。
- 根因：前端将白色渐变遮罩以高透明度（0.96~0.98）叠在图片上层，视觉上接近“整张白化”。
- 处理：移除立绘 `background-image` 里的白色遮罩层，仅保留 `url(...)`。

### 案例 F：玩家立绘无法继续收藏
- 现象：点击收藏无效或提示达到上限。
- 根因：收藏位上限由 `3 + badges` 决定，当前徽章不足；或收藏列表已满。
- 处理：先确认 `state.player.badges` 和 `state.playerPortrait.favorites.length`，再验证上限计算是否正确。

### 案例 G：功能面板底部内容被裁切，无法操作
- 现象：右侧功能面板展开后，看得到上半部分但底部按钮/卡片无法滚动到，像“被折叠”。
- 根因：`.utility-panel` 使用固定 `max-height` 且 `overflow: hidden`，超出区域没有滚动容器。
- 处理：
  1. 展开态改为 `overflow-y: auto`、`overflow-x: hidden`。
  2. 添加 `scrollbar-gutter: stable`，确保滚动轨道可见。
  3. 折叠态保留 `overflow: hidden`，避免动画过程中漏出内容。
- 定位文件：`styles.css`（`.utility-panel` 与 `::-webkit-scrollbar` 样式）。
