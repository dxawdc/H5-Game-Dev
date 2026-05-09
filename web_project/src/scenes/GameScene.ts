// GameScene.ts
// 职责：关卡游戏主场景，渲染棋盘网格、障碍物、Boss，处理玩家触控放置，集成广告/分享/设置面板
// 依赖：GridManager, TurnController, SceneManager, EventBus, AdSystem, ShareSystem, SettingsPanel

import { Scene, sceneManager } from '../core/SceneManager'
import { MainMenu } from './MainMenu'
import { GridManager, Point } from '../systems/GridManager'
import { TurnController } from '../systems/TurnController'
import { eventBus } from '../core/EventBus'
import { GameData } from '../core/GameData'
import { adSystem } from '../systems/AdSystem'
import { shareSystem } from '../systems/ShareSystem'
import { leaderboardSystem } from '../systems/LeaderboardSystem'
import { SettingsPanel } from '../ui/SettingsPanel'

const CANVAS_WIDTH = 648
const CANVAS_HEIGHT = 1152

type GameSceneState = 'playing' | 'cleared' | 'defeated'

export class GameScene implements Scene {
  private _grid: GridManager
  private _controller: TurnController
  private _gridSize: number
  private _bossStart: Point
  private _maxSteps: number
  private _cellSize: number = 0
  private _offsetX: number = 0
  private _offsetY: number = 0

  // 场景状态
  private _state: GameSceneState = 'playing'
  private _clearSteps: number = 0
  private _clearTime: number = 0
  private _elapsedTime: number = 0

  // 面板
  private _settingsPanel: SettingsPanel

  constructor(gridSize: number, bossStart: Point, maxSteps: number) {
    this._gridSize = gridSize
    this._bossStart = bossStart
    this._maxSteps = maxSteps
    this._grid = new GridManager({ gridSize })
    this._controller = new TurnController(this._grid, bossStart, maxSteps)
    this._settingsPanel = new SettingsPanel()
  }

  onEnter(): void {
    this._controller.start()
    this._state = 'playing'
    this._elapsedTime = 0

    eventBus.on('obstaclePlaced', this._onObstaclePlaced)
    eventBus.on('bossMoved', this._onBossMoved)
    eventBus.on('levelCleared', this._onLevelCleared)
    eventBus.on('levelFailed', this._onLevelFailed)
    eventBus.on('exitChallenge', this._onExitChallenge)
  }

  onExit(): void {
    eventBus.off('obstaclePlaced', this._onObstaclePlaced)
    eventBus.off('bossMoved', this._onBossMoved)
    eventBus.off('levelCleared', this._onLevelCleared)
    eventBus.off('levelFailed', this._onLevelFailed)
    eventBus.off('exitChallenge', this._onExitChallenge)
  }

  update(deltaTime: number): void {
    if (this._state === 'playing') {
      this._elapsedTime += deltaTime
    }

    if (this._settingsPanel.isOpen) {
      this._settingsPanel.update(deltaTime)
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 背景
    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 计算网格绘制区域（居中，留边距）
    const margin = 40
    const boardSize = CANVAS_WIDTH - margin * 2
    this._cellSize = boardSize / this._gridSize
    this._offsetX = margin
    this._offsetY = (CANVAS_HEIGHT - boardSize) / 2 - 30

    this._drawGrid(ctx)
    this._drawObstacles(ctx)
    this._drawBoss(ctx)
    this._drawUI(ctx)

    // 设置按钮
    ctx.fillStyle = '#666666'
    ctx.font = '28px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚙', CANVAS_WIDTH - 36, 36)

    // 结算或失败覆盖层
    if (this._state === 'cleared') {
      this._renderClearedOverlay(ctx)
    } else if (this._state === 'defeated') {
      this._renderDefeatOverlay(ctx)
    }

    // 设置面板（最上层）
    if (this._settingsPanel.isOpen) {
      this._settingsPanel.render(ctx)
    }
  }

  // ==================== 棋盘渲染 ====================

  private _drawGrid(ctx: CanvasRenderingContext2D): void {
    const size = this._gridSize
    const cell = this._cellSize
    const ox = this._offsetX
    const oy = this._offsetY

    ctx.strokeStyle = '#D0C8B8'
    ctx.lineWidth = 1

    for (let i = 0; i <= size; i++) {
      const x = ox + i * cell
      ctx.beginPath()
      ctx.moveTo(x, oy)
      ctx.lineTo(x, oy + size * cell)
      ctx.stroke()

      const y = oy + i * cell
      ctx.beginPath()
      ctx.moveTo(ox, y)
      ctx.lineTo(ox + size * cell, y)
      ctx.stroke()
    }
  }

