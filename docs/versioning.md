# Versioning 规则（GBIT Monster Quest）

## 1. 版本格式

统一使用：

`MAJOR.MINOR.PATCH-STAGE.BUILD`

示例：`0.9.0-demo.1`

- `MAJOR`：破坏性变更（存档结构不兼容、核心交互重做）。
- `MINOR`：可感知的功能里程碑（新地图/新系统/主线阶段落地）。
- `PATCH`：向后兼容修复（bug 修复、UI 修复、稳定性增强）。
- `STAGE`：发布阶段，建议固定枚举：`dev` / `demo` / `rc` / `release`。
- `BUILD`：同一 `MAJOR.MINOR.PATCH-STAGE` 下的发布序号，从 `1` 递增。

## 2. 当前版本

- 当前版本：`0.9.0-demo.1`
- 日期：`2026-03-27`
- 代号：`Mond Meadow Sprint`

## 3. 变更判定规则

1. 存档不兼容或主循环重构：`MAJOR +1`，其余清零，`BUILD=1`。
2. 新增可演示功能闭环：`MINOR +1`，`PATCH=0`，`BUILD=1`。
3. 不改变玩法范围的修复：`PATCH +1`，`BUILD=1`。
4. 同日多次发布同版本线：仅 `BUILD +1`。

## 4. 文件与更新流程

单一版本源文件：

- [version.json](/E:/Ai/Vibecoding_Game/version.json)

前端展示文件（自动生成）：

- [version.js](/E:/Ai/Vibecoding_Game/version.js)

更新步骤：

1. 修改 `version.json`（版本号、日期、代号、`cacheTag`）。
2. 执行 `npm run version:sync` 生成 `version.js`。
3. 如有静态资源缓存问题，使用新的 `cacheTag` 更新 `index.html` 的 `?v=...`。
4. 执行 `npm run version:show` 自检输出。
5. 在 `docs/context-log.md` 追加该版本关键变更记录。

## 5. 演示前建议

- 演示版仅用 `demo` 阶段标记，避免与开发中临时版本混淆。
- 演示开始前冻结版本，不再变更 `MAJOR/MINOR/PATCH`，只在必要时递增 `BUILD`。
