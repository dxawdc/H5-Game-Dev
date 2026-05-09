// BossAI.ts
// 职责：BFS 寻路，Boss 找最近的边缘格子逃跑
// 依赖：GridManager

import type { GridManager, OffsetCoord } from './GridManager'
import { BLOCKED, LIT } from './GridManager'

export class BossAI {
  private _grid: GridManager

  constructor(grid: GridManager) {
    this._grid = grid
  }

  /** BFS 找从 bossPos 到任意边缘格子的最短路径 */
  getEscapePath(bossR: number, bossC: number): OffsetCoord[] | null {
    const size = this._grid.gridSize
    const visited: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
    const prev: (OffsetCoord | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null))
    const queue: OffsetCoord[] = [{ r: bossR, c: bossC }]
    visited[bossR][bossC] = true

    while (queue.length > 0) {
      const cur = queue.shift()!
      if (this._grid.isEdge(cur.r, cur.c) && !(cur.r === bossR && cur.c === bossC)) {
        const path: OffsetCoord[] = []
        let node: OffsetCoord | null = cur
        while (node) {
          path.unshift(node)
          node = prev[node.r][node.c]
        }
        return path
      }

      const nbs = this._grid.getNeighbors(cur.r, cur.c)
      for (const nb of nbs) {
        if (!visited[nb.r][nb.c]) {
          const cell = this._grid.getCell(nb.r, nb.c)
          if (cell !== BLOCKED && cell !== LIT) {
            visited[nb.r][nb.c] = true
            prev[nb.r][nb.c] = cur
            queue.push(nb)
          }
        }
      }
    }
    return null
  }

  /** 获取 Boss 下一步移动位置 */
  getNextMove(bossR: number, bossC: number): OffsetCoord | null {
    if (this._grid.isEdge(bossR, bossC)) return null

    const path = this.getEscapePath(bossR, bossC)
    if (path && path.length >= 2) {
      return path[1]
    }

    // 无逃跑路径 — 看是否有空邻格可以游走
    const emptyNbs = this._grid.getEmptyNeighbors(bossR, bossC)
    if (emptyNbs.length > 0) {
      return emptyNbs[Math.floor(Math.random() * emptyNbs.length)]
    }

    return null
  }
}
