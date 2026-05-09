# 关卡系统 系统策划案

**文档版本**：v1.0  **系统ID**：level_system  **优先级**：P0  **复杂度**：M
**所属游戏**：围住Boss（Surround the Boss）

---

## 一、定位与目标

### 1.1 系统存在的理由

关卡系统是"围住Boss"游戏的内容骨架，负责定义和管理所有可玩关卡的数据配置、解锁规则和生命周期。游戏虽仅有两大关卡（教学关与核心挑战关），但每关的网格尺寸、障碍物分布、Boss出生点、出口位置等核心参数均由本系统统一配置和加载。离开了关卡系统，核心玩法系统将没有运行所需的地图数据。

具体而言，本系统解决以下四个核心问题：

1. **数据驱动**：所有关卡参数（网格尺寸、障碍物布局、Boss坐标、出口位置）存储在 `levels.json` 配置文件中，关卡系统负责加载和解析，使得修改关卡只需改配置文件，无需改动代码。
2. **解锁闭环**：定义"通关第1关后自动进入第2关"的解锁流程，管理关卡间的切换逻辑，确保玩家始终按正确的顺序体验内容。
3. **难度分层**：通过两关的差异化设计——第1关（7x7，教学导向，自动通关）与第2关（9x9，高难度，重复挑战）——实现从入门到挑战的平滑过渡，兼顾新手上手与硬核玩家的重复可玩性。
4. **商业化支撑**：第2关作为核心可重复内容，承担激励视频广告（失败后复活、额外步数获取）和社交分享（好友挑战步数排名）的商业化目标。

### 1.2 核心目标指标

| 目标维度 | 具体贡献 | 衡量方式 |
|---------|---------|---------|
| 第1关完成率 | 玩家顺利通过教学，理解核心玩法 | 第1关完成率 >= 95%（埋点：levelCompleted, levelId=1）|
| 第1关→第2关转化率 | 玩家在第1关完成后自动进入第2关的意愿 | 自动跳转到达率 >= 98%（埋点：levelStarted, levelId=2）|
| 第2关重复挑战率 | 玩家反复挑战第2关的意愿 | 日人均第2关挑战次数 >= 5次（埋点：levelStarted, levelId=2）|
| 第2关通关率 | 玩家最终成功通关第2关 | 第2关历史通关率 >= 25%（埋点：levelCompleted, levelId=2）|
| 第2关分享率 | 通关后分享朋友圈/好友的比例 | 通关分享率 >= 40%（埋点：levelShared, levelId=2）|
| 第2关激励视频转化率 | 失败后观看广告复活的转化率 | 广告观看率 >= 30%（埋点：adWatched, reason=retry, levelId=2）|
| 配置加载成功率 | levels.json 正确加载的比例 | 加载成功率 >= 99.9%（埋点：levelConfigLoaded）|
| 随机障碍物合法性 | 随机生成的障碍物布局不导致死局 | 死局发生率 < 0.5%（埋点：deadEndGenerated，触发重生成）|

### 1.3 与其他系统的关系

| 系统ID | 关系类型 | 具体说明 |
|--------|---------|---------|
| `gameplay_core` | 输出 | 提供当前关卡的地图数据（网格尺寸、障碍物初始布局、Boss出生点、出口位置）；接收对局结果并更新关卡状态 |
| `main_menu` | 输出 | 提供关卡解锁状态（第1关/第2关是否可进入），供主界面决定按钮文案（"开始挑战"/"继续挑战"/"再来一局"）|
| `data_system` | 输入 | 读取 `levels.json` 关卡配置数据，提供关卡参数的缓存和版本管理 |
| `ui_system` | 输出 | 向UI层发送关卡状态变更事件（levelLoaded、levelStarted、levelCompleted等）|
| `analytics_system` | 输出 | 输出关卡行为埋点数据（进入、完成、重试、分享）|
| `item_system` | 协作 | 第2关失败时检测玩家持有的复活/重开道具数量，提供道具消耗选项 |
| `ad_system` | 协作 | 第2关失败时提供激励视频广告复活入口 |
| `save_system` | 双向 | 保存关卡解锁状态和最佳通关记录；读取历史状态用于主界面显示 |

### 1.4 设计红线

- **教学闭环原则**：第1关必须确保玩家即使不操作也能自动通关，观看完整的"放置障碍物→Boss被围住→胜利"流程，零挫败感。
- **重复可玩原则**：第2关每次进入时随机障碍物布局不同（在约束条件下），确保每次挑战都有新鲜感，支撑反复游玩。
- **难度底线原则**：随机障碍物生成算法必须保证至少存在一条获胜路径，禁止生成无解的死局布局。生成后执行可达性校验，不通过则重新生成。
- **配置隔离原则**：所有关卡参数从 `levels.json` 读取，禁止在代码中硬编码关卡数据。新增关卡只需添加配置文件条目，无需修改任何业务代码。
- **状态持久化原则**：关卡解锁进度、最佳步数、通关次数等数据必须持久化到本地存储，防止游戏退出后丢失进度。

---

## 二、功能模块拆解

