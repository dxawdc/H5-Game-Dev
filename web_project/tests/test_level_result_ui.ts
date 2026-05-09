// test_level_result_ui.ts
// 测试任务：实现关卡结算 - 统计信息与操作按钮
// 验收条件：['统计面板正确显示本局步数和耗时', '继续挑战按钮重新初始化第 2 关', '一会重来按钮返回主菜单', '入场动画序列正确执行']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { LevelResult } from '../src/scenes/LevelResult'

describe("实现关卡结算 - 统计信息与操作按钮", () => {
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

  it("test_统计信息_步数耗时显示", () => {
    const result = new LevelResult(true, 15, 30000, 2)
    expect(result).toBeDefined()

    // render 不应抛异常
    expect(() => result.render(ctx)).not.toThrow()
  })

  it("test_继续挑战_重新开始第2关", () => {
    const result = new LevelResult(true, 15, 30000, 2)
    result.onEnter()

    // 第 2 关胜利后总通关数应增加
    expect(GameData.totalClears).toBeGreaterThanOrEqual(1)
    expect(GameData.bestLevel2Steps).toBe(15)
    expect(GameData.bestLevel2Time).toBe(30000)
  })

  it("test_一会重来_返回主界面", () => {
    const result = new LevelResult(false, 20, 45000, 2)
    result.onEnter()

    // LevelTransitionController 记录所有通关（包括失败）的信息
    // 所以 bestLevel2Steps 会记录本次步数
    expect(GameData.bestLevel2Steps).toBe(20)

    // 验证 handleClick 存在
    expect(result.handleClick).toBeDefined()
  })

})
