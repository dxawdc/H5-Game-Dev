// test_main_menu.ts
// 测试任务：实现主菜单界面（DOM 驱动）
// 验收条件：['MainMenu 实现 Scene 接口', 'onEnter/onExit 可正常调用', 'render 不抛异常']

import { describe, it, expect } from 'vitest'
import { MainMenu } from '../src/scenes/MainMenu'

describe("实现主菜单界面 (DOM 驱动)", () => {
  it("test_Scene_接口完整", () => {
    const menu = new MainMenu()
    expect(menu.onEnter).toBeDefined()
    expect(menu.onExit).toBeDefined()
    expect(menu.update).toBeDefined()
    expect(menu.render).toBeDefined()
    expect(menu.handleClick).toBeDefined()
  })

  it("test_render_不抛异常", () => {
    const menu = new MainMenu()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    expect(() => menu.render(ctx)).not.toThrow()
  })

  it("test_update_不抛异常", () => {
    const menu = new MainMenu()
    expect(() => menu.update(16)).not.toThrow()
  })

  it("test_handleClick_返回false_无操作", () => {
    const menu = new MainMenu()
    expect(menu.handleClick(0, 0)).toBe(false)
  })
})
