// test_grid_manager.ts
// 测试任务：实现网格管理与操作验证器
// 验收条件：['GridManager 支持 N×N 到 (N+1)×(N+1) 交点的正确映射', '相邻查询返回上下左右四个方向正确邻居', '障碍物状态可读写，重复放置被拒绝', '边界外点击返回无效']

import { describe, it, expect, beforeEach } from 'vitest'
import { GridManager } from '../src/systems/GridManager'

describe("实现网格管理与操作验证器", () => {
  let grid: GridManager

  beforeEach(() => {
    grid = new GridManager({ gridSize: 7 })
  })

  it("test_网格_7x7_交点总数64", () => {
    expect(grid.gridSize).toBe(7)
    expect(grid.intersectionCount).toBe(64) // (7+1)*(7+1) = 64
    expect(grid.totalPoints).toBe(64)
  })

  it("test_网格_9x9_交点总数100", () => {
    const bigGrid = new GridManager({ gridSize: 9 })
    expect(bigGrid.gridSize).toBe(9)
    expect(bigGrid.intersectionCount).toBe(100) // (9+1)*(9+1) = 100
    expect(bigGrid.totalPoints).toBe(100)
  })

  it("test_相邻查询_四方向正确", () => {
    // 中心点 (3,3) 应有 4 个邻居
    const neighbors = grid.getNeighbors(3, 3)
    expect(neighbors).toHaveLength(4)
    // 四个方向：上(3,2) 右(4,3) 下(3,4) 左(2,3)
    expect(neighbors).toContainEqual({ x: 3, y: 2 })
    expect(neighbors).toContainEqual({ x: 4, y: 3 })
    expect(neighbors).toContainEqual({ x: 3, y: 4 })
    expect(neighbors).toContainEqual({ x: 2, y: 3 })
  })

  it("test_障碍物状态读写", () => {
    // 初始无障碍物
    expect(grid.hasObstacle(1, 1)).toBe(false)

    // 放置障碍物
    const result = grid.placeObstacle(1, 1)
    expect(result).toBe(true)
    expect(grid.hasObstacle(1, 1)).toBe(true)

    // 获取所有障碍物
    const all = grid.getAllObstacles()
    expect(all).toHaveLength(1)
    expect(all[0]).toEqual({ x: 1, y: 1 })

    // 移除障碍物
    const removed = grid.removeObstacle(1, 1)
    expect(removed).toBe(true)
    expect(grid.hasObstacle(1, 1)).toBe(false)
  })

  it("test_操作验证_已占用点不可点击", () => {
    // 第一次放置成功
    expect(grid.placeObstacle(2, 2)).toBe(true)

    // 重复放置同一位置应被拒绝
    expect(grid.placeObstacle(2, 2)).toBe(false)

    // 障碍物仍然存在
    expect(grid.hasObstacle(2, 2)).toBe(true)
  })

  it("test_操作验证_边界外点击被拒绝", () => {
    // 超出网格范围
    expect(grid.isInBounds(-1, 0)).toBe(false)
    expect(grid.isInBounds(0, -1)).toBe(false)
    expect(grid.isInBounds(8, 0)).toBe(false)
    expect(grid.isInBounds(0, 8)).toBe(false)

    // 边界外放置被拒绝
    expect(grid.placeObstacle(-1, 0)).toBe(false)
    expect(grid.placeObstacle(8, 3)).toBe(false)
  })

})
