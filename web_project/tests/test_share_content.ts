// test_share_content.ts
// 测试任务：实现分享系统入口调度与内容生成
// 验收条件：['三个分享场景各自独立的文案和配置', '主菜单分享调用道具系统发放奖励', '胜利/失败分享关联不同的后续行为']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { ShareSystem } from '../src/systems/ShareSystem'

describe("实现分享系统入口调度与内容生成", () => {
  let shareSystem: ShareSystem

  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    shareSystem = new ShareSystem()
  })

  it("test_主菜单分享_配置正确", () => {
    const content = shareSystem.shareContentFor('mainMenu')
    expect(content.title).toBe('一起来玩围住Boss！超好玩！')
    expect(content.imageUrl).toBe('share_main.png')
    expect(content.query).toBe('from=main')
  })

  it("test_胜利分享_炫耀文案", () => {
    const content = shareSystem.shareContentFor('victory', { steps: 15, time: 45.2 })
    expect(content.title).toContain('15步')
    expect(content.title).toContain('45.2秒')
    expect(content.query).toBe('from=victory')
    expect(content.imageUrl).toBe('share_victory.png')
  })

  it("test_失败分享_再战文案", () => {
    const content = shareSystem.shareContentFor('defeat')
    expect(content.title).toContain('Boss太强了')
    expect(content.title).toContain('求挑战')
    expect(content.query).toBe('from=defeat')
    expect(content.imageUrl).toBe('share_defeat.png')
  })

})
