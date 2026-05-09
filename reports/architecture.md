# 围住Boss (SurroundTheBoss) 架构设计文档

**版本**: v0.1.0 | **平台**: 微信小游戏 | **分辨率**: 648×1152 (竖屏) | **日期**: 2026-05-09

---

## §1.1 脚本职责表

| 模块路径 | 类型 | 职责描述 | 关键方法签名 |
|---------|------|---------|-------------|
| `src/core/EventBus.ts` | Core | 全局事件总线，管理事件订阅/派发/解绑，所有系统间通信均通过此总线 | `on(event: string, cb: Function): void` / `off(event: string, cb: Function): void` / `emit(event: string, data?: any): void` |
| `src/core/SceneManager.ts` | Core | 场景管理器，控制场景生命周期（加载/切换/销毁），管理过渡动画 | `switchTo(scene: string, params?: any): void` / `getCurrentScene(): string` / `register(scene: IScene): void` |
| `src/core/GameData.ts` | Singleton | 全局游戏状态单例，管理道具库存、玩家统计数据、设置偏好、localStorage 存档/读档 | `getData(key: string): any` / `setData(key: string, value: any): void` / `saveToLocalStorage(): void` / `loadFromLocalStorage(): void` / `resetToDefaults(): void` |
| `src/scenes/LoadingScreen.ts` | Scene | 游戏启动界面，负责 Logo 展示、48字真言、资源加载进度条、热启动缓存判定、加载完成后自动跳转主菜单 | `checkCache(): boolean` / `loadAssets(): Promise<void>` / `updateProgress(pct: number): void` / `switchToMainMenu(): void` / `showErrorRetry(): void` |
| `src/scenes/MainMenu.ts` | Scene | 游戏大厅界面，展示 Logo、开始挑战按钮（根据解锁状态切换文案）、排行榜/设置/分享功能入口、道具展示区 | `updateButtonState(): void` / `onChallengeStart(): void` / `openLeaderboard(): void` / `openSettings(): void` / `triggerShare(): void` |
| `src/scenes/GameLevel.ts` | Scene | 关卡游戏主场景（含网格地图、Boss、道具栏、暂停按钮），组合 GameplayCore、LevelManager、ItemSystem 等系统 | `initLevel(levelId: number): void` / `onGridClick(x: number, y: number): void` / `onPause(): void` / `updateUI(state: GameState): void` |
| `src/scenes/LevelResult.ts` | Scene | 关卡结算界面，处理第2关的胜利/失败两种结算画面，展示统计数据、Boss表情、分享/重试/返回按钮 | `showVictory(stats: LevelResultStats): void` / `showDefeat(stats: LevelResultStats): void` / `handleShare(): void` / `handleRetry(): void` / `handleBackHome(): void` |
| `src/scenes/Leaderboard.ts` | Scene | 排行榜弹出层（Popup），三维度（通关数/最少步数/最快时间）标签切换，集成微信开放数据域上传与拉取 | `uploadScore(data: UploadData): void` / `fetchFriendData(): Promise<RankEntry[]>` / `switchTab(dim: 'clears' \| 'steps' \| 'time'): void` / `renderRanking(entries: RankEntry[]): void` |
| `src/scenes/SettingsSystem.ts` | Scene | 设置弹出层（Popup），音效/震动开关、退出挑战按钮（仅关卡内显示）、退出确认对话框、版本信息展示 | `toggleSound(): boolean` / `toggleVibration(): boolean` / `exitLevel(): void` / `showConfirmDialog(): void` / `open(context: 'main_menu' \| 'in_level'): void` |
| `src/systems/GameplayCore.ts` | Class | 核心玩法逻辑：N×N 网格管理、Boss A* 寻路引擎、回合控制器（放置→移动→判定循环）、胜负判定（围住/逃脱）、步数计数器、棋盘序列化（撤销快照）、操作验证 | `initBoard(config: LevelConfig): void` / `placeObstacle(x: number, y: number): boolean` / `moveBoss(): Position` / `checkWinLose(): GameResult \| null` / `getBoardSnapshot(): BoardSnapshot` / `restoreFromSnapshot(snap: BoardSnapshot): void` / `getAvailableMoves(): Position[]` |
| `src/systems/LevelManager.ts` | Class | 关卡配置读取（levels.json）、解锁状态管理（locked/unlocked/cleared）、障碍物随机生成器（含排除区域/BFS死局检测）、关卡切换（第1关→第2关自动跳转）、进度持久化 | `loadLevel(levelId: number): LevelConfig` / `generateObstacles(cfg: LevelConfig): Position[]` / `checkUnlock(levelId: number): boolean` / `switchLevel(fromId: number, toId: number): void` / `getProgress(): LevelProgressData` / `saveProgress(data: LevelProgressData): void` |
| `src/systems/ItemSystem.ts` | Class | 道具库存管理（全局库存/对局内计数）、道具三态（available/unavailable/exhausted）管理、四种道具效果执行（extra_step/undo/reset/hint）、道具获取弹窗（对接分享和广告）、每日刷新调度（惰性检查 UTC+8）、配置加载（items.json / shop_config.json） | `useItem(type: string): boolean` / `acquireItem(type: string, qty: number, source: string): void` / `getItemState(type: string): ItemState` / `calculateHint(): Position \| null` / `dailyReset(): void` / `openAcquisitionPopup(type: string): void` |
| `src/systems/AdSystem.ts` | Module | 激励视频广告管理器（wx.createRewardedVideoAd 封装）、主界面广告按钮、对局内道具广告获取、失败界面广告续命、冷却计时（30秒）、每日次数控制（上限3次）、配置读取（shop_config.json） | `playAd(type: AdType, ctx?: any): Promise<AdResult>` / `checkLimits(): {allowed: boolean, reason?: string}` / `startCooldown(): void` / `getCooldownRemaining(): number` / `loadConfig(): void` |
| `src/utils/ShareSystem.ts` | Module | 三种分享场景（主菜单/胜利/失败）的入口调度、分享文案和图片生成、wx.shareAppMessage 封装、每日首次分享奖励发放（道具随机）、回调处理（成功/取消/失败） | `share(scene: ShareScene, stats?: LevelStats): void` / `handleCallback(result: ShareResult): void` / `getDailyShareCount(): number` / `generateShareImage(scene: ShareScene): Promise<string>` |
| `src/utils/AStarPathfinding.ts` | Util | A* 寻路算法，基于曼哈顿距离启发式，支持 4 方向移动、障碍物碰撞检测、搜索深度上限控制、超时降级（→BFS） | `findPath(grid: Grid, start: Position, goal: Position, maxDepth?: number): Position[]` / `isReachable(grid: Grid, start: Position, exits: Position[]): boolean` / `setHeuristicWeight(w: number): void` |
| `src/entities/Boss.ts` | Entity | Boss 实体类，管理位置坐标、移动动画（4方向序列帧）、被围住/逃脱动画状态 | `moveTo(pos: Position): void` / `setAnimation(state: BossAnimState): void` / `getPosition(): Position` |
| `src/entities/Obstacle.ts` | Entity | 障碍物实体类，管理坐标、放置动画（弹性缩放+尘土粒子）、皮肤类型 | `setType(type: 'player' \| 'map'): void` / `playPlaceAnimation(): void` |
| `src/entities/GridNode.ts` | Entity | 网格交点实体，管理坐标映射、相邻关系查询、点击碰撞检测（88×88px 触控区） | `isAdjacentTo(node: GridNode): boolean` / `containsPoint(px: number, py: number): boolean` |

