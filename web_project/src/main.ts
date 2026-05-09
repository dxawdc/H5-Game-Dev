// main.ts
// 职责：游戏入口，初始化 Canvas、场景管理器、EventBus 路由，启动游戏循环
// 依赖：EventBus, SceneManager, GameData, GameState

import { eventBus } from './core/EventBus'
import { sceneManager } from './core/SceneManager'
import { GameData } from './core/GameData'
import { gameState } from './systems/GameState'
import type { GridManager } from './systems/GridManager'
import type { BossAI } from './systems/BossAI'
import { CanvasGrid } from './dom/CanvasGrid'
import { MainMenu } from './scenes/MainMenu'
import { showScreen } from './dom/DOMHelper'

function initCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null
  if (!canvas) throw new Error('Canvas element #gameCanvas not found')
  return canvas
}

function main(): void {
  const canvas = initCanvas()

  // 初始化数据
  GameData.loadFromLocalStorage()
  gameState.loadFromGameData()
  CanvasGrid

  // 初始化 CanvasGrid
  const canvasGrid = new CanvasGrid(canvas)
  ;(gameState as unknown as { _canvasGrid: CanvasGrid })._canvasGrid = canvasGrid

  // 路由：gameStart → 切换到 GameScene
  eventBus.on('gameStart', (...args: unknown[]) => {
    const data = args[0] as { level: number; gridManager: unknown; bossAI: unknown }
    import('./scenes/GameScene').then(({ GameScene }) => {
      const scene = new GameScene(
        data.gridManager as GridManager,
        data.bossAI as BossAI,
        canvasGrid,
        data.level,
      )
      sceneManager.switchTo(scene)
    })
  })

  // 路由：goHome → 切换到 MainMenu
  eventBus.on('goHome', () => {
    import('./scenes/MainMenu').then(({ MainMenu: MM }) => {
      sceneManager.switchTo(new MM())
    })
  })

  // 显示主菜单
  showScreen('home-screen')
  gameState.updateHomeStats()
  sceneManager.push(new MainMenu())

  // 游戏循环
  let lastTime = performance.now()

  function tick(now: number): void {
    const dt = (now - lastTime) / 1000
    lastTime = now
    sceneManager.update(dt)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      sceneManager.render(ctx)
    }
    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)

  console.warn('Game initialized - DOM+Canvas hybrid')
  eventBus.emit('gameStarted')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}
