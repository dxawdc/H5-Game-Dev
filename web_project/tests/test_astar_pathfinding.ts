// test_astar_pathfinding.ts
// 测试任务：实现 Boss A* 寻路引擎

import { describe, it, expect, beforeEach } from 'vitest'
import { GridManager } from '../src/systems/GridManager'
import { AStarPathfinding } from '../src/systems/AStarPathfinding'

function createGrid(size: number): GridManager {
  return new GridManager({ gridSize: size })
}

describe('AStarPathfinding', () => {
  let grid: GridManager
  let pathfinding: AStarPathfinding

  beforeEach(() => {
    grid = createGrid(7)
    pathfinding = new AStarPathfinding(grid)
  })

  it('无障碍时_Boss找到出口', () => {
    // Boss 在 (3,3)，无障碍，应能到达边界
    const path = pathfinding.findPath({ x: 3, y: 3 })
    expect(path.length).toBeGreaterThan(0)
    // 路径终点应为边界点
    const last = path[path.length - 1]
    const isBoundary = last.x === 0 || last.x === 7 || last.y === 0 || last.y === 7
    expect(isBoundary).toBe(true)
  })

  it('障碍物阻挡_Boss绕路', () => {
    // 在 Boss 上方路径放置障碍物
    grid.placeObstacle(3, 2)
    grid.placeObstacle(4, 2)
    grid.placeObstacle(3, 1)

    const path = pathfinding.findPath({ x: 3, y: 3 })
    expect(path.length).toBeGreaterThan(0)
    // 路径不应经过 (3,2), (4,2), (3,1)
    for (const p of path) {
      expect(p.x === 3 && p.y === 2).toBe(false)
      expect(p.x === 4 && p.y === 2).toBe(false)
    }
    // 终点应为边界
    const last = path[path.length - 1]
    expect(grid.isBoundary(last.x, last.y)).toBe(true)
  })

  it('完全围堵_Boss无路可走', () => {
    // 3x3 包围 Boss(3,3)
    grid.placeObstacle(3, 2)
    grid.placeObstacle(4, 3)
    grid.placeObstacle(3, 4)
    grid.placeObstacle(2, 3)

    const path = pathfinding.findPath({ x: 3, y: 3 })
    expect(path.length).toBe(0)
  })

  it('对同一状态返回确定性结果', () => {
    grid.placeObstacle(3, 2)
    const path1 = pathfinding.findPath({ x: 3, y: 3 })
    const path2 = pathfinding.findPath({ x: 3, y: 3 })
    expect(path1).toEqual(path2)
  })

  it('getNextMove_返回第一步或null', () => {
    // 无障碍时返回第一步
    const move = pathfinding.getNextMove({ x: 3, y: 3 })
    expect(move).not.toBeNull()
    if (move) {
      expect(Math.abs(move.x - 3) + Math.abs(move.y - 3)).toBe(1)
    }

    // 包围时返回 null
    grid.placeObstacle(3, 2)
    grid.placeObstacle(4, 3)
    grid.placeObstacle(3, 4)
    grid.placeObstacle(2, 3)
    expect(pathfinding.getNextMove({ x: 3, y: 3 })).toBeNull()
  })

  it('权重参数影响路径选择', () => {
    pathfinding.setWeight(1.0)
    const pathLight = pathfinding.findPath({ x: 3, y: 3 })
    pathfinding.setWeight(3.0)
    const pathHeavy = pathfinding.findPath({ x: 3, y: 3 })
    // 两种权重都应找到路径
    expect(pathLight.length).toBeGreaterThan(0)
    expect(pathHeavy.length).toBeGreaterThan(0)
  })
})
