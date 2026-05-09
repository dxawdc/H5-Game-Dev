// ShareSystem.ts
// 职责：分享功能管理，支持3种分享场景、微信分享API封装、每日首次分享奖励、冷却控制
// 依赖：GameData, EventBus

import { GameData } from '../core/GameData'
import { eventBus } from '../core/EventBus'

export type ShareScenario = 'mainMenu' | 'victory' | 'defeat'

export interface ShareContent {
  title: string
  imageUrl: string
  query: string
}

const ITEM_IDS = ['extra_step', 'undo', 'reset', 'hint'] as const

export class ShareSystem {
  private _lastShareTime: number = 0
  private readonly COOLDOWN_MS: number = 30000

  /** 获取指定场景的分享文案 */
  shareContentFor(scenario: ShareScenario, params?: Record<string, unknown>): ShareContent {
    switch (scenario) {
      case 'mainMenu':
        return {
          title: '一起来玩围住Boss！超好玩！',
          imageUrl: 'share_main.png',
          query: 'from=main',
        }
      case 'victory': {
        const steps = params?.steps ?? '?'
        const time = params?.time ?? '?'
        return {
          title: `我用了${steps}步、${time}秒围住了Boss！你能挑战我吗？`,
          imageUrl: 'share_victory.png',
          query: 'from=victory',
        }
      }
      case 'defeat':
        return {
          title: 'Boss太强了没围住！求挑战，帮我围住Boss！',
          imageUrl: 'share_defeat.png',
          query: 'from=defeat',
        }
    }
  }

  /** 执行分享 */
  async share(scenario: ShareScenario, params?: Record<string, unknown>): Promise<boolean> {
    const now = Date.now()

    // 冷却检查
    if (now - this._lastShareTime < this.COOLDOWN_MS) {
      console.warn('ShareSystem: 冷却中，请稍后再试')
      eventBus.emit('shareFailed', { reason: 'cooldown' })
      return false
    }

    // 每日上限检查
    if (GameData.dailyShareCount >= 1) {
      console.warn('ShareSystem: 每日分享已达上限')
      eventBus.emit('shareFailed', { reason: 'dailyLimit' })
      return false
    }

    // 获取分享内容
    const content = this.shareContentFor(scenario, params)
    eventBus.emit('shareTriggered', { scenario, content })

    // 检测 WeChat 环境并调用 API
    let shareSuccess = false
    if (typeof wx !== 'undefined') {
      try {
        wx.shareAppMessage({
          title: content.title,
          imageUrl: content.imageUrl,
          query: content.query,
        })
        // 调用分享 API 即视为成功（微信没有标准的回调）
        shareSuccess = true
      } catch (e) {
        console.warn('ShareSystem: 微信分享失败', e)
        eventBus.emit('shareFailed', { reason: 'apiError', error: e })
        return false
      }
    } else {
      // 非微信环境视为成功（模拟）
      shareSuccess = true
    }

    // 更新状态
    this._lastShareTime = now
    GameData.dailyShareCount++
    GameData.saveToLocalStorage()

    // 每日首次分享奖励
    if (shareSuccess && GameData.dailyShareCount === 1) {
      this._grantShareReward()
    }

    eventBus.emit('shareCompleted', { scenario })
    return true
  }

  /** 检查当前是否可以分享 */
  canShare(): boolean {
    const now = Date.now()
    if (now - this._lastShareTime < this.COOLDOWN_MS) return false
    if (GameData.dailyShareCount >= 1) return false
    return true
  }

  /** 检查冷却剩余时间（毫秒） */
  cooldownRemaining(): number {
    const elapsed = Date.now() - this._lastShareTime
    return Math.max(0, this.COOLDOWN_MS - elapsed)
  }

  /** 发放每日首次分享奖励（随机道具） */
  private _grantShareReward(): void {
    const randomId = ITEM_IDS[Math.floor(Math.random() * ITEM_IDS.length)]
    const items = GameData.items as unknown as Record<string, number>
    items[randomId] = (items[randomId] || 0) + 1
    GameData.saveToLocalStorage()
    console.warn(`ShareSystem: 首次分享奖励 -> ${randomId}`)
    eventBus.emit('shareRewardGranted', { itemId: randomId })
  }
}

export const shareSystem = new ShareSystem()
