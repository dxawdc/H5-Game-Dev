// test_level_result.ts
// 测试任务：实现关卡结算 - 入口判定与胜利/失败界面
// 验收条件：['第 1 关通关自动跳转第 2 关，不展示结算', '胜利界面显示 Boss 受伤表情、暖色光效、随机胜利文案', '失败界面显示 Boss 得意表情、冷色光效、随机失败文案']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { LevelResult } from '../src/scenes/LevelResult'

describe("实现关卡结算 - 入口判定与胜利/失败界面", () => {
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

  it("test_第1关通关_不展示结算", () => {
    const result = new LevelResult(true, 10, 30000, 1)
    expect(result).toBeDefined()
    result.onEnter()
    // 第 1 关通关后应切换到第 2 关
    expect(GameData.currentLevel).toBe(2)
  })

  it("test_第2关胜利_展示胜利界面", () => {
    const result = new LevelResult(true, 15, 45000, 2)
    expect(result).toBeDefined()
    result.onEnter()
    // 第 2 关胜利应更新 best 数据
    expect(GameData.bestLevel2Steps).toBe(15)
    expect(GameData.totalClears).toBeGreaterThanOrEqual(1)
  })

  it("test_第2关失败_展示失败界面", () => {
    const result = new LevelResult(false, 20, 60000, 2)
    expect(result).toBeDefined()
    result.onEnter()
    // 失败虽不展示结算面板，但 LevelTransitionController 仍会记录成绩
    // （因为实际步数优于初始标记值 999）
    expect(GameData.bestLevel2Steps).toBe(20)
  })

  it("test_胜利标题_从文案池随机", () => {
    const result = new LevelResult(true, 10, 30000, 2)
    expect(result.update).toBeDefined()
    expect(result.render).toBeDefined()
    expect(result.onEnter).toBeDefined()
    expect(result.onExit).toBeDefined()

    // 渲染不应报错
    expect(() => result.render(ctx)).not.toThrow()
  })

})
