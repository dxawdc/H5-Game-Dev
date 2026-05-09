# 广告变现系统 系统策划案

**文档版本**：v1.0  **系统ID**：ad_system  **优先级**：P1  **复杂度**：M
**所属游戏**：围住Boss（Surround the Boss）
**对应脚本**：AdSystem.ts  **模块类型**：Module
**配置文件**：`src/data/shop_config.json`, `src/data/items.json`

---

## 一、定位与目标

### 1.1 系统定位

广告变现系统是"围住Boss"商业化体系的核心收入引擎之一，为玩家提供通过观看激励视频广告获取游戏内资源的途径。在微信小游戏生态中，激励视频广告（Rewarded Video Ad）是用户接受度最高、eCPM（千次展示收益）最优的广告形式——玩家主动选择观看以获得奖励，广告主获得有效曝光，开发者获得广告收入，三方共赢。

广告变现系统不直接参与核心玩法逻辑，而是作为资源获取通道嵌入到道具系统、主界面和关卡结算界面中。玩家在需要道具或希望获得额外机会时，通过观看广告来换取，形成"需求驱动→主动观看→获得奖励→体验提升"的正向转化链路。

### 1.2 核心目标

1. **广告收入最大化**：在不破坏游戏体验的前提下，设计合理的广告触发点和频率控制，最大化激励视频广告的展示次数和完成率。
2. **玩家体验平衡**：广告观看必须是玩家主动选择的行为（opt-in），不强制、不弹窗霸屏，确保广告不成为负面体验的来源。
3. **道具获取通道**：为道具系统提供稳定、可持续的获取途径，与分享裂变形成互补——玩家可根据自身偏好选择"分享给好友"或"观看广告"来获取道具。
4. **数据驱动调优**：通过埋点监控各广告入口的展示量、完成率、转化率，持续优化广告位配置和奖励策略。
5. **合规性保障**：严格遵循微信小游戏广告组件规范（`wx.createRewardedVideoAd`），确保广告加载、展示、回调流程符合平台要求，规避封禁风险。

### 1.3 广告变现三原则

- **自愿性**：所有广告观看均为玩家主动点击触发，不存在强制观看或干扰性弹出。玩家在不观看广告的情况下仍可正常游戏。
- **价值对等**：广告奖励的价值与玩家付出的注意力成本对等。观看30秒视频广告获得的道具价值，应高于分享（社交成本），低于直接付费购买（货币成本）。
- **频率可控**：广告展示频率受每日次数上限、两次广告间冷却时间等多重约束，防止玩家短时间内大量观看广告导致体验疲劳和eCPM下降。

### 1.4 与其他系统的关系

| 系统ID | 关系类型 | 具体说明 |
|--------|---------|---------|
| `item_system` | 输出 | 广告播放完成后回调道具系统，发放广告奖励道具到玩家库存或对局内临时计数 |
| `main_menu` | 嵌入 | 主界面提供"看广告得道具"按钮（P1），点击后触发广告播放 |
| `level_result` | 嵌入 | 失败结算界面提供"看广告续命"入口（P1），观看广告可直接重新挑战本关 |
| `gameplay_core` | 间接 | 广告续命功能重新激活关卡状态机，非正常结束的对局可恢复 |
| `share_system` | 互补 | 广告与分享是道具获取的两个平行渠道，在shop_config.json中按道具类型配置 |
| `GameData` | 依赖 | 每日广告观看次数（`dailyAdCount`）、最后观看日期（`lastAdDate`）挂载在GameData单例上 |
| `analytics_system` | 输出 | 广告展示、完成、失败等行为上报埋点 |

---

## 二、功能模块拆解

| 模块ID | 模块名称 | 职责描述 | 优先级 | 依赖 |
|--------|---------|---------|--------|------|
| AD-M1 | 激励视频广告管理器 | 封装微信小游戏 `wx.createRewardedVideoAd` API，提供广告加载、展示、结果回调的统一接口，管理广告实例生命周期 | P0 | 微信原生API |
| AD-M2 | 主界面广告按钮 | 主界面上"看广告得道具"入口按钮，每日首次点击观看广告后随机获得一种道具 | P1 | AD-M1, item_system |
| AD-M3 | 对局内道具广告获取 | 关卡界面道具栏中点击"+"号后，根据shop_config.json配置，对标记为ad-gated的道具提供"观看广告"获取选项 | P1 | AD-M1, item_system, shop_config.json |
| AD-M4 | 失败界面广告续命 | 玩家关卡失败后在结算界面点击"看广告继续"按钮，观看完整广告后立即重新挑战本关（不消耗道具、步数重置） | P1 | AD-M1, level_result, gameplay_core |
| AD-M5 | 广告冷却与频率控制器 | 管理两次广告观看之间的冷却时间（默认30秒），以及每日广告观看次数上限（默认3次），防止过度刷广告 | P0 | GameData |
| AD-M6 | 广告状态UI组件 | 广告播放过程中的状态提示：加载中（Loading旋转）、播放中（倒计时/进度提示）、失败（重试按钮）等UI反馈 | P1 | AD-M1 |
| AD-M7 | 广告配置加载器 | 从 `shop_config.json` 读取各道具的获取方式配置（ad-gated / share-gated）、广告每日上限、冷却时间等参数 | P0 | 无 |

