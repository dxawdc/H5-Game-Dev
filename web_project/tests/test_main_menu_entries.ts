// test_main_menu_entries.ts
// 测试任务：实现主菜单入口按钮（DOM 驱动）
// 验收条件：['MainMenu 实现 Scene 接口', 'DOM 按钮绑定正确']

import { describe, it, expect } from 'vitest'
import { MainMenu } from '../src/scenes/MainMenu'

describe("实现主菜单入口按钮 (DOM 驱动)", () => {
  it("test_Scene_接口完整", () => {
    const menu = new MainMenu()
    expect(menu.onEnter).toBeDefined()
    expect(menu.onExit).toBeDefined()
    expect(menu.update).toBeDefined()
    expect(menu.render).toBeDefined()
  })

  it("test_render_不抛异常", () => {
    const menu = new MainMenu()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    expect(() => menu.render(ctx)).not.toThrow()
  })
})
