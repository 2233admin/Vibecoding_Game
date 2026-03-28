# GBIT Monster Quest

## 本次同步说明（2026-03-29）

### 本次修改了什么

- 修复神兽幼体缔约战卡主线：该教学战敌方攻击固定为 `1`，我方最低保留 `1 HP`，并补强捕捉教学补给。
- 推进《理念之争》主线 v1：新增入口 NPC（辰铃）、对立战斗（赫恩）与道馆方向引导口播。
- 修复镜前立绘选择 UI：解决溢出问题，收敛为“系统默认 / 自定义生成”两条路径，默认立绘支持预览与说明。

### 还存在什么问题

- 《理念之争》反派战强度波动，部分局可能偏弱，压迫感不稳定。
- 特殊进化仍偏向家园流程，尚未完善“背包内直接进行”的顺滑体验。
- 对战 UI 仍需继续优化（信息层次、按钮反馈、视线动线）。
- 前端视觉风格尚未完全统一（组件细节与色彩系统还在收口）。

### 新增高优先遗留

- `config/trait-balance.json` 已产出但未完整接入运行时，存在“配置改了但实战未完全生效”的风险。
- 主线保底范围目前偏大（已覆盖到道馆馆主战），保障了不卡关但会削弱挑战感。
- 《理念之争》缺少专用回归链路用例，后续改动有再次改断主线的风险。

## 最近更新（2026-03-28）

- **剧情过场系统**：新增帧式双屏开场动画（台词 + 渐变切场），序幕可跳过
- **战斗技能学习**：升级/进化后弹出技能解锁面板，支持替换已有技能（4 选 1）
- **战斗结算优化**：胜利/失败/逃跑后展示战斗摘要，再进入保存确认流程
- **特性（Trait）系统**：怪兽新增被动特性，影响伤害、命中、速度等战斗参数
- **UI 优化**：选项按钮双列对称布局，战斗信息面板样式重构
- **平衡调整**：IV 系统、经验公式、防御系数持续微调

---

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