---

## 三、核心玩法规则

### 3.1 广告获取道具规则

#### 3.1.1 道具获取方式配置

每种道具的获取方式在 `shop_config.json` 中独立配置，支持两种门控模式：

| 门控模式 | 标识 | 行为 | 适用道具（示例） |
|---------|------|------|----------------|
| 广告门控 | `"ad"` | 该道具仅可通过观看激励视频广告获取，不可通过分享获取 | `hint`（提示）、`reset`（重置本关） |
| 分享门控 | `"share"` | 该道具仅可通过分享给好友获取，不可通过广告获取 | `extra_step`（多走1步）、`undo`（返回上1步） |
| 双通道 | `"both"` | 该道具既可通过分享也可通过广告获取，玩家自由选择 | 预留，当前版本不使用 |

道具获取弹窗根据配置动态显示可用的获取方式按钮：若为 `"ad"` 则只显示"观看视频广告"按钮；若为 `"share"` 则只显示"分享给好友"按钮；若为 `"both"` 则同时显示两个按钮。

#### 3.1.2 广告获取量限制

| 限制维度 | 限制值 | 作用范围 | 重置周期 |
|---------|-------|---------|---------|
| 每日广告观看次数上限 | 3次（可配置） | 全局，所有广告入口共享 | 每日 UTC+8 0点 |
| 两次广告间隔冷却 | 30秒（可配置） | 全局，倒计时内不可触发新广告 | 每次广告完成后开始计时 |
| 单道具每日广告获取上限 | 由各道具 `maxPerSession` 和库存上限共同约束 | 按道具类型 | 与道具库存上限一致 |

#### 3.1.3 广告奖励发放规则

- 玩家完整观看广告（`onClose` 回调中 `isEnded === true`）后，奖励即时发放。
- 对局内通过广告获取的道具，直接计入对局内临时计数（`sessionItemUsage` 不限制获取，仅限制使用），不经过全局库存。
- 主界面通过广告获取的道具，计入全局库存（`GameData.items`），受单种最大持有量（10个）限制。
- 若全局库存已达单种上限，广告仍可播放，但奖励发放时弹出 Toast"该道具已达持有上限"，道具不增加（需在广告播放前做前置检查并提示玩家）。

### 3.2 主界面广告按钮规则

#### 3.2.1 入口位置与表现

位于主界面道具展示区上方或侧边，独立于分享按钮的"看广告得道具"入口：

| 属性 | 说明 |
|------|------|
| 表现形式 | 按钮/卡片式入口，带"免费得道具"标题和视频图标装饰 |
| 位置 | 主界面道具栏上方，与"分享拿道具"入口对称布局 |
| 日状态 | 有剩余次数时显示彩色，无剩余次数时置灰并显示"今日已用完" |
| 冷却状态 | 冷却中时显示倒计时（如"30秒后可再次观看"） |

#### 3.2.2 奖励逻辑

- 每日**首次**点击主界面广告按钮并完整观看广告 → 从4种道具（`extra_step`、`undo`、`reset`、`hint`）中**随机**选择1种，发放1个到全局库存。
- 奖励池和选择策略在 `shop_config.json` 中配置，支持配置为随机或轮询。
- 每日第2次及之后点击广告按钮 → 同样播放广告，但奖励降级为从指定的降级奖励池中随机选取（或直接给予少量金币/积分，P2扩展）。

### 3.3 对局内道具广告获取规则

#### 3.3.1 触发流程

```
玩家在关卡界面点击道具图标（unavailable态，库存=0且未达上限）
  └─ 弹出道具获取弹窗
       ├─ 若道具门控模式为 "ad" → 仅显示"观看视频广告"按钮
       ├─ 若道具门控模式为 "share" → 仅显示"分享给好友"按钮
       └─ 若道具门控模式为 "both" → 两个按钮均显示
```

#### 3.3.2 与道具系统协作

道具获取弹窗（ItemSystem IT-M5）负责UI展示，广告系统（AdSystem）负责广告播放和结果回调：

1. 玩家点击"观看视频广告"按钮 → 回调广告系统 `AdSystem.playAd(rewardContext)`
2. 广告系统检查频率控制（每日次数 + 冷却时间）
3. 检查通过 → 调用 `wx.createRewardedVideoAd` 展示广告
4. 广告完成（`isEnded === true`）→ 广告系统触发事件 `adRewarded`
5. 道具系统监听 `adRewarded` 事件 → 发放对应道具到对局内临时计数
6. 弹窗关闭，道具图标从 unavailable 切换为 available

### 3.4 广告冷却规则

