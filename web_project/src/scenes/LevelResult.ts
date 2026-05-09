// LevelResult.ts
// 职责：关卡结算场景，展示胜利/失败状态、统计数据、操作按钮，含入场动画序列
// 依赖：Scene, SceneManager, LevelTransitionController, GameData

import { Scene, sceneManager } from '../core/SceneManager'
import { LevelTransitionController } from '../systems/LevelTransitionController'
import { GameScene } from './GameScene'
import { MainMenu } from './MainMenu'
import { LevelManager } from '../systems/LevelManager'

const CANVAS_WIDTH = 648
const CANVAS_HEIGHT = 1152

// 动画阶段
type AnimPhase = 'overlay' | 'bossPopIn' | 'title' | 'stats' | 'buttons' | 'complete'

// 随机文本池
const VICTORY_TEXTS = ['太棒了！', 'Boss被围住了！', '干得漂亮！']
const DEFEAT_TEXTS = ['Boss逃走了！', '再试一次！', '差一点就成功了！']

interface ButtonRect {
  x: number
  y: number
  w: number
  h: number
  text: string
}

export class LevelResult implements Scene {
  private _isVictory: boolean
  private _steps: number
  private _elapsedMs: number
  private _levelId: number
  private _levelManager: LevelManager = new LevelManager()

  // 动画状态
  private _animPhase: AnimPhase = 'overlay'
  private _overlayAlpha: number = 0
  private _bossScale: number = 0
  private _titleChars: string[] = []
  private _titleRevealed: number = 0
  private _statsOffsetX: number = CANVAS_WIDTH
  private _buttonAlpha: number = 0

  // 结算数据
  private _resultText: string
  private _accentColor: string
  private _bestRecord: { steps: number; time: number }

  // 按钮区域（供点击检测）
  private _buttonRects: ButtonRect[] = []

  constructor(isVictory: boolean, steps: number, elapsedMs: number, levelId: number = 1) {
    this._isVictory = isVictory
    this._steps = steps
    this._elapsedMs = elapsedMs
    this._levelId = levelId

    // 从对应文本池中随机选取
    const pool = isVictory ? VICTORY_TEXTS : DEFEAT_TEXTS
    this._resultText = pool[Math.floor(Math.random() * pool.length)]
    this._accentColor = isVictory ? '#FF6B35' : '#607D8B'
    this._titleChars = this._resultText.split('')
    this._bestRecord = LevelTransitionController.getBestRecord()
  }

  onEnter(): void {
    // 通过关卡过渡控制器保存成绩
    LevelTransitionController.onLevelCleared(this._levelId, this._steps, this._elapsedMs)
    console.warn(
      `LevelResult: ${this._isVictory ? 'VICTORY' : 'DEFEAT'} ` +
      `- Level ${this._levelId}, ${this._steps} steps, ${(this._elapsedMs / 1000).toFixed(1)}s`
    )
  }

  onExit(): void {
    // 清理
  }

  update(deltaTime: number): void {
    const speed = deltaTime * 60

    switch (this._animPhase) {
      case 'overlay':
        this._overlayAlpha = Math.min(1, this._overlayAlpha + 0.05 * speed)
        if (this._overlayAlpha >= 1) {
          this._animPhase = 'bossPopIn'
        }
        break

      case 'bossPopIn':
        this._bossScale = Math.min(1, this._bossScale + 0.08 * speed)
        if (this._bossScale >= 1) {
          this._animPhase = 'title'
        }
        break

      case 'title':
        if (this._titleRevealed < this._titleChars.length) {
          this._titleRevealed = Math.min(
            this._titleChars.length,
            this._titleRevealed + Math.ceil(1 * speed)
          )
        }
        if (this._titleRevealed >= this._titleChars.length) {
          this._animPhase = 'stats'
        }
        break

      case 'stats':
        this._statsOffsetX = Math.max(
          CANVAS_WIDTH / 2 - 150,
          this._statsOffsetX - 15 * speed
        )
        if (this._statsOffsetX <= CANVAS_WIDTH / 2 - 150) {
          this._animPhase = 'buttons'
        }
        break

      case 'buttons':
        this._buttonAlpha = Math.min(1, this._buttonAlpha + 0.05 * speed)
        if (this._buttonAlpha >= 1) {
          this._animPhase = 'complete'
        }
        break

      case 'complete':
        // 动画序列完成
        break
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 背景
    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 1. Overlay 淡入
    ctx.fillStyle = `rgba(0, 0, 0, ${this._overlayAlpha * 0.5})`
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 2. Boss 弹入
    this._renderBoss(ctx)

    // 3. 标题打字机效果
    this._renderTitle(ctx)

    // 4. 统计面板滑入
    this._renderStats(ctx)

    // 5. 按钮淡入
    this._renderButtons(ctx)
  }

  // ==================== Boss 渲染 ====================

  private _renderBoss(ctx: CanvasRenderingContext2D): void {
    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT * 0.28
    const radius = 60 * this._bossScale

    ctx.save()

    // Boss 身体
    ctx.fillStyle = this._isVictory ? '#FF6B35' : '#E53935'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()

    if (this._isVictory) {
      // 受伤表情：X 眼 + 波浪嘴
      ctx.fillStyle = '#333333'
      ctx.font = `bold ${radius * 0.3}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('X', cx - radius * 0.35, cy - radius * 0.15)
      ctx.fillText('X', cx + radius * 0.35, cy - radius * 0.15)

      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy + radius * 0.25, radius * 0.28, 0.1, Math.PI - 0.1)
      ctx.stroke()
    } else {
      // 得意表情：> < 眼 + 歪嘴笑
      ctx.fillStyle = '#333333'
      ctx.font = `bold ${radius * 0.3}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('>', cx - radius * 0.35, cy - radius * 0.15)
      ctx.fillText('<', cx + radius * 0.35, cy - radius * 0.15)

      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy + radius * 0.2, radius * 0.3, 0.1, Math.PI - 0.1)
      ctx.stroke()
    }

    ctx.restore()
  }