| 模块ID | 名称 | 职责描述 | 优先级 | 依赖 |
|--------|------|---------|--------|------|
| `LV-M1` | 关卡配置加载器 | 从 `levels.json` 读取并解析所有关卡配置，提供按关卡ID查询参数的能力 | P0 | 无 |
| `LV-M2` | 关卡解锁管理器 | 维护每个关卡的解锁状态（locked/unlocked/cleared），控制关卡进入权限 | P0 | `LV-M1` |
| `LV-M3` | 障碍物随机生成器 | 根据关卡配置的约束条件（数量、排除区域等）随机生成初始障碍物布局，含死局检测 | P0 | `LV-M1` |
| `LV-M4` | 关卡切换控制器 | 处理关卡间顺序切换（第1关→第2关自动跳转），向场景管理器发送切换指令 | P0 | `LV-M3`、`gameplay_core` |
| `LV-M5` | 关卡进度持久化 | 将关卡解锁状态、通关记录、最佳步数写入/读取 localStorage | P1 | `LV-M2` |
| `LV-M6` | 关卡校验器 | 检测 levels.json 的字段完整性和值合法性，启动时执行一次完整性校验 | P1 | `LV-M1` |
| `LV-M7` | 关卡重置器 | 允许重置某个关卡的全部进度（用于测试或玩家主动重置） | P2 | `LV-M5` |

---

## 三、核心玩法规则

### 3.1 关卡配置数据结构

关卡系统以 `levels.json` 为唯一数据源，JSON 结构定义如下：

```json
{
  "levels": [
    {
      "id": 1,
      "name": "初识Boss",
      "description": "跟着引导，学习如何围住Boss吧！",
      "gridSize": 7,
      "bossStart": { "x": 3, "y": 3 },
      "exits": "all_boundaries",
      "initialObstacles": {
        "count": 6,
        "fixed": [
          { "x": 0, "y": 1 },
          { "x": 1, "y": 0 },
          { "x": 6, "y": 5 },
          { "x": 5, "y": 6 }
        ],
        "randomCount": 2,
        "excludeRadius": 2
      },
      "autoPlay": {
        "enabled": true,
        "moveSequence": [
          { "x": 2, "y": 3 },
          { "x": 3, "y": 2 },
          { "x": 4, "y": 3 },
          { "x": 3, "y": 4 }
        ],
        "intervalMs": 1200
      },
      "maxSteps": 99,
      "bossSpeed": 1.0,
      "unlockCondition": null,
      "rewardOnClear": null,
      "isReplayable": false
    },
    {
      "id": 2,
      "name": "全力围堵",
      "description": "Boss变强了！在9x9的战场上围住它！",
      "gridSize": 9,
      "bossStart": { "x": 4, "y": 4 },
      "exits": "all_boundaries",
      "initialObstacles": {
        "count": 4,
        "fixed": [],
        "randomCount": 4,
        "excludeRadius": 3,
        "maxRetries": 20
      },
      "autoPlay": {
        "enabled": false,
        "moveSequence": null,
        "intervalMs": 0
      },
      "maxSteps": 35,
      "bossSpeed": 1.0,
      "unlockCondition": { "requireLevelId": 1, "requireStatus": "cleared" },
      "rewardOnClear": { "items": { "hint": 1 } },
      "isReplayable": true,
      "shareConfig": {
        "title": "我用了{steps}步围住了Boss！你能比我少吗？",
        "image": "share_card_level2.png"
      }
    }
  ]
}
```

### 3.2 数值规则表

| 参数 | 第1关（教学关） | 第2关（核心挑战关） | 说明 |
|------|---------------|-------------------|------|
| 网格尺寸 N | 7 | 9 | N×N 个格子，交点数为 (N+1)×(N+1) |
| 交点总数 | 64 | 100 | 可放置障碍物的总位置数 |
| 初始固定障碍物 | 2 | 0 | 教学关强制放置，用于示范 |
| 初始随机障碍物 | 2 | 0~3 | 教学关2个随机，第2关0~3个随机 |
| 初始障碍物总数 | 4 | 0~3 | 关卡开始前已放置的障碍物数 |
| 限制区域半径 | 2 | 3 | Boss周围N格内不生成随机障碍物 |
| 最大步数 | 99（无限制） | 30 | 教学关无步数压力，第2关限制步数 |
| Boss出生位置 | (3, 3) 网格中心 | (4, 4) 网格中心 | 均位于网格内部，不靠边界 |
| 自动通关 | 是 | 否 | 第1关自动演示4步完成围堵 |
| 是否可重复挑战 | 否（仅一次） | 是（无限次） | 第1关过完即锁定已完成，第2关可反复玩 |
| Boss移动速度倍率 | 1.0 | 1.0 | 行走动画速度倍率 |
| 解锁前置条件 | 无 | 第1关已通关 | 第2关需先通过第1关解锁 |
| 通关奖励 | 无 | 提示道具 ×1 | 激励玩家完成第2关 |
| 死局重试上限 | 5 | 20 | 随机生成不通过时的最大重试次数 |

### 3.3 解锁与进度规则

