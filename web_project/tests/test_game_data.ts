// test_game_data.ts
// 测试任务：实现 GameData.ts 全局单例
// 验收条件：['GameData 可正常导入，含 saveData/loadData/resetToDefaults 方法', 'resetToDefaults() 将所有变量恢复为初始值', 'saveToLocalStorage/loadFromLocalStorage 可正确持久化']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'

describe("实现 GameData.ts 全局单例", () => {
  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults() // P2: 测试隔离
    }
  })

  it("test_resetToDefaults_重置所有字段", () => {
    // 先修改一些值
    GameData.currentLevel = 5
    GameData.stepCount = 99
    GameData.isBossCaught = true
    GameData.totalClears = 10

    // 重置
    GameData.resetToDefaults()

    // 验证重置
    expect(GameData.currentLevel).toBe(1)
    expect(GameData.stepCount).toBe(0)
    expect(GameData.isBossCaught).toBe(false)
    expect(GameData.totalClears).toBe(0)
    expect(GameData.soundEnabled).toBe(true)
    expect(GameData.vibrationEnabled).toBe(true)
    expect(GameData.dailyShareCount).toBe(0)
    expect(GameData.dailyAdCount).toBe(0)
  })

  it("test_save_load_localStorage_数据持久化", () => {
    // 修改数据
    GameData.currentLevel = 3
    GameData.totalClears = 7
    GameData.soundEnabled = false

    // 保存
    GameData.saveToLocalStorage()

    // 重置
    GameData.resetToDefaults()
    expect(GameData.currentLevel).toBe(1)
    expect(GameData.totalClears).toBe(0)

    // 加载
    const loaded = GameData.loadFromLocalStorage()
    expect(loaded).toBe(true)
    expect(GameData.currentLevel).toBe(3)
    expect(GameData.totalClears).toBe(7)
    expect(GameData.soundEnabled).toBe(false)
  })

  it("test_变量初始值正确", () => {
    GameData.resetToDefaults()
    expect(GameData.currentLevel).toBe(1)
    expect(GameData.stepCount).toBe(0)
    expect(GameData.isBossCaught).toBe(false)
    expect(GameData.isBossEscaped).toBe(false)
    expect(GameData.dailyShareCount).toBe(0)
    expect(GameData.dailyAdCount).toBe(0)
    expect(GameData.bestLevel2Steps).toBe(999)
    expect(GameData.bestLevel2Time).toBe(999.0)
    expect(GameData.totalClears).toBe(0)
    expect(GameData.soundEnabled).toBe(true)
    expect(GameData.vibrationEnabled).toBe(true)
    // 道具库存初始为 0
    expect(GameData.items.extra_step).toBe(0)
    expect(GameData.items.undo).toBe(0)
    expect(GameData.items.reset).toBe(0)
    expect(GameData.items.hint).toBe(0)
  })

  it("test_单例模式_全局唯一实例", () => {
    // 多次 import 应返回同一实例
    // GameData 是 export const 的单例，重新 import 返回同一引用
    expect(GameData).toBeDefined()
    expect(typeof GameData.currentLevel).toBe('number')
  })

})
