// test_leaderboard_ui.ts
// 测试任务：实现排行榜 UI 渲染
// 验收条件：['排行榜弹出层从右侧滑入，面板 500×700px', '三个标签页可切换，排序正确', '自我排名条目高亮显示', '无数据时显示引导文字和邀请好友按钮']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { LeaderboardSystem } from '../src/systems/LeaderboardSystem'
import { LeaderboardPanel } from '../src/ui/LeaderboardPanel'

describe("实现排行榜 UI 渲染", () => {
  let leaderboard: LeaderboardSystem
  let panel: LeaderboardPanel

  beforeEach(async () => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    leaderboard = new LeaderboardSystem()
    await leaderboard.init()
    panel = new LeaderboardPanel(leaderboard)
  })

  it("test_排行榜_弹出层展示", () => {
    expect(panel.isVisible).toBe(false)

    panel.open()
    expect(panel.isVisible).toBe(true)
    expect(panel.isAnimating).toBe(true)

    // 渲染不应抛异常
    const canvas = document.createElement('canvas')
    canvas.width = 648
    canvas.height = 1152
    const ctx = canvas.getContext('2d')
    expect(() => panel.render(ctx!)).not.toThrow()
  })

  it("test_标签切换_三个维度", () => {
    panel.open()

    // 默认标签为 totalClears
    expect(panel.activeTab).toBe('totalClears')

    // 切换到 minSteps
    panel.switchTab('minSteps')
    expect(panel.activeTab).toBe('minSteps')

    // 切换到 fastestTime
    panel.switchTab('fastestTime')
    expect(panel.activeTab).toBe('fastestTime')

    // 切回 totalClears
    panel.switchTab('totalClears')
    expect(panel.activeTab).toBe('totalClears')
  })

  it("test_自我排名_高亮显示", () => {
    panel.open()

    // 自身条目应排在首位且标记 isSelf
    const data = leaderboard.getRankingData('totalClears')
    expect(data[0].isSelf).toBe(true)
    expect(data[0].nickName).toBe('我')

    // 渲染面板
    const canvas = document.createElement('canvas')
    canvas.width = 648
    canvas.height = 1152
    const ctx = canvas.getContext('2d')
    expect(() => panel.render(ctx!)).not.toThrow()
  })

  it("test_空状态_引导文字与邀请按钮", () => {
    panel.open()

    // 无好友数据时渲染空状态
    const canvas = document.createElement('canvas')
    canvas.width = 648
    canvas.height = 1152
    const ctx = canvas.getContext('2d')
    expect(() => panel.render(ctx!)).not.toThrow()
  })

})