- 玩家完成一次广告观看（无论是否获得奖励）后，进入冷却状态。
- 冷却期间，所有广告入口的触发按钮置灰，显示剩余冷却秒数（如"25s"）。
- 冷却倒计时归零后，按钮恢复可点击状态。
- 冷却时间在 `shop_config.json` 中全局配置，默认 30 秒。
- 冷却计时不因场景切换而中断（在 `GameData` 中记录冷却到期时间戳）。

### 3.5 每日重置规则

- 重置以 UTC+8 时区为准，每日 00:00:00 执行。
- 重置内容：
  - `dailyAdCount` 归零。
  - 主界面广告按钮从"今日已用完"恢复为可点击状态。
  - 所有广告入口的冷却计时清空。
- 重置判定方式：惰性检查（lazy check），每次广告系统初始化或尝试播放广告时，比较 `GameData.lastAdDate` 与当前 UTC+8 日期：
  - 若 `lastAdDate < today` → 执行重置，更新 `lastAdDate = today`。
  - 若 `lastAdDate == today` → 不做任何操作。
- `lastAdDate` 存储格式：ISO 日期字符串 `"2026-05-09"`。

---

## 四、完整流程与状态机

### 4.1 广告系统状态机

```
                     ┌──────────────────────┐
                     │        IDLE          │ ← 空闲态，未加载广告
                     └──────┬───────────────┘
                            │ playAd() 被调用
                            v
                     ┌──────────────────────┐
                     │    CHECKING_LIMITS    │ ← 检查每日次数和冷却
                     └──────┬───────────────┘
                            │
              ┌─────────────┼──────────────┐
              │ 通过         │ 未通过        │
              v             v               │
     ┌────────────────┐ ┌──────────────┐    │
     │  LOADING_AD    │ │  LIMIT_ERROR  │    │ ← 弹窗提示"今日次数已用完"
     │  (加载广告中)   │ │  (限制错误)   │    │    或"请等待冷却结束"
     └───────┬────────┘ └──────┬───────┘    │
             │                 │            │
             v                 │            │
     ┌────────────────┐        │            │
     │  AD_READY      │────────┼────────────┘
     │  (广告已就绪)   │        │
     └───────┬────────┘        │
             │ show()          │
             v                 │
     ┌────────────────┐        │
     │  PLAYING       │        │
     │  (广告播放中)   │        │
     └───────┬────────┘        │
             │                 │
    ┌────────┼────────┐        │
    │        │        │        │
    v        v        v        │
 ┌──────┐ ┌──────┐ ┌──────┐   │
 │ 完成  │ │ 关闭  │ │ 错误  │  │
 │ (完整)│ │(未完成)│ │(加载)│  │
 └──┬───┘ └──┬───┘ └──┬───┘   │
    │        │        │       │
    v        v        v       │
 ┌───────────┐ ┌───────────┐  │
 │REWARDING  │ │ NOT_REWARD│  │
 │ (发放奖励) │ │ (不发奖励) │  │
 └─────┬─────┘ └─────┬─────┘  │
       │             │        │
       v             v        │
 ┌─────────────────────────┐  │
 │   COOLDOWN              │  │
 │   (冷却计时中, N秒)     │──┘
 └─────────────────────────┘
       │ 冷却结束
       v
 ┌──────────────────┐
 │      IDLE        │
 └──────────────────┘
```

### 4.2 主界面广告按钮流程

```
主界面(IDLE)
  │
  ├─ 检查 dailyAdCount < dailyLimit
  │    ├─ 是 → 按钮显示彩色，"免费得道具"
  │    └─ 否 → 按钮置灰，"今日已用完"
  │
  ├─ 检查 cooldown 是否激活
  │    ├─ 是 → 按钮上显示剩余秒数，不可点击
  │    └─ 否 → 按钮可点击
  │
  ├─ 玩家点击广告按钮
  │    ├─ dailyAdCount 已达上限 → Toast "今日广告次数已用完"
  │    ├─ 冷却中 → Toast "请等待{秒}秒后重试"
  │    └─ 通过检查 →
  │         ├─ 调用 AdSystem.playAd('main_menu_daily')
  │         ├─ 展示 Loading 动画（广告加载中）
  │         ├─ 广告播放（全屏视频）
  │         ├─ onClose 回调：
  │         │    ├─ isEnded === true →
  │         │    │    ├─ dailyAdCount += 1
  │         │    │    ├─ 从奖励池随机选取道具类型
  │         │    │    ├─ item_system 发放道具到全局库存 +1
  │         │    │    ├─ 弹出道具获得弹窗（"恭喜获得{道具名} × 1"）
  │         │    │    ├─ lastAdDate = today
  │         │    │    └─ 进入冷却（cooldownEndAt = now + 30s）
  │         │    └─ isEnded === false →
  │         │         ├─ 不发奖励
  │         │         └─ Toast "看完广告才能获得奖励哦"
  │         ├─ onError 回调：
  │         │    ├─ 记录错误事件
  │         │    └─ Toast "广告加载失败，请重试"
  │         └─ 回到 IDLE
  └─
```

