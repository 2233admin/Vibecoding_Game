# 作品打包规范（比赛提交版）

更新时间：2026-03-27  
适用项目：`E:/Ai/Vibecoding_Game`

## 1. 目标
- 同时兼顾评委复测与小白试玩。
- 保证提交材料完整，避免因包结构错误被卡。

## 2. 推荐交付物（双轨）
1. `web.zip`（主包，必须）  
说明：根目录必须包含 `index.html`，用于自动部署/在线试玩。
2. `windows.exe`（可选但强烈推荐）  
说明：给小白用户双击即玩，降低体验门槛。

## 3. 标准命名
- `GBIT_GAME_web_vX.Y.Z_YYYYMMDD.zip`
- `GBIT_GAME_win_vX.Y.Z_YYYYMMDD.zip`（若内含 exe，统一再套一层 zip）

示例：
- `GBIT_GAME_web_v0.9.0_20260327.zip`
- `GBIT_GAME_win_v0.9.0_20260327.zip`

## 4. web.zip 目录规范（必须）
压缩包解压后第一层应直接看到：

```text
index.html
styles.css
game.js
assets/
src/
version.json
version.js
assets.js
assets.generated.js
```

注意：
- 不要把整个工程目录再套一层父文件夹（避免评测脚本找不到 `index.html`）。
- 不要把 `node_modules` 打进 web 包。
- 不要把本地缓存、临时文件、日志截图等无关文件打进 web 包。

## 5. exe 包规范（推荐）
- 目录建议：

```text
GBIT_GAME_win_vX.Y.Z_YYYYMMDD/
  GBIT_GAME.exe
  README-运行说明.txt
  配置说明.txt
```

- `README-运行说明.txt` 至少包含：
  - 双击 `GBIT_GAME.exe` 运行
  - 首次启动若被系统拦截，允许“仍要运行”
  - 常见问题与反馈方式

## 6. AI 功能 Key 提醒（必须写在说明里）
如果 AI 生成功能依赖 Key，必须在提交说明和包内说明文件都明确写：

1. AI 功能默认可关闭，不影响主流程试玩。  
2. 使用 AI 功能需要用户自行配置 Key（示例：`GEMINI_API_KEY` / `AISERVICEPROXY_API_KEY`）。  
3. 项目不内置任何私人 Key，不在压缩包中提供真实密钥。  
4. 提供 `.env.example` 或等效配置模板，指导用户填写自己的 Key。  

推荐文案（可直接复制）：

```text
AI 立绘/生成能力需要你自行配置 API Key。
本作品不附带任何真实密钥。请参考 .env.example 填写后再启用 AI 功能。
未配置 Key 时，核心战斗与主线仍可正常游玩。
```

## 6.1 AI 不可用备用方案（已实现）
- 当 AI 服务不可用、Key 未配置或任务提交失败时，系统会自动降级：
  - 主角立绘：自动切换为项目内置精美立绘池；
  - 图鉴/遭遇立绘：优先回退到物种内置立绘；
  - 进化立绘：优先回退到该物种现有本地立绘。
- 目标是“不断流程、可继续试玩”，避免因 AI 问题影响评测。

## 7. 提交材料清单（提交前逐项勾选）
- [ ] 作品简介与玩法说明已填写
- [ ] `web.zip` 已上传（包含 `index.html`）
- [ ] `windows.exe` 包（可选）已上传
- [ ] 源代码仓库地址（`https://comgitlab.g-bits.com/`）已填写
- [ ] AI 对话记录已导出并上传
- [ ] 演示视频/图片已上传
- [ ] 包内已明确 AI Key 需用户自配

## 8. 截止时间提醒
- 提交窗口：2026-03-27 至 2026-03-29 23:59（Asia/Shanghai）
- 截止前可在官网【我的作品】反复替换更新，建议先交可跑版本，再滚动迭代。
