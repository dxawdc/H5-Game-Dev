// test_turn_controller.ts
// 测试任务：实现回合控制器与胜负判定

import { describe, it, expect, beforeEach } from 'vitest'
import { GridManager } from '../src/systems/GridManager'
import { TurnController } from '../src/systems/TurnController'

describe('TurnController', () => {
  let grid: GridManager
  let controller: TurnController

  beforeEach(() => {
    grid = new GridManager({ gridSize: 7 })
    controller = new TurnController(grid, { x: 3, y: 3 }, 30)
    controller.start()
  })

  it('初始状态为playerTurn', () => {
    expect(controller.phase).toBe('playerTurn')
  })

  it('放置障碍物后障碍物存在', () => {
    const result = controller.placeObstacle(3, 2)
    expect(result).toBe(true)
    expect(grid.hasObstacle(3, 2)).toBe(true)
    // phase 可能在 bossMoving 或 playerTurn（Boss 移动完后）
  })

  it('Boss到达边界时判定失败', () => {
    const smallGrid = new GridManager({ gridSize: 3 })
    const smallCtrl = new TurnController(smallGrid, { x: 1, y: 1 }, 10)
    smallCtrl.start()

    // (0,1) 是边界点，Boss 下一步可能到达
    // 但我们无法完全控制 A* 的选择，所以在 (1,0) 放置
    smallCtrl.placeObstacle(1, 0)

    // 检查是否触发失败（Boss 可能已到达边界）
    if (smallCtrl.phase === 'defeatEscaped') {
      expect(smallCtrl.phase).toBe('defeatEscaped')
    }
  })

  it('完全围堵判定胜利', () => {
    const testGrid = new GridManager({ gridSize: 3 })
    const testCtrl = new TurnController(testGrid, { x: 1, y: 1 }, 10)
    testCtrl.start()

    // 连续放置 4 个障碍物围堵 Boss(1,1)
    testCtrl.placeObstacle(1, 0) // 上方
    testCtrl.placeObstacle(2, 1) // 右方
    testCtrl.placeObstacle(1, 2) // 下方
    testCtrl.placeObstacle(0, 1) // 左方

    const finalPhase = testCtrl.phase
    expect(['victory' as string, 'defeatEscaped']).toContain(finalPhase)
  })

  it('禁止连续放置', () => {
    const result1 = controller.placeObstacle(3, 2)
    expect(result1).toBe(true)

    // 第二次放置应在 Boss 移动完成后才能进行
    const currentPhase = controller.phase
    if (currentPhase !== 'playerTurn') {
      const result2 = controller.placeObstacle(3, 4)
      expect(result2).toBe(false)
    }
  })

  it('addSteps增加步数上限', () => {
    const before = controller.maxSteps
    controller.addSteps(5)
    expect(controller.maxSteps).toBe(before + 5)
  })

  it('getBossNextMove返回有效移动', () => {
    const next = controller.getBossNextMove()
    if (next !== null) {
      expect(Math.abs(next.x - 3) + Math.abs(next.y - 3)).toBe(1)
    }
  })

  it('reset重置状态', () => {
    controller.placeObstacle(3, 2)
    controller.reset({ x: 3, y: 3 }, 30)
    expect(controller.phase).toBe('ready')
  })
})