1. **初始状态**：玩家首次进入游戏时，第1关状态为 `unlocked`（默认解锁），第2关状态为 `locked`。
2. **第1关通关后**：第1关状态变为 `cleared`，第2关状态变为 `unlocked`。游戏自动跳转至第2关，不经过主界面。
3. **第2关每次通关**：通关次数 +1，记录本次步数，若优于历史最佳步数则更新最佳步数。通关后回到主界面，第2关状态保持 `unlocked`。
4. **第2关每次失败**：可选择"重试"（重新挑战第2关，消耗步数重置为35，重新生成随机障碍物布局）或"返回主界面"。
5. **进度持久化字段**：

```typescript
interface LevelProgress {
  level1Cleared: boolean;          // 第1关是否已通关
  level2BestSteps: number;         // 第2关历史最佳步数
  level2TotalClears: number;       // 第2关累计通关次数
  level2TotalAttempts: number;     // 第2关累计挑战次数
  lastPlayedLevelId: number;       // 上次玩的关卡ID（用于续玩引导）
  totalPlayTimeSec: number;        // 累计游戏时长（秒）
}
```

### 3.4 障碍物随机生成规则

第1关和第2关在关卡加载时均会随机生成一部分障碍物，生成算法遵循以下约束：

1. **排除区域**：Boss出生点周围曼哈顿距离 ≤ `excludeRadius` 的范围内不放置任何随机障碍物，确保Boss初始有充足的活动空间。
2. **边界排除**：地图最外一圈的交点（即 x=0 或 x=N 或 y=0 或 y=N 的交点）不放置随机障碍物，因为Boss需要从边界逃脱。
3. **出口保留**：Boss出生点到四个边界方向的"直线通道"上（即Boss正上、正下、正左、正右方向直至边界的交点列/行）至少保留一个出口通畅，防止Boss开局即被堵死。
4. **随机选择**：从剩余可用交点中随机选出 `randomCount` 个位置放置障碍物。
5. **死局检测**：放置完成后，以Boss当前位置为起点执行 BFS 搜索，检查是否存在至少一条到达任意边界交点的路径。若无可用路径，则废弃当前布局，重新生成（最多重试 `maxRetries` 次）。
6. **固定障碍物**：第1关有4个固定障碍物（放置在半包围位置，用于示范围堵原理），这些固定障碍物固定加载，不参与随机。

### 3.5 自动通关规则（第1关）

第1关为教学关，采用自动演示方式：

1. 关卡加载完成后，等待 500ms 入场动画结束。
2. 显示"跟着引导，围住Boss！"文字提示。
3. 依次在预设的4个交点坐标（config 中 `autoPlay.moveSequence` 数组，分别为 Boss 的上、左、下、右四个邻位）放置障碍物。
4. 每次放置间隔 1200ms，期间Boss不移动（教学关简化：放置4个障碍物围住Boss，Boss无路可走后直接判定胜利）。
5. 第4个障碍物放置完成后，播放胜利动画并结算。
6. 结算结束后自动切换至第2关。
7. 整个过程中玩家无法操作（UI交互屏蔽），但可以点击"跳过"按钮直接结束教学进入第2关。

### 3.6 进入/退出条件

**进入条件**（第1关）：
- 玩家从未通关第1关 → 从主界面点击"开始挑战" → 进入第1关
- 此过程仅发生一次

**进入条件**（第2关）：
- 方式A：刚通关第1关 → 自动跳转至第2关
- 方式B：已通关第1关，从主界面点击"继续挑战"或"再来一局" → 进入第2关

**退出条件（正常）**：
- 第1关通关 → 自动切换到第2关
- 第2关通关 → 返回主界面（主界面按钮变为"再来一局"）
- 第2关失败 → 结算界面可选择"重试"（重新加载第2关）或"返回主界面"

**退出条件（异常）**：
- 关卡配置加载失败 → 弹出错误提示，返回主界面
- 随机障碍物生成在 `maxRetries` 次后仍无有效布局 → 返回默认安全布局（全空棋盘，仅保留固定障碍物）

---

## 四、完整流程与状态机

### 4.1 主流程

```
[玩家触发进入关卡]
    ↓
[LV-M1 关卡配置加载器] → 读取 levels.json → 按关卡ID获取配置
    ↓
[LV-M6 关卡校验器] → 校验配置字段完整性和值合法性
    ├── 校验失败 → 弹出"关卡配置异常"提示 → 返回主界面
    └── 校验通过 → 继续
    ↓
[LV-M2 关卡解锁管理器] → 检查关卡解锁状态
    ├── locked → 弹出"关卡未解锁"提示 → 返回主界面
    └── unlocked/cleared → 继续
    ↓
[LV-M3 障碍物随机生成器] → 生成初始障碍物布局
    ├── 死局检测失败（重试次数 < maxRetries）→ 重新生成
    ├── 死局检测失败（重试次数 = maxRetries）→ 使用安全布局
    └── 通过 → 锁定布局
    ↓
[组装完整关卡数据] → {
    gridSize, bossStart, exits, obstaclePositions[],
    maxSteps, bossSpeed, autoPlay?
}
    ↓
[派发 levelLoaded 事件] → gameplay_core 接收数据并初始化棋盘
    ↓
[第1关检查 autoPlay.enabled]
    ├── true → 启动自动播放序列
    │   └── 自动播放完毕 → 判定胜利
    │       └── 更新关卡状态 (level1Cleared = true)
    │           └── [LV-M4] → 自动切换至第2关
    └── false → 进入核心玩法循环（等待玩家操作）
        └── 对局结束（胜利/失败）
            └── [LV-M5] 持久化进度
                └── [LV-M4] → 返回主界面或重试
```

