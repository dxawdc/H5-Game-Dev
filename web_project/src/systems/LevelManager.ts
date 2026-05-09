// LevelManager.ts
// 职责：关卡配置加载与解锁管理，从 levels.json 读取关卡数据
// 依赖：GameData

import { GameData } from '../core/GameData'
import type { Point } from './GridManager'

interface LevelConfig {
  id: number
  name: string
  description: string
  gridSize: number
  bossStart: Point
  exits: string
  initialObstacles: {
    count: number
    fixed: Point[]
    randomCount: number
    excludeRadius: number
  }
  maxSteps: number
  bossSpeed: number
  unlockCondition: string | null
  isReplayable: boolean
}

interface LevelsData {
  levels: LevelConfig[]
}

export class LevelManager {
  private _levels: Map<number, LevelConfig> = new Map()
  private _loaded: boolean = false

  /** 从 levels.json 加载关卡配置 */
  async load(): Promise<boolean> {
    try {
      const response = await fetch('src/data/levels.json')
      const data: LevelsData = await response.json()
      this._levels.clear()
      data.levels.forEach(lv => this._levels.set(lv.id, lv))
      this._loaded = true
      return true
    } catch (e) {
      console.error('LevelManager.load failed:', e)
      // 降级：尝试直接 import
      try {
        const data = await import('../data/levels.json')
        const jsonData = data as unknown as LevelsData
        this._levels.clear()
        jsonData.levels.forEach(lv => this._levels.set(lv.id, lv))
        this._loaded = true
        return true
      } catch (e2) {
        console.error('LevelManager.load fallback failed:', e2)
        return false
      }
    }
  }

  get loaded(): boolean { return this._loaded }

  /** 按 ID 获取关卡配置 */
  getLevel(id: number): LevelConfig | undefined {
    return this._levels.get(id)
  }

  /** 获取所有关卡 */
  getAllLevels(): LevelConfig[] {
    return Array.from(this._levels.values())
  }

  /** 检查关卡是否解锁 */
  isUnlocked(levelId: number): boolean {
    const level = this._levels.get(levelId)
    if (!level) return false
    if (!level.unlockCondition) return true // 无解锁条件 = 已解锁
    if (level.unlockCondition === 'level_1_cleared') {
      return GameData.totalClears > 0 || GameData.currentLevel > 1
    }
    return false
  }

  /** 获取关卡可进入状态 */
  getLevelStatus(levelId: number): 'locked' | 'unlocked' | 'cleared' {
    const level = this._levels.get(levelId)
    if (!level) return 'locked'
    if (!this.isUnlocked(levelId)) return 'locked'
    if (levelId === 1 && GameData.totalClears > 0) return 'cleared'
    if (levelId === 2 && GameData.totalClears >= 2) return 'cleared'
    return 'unlocked'
  }

  /** 获取当前应显示的主按钮文案 */
  getMainButtonText(): string {
    const level2Status = this.getLevelStatus(2)
    if (level2Status === 'cleared') return '再来一局'
    const level1Status = this.getLevelStatus(1)
    if (level1Status === 'cleared') return '继续挑战'
    return '开始挑战'
  }

  /** 获取当前目标关卡 ID */
  getTargetLevelId(): number {
    const level1Status = this.getLevelStatus(1)
    if (level1Status === 'cleared') return 2
    return 1
  }
}
