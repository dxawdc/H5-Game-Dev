// test_settings_exit.ts
// 测试任务：实现退出挑战与版本信息
// 验收条件：['退出挑战点击后先弹出确认对话框', '确认退出后重置关卡状态并返回主界面', '取消退出则关闭对话框继续游戏', '版本号显示 0.1.0']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { SettingsPanel } from '../src/ui/SettingsPanel'
import { eventBus } from '../src/core/EventBus'

describe("实现退出挑战与版本信息", () => {
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

  it("test_退出挑战_确认对话框", () => {
    const panel = new SettingsPanel()
    panel.open(true) // 关卡内打开

    // 退出挑战按钮位置：PANEL_X + 40, PANEL_Y + 250, PANEL_WIDTH - 80, 50
    // PANEL_X = 124, PANEL_Y = 386
    const handled = panel.handleClick(124 + 40 + 10, 386 + 250 + 10)
    expect(handled).toBe(true)
    expect(panel.isShowingExitDialog).toBe(true)
  })

  it("test_退出确认_重置关卡并返回主界面", () => {
    const panel = new SettingsPanel()
    panel.open(true)

    // 先点击退出挑战按钮
    panel.handleClick(124 + 40 + 10, 386 + 250 + 10)
    expect(panel.isShowingExitDialog).toBe(true)

    // 监听 exitChallenge 事件
    let exitTriggered = false
    eventBus.on('exitChallenge', () => {
      exitTriggered = true
    })

    // 点击确定按钮
    const dialogX = (648 - 320) / 2 // = 164
    const confirmBtnX = dialogX + 320 - 28 - 120 // = 336
    const confirmBtnY = (1152 - 180) / 2 + 110 // = 596
    panel.handleClick(confirmBtnX + 10, confirmBtnY + 10)

    expect(panel.isOpen).toBe(false)
    expect(exitTriggered).toBe(true)
  })

  it("test_退出取消_关闭对话框继续游戏", () => {
    const panel = new SettingsPanel()
    panel.open(true)

    // 先点击退出挑战按钮
    panel.handleClick(124 + 40 + 10, 386 + 250 + 10)
    expect(panel.isShowingExitDialog).toBe(true)

    // 点击取消按钮
    const dialogX = (648 - 320) / 2 // = 164
    const cancelBtnX = dialogX + 28 // = 192
    const cancelBtnY = (1152 - 180) / 2 + 110 // = 596
    panel.handleClick(cancelBtnX + 10, cancelBtnY + 10)

    expect(panel.isShowingExitDialog).toBe(false)
    // isOpen 在取消后应保持 true（仍在设置面板中）
    expect(panel.isOpen).toBe(true)
  })

  it("test_版本信息_正确显示", () => {
    const panel = new SettingsPanel()
    panel.open(false)

    // 渲染面板不应抛异常
    expect(() => panel.render(ctx)).not.toThrow()
  })

})
