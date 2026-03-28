# Balance Config（数值配置模块）

## 目标
- 将可调数值从玩法逻辑中解耦，集中到单文件配置。
- 配置异常时自动回退默认值，不影响游戏可玩性。

## 配置文件
- 路径：`E:/Ai/Vibecoding_Game/config/balance-config.json`
- 加载顺序：
  1. 默认配置（代码内）
  2. `config/balance-config.json`
  3. 本地覆盖（`localStorage` 的 `gbit_balance_config_v1`）

后者会覆盖前者。

## 当前可调项
```json
{
  "encounter": {
    "wildLevelOffsetGlobal": 0,
    "wildLevelOffsetByMap": {
      "route": 0,
      "meadow": 0,
      "lake": 0
    },
    "trainerLevelOffsetGlobal": 0,
    "trainerLevelOffsetByTrainer": {
      "tutorial_aide": 0,
      "scout": 0,
      "vanguard": 0,
      "leader": 0
    }
  },
  "economy": {
    "shopPriceMultiplier": 1,
    "sellPriceMultiplier": 1,
    "battleCoinMultiplier": 1
  }
}
```

## 建议改法（给后台 AI）
1. 只改 `config/balance-config.json`，不改 `src/game/*.js`。
2. 每次只改一组参数（例如先改 `wildLevelOffsetByMap`）。
3. 保存后强刷页面（`Ctrl+F5`）。
4. 快速验收：
   - 新开一档，观察野怪等级是否变化。
   - 商店价格与出售价格是否按倍率变化。
   - 战斗胜利金币是否按倍率变化。

## 安全边界
- 模块会做数值钳制与类型检查。
- 非法配置会被忽略并回退默认，不会让主流程崩溃。

