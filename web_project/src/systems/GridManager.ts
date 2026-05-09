// GridManager.ts
// 职责：管理 N×N 格子棋盘，提供偏移坐标邻格查询、状态读写
// 依赖：无

export type CellState = 0 | 1 | 2 | 3

export const EMPTY: CellState = 0
export const BLOCKED: CellState = 1
export const LIT: CellState = 2
export const BOSS: CellState = 3

export interface OffsetCoord {
  r: number
  c: number
}

// 偶数行邻格偏移：[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]
const EVEN_OFFSETS: [number, number][] = [
  [-1, -1], [-1, 0],
  [0, -1],           [0, 1],
  [1, -1], [1, 0],
]

// 奇数行邻格偏移：[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]
const ODD_OFFSETS: [number, number][] = [
  [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, 0], [1, 1],
]

// Level 1 固定障碍图案（7×7 棋盘，中心 3,3）
const LEVEL1_OBSTACLES: OffsetCoord[] = [
  { r: 1, c: 1 }, { r: 1, c: 4 }, { r: 2, c: 6 },
  { r: 4, c: 0 }, { r: 5, c: 5 }, { r: 6, c: 2 },
  { r: 2, c: 2 }, { r: 2, c: 4 },
  { r: 4, c: 2 }, { r: 4, c: 4 },
]

// Level 2 随机图案池（比例坐标）
const LEVEL2_PATTERNS: [number, number][][] = [
  [[0.2, 0.2], [0.2, 0.6], [0.5, 0.1], [0.8, 0.4], [0.6, 0.7], [0.3, 0.85]],
  [[0.15, 0.5], [0.4, 0.2], [0.7, 0.15], [0.8, 0.6], [0.35, 0.75], [0.6, 0.5]],
  [[0.1, 0.3], [0.3, 0.7], [0.5, 0.3], [0.7, 0.7], [0.85, 0.2], [0.15, 0.8]],
  [[0.2, 0.4], [0.4, 0.8], [0.6, 0.2], [0.8, 0.5], [0.25, 0.6], [0.7, 0.4]],
  [[0.3, 0.1], [0.1, 0.7], [0.5, 0.5], [0.7, 0.3], [0.85, 0.7], [0.4, 0.9]],
]

const LEVEL2_EXTRA: [number, number][] = [
  [0.2, 0.3], [0.6, 0.8], [0.8, 0.2],
]

export class GridManager {
  private _size: number
  private _grid: CellState[][]

  constructor(size: number) {
    this._size = size
    this._grid = []
    for (let r = 0; r < size; r++) {
      this._grid[r] = new Array(size).fill(EMPTY) as CellState[]
    }
  }

  get gridSize(): number { return this._size }

  /** 获取格子状态 */
  getCell(r: number, c: number): CellState {
    if (r < 0 || r >= this._size || c < 0 || c >= this._size) return -1 as CellState
    return this._grid[r][c]
  }

  /** 设置格子状态 */
  setCell(r: number, c: number, state: CellState): void {
    if (r < 0 || r >= this._size || c < 0 || c >= this._size) return
    this._grid[r][c] = state
  }

  /** 检查坐标是否在棋盘内 */
  isInBounds(r: number, c: number): boolean {
    return r >= 0 && r < this._size && c >= 0 && c < this._size
  }

  /** 检查格子是否为空（可点击放置） */
  isEmpty(r: number, c: number): boolean {
    return this._grid[r][c] === EMPTY
  }

  /** 检查是否为边缘格子（Boss 到达即输） */
  isEdge(r: number, c: number): boolean {
    return r === 0 || r === this._size - 1 || c === 0 || c === this._size - 1
  }

  /** 获取指定格子的 6 个邻格（奇偶行偏移） */
  getNeighbors(r: number, c: number): OffsetCoord[] {
    const offsets = r % 2 === 0 ? EVEN_OFFSETS : ODD_OFFSETS
    const result: OffsetCoord[] = []
    for (const [dr, dc] of offsets) {
      const nr = r + dr
      const nc = c + dc
      if (this.isInBounds(nr, nc)) {
        result.push({ r: nr, c: nc })
      }
    }
    return result
  }

  /** 获取空邻格 */
  getEmptyNeighbors(r: number, c: number): OffsetCoord[] {
    return this.getNeighbors(r, c).filter(n => this._grid[n.r][n.c] === EMPTY)
  }

  /** 检查 Boss 是否被完全围住（6 邻格全是 BLOCKED 或 LIT） */
  isSurrounded(r: number, c: number): boolean {
    const nbs = this.getNeighbors(r, c)
    return nbs.length > 0 && nbs.every(n => {
      const v = this._grid[n.r][n.c]
      return v === BLOCKED || v === LIT
    })
  }

  /** 放置玩家障碍 */
  placeObstacle(r: number, c: number): boolean {
    if (this._grid[r][c] !== EMPTY) return false
    this._grid[r][c] = LIT
    return true
  }

  /** 初始化第1关障碍 */
  initLevel1(): void {
    const center = Math.floor(this._size / 2)
    for (const p of LEVEL1_OBSTACLES) {
      if (p.r === center && p.c === center) continue
      if (this._grid[p.r][p.c] === EMPTY) this._grid[p.r][p.c] = BLOCKED
    }
  }

  /** 初始化第2关障碍（随机图案） */
  initLevel2(): void {
    const size = this._size
    const center = Math.floor(size / 2)
    const pat = LEVEL2_PATTERNS[Math.floor(Math.random() * LEVEL2_PATTERNS.length)]
    const all: [number, number][] = [...pat, ...LEVEL2_EXTRA]
    let placed = 0
    const maxObs = 10
    for (const [pr, pc] of all) {
      if (placed >= maxObs) break
      const r = Math.round(pr * (size - 1))
      const c = Math.round(pc * (size - 1))
      if (r === center && c === center) continue
      if (!this.isInBounds(r, c)) continue
      if (this._grid[r][c] !== EMPTY) continue
      this._grid[r][c] = BLOCKED
      placed++
    }
  }

  /** 按关卡 ID 初始化障碍 */
  initLevel(level: number): void {
    if (level === 1) this.initLevel1()
    else this.initLevel2()
  }

  /** 获取完整棋盘快照 */
  getAllCells(): CellState[][] {
    return this._grid.map(row => [...row])
  }

  /** 从快照恢复 */
  restoreFromSnapshot(snapshot: CellState[][]): void {
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        this._grid[r][c] = snapshot[r][c]
      }
    }
  }

  /** 重置棋盘 */
  reset(): void {
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        this._grid[r][c] = EMPTY
      }
    }
  }
}