### 4.2 状态定义

| 状态名 | 状态ID | 允许操作 | 说明 |
|--------|--------|---------|------|
| 未解锁 | `locked` | 无 | 关卡入口灰显，显示解锁条件（"通关第1关后解锁"）|
| 已解锁 | `unlocked` | 进入关卡 | 玩家可以点击进入该关卡 |
| 已通关 | `cleared` | 进入关卡（仅第2关）| 第1关通关后不可再玩；第2关通关后可重复挑战 |
| 加载中 | `loading` | 无 | 关卡配置和障碍物布局生成中 |
| 进行中 | `playing` | 正常游戏操作 | 关卡已加载到核心玩法系统，对局进行中 |
| 已完成 | `finished` | 无（等待自动切换或返回）| 对局结束，结算展示中 |

### 4.3 状态转换表

```
locked → unlocked（通关前置关卡后自动解锁）
unlocked → loading（玩家选择进入关卡）
loading → playing（配置加载+障碍物生成完成，关卡数据交付core系统）
playing → finished（对局结算，胜负已分）
finished → loading（玩家点击"重试"，重新生成障碍物布局）
finished → mainMenu（玩家点击"返回主界面"）
finished → loading（第2关，自动跳转到第2关——仅第1关通关时）
```

### 4.4 异常流程

1. **levels.json 文件缺失或解析失败**：
   - JSON.parse 抛出异常 → try/catch 捕获 → 控制台报告具体错误行号
   - 显示 Toast 提示"关卡配置异常，请重新启动游戏"
   - 写入 pipeline_errors.json，标记 errorType: "config_parse_error"
   - 禁止进入任何关卡，防止核心玩法系统接收到不完整数据

2. **障碍物随机生成连续死局**：
   - 达到 maxRetries 次后仍无解 → 降级使用"全空棋盘 + 仅固定障碍物"的安全布局
   - 在安全布局中，固定障碍物也必须通过死局检测，否则移除部分固定障碍物
   - 上报埋点 deadEndGenerated，标记 levelId 和 retryCount

3. **第1关播放自动通关过程中玩家切后台**：
   - 切后台时自动暂停关卡加载流程
   - 回到前台时恢复自动播放（除非玩家此时已跳过教学）
   - 若切后台超过 5 分钟，询问玩家"是否继续教学"或"跳过教学"

4. **第2关配置中某个字段缺失**：
   - LV-M6 检测到缺失字段 → 使用该字段的默认值降级（需定义所有字段的默认值表）
   - 例如 gridSize 缺失 → 默认使用 9
   - 同时写入错误日志，提示策划检查 levels.json

5. **玩家反复快速切换关卡（频繁点击"开始挑战"→"返回"）**：
   - 关卡切换设置 500ms 冷却时间（cooldown），冷却期内不执行新的切换请求
   - 关闭上一个正在加载的关卡资源释放流程

---

## 五、边界条件与异常处理

### 5.1 数值边界

| 边界场景 | 预期行为 | 防御措施 |
|---------|---------|---------|
| levels.json 中 gridSize 设为 3 或更小 | 视为配置错误，使用默认值 7（第1关）或 9（第2关）| LV-M6 校验 gridSize 必须在 [5, 15] 闭区间 |
| levels.json 中 gridSize 设为 100（过大） | 视为配置错误，使用默认值，控制台输出警告 | LV-M6 校验上限为 15 |
| 随机障碍物数量超过交点总数 | 裁剪为交点总数的 30%（上限保护） | 生成前计算可用交点数的 30% 作为上限 |
| BossStart 设在边界上（如 x=0 或 y=N） | Boss 开局即逃脱，视为配置错误 | LV-M6 校验 Boss 坐标必须距边界至少 1 格 |
| maxSteps 设为 0 | 玩家无步数可用，视为配置错误，默认使用 35 | LV-M6 校验 maxSteps 必须 >= 1（非限制关卡除外）|
| excludeRadius >= gridSize/2 | 排除区域覆盖大部分棋盘，随机障碍物无法放置 | 校验 excludeRadius 最大为 floor(gridSize/3) |
| 固定障碍物与 Boss 出生点重叠 | 移除该固定障碍物，控制台输出警告 | 放置固定障碍物前做坐标冲突检测 |
| 玩家从没玩过第1关，但直接通过某种方式访问第2关 | LV-M2 拦截，弹出提示"请先完成第1关" | 关卡入口处做解锁状态校验 |

### 5.2 非法操作拦截

