# 围住Boss · 完整游戏设计文档

> 由 Agent 03 汇总。系统详细规格见 design/systems/ 目录。
> 本文件只记录全局规则和跨系统决策。

---

## 一、游戏概览

围住Boss是一款微信小游戏，玩家在网格地图上通过点击空白格点放置障碍物，围堵Boss使其无法移动。Boss使用A*寻路算法尝试逃向边界出口。每局限定步数内完成围堵即获胜。游戏包含第1关（7×7教学关）和第2关（9×9核心挑战关），玩家反复挑战第2关追求更少步数和更短时间。

---

## 二、系统总览

| 系统ID | 名称 | 优先级 | 复杂度 | 文档 |
|-------|------|-------|-------|------|
| loading_system | Loading系统 | P0 | S | [查看](design/systems/loading_system.md) |
| main_menu | 主界面系统 | P0 | S | [查看](design/systems/main_menu.md) |
| gameplay_core | 核心玩法系统 | P0 | L | [查看](design/systems/gameplay_core.md) |
| level_system | 关卡系统 | P0 | M | [查看](design/systems/level_system.md) |
| item_system | 道具系统 | P0 | M | [查看](design/systems/item_system.md) |
| level_result | 关卡结算系统 | P0 | S | [查看](design/systems/level_result.md) |
| leaderboard | 排行榜系统 | P1 | M | [查看](design/systems/leaderboard.md) |
| share_system | 分享系统 | P1 | S | [查看](design/systems/share_system.md) |
| ad_system | 广告变现系统 | P1 | M | [查看](design/systems/ad_system.md) |
| settings_system | 设置系统 | P1 | S | [查看](design/systems/settings_system.md) |
| costume_system | 换装系统 | P2 | M | [查看](design/systems/costume_system.md) |

---

## 三、全局数值表

| 系统 | 参数名 | 数值 | 单位 | 备注 |
|-----|-------|------|------|------|
| level_system | 第1关网格尺寸 | 7×7 | 格 | 交点总数64 |
| level_system | 第2关网格尺寸 | 9×9 | 格 | 交点总数100 |
| level_system | 第1关初始障碍物 | 4 | 个 | 含固定和随机 |
| level_system | 第2关初始障碍物 | 0~3 | 个 | 仅随机 |
| gameplay_core | 第2关最大步数 | 30 | 步 | 超过则失败 |
| gameplay_core | 点击判定半径 | 24 | px | 触摸容差 |
| gameplay_core | Boss移动间隔 | 0.5 | 秒 | 动画时长 |
| gameplay_core | A*寻路超时 | 100 | ms | 超过则走默认方向 |
| item_system | 多走1步次数上限 | 2 | 次/局 |  |
| item_system | 撤回上1步次数上限 | 3 | 次/局 |  |
| item_system | 提示次数上限 | 1 | 次/局 |  |
| item_system | 重置本关次数上限 | 不限 | 次/局 |  |
| gameplay_core | Boss距出口≤2格 | 触发加速 | 规则 | Boss优先直线移动 |
| display | 视口分辨率 | 648×1152 | px | portrait |
| display | 触控最小区域 | 88×88 | px | 逻辑像素 |
| display | 安全区 | 四边各40 | px |  |

---

## 四、新手引导流程

第1关（7×7，极易）作为隐性教学关，不显示独立引导界面：

1. 玩家点击"开始挑战"进入第1关
2. 第1关地图自动展示，Boss位于起点（距边界3格）
3. 初始障碍物已放置，剩余少量空白格点可操作
4. 玩家点击格点放置障碍物 → 观察Boss寻路避开
5. 继续围堵直至Boss完全无法移动 → 自动通关
6. 弹窗提示"通关！"并自动进入第2关
7. 完成字段：`tutorial_done = true`（首次通关第1关后自动标记）

**引导期间限制**：无需限制，第1关本身难度极低（闭眼过），所有道具系统功能正常开放。

---

## 五、系统间数据流

