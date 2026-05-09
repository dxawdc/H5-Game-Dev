// MainMenu.ts
// 职责：游戏主界面场景，含背景、Logo、开始挑战按钮、P1入口按钮、道具栏
// 依赖：Scene, SceneManager, LevelManager, GameData, EventBus

import { Scene, sceneManager } from '../core/SceneManager'
import { GameScene } from './GameScene'
import { LevelManager } from '../systems/LevelManager'
import { eventBus } from '../core/EventBus'
import { GameData } from '../core/GameData'
import { leaderboardSystem } from '../systems/LeaderboardSystem'
import { shareSystem } from '../systems/ShareSystem'
import { adSystem } from '../systems/AdSystem'
import { LeaderboardPanel } from '../ui/LeaderboardPanel'
import { SettingsPanel } from '../ui/SettingsPanel'

const CANVAS_WIDTH = 648
const CANVAS_HEIGHT = 1152

interface ClickableArea {
  x: number
  y: number
  w: number
  h: number
  action: string
}

export class MainMenu implements Scene {
  private _levelManager: LevelManager = new LevelManager()
  private _loaded: boolean = false
  private _buttonScale: number = 1
  private _isAnimating: boolean = false
  private _clickableAreas: ClickableArea[] = []

  // 面板实例
  private _leaderboardPanel: LeaderboardPanel
  private _settingsPanel: SettingsPanel

  // Toast 提示
  private _toastMessage: string = ''
  private _toastTimer: number = 0

  constructor() {
    this._leaderboardPanel = new LeaderboardPanel(leaderboardSystem)
    this._settingsPanel = new SettingsPanel()
  }

  async onEnter(): Promise<void> {
    this._loaded = await this._levelManager.load()
    if (!this._loaded) {
      console.warn('LevelManager load failed in MainMenu')
    }

    // 初始化系统
    adSystem.init()
    await leaderboardSystem.init()

    // 订阅事件
    eventBus.on('inviteFriends', this._onInviteFriends)
  }

  onExit(): void {
    eventBus.off('inviteFriends', this._onInviteFriends)
  }

  update(deltaTime: number): void {
    if (this._isAnimating && this._buttonScale > 0.85) {
      this._buttonScale -= 0.02
    }

    // 更新面板动画
    if (this._leaderboardPanel.isVisible || this._leaderboardPanel.isAnimating) {
      this._leaderboardPanel.update(deltaTime)
    }
    if (this._settingsPanel.isOpen) {
      this._settingsPanel.update(deltaTime)
    }

    // Toast 定时消失
    if (this._toastTimer > 0) {
      this._toastTimer -= deltaTime
      if (this._toastTimer <= 0) {
        this._toastMessage = ''
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this._clickableAreas = []

    // 背景
    ctx.fillStyle = '#FFF8E1'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Logo
    ctx.fillStyle = '#FF6B35'
    ctx.font = 'bold 52px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('围住Boss', CANVAS_WIDTH / 2, 200)

    // 开始挑战按钮
    this._renderStartButton(ctx)

    // P1 入口按钮
    this._renderShareButton(ctx)
    this._renderLeaderboardButton(ctx)
    this._renderSettingsButton(ctx)
    this._renderAdButton(ctx)

    // 底部道具栏
    this._renderItemBar(ctx)

    // Toast 提示
    if (this._toastMessage) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.beginPath()
      ctx.roundRect((CANVAS_WIDTH - 300) / 2, CANVAS_HEIGHT * 0.88, 300, 44, 22)
      ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(this._toastMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.88 + 22)
    }

    // 面板覆盖层
    if (this._leaderboardPanel.isVisible || this._leaderboardPanel.isAnimating) {
      this._leaderboardPanel.render(ctx)
    }
    if (this._settingsPanel.isOpen) {
      this._settingsPanel.render(ctx)
    }
  }

  // ==================== 渲染方法 ====================

  private _renderStartButton(ctx: CanvasRenderingContext2D): void {
    const btnY = CANVAS_HEIGHT * 0.65
    const btnW = 300 * this._buttonScale
    const btnH = 80 * this._buttonScale
    const drawX = (CANVAS_WIDTH - btnW) / 2
    const drawY = btnY + (80 - btnH) / 2

    const gradient = ctx.createLinearGradient(drawX, drawY, drawX + btnW, drawY + btnH)
    gradient.addColorStop(0, '#FF6B35')
    gradient.addColorStop(1, '#E85D2C')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(drawX, drawY, btnW, btnH, 40)
    ctx.fill()

    const btnText = this._loaded ? this._levelManager.getMainButtonText() : '开始挑战'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(btnText, CANVAS_WIDTH / 2, drawY + btnH / 2)

    this._clickableAreas.push({
      x: (CANVAS_WIDTH - 300) / 2,
      y: CANVAS_HEIGHT * 0.65,
      w: 300,
      h: 80,
      action: 'startGame',
    })
  }

  private _renderShareButton(ctx: CanvasRenderingContext2D): void {
    const size = 88
    const x = CANVAS_WIDTH - size - 20
    const y = 20

    ctx.fillStyle = '#ECEFF1'
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, 12)
    ctx.fill()

    ctx.font = '32px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📤', x + size / 2, y + size / 2)

