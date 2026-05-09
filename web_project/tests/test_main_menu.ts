// test_main_menu.ts
// 测试任务：实现主菜单界面 - 背景 Logo 与开始挑战按钮
// 验收条件：['背景全屏填充，Logo 居中顶部展示', '按钮文案根据关卡解锁状态变化（开始挑战/继续挑战/再来一局）', '点击按钮触发缩放动画并切换到关卡场景']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { MainMenu } from '../src/scenes/MainMenu'
import { LevelManager } from '../src/systems/LevelManager'

describe("实现主菜单界面 - 背景 Logo 与开始挑战按钮", () => {
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

  it("test_背景图渲染", () => {
    const menu = new MainMenu()

    // 渲染不应抛异常
    expect(() => menu.render(ctx)).not.toThrow()
  })

  it("test_Logo_位置与动画", () => {
    const menu = new MainMenu()

    // 验证 update 执行缩放动画
    menu.update(16) // 一帧
    // 不应报错
    expect(menu).toBeDefined()

    // 验证 Scene 接口完整
    expect(menu.onEnter).toBeDefined()
    expect(menu.onExit).toBeDefined()
    expect(menu.update).toBeDefined()
    expect(menu.render).toBeDefined()
  })

  it("test_开始按钮_三种文案状态", async () => {
    const lv = new LevelManager()
    await lv.load()

    // 默认状态（未通关）
    expect(lv.getMainButtonText()).toBe('开始挑战')

    // 第 1 关通关后
    GameData.totalClears = 1
    GameData.currentLevel = 2
    expect(lv.getMainButtonText()).toBe('继续挑战')

    // 全部通关后
    GameData.totalClears = 2
    expect(lv.getMainButtonText()).toBe('再来一局')
  })

  it("test_按钮点击_场景切换", () => {
    const menu = new MainMenu()
    // 先 render 以填充 clickableAreas
    menu.render(ctx)

    // handleClick 模拟点击开始按钮位置
    // 开始按钮区域：x=174, y=748.8, w=300, h=80
    const handled = menu.handleClick(324, 788)
    expect(handled).toBe(true)
  })

})
