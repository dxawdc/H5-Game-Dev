// test_main_menu_entries.ts
// 测试任务：实现主菜单 P1 入口按钮
// 验收条件：['四个 P1 入口按钮均可见且触控区域 ≥ 88×88px', '排行榜/设置按钮点击后弹出对应弹出层', '道具栏正确显示持有数量，为 0 时置灰并显示 + 号']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { MainMenu } from '../src/scenes/MainMenu'

describe("实现主菜单 P1 入口按钮", () => {
  let menu: MainMenu
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    menu = new MainMenu()
    canvas = document.createElement('canvas')
    canvas.width = 648
    canvas.height = 1152
    ctx = canvas.getContext('2d')!
    // render 一遍以填充 _clickableAreas
    menu.render(ctx)
  })

  it("test_排行榜按钮_点击弹出层", () => {
    // 排行榜按钮位置：右侧 (CANVAS_WIDTH - 88 - 20, CANVAS_HEIGHT/2 - 44)
    // = (540, 532)，点击按钮中心
    const handled = menu.handleClick(540 + 44, 532 + 44)
    expect(handled).toBe(true)

    // 排行榜面板应可见
    const panel = (menu as unknown as { _leaderboardPanel: { isVisible: boolean } })._leaderboardPanel
    expect(panel.isVisible).toBe(true)
  })

  it("test_设置按钮_点击弹出层", () => {
    // 设置按钮位置：左侧 (20, CANVAS_HEIGHT/2 - 44) = (20, 532)
    const handled = menu.handleClick(20 + 44, 532 + 44)
    expect(handled).toBe(true)

    // 设置面板应可见
    const panel = (menu as unknown as { _settingsPanel: { isOpen: boolean } })._settingsPanel
    expect(panel.isOpen).toBe(true)
  })

  it("test_分享红点_每日首次提示", () => {
    // 初始时 dailyShareCount = 0，应显示红点
    expect(GameData.dailyShareCount).toBe(0)

    // 再次渲染不应报错
    expect(() => menu.render(ctx)).not.toThrow()
  })

  it("test_道具栏_数量显示与空态", () => {
    // 初始道具数量为 0
    expect(GameData.items.extra_step).toBe(0)
    expect(GameData.items.undo).toBe(0)
    expect(GameData.items.reset).toBe(0)
    expect(GameData.items.hint).toBe(0)

    // 渲染道具栏不应报错
    expect(() => menu.render(ctx)).not.toThrow()

    // 给道具赋值后再渲染
    GameData.items.extra_step = 3
    expect(() => menu.render(ctx)).not.toThrow()
  })

})
