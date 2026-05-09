// test_level_manager.ts
// 测试任务：实现关卡配置加载器与解锁管理器
// 验收条件：['LevelConfigLoader 正确读取并解析 levels.json', '按关卡 ID 查询返回完整配置参数', '第 1 关默认 unlocked，第 2 关默认 locked']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { LevelManager } from '../src/systems/LevelManager'

describe("实现关卡配置加载器与解锁管理器", () => {
  let levelManager: LevelManager

  beforeEach(async () => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    levelManager = new LevelManager()
    await levelManager.load()
  })

  it("test_加载_levels_json_配置正确", () => {
    expect(levelManager.loaded).toBe(true)
    const allLevels = levelManager.getAllLevels()
    expect(allLevels).toHaveLength(2)
  })

  it("test_按ID查询关卡参数", () => {
    const level1 = levelManager.getLevel(1)
    expect(level1).toBeDefined()
    expect(level1!.id).toBe(1)
    expect(level1!.name).toBe('初识Boss')
    expect(level1!.gridSize).toBe(7)
    expect(level1!.bossStart).toEqual({ x: 3, y: 3 })
    expect(level1!.maxSteps).toBe(99)
    expect(level1!.unlockCondition).toBeNull()

    const level2 = levelManager.getLevel(2)
    expect(level2).toBeDefined()
    expect(level2!.id).toBe(2)
    expect(level2!.name).toBe('全力围堵')
    expect(level2!.gridSize).toBe(9)
    expect(level2!.bossStart).toEqual({ x: 4, y: 4 })
    expect(level2!.maxSteps).toBe(30)
    expect(level2!.unlockCondition).toBe('level_1_cleared')
  })

  it("test_第1关初始为解锁状态", () => {
    // 第 1 关 unlockCondition 为 null，应默认解锁
    expect(levelManager.isUnlocked(1)).toBe(true)
    expect(levelManager.getLevelStatus(1)).toBe('unlocked')
  })

  it("test_第2关初始为锁定状态", () => {
    // 第 2 关需要 level_1_cleared，初始 totalClears = 0
    expect(levelManager.isUnlocked(2)).toBe(false)
    expect(levelManager.getLevelStatus(2)).toBe('locked')
  })

})