### 4.3 对局内道具广告获取流程

```
关卡界面(playerTurn)
  │
  ├─ 玩家点击 unavailable 态的道具图标
  │    └─ item_system 弹出道具获取弹窗
  │         ├─ 读取 shop_config.json 中该道具的 acquisitionMethod
  │         ├─ 若为 "ad" → 弹窗显示"观看视频广告"按钮（单按钮）
  │         ├─ 若为 "share" → 弹窗显示"分享给好友"按钮（单按钮）
  │         ├─ 若为 "both" → 弹窗同时显示两个按钮
  │         └─ 若已无可用获取方式 → 弹窗显示"暂无获取方式"灰态提示
  │
  ├─ 玩家点击"观看视频广告"按钮
  │    ├─ 前置检查：dailyAdCount < dailyLimit？
  │    │    ├─ 否 → Toast "今日广告次数已用完"，弹窗不关闭
  │    │    └─ 是 → 继续
  │    ├─ 前置检查：道具库存已达上限？
  │    │    ├─ 是 → Toast "该道具已达持有上限（{maxInventory}个）"
  │    │    │        预留：确认后仍播放广告但道具不增加（或直接不发）
  │    │    └─ 否 → 继续
  │    ├─ AdSystem.playAd('in_game_item', { itemType })
  │    ├─ 广告播放 → 完成(isEnded) →
  │    │    ├─ dailyAdCount += 1
  │    │    ├─ 道具发放到对局内临时计数
  │    │    ├─ 弹窗关闭 → 道具图标切换为 available
  │    │    └─ 进入冷却
  │    └─ 广告未完成/失败 → 弹窗保持，Toast提示
  └─
```

### 4.4 失败界面广告续命流程（P1）

```
关卡失败（defeatEscaped / defeatOutOfSteps）
  │
  ├─ [结算界面] 展示失败信息
  │    ├─ "差一点就成功了！"
  │    ├─ 本局统计（步数、时间等）
  │    ├─ [返回主页] 按钮
  │    ├─ [重新挑战] 按钮（消耗道具"重置本关"或直接重试）
  │    └─ [看广告继续] 按钮（P1）
  │         ├─ 文案："观看视频，免费续命"
  │         └─ 条件：每日可用次数（与 dailyAdCount 共享）
  │
  ├─ 玩家点击"看广告继续"
  │    ├─ 前置检查：dailyAdCount < dailyLimit？
  │    │    ├─ 否 → Toast "今日续命次数已用完"
  │    │    └─ 是 → 继续
  │    ├─ AdSystem.playAd('level_restart')
  │    ├─ 广告播放 → 完成(isEnded) →
  │    │    ├─ dailyAdCount += 1
  │    │    ├─ 重新加载当前关卡（玩家回到关卡初始状态）
  │    │    ├─ 步数和障碍物布局完全重置
  │    │    ├─ 道具使用次数不清零（保留本局已使用的道具统计）
  │    │    └─ 进入冷却
  │    └─ 广告未完成 → Toast + 结算界面保持
  └─
```

### 4.5 边界流程

**场景：广告加载耗时过长**

1. 玩家点击"观看广告"按钮。
2. 广告进入 `LOADING_AD` 状态，UI 展示 Loading 旋转动画 + "广告加载中..."文案。
3. 若加载超过 5 秒未完成：
   - 弹出 Toast "广告加载较慢，请耐心等待"。
   - Loading 动画继续，不自动取消。
4. 若加载超过 10 秒仍无响应：
   - 广告实例销毁，回到 IDLE。
   - Toast "广告加载超时，请检查网络后重试"。
   - 不消耗每日次数，不计入冷却。

**场景：广告播放中玩家切到后台**

1. 广告播放过程中玩家将微信切到后台（接电话、切应用等）。
2. 微信小游戏广告组件自动暂停广告播放。
3. 玩家返回微信后：
   - 若广告仍在播放时间内 → 继续播放。
   - 若广告已超时 → 触发 `onError` 回调，进入错误处理流程。
4. 奖励发放仅在 `onClose` 且 `isEnded === true` 时触发，后台切换不影响判定。

**场景：同一广告实例多次调用**

1. 广告系统确保同一广告实例在同一时间只响应一次 `playAd()` 调用。
2. 若 `playAd()` 被连续多次调用：
   - 第一次调用进入 `LOADING_AD` 或 `PLAYING` 状态后，第二次调用直接返回 `{ success: false, reason: 'ad_already_active' }`。
   - 调用方根据返回值不做任何操作。

---

## 五、边界条件与异常处理

### 5.1 数值边界

