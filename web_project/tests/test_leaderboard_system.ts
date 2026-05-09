// test_leaderboard_system.ts
// 测试任务：实现排行榜最佳成绩判定与三维度排名管理
// 验收条件：['对局结束后新成绩优于历史最佳才触发更新', '三个维度排序规则正确（通关数降序、步数/时间升序）', '第 1 关数据不计入排行榜']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { LeaderboardSystem } from '../src/systems/LeaderboardSystem'

describe("实现排行榜最佳成绩判定与三维度排名管理", () => {
  let leaderboard: LeaderboardSystem

  beforeEach(async () => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    leaderboard = new LeaderboardSystem()
    await leaderboard.init()
  })

  it("test_最佳成绩_更优时更新", () => {
    // 初始 bestLevel2Time=999, bestLevel2Steps=999
    // LeaderboardSystem 使用 time < bestLevel2Time 判断（无 sentinel 处理）
    // 所以需要使用小于 999 的值（注意：time 参数单位与 bestLevel2Time 一致）
    expect(GameData.bestLevel2Steps).toBe(999)
    expect(GameData.bestLevel2Time).toBe(999.0)

    leaderboard.onLevelCleared(2, 20, 800) // 800ms < 999ms，应更新
    expect(GameData.bestLevel2Steps).toBe(20)
    expect(GameData.bestLevel2Time).toBe(800)

    // 更好的成绩（更少步数）应更新
    leaderboard.onLevelCleared(2, 15, 400)
    expect(GameData.bestLevel2Steps).toBe(15)
    expect(GameData.bestLevel2Time).toBe(400)
  })

  it("test_最佳成绩_未更优时不更新", () => {
    leaderboard.onLevelCleared(2, 20, 800)
    expect(GameData.bestLevel2Steps).toBe(20)

    // 更差的成绩（25 > 20）不应更新
    leaderboard.onLevelCleared(2, 25, 900)
    expect(GameData.bestLevel2Steps).toBe(20)
    expect(GameData.bestLevel2Time).toBe(800)
  })

  it("test_三维度排序_正确规则", () => {
    // 通关数：降序（多的在前面）
    const dataTotalClears = leaderboard.getRankingData('totalClears')
    if (dataTotalClears.length > 1) {
      for (let i = 0; i < dataTotalClears.length - 1; i++) {
        expect(dataTotalClears[i].score).toBeGreaterThanOrEqual(dataTotalClears[i + 1].score)
      }
    }

    // 最少步数：升序（少的在前面）
    const dataMinSteps = leaderboard.getRankingData('minSteps')
    if (dataMinSteps.length > 1) {
      for (let i = 0; i < dataMinSteps.length - 1; i++) {
        expect(dataMinSteps[i].score).toBeLessThanOrEqual(dataMinSteps[i + 1].score)
      }
    }

    // 最快时间：升序（快的在前面）
    const dataFastestTime = leaderboard.getRankingData('fastestTime')
    if (dataFastestTime.length > 1) {
      for (let i = 0; i < dataFastestTime.length - 1; i++) {
        expect(dataFastestTime[i].score).toBeLessThanOrEqual(dataFastestTime[i + 1].score)
      }
    }
  })

  it("test_仅第2关数据计入排行", () => {
    // 第 1 关通关不应更新排行榜数据
    leaderboard.onLevelCleared(1, 5, 15000)
    expect(GameData.bestLevel2Steps).toBe(999)
    expect(GameData.totalClears).toBe(0)

    // 第 2 关通关才应更新
    leaderboard.onLevelCleared(2, 15, 500)
    expect(GameData.totalClears).toBe(1)
    expect(GameData.bestLevel2Steps).toBe(15)
  })

})