> **说明**: Scene 类型为独立场景（通过 SceneManager 切换），Popup 型 Scene 以弹出层叠加在当前场景之上，Class 为纯逻辑类由场景组合调用，Module 为功能模块可被多场景引用，Util 为工具函数，Entity 为游戏实体。

---

## §1.2 场景/页面结构

```
Game (main.ts)                               ─ 入口，初始化 Canvas、EventBus、SceneManager、GameData
│
├── Loading (LoadingScreen.ts)               ─ 启动界面：Logo + 48字真言 + 进度条
│   └── 加载完成后自动跳转 → MainMenu
│
├── MainMenu (MainMenu.ts)                   ─ 主界面大厅
│   ├── [开始挑战] 按钮 → 跳转 GameLevel (levelId 由关卡状态决定)
│   ├── [排行榜] 按钮 → 弹出 Leaderboard (Popup)
│   ├── [设置] 按钮 → 弹出 SettingsSystem (Popup)
│   ├── [分享有礼] 按钮 → 调用 ShareSystem
│   └── 道具展示区（四种道具图标+持有数量）
│
├── GameLevel (GameLevel.ts)                 ─ 关卡游戏主场景
│   ├── 网格地图区（N×N 格子，交点可点击）
│   ├── 顶部信息栏（关卡名、步数、暂停按钮）
│   ├── Boss 角色（4方向行走动画）
│   ├── 障碍物（玩家放置 / 地图预置）
│   ├── 底部道具栏（四种道具的三态展示）
│   └── [暂停] → 弹出 SettingsSystem (Popup, 含退出挑战)
│
├── LevelResult (LevelResult.ts)             ─ 关卡结算（仅第2关展示，第1关通关自动跳关）
│   ├── 胜利模式：Boss被揍表情 + 步数/耗时 + [继续挑战] [我要分享]
│   └── 失败模式：Boss得意表情 + 吐槽文案 + [一会重来] [分享再战]
│
├── Settings (SettingsSystem.ts, Popup)      ─ 设置弹出层
│   ├── 主界面入口 → 音效开关 + 震动开关 + 版本号
│   └── 关卡内入口 → 音效开关 + 震动开关 + 退出挑战 + 版本号
│
└── Leaderboard (Leaderboard.ts, Popup)      ─ 排行榜弹出层
    ├── 标题栏 + 关闭按钮
    ├── 维度标签页：[通关数] [最少步数] [最快时间]
    ├── 好友排行列表（前100名，自己高亮）
    └── 底部 [邀请好友] 按钮
```