  // ==================== 标题渲染 ====================

  private _renderTitle(ctx: CanvasRenderingContext2D): void {
    const visibleText = this._titleChars.slice(0, this._titleRevealed).join('')
    if (visibleText.length === 0) return

    ctx.fillStyle = this._accentColor
    ctx.font = 'bold 42px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(visibleText, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.46)
  }

  // ==================== 统计面板渲染 ====================

  private _renderStats(ctx: CanvasRenderingContext2D): void {
    const panelX = this._statsOffsetX
    const panelY = CANVAS_HEIGHT * 0.54
    const panelW = 300
    const panelH = 130

    // 面板背景 + 阴影
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.roundRect(panelX, panelY, panelW, panelH, 12)
    ctx.fill()
    ctx.restore()

    // 步数行
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`步数: ${this._steps}`, panelX + 20, panelY + 16)

    // 最佳步数对比
    const hasBestSteps = this._bestRecord.steps > 0 && this._bestRecord.steps < 999
    if (hasBestSteps) {
      ctx.fillStyle = this._steps <= this._bestRecord.steps ? '#4CAF50' : '#999999'
      ctx.font = '16px sans-serif'
      ctx.fillText(`最佳: ${this._bestRecord.steps}`, panelX + 170, panelY + 18)
    }

    // 时间行
    const timeSec = (this._elapsedMs / 1000).toFixed(1)
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText(`时间: ${timeSec}s`, panelX + 20, panelY + 52)

    // 最佳时间对比
    const hasBestTime = this._bestRecord.time > 0 && this._bestRecord.time < 999
    if (hasBestTime) {
      ctx.fillStyle = this._elapsedMs <= this._bestRecord.time ? '#4CAF50' : '#999999'
      ctx.font = '16px sans-serif'
      ctx.fillText(`最佳: ${(this._bestRecord.time / 1000).toFixed(1)}s`, panelX + 170, panelY + 54)
    }

    // 关卡信息
    ctx.fillStyle = '#999999'
    ctx.font = '14px sans-serif'
    ctx.fillText(`第 ${this._levelId} 关 · ${this._isVictory ? '胜利' : '失败'}`, panelX + 20, panelY + 92)
  }

  // ==================== 按钮渲染 ====================

  private _renderButtons(ctx: CanvasRenderingContext2D): void {
    if (this._buttonAlpha <= 0) return

    ctx.save()
    ctx.globalAlpha = this._buttonAlpha

    const btnW = 280
    const btnH = 56
    const centerX = (CANVAS_WIDTH - btnW) / 2
    const startY = CANVAS_HEIGHT * 0.74
    const gap = 14

    const buttons = ['继续挑战', '返回主界面', '分享']
    this._buttonRects = buttons.map((text, i) => {
      const y = startY + i * (btnH + gap)
      return { x: centerX, y, w: btnW, h: btnH, text }
    })

    for (const btn of this._buttonRects) {
      // 按钮颜色
      if (btn.text === '分享') {
        ctx.fillStyle = '#FF6B35'
      } else if (btn.text === '继续挑战') {
        ctx.fillStyle = this._accentColor
      } else {
        ctx.fillStyle = '#78909C'
      }

      ctx.beginPath()
      ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 28)
      ctx.fill()

      // 按钮文字
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2)
    }

    ctx.restore()
  }

  // ==================== 交互处理 ====================

  handleClick(x: number, y: number): boolean {
    for (const btn of this._buttonRects) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        this._handleButtonAction(btn.text)
        return true
      }
    }
    return false
  }

  private _handleButtonAction(action: string): void {
    switch (action) {
      case '继续挑战':
        this._restartLevel()
        break
      case '返回主界面':
        LevelTransitionController.returnToMenu()
        sceneManager.switchTo(new MainMenu())
        break
      case '分享':
        console.warn('Share button clicked from LevelResult')
        break
      default:
        console.warn(`Unknown action: ${action}`)
    }
  }

  private async _restartLevel(): Promise<void> {
    LevelTransitionController.restartLevel(this._levelId)

    const loaded = await this._levelManager.load()
    let gridSize = 7
    let bossStart = { x: 3, y: 3 }
    let maxSteps = 30

    if (loaded) {
      const config = this._levelManager.getLevel(this._levelId)
      if (config) {
        gridSize = config.gridSize
        bossStart = config.bossStart
        maxSteps = config.maxSteps
      }
    }

    const gameScene = new GameScene(gridSize, bossStart, maxSteps)
    sceneManager.switchTo(gameScene)
  }
}
