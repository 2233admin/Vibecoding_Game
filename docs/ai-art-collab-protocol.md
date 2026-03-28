# AI 美术协作协议（可执行版）

适用目录：`E:/Ai/Vibecoding_Game`
最后更新：2026-03-28

## 1. 角色边界
- 主开发 AI：负责玩法、UI、系统、接线、发布。
- 美术 AI：负责人物/精灵立绘生成、风格统一、素材命名。
- 美术 AI 不改动以下文件：
`src/game/**/*.js`、`index.html`、`styles.css`。

## 2. 人物素材目录规范（已生效）
- 玩家立绘：`assets/characters/player/`
- NPC 立绘：`assets/characters/npc/`

## 3. 精灵素材目录规范（已生效）
- 普通精灵：`assets/monsters/normal/<species_id>/<base|fusion|devour>/stage<0|1|2>/`
- 传说精灵：`assets/monsters/legendary/<species_id>/<base|fusion|devour>/stage<0|1|2>/`

命名建议：
- 保持资产 key 与文件名一致（便于程序自动映射）。
- 例如：
  - `dex_sprigoon_v1.jpg` -> `.../normal/sprigoon/base/stage0/`
  - `sprigoon_fire_fusion.png` -> `.../normal/sprigoon/fusion/stage0/`
  - `evo_solaraith_devour_fire_devour_t4.jpg` -> `.../legendary/solaraith/devour/stage2/`

命名建议：
- 玩家：`player*.jpg/png`、`male_*.jpg/png`、`female_*.jpg/png`
- NPC：`professor.jpg`、`merchant.jpg`、`npc_<role>.jpg/png` 或 `<role>.jpg/png`

## 4. 提交流程
1. 生成并放置素材到正确目录（`player/` 或 `npc/`）。
2. 在 `docs/art-asset-log.md` 记录新增素材与用途。
3. 在 `docs/context-log.md` 追加本轮改动摘要。
4. 把“交接包模板”发给主开发 AI。

## 5. 交接包模板（每轮必填）
```md
## 本轮目标
- 

## 新增/替换素材
- 路径：
- 对应 key：
- 用途（玩家/NPC/剧情）：

## 风格说明
- 参考风格：
- 本轮统一规则（线稿/配色/背景/构图）：

## 提示词摘要
- 

## 需要主开发 AI 执行
- 例如：manifest 映射、入口接线、回退资源设置

## 风险与回滚
- 
```

## 6. 当前关键规则
- 新人物素材不得再写入 `assets/characters/` 根目录。
- 新精灵素材不得再写入 `assets/monsters/` 根目录。
- 默认先放到子目录，再做映射接线。
- 若不确定是玩家还是 NPC，一律先放 `npc/`，并在交接包中标注“待确认”。
