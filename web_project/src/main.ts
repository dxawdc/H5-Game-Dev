// main.ts
// 职责：游戏入口，初始化 Canvas、事件总线、场景管理器并启动游戏循环
// 依赖：EventBus, SceneManager, GameData

import { eventBus } from './core/EventBus'
import { sceneManager } from './core/SceneManager'
import { GameData } from './core/GameData'

const CANVAS_WIDTH = 648
const CANVAS_HEIGHT = 1152

function initCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null
  if (!canvas) {
    throw new Error('Canvas element #gameCanvas not found')
  }
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  return canvas
}

function fitCanvas(canvas: HTMLCanvasElement): void {
  const scaleX = window.innerWidth / CANVAS_WIDTH
  const scaleY = window.innerHeight / CANVAS_HEIGHT
  const scale = Math.min(scaleX, scaleY)
  canvas.style.width = `${CANVAS_WIDTH * scale}px`
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`
}

function gameLoop(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('Failed to get 2D context')
    return
  }

  let lastTime = performance.now()
  const renderCtx = ctx

  function tick(now: number): void {
    const deltaTime = (now - lastTime) / 1000
    lastTime = now

    renderCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    sceneManager.update(deltaTime)
    sceneManager.render(renderCtx)

    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

function main(): void {
  const canvas = initCanvas()
  fitCanvas(canvas)
  window.addEventListener('resize', () => fitCanvas(canvas))

  GameData.loadFromLocalStorage()

  console.warn('Game initialized - waiting for scene management')
  eventBus.emit('gameStarted')

  gameLoop(canvas)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}