| 编号 | 边界场景 | 预期行为 |
|------|---------|---------|
| B1 | dailyAdCount 刚好等于 dailyLimit 时再次触发广告 | 前置检查拦截，Toast "今日广告次数已用完"，广告不播放 |
| B2 | 冷却倒计时尚未归零时触发广告 | 前置检查拦截，Toast "请等待 X 秒后重试"，广告不播放 |
| B3 | 广告播放过程中冷却时间已到 | 冷却计时在广告播放期间不运行；广告完成/关闭后才开始计时 |
| B4 | 主界面广告奖励随机选取到的道具库存已达上限 | 播放前做前置检查，若已达上限则弹出提示询问用户是否继续播放（P1优化） |
| B5 | 对局内已使用道具次数达上限后通过广告获取 | 获取成功（道具进入临时计数），但不可使用（按钮显示 exhausted），下局进入时因临时计数清空而恢复 |
| B6 | dailyAdCount 在切换日期瞬间出现并发增减 | 惰性检查 + 单线程执行，不存在并发问题；日期变更后的首次操作触发重置和计数的原子更新 |

### 5.2 异常处理

| 编号 | 异常类型 | 处理策略 |
|------|---------|---------|
| E1 | 微信广告组件初始化失败（`wx.createRewardedVideoAd` 返回错误） | 捕获异常，广告系统进入 `ERROR` 状态，所有广告入口按钮隐藏或置灰并提示"广告组件暂不可用" |
| E2 | 广告加载失败（`onError` 回调，errCode 100X 系列） | 根据错误码区分处理：1001（内部错误）→ 自动重试1次；1002（网络错误）→ Toast "网络异常，请重试"；1003（无广告库存）→ Toast "暂无广告，请稍后再试" |
| E3 | 广告播放过程中发生错误（`onError` 回调，errCode 200X 系列） | Toast "广告播放异常，已自动跳过" → 不发放奖励 → 冷却不计时 → 回到 IDLE |
| E4 | 广告回调 `onClose` 未触发（微信组件bug或机型兼容问题） | 设置 5 秒超时，超时后按"未完成"处理（不发奖励），记录错误日志 |
| E5 | `dailyAdCount` 或 `lastAdDate` 在 localStorage 中损坏或缺失 | 读取时捕获异常，设置默认值（`dailyAdCount = 0`，`lastAdDate = ""`），触发惰性重置 |
| E6 | 奖励发放时道具系统接口异常（`item_system` 未初始化或报错） | Try/catch 包裹奖励发放逻辑，发放失败时记录错误到 pipeline_errors.json，但广告次数仍扣除（防止重放攻击） |
| E7 | 冷却到期时间戳 `cooldownEndAt` 在未来很远（日期错误） | 每次检查冷却时校验时间戳合理性（`cooldownEndAt - now < 3600`），超出范围视为冷却已结束 |

### 5.3 幂等与容错

| 操作 | 幂等策略 |
|------|---------|
| 广告奖励发放 | 每次 `adRewarded` 事件携带唯一 `rewardId`（UUID），道具系统记录最近 10 个已处理的 `rewardId`，重复回调不重复发放 |
| 每日次数重置 | 基于日期字符串比较，同一日期多次重置无副作用 |
| 冷却开始 | 每次广告完成时计算 `cooldownEndAt = now + cooldownSeconds`，多次写入取最大值 |
| 广告实例创建 | 全局仅维护一个 `RewardedVideoAd` 实例，`playAd()` 前先销毁旧实例再创建新实例，避免实例泄漏 |

---

## 六、前后端通信设计

### 6.1 通信方式

广告系统为纯客户端系统，依赖微信小游戏原生广告组件实现。所有广告数据（次数、冷却时间、日期）存储在 `GameData` 单例中并通过 `localStorage` 持久化。广告系统不涉及服务端通信。

| 数据存储 | 键值 | 类型 | 初始值 | 说明 |
|---------|------|------|--------|------|
| 每日广告次数 | `GameData.dailyAdCount` | `number` | `0` | 每日 UTC+8 0点重置 |
| 最后广告日期 | `GameData.lastAdDate` | `string` | `""` | ISO 日期格式 `"2026-05-09"` |
| 冷却到期时间戳 | `GameData.adCooldownEndAt` | `number` (timestamp ms) | `0` | 冷却结束的绝对时间戳 |
| 广告实例状态 | 内部状态（非持久化） | `AdState` enum | `IDLE` | 广告系统运行时状态，不持久化 |
| 最近 rewardId 列表 | `GameData.recentRewardIds` | `string[]` | `[]` | 最近 10 个已发放的奖励ID，防止重复发放 |

### 6.2 事件总线协议

广告系统通过全局事件总线对外派发和监听以下事件，所有事件采用 camelCase 命名：

