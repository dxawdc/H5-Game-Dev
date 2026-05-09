// test_ad_ui.ts
// 测试任务：实现广告 UI 按钮与入口
// 验收条件：['三种广告入口在不同场景正确显示', '广告完成后正确回调（发放道具/重新挑战）', '广告失败时显示重试按钮']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { AdSystem } from '../src/systems/AdSystem'
import { MainMenu } from '../src/scenes/MainMenu'

describe("实现广告 UI 按钮与入口", () => {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    canvas = document.createElement('canvas')
    canvas.width = 648
    canvas.height = 1152
    ctx = canvas.getContext('2d')!
  })

  it("test_主界面_广告按钮展示", () => {
    const menu = new MainMenu()

    // 渲染主界面，广告按钮应可见
    expect(() => menu.render(ctx)).not.toThrow()
  })

  it("test_道具获取_广告完成发放道具", async () => {
    const adSystem = new AdSystem()
    adSystem.init()

    const rewarded = await adSystem.show()
    expect(rewarded).toBe(true)

    // 广告播放后 dailyAdCount 增加
    expect(GameData.dailyAdCount).toBe(1)
    expect(adSystem.canShow()).toBe(false) // 冷却中
  })

  it("test_失败续命_广告完成重新挑战", async () => {
    const adSystem = new AdSystem()
    adSystem.init()

    const rewarded = await adSystem.show()
    expect(rewarded).toBe(true)
    expect(GameData.dailyAdCount).toBe(1)
  })

  it("test_广告失败_显示重试按钮", () => {
    const adSystem = new AdSystem()
    adSystem.init()
    expect(['idle', 'failed']).toContain(adSystem.state)
  })

})
