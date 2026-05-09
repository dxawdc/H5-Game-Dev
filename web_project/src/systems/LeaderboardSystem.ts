// LeaderboardSystem.ts
// 职责：管理排行榜数据，支持3个维度排序、微信好友积分上传和拉取、本地Mock模式
// 依赖：GameData, EventBus

import { GameData } from '../core/GameData'
import { eventBus } from '../core/EventBus'

export interface RankingEntry {
  nickName: string
  score: number
  isSelf: boolean
}

export type RankingDimension = 'totalClears' | 'minSteps' | 'fastestTime'

interface FriendRecord {
  nickName: string
  avatarUrl: string
  totalClears: number
  minSteps: number
  fastestTime: number
}

const CACHE_KEY = 'leaderboard_friend_cache'

export class LeaderboardSystem {
  private _friendData: Map<string, FriendRecord> = new Map()
  private _selfNickName: string = '我'
  private _initialized: boolean = false

  /** 初始化排行榜，加载缓存并拉取好友数据 */
  async init(): Promise<void> {
    if (this._initialized) return

    this._loadCache()

    if (typeof wx !== 'undefined') {
      await this._fetchFriendDataWithRetry()
    }

    this._initialized = true
  }

  /** 关卡通关回调，仅记录 Level 2 数据 */
  async onLevelCleared(level: number, steps: number, time: number): Promise<void> {
    if (level !== 2) return

    let updated = false

    // totalClears: 累计通关数
    GameData.totalClears += 1
    updated = true

    // bestLevel2Steps: 最少步数
    if (steps < GameData.bestLevel2Steps) {
      GameData.bestLevel2Steps = steps
      updated = true
    }

    // bestLevel2Time: 最快时间
    if (time < GameData.bestLevel2Time) {
      GameData.bestLevel2Time = time
      updated = true
    }

    if (updated) {
      GameData.saveToLocalStorage()
      await this._uploadScoreWithRetry()
    }

    eventBus.emit('leaderboardUpdated', this.getRankingData('totalClears'))
  }

  /** 获取指定维度的排行榜数据 */
  getRankingData(dimension: RankingDimension): RankingEntry[] {
    const entries: RankingEntry[] = []

    // 添加自己
    let selfScore: number
    switch (dimension) {
      case 'totalClears':
        selfScore = GameData.totalClears
        break
      case 'minSteps':
        selfScore = GameData.bestLevel2Steps >= 999 ? 999 : GameData.bestLevel2Steps
        break
      case 'fastestTime':
        selfScore = GameData.bestLevel2Time >= 999 ? 999 : GameData.bestLevel2Time
        break
    }
    entries.push({ nickName: this._selfNickName, score: selfScore, isSelf: true })

    // 添加好友数据
    this._friendData.forEach(fd => {
      let score: number
      switch (dimension) {
        case 'totalClears':
          score = fd.totalClears
          break
        case 'minSteps':
          score = fd.minSteps
          break
        case 'fastestTime':
          score = fd.fastestTime
          break
      }
      entries.push({ nickName: fd.nickName, score, isSelf: false })
    })

    // 排序：通关数降序，步数和时间升序
    if (dimension === 'totalClears') {
      entries.sort((a, b) => b.score - a.score)
    } else {
      entries.sort((a, b) => a.score - b.score)
    }

    return entries
  }

  /** 获取当前显示的昵称 */
  get selfNickName(): string {
    return this._selfNickName
  }

  /** 设置玩家昵称（可由外部通过微信信息设置） */
  set selfNickName(v: string) {
    this._selfNickName = v
  }

  // -------- 微信积分上传（最多重试3次） --------

  private async _uploadScoreWithRetry(): Promise<void> {
    if (typeof wx === 'undefined') return

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this._uploadScore()
        return
      } catch (e) {
        console.warn(`LeaderboardSystem: 上传积分失败 (${attempt + 1}/3)`, e)
        if (attempt < 2) {
          await this._delay(1000)
        }
      }
    }
  }

  private _uploadScore(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        wx.setFriendCloudStorage({
          KVDataList: [
            { key: 'totalClears', value: String(GameData.totalClears) },
            { key: 'minSteps', value: String(Math.min(GameData.bestLevel2Steps, 999)) },
            { key: 'fastestTime', value: String(GameData.bestLevel2Time.toFixed(1)) },
          ],
          success: () => resolve(),
          fail: (err: unknown) => reject(err),
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  // -------- 微信好友数据拉取（最多重试3次） --------

  private async _fetchFriendDataWithRetry(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this._fetchFriendData()
        this._saveCache()
        return
      } catch (e) {
        console.warn(`LeaderboardSystem: 拉取好友数据失败 (${attempt + 1}/3)`, e)
        if (attempt < 2) {
          await this._delay(1000)
        }
      }
    }
  }

  private _fetchFriendData(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        wx.getFriendCloudStorage({
          keyList: ['totalClears', 'minSteps', 'fastestTime'],
          success: (res: unknown) => {
            const records = this._parseFriendResponse(res)
            this._friendData.clear()
            records.forEach(r => this._friendData.set(r.nickName, r))
            resolve()
          },
          fail: (err: unknown) => reject(err),
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  private _parseFriendResponse(res: unknown): FriendRecord[] {
    try {
      const resp = res as { data: Array<{
        nickname: string
        avatarUrl: string
        KVDataList: Array<{ key: string; value: string }>
      }> }
      if (!resp || !Array.isArray(resp.data)) return []

      return resp.data.map(item => {
        const kvMap: Record<string, string> = {}
        if (Array.isArray(item.KVDataList)) {
          item.KVDataList.forEach(kv => { kvMap[kv.key] = kv.value })
        }
        return {
          nickName: item.nickname || '好友',
          avatarUrl: item.avatarUrl || '',
          totalClears: parseInt(kvMap['totalClears'] || '0', 10) || 0,
          minSteps: parseInt(kvMap['minSteps'] || '999', 10) || 999,
          fastestTime: parseFloat(kvMap['fastestTime'] || '999') || 999,
        }
      })
    } catch (e) {
      console.warn('LeaderboardSystem: 解析好友数据失败', e)
      return []
    }
  }

  // -------- 缓存 --------

  private _loadCache(): void {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as FriendRecord[]
      if (!Array.isArray(parsed)) return
      parsed.forEach(fd => this._friendData.set(fd.nickName, fd))
    } catch (e) {
      console.warn('LeaderboardSystem: 加载缓存失败', e)
    }
  }

  private _saveCache(): void {
    try {
      const data = Array.from(this._friendData.values())
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('LeaderboardSystem: 保存缓存失败', e)
    }
  }

  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const leaderboardSystem = new LeaderboardSystem()
