// AdSystem.ts
// 职责：激励视频广告管理，封装微信 createRewardedVideoAd API，频率控制，Mock模式
// 依赖：GameData

import { GameData } from '../core/GameData'

export type AdState = 'idle' | 'loading' | 'playing' | 'failed'

const DAILY_LIMIT = 3
const COOLDOWN_MS = 30000

interface AdCloseEvent {
  isEnded?: boolean
}

export class AdSystem {
  private _state: AdState = 'idle'
  private _lastAdTime: number = 0
  private _rewardedVideoAd: unknown = null
  private _mockMode: boolean = false

  constructor() {
    this._checkDailyReset()
  }

  get state(): AdState {
    return this._state
  }

  /** 初始化广告系统 */
  init(): void {
    if (typeof wx !== 'undefined') {
      try {
        this._rewardedVideoAd = wx.createRewardedVideoAd({
          adUnitId: 'adunit-xxxxxxxxxxxx',
        })
        this._mockMode = false

        const ad = this._rewardedVideoAd as { onError: (cb: (err: unknown) => void) => void; onClose: (cb: (res: AdCloseEvent) => void) => void }
        ad.onError((err: unknown) => {
          console.warn('AdSystem: 广告加载错误', err)
          this._state = 'failed'
        })

        ad.onClose((_res: AdCloseEvent) => {
          // 在 show() 方法中通过 Promise 处理
        })
      } catch (e) {
        console.warn('AdSystem: 初始化微信广告失败，启用 Mock 模式', e)
        this._mockMode = true
      }
    } else {
      console.warn('AdSystem: 非微信环境，启用 Mock 模式')
      this._mockMode = true
    }
  }

  /** 检查是否可以播放广告 */
  canShow(): boolean {
    this._checkDailyReset()
    const now = Date.now()
    if (now - this._lastAdTime < COOLDOWN_MS) return false
    if (GameData.dailyAdCount >= DAILY_LIMIT) return false
    return true
  }

  /** 播放广告，返回是否获得奖励 */
  async show(): Promise<boolean> {
    if (!this.canShow()) {
      console.warn('AdSystem: 无法播放广告（冷却或已达上限）')
      return false
    }

    this._state = 'loading'

    if (this._mockMode) {
      return this._mockShow()
    }

    return this._wxShow()
  }

  /** 微信广告播放 */
  private async _wxShow(): Promise<boolean> {
    if (!this._rewardedVideoAd) {
      this._state = 'failed'
      return false
    }

    const ad = this._rewardedVideoAd as {
      show: () => Promise<void> | void
      load: () => Promise<void> | void
      onClose: (cb: (res: AdCloseEvent) => void) => void
    }

    try {
      this._state = 'playing'

      // show() 可能返回 Promise（基础库 2.8.0+）
      const showResult = ad.show()
      if (showResult && typeof showResult.then === 'function') {
        await showResult
      }

      // 等待用户关闭广告并判断是否完整播放
      const result = await new Promise<boolean>((resolve) => {
        let resolved = false

        ad.onClose((res: AdCloseEvent) => {
          if (resolved) return
          resolved = true
          resolve(res && res.isEnded === true)
        })

        // 兜底超时（5秒后如果没有 close 回调，视为失败）
        setTimeout(() => {
          if (!resolved) {
            resolved = true
            resolve(false)
          }
        }, 5000)
      })

      if (result) {
        this._onAdWatched()
        return true
      } else {
        console.warn('AdSystem: 广告未完整播放')
        this._state = 'idle'
        return false
      }
    } catch (e) {
      console.warn('AdSystem: 广告播放失败，尝试重新加载', e)

      try {
        this._state = 'loading'
        const loadResult = ad.load()
        if (loadResult && typeof loadResult.then === 'function') {
          await loadResult
        }

        const showResult2 = ad.show()
        if (showResult2 && typeof showResult2.then === 'function') {
          await showResult2
        }

        const result = await new Promise<boolean>((resolve) => {
          let resolved = false
          ad.onClose((res: AdCloseEvent) => {
            if (resolved) return
            resolved = true
            resolve(res && res.isEnded === true)
          })
          setTimeout(() => {
            if (!resolved) {
              resolved = true
              resolve(false)
            }
          }, 5000)
        })

        if (result) {
          this._onAdWatched()
          return true
        }
        this._state = 'idle'
        return false
      } catch (err) {
        console.warn('AdSystem: 重新加载广告也失败', err)
        this._state = 'failed'
        return false
      }
    }
  }

  /** Mock 模式播放（1秒延时模拟广告） */
  private async _mockShow(): Promise<boolean> {
    try {
      this._state = 'playing'
      await new Promise<void>(resolve => setTimeout(resolve, 1000))
      this._onAdWatched()
      return true
    } catch (e) {
      console.warn('AdSystem: Mock 播放失败', e)
      this._state = 'failed'
      return false
    }
  }

  /** 广告成功播放后的处理 */
  private _onAdWatched(): void {
    this._state = 'idle'
    this._lastAdTime = Date.now()
    GameData.dailyAdCount++
    GameData.saveToLocalStorage()
  }

  /** UTC+8 每日重置检查 */
  private _checkDailyReset(): void {
    try {
      const lastDate = localStorage.getItem('adDailyResetDate')
      const now = new Date()
      const todayUTC8 = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
      if (lastDate !== todayUTC8) {
        GameData.dailyAdCount = 0
        localStorage.setItem('adDailyResetDate', todayUTC8)
        GameData.saveToLocalStorage()
      }
    } catch (e) {
      console.warn('AdSystem: 每日重置检查失败', e)
    }
  }

  /** 获取每日剩余可播放次数 */
  get remainingDailyAds(): number {
    this._checkDailyReset()
    return Math.max(0, DAILY_LIMIT - GameData.dailyAdCount)
  }
}

export const adSystem = new AdSystem()
