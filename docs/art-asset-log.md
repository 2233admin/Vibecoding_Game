# Art Asset Log

## 记录规则
- 每次美术 AI 交付后追加一条。
- 一条记录只描述一个批次（同一目标、同一风格）。
- 如果是替换旧素材，必须写“替换原因”和“回滚路径”。

---

### 2026-03-28（主角立绘批次02 · 正式版）
- 目标：12 套主角立绘（female×6 / male×6），宝可梦动画风，修正比例与阴影
- 风格基线：player_9dc5d6c1.jpg，动漫比例 1:5~6 + 渐变 cel-shading + 粗线描边
- 产出文件：
  - assets/characters/female_urban_v1.jpg ✅
  - assets/characters/female_scholar_v1.jpg ✅
  - assets/characters/female_wild_v1.jpg ✅
  - assets/characters/female_fairy_v1.jpg ✅
  - assets/characters/female_energetic_v1.jpg ✅
  - assets/characters/female_mature_v1.jpg ✅
  - assets/characters/male_hotblood_v1.jpg ✅
  - assets/characters/male_cool_v1.jpg ✅
  - assets/characters/male_artistic_v1.jpg ✅
  - assets/characters/male_rugged_v1.jpg ✅
  - assets/characters/male_sunny_v1.jpg ✅
  - assets/characters/male_mystery_v1.jpg ✅
- 提示词摘要：各角色个性描述 + "Pokemon anime trainer art style, anime proportions 1:5 to 1:6, detailed cel-shading with soft gradients, bold clean black outlines, full body portrait, solid white background"
- 质量结论：待人工确认，需接线到角色选择界面


- 目标：生成 12 套主角立绘（female×6 / male×6），宝可梦动画风
- 风格基线：player_9dc5d6c1.jpg（动漫比例 + 渐变 cel-shading + 粗线描边）
- 产出文件：
  - assets/characters/female_urban_v1.jpg ⚠️ 风格不符（chibi 比例过强，待重做）
  - assets/characters/female_scholar_v1.jpg ⚠️ 风格不符（chibi 比例过强，待重做）
- 提示词摘要："chibi proportions + flat cel-shading" → 已确认错误，改为 "anime proportions 1:5~6 + detailed cel-shading with soft gradients"
- 质量结论：淘汰，需重新生成
- 风格问题记录：见 docs/ui-style-guide.md § 13
## 模板
```md
### YYYY-MM-DD HH:mm（批次名）
- 目标：
- 风格基线：
- 产出文件：
  - assets/characters/...
  - assets/monsters/...
- 对应 key：
- 提示词摘要：
- 质量结论（保留/淘汰）：
- 替换关系（可空）：
- 回滚路径（可空）：
```