    // 首次每日分享显示红点提示
    if (GameData.dailyShareCount === 0) {
      ctx.fillStyle = '#E53935'
      ctx.beginPath()
      ctx.arc(x + size - 16, y + 16, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    this._clickableAreas.push({ x, y, w: size, h: size, action: 'share' })
  }

  private _renderLeaderboardButton(ctx: CanvasRenderingContext2D): void {
    const size = 88
    const x = CANVAS_WIDTH - size - 20
    const y = CANVAS_HEIGHT / 2 - size / 2

    ctx.fillStyle = '#ECEFF1'
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, 12)
    ctx.fill()

    ctx.font = '32px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏆', x + size / 2, y + size / 2)

    this._clickableAreas.push({ x, y, w: size, h: size, action: 'leaderboard' })
  }

  private _renderSettingsButton(ctx: CanvasRenderingContext2D): void {
    const size = 88
    const x = 20
    const y = CANVAS_HEIGHT / 2 - size / 2

    ctx.fillStyle = '#ECEFF1'
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, 12)
    ctx.fill()

    ctx.font = '32px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚙️', x + size / 2, y + size / 2)

    this._clickableAreas.push({ x, y, w: size, h: size, action: 'settings' })
  }

  private _renderAdButton(ctx: CanvasRenderingContext2D): void {
    const size = 88
    const x = CANVAS_WIDTH - size - 20
    const y = CANVAS_HEIGHT / 2 - size / 2 + 108

    ctx.fillStyle = '#ECEFF1'
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, 12)
    ctx.fill()

    ctx.font = '32px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📺', x + size / 2, y + size / 2)

    // 红点提示：有可用广告次数
    if (adSystem.canShow()) {
      ctx.fillStyle = '#4CAF50'
      ctx.beginPath()
      ctx.arc(x + size - 16, y + 16, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    this._clickableAreas.push({ x, y, w: size, h: size, action: 'ad' })
  }

  private _renderItemBar(ctx: CanvasRenderingContext2D): void {
    const slotW = 120
    const slotH = 88
    const gap = 12
    const totalW = 4 * slotW + 3 * gap
    const startX = (CANVAS_WIDTH - totalW) / 2
    const startY = CANVAS_HEIGHT - slotH - 40

    const items: Array<{ icon: string; label: string; key: string }> = [
      { icon: '👣', label: '步数+', key: 'extra_step' },
      { icon: '↩️', label: '撤销', key: 'undo' },
      { icon: '🔄', label: '重置', key: 'reset' },
      { icon: '💡', label: '提示', key: 'hint' },
    ]

    for (let i = 0; i < items.length; i++) {
      const ix = startX + i * (slotW + gap)
      const item = items[i]
      const count = GameData.items[item.key as keyof typeof GameData.items] as number

      // 道具格背景
      ctx.fillStyle = '#FFFFFF'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.roundRect(ix, startY, slotW, slotH, 10)
      ctx.fill()
      ctx.shadowBlur = 0

      // 图标
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.icon, ix + slotW / 2, startY + slotH * 0.35)

      // 数量文字
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(`${count}`, ix + slotW / 2, startY + slotH * 0.7)

      // 可点击区域
      this._clickableAreas.push({ x: ix, y: startY, w: slotW, h: slotH, action: `item_${item.key}` })
    }
  }

  // ==================== 交互处理 ====================

  /** 处理点击，返回 true 表示事件已消费 */
  handleClick(x: number, y: number): boolean {
    // 优先处理打开的面板
    if (this._settingsPanel.isOpen) {
      const handled = this._settingsPanel.handleClick(x, y)
      if (handled) return true
    }

    if (this._leaderboardPanel.isVisible || this._leaderboardPanel.isAnimating) {
      const handled = this._leaderboardPanel.handleClick(x, y)
      if (handled) return true
    }

    // 处理注册的点击区域
    for (const area of this._clickableAreas) {
      if (x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h) {
        this._handleAction(area.action)
        return true
      }
    }
    return false
  }

  private _handleAction(action: string): void {
    switch (action) {
      case 'startGame':
        this._startGame()
        break
      case 'share':
        this._onShareClick()
        break
      case 'leaderboard':
        this._leaderboardPanel.open()
        break
      case 'settings':
        this._settingsPanel.open(false)
        break
      case 'ad':
        this._onAdClick()
        break
      default:
        if (action.startsWith('item_')) {
          const itemName = action.replace('item_', '')
          console.warn(`Item slot clicked: ${itemName}`)
        }
        break
    }
  }

  private async _onShareClick(): Promise<void> {
    if (!shareSystem.canShare()) {
      this._showToast('分享冷却中')
      return
    }
    const success = await shareSystem.share('mainMenu')
    if (success) {
      this._showToast('分享成功！获得道具奖励')
    } else {
      this._showToast('分享失败')
    }
  }

  private _onInviteFriends = (): void => {
    shareSystem.share('mainMenu')
  }

  private _showToast(message: string): void {
    this._toastMessage = message
    this._toastTimer = 2.5
  }

  private async _onAdClick(): Promise<void> {
    if (!adSystem.canShow()) {
      this._showToast('广告次数已用完或冷却中')
      return
    }

    const rewarded = await adSystem.show()
    if (rewarded) {
      // 发放随机道具（从 ad 方式获取的道具中选取）
      const adItems = ['reset', 'hint']
      const randomId = adItems[Math.floor(Math.random() * adItems.length)]
      const items = GameData.items as unknown as Record<string, number>
      if (items) {
        items[randomId] = (items[randomId] || 0) + 1
        GameData.saveToLocalStorage()
      }
      this._showToast('获得道具奖励！')
    } else {
      this._showToast('广告未完成，无法获得奖励')
    }
  }

  private _startGame(): void {
    if (this._isAnimating) return
    this._isAnimating = true
    this._buttonScale = 0.85

    const targetLevelId = this._loaded ? this._levelManager.getTargetLevelId() : 1
    const levelConfig = this._loaded ? this._levelManager.getLevel(targetLevelId) : null

    const gridSize = levelConfig?.gridSize ?? 7
    const bossStart = levelConfig?.bossStart ?? { x: 3, y: 3 }
    const maxSteps = levelConfig?.maxSteps ?? 30

    eventBus.emit('gameStart', { levelId: targetLevelId })

    const gameScene = new GameScene(gridSize, bossStart, maxSteps)
    sceneManager.switchTo(gameScene)
  }
}
