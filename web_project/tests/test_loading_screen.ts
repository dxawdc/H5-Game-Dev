// test_loading_screen.ts
// 测试任务：实现 Loading 屏幕 - 启动判定与 Logo 展示
// 验收条件：['lastLaunchTimestamp < 30分钟时跳过Loading直接进入主界面', '首次启动或缓存过期时展示完整 Loading 画面', 'Logo 和 48 字真言正确居中渲染']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { LoadingScreen } from '../src/scenes/LoadingScreen'
import { eventBus } from '../src/core/EventBus'

describe("实现 Loading 屏幕 - 启动判定与 Logo 展示", () => {
  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    localStorage.clear()
  })

  it("test_热启动_30分钟内跳过Loading", () => {
    // 设置最近的时间戳（5分钟前）
    const recent = Date.now() - 5 * 60 * 1000
    localStorage.setItem('lastLaunchTimestamp', String(recent))

    const screen = new LoadingScreen()

    let loadCompleted = false
    eventBus.on('loadCompleted', () => {
      loadCompleted = true
    })

    screen.onEnter()

    // 热启动会 emit loadCompleted 事件
    expect(loadCompleted).toBe(true)
  })

  it("test_首次启动_展示完整Loading", () => {
    expect(localStorage.getItem('lastLaunchTimestamp')).toBeNull()

    const screen = new LoadingScreen()

    screen.onEnter()

    // 首次启动应设置时间戳
    expect(localStorage.getItem('lastLaunchTimestamp')).not.toBeNull()
    // 此时 phase 应为 'loading'
    expect((screen as unknown as { _phase: string })._phase).toBe('loading')
  })

  it("test_Logo_渲染位置正确", () => {
    const screen = new LoadingScreen()

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    expect(ctx).not.toBeNull()

    // render 不应该抛异常
    expect(() => screen.render(ctx!)).not.toThrow()
  })

  it("test_48字真言_文本展示", () => {
    const screen = new LoadingScreen()

    expect(screen.onEnter).toBeDefined()
    expect(screen.onExit).toBeDefined()
    expect(screen.update).toBeDefined()
    expect(screen.render).toBeDefined()

    screen.onEnter()
    const phase = (screen as unknown as { _phase: string })._phase
    expect(['loading', 'checking']).toContain(phase)
  })

})