  private _drawObstacles(ctx: CanvasRenderingContext2D): void {
    const obstacles = this._grid.getAllObstacles()
    const cell = this._cellSize
    const ox = this._offsetX
    const oy = this._offsetY

    ctx.fillStyle = '#795548'
    for (const obs of obstacles) {
      const px = ox + obs.x * cell - cell / 2
      const py = oy + obs.y * cell - cell / 2
      ctx.beginPath()
      ctx.roundRect(px + 4, py + 4, cell - 8, cell - 8, 6)
      ctx.fill()
    }
  }

  private _drawBoss(ctx: CanvasRenderingContext2D): void {
    const bossPos = this._controller.bossPos
    const cell = this._cellSize
    const ox = this._offsetX
    const oy = this._offsetY
    const cx = ox + bossPos.x * cell
    const cy = oy + bossPos.y * cell

    ctx.fillStyle = '#E53935'
    ctx.beginPath()
    ctx.arc(cx, cy, cell * 0.35, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = `${cell * 0.4}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('B', cx, cy)
  }

  private _drawUI(ctx: CanvasRenderingContext2D): void {
    // 步数
    ctx.fillStyle = '#333333'
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`步数: ${this._controller.currentStep}/${this._controller.maxSteps}`, 20, 20)

    // 时间
    const elapsed = Math.floor(this._elapsedTime)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    ctx.fillText(`时间: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 48)
  }

  // ==================== 胜利覆盖层 ====================

  private _renderClearedOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 面板
    const panelW = 360
    const panelH = 280
    const panelX = (CANVAS_WIDTH - panelW) / 2
    const panelY = (CANVAS_HEIGHT - panelH) / 2

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    this._roundRect(ctx, panelX, panelY, panelW, panelH, 16)
    ctx.fill()

    // 胜利标题
    ctx.fillStyle = '#FF6B35'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('挑战成功！', CANVAS_WIDTH / 2, panelY + 50)

    // 统计
    ctx.fillStyle = '#333333'
    ctx.font = '18px sans-serif'
    ctx.fillText(`步数: ${this._clearSteps}  |  时间: ${this._clearTime.toFixed(1)}秒`, CANVAS_WIDTH / 2, panelY + 110)

    // 炫耀成绩按钮
    ctx.fillStyle = '#4CAF50'
    ctx.beginPath()
    this._roundRect(ctx, panelX + 40, panelY + 150, panelW - 80, 48, 24)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('炫耀成绩', CANVAS_WIDTH / 2, panelY + 174)

