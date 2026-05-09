// BoardSerializer.ts
// 职责：将完整游戏状态序列化为 JSON 快照，用于撤销回退和断线恢复
// 依赖：GridManager, TurnController

import { GridManager, Point } from './GridManager'
import { TurnController, TurnPhase } from './TurnController'

export interface BoardSnapshot {
  obstacles: Point[]
  bossPos: Point
  currentStep: number
  maxSteps: number
  phase: TurnPhase
  timestamp: number
}

export class BoardSerializer {
  /** 创建当前棋盘快照 */
  static createSnapshot(grid: GridManager, controller: TurnController): BoardSnapshot {
    return {
      obstacles: grid.getAllObstacles(),
      bossPos: controller.bossPos,
      currentStep: controller.currentStep,
      maxSteps: controller.maxSteps,
      phase: controller.phase,
      timestamp: Date.now(),
    }
  }

  /** 从快照恢复棋盘状态 */
  static restoreSnapshot(grid: GridManager, snapshot: BoardSnapshot): void {
    grid.clearObstacles()
    for (const obs of snapshot.obstacles) {
      grid.placeObstacle(obs.x, obs.y)
    }
  }

  /** 将快照序列化为 JSON 字符串 */
  static serialize(snapshot: BoardSnapshot): string {
    return JSON.stringify(snapshot)
  }

  /** 从 JSON 字符串反序列化快照 */
  static deserialize(json: string): BoardSnapshot | null {
    try {
      return JSON.parse(json) as BoardSnapshot
    } catch {
      return null
    }
  }
}
