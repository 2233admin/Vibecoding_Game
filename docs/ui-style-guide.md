# GBIT Monster Quest 前端设计系统（PC 网页端 v0.1）

## 1. 设计目标
- 面向 PC 端游玩，优先保证 `1920x1080` 到 `1366x768` 都可完整游玩，不依赖浏览器缩放。
- 体验目标是“宝可梦式信息清晰 + 本项目世界观风格”，避免后台管理页既视感。
- 前 10 分钟做到：看得懂、点得到、切得快、关得快。

## 2. 视觉原则
1. 沉浸优先：游戏画面始终可见，不使用全白全屏面板覆盖世界。
2. 层级清晰：同屏最多 3 个视觉层级（世界层、HUD 层、交互层）。
3. 操作导向：高频操作入口必须固定且可预判位置。
4. 反馈即时：点击、切页、确认都要有明确状态反馈。
5. 一致性优先：同类功能必须使用同一组件与同一交互模式。

## 3. 色彩基调（Design Tokens）

### 3.1 品牌与中性色
- `--bg-world-top: #9FD3FF`
- `--bg-world-bottom: #5F8E74`
- `--surface-0: #0F1A2A`（深底）
- `--surface-1: #1A2B44`
- `--surface-2: #243A59`
- `--panel-light: #F5F7FB`
- `--text-primary: #EAF2FF`
- `--text-secondary: #AFC2DD`
- `--text-dark: #2A3140`

### 3.2 强调色
- `--accent-primary: #3FA9F5`（主交互蓝）
- `--accent-secondary: #FDBA3B`（强调橙）
- `--accent-success: #6FCF7A`
- `--accent-danger: #E06A6A`
- `--accent-focus: #8AD5FF`

### 3.3 功能色（状态）
- 可点击：`--accent-primary`
- 选中：`--accent-secondary`
- 禁用：`#6E7D93` + `opacity: 0.58`
- 警告：`#FFB454`
- 错误：`#FF6B6B`

## 4. 字体与排版规范
- 字体栈：
  - 中文 UI：`"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif`
  - 标题装饰：`"Trebuchet MS", "Segoe UI", sans-serif`
- 字号阶梯（PC）：
  - `12` 辅助
  - `14` 正文
  - `16` 卡片标题
  - `20` 大标题
  - `28` 一级标题
- 行高：
  - 标题 `1.2`
  - 正文 `1.45`
- 字重：
  - 正文 `400/500`
  - 按钮与关键数值 `700/800`

## 5. 空间与形状规范
- 4pt 栅格：所有间距按 `4/8/12/16/20/24/32`。
- 圆角：
  - 小按钮 `10-12`
  - 卡片 `16-20`
  - 主面板 `24`
- 阴影：
  - 仅两档：`elevation-1`（轻）/`elevation-2`（重）
  - 禁止每个模块自定义一套阴影参数。

## 6. 组件规范（核心）

### 6.1 按钮
- 主按钮：高对比填充色，用于“执行/确认”。
- 次按钮：深底描边，用于“切换/返回”。
- 危险按钮：仅删除、清档、回滚使用。
- 高度统一：
  - 常规 `38-42px`
  - 关键操作 `44-48px`

### 6.2 标签页（Tab）
- 一行最多 6 个，超出必须分页或二级分组。
- 选中态必须有两种以上信号：颜色变化 + 指示条/形状变化。
- 不允许“选中态与未选中态只有轻微色差”。

### 6.3 面板与列表
- 列表项分两区：
  - 左侧：名称 + 属性
  - 右侧：数值 + 主操作
- 每个列表项最多一个主操作按钮，次操作折叠到展开区。

### 6.4 对话框
- 对话框宽度建议 `52% - 68%`。
- 禁止全屏对话框作为常态交互。

## 7. 布局模板（PC）

### 7.1 探索态 HUD 模板
- 顶部：地图名、步数/状态、队伍概览、操作提示。
- 右下：高频快捷入口（背包/队伍/地图/返回）。
- 底部：剧情对话日志（低占高，默认折叠到 2-3 行）。

### 7.2 系统菜单模板（主菜单）
- 覆盖范围：画面 `72% 宽 / 78% 高`，四周保留世界可见。
- 结构：头部信息 + 一级 Tab + 左列表右详情内容区。
- 一级菜单建议仅保留：`背包/队伍/图鉴/设置`。
- `仓库/进化/立绘` 进入二级页，减少首层复杂度。

### 7.3 战斗 HUD 模板
- 左下：我方信息卡（名称、等级、HP、状态）。
- 右上：敌方信息卡（同结构）。
- 右下：四宫格行动区（技能/道具/切换/逃跑）。
- 底部：战斗日志条，支持逐条推进。

### 7.4 对话演出模板
- 角色名牌 + 半透明黑底对话框。
- 重要剧情支持“主角名高亮”与关键词色彩强调。

## 8. 交互规则

### 8.1 输入映射（PC）
- 移动：`WASD / 方向键`
- 交互：`Space / E / Enter`
- 回城：`H`
- 菜单：`B/T/Y/R`（对应标签）
- 关闭：`Esc / B`（在菜单内）

### 8.2 动效节奏
- 开关面板：`180ms - 220ms`
- 切页：`140ms - 180ms`
- 强调反馈（成功/失败）：`260ms - 320ms`
- 禁止超过 `400ms` 的常规 UI 动效，避免拖沓。

### 8.3 状态反馈
- 按钮点击必须立即反馈（hover/active/loading/disabled）。
- 异步任务必须有：进度、结果、可重试入口。
- 所有关键操作需可撤回或有二次确认。

