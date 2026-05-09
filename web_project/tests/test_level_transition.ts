// test_level_transition.ts
// 测试任务：实现关卡切换与进度持久化

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { LevelTransitionController } from '../src/systems/LevelTransitionController'

describe('LevelTransitionController', () => {
  beforeEach(() => {
    GameData.resetToDefaults()
  })

  it('第1关通关后切换到第2关', () => {
    LevelTransitionController.onLevelCleared(1, 5, 30000)
    expect(GameData.currentLevel).toBe(2)
    expect(GameData.totalClears).toBe(1)
  })

  it('第2关通关更新最佳步数', () => {
    LevelTransitionController.onLevelCleared(2, 10, 45000)
    expect(GameData.bestLevel2Steps).toBe(10)
    expect(GameData.bestLevel2Time).toBe(45000)
  })

  it('第2关最佳成绩仅保留最优', () => {
    LevelTransitionController.onLevelCleared(2, 15, 60000)
    expect(GameData.bestLevel2Steps).toBe(15)

    // 更差的成绩不应更新
    LevelTransitionController.onLevelCleared(2, 20, 70000)
    expect(GameData.bestLevel2Steps).toBe(15)

    // 更好的成绩应更新
    LevelTransitionController.onLevelCleared(2, 8, 30000)
    expect(GameData.bestLevel2Steps).toBe(8)
    expect(GameData.bestLevel2Time).toBe(30000)
  })

  it('restartLevel重置当前关卡', () => {
    LevelTransitionController.restartLevel(2)
    expect(GameData.currentLevel).toBe(2)
  })

  it('returnToMenu返回主界面', () => {
    GameData.currentLevel = 2
    LevelTransitionController.returnToMenu()
    expect(GameData.currentLevel).toBe(1)
  })

  it('getBestRecord返回正确记录', () => {
    LevelTransitionController.onLevelCleared(2, 12, 50000)
    const record = LevelTransitionController.getBestRecord()
    expect(record.steps).toBe(12)
    expect(record.time).toBe(50000)
  })
})
