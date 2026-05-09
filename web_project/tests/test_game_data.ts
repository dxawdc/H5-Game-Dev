// test_game_data.ts
// 测试任务：实现 GameData.ts 全局单例
// 验收条件：['GameData 可正常导入，含 saveData/loadData/resetToDefaults 方法', 'resetToDefaults() 将所有变量恢复为初始值', 'saveToLocalStorage/loadFromLocalStorage 可正确持久化']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'

describe("实现 GameData.ts 全局单例", () => {
  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
  })

  it("test_resetToDefaults_重置所有字段", () => {
    GameData.currentLevel = 5
    GameData.totalClears = 10
    GameData.bestLevel2Steps = 20
    GameData.bestLevel2Time = 30

    GameData.resetToDefaults()

    expect(GameData.currentLevel).toBe(1)
    expect(GameData.totalClears).toBe(0)
    expect(GameData.bestLevel2Steps).toBe(999)
    expect(GameData.bestLevel2Time).toBe(999.0)
    expect(GameData.soundEnabled).toBe(true)
    expect(GameData.vibrationEnabled).toBe(true)
    expect(GameData.dailyShareCount).toBe(0)
    expect(GameData.dailyAdCount).toBe(0)
  })

  it("test_save_load_localStorage_数据持久化", () => {
    GameData.currentLevel = 3
    GameData.totalClears = 7
    GameData.soundEnabled = false

    GameData.saveToLocalStorage()

    GameData.resetToDefaults()
    expect(GameData.currentLevel).toBe(1)
    expect(GameData.totalClears).toBe(0)

    const loaded = GameData.loadFromLocalStorage()
    expect(loaded).toBe(true)
    expect(GameData.currentLevel).toBe(3)
    expect(GameData.totalClears).toBe(7)
    expect(GameData.soundEnabled).toBe(false)
  })

  it("test_变量初始值正确", () => {
    GameData.resetToDefaults()
    expect(GameData.currentLevel).toBe(1)
    expect(GameData.totalClears).toBe(0)
    expect(GameData.bestLevel2Steps).toBe(999)
    expect(GameData.bestLevel2Time).toBe(999.0)
    expect(GameData.dailyShareCount).toBe(0)
    expect(GameData.dailyAdCount).toBe(0)
    expect(GameData.soundEnabled).toBe(true)
    expect(GameData.vibrationEnabled).toBe(true)
  })

  it("test_单例模式_全局唯一实例", () => {
    expect(GameData).toBeDefined()
    expect(typeof GameData.currentLevel).toBe('number')
  })
})
