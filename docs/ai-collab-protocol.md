# AI 协作规范（模板）

最后更新：2026-03-27  
适用项目：`E:/Ai/Vibecoding_Game`

## 1. 协作目标
- 保证主开发与数值调优并行进行，互不阻塞。
- 避免“另一个 AI 改到玩法逻辑/界面代码”导致回归风险。
- 每次交接都有可追溯记录，方便快速定位问题。

## 2. 角色与边界（当前执行版）
- AI-A（主开发）：
  - 负责玩法逻辑、UI、剧情、系统功能、Bug 修复、重构。
  - 可修改 `src/`、`index.html`、`styles.css`、`docs/`、`scripts/` 等。
- AI-B（数值 AI，仅数值相关）：
  - 只允许修改数值配置，不改玩法代码。
  - 当前白名单文件：
    - `config/balance-config.json`
  - 可选说明文档（允许）：
    - `docs/context-log.md`
  - 明确禁止修改：
    - `src/game/**/*.js`
    - `index.html`
    - `styles.css`
    - 任意技能脚本与导出脚本

## 3. 分支与提交规则
- AI-A 分支建议：`codex/feature-*` 或 `codex/fix-*`
- AI-B 分支建议：`codex/balance-*`
- 禁止 AI-B 在同一提交中混入非白名单文件。
- 每次提交信息建议格式：
  - `balance: 调整蒙德草原野怪等级偏移`
  - `balance: 下调商店价格倍率`

## 4. AI-B（数值 AI）标准流程
1. 拉取最新代码并切到 `codex/balance-*` 分支。
2. 仅修改 `config/balance-config.json`。
3. 运行最小验证：
   - JSON 格式检查通过（无语法错误）。
   - 本地进入游戏验证 1 次核心体验（野怪等级/金币/商店价格至少一项符合预期）。
4. 记录变更摘要到 `docs/context-log.md`（可选但建议）。
5. 提交并附上“改动参数对照表”。

## 5. 合并前门禁（必须）
在主开发合并 AI-B 改动前，执行以下检查：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-balance-scope.ps1 -Base HEAD~1 -Head HEAD
```

或使用内联检查命令：

```powershell
$changed = git diff --name-only HEAD~1 HEAD
$allowed = @(
  "config/balance-config.json",
  "docs/context-log.md"
)
$illegal = $changed | Where-Object { $_ -notin $allowed }
if ($illegal) {
  Write-Host "发现越界改动:"
  $illegal | ForEach-Object { Write-Host " - $_" }
  exit 1
}
Write-Host "通过：仅包含允许的数值相关改动。"
```

如果 AI-B 不是单提交，请把 `HEAD~1 HEAD` 改为对应提交范围。

## 6. 交接模板（每次都填）
复制以下模板到交接消息或 PR 描述：

```md
## 本次目标
- 

## 实际改动文件
- config/balance-config.json

## 参数变更
- 参数名：旧值 -> 新值

## 体验预期
- 

## 已做验证
- 

## 风险与回滚
- 风险：
- 回滚方法：还原 config/balance-config.json 到上一个提交
```

## 7. 冲突处理规则
- 如果 AI-B 需要改 `src/` 才能实现目标：立即停止并交回 AI-A，不得自行越界。
- 如果数值改动导致主线卡关或体验异常：优先回滚数值文件，不回滚主开发功能。
- 发现同文件冲突时，以最新通过验证的一方为基准重新应用改动。

## 8. 推荐节奏
- 小步快跑：每次只调一组参数（例如仅调“野怪等级”）。
- 一次一验：每次提交后都做最小可玩验证。
- 先保可玩，再提难度：先确保“新手村 -> 蒙德草原 -> 草系道馆”完整可通关。

## 9. 外部工具包接入规则（ai-game-jam-toolkit）
- 允许吸收内容：
  - `prompts/*.md`：仅复制 prompt 模板给 Claude/Cursor 使用。
  - `ccg/consensus-gate.md`：同步到 `.cursorrules`，仅用于“架构/重构/复杂 bug”场景。
  - `tips/vibecoding-speedrun.md`：作为比赛攻略与流程参考。
  - `speedrun` 最后一节：用于统一设计 token 与组件规范。
- 明确禁止：
  - 不执行 `git checkout .` 这类覆盖式回退命令，避免误删未提交改动。
  - 不做引擎迁移（如迁到 Phaser/Kaplay），当前项目只吸收 prompt 与协作方法。
- 落地原则：
  - 外部规范如与本项目协议冲突，以本文件和 `docs/context-log.md` 已定规则为准。
