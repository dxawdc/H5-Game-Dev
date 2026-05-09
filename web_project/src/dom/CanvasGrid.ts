// CanvasGrid.ts
// 职责：在 Canvas 上绘制交错圆形格子（匹配参考 HTML 视觉效果）
// 依赖：GridManager

import type { GridManager, CellState } from '../systems/GridManager'

export interface OffsetCoord {
  r: number
  c: number
}

const CELL_GAP = 4
const SQRT3_2 = Math.sqrt(3) / 2

export class CanvasGrid {
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _cellSize: number = 0
  private _startX: number = 0
  private _startY: number = 0
  private _gridSize: number = 0
  private _gap: number = CELL_GAP
  private _hintCells: Set<string> = new Set()
  private _bossTrapped: boolean = false
  private _bossPos: OffsetCoord = { r: -1, c: -1 }

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this._ctx = ctx
  }

  setHintCells(cells: OffsetCoord[]): void {
    this._hintCells = new Set(cells.map(c => `${c.r},${c.c}`))
  }

  clearHints(): void {
    this._hintCells.clear()
  }

  setBossTrapped(trapped: boolean): void {
    this._bossTrapped = trapped
  }

  set bossPos(pos: OffsetCoord) { this._bossPos = pos }
  get bossPos(): OffsetCoord { return this._bossPos }

  /** 计算格子大小和起点（填满容器） */
  private _calculateLayout(gridSize: number): void {
    const parent = this._canvas.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    this._canvas.width = w
    this._canvas.height = h
    this._gridSize = gridSize
    this._gap = Math.max(2, CELL_GAP * (w / 648))

    const cellW = (w - this._gap) / (gridSize + 0.5)
    const cellH = (h - this._gap) / (gridSize * SQRT3_2 + 0.5)
    this._cellSize = Math.max(12, Math.min(48, Math.floor(Math.min(cellW, cellH))))

    const totalW = (gridSize - 1) * (this._cellSize + this._gap) + this._cellSize + this._cellSize / 2
    const totalH = (gridSize - 1) * (this._cellSize + this._gap) * SQRT3_2 + this._cellSize
    this._startX = (w - totalW) / 2
    this._startY = (h - totalH) / 2
  }

  /** 获取格子中心像素坐标 */
  cellToPixel(r: number, c: number): { cx: number; cy: number } {
    const offsetX = (r % 2 === 1) ? (this._cellSize + this._gap) / 2 : 0
    const cx = this._startX + c * (this._cellSize + this._gap) + offsetX + this._cellSize / 2
    const cy = this._startY + r * (this._cellSize + this._gap) * SQRT3_2 + this._cellSize / 2
    return { cx, cy }
  }

  /** 像素坐标转格子坐标 */
  pixelToCell(px: number, py: number): OffsetCoord | null {
    const size = this._gridSize
    // 粗略估计行
    const rowH = (this._cellSize + this._gap) * SQRT3_2
    const approxR = Math.round((py - this._startY - this._cellSize / 2) / rowH)
    if (approxR < 0 || approxR >= size) return null

    // 精确列
    const offsetX = (approxR % 2 === 1) ? (this._cellSize + this._gap) / 2 : 0
    const colW = (this._cellSize + this._gap)
    const approxC = Math.round((px - this._startX - offsetX - this._cellSize / 2) / colW)
    if (approxC < 0 || approxC >= size) return null

    // 验证距离
    const { cx, cy } = this.cellToPixel(approxR, approxC)
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
    if (dist > this._cellSize * 0.6) return null

    return { r: approxR, c: approxC }
  }

  /** 绘制一帧 */
  render(grid: GridManager, bossPos: OffsetCoord, _bossTrapped: boolean, hintCells: OffsetCoord[]): void {
    this._bossPos = bossPos
    this._bossTrapped = _bossTrapped
    this._hintCells = new Set(hintCells.map(c => `${c.r},${c.c}`))
    this._calculateLayout(grid.gridSize)

    const ctx = this._ctx
    const size = this._gridSize
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const state = grid.getCell(r, c)
        const { cx, cy } = this.cellToPixel(r, c)
        const radius = this._cellSize * 0.42

        if (state === 0 as CellState) {
          // Empty
          if (this._hintCells.has(`${r},${c}`)) {
            this._drawHintCell(ctx, cx, cy, radius)
          } else {
            this._drawEmptyCell(ctx, cx, cy, radius)
          }
        } else if (state === 1 as CellState) {
          this._drawBlockedCell(ctx, cx, cy, radius)
        } else if (state === 2 as CellState) {
          this._drawLitCell(ctx, cx, cy, radius)
        } else if (state === 3 as CellState) {
          this._drawBossCell(ctx, cx, cy, radius, this._bossTrapped)
        }
      }
    }
  }

  private _drawEmptyCell(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = '#FDEBD0'
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.shadowColor = 'rgba(0,0,0,0.04)'
    ctx.shadowBlur = 2
    ctx.fill()
    ctx.shadowBlur = 0
  }

  private _drawBlockedCell(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
    grad.addColorStop(0, '#D5CFC5')
    grad.addColorStop(1, '#C0B8AC')
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.stroke()
    // Tree emoji
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `${r * 1.1}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🌲', cx, cy)
  }

  private _drawLitCell(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
    grad.addColorStop(0, '#FF6B35')
    grad.addColorStop(1, '#E8531E')
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.shadowColor = 'rgba(255,107,53,0.4)'
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,107,53,0.3)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  private _drawBossCell(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, trapped: boolean): void {
    if (trapped) {
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
      grad.addColorStop(0, '#E74C3C')
      grad.addColorStop(1, '#C0392B')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.shadowColor = 'rgba(231,76,60,0.8)'
      ctx.shadowBlur = 16
      ctx.fill()
      ctx.shadowBlur = 0
    } else {
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
      grad.addColorStop(0, '#9B59B6')
      grad.addColorStop(1, '#7D3C98')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.shadowColor = 'rgba(155,89,182,0.5)'
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.shadowBlur = 0
    }

    ctx.fillStyle = '#FFFFFF'
    ctx.font = `${r * 1.0}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(trapped ? '😡' : '😈', cx, cy)
  }

  private _drawHintCell(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(78,205,196,0.35)'
    ctx.fill()
    ctx.strokeStyle = '#4ECDC4'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}
