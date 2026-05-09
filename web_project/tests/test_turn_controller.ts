// test_turn_controller.ts
// 测试任务：实现回合控制器与胜负判定（BFS + 偏移坐标）
// 验收条件：['初始状态为 playerTurn', 'placeObstacle 放置 LIT 格子', '围住 Boss 所有邻格触发胜利', '撤销操作回到上一步']

import { describe, it, expect, beforeEach } from 'vitest'
import { GridManager, EMPTY, BLOCKED, LIT, BOSS } from '../src/systems/GridManager'
import { TurnController } from '../src/systems/TurnController'
import { BossAI } from '../src/systems/BossAI'

describe('TurnController', () => {
  let grid: GridManager
  let bossAI: BossAI
  let controller: TurnController

  beforeEach(() => {
    grid = new GridManager(7)
    bossAI = new BossAI(grid)
    const center = Math.floor(7 / 2)
    grid.setCell(center, center, BOSS)
    controller = new TurnController(grid, bossAI, { r: center, c: center })
    controller.start()
  })

  it('初始状态为playerTurn', () => {
    expect(controller.phase).toBe('playerTurn')
  })

  it('放置障碍物后格子变为LIT', () => {
    const result = controller.placeObstacle(3, 2)
    expect(result).toBe(true)
    expect(grid.getCell(3, 2)).toBe(LIT)
  })

  it('不可在BOSS位置放置障碍', () => {
    const result = controller.placeObstacle(3, 3)
    expect(result).toBe(false)
  })

  it('非EMPTY格子不可重复放置', () => {
    controller.placeObstacle(3, 2)
    const result = controller.placeObstacle(3, 2)
    expect(result).toBe(false)
  })

  it('完全围堵判定胜利', () => {
    // 7x7 棋盘，Boss 在 (3,3)
    // 预先在除 (2,2) 外的 5 个邻格放置障碍，然后放置最后一个
    const nbs = grid.getNeighbors(3, 3)
    // 将所有邻格设为 BLOCKED（模拟已放置）
    for (const nb of nbs) {
      grid.setCell(nb.r, nb.c, BLOCKED)
    }
    // 留一个 EMPTY，通过 placeObstacle 放置
    const last = nbs[nbs.length - 1]
    grid.setCell(last.r, last.c, EMPTY)

    const result = controller.placeObstacle(last.r, last.c)
    expect(result).toBe(true)
    // 最后一片放置后 Boss 应被围住，触发胜利
    expect(controller.phase).toBe('victory')
  })

  it('撤销操作恢复状态', () => {
    const stepsBefore = controller.steps
    controller.placeObstacle(3, 2)
    expect(controller.steps).toBe(stepsBefore + 1)
    expect(grid.getCell(3, 2)).toBe(LIT)

    const undone = controller.undo()
    expect(undone).toBe(true)
    expect(controller.steps).toBe(stepsBefore)
    expect(grid.getCell(3, 2)).not.toBe(LIT)
  })

  it('无历史时撤销返回false', () => {
    const undone = controller.undo()
    expect(undone).toBe(false)
  })

  it('extraMove阻止Boss移动', () => {
    controller.extraMove = true
    const result = controller.placeObstacle(3, 2)
    expect(result).toBe(true)
    // extraMove 后应回到 playerTurn
    expect(controller.phase).toBe('playerTurn')
  })

  it('reset重置状态', () => {
    controller.placeObstacle(3, 2)
    controller.reset({ r: 3, c: 3 })
    expect(controller.phase).toBe('playerTurn')
    expect(controller.steps).toBe(0)
  })
})