| 事件名 | 方向 | 载荷 | 触发时机 |
|--------|------|------|---------|
| `adWatched` | AdSystem → 全局 | `{ adType: 'main_menu_daily' \| 'in_game_item' \| 'level_restart', rewardId: string, timestamp: number }` | 玩家点击观看广告按钮，开始播放广告时 |
| `adRewarded` | AdSystem → item_system / level_result | `{ adType: string, rewardId: string, rewardContext: Record<string, any>, itemType?: string }` | 广告播放完成（`isEnded === true`），发放奖励时 |
| `adFailed` | AdSystem → 全局 | `{ adType: string, errorCode: number, errorMsg: string, rewardId?: string }` | 广告加载失败或播放出错时 |
| `adClosedEarly` | AdSystem → 全局 | `{ adType: string, rewardId: string }` | 广告被提前关闭（`isEnded === false`），不发奖励 |
| `adStateChanged` | AdSystem → UI | `{ oldState: AdState, newState: AdState, adType?: string }` | 广告系统内部状态发生变化时 |
| `adCooldownActivated` | AdSystem → UI | `{ remainingSeconds: number, cooldownEndAt: number }` | 广告进入冷却时 |
| `adCooldownEnded` | AdSystem → UI | `{}` | 冷却倒计时归零时 |
| `adDailyLimitReached` | AdSystem → UI | `{ dailyLimit: number, dailyAdCount: number }` | 每日广告次数达上限时 |
| `adDailyLimitReset` | AdSystem → 分析 | `{ date: string, previousCount: number }` | 每日重置执行时 |
| `adLoaded` | AdSystem → UI | `{ adType: string, loadTimeMs: number }` | 广告加载完成，准备展示时 |

AdState 枚举定义：

```typescript
enum AdState {
  IDLE = 'idle',
  CHECKING_LIMITS = 'checking_limits',
  LOADING_AD = 'loading_ad',
  AD_READY = 'ad_ready',
  PLAYING = 'playing',
  REWARDING = 'rewarding',
  COOLDOWN = 'cooldown',
  ERROR = 'error',
  LIMIT_ERROR = 'limit_error'
}
```

### 6.3 配置数据格式（shop_config.json）

`shop_config.json` 是广告系统和道具系统共享的配置文件，定义各道具的获取方式、次数限制和广告相关参数：

