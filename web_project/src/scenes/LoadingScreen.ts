// LoadingScreen.ts
// 职责：游戏启动画面，热启动判定、Logo展示、48字真言
// 依赖：Scene, GameData, sceneManager

import { Scene } from '../core/SceneManager'
import { sceneManager } from '../core/SceneManager'
import { eventBus } from '../core/EventBus'

const CACHE_DURATION_MS = 30 * 60 * 1000 // 30分钟
const LOGO_HEIGHT = 120
const CANVAS_WIDTH = 648
const CANVAS_HEIGHT = 1152

export class LoadingScreen implements Scene {
  private _phase: 'checking' | 'loading' | 'error' | 'done' = 'checking'
  private _progress: number = 0

  onEnter(): void {
    this._checkCache()
  }

  onExit(): void {
    // 清理
  }

  update(_deltaTime: number): void {
    // Loading 阶段的进度更新由外部资源加载触发
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 背景
    ctx.fillStyle = '#ECEFF1'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (this._phase === 'checking') {
      this._renderLogo(ctx)
      this._renderHealthText(ctx)
    } else if (this._phase === 'loading') {
      this._renderLogo(ctx)
      this._renderHealthText(ctx)
      this._renderProgressBar(ctx)
    } else if (this._phase === 'error') {
      this._renderLogo(ctx)
      this._renderHealthText(ctx)
      this._renderError(ctx)
    }
  }

  private _renderLogo(ctx: CanvasRenderingContext2D): void {
    const y = CANVAS_HEIGHT * 0.35
    ctx.fillStyle = '#FF6B35'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('围住Boss', CANVAS_WIDTH / 2, y + LOGO_HEIGHT / 2)
  }

  private _renderHealthText(ctx: CanvasRenderingContext2D): void {
    const lines = [
      '抵制不良游戏，拒绝盗版游戏。',
      '注意自我保护，谨防受骗上当。',
      '适度游戏益脑，沉迷游戏伤身。',
      '合理安排时间，享受健康生活。',
    ]
    const startY = CANVAS_HEIGHT * 0.35 + LOGO_HEIGHT + 40
    ctx.font = '14px sans-serif'
    ctx.fillStyle = '#999999'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, startY + i * 22)
    })
  }

  private _renderProgressBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = 432
    const barHeight = 16
    const barX = (CANVAS_WIDTH - barWidth) / 2
    const barY = CANVAS_HEIGHT * 0.6

    // 背景轨道
    ctx.fillStyle = '#E0E0E0'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth, barHeight, 8)
    ctx.fill()

    // 填充条
    const fillWidth = Math.max(0, Math.min(barWidth, (this._progress / 100) * barWidth))
    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    ctx.roundRect(barX, barY, fillWidth, barHeight, 8)
    ctx.fill()

    // 百分比文字
    ctx.font = '14px sans-serif'
    ctx.fillStyle = '#FF6B35'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(this._progress)}%`, barX + barWidth + 12, barY + barHeight / 2)
  }

  private _renderError(ctx: CanvasRenderingContext2D): void {
    const barY = CANVAS_HEIGHT * 0.6 + 40
    ctx.font = '16px sans-serif'
    ctx.fillStyle = '#E53935'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('加载失败，请检查网络后重试', CANVAS_WIDTH / 2, barY)

    // 重试按钮
    const btnX = (CANVAS_WIDTH - 200) / 2
    const btnY = barY + 40
    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    ctx.roundRect(btnX, btnY, 200, 48, 24)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText('重试', CANVAS_WIDTH / 2, btnY + 24)
  }

  private _checkCache(): void {
    const lastLaunch = localStorage.getItem('lastLaunchTimestamp')
    const now = Date.now()

    if (lastLaunch && (now - parseInt(lastLaunch, 10)) < CACHE_DURATION_MS) {
      // 热启动 — 跳到主界面
      this._transitionToMainMenu()
      return
    }

    localStorage.setItem('lastLaunchTimestamp', String(now))
    this._phase = 'loading'
    this._startLoading()
  }

  private _startLoading(): void {
    // 模拟资源加载（实际由 AssetLoader 驱动）
    let loaded = 0
    const totalResources = 7
    const loadInterval = setInterval(() => {
      loaded++
      this._progress = (loaded / totalResources) * 100

      if (loaded >= totalResources) {
        clearInterval(loadInterval)
        setTimeout(() => {
          this._transitionToMainMenu()
        }, 500) // 完成展示时间 500ms
      }
    }, 200)
  }

  private _transitionToMainMenu(): void {
    this._phase = 'done'
    eventBus.emit('loadCompleted')
    // 延迟后导入并切换（避免循环依赖）
    setTimeout(async () => {
      try {
        const { MainMenu } = await import('./MainMenu')
        sceneManager.switchTo(new MainMenu())
      } catch (e) {
        console.error('Failed to load MainMenu:', e)
      }
    }, 400)
  }
}
