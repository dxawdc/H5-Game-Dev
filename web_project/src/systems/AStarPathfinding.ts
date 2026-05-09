// AStarPathfinding.ts
// 职责：封装 A* 寻路算法，接收棋盘状态和 Boss 坐标，返回下一步移动方向和完整路径
// 依赖：GridManager

import { GridManager, Point } from './GridManager'

interface AStarNode {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: AStarNode | null
}

export class AStarPathfinding {
  private _grid: GridManager
  private _weight: number = 1.8
  private _searchLimit: number = 500
  private _timeoutMs: number = 100

  constructor(grid: GridManager) {
    this._grid = grid
  }

  /** 设置启发函数权重 */
  setWeight(weight: number): void {
    this._weight = Math.max(1.0, Math.min(3.0, weight))
  }

  /** 设置搜索深度上限 */
  setSearchLimit(limit: number): void {
    this._searchLimit = limit
  }

  /** 计算到最近出口的距离（加权曼哈顿） */
  private _heuristicToExit(x: number, y: number, gridSize: number): number {
    const toTop = y
    const toBottom = gridSize - y
    const toLeft = x
    const toRight = gridSize - x
    const minDist = Math.min(toTop, toBottom, toLeft, toRight)
    return minDist * this._weight
  }

  /** 寻找从 start 到最近出口的路径 */
  findPath(start: Point): Point[] {
    const gridSize = this._grid.gridSize
    const startTime = performance.now()

    const openSet: AStarNode[] = []
    const closedSet = new Set<string>()

    const startNode: AStarNode = {
      x: start.x,
      y: start.y,
      g: 0,
      h: this._heuristicToExit(start.x, start.y, gridSize),
      f: 0,
      parent: null,
    }
    startNode.f = startNode.g + startNode.h
    openSet.push(startNode)

    let iterations = 0

    while (openSet.length > 0 && iterations < this._searchLimit) {
      // 检查超时
      if (performance.now() - startTime > this._timeoutMs) {
        console.warn('A* search timed out')
        break
      }

      iterations++

      // 取 f 值最低的节点
      let lowestIdx = 0
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIdx].f) {
          lowestIdx = i
        }
      }
      const current = openSet[lowestIdx]

      // 到达出口（边界）
      if (this._grid.isBoundary(current.x, current.y)) {
        return this._reconstructPath(current)
      }

      openSet.splice(lowestIdx, 1)
      closedSet.add(`${current.x},${current.y}`)

      // 探索邻居
      const neighbors = this._grid.getReachableNeighbors(current.x, current.y)
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`
        if (closedSet.has(key)) continue

        const g = current.g + 1
        const h = this._heuristicToExit(neighbor.x, neighbor.y, gridSize)
        const f = g + h

        const existing = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)
        if (existing) {
          if (g < existing.g) {
            existing.g = g
            existing.f = f
            existing.parent = current
          }
        } else {
          openSet.push({
            x: neighbor.x,
            y: neighbor.y,
            g,
            h,
            f,
            parent: current,
          })
        }
      }
    }

    // 没找到路径 — 返回空路径表示完全围堵
    return []
  }

  /** 获取下一步移动方向 */
  getNextMove(start: Point): Point | null {
    const path = this.findPath(start)
    if (path.length === 0) return null // 无路可走
    if (path.length === 1) return path[0] // 已经在出口
    return path[0] // 路径中的第一步
  }

  /** 获取从起点到终点的完整路径点集 */
  getFullPath(start: Point): Point[] {
    return this.findPath(start)
  }

  /** 回溯路径 */
  private _reconstructPath(node: AStarNode): Point[] {
    const path: Point[] = []
    let current: AStarNode | null = node
    while (current && current.parent) {
      path.unshift({ x: current.x, y: current.y })
      current = current.parent
    }
    return path
  }
}
