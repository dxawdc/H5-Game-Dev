// GridManager.ts
// 职责：管理 N×N 棋盘网格交点数据结构，提供坐标映射、相邻关系查询、障碍物状态读写
// 依赖：无

export interface Point {
  x: number
  y: number
}

export interface GridConfig {
  gridSize: number // N × N 格子数，交点数为 (N+1) × (N+1)
}

export class GridManager {
  private _gridSize: number
  private _obstacles: Set<string> = new Set()
  private _totalPoints: number

  constructor(config: GridConfig) {
    this._gridSize = config.gridSize
    this._totalPoints = (config.gridSize + 1) * (config.gridSize + 1)
  }

  get gridSize(): number { return this._gridSize }
  get totalPoints(): number { return this._totalPoints }

  /** 获取交点总数 */
  get intersectionCount(): number {
    return (this._gridSize + 1) * (this._gridSize + 1)
  }

  /** 将点坐标转为字符串 key */
  private _pointKey(x: number, y: number): string {
    return `${x},${y}`
  }

  /** 检查坐标是否在棋盘内 */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x <= this._gridSize && y >= 0 && y <= this._gridSize
  }

  /** 检查该交点是否有障碍物 */
  hasObstacle(x: number, y: number): boolean {
    return this._obstacles.has(this._pointKey(x, y))
  }

  /** 放置障碍物，返回是否成功 */
  placeObstacle(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false
    if (this.hasObstacle(x, y)) return false
    this._obstacles.add(this._pointKey(x, y))
    return true
  }

  /** 移除障碍物 */
  removeObstacle(x: number, y: number): boolean {
    return this._obstacles.delete(this._pointKey(x, y))
  }

  /** 清除所有障碍物 */
  clearObstacles(): void {
    this._obstacles.clear()
  }

  /** 获取所有障碍物坐标 */
  getAllObstacles(): Point[] {
    return Array.from(this._obstacles).map(key => {
      const [x, y] = key.split(',').map(Number)
      return { x, y }
    })
  }

  /** 获取某点的四个相邻交点（上右下左） */
  getNeighbors(x: number, y: number): Point[] {
    const dirs: Point[] = [
      { x: 0, y: -1 }, // 上
      { x: 1, y: 0 },  // 右
      { x: 0, y: 1 },  // 下
      { x: -1, y: 0 }, // 左
    ]
    return dirs
      .map(d => ({ x: x + d.x, y: y + d.y }))
      .filter(p => this.isInBounds(p.x, p.y))
  }

  /** 获取某点可达的相邻交点（排除障碍物） */
  getReachableNeighbors(x: number, y: number): Point[] {
    return this.getNeighbors(x, y).filter(p => !this.hasObstacle(p.x, p.y))
  }

  /** 检查某点是否为边界交点 */
  isBoundary(x: number, y: number): boolean {
    return x === 0 || x === this._gridSize || y === 0 || y === this._gridSize
  }

  /** 检查某点是否被完全围堵（所有相邻点都是障碍物或边界外） */
  isSurrounded(x: number, y: number): boolean {
    return this.getNeighbors(x, y).every(p => this.hasObstacle(p.x, p.y))
  }

  /** 重置网格 */
  reset(): void {
    this._obstacles.clear()
  }
}
