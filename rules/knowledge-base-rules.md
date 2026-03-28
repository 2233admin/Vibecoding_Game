# Knowledge Base Maintenance Rules

## 文档范围
必须维护以下文档与代码一致：
- `docs/game-architecture.md`
- `docs/system-data-flow.md`
- `docs/debugging-guide.md`
- `docs/context-log.md`

## 知识库维护规范（必须遵守）
每次完成以下任一项后，必须立即更新相关知识库文档：
1. 完成一个子任务/功能。
2. 修复一个重要 bug。
3. 发现新的系统交互、限制、注意事项。
4. 新增或修改关键文件。

对应更新映射（强制）：
1. 子任务/功能完成：
   - 将新增实现逻辑、关键文件、系统交互、数据流补充到：
     - `docs/game-architecture.md`
     - `docs/system-data-flow.md`
2. 重要 bug 修复：
   - 在 `docs/game-architecture.md` 的「已知问题与修复记录」追加条目（根因/修复方式/影响范围）。
   - 在 `docs/debugging-guide.md` 的「常见问题排查」补充可复用排查步骤。
3. 新系统交互/限制/注意事项：
   - 更新到 `docs/game-architecture.md` 或 `docs/system-data-flow.md` 的对应章节。
4. 关键文件变更：
   - 必须同步更新 `docs/game-architecture.md` 的「关键文件索引」。

## 触发条件（必须立即更新）
当发生以下任一情况时，必须在同一轮提交中更新知识库：
1. 完成一个子任务/功能。
2. 修复一个重要 Bug。
3. 发现新的系统交互、限制、注意事项。
4. 新增或修改关键文件、关键流程、关键字段。
5. 新增底层 skill 或统一管线（如 AI 多图编辑核心模块）。

## 更新要求
1. 不只写“做了什么”，还要写清：
   - 为什么改
   - 影响范围
   - 如何验证
2. 新内容应补充到已有章节的合适位置，不允许只追加到文档末尾。
3. `game-architecture.md` 的「关键文件索引」必须保持最新。
4. 重要 Bug 必须在：
   - `game-architecture.md` 的「已知问题与修复记录」
   - `debugging-guide.md` 的对应排查章节
   同步留档。
5. `context-log.md` 必须记录当轮任务与验证证据。
6. 新增 skill 时，`game-architecture.md` 与 `system-data-flow.md` 必须同步说明其职责和调用链。
7. 涉及 AI provider / 密钥加载改动时，必须同步更新 `.env.example` 与对应排障说明，且真实密钥不得写入仓库。
8. 竞赛模式下新增导入/模板/脚本时，需同步更新合规文档路径与使用说明（如 `COMPLIANCE/*`、导入脚本、快速手册）。
9. 竞赛模式下若调整公平性口径（如赛期窗口、AI 重生成要求、赛前资源声明规则、核心体验优先而非资产堆砌的价值导向），必须同步更新：
   - `rules/project-rules.md`
   - `tasks/competition-import-quickstart.md`
   - `scripts/bootstrap-competition-project.mjs` 生成模板
   - 已创建竞赛项目中的 `COMPLIANCE/*.md` 模板文件

## 规则文件同步
每次知识库更新时，需同步检查并更新：
- `rules/project-rules.md`
- `rules/knowledge-base-rules.md`

## 质量红线
1. 文档与代码不一致，视为任务未完成。
2. 允许“重写到正确结构”，不允许继续叠加过时或乱码内容。
3. 所有文档文件使用 UTF-8 保存。
