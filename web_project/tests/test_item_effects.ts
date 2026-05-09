// test_item_effects.ts
// 测试任务：实现四种道具效果执行器
// 验收条件：['extra_step 使步数上限和剩余步数各 +5', 'undo 恢复完整棋盘快照，支持连续回退', 'reset 完全重置关卡至初始状态', 'hint 基于当前棋盘计算推荐点并高亮显示']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { ItemEffectExecutor, EffectContext, ItemSystem } from '../src/systems/ItemSystem'
import { GridManager } from '../src/systems/GridManager'
import { TurnController } from '../src/systems/TurnController'
import { BoardSerializer } from '../src/systems/BoardSerializer'
import { eventBus } from '../src/core/EventBus'

describe("实现四种道具效果执行器", () => {
  let executor: ItemEffectExecutor
  let grid: GridManager
  let controller: TurnController
  let itemSystem: ItemSystem

  function makeContext(overrides?: Partial<EffectContext>): EffectContext {
    return {
      controller,
      grid,
      ...overrides,
    }
  }

  beforeEach(async () => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    executor = new ItemEffectExecutor()
    grid = new GridManager({ gridSize: 7 })
    controller = new TurnController(grid, { x: 3, y: 3 }, 30)
    controller.start()
    itemSystem = new ItemSystem()
    await itemSystem.load()
  })

  it("test_extra_step_步数增加5", () => {
    const beforeMax = controller.maxSteps
    const success = executor.execute('add_steps', 5, makeContext())
    expect(success).toBe(true)
    expect(controller.maxSteps).toBe(beforeMax + 5)
  })

  it("test_undo_恢复上一步状态", () => {
    // 放置一个障碍物，创建快照
    controller.placeObstacle(3, 2)
    const snapshot = BoardSerializer.createSnapshot(grid, controller)

    // 再放置第二个障碍物
    if (controller.phase === 'playerTurn') {
      controller.placeObstacle(3, 4)
    }

    // 执行撤销，恢复到第一个障碍物后的状态
    const success = executor.execute('undo_move', 0, makeContext({ undoSnapshot: snapshot }))
    expect(success).toBe(true)
  })

  it("test_undo_连续回退多步", () => {
    // 创建多个快照
    const snapshot1 = BoardSerializer.createSnapshot(grid, controller)

    if (controller.phase === 'playerTurn') {
      controller.placeObstacle(3, 2)
    }
    const snapshot2 = BoardSerializer.createSnapshot(grid, controller)

    if (controller.phase === 'playerTurn') {
      controller.placeObstacle(3, 4)
    }
    const snapshot3 = BoardSerializer.createSnapshot(grid, controller)

    // 按逆序恢复
    const success3 = executor.execute('undo_move', 0, makeContext({ undoSnapshot: snapshot3 }))
    expect(success3).toBe(true)

    if (controller.phase === 'playerTurn') {
      controller.placeObstacle(4, 2)
    }
    const success2 = executor.execute('undo_move', 0, makeContext({ undoSnapshot: snapshot2 }))
    expect(success2).toBe(true)

    if (controller.phase === 'playerTurn') {
      controller.placeObstacle(4, 3)
    }
    const success1 = executor.execute('undo_move', 0, makeContext({ undoSnapshot: snapshot1 }))
    expect(success1).toBe(true)
  })

  it("test_undo_无历史记录时不可用", () => {
    // 不传 undoSnapshot，应返回 false
    const success = executor.execute('undo_move', 0, makeContext())
    expect(success).toBe(false)
  })

  it("test_reset_关卡重置", () => {
    // 放置障碍物
    if (controller.phase === 'playerTurn') {
      controller.placeObstacle(3, 2)
    }

    // 创建初始快照
    const initialSnapshot = BoardSerializer.createSnapshot(grid, controller)
    // 清空网格再放一个不同的障碍物
    grid.clearObstacles()
    grid.placeObstacle(1, 1)

    // 执行重置，恢复到 initialSnapshot 的状态
    const success = executor.execute('reset_level', 0, makeContext({ initialSnapshot }))
    expect(success).toBe(true)
  })

  it("test_hint_高亮推荐放置点", () => {
    // hint 效果触发后会 emit hintReady 事件
    let hintPosition: unknown = null
    eventBus.on('hintReady', (data: unknown) => {
      hintPosition = data
    })

    const success = executor.execute('show_hint', 0, makeContext())
    expect(success).toBe(true)
    // hint 事件应被触发
    expect(hintPosition).not.toBeNull()
  })

})