    // 继续按钮
    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    this._roundRect(ctx, panelX + 40, panelY + 212, panelW - 80, 48, 24)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('返回主菜单', CANVAS_WIDTH / 2, panelY + 236)
  }

  // ==================== 失败覆盖层 ====================

  private _renderDefeatOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const panelW = 360
    const panelH = 320
    const panelX = (CANVAS_WIDTH - panelW) / 2
    const panelY = (CANVAS_HEIGHT - panelH) / 2

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    this._roundRect(ctx, panelX, panelY, panelW, panelH, 16)
    ctx.fill()

    // 失败标题
    ctx.fillStyle = '#E53935'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('挑战失败', CANVAS_WIDTH / 2, panelY + 50)

    // 提示
    ctx.fillStyle = '#666666'
    ctx.font = '16px sans-serif'
    ctx.fillText('别灰心，再试一次吧！', CANVAS_WIDTH / 2, panelY + 100)

    // 观看广告重新挑战
    const adBtnColor = adSystem.canShow() ? '#2196F3' : '#BDBDBD'
    ctx.fillStyle = adBtnColor
    ctx.beginPath()
    this._roundRect(ctx, panelX + 40, panelY + 130, panelW - 80, 48, 24)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('观看广告重新挑战', CANVAS_WIDTH / 2, panelY + 154)

    // 分享再战按钮
    const shareBtnColor = shareSystem.canShare() ? '#4CAF50' : '#BDBDBD'
    ctx.fillStyle = shareBtnColor
    ctx.beginPath()
    this._roundRect(ctx, panelX + 40, panelY + 192, panelW - 80, 48, 24)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('分享再战', CANVAS_WIDTH / 2, panelY + 216)

    // 返回主菜单按钮
    ctx.fillStyle = '#999999'
    ctx.beginPath()
    this._roundRect(ctx, panelX + 40, panelY + 254, panelW - 80, 48, 24)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('返回主菜单', CANVAS_WIDTH / 2, panelY + 278)
  }

  // ==================== 事件处理 ====================

  handleClick(x: number, y: number): boolean {
    // 优先处理设置面板
    if (this._settingsPanel.isOpen) {
      const handled = this._settingsPanel.handleClick(x, y)
      if (handled) return true
    }

    // 处理结算/失败覆盖层
    if (this._state === 'cleared') {
      return this._handleClearedClick(x, y)
    }
    if (this._state === 'defeated') {
      return this._handleDefeatClick(x, y)
    }

    // 设置按钮
    if (this._isPointInRect(x, y, CANVAS_WIDTH - 60, 12, 48, 48)) {
      this._settingsPanel.open(true)
      return true
    }

    // 棋盘点击 - 委托给 TurnController
    // 注意: 实际触控处理由外部事件绑定管理
    return false
  }

  private _handleClearedClick(x: number, y: number): boolean {
    const panelW = 360
    const panelH = 280
    const panelX = (CANVAS_WIDTH - panelW) / 2
    const panelY = (CANVAS_HEIGHT - panelH) / 2

    // 炫耀成绩按钮
    if (this._isPointInRect(x, y, panelX + 40, panelY + 150, panelW - 80, 48)) {
      shareSystem.share('victory', { steps: this._clearSteps, time: this._clearTime })
      return true
    }

    // 返回主菜单按钮
    if (this._isPointInRect(x, y, panelX + 40, panelY + 212, panelW - 80, 48)) {
      this._returnToMainMenu()
      return true
    }

    return true
  }

  private _handleDefeatClick(x: number, y: number): boolean {
    const panelW = 360
    const panelH = 320
    const panelX = (CANVAS_WIDTH - panelW) / 2
    const panelY = (CANVAS_HEIGHT - panelH) / 2

    // 观看广告重新挑战
    if (this._isPointInRect(x, y, panelX + 40, panelY + 130, panelW - 80, 48)) {
      this._onAdRetry()
      return true
    }

    // 分享再战
    if (this._isPointInRect(x, y, panelX + 40, panelY + 192, panelW - 80, 48)) {
      shareSystem.share('defeat')
      return true
    }

    // 返回主菜单
    if (this._isPointInRect(x, y, panelX + 40, panelY + 254, panelW - 80, 48)) {
      this._returnToMainMenu()
      return true
    }

    return true
  }

  private _onObstaclePlaced = (...args: unknown[]): void => {
    const data = args[0] as { x: number; y: number }
    console.warn('Obstacle placed at', data.x, data.y)
  }

  private _onBossMoved = (...args: unknown[]): void => {
    const data = args[0] as { from: Point; to: Point }
    console.warn('Boss moved to', data.to)
  }

  private _onLevelCleared = (...args: unknown[]): void => {
    const data = args[0] as { steps: number }
    this._clearSteps = data.steps
    this._clearTime = this._elapsedTime
    this._state = 'cleared'

    console.warn('Level cleared in', data.steps, 'steps')

    // 上报排行榜数据
    leaderboardSystem.onLevelCleared(2, data.steps, this._elapsedTime)
  }

  private _onLevelFailed = (...args: unknown[]): void => {
    const data = args[0] as { reason: string }
    this._state = 'defeated'
    console.warn('Level failed:', data.reason)
  }

  private _onExitChallenge = (): void => {
    this._returnToMainMenu()
  }

  private async _onAdRetry(): Promise<void> {
    if (!adSystem.canShow()) {
      console.warn('GameScene: 广告不可用，无法重新挑战')
      return
    }

    const rewarded = await adSystem.show()
    if (rewarded) {
      // 重新创建场景并切换
      const newScene = new GameScene(this._gridSize, this._bossStart, this._maxSteps)
      sceneManager.switchTo(newScene)
    } else {
      console.warn('GameScene: 广告未完成，不重新挑战')
    }
  }

  private _returnToMainMenu(): void {
    GameData.currentLevel = 1
    GameData.stepCount = 0
    GameData.isBossCaught = false
    GameData.isBossEscaped = false
    GameData.saveToLocalStorage()

    const mainMenu = new MainMenu()
    sceneManager.switchTo(mainMenu)
  }

  // ==================== 工具方法 ====================

  private _isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
  }

  private _roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }
}
