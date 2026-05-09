// test_obstacle_generator.ts
// 测试任务：实现障碍物随机生成器与死局检测

import { describe, it, expect, beforeEach } from 'vitest'
import { GridManager } from '../src/systems/GridManager'
import { ObstacleGenerator } from '../src/systems/ObstacleGenerator'

describe('ObstacleGenerator', () => {
  let grid: GridManager
  let generator: ObstacleGenerator

  beforeEach(() => {
    grid = new GridManager({ gridSize: 7 })
    generator = new ObstacleGenerator(grid)
  })

  it('生成障碍物数量正确', () => {
    const obstacles = generator.generate(5, { x: 3, y: 3 }, 2)
    expect(obstacles.length).toBeGreaterThanOrEqual(5)
  })

  it('排除区域_Boss起点无障碍', () => {
    const obstacles = generator.generate(10, { x: 3, y: 3 }, 2, [])
    const bossX = 3, bossY = 3
    for (const obs of obstacles) {
      // 排除半径 2 内不应有障碍物
      const dist = Math.abs(obs.x - bossX) + Math.abs(obs.y - bossY)
      expect(dist > 2).toBe(true)
    }
  })

  it('死局检测_至少一条可达路径', () => {
    // 生成 3 个障碍物，应保证有解
    const obstacles = generator.generate(3, { x: 3, y: 3 }, 2)
    expect(generator.hasValidPath({ x: 3, y: 3 }, obstacles)).toBe(true)
  })

  it('检测到死局时返回false', () => {
    // 手动构建死局：完全包围 (3,3)
    const deadObs = [
      { x: 3, y: 2 }, { x: 4, y: 3 },
      { x: 3, y: 4 }, { x: 2, y: 3 },
    ]
    expect(generator.hasValidPath({ x: 3, y: 3 }, deadObs)).toBe(false)
  })

  it('保留固定障碍物', () => {
    const fixed = [{ x: 0, y: 0 }, { x: 0, y: 1 }]
    const obstacles = generator.generate(2, { x: 3, y: 3 }, 2, fixed)
    // 固定障碍物应包含在结果中
    expect(obstacles).toContainEqual({ x: 0, y: 0 })
    expect(obstacles).toContainEqual({ x: 0, y: 1 })
  })
})
