// TurnController.ts
// 职责：管理"玩家放置→Boss移动→胜负判定"的回合循环状态机
// 依赖：GridManager, AStarPathfinding, WinLoseDetector

import { GridManager, Point } from './GridManager'
import { AStarPathfinding } from './AStarPathfinding'
import { eventBus } from '../core/EventBus'
import type { BoardSnapshot } from './BoardSerializer'

export type TurnPhase = 'ready' | 'playerTurn' | 'bossMoving' | 'judging' | 'victory' | 'defeatEscaped' | 'defeatOutOfSteps'

export interface TurnResult {
  phase: TurnPhase
  bossMove: Point | null
  isWin: boolean
  isLose: boolean
}

export class TurnController {
  private _phase: TurnPhase = 'ready'
  private _grid: GridManager
  private _pathfinding: AStarPathfinding
  private _bossPos: Point
  private _maxSteps: number
  private _currentStep: number = 0

  constructor(grid: GridManager, bossStart: Point, maxSteps: number) {
    this._grid = grid
    this._pathfinding = new AStarPathfinding(grid)
    this._bossPos = { ...bossStart }
    this._maxSteps = maxSteps
  }

  get phase(): TurnPhase { return this._phase }
  get bossPos(): Point { return { ...this._bossPos } }
  get currentStep(): number { return this._currentStep }
  get maxSteps(): number { return this._maxSteps }
  get stepsRemaining(): number { return Math.max(0, this._maxSteps - this._currentStep) }

  /** 初始化回合 */
  start(): void {
    this._phase = 'playerTurn'
    eventBus.emit('turnStarted', { phase: this._phase })
  }

  /** 玩家放置障碍物 */
  placeObstacle(x: number, y: number): boolean {
    if (this._phase !== 'playerTurn') return false

    // 验证是否可放置
    if (!this._grid.isInBounds(x, y)) return false
    if (this._grid.hasObstacle(x, y)) return false
    if (this._grid.isBoundary(x, y)) return false // 边界不可放置

    this._grid.placeObstacle(x, y)
    this._currentStep++
    eventBus.emit('obstaclePlaced', { x, y })

    // 检查步数
    if (this._currentStep >= this._maxSteps) {
      this._phase = 'defeatOutOfSteps'
      eventBus.emit('stepCountExhausted')
      eventBus.emit('levelFailed', { reason: 'outOfSteps' })
      return true
    }

    // 进入Boss移动阶段
    this._phase = 'bossMoving'
    eventBus.emit('bossTurnStarted')

    // 计算Boss移动
    const nextMove = this._pathfinding.getNextMove(this._bossPos)
    if (nextMove) {
      this._bossPos = nextMove
      eventBus.emit('bossMoved', { from: this._bossPos, to: nextMove })

      // 检查是否到达出口
      if (this._grid.isBoundary(nextMove.x, nextMove.y)) {
        this._phase = 'defeatEscaped'
        eventBus.emit('bossEscaped', { position: nextMove })
        eventBus.emit('levelFailed', { reason: 'escaped' })
      } else {
        this._phase = 'playerTurn'
        eventBus.emit('turnEnded')
      }
    } else {
      // Boss无路可走 — 胜利！
      this._phase = 'victory'
      eventBus.emit('bossCaught', { position: this._bossPos })
      eventBus.emit('levelCleared', { steps: this._currentStep })
    }

    return true
  }

  /** 增加步数（道具效果） */
  addSteps(extra: number): void {
    this._maxSteps += extra
    eventBus.emit('stepsIncreased', { extra, newMax: this._maxSteps })
  }

  /** 获取Boss下一步（用于提示道具） */
  getBossNextMove(): Point | null {
    return this._pathfinding.getNextMove(this._bossPos)
  }

  /** 从快照恢复状态（用于道具撤销/重置） */
  restoreFromSnapshot(snapshot: BoardSnapshot): void {
    this._bossPos = { ...snapshot.bossPos }
    this._currentStep = snapshot.currentStep
    this._maxSteps = snapshot.maxSteps
    this._phase = snapshot.phase
  }

  /** 重置回合控制器 */
  reset(bossStart: Point, maxSteps: number): void {
    this._bossPos = { ...bossStart }
    this._maxSteps = maxSteps
    this._currentStep = 0
    this._phase = 'ready'
  }
}