| 非法操作 | 拦截层级 | 反馈方式 |
|---------|---------|---------|
| 点击未解锁的关卡入口 | UI层 | 关卡按钮置灰+锁图标，显示解锁条件文案 |
| 在关卡加载过程中再次点击进入 | 逻辑层 | 按钮立即置为 disabled，500ms冷却 |
| 第1关通关后再次点击进入第1关 | 逻辑层+UI层 | 第1关入口按钮消失或显示"已通关"标记，不再可点击 |
| levels.json 修改后未重启游戏 | 逻辑层 | 关卡数据在游戏启动时加载，运行时缓存不变。修改配置需重启生效 |
| 在 `locked` 状态下手动设置 localStorage 跳过第1关 | 存储层 | save_system 在启动时做数据完整性校验，检测到异常标记位则重置为合法状态 |

### 5.3 幂等设计

| 操作类型 | 幂等key | 实现方式 |
|---------|--------|---------|
| 关卡解锁 | `levelId` | 同一关卡只解锁一次，解锁后写入 localStorage，重复调用不产生副作用 |
| 通关记录 | `levelId + date` | 第2关多次通关累计计数，每次写入前读取原始值再 +1 |
| 随机障碍物生成 | `levelId + seed` | 使用种子随机数（seed = date + levelId），同一种子生成相同的障碍物布局（可用于回放验证）|

### 5.4 数据完整性校验

LV-M6 在游戏启动时执行以下校验：

| 校验项 | 检查内容 | 异常处理 |
|-------|---------|---------|
| JSON语法 | levels.json 是否可以正常 parse | 加载失败，游戏不可进入关卡 |
| 关卡数量 | 是否至少包含 2 个关卡 | 少于2个使用内置默认配置 |
| 字段完整性 | 每个关卡是否包含所有必需字段 | 缺失字段使用默认值填充 |
| 范围合法性 | gridSize、maxSteps、boss坐标等是否在有效范围 | 溢出值裁剪到范围边界 |
| 障碍物合法性 | 固定障碍物是否在棋盘范围内、不与Boss重叠 | 移除非法障碍物 |
| 解锁链完整性 | 第2关的 unlockCondition 引用的 levelId 是否存在 | 不存在则忽略该解锁条件 |

---

## 六、前后端通信设计

### 6.1 通信概览

关卡系统为纯客户端系统，无服务端实时通信。所有关卡配置数据从 `levels.json` 读取，该文件作为静态资源配置在微信小游戏代码包中。

关卡进度和通关数据存储在微信小游戏的 `wx.setStorageSync` / `wx.getStorageSync` 或前端的 localStorage 中。

| 数据类型 | 存储键 | 读写时机 | 说明 |
|---------|--------|---------|------|
| 关卡配置 | 无（直接引用 levels.json）| 关卡加载时 | 静态数据，打包在代码包中 |
| 关卡解锁状态 | `levelProgress` | 进入主页时读取；通关后写入 | 每次写入前做完整性校验 |
| 最佳通关记录 | `levelProgress` | 同上，含最佳步数等 | 与解锁状态合并存储 |
| 种子随机数 | 运行时内存变量 | 关卡加载时 | 用于可复现的随机障碍物生成 |

### 6.2 事件总线协议

所有事件使用 `camelCase` 命名，通过全局事件总线派发。

| 事件名 | 方向 | 载荷 | 触发时机 |
|--------|------|------|---------|
| `levelConfigLoaded` | LV-M1 → 全局 | `{ levelId: number, gridSize: number, bossStart: Position, maxSteps: number, autoPlay: boolean }` | levels.json 成功加载并解析完毕后触发 |
| `levelLoaded` | 关卡系统 → 全局 | `{ levelId: number, gridSize: number, initialObstacles: Position[], bossStart: Position, exits: string, maxSteps: number }` | 关卡全部数据（含随机障碍物）生成完毕，准备交付核心玩法系统 |
| `levelStarted` | 关卡系统 → 分析/UI | `{ levelId: number, timestamp: number, obstacleSeed: number, attemptCount: number }` | 玩家正式开始关卡（第1关自动播放开始 / 第2关首次玩家操作）|
| `levelCompleted` | 关卡系统 → 分析/UI/存储 | `{ levelId: number, result: 'victory' | 'defeat', stepsUsed: number, isFirstClear: boolean, isNewRecord: boolean }` | 关卡对局结束（胜利或失败），用于更新状态和触发结算 |
| `levelUnlocked` | LV-M2 → 全局 | `{ levelId: number, unlockedBy: number }` | 关卡从 locked 变为 unlocked 状态时触发 |
| `levelProgressUpdated` | LV-M5 → 全局 | `{ level1Cleared: boolean, level2BestSteps: number, level2TotalClears: number }` | 持久化数据更新后触发，供主界面刷新按钮文案 |
| `obstaclesGenerated` | LV-M3 → 全局 | `{ levelId: number, totalObstacles: number, randomCount: number, fixedCount: number, isSafeFallback: boolean }` | 障碍物生成完成时触发，含是否为安全降级模式的标记 |
| `levelTransitionStarted` | LV-M4 → 场景管理器 | `{ fromLevelId: number, toLevelId: number }` | 关卡切换开始时触发（第1关→第2关）|
| `levelTransitionCompleted` | LV-M4 → 全局 | `{ currentLevelId: number }` | 关卡切换完成，新关卡场景已就绪 |
| `levelRetryStarted` | 关卡系统 → 分析 | `{ levelId: number, retryCount: number, previousResult: string }` | 玩家在第2关失败后点击"重试"时触发 |
| `tutorialSkipped` | 关卡系统 → 分析 | `{ levelId: 1, elapsedMs: number }` | 玩家在第1关教学过程中点击"跳过"时触发 |
| `deadEndGenerated` | LV-M3 → 分析 | `{ levelId: number, retryCount: number, fallbackUsed: boolean }` | 随机障碍物死局检测失败时触发 |