---

## §1.3 GlobalSingleton 规范

### GameData 完整接口定义 — `src/core/GameData.ts`

```typescript
/**
 * 游戏全局单例，管理所有全局状态、道具库存、玩家统计、设置偏好。
 * 所有数据通过 localStorage 持久化，支持测试隔离的 resetToDefaults()。
 */
export class GameData {

  // ============ 核心数据字段 ============

  /** 当前关卡 ID（1=教学关，2=核心挑战关） */
  currentLevel: number = 1;

  /** 当前对局已使用步数 */
  stepCount: number = 0;

  /** 当前对局是否胜利 */
  isBossCaught: boolean = false;

  /** 当前对局是否失败 */
  isBossEscaped: boolean = false;

  /** 全局道具库存，key=道具ID, value=数量 */
  items: Record<string, number> = {};

  /** 今日已分享次数 */
  dailyShareCount: number = 0;

  /** 今日已看广告次数 */
  dailyAdCount: number = 0;

  /** 关卡2历史最少步数（初始 999 表示无记录） */
  bestLevel2Steps: number = 999;

  /** 关卡2历史最快时间（秒，初始 999.0 表示无记录） */
  bestLevel2Time: number = 999.0;

  /** 关卡2累计通关次数 */
  totalClears: number = 0;

  /** 音效开关 */
  soundEnabled: boolean = true;

  /** 震动开关 */
  vibrationEnabled: boolean = true;

  /** 当前对局中的道具及数量（进入关卡时从全局库存扣除后存入） */
  currentItems: Record<string, number> = {};

  /** 撤销历史记录栈，存储每步之前的 BoardSnapshot */
  undoHistory: BoardSnapshot[] = [];

  // ============ 核心方法 ============

  /**
   * 获取指定键的值（带类型守卫和默认值兜底）
   * @param key - 数据字段名
   * @returns 该字段的当前值
   */
  getData(key: string): any;

  /**
   * 设置指定键的值，自动触发持久化
   * @param key - 数据字段名
   * @param value - 新值
   */
  setData(key: string, value: any): void;

  /**
   * 将全部数据持久化到 localStorage
   * 微信小游戏环境下使用 wx.setStorageSync，降级使用 localStorage.setItem
   */
  saveToLocalStorage(): void;

  /**
   * 从 localStorage 加载全部数据
   * 加载失败（数据损坏/首次启动）时使用默认值填充
   */
  loadFromLocalStorage(): void;

  /**
   * 重置所有字段为初始默认值。
   * 【P2 测试隔离规范】仅测试环境调用，Vitest 每个测试用例的 beforeEach 中执行。
   * 重置后立即调用 saveToLocalStorage() 持久化。
   */
  resetToDefaults(): void;
}
```

### 持久化字段清单

| 存储键 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `currentLevel` | `number` | `1` | 当前关卡 ID |
| `stepCount` | `number` | `0` | 当前步数（不持久化或对局开始时重置） |
| `items` | `Record<string, number>` | `{}` | 全局道具库存 |
| `dailyShareCount` | `number` | `0` | 今日分享次数 |
| `dailyAdCount` | `number` | `0` | 今日广告次数 |
| `bestLevel2Steps` | `number` | `999` | 第2关最佳步数 |
| `bestLevel2Time` | `number` | `999.0` | 第2关最佳时间 |
| `totalClears` | `number` | `0` | 第2关累计通关次数 |
| `soundEnabled` | `boolean` | `true` | 音效开关 |
| `vibrationEnabled` | `boolean` | `true` | 震动开关 |
| `tutorial_done` | `boolean` | `false` | 教学关是否完成 |

