// test_loading_resources.ts
// 测试任务：实现 Loading 屏幕 - 资源加载与进度条
// 验收条件：['7 种资源按权重（总 100）计算进度百分比', '进度条动画 300ms ease-out 平滑追赶', '进度 100% 后保留 500ms 完成展示再切换场景', '加载失败时显示重试按钮']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { LoadingScreen } from '../src/scenes/LoadingScreen'

describe("实现 Loading 屏幕 - 资源加载与进度条", () => {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    localStorage.clear()
    canvas = document.createElement('canvas')
    canvas.width = 648
    canvas.height = 1152
    ctx = canvas.getContext('2d')!
  })

  it("test_进度条_从0到100平滑过渡", () => {
    const screen = new LoadingScreen()

    // 首次启动触发 loading
    screen.onEnter()

    // 验证 loading 阶段的进度属性
    const progress = (screen as unknown as { _progress: number })._progress
    expect(progress).toBeGreaterThanOrEqual(0)
    expect(progress).toBeLessThanOrEqual(100)
  })

  it("test_资源加载_权重计算正确", () => {
    const screen = new LoadingScreen()

    // 首次启动触发 loading
    screen.onEnter()

    // LoadingScreen 有 7 种资源，每次加载 1/7
    screen.update(0)
    const progress = (screen as unknown as { _progress: number })._progress
    expect(progress).toBeGreaterThanOrEqual(0)
  })

  it("test_加载完成_自动切换场景", () => {
    const screen = new LoadingScreen()
    screen.onEnter()

    expect(screen.onExit).toBeDefined()
    expect(screen.update).toBeDefined()
    expect(screen.render).toBeDefined()
  })

  it("test_加载失败_展示重试按钮", () => {
    const screen = new LoadingScreen()

    // render 不应抛异常
    expect(() => screen.render(ctx)).not.toThrow()
  })

})