## 9. 可用性与可访问性规则
- 文字与背景对比度尽量不低于 WCAG AA 参考（普通文本 4.5:1）。
- 仅用颜色表达状态时，必须附加图标或文案。
- 可点击区域最小建议 `36x36px`。
- 焦点可见：键盘操作时有明确 focus ring。

## 10. 工程落地规则
- `styles.css` 中所有颜色、阴影、圆角、间距必须变量化，禁止写死散落值。
- 新增组件先入“组件规范”，再进页面。
- UI 改动 PR 必须附：
  - 对应模板名（探索/菜单/战斗/对话）
  - 使用到的 token
  - 交互规则对照项

## 11. 迭代路线（建议）
1. 第一阶段（1 天）：
   - 抽离 token（颜色/圆角/阴影/间距/字号）。
   - 收口系统菜单为中尺寸非满屏布局。
2. 第二阶段（1 天）：
   - 重做探索 HUD 与菜单骨架（一级/二级信息架构）。
   - 统一按钮、tab、列表组件。
3. 第三阶段（0.5-1 天）：
   - 战斗 HUD 对齐模板。
   - 完成交互动效与焦点态统一。

## 13. 立绘美术规格（角色 & 精灵）

### 13.1 风格基线
- 参考样本（必须对齐）：
  - `assets/characters/player_9dc5d6c1.jpg`（主角，宝可梦动画风）
  - `assets/characters/home_spring.jpg`（NPC，奇幻 RPG 风，可接受）
- 禁止生成：chibi 比例（头身比 > 1:4）、纯扁平无渐变阴影

### 13.2 尺寸规格（强制）
- 目标尺寸：**768 × 1024 px**（3:4 竖版）
- Proxy 调用：`size: [768, 1024]`（已在代码中设置）
- Gemini 调用：`imageConfig.aspectRatio = "3:4"`（代码默认值，不需要手动传）
- 最终产物若尺寸不一致，必须经 PIL 裁白边 + resize 到 768×1024 再入库

### 13.3 提示词固定后缀（每张必带）
```
portrait orientation, vertical full-body composition, 3:4 aspect ratio,
Pokemon anime trainer art style, anime proportions (1:5 to 1:6 head-to-body ratio),
detailed cel-shading with soft gradients, bold clean black outlines,
detailed clothing and accessories, full body portrait,
solid white background, no text, no watermark, no background elements
```

### 13.4 角色命名规范
```
{gender}_{style}_v{n}.{ext}
```
示例：`female_urban_v1.jpg`、`male_cool_v2.jpg`

**落盘路径（自动按 key 分流）：**
- `player` / `female_*` / `male_*` → `assets/characters/player/`
- 其余所有 NPC key → `assets/characters/npc/`
- 分流逻辑见 `scripts/character-asset-paths.mjs`

性别前缀：`female` / `male`
风格 key（固定 12 个）：
- female：urban / scholar / wild / fairy / energetic / mature
- male：hotblood / cool / artistic / rugged / sunny / mystery

### 13.5 精灵立绘规格

**尺寸：** 1024×1280 px（4:5），与现有 dex_ 文件一致
**落盘路径：** `assets/monsters/`
**命名：** `{species_id}.jpg`，图鉴候选 `dex_{species_id}_v{n}.jpg`

#### 三形态提示词后缀（核心差异）

| 形态 | 体型 | 质感 | 眼神 | 特效 | 姿态 |
|------|------|------|------|------|------|
| 幼年体 | 头大身小，四肢短圆 | 毛绒/软皮 | 圆大明亮带稚气 | 极轻微（小火星/嫩芽） | 好奇/蹲伏/歪头 |
| 青年体 | 头身趋均衡，开始修长 | 局部甲片/晶体初现 | 聚焦警觉有锐度 | 中等，清晰可见 | 警戒站姿/蓄力 |
| 成熟体 | 完全体，魁梧复杂 | 全甲/全晶化/元素附着 | 锐利发光有压迫感 | 全开，粒子+冲击+光晕 | 战斗起势/冲击/俯冲 |

**幼年体固定后缀：**
```
juvenile stage, compact round body, large bright innocent eyes,
soft fluffy texture, stubby limbs, small and endearing,
subtle elemental hints only (tiny sparks or small buds), no heavy effects,
curious or playful pose, non-threatening presence,
official Pokemon-style creature art, detailed cel-shading with vibrant colors,
bold clean black outlines, dynamic composition, solid white background,
no text, no watermark, 4:5 aspect ratio
```

**青年体固定后缀：**
```
adolescent stage, growing medium build, proportions becoming balanced,
mix of soft and hardening textures, partial armor or crystal formations emerging,
focused alert expression, moderate elemental effects clearly visible,
alert ready stance, faint elemental ground trace,
official Pokemon-style creature art, detailed cel-shading with dynamic lighting,
bold clean black outlines, vibrant colors, solid white background,
no text, no watermark, 4:5 aspect ratio
```

**成熟体固定后缀：**
```
fully evolved mature stage, imposing powerful build,
full armor plating or crystal formations, complex signature design elements,
intense glowing eyes, fierce battle-ready expression,
dramatic elemental effects at full power (particles, aura, glow),
dynamic aggressive pose, ground impact or environmental destruction effect,
official Pokemon-style creature art, detailed cel-shading with dramatic lighting,
bold clean black outlines, vibrant saturated colors, solid white background,
no text, no watermark, 4:5 aspect ratio
```

## 12. 非目标（v0.1 不做）
- 暂不做移动端专属视觉方案。
- 暂不做多主题换肤系统。
- 暂不做复杂 3D UI 动画特效。