```json
{
  "acquisition": {
    "share": {
      "dailyLimit": 1,
      "rewardPool": ["extra_step", "undo", "reset", "hint"],
      "rewardCount": 1,
      "selectionStrategy": "random"
    },
    "ad": {
      "dailyLimit": 3,
      "rewardPerView": 1,
      "cooldownSeconds": 30,
      "rewardPool": ["extra_step", "undo", "reset", "hint"],
      "selectionStrategy": "random",
      "fallbackRewardPool": ["extra_step"],
      "mainMenuButtonEnabled": true
    },
    "initialGift": {
      "rewards": {
        "extra_step": 1,
        "undo": 1,
        "reset": 1,
        "hint": 1
      }
    }
  },
  "itemAcquisitionMap": {
    "extra_step": {
      "methods": ["share"],
      "description": "多走1步仅可通过分享获取"
    },
    "undo": {
      "methods": ["share"],
      "description": "返回上1步仅可通过分享获取"
    },
    "reset": {
      "methods": ["ad"],
      "description": "重置本关仅可通过广告获取"
    },
    "hint": {
      "methods": ["ad"],
      "description": "提示仅可通过广告获取"
    }
  },
  "levelRestartAd": {
    "enabled": true,
    "dailyLimit": 3,
    "shareDailyLimitWithAcquisition": true,
    "cooldownSeconds": 30
  },
  "ui": {
    "mainMenuAdButtonText": "免费得道具",
    "mainMenuAdButtonCooldownText": "{seconds}s后可用",
    "mainMenuAdButtonExhaustedText": "今日已用完",
    "inGameAdButtonText": "观看视频广告",
    "levelFailAdButtonText": "看广告继续",
    "toastAdLimitReached": "今日广告次数已用完",
    "toastAdCooldown": "请等待{seconds}秒后重试",
    "toastAdNotCompleted": "看完广告才能获得奖励哦",
    "toastAdLoadFailed": "广告加载失败，请重试",
    "toastAdLoadTimeout": "广告加载超时，请检查网络",
    "toastAdNoInventory": "该道具已达持有上限（{max}个），继续观看将无法获得奖励",
    "toastAdPlaying": "广告播放中..."
  }
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `acquisition.ad.dailyLimit` | number | 全天广告播放次数上限（所有入口共享） |
| `acquisition.ad.cooldownSeconds` | number | 两次广告之间的冷却秒数 |
| `acquisition.ad.rewardPool` | string[] | 主界面广告奖励随机池 |
| `acquisition.ad.mainMenuButtonEnabled` | boolean | 是否启用主界面广告按钮 |
| `itemAcquisitionMap` | object | 按道具ID索引的获取方式配置，`methods` 数组定义可用渠道 |
| `levelRestartAd` | object | 失败界面广告续命功能配置 |

---

## 七、美术需求说明

### 7.1 广告相关UI规范

所有广告相关的UI元素需遵循微信小游戏广告规范，不得遮挡/误导/伪造广告组件。广告播放过程中的状态提示使用游戏内Toast和Loading动画，不得修改广告组件本身的视觉表现。

### 7.2 主界面广告按钮

| 元素 | 规格 | 说明 |
|------|------|------|
| 广告按钮（常态） | 200×64px，圆角 12px，蓝色渐变背景（#4A90D9 → #357ABD） | 包含视频小图标 + "免费得道具"文案，白色文字 14px 粗体 |
| 广告按钮（冷却态） | 同上尺寸，背景变灰（#888888），文案变为"{N}s后可用" | 动态显示剩余冷却秒数 |
| 广告按钮（耗尽态） | 同上尺寸，半透明灰色（opacity 0.5），文案变为"今日已用完" | 不可点击 |
| 视频小图标 | 20×16px，白色三角形播放图标 | 按钮文字左侧 |
| 按钮位置 | 主界面道具栏上方，道具栏的左侧或居中 | 与分享按钮对称或并列 |

### 7.3 对局内广告入口

对局内广告入口复用道具获取弹窗（ItemSystem IT-M5）的 UI 框架，广告系统仅在其中提供"观看视频广告"按钮：

| 元素 | 规格 | 说明 |
|------|------|------|
| 广告按钮（弹窗内） | 260×52px，圆角 8px，蓝色渐变背景 | "观看视频广告" 白色文字 16px 粗体 |
| 广告按钮 Loading | 按钮内显示旋转 Loading 动画（直径 24px） | 广告加载中按钮文字变为"广告加载中..." |
| 广告按钮禁用 | 按钮置灰，opacity 0.5 | 冷却中或次数耗尽时 |
| 奖励预览 | 按钮文案下方小字显示"看完可获得{道具名} × 1" | 12px 灰色 #999 |

### 7.4 失败界面广告续命入口（P1）

| 元素 | 规格 | 说明 |
|------|------|------|
| 续命按钮 | 280×64px，圆角 14px，红色渐变背景（#E84C3D → #C0392B） | "看广告继续" 白色粗体 18px，带播放图标 |
| 续命按钮副文案 | 按钮下方 14px 灰色文字 | "今日还可使用 {remaining} 次" |
| 续命按钮禁用 | 置灰态，"今日续命次数已用完" | 条件同每日广告上限 |
| 成功反馈 | 广告看完后按钮变为绿色对勾动画（500ms），随后自动进入关卡 | 过渡自然 |

---

## 八、数据埋点需求

### 8.1 埋点事件列表

| 事件ID | 事件名 | 触发时机 | 携带参数 |
|--------|-------|---------|---------|
| `ad_play` | 广告播放 | 玩家点击观看广告按钮，开始加载广告 | `{ adType: string, currentDailyCount: number, dailyLimit: number }` |
| `ad_load_success` | 广告加载成功 | 广告加载完成，准备展示 | `{ adType: string, loadTimeMs: number }` |
| `ad_load_fail` | 广告加载失败 | 广告加载出错 | `{ adType: string, errorCode: number, errorMsg: string }` |
| `ad_show` | 广告展示 | 广告开始播放（全屏视频展示） | `{ adType: string, rewardId: string }` |
| `ad_completed` | 广告完整播放 | 广告播放完成（isEnded === true） | `{ adType: string, rewardId: string, durationMs: number }` |
| `ad_closed_early` | 广告提前关闭 | 广告未完成被关闭（isEnded === false） | `{ adType: string, rewardId: string }` |
| `ad_rewarded` | 奖励发放 | 广告奖励成功发放 | `{ adType: string, rewardId: string, itemType?: string, quantity: number }` |
| `ad_reward_fail` | 奖励发放失败 | 广告完成但奖励发放异常 | `{ adType: string, rewardId: string, errorMsg: string }` |
| `ad_cooldown_start` | 冷却开始 | 广告完成后进入冷却 | `{ adType: string, cooldownSeconds: number }` |
| `ad_daily_limit_hit` | 日限触发 | 玩家达到每日广告上限 | `{ adType: string, dailyLimit: number }` |
| `ad_daily_reset` | 每日重置 | 每日广告次数重置 | `{ date: string, previousCount: number }` |
| `ad_main_menu_click` | 主界面广告按钮点击 | 点击主界面"免费得道具"按钮 | `{ currentDailyCount: number, isCooling: boolean }` |
| `ad_level_fail_click` | 失败续命点击 | 点击失败界面"看广告继续"按钮 | `{ currentDailyCount: number, levelId: number }` |
| `ad_in_game_item_click` | 对局内广告获取点击 | 对局内道具弹窗中点击"观看视频广告" | `{ itemType: string, currentDailyCount: number }` |

### 8.2 核心监控指标

| 指标 | 计算方式 | 用途 | 目标参考值 |
|------|---------|------|-----------|
| 广告展示量 | 每日 `ad_show` 事件总数 | 衡量广告位曝光量 | 稳定增长 |
| 广告完成率 | `ad_completed` / `ad_show` × 100% | 衡量广告播放的完整度，反映广告质量和用户耐心 | ≥ 85% |
| 广告填充率 | `ad_load_success` / `ad_play` × 100% | 衡量微信广告库存的供给充足度 | ≥ 95% |
| 各入口展示占比 | 各 `adType` 的 `ad_show` 数量 / 总展示量 | 评估各广告位的贡献比例 | 主界面:对局内:续命 = 3:5:2 |
| 广告→道具获取转化率 | 广告播放完成后道具成功发放的比例 | 衡量奖励发放通道的稳定性 | ≥ 99% |
| 提前关闭率 | `ad_closed_early` / `ad_show` × 100% | 衡量广告对玩家的吸引力和耐心值 | ≤ 15% |
| 奖励弹窗道具领取率 | 广告完成后领取道具的占比 | 衡量奖励对玩家的吸引力 | ≥ 90% |
| eCPM（预估） | 参考微信小游戏行业数据 | 衡量广告变现效率 | 激励视频 ¥80-200 |
| 每日广告观看人数 / DAU | 每日至少观看一次广告的用户数 / DAU | 衡量广告渗透率 | ≥ 30% |
| 人均广告观看次数 | 广告总展示量 / 广告观看用户数 | 衡量用户广告参与深度 | ≥ 2.0 次/人/日 |

---

## 九、迭代规划

### 9.1 P0（基础架构）

- AD-M1 激励视频广告管理器：封装微信小游戏广告组件，加载/展示/回调全流程可用。
- AD-M5 广告冷却与频率控制器：每日次数限制、冷却时间管理、惰性每日重置。
- AD-M7 广告配置加载器：从 `shop_config.json` 读取广告配置参数。
- `GameData` 数据字段就绪：`dailyAdCount`、`lastAdDate`、`adCooldownEndAt`。
- 广告与道具系统的 `adRewarded` 事件对接完成（道具系统可接收广告完成回调发放奖励）。
- 核心异常处理（广告加载失败、播放错误、次数超限）覆盖。

### 9.2 P1（核心体验完善）

- AD-M2 主界面广告按钮：完整 UI + 交互 + 随机道具奖励 + 日限/冷却状态展示。
- AD-M3 对局内道具广告获取：道具获取弹窗对接广告系统，按 `shop_config.json` 中 `itemAcquisitionMap` 配置动态显示获取方式。
- AD-M6 广告状态UI组件：Loading动画、冷却倒计时、失败重试按钮等全流程视觉反馈。
- AD-M4 失败界面广告续命：结算界面"看广告继续"完整流程。
- `shop_config.json` 完整配置：`itemAcquisitionMap` 每个道具的获取方式配置就绪。
- 道具获取弹窗按门控模式动态显示按钮（单按钮 or 双按钮）。
- 主界面广告按钮每日首次奖励随机选取。

### 9.3 P2（商业化和深度优化）

- 广告奖励降级策略：每日第2次及之后观看主界面广告时，奖励降级（从降级池中随机选取低价值奖励）。
- 广告观看激励：连续观看广告N天后给予额外奖励（次日留存激励）。
- 广告观看提醒：每日首次进入游戏时，若还有广告次数，主界面广告按钮带微弱呼吸光效吸引注意。
- 广告频率动态调整：根据玩家活跃度和广告完成率动态调整冷却时间（活跃玩家缩短冷却）。
- 广告位 A/B 测试：对不同位置的广告按钮样式、文案、颜色进行 A/B 测试，优化点击率。
- 广告收益看板：在游戏内（或管理后台）展示累计广告观看次数和预估收益（仅供开发者查看）。
- 失败界面广告续命优化：广告完成后展示一个 1.5 秒的鼓励动画再进入关卡，渲染情绪价值。

### 9.4 明确不做

| 事项 | 不做原因 |
|------|---------|
| 插屏广告（Interstitial Ad） | 插屏广告为强制展示，违反本系统的"自愿性"原则，破坏游戏沉浸感，在回合制解谜游戏中体验极差 |
| Banner 横幅广告 | 手机屏幕空间有限，Banner 广告会遮挡游戏内容（尤其是底部道具栏和网格地图），eCPM 也远低于激励视频 |
| 广告解锁关卡 | 关卡解锁是核心游戏内容，设广告门槛会大幅降低用户体验和留存，与休闲游戏的定位不符 |
| 广告跳过冷却（付费） | 提供"付费跳过冷却"功能会引发"付费取胜"的负面感受，且广告冷却本身是保护机制而非限制机制 |
| 激励视频广告打开外链 | 微信小游戏广告规范禁止在激励视频结束后自动跳转外部链接，仅支持打开其他小程序 |
| 广告奖励翻倍（观看两次得双倍） | 增加规则复杂度，且容易让玩家形成"奖励减半"的心理落差，不如保持简单一致的奖励预期 |

---

**文档结束**
