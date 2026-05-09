// test_grid_manager.ts
// 测试任务：实现 N×N 偏移坐标网格管理
// 验收条件：['GridManager 支持 N×N 格子棋盘', '相邻查询返回偏移坐标六个方向邻居', '格子状态可读写（EMPTY/BLOCKED/LIT/BOSS）', '边界外点击返回无效']

import { describe, it, expect, beforeEach } from 'vitest'
import { GridManager, EMPTY, BLOCKED, LIT, BOSS } from '../src/systems/GridManager'

describe("实现 N×N 网格管理", () => {
  let grid: GridManager

  beforeEach(() => {
    grid = new GridManager(7)
  })

  it("test_网格_7x7_大小正确", () => {
    expect(grid.gridSize).toBe(7)
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        expect(grid.getCell(r, c)).toBe(EMPTY)
      }
    }
  })

  it("test_网格_9x9_大小正确", () => {
    const bigGrid = new GridManager(9)
    expect(bigGrid.gridSize).toBe(9)
  })

  it("test_相邻查询_偶数行(2行)六方向正确", () => {
    // 偶数行 r=2, c=2 → EVEN_OFFSETS: [-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]
    const neighbors = grid.getNeighbors(2, 2)
    expect(neighbors).toHaveLength(6)
    expect(neighbors).toContainEqual({ r: 1, c: 1 })
    expect(neighbors).toContainEqual({ r: 1, c: 2 })
    expect(neighbors).toContainEqual({ r: 2, c: 1 })
    expect(neighbors).toContainEqual({ r: 2, c: 3 })
    expect(neighbors).toContainEqual({ r: 3, c: 1 })
    expect(neighbors).toContainEqual({ r: 3, c: 2 })
  })

  it("test_相邻查询_奇数行(3行)六方向正确", () => {
    // 奇数行 r=3, c=3 → ODD_OFFSETS: [-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]
    const neighbors = grid.getNeighbors(3, 3)
    expect(neighbors).toHaveLength(6)
    expect(neighbors).toContainEqual({ r: 2, c: 3 })
    expect(neighbors).toContainEqual({ r: 2, c: 4 })
    expect(neighbors).toContainEqual({ r: 3, c: 2 })
    expect(neighbors).toContainEqual({ r: 3, c: 4 })
    expect(neighbors).toContainEqual({ r: 4, c: 3 })
    expect(neighbors).toContainEqual({ r: 4, c: 4 })
  })

  it("test_格子状态读写", () => {
    expect(grid.getCell(1, 1)).toBe(EMPTY)

    grid.setCell(1, 1, BLOCKED)
    expect(grid.getCell(1, 1)).toBe(BLOCKED)

    grid.setCell(1, 1, LIT)
    expect(grid.getCell(1, 1)).toBe(LIT)

    grid.setCell(1, 1, BOSS)
    expect(grid.getCell(1, 1)).toBe(BOSS)

    grid.setCell(1, 1, EMPTY)
    expect(grid.getCell(1, 1)).toBe(EMPTY)
  })

  it("test_isEdge_边界判定正确", () => {
    expect(grid.isEdge(0, 3)).toBe(true)
    expect(grid.isEdge(6, 3)).toBe(true)
    expect(grid.isEdge(3, 0)).toBe(true)
    expect(grid.isEdge(3, 6)).toBe(true)
    expect(grid.isEdge(3, 3)).toBe(false)
    expect(grid.isEdge(1, 1)).toBe(false)
  })

  it("test_isSurrounded_完全围堵判定", () => {
    // 将 (3,3) 的 6 个邻居都设为 BLOCKED
    const nbs = grid.getNeighbors(3, 3)
    for (const nb of nbs) {
      grid.setCell(nb.r, nb.c, BLOCKED)
    }
    expect(grid.isSurrounded(3, 3)).toBe(true)
  })

  it("test_isSurrounded_未完全围堵", () => {
    const nbs = grid.getNeighbors(3, 3)
    // 只围 5 个
    for (let i = 0; i < 5; i++) {
      grid.setCell(nbs[i].r, nbs[i].c, BLOCKED)
    }
    expect(grid.isSurrounded(3, 3)).toBe(false)
  })

  it("test_isInBounds_边界判定", () => {
    expect(grid.isInBounds(0, 0)).toBe(true)
    expect(grid.isInBounds(6, 6)).toBe(true)
    expect(grid.isInBounds(-1, 0)).toBe(false)
    expect(grid.isInBounds(0, -1)).toBe(false)
    expect(grid.isInBounds(7, 0)).toBe(false)
    expect(grid.isInBounds(0, 7)).toBe(false)
  })

  it("test_getAllCells_返回当前棋盘快照", () => {
    grid.setCell(1, 1, BLOCKED)
    grid.setCell(2, 2, LIT)

    const snapshot = grid.getAllCells()
    expect(snapshot[1][1]).toBe(BLOCKED)
    expect(snapshot[2][2]).toBe(LIT)
    expect(snapshot[3][3]).toBe(EMPTY)
  })

  it("test_restoreFromSnapshot_恢复棋盘", () => {
    grid.setCell(1, 1, BLOCKED)
    const snapshot = grid.getAllCells()

    grid.setCell(1, 1, EMPTY)
    expect(grid.getCell(1, 1)).toBe(EMPTY)

    grid.restoreFromSnapshot(snapshot)
    expect(grid.getCell(1, 1)).toBe(BLOCKED)
  })

  it("test_initLevel1_放置固定障碍", () => {
    const lv1 = new GridManager(7)
    lv1.initLevel1()
    // 第1关某些位置应有障碍
    expect(lv1.getCell(1, 1)).toBe(BLOCKED)
    expect(lv1.getCell(1, 4)).toBe(BLOCKED)
  })
})
