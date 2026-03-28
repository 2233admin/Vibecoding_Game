# GBIT Monster Quest

一个可本地直接运行的宝可梦风单机原型，包含这些系统：

- 跑图探索
- 野外遭遇
- 回合制战斗
- 捕捉怪兽
- 等级成长与进化
- 主线剧情推进
- 道馆挑战
- 图鉴记录
- 自动存档

## 当前版本

- `v0.9.0-demo.1`（`2026-03-27`）
- 代号：`Mond Meadow Sprint`

版本规则见 [docs/versioning.md](./docs/versioning.md)。

常用命令：

```bash
npm run version:show
npm run version:sync
```

## 运行方式

直接在浏览器中打开 [index.html](./index.html) 即可。

如果你更想用本地静态服务，也可以在当前目录运行任意静态服务器再访问页面。

如果你要使用“自然语言实时生成怪兽立绘”的 AI 功能，推荐直接运行：

```bash
npm run dev
```

然后打开：

```text
http://127.0.0.1:4310
```

## 操作

- `WASD` / 方向键: 移动
- `E` / `Enter`: 互动
- 战斗中点击按钮释放技能、捕捉或逃跑

## 主线流程

1. 在晨曦镇找到教授并领取初始伙伴
2. 去 1 号道路捕捉 2 只野生怪兽
3. 挑战巡路员，证明你已经掌握基础战斗
4. 回去找教授领取道馆通行证
5. 进入道馆击败馆主，拿下第一枚徽章

## 说明

- 游戏会使用浏览器 `localStorage` 自动保存进度
- “重开新档” 会清空当前存档并从头开始
- 当前版本是原型，采用原创怪兽名称与简化规则，便于后续继续扩展地图、剧情、商店、技能和更多图鉴内容

## 加入美术资源

项目已经预留了本地资源入口，配置文件在 [assets.js](./assets.js)。

你可以按下面几类逐步替换：

- `scene`: 整张场景底图，例如城镇、道路、道馆的大背景
- `tiles`: 地块和建筑小图，例如地面、草丛、墙、喷泉、研究所、道馆门
- `characters`: 玩家和 NPC 立绘或顶视角精灵
- `monsters`: 战斗界面的怪兽头像或立绘

推荐尺寸：

- 地块：`48x48`
- 角色：`36x44` 或接近这个比例
- 怪兽战斗图：`96x96` 或更大正方形
- 场景底图：与画布比例接近即可，当前画布是 `768x576`

接入方式很简单：

1. 把图片放进你自己的本地目录，比如 `assets/tiles/`、`assets/characters/player/`、`assets/characters/npc/`
2. 打开 [assets.js](./assets.js)
3. 把对应键值取消注释并改成你的文件路径
4. 刷新浏览器页面

如果某个资源没配置，游戏会自动回退到代码绘制的默认风格，所以你可以边做边替换，不需要一次性补齐。

## 运行时与美术管线解耦

现在项目分成两条线：

- 游戏运行时资源：`assets/` + [assets.generated.js](./assets.generated.js)
- 美术生产管线：`art-pipeline/`（独立输出，不会自动影响游戏）

推荐流程（monster / character / scene / tile 都适用）：

1. 在美术管线生成（只写入 `art-pipeline/`）：

```bash
npm run art:generate:monster -- --id sprigoon
npm run art:generate:character -- --id scout
npm run art:generate:scene -- --id town
npm run art:generate:tile -- --id town_ground
```

批量生成 20 个通用 NPC 备用立绘：

```bash
# 在线高质量生成（需要 AISERVICEPROXY_API_KEY）
npm run art:generate:npc:batch

# 离线占位生成（无需 API key）
npm run art:generate:npc:placeholders
```

2. 验收后再发布到游戏运行时（按类型）：

```bash
npm run publish:assets -- monster
npm run publish:assets -- character
```

只发布指定资源：

```bash
npm run publish:assets -- character scout
npm run publish:assets -- monster sprigoon
```

## ComfyUI 本地生成

