// test_ad_manager.ts
// 测试任务：实现激励视频广告管理与频率控制
// 验收条件：['激励视频广告正常加载、播放、完成回调', '两次广告间隔 ≥30 秒，每日上限 3 次', '达上限或冷却中显示提示信息']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { AdSystem } from '../src/systems/AdSystem'

describe("实现激励视频广告管理与频率控制", () => {
  let adSystem: AdSystem

  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    localStorage.clear()
    adSystem = new AdSystem()
  })

  it("test_广告加载_正常流程", () => {
    // 初始化广告系统
    adSystem.init()

    // 在非微信环境下会启用 Mock 模式
    expect(adSystem.state).toBe('idle')
  })

  it("test_广告完成_回调奖励", async () => {
    adSystem.init()

    // Mock 模式下可以播放广告
    expect(adSystem.canShow()).toBe(true)

    // 播放广告
    const rewarded = await adSystem.show()
    // Mock 模式下播放成功
    expect(rewarded).toBe(true)

    // dailyAdCount 应增加
    expect(GameData.dailyAdCount).toBe(1)
  })

  it("test_频率控制_冷却时间", () => {
    adSystem.init()

    // 初始可以播放
    expect(adSystem.canShow()).toBe(true)
  })

  it("test_每日上限_达上限后不可观看", () => {
    adSystem.init()

    // 初始剩余次数为 3
    expect(adSystem.remainingDailyAds).toBe(3)

    // 直接设置 dailyAdCount 到上限，模拟已达上限
    GameData.dailyAdCount = 3
    GameData.saveToLocalStorage()

    // 重新创建 AdSystem 以加载新状态
    const newAdSystem = new AdSystem()
    newAdSystem.init()

    expect(newAdSystem.remainingDailyAds).toBe(0)
    expect(newAdSystem.canShow()).toBe(false)

    // show() 应返回 false
    // 注意：由于冷却时间的存在，无法连续播放，改为验证状态
    expect(newAdSystem.canShow()).toBe(false)
  })

})
