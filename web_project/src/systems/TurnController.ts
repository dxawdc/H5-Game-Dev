// TurnController.ts
// 职责：管理回合循环状态机（玩家放置 → Boss 移动 → 胜负判定）
// 依赖：GridManager, BossAI, EventBus

import { GridManager, EMPTY, LIT, BOSS } from './GridManager'
import type { OffsetCoord, CellState } from './GridManager'
import { BossAI } from './BossAI'
import { eventBus } from '../core/EventBus'

export type TurnPhase = 'playerTurn' | 'bossMoving' | 'victory' | 'defeat'

export class TurnController {
  private _phase: TurnPhase = 'playerTurn'
  private _grid: GridManager
  private _bossAI: BossAI
  private _bossPos: OffsetCoord
  private _steps: number = 0
  private _extraMove: boolean = false
  private _bossTrapped: boolean = false
  private _history: { grid: CellState[][]; bossPos: OffsetCoord; steps: number }[] = []

  constructor(grid: GridManager, bossAI: BossAI, bossStart: OffsetCoord) {
    this._grid = grid
    this._bossAI = bossAI
    this._bossPos = { ...bossStart }
  }

  get phase(): TurnPhase { return this._phase }
  get bossPos(): OffsetCoord { return { ...this._bossPos } }
  get steps(): number { return this._steps }
  get bossTrapped(): boolean { return this._bossTrapped }
  get extraMove(): boolean { return this._extraMove }
  set extraMove(v: boolean) { this._extraMove = v }
  get historyLength(): number { return this._history.length }

  start(): void {
    this._phase = 'playerTurn'
    eventBus.emit('turnStarted', { phase: this._phase })
  }

  /** 玩家点击格子放置障碍 */
  placeObstacle(r: number, c: number): boolean {
    if (this._phase !== 'playerTurn') return false
    const cell = this._grid.getCell(r, c)
    if (cell !== EMPTY) return false
    if (r === this._bossPos.r && c === this._bossPos.c) return false

    // 保存历史（用于撤销）
    this._history.push({
      grid: this._grid.getAllCells(),
      bossPos: { ...this._bossPos },
      steps: this._steps,
    })
    if (this._history.length > 5) this._history.shift()

    // 放置障碍
    this._grid.setCell(r, c, LIT)
    this._steps++
    eventBus.emit('obstaclePlaced', { r, c })

    // 先检查胜利（放置后如果 Boss 被完全围住）
    if (this._checkWin()) {
      this._phase = 'victory'
      eventBus.emit('levelCleared', { steps: this._steps })
      return true
    }

    // Boss 移动阶段
    this._phase = 'bossMoving'
    eventBus.emit('bossTurnStarted')

    if (this._extraMove) {
      // 多走1步道具：Boss 不移动
      this._extraMove = false
      this._phase = 'playerTurn'
      eventBus.emit('turnEnded')
      return true
    }

    const next = this._bossAI.getNextMove(this._bossPos.r, this._bossPos.c)
    if (next) {
      // Boss 有路径或可游走的空格
      const from = { ...this._bossPos }
      this._grid.setCell(this._bossPos.r, this._bossPos.c, EMPTY)
      this._bossPos = next
      this._grid.setCell(next.r, next.c, BOSS)
      eventBus.emit('bossMoved', { from, to: next })

      // 检查 Boss 是否被围住（无逃跑路径但还能游走）
      const escapePath = this._bossAI.getEscapePath(this._bossPos.r, this._bossPos.c)
      if (!escapePath) {
        if (!this._bossTrapped) {
          this._bossTrapped = true
          eventBus.emit('bossTrapped')
        }
      } else {
        this._bossTrapped = false
      }

      // 检查失败（Boss 到达边缘）
      if (this._grid.isEdge(next.r, next.c)) {
        this._phase = 'defeat'
        eventBus.emit('bossEscaped', { position: next })
        eventBus.emit('levelFailed', { reason: 'escaped' })
        return true
      }
    } else {
      // Boss 无路可走 — 胜利！
      this._phase = 'victory'
      this._bossTrapped = false
      eventBus.emit('bossCaught', { position: this._bossPos })
      eventBus.emit('levelCleared', { steps: this._steps })
      return true
    }

    this._phase = 'playerTurn'
    eventBus.emit('turnEnded')
    return true
  }

  /** 撤销上一步 */
  undo(): boolean {
    if (this._history.length === 0) return false
    const prev = this._history.pop()!
    this._grid.restoreFromSnapshot(prev.grid)
    this._bossPos = prev.bossPos
    this._steps = prev.steps
    // 撤销后恢复 Boss 位置
    this._grid.setCell(this._bossPos.r, this._bossPos.c, BOSS)
    return true
  }

  /** 获取提示用的逃跑路径 */
  getHintPath(): OffsetCoord[] | null {
    return this._bossAI.getEscapePath(this._bossPos.r, this._bossPos.c)
  }

  /** 重置 */
  reset(bossStart: OffsetCoord): void {
    this._bossPos = { ...bossStart }
    this._steps = 0
    this._phase = 'playerTurn'
    this._bossTrapped = false
    this._extraMove = false
    this._history = []
  }

  private _checkWin(): boolean {
    return this._grid.isSurrounded(this._bossPos.r, this._bossPos.c)
  }
}