### 6.3 关卡数据接口

```typescript
// levels.json 解析后的完整关卡数据结构
interface LevelConfig {
  id: number;
  name: string;
  description: string;
  gridSize: number;                    // N x N 网格
  bossStart: Position;                 // Boss 出生点（网格交点坐标）
  exits: 'all_boundaries';            // 出口类型
  initialObstacles: {
    count: number;                     // 总初始障碍物数
    fixed: Position[];                 // 固定障碍物坐标列表
    randomCount: number;               // 随机障碍物数量
    excludeRadius: number;             // Boss 周围排除半径（曼哈顿距离）
    maxRetries?: number;               // 死局重试最大次数
  };
  autoPlay: {
    enabled: boolean;                  // 是否启用自动通关
    moveSequence: Position[] | null;   // 自动放置的障碍物坐标序列
    intervalMs: number;                // 每次放置间隔（毫秒）
  };
  maxSteps: number;                    // 最大步数（99 = 无限制）
  bossSpeed: number;                   // Boss 移动速度倍率
  unlockCondition: {
    requireLevelId: number;            // 需要通关的前置关卡ID
    requireStatus: 'cleared';          // 前置关卡需要达到的状态
  } | null;
  rewardOnClear: {
    items: Record<string, number>;     // 通关奖励道具（如 { hint: 1 }）
  } | null;
  isReplayable: boolean;               // 通关后是否可重复挑战
  shareConfig?: {
    title: string;                     // 分享文案（含 {steps} 占位符）
    image: string;                     // 分享图片文件名
  };
}

// 玩家关卡进度数据类型
interface LevelProgressData {
  level1Cleared: boolean;
  level2BestSteps: number;
  level2TotalClears: number;
  level2TotalAttempts: number;
  lastPlayedLevelId: number;
  totalPlayTimeSec: number;
}

// 网格交点坐标
interface Position {
  x: number;  // 0 ~ gridSize
  y: number;  // 0 ~ gridSize
}
```

---

## 七、美术需求说明

### 7.1 界面清单

| 界面ID | 名称 | 说明 | 关联模块 |
|--------|------|------|---------|
| `SC-level-select` | 关卡选择入口 | 主界面开始挑战按钮下方显示当前关卡名称和小地图预览（P2）| `LV-M2` |
| `SC-level-auto-tutorial` | 教学引导层 | 第1关自动播放时的引导文字和跳过按钮 | `LV-M3`、`LV-M4` |
| `SC-level-share-card` | 分享卡片 | 第2关通关后的步数分享卡片 | `LV-M5` |
| `SC-level-result-display` | 结算面板 | 第2关结算时显示步数、最佳纪录、分享入口 | `LV-M5` |

### 7.2 素材规格

| 素材名 | 格式 | 尺寸（逻辑像素）| 数量 | 说明 |
|--------|------|--------------|------|------|
| 第1关入口图标 | PNG | 120×120 | 1 | 带"教学"标记的关卡入口图标（P2 关卡选择界面用）|
| 第2关入口图标 | PNG | 120×120 | 1 | 带"挑战"标记的关卡入口图标（P2 关卡选择界面用）|
| 关卡锁图标 | PNG | 40×40 | 1 | 未解锁关卡的锁图标 |
| 自动播放手指指引 | PNG序列帧 | 60×60 | 4帧 | 指向性手指动画，指示下一步放置位置 |
| 引导文字框 | PNG（九宫格） | 自适应 | 1 | 半透明白色圆角气泡框，用于展示教学文字 |
| 跳过按钮 | PNG | 120×48 | 1 | 右上角"跳过"文字按钮，半透明背景 |
| 胜利结算面板 | PNG（九宫格） | 520×460 | 1 | 带步数统计和分享入口的结算面板背景 |
| 分享卡片背景 | PNG | 600×400 | 1 | 第2关通关分享的卡片背景图 |
| 关卡切换过渡遮罩 | PNG/程序生成 | 全屏 | 1 | 关卡切换时的全屏过渡遮罩（暗色/闪光）|
| 关卡名称横幅 | PNG | 360×60 | 2 | 第1关名"初识Boss"和第2关名"全力围堵"的文字横幅 |

### 7.3 动画与特效