```
loading_system --[事件: loadCompleted]--> main_menu：通知加载完成

main_menu --[事件: challengeStarted]--> level_system：请求关卡数据
level_system --[事件: levelConfigLoaded]--> gameplay_core：提供网格配置

gameplay_core --[事件: gridPointClicked]--> item_system：触发道具使用判定
item_system --[事件: itemUsed]--> gameplay_core：执行道具效果
item_system --[事件: itemAcquired]--> gameplay_core：更新UI道具栏

gameplay_core --[事件: levelCleared]--> level_result：触发胜利结算
gameplay_core --[事件: levelFailed]--> level_result：触发失败结算

level_result --[事件: retryRequested]--> level_system：重新加载关卡
level_result --[事件: returnedToMainMenu]--> main_menu：返回主界面
level_result --[事件: shareTriggered]--> share_system：拉起分享

share_system --[事件: shareCompleted]--> item_system：发放分享奖励
share_system --[事件: shareRewarded]--> leaderboard：更新好友邀请

ad_system --[事件: adRewarded]--> item_system：发放广告奖励
ad_system --[事件: adFailed]--> item_system：通知失败

gameplay_core --[事件: scoreUploaded]--> leaderboard：上传成绩
leaderboard --[事件: rankingUpdated]--> main_menu：更新排行榜显示

main_menu --[事件: settingsOpened]--> settings_system：打开设置面板
settings_system --[事件: exitConfirmed]--> main_menu：退出挑战确认
```

---

## 六、手机端通用规范

- **分辨率**：648×1152（portrait）
- **画布适配**：Canvas动态缩放，保持contain策略，兼顾安全区
- **触控区域**：所有可点击元素最小88×88px（逻辑像素）
- **安全区域**：四边各留40px
- **性能**：事件驱动UI更新，避免每帧在渲染循环中执行复杂逻辑；优先使用requestAnimationFrame
- **音效**：使用HTML5 Web Audio API，所有音效控制在50KB以内

---

## 七、一致性校验报告

| 检查项 | 数量 | 处理方式 |
|-------|------|---------|
| 数值矛盾修正 | 3处 | 以gameplay_core（核心玩法系统）为准，修正level_system数值 |
| 依赖缺口补全 | 7处 | 补充相关系统§1.3双向声明 |
| 事件格式修正 | 9处 | 修正为非动词过去式的事件名（加-ed后缀） |
| 事件名不匹配 | 1处 | gameplay_core发出`levelCleared`/`levelFailed`（原gameEnded），level_result对应监听 |
| MVP冲突处理 | 0处 | 核心循环完整，MVP功能无冲突 |
| 已修改文件 | 6个 | gameplay_core.md, level_system.md, level_result.md, main_menu.md, leaderboard.md, ad_system.md, settings_system.md |

### 详细说明

**数值修正（3处）**：
- 第2关最大步数：35 → **30**（统一为gameplay_core标准）
- 第1关初始障碍物：6(4固定+2随机) → **4(2固定+2随机)**
- 第2关初始障碍物：4(0固定+4随机) → **0~3(0固定+0~3随机)**

**事件名修正（9处）**：
- `sceneTransitionStart` → `sceneTransitionStarted`（2处）
- `sceneTransitionComplete` → `sceneTransitionCompleted`
- `aStarTimeout` → `aStarTimedOut`
- `levelTransitionComplete` → `levelTransitionCompleted`
- `backToMainMenu` → `returnedToMainMenu`
- `leaderboardDataReady` → `leaderboardDataLoaded`
- `leaderboardDataError` → `leaderboardDataErrored`
- `adCooldownActive` → `adCooldownActivated`

**依赖补全（7处）**：
- gameplay_core §1.3：补充接收来自main_menu（进入关卡）、level_result（重新挑战）；修正`social_system`引用为`leaderboard`
- level_system §1.3：补充leaderboard读取关卡信息
- level_result §1.3：补充item_system道具统计输入、gameplay_core重挑战输出
- ad_system §1.3：补充level_system广告复活协作
- leaderboard §1.3：补充level_result结算触发
