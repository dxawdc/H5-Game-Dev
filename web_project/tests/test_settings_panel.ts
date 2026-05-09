// test_settings_panel.ts
// 测试任务：实现设置面板与音效震动开关
// 验收条件：['音效/震动开关可切换，状态持久化到 localStorage', '音效开关变更即刻同步到音频系统', '震动开关关闭后 wx.vibrateShort 不会被调用']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { SettingsPanel } from '../src/ui/SettingsPanel'

describe("实现设置面板与音效震动开关", () => {
  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    localStorage.clear()
  })

  it("test_音效开关_切换与持久化", () => {
    const panel = new SettingsPanel()
    panel.open(false)

    expect(panel.isOpen).toBe(true)

    // 初始音效为 true
    expect(GameData.soundEnabled).toBe(true)

    // 模拟点击音效开关区域
    // 开关位置在 PANEL_X + 220, PANEL_Y + 100, 60x32
    // PANEL_X = 124, PANEL_Y = 386
    const handled = panel.handleClick(124 + 220 + 10, 386 + 100 + 10)
    expect(handled).toBe(true)

    // 音效应变为 false
    expect(GameData.soundEnabled).toBe(false)
    expect(localStorage.getItem('SurroundTheBoss_GameData')).not.toBeNull()

    panel.close()
    expect(panel.isOpen).toBe(false)
  })

  it("test_震动开关_切换与持久化", () => {
    const panel = new SettingsPanel()
    panel.open(false)

    // 初始震动为 true
    expect(GameData.vibrationEnabled).toBe(true)

    // 模拟点击震动开关区域
    // PANEL_X = 124, PANEL_Y = 386
    const handled = panel.handleClick(124 + 220 + 10, 386 + 170 + 10)
    expect(handled).toBe(true)

    // 震动应变为 false
    expect(GameData.vibrationEnabled).toBe(false)
  })

  it("test_设置面板_主界面与关卡内均可打开", () => {
    const panel = new SettingsPanel()

    // 主界面打开（isInGame = false）
    panel.open(false)
    expect(panel.isOpen).toBe(true)

    // 面板渲染
    const canvas = document.createElement('canvas')
    canvas.width = 648
    canvas.height = 1152
    const ctx = canvas.getContext('2d')
    expect(() => panel.render(ctx!)).not.toThrow()

    panel.close()

    // 关卡内打开（isInGame = true）
    panel.open(true)
    expect(panel.isOpen).toBe(true)
    expect(() => panel.render(ctx!)).not.toThrow()
  })

})