| 动画名 | 时长 | 说明 |
|--------|------|------|
| 关卡加载过渡 | 400ms | 全屏淡入黑色 → 棋盘网格从中心向外扩散出现 → 淡出黑色 |
| 自动播放手指指引 | 800ms/次 | 手指从当前位置移动到下一个推荐放置点，点击动画后消失 |
| 自动播放障碍物放置 | 200ms | 与核心玩法系统的障碍物放置动画一致 |
| 关卡切换（第1关→第2关）| 1200ms | 第1关画面收缩淡出 → 短暂全屏黑（200ms）→ 第2关网格从中心扩散出现 |
| 结算面板弹入 | 300ms | 从屏幕底部滑入上弹，配合弹性缓动（easeOutBack）|
| 分享卡片生成 | 500ms | 结算面板缩小到左上角 → 分享卡片旋转展开出现 |
| 通关次数徽章 | 无（静态） | 第2关通关次数在结算面板上以星星数字徽章展示 |

### 7.4 关卡状态视觉差异

| 关卡状态 | 主界面按钮 | 关卡入口图标 |
|---------|-----------|-------------|
| `locked`（未解锁） | 不显示该关卡入口 | 灰色锁图标覆盖，下方文字"通关第1关后解锁" |
| `unlocked`（已解锁，未通关） | 显示"开始挑战"（第1关）或"继续挑战"（第2关）| 正常图标，呼吸光效 |
| `cleared`（已通关，第1关） | 显示"继续挑战"指向第2关 | "已通关"角标 |
| `cleared`（已通关，第2关） | 显示"再来一局" | 金色皇冠角标，显示最佳步数 |
| `playing`（进行中） | 按钮不可点击 | 动态进行中动画 |

---

## 八、数据埋点需求

### 8.1 关键行为埋点

| 埋点ID | 事件名 | 触发时机 | 上报字段 |
|--------|--------|---------|---------|
| `EVT-LV-001` | `levelConfigLoaded` | levels.json 加载完成 | `{ levelCount: number, loadTimeMs: number, validationPassed: boolean }` |
| `EVT-LV-002` | `levelStarted` | 玩家开始关卡 | `{ levelId: number, attemptCount: number, isAutoPlay: boolean }` |
| `EVT-LV-003` | `levelCompleted` | 关卡对局结束 | `{ levelId: number, result: 'victory'|'defeat', stepsUsed: number, durationSec: number, isFirstClear: boolean, isNewRecord: boolean }` |
| `EVT-LV-004` | `levelUnlocked` | 新关卡解锁 | `{ levelId: number, unlockedBy: number }` |
| `EVT-LV-005` | `levelTransition` | 关卡自动切换（第1关→第2关）| `{ fromLevelId: 1, toLevelId: 2, transitionTimeMs: number }` |
| `EVT-LV-006` | `levelRetry` | 玩家点击重试 | `{ levelId: number, retryCount: number, previousResult: string }` |
| `EVT-LV-007` | `levelAbandoned` | 玩家放弃关卡返回主菜单 | `{ levelId: number, stepsUsed: number, progress: number }` |
| `EVT-LV-008` | `levelShare` | 玩家分享通关记录 | `{ levelId: number, stepsUsed: number, isFirstShareToday: boolean }` |
| `EVT-LV-009` | `levelObstaclesGenerated` | 障碍物随机布局生成完成 | `{ levelId: number, totalObstacles: number, randomCount: number, retryCount: number, isDeadEnd: boolean, fallbackUsed: boolean }` |
| `EVT-LV-010` | `tutorialSkipped` | 玩家跳过第1关教学 | `{ elapsedMs: number, autoPlayProgress: number }` |
| `EVT-LV-011` | `levelProgressLoaded` | 关卡进度从 localStorage 加载 | `{ level1Cleared: boolean, level2TotalClears: number, level2BestSteps: number }` |

### 8.2 漏斗分析

| 漏斗步骤 | 环节 | 关键埋点 | 目标值 |
|---------|------|---------|--------|
| 1 | 进入主界面 | `mainMenuEntered` | 100% |
| 2 | 开始第1关 | `levelStarted` (levelId=1) | >= 90% |
| 3 | 完成第1关 | `levelCompleted` (levelId=1, result=victory) | >= 95%（自动通关）|
| 4 | 跳转第2关 | `levelTransition` (from=1, to=2) | >= 98% |
| 5 | 第2关首次操作 | `levelStarted` (levelId=2) + `obstaclePlaced` (stepIndex=1) | >= 90% |
| 6 | 第2关50%进度 | `obstaclePlaced` (stepIndex <= 17) | >= 60% |
| 7 | 第2关通关 | `levelCompleted` (levelId=2, result=victory) | >= 25% |
| 8 | 第2关通关分享 | `levelShare` (levelId=2) | >= 40% |
| 9 | 第2关重复挑战（次日回访）| `levelStarted`（次日, levelId=2）| >= 30% |

### 8.3 核心指标看板

| 指标 | 计算方式 | 目标值 |
|-----|---------|--------|
| 第1关完成率 | `levelCompleted(1) / levelStarted(1)` | >= 95% |
| 第1关→第2关转化率 | `levelTransition / levelCompleted(1)` | >= 98% |
| 第2关通关率 | `levelCompleted(2, victory) / levelStarted(2)` | >= 25% |
| 第2关平均尝试次数/通关 | `levelStarted(2) / levelCompleted(2, victory)` | <= 4次 |
| 第2关日均挑战数/DAU | `levelStarted(2) / DAU` | >= 5次 |
| 第2关最佳步数中位数 | 所有玩家 level2BestSteps 的中位数 | <= 28步（满分35步）|
| 障碍物生成死局率 | `deadEndGenerated / obstaclesGenerated` | < 0.5% |
| 配置加载成功率 | `configLoaded成功 / configLoaded尝试` | >= 99.9% |
| 关卡切换失败率 | `transitionComplete / transitionStarted` | >= 99.5% |