我已经把项目接成了“ComfyUI 生成 -> 保存到项目 `assets/` -> 游戏自动读取”的流程。

相关文件：

- 配置文件：[comfyui.config.json](./comfyui.config.json)
- 生成脚本：[scripts/generate-comfy-asset.mjs](./scripts/generate-comfy-asset.mjs)
- 预设提示词：[scripts/comfy-presets.mjs](./scripts/comfy-presets.mjs)
- 自动资源清单：[assets.generated.js](./assets.generated.js)
- 手动覆盖清单：[assets.js](./assets.js)

### 当前默认模型

已经按你给的模型路径写入默认配置：

`D:\comfyui\ComfyUI_Backup\ComfyUI_FLUX\models\checkpoints\chenkin-noob0.38_0309.safetensors`

默认会使用它的文件名：

`chenkin-noob0.38_0309.safetensors`

如果你的 ComfyUI 里显示的 checkpoint 名称不是这个，就把 [comfyui.config.json](./comfyui.config.json) 里的 `checkpointName` 改成 ComfyUI 实际识别到的名字。

### 先启动 ComfyUI

默认地址写的是：

`http://127.0.0.1:8188`

如果你的 ComfyUI 不是这个端口，就修改 [comfyui.config.json](./comfyui.config.json) 里的 `baseUrl`。

### 常用命令

列出怪兽预设：

```bash
npm run generate:monster:list
```

生成一张怪兽立绘并注册到游戏：

```bash
npm run generate:monster -- sprigoon
```

生成场景图：

```bash
npm run generate:scene -- town
```

自定义提示词生成：

```bash
npm run generate:monster -- sprigoon "cute grass seed cat creature, leaf sprout on back, anime creature portrait, centered, vibrant"
```

如果你想完全手动控制参数，也可以直接运行：

```bash
node scripts/generate-comfy-asset.mjs --type monster --id sprigoon --steps 32 --cfg 6
```

### 生成结果会去哪里

- 怪兽：`assets/monsters/<normal|legendary>/<species_id>/<base|fusion|devour>/stage<0|1|2>/<asset_key>.png`
- 角色：`assets/characters/player/<id>.png` 或 `assets/characters/npc/<id>.png`
- 场景：`assets/scene/<id>.png`
- 地块：`assets/tiles/<id>.png`

脚本会自动更新 [assets.generated.js](./assets.generated.js)，所以刷新 [index.html](./index.html) 后游戏就能直接读到新资源。

### 建议你先生成哪些

最推荐先做这几类，因为效果最稳定：

- `monster`: 战斗立绘，最适合用 SDXL 直接出图
- `scene`: 城镇、道路、道馆大背景

`character` 和 `tile` 也能生成，但通常还需要你后续手动修一下，尤其是顶视角角色和规则地块。

## 自然语言实时生成立绘

这版还额外接了一个本地 AI 服务，适合在游戏运行时直接输入描述生成怪兽立绘。

### 启动步骤

1. 启动你的 ComfyUI
2. 在项目目录运行：

```bash
npm run dev
```

3. 打开：

```text
http://127.0.0.1:4310
```

4. 在右侧的“AI 立绘工坊”里：

- 选择目标怪兽
- 输入自然语言描述
- 点击“生成当前怪兽立绘”

此外，你还可以在右侧“玩家形象生成”中输入提示词，直接替换主角立绘。

生成完成后：

- 图片会写入 `assets/monsters/<normal|legendary>/<species_id>/<base|fusion|devour>/stage<0|1|2>/<asset_key>.png`
- [assets.generated.js](./assets.generated.js) 会自动更新
- 战斗界面和图鉴会直接读到最新立绘

### 实时模式目前的行为

- 同一只怪兽、同一句提示词会优先命中本地缓存
- 任务会按队列顺序执行，避免同时塞太多生成请求
- 页面里会显示排队、生成中、完成或失败状态

### 相关文件

- 本地服务：[scripts/dev-server.mjs](./scripts/dev-server.mjs)
- 前端 AI 面板逻辑：[game.js](./game.js)