---

## §1.4 数据文件 Schema

### src/data/levels.json — 关卡配置文件

```typescript
interface LevelsConfig {
  levels: LevelConfig[];
}

interface LevelConfig {
  id: number;                          // 关卡 ID（1=教学关, 2=核心挑战关）
  name: string;                        // 关卡名称，如 "初识Boss"、"全力围堵"
  description: string;                 // 关卡描述文案
  gridSize: number;                    // 网格 N×N 尺寸（7=教学关, 9=标准关）
  bossStart: Position;                 // Boss 出生坐标（网格交点），如 {x:4, y:4}
  exits: 'all_boundaries';             // 出口类型（当前仅支持全部边界）
  initialObstacles: {
    count: number;                     // 总预置障碍物数
    fixed: Position[];                 // 固定障碍物坐标列表（教学关用）
    randomCount: number;               // 随机障碍物数量
    excludeRadius: number;             // Boss 周围排除半径（曼哈顿距离）
    maxRetries?: number;               // 死局检测最大重试次数（默认 20）
  };
  autoPlay: {                          // 教学关自动演示配置
    enabled: boolean;                  // 是否启用自动通关
    moveSequence: Position[] | null;   // 自动放置坐标序列
    intervalMs: number;                // 放置间隔（毫秒）
  };
  maxSteps: number;                    // 最大步数（99=无限制）
  bossSpeed: number;                   // Boss 移动动画速度倍率
  unlockCondition: {                   // 解锁条件
    requireLevelId: number;            // 需要通关的前置关卡 ID
    requireStatus: 'cleared';
  } | null;
  rewardOnClear: {                     // 通关奖励
    items: Record<string, number>;     // 如 { "hint": 1 }
  } | null;
  isReplayable: boolean;               // 通关后是否可重复挑战
  shareConfig?: {                      // 分享配置（第2关）
    title: string;                     // 分享文案，支持 {steps} 占位符
    image: string;                     // 分享图片文件名
  };
}

interface Position {
  x: number;  // 0 ~ gridSize
  y: number;  // 0 ~ gridSize
}
```

### src/data/items.json — 道具定义文件

```typescript
interface ItemsConfig {
  items: ItemDef[];
}

interface ItemDef {
  id: string;                          // 道具 ID（extra_step / undo / reset / hint）
  name: string;                        // 道具显示名称，如 "多走1步"
  description: string;                 // 效果描述，如 "本局步数上限增加5步"
  icon: string;                        // 图标资源名，如 "item_extra_step"
  maxPerSession: number;               // 每局使用次数上限（2 / 3 / 999 / 1）
  maxInventory: number;                // 全局库存最大持有量（均为 10）
  effectParams: Record<string, any>;   // 效果参数，如 { "extraSteps": 5 }
}
```

### src/data/shop_config.json — 获取方式配置

```typescript
interface ShopConfig {
  acquisition: {
    share: {                           // 分享获取配置
      dailyLimit: number;              // 每日分享奖励次数（1）
      rewardPool: string[];            // 奖励道具池
      rewardCount: number;             // 每次奖励数量（1）
      selectionStrategy: 'random';     // 选取策略
    };
    ad: {                              // 广告获取配置
      dailyLimit: number;              // 每日广告次数上限（3）
      rewardPerView: number;           // 每次观看奖励数量（1）
      cooldownSeconds: number;         // 冷却时间（30秒）
      rewardPool: string[];            // 奖励道具池
      mainMenuButtonEnabled: boolean;  // 是否启用主界面广告按钮
    };
    initialGift: {                     // 新手初始赠送
      rewards: Record<string, number>; // 各道具赠送数量，如各 1 个
    };
  };
  itemAcquisitionMap: {               // 单个道具获取方式映射
    [itemId: string]: {
      methods: ('share' | 'ad')[];    // 可用获取方式（share=分享门控, ad=广告门控, both=双通道）
      description: string;             // 获取方式文案说明
    };
  };
  levelRestartAd: {                    // 失败续命广告配置
    enabled: boolean;
    dailyLimit: number;                // 每日续命次数（3）
    shareDailyLimitWithAcquisition: boolean; // 是否与获取道具共享日限
    cooldownSeconds: number;
  };
  ui: Record<string, string>;          // UI 文案配置（按钮文本、Toast 提示等）
}
```