---

## 九、迭代规划

### 9.1 MVP

MVP阶段的目标是支撑第1关和第2关的基础关卡配置加载和切换功能，让核心玩法系统有数据可运行。

| 模块 | 交付内容 | 预计工时（人日）|
|------|---------|---------------|
| `LV-M1` 关卡配置加载器 | levels.json 文件读取和解析，按ID查询配置 | 1.5 |
| `LV-M2` 关卡解锁管理器 | locked/unlocked/cleared 三态管理，解锁条件判定 | 1 |
| `LV-M3` 障碍物随机生成器 | 随机选点、排除区域、边界排除、死局检测BFS算法 | 2.5 |
| `LV-M4` 关卡切换控制器 | 第1关→第2关自动跳转，含过渡动画触发 | 1 |
| `LV-M5` 关卡进度持久化 | localStorage 读写，进度的加载和保存 | 1 |
| `LV-M6` 关卡校验器 | 字段完整性校验和值范围校验 | 1 |
| 关卡配置 JSON | levels.json 第1关和第2关的完整配置编写 | 0.5 |
| 基础UI适配 | 主界面根据关卡状态显示不同按钮文案 | 0.5 |
| **合计** | | **9** |

MVP交付标准：
- 玩家可正常进入第1关观看自动通关演示
- 第1关通关后自动跳转至第2关
- 第2关每次进入随机障碍物布局不同
- 第2关对局结束后正确更新进度和最佳步数
- 主界面按钮文案根据解锁状态正确变化

### 9.2 第一次迭代

| 模块 | 交付内容 | 预计工时（人日）|
|------|---------|---------------|
| `LV-M7` 关卡重置器 | 玩家可选择重置第2关进度（重新统计通关次数）| 0.5 |
| 分享卡片 | 第2关通关后的步数分享卡片UI和微信分享集成 | 1.5 |
| 关卡切换动画 | 第1关→第2关的过渡动画优化（棋盘扩散特效）| 1 |
| 第2关难度优化 | 根据上线数据调整 maxSteps（35→30或40）、随机障碍物数（4→3或5）| 0.5 |
| 种子随机数 | 实现基于种子的确定性随机，支持回放验证 | 1 |
| 多语言关卡名 | 关卡名称和描述接入 i18n 系统 | 0.5 |
| **合计** | | **5** |

### 9.3 长线方向

| 方向 | 说明 | 预期优先级 |
|------|------|-----------|
| 第3关（11×11极难关卡） | 11×11 网格，Boss速度 1.2x，随机障碍物 6个，最大步数 45，需通过第2关解锁 | P2 |
| 关卡选择界面 | 从主界面独立出来的关卡选择场景，展示所有关卡的预览图、最佳步数和星级评价 | P2 |
| 每日挑战关卡 | 每天生成一个固定种子的随机关卡，所有玩家挑战相同的布局，按步数排名 | P2 |
| 关卡编辑和分享 | 允许玩家自己摆放障碍物生成谜题，通过分享码分享给好友挑战 | P3 |
| 关卡通关星级评价 | 每关根据步数给予1-3星评价（例如 <= 25步三星，<= 30步两星，通关一星）| P2 |
| 成就系统集成 | 累计通关10/50/100次第2关获得成就徽章；20步内通关获得"速通达人"成就 | P3 |
| 关卡剧情包装 | 每关加入简短剧情对话（Boss的嘲讽和玩家的回应），丰富游戏沉浸感 | P3 |
| 多Boss形态 | 第2关通关一定次数后解锁Boss的新外观和胜利/失败动画变体 | P3 |

### 9.4 明确不做

| 事项 | 不做原因 | 备注 |
|------|---------|------|
| 无限关卡程序化生成（无人工校验） | 自动生成的关卡无法保证有唯一解且质量可控；围住Boss的核心是"经过设计的谜题"而非随机地图 | 所有关卡需策划手动测试验证 |
| 关卡内购解锁（付费解锁关卡） | 游戏只有2个关卡，付费解锁会严重损害用户体验和社交传播；商业化通过广告和道具实现 | 坚持"免费玩，道具付费"模式 |
| 闯关计时器/限时通关 | 核心玩法是回合制策略，限时机制破坏思考体验 | 如有需求建议做独立模式 |
| 关卡编辑器云端分享平台 | 技术成本和审核风险高（需管理用户生成内容）| 仅做本地分享码传播 |
| 周赛/月赛赛季制 | 玩家基数不够支撑赛季匹配和排名，运营维护成本高 | 先做每日挑战观察数据 |
| 关卡通关步数排行榜（全局）| 微信小游戏的全局排行榜审核严格且容易被刷榜 | 仅使用好友排行榜（开放数据域）|

---

**文档结束**
