// ObstacleGenerator.ts
// 职责：根据关卡约束随机生成初始障碍物布局，含死局检测
// 依赖：GridManager

import { GridManager, Point } from './GridManager'

export class ObstacleGenerator {
  private _grid: GridManager
  private _maxAttempts: number = 20

  constructor(grid: GridManager) {
    this._grid = grid
  }

  setMaxAttempts(n: number): void {
    this._maxAttempts = n
  }

  /** 生成障碍物布局，返回障碍物坐标数组 */
  generate(
    count: number,
    bossStart: Point,
    excludeRadius: number = 2,
    fixedObstacles: Point[] = [],
  ): Point[] {
    // 先放置固定障碍物
    const obstacles: Point[] = [...fixedObstacles]

    for (let attempt = 0; attempt < this._maxAttempts; attempt++) {
      // 当前需要生成的随机数
      const randomCount = count - obstacles.length
      if (randomCount <= 0) break

      // 生成随机障碍物坐标
      const randomObs = this._generateRandom(randomCount, bossStart, excludeRadius, obstacles)

      // 检查是否有死局
      const allObs = [...obstacles, ...randomObs]
      if (this._hasValidPath(bossStart, allObs)) {
        obstacles.push(...randomObs)
        return obstacles
      }
      // 否则本轮作废，重新生成
    }

    // 达到最大尝试次数，返回固定障碍物（确保可解）
    return obstacles
  }

  /** BFS 可达性检测：Boss 能否到达边界 */
  hasValidPath(bossStart: Point, extraObstacles: Point[] = []): boolean {
    return this._hasValidPath(bossStart, extraObstacles)
  }

  private _hasValidPath(start: Point, extraObstacles: Point[]): boolean {
    const gridSize = this._grid.gridSize
    const extraSet = new Set(extraObstacles.map(p => `${p.x},${p.y}`))

    // BFS
    const visited = new Set<string>()
    const queue: Point[] = [{ ...start }]
    visited.add(`${start.x},${start.y}`)

    while (queue.length > 0) {
      const current = queue.shift()!

      // 到达边界 → 有解
      if (current.x === 0 || current.x === gridSize || current.y === 0 || current.y === gridSize) {
        return true
      }

      const dirs = [
        { x: 0, y: -1 }, { x: 1, y: 0 },
        { x: 0, y: 1 }, { x: -1, y: 0 },
      ]

      for (const d of dirs) {
        const nx = current.x + d.x
        const ny = current.y + d.y
        const key = `${nx},${ny}`
        if (!this._grid.isInBounds(nx, ny)) continue
        if (visited.has(key)) continue
        // 障碍物阻挡
        if (this._grid.hasObstacle(nx, ny) || extraSet.has(key)) continue
        visited.add(key)
        queue.push({ x: nx, y: ny })
      }
    }

    return false // 无路可走
  }

  private _generateRandom(
    count: number,
    bossStart: Point,
    excludeRadius: number,
    existing: Point[],
  ): Point[] {
    const gridSize = this._grid.gridSize
    const existingSet = new Set(existing.map(p => `${p.x},${p.y}`))
    const allPoints: Point[] = []

    // 收集所有可行点（排除 Boss 起始区域）
    for (let x = 0; x <= gridSize; x++) {
      for (let y = 0; y <= gridSize; y++) {
        const key = `${x},${y}`
        if (existingSet.has(key)) continue
        if (this._grid.hasObstacle(x, y)) continue
        // 排除 Boss 起始区域
        if (Math.abs(x - bossStart.x) <= excludeRadius && Math.abs(y - bossStart.y) <= excludeRadius) continue
        allPoints.push({ x, y })
      }
    }

    // 随机打乱
    for (let i = allPoints.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allPoints[i], allPoints[j]] = [allPoints[j], allPoints[i]]
    }

    return allPoints.slice(0, count)
  }
}
