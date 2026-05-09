// test_step_serializer.ts
// 测试任务：实现步数计数器与棋盘序列化器

import { describe, it, expect, beforeEach } from 'vitest'
import { GridManager } from '../src/systems/GridManager'
import { StepCounter } from '../src/systems/StepCounter'
import { BoardSerializer } from '../src/systems/BoardSerializer'
import { TurnController } from '../src/systems/TurnController'

describe('StepCounter', () => {
  let counter: StepCounter

  beforeEach(() => {
    counter = new StepCounter(30)
  })

  it('初始值正确', () => {
    expect(counter.currentStep).toBe(0)
    expect(counter.maxSteps).toBe(30)
    expect(counter.stepsRemaining).toBe(30)
    expect(counter.isExhausted).toBe(false)
  })

  it('advance递增步数', () => {
    counter.advance()
    expect(counter.currentStep).toBe(1)
    expect(counter.stepsRemaining).toBe(29)
  })

  it('步数耗尽时isExhausted返回true', () => {
    const small = new StepCounter(3)
    small.advance()
    small.advance()
    small.advance()
    expect(small.isExhausted).toBe(true)
  })

  it('addMaxSteps增加上限', () => {
    counter.addMaxSteps(5)
    expect(counter.maxSteps).toBe(35)
    expect(counter.stepsRemaining).toBe(35)
  })

  it('reset重置步数', () => {
    counter.advance()
    counter.advance()
    counter.reset(20)
    expect(counter.currentStep).toBe(0)
    expect(counter.maxSteps).toBe(20)
  })

  it('getProgressPercent返回正确百分比', () => {
    expect(counter.getProgressPercent()).toBe(0)
    counter.advance()
    // 1/30 ≈ 3.33%
    expect(counter.getProgressPercent()).toBeGreaterThanOrEqual(3)
  })

  it('耗尽后advance返回false', () => {
    const small = new StepCounter(1)
    expect(small.advance()).toBe(false)
  })
})

describe('BoardSerializer', () => {
  let grid: GridManager
  let controller: TurnController

  beforeEach(() => {
    grid = new GridManager({ gridSize: 7 })
    controller = new TurnController(grid, { x: 3, y: 3 }, 30)
  })

  it('createSnapshot生成完整快照', () => {
    const snapshot = BoardSerializer.createSnapshot(grid, controller)
    expect(snapshot.obstacles).toBeDefined()
    expect(snapshot.bossPos).toEqual({ x: 3, y: 3 })
    expect(snapshot.currentStep).toBe(0)
    expect(snapshot.maxSteps).toBe(30)
    expect(snapshot.phase).toBe('ready')
    expect(snapshot.timestamp).toBeGreaterThan(0)
  })

  it('序列化与反序列化往返正确', () => {
    const snapshot = BoardSerializer.createSnapshot(grid, controller)
    const json = BoardSerializer.serialize(snapshot)
    const restored = BoardSerializer.deserialize(json)
    expect(restored).not.toBeNull()
    expect(restored!.bossPos).toEqual(snapshot.bossPos)
    expect(restored!.currentStep).toBe(snapshot.currentStep)
    expect(restored!.maxSteps).toBe(snapshot.maxSteps)
  })

  it('非法JSON反序列化返回null', () => {
    const result = BoardSerializer.deserialize('invalid json')
    expect(result).toBeNull()
  })

  it('restoreSnapshot恢复棋盘布局', () => {
    // 放置障碍物
    grid.placeObstacle(2, 2)
    grid.placeObstacle(3, 2)

    const snapshot = BoardSerializer.createSnapshot(grid, controller)

    // 清空并恢复
    const newGrid = new GridManager({ gridSize: 7 })
    BoardSerializer.restoreSnapshot(newGrid, snapshot)

    expect(newGrid.hasObstacle(2, 2)).toBe(true)
    expect(newGrid.hasObstacle(3, 2)).toBe(true)
  })

  it('快照包含步骤和阶段', () => {
    controller.start()
    const snapshot = BoardSerializer.createSnapshot(grid, controller)
    expect(snapshot.phase).toBe('playerTurn')
  })
})
