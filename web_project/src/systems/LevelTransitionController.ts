// LevelTransitionController.ts
// 职责：处理关卡切换与进度持久化
// 依赖：GameData

import { GameData } from '../core/GameData'
import { eventBus } from '../core/EventBus'

export interface LevelProgress {
  level2BestSteps: number
  level2BestTime: number
  totalClears: number
  currentLevel: number
}

export class LevelTransitionController {
  /** 通关后处理：保存成绩、解锁下一关 */
  static onLevelCleared(levelId: number, steps: number, elapsedMs: number): void {
    if (levelId === 1) {
      // 第 1 关通关：解锁第 2 关
      GameData.totalClears++
      GameData.currentLevel = 2
      GameData.saveToLocalStorage()
      eventBus.emit('levelTransition', { from: 1, to: 2 })
      return
    }

    if (levelId === 2) {
      GameData.totalClears++

      // 更新最佳成绩（仅第 2 关，999 为初始无记录标记）
      const prevBestSteps = GameData.bestLevel2Steps
      if (prevBestSteps === 0 || prevBestSteps === 999 || steps < prevBestSteps) {
        GameData.bestLevel2Steps = steps
      }
      const prevBestTime = GameData.bestLevel2Time
      if (prevBestTime === 0 || prevBestTime === 999 || elapsedMs < prevBestTime) {
        GameData.bestLevel2Time = elapsedMs
      }

      GameData.saveToLocalStorage()
      eventBus.emit('levelTransition', { from: 2, to: 0 }) // 0 = 返回结算
    }
  }

  /** 获取第 2 关的最佳记录 */
  static getBestRecord(): { steps: number; time: number } {
    return {
      steps: GameData.bestLevel2Steps,
      time: GameData.bestLevel2Time,
    }
  }

  /** 重新开始关卡 */
  static restartLevel(levelId: number): void {
    GameData.currentLevel = levelId
    GameData.saveToLocalStorage()
  }

  /** 返回主界面 */
  static returnToMenu(): void {
    GameData.currentLevel = 1
    GameData.saveToLocalStorage()
  }
}