---

## §1.5 手机端性能规范

### Canvas 渲染优化

| 规则 | 说明 |
|------|------|
| **requestAnimationFrame 驱动** | 游戏主循环使用 `requestAnimationFrame` 驱动，不使用 `setInterval` 或 `setTimeout` 做帧同步。帧率锁定 60fps，低端机自动降帧（检测帧率 < 30fps 时跳过非关键渲染）。 |
| **脏矩形（Dirty Rect）更新** | 每帧仅重绘状态发生变化的区域（Boss 移动后的新旧位置、新放置的障碍物、步数数字），不做全屏重绘。网格线、背景等静态元素绘制到离屏 Canvas 缓存。 |
| **离屏 Canvas 缓存** | 静态元素（网格线、背景图、道具栏背景）预绘制到离屏 Canvas，主 Canvas 每帧仅做 `drawImage` 合成，避免重复路径绘制开销。 |
| **分层渲染** | 背景层（静态）→ 网格层（静态缓存）→ 实体层（Boss/障碍物，动态）→ UI 层（道具栏/信息栏，动态），分层绘制降低重绘面积。 |
| **纹理管理** | 所有图片资源加载后保持引用，场景切换时不重复加载。图片尺寸不超过 2048×2048（微信小游戏纹理上限）。使用 Image 对象复用，避免频繁 `new Image()`。 |

### 事件驱动 UI 更新

| 规则 | 说明 |
|------|------|
| **避免每帧轮询** | 游戏状态变更通过事件总线（EventBus）派发，UI 组件监听对应事件后更新。禁止在 `requestAnimationFrame` 中轮询 GameData 状态。 |
| **批量更新** | 同一帧内的多次 UI 更新请求合并为一次渲染操作（使用 `requestAnimationFrame` 微任务队列合并）。 |
| **更新节流** | 进度条更新、倒计时等高频 UI 操作节流到每帧最多更新一次（16ms 间隔），避免无用渲染。 |
| **事件命名** | 全部事件使用 `camelCase` 动词过去式命名（`bossMoved`, `obstaclePlaced`, `levelCleared`），通过全局 EventBus 实例派发。 |

### 懒加载资源

| 规则 | 说明 |
|------|------|
| **按需加载** | 非首屏资源（第2关 Boss 表情、排行榜头像、分享图等）在主界面加载完成后异步预加载，不阻塞 Loading 阶段。 |
| **资源缓存** | 微信小游戏环境利用 wx.getFileSystemManager 缓存已下载资源。预置资源打包在代码包中，运行时资源通过 CDN 加载并缓存。 |
| **图片预解码** | Loading 阶段完成所有核心图片资源的 Image.decode()，避免游戏运行时首次渲染卡顿。 |
| **音频延迟初始化** | 音效文件在 Loading 阶段仅加载元数据，首次播放时完成完整解码。AudioContext 在用户首次交互（点击）后创建，遵守浏览器自动播放策略。 |

### 触控优化

| 规则 | 说明 |
|------|------|
| **最小触控区域 88×88px** | 所有可点击元素（网格交点、按钮、道具图标）的逻辑点击区域不小于 88×88px。视觉尺寸可小于此值，但碰撞检测区域扩展至此最小值。 |
| **触控反馈** | 点击有效时 100ms 内给出视觉反馈（缩放/变色）。Boss 移动期间（bossMoving 状态）屏蔽全部点击事件。 |
| **防连点** | 按钮点击后立即禁用，200~500ms 冷却期内不响应第二次点击。场景切换按钮冷却 500ms。 |
| **多点触控** | 同一时间只处理第一个触控点，忽略后续触控点，防止双指误触。 |

### 安全区域

| 规则 | 说明 |
|------|------|
| **四边留白 40px** | 所有关键 UI 元素（按钮、道具栏、信息栏）距离屏幕边缘至少 40px，避免异形屏（刘海、挖孔、圆角）遮挡。 |
| **Canvas 适配策略** | `contain` 缩放策略：Canvas 保持 648×1152 比例缩放至全屏，上下/左右留白区域以纯色填充。微信小游戏环境下读取 `wx.getSystemInfoSync().safeArea` 动态调整安全区。 |
| **安全区检测** | 启动时检测 `wx.getSystemInfoSync().safeArea`，若存在则覆盖默认 40px 安全区为设备安全区值。刘海屏顶部安全区额外增加 20px。 |
