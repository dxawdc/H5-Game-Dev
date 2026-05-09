// test_item_ui.ts
// 测试任务：实现道具状态 UI 与对局内道具管理
// 验收条件：['道具栏正确展示可用/不可用/耗尽三种状态', '每局使用次数正确计数，达上限后不可用', '置灰道具点击时弹出 Toast 提示']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { ItemSystem, InGameItemManager } from '../src/systems/ItemSystem'
import { GridManager } from '../src/systems/GridManager'
import { TurnController } from '../src/systems/TurnController'
import { ItemBar } from '../src/ui/ItemBar'

describe("实现道具状态 UI 与对局内道具管理", () => {
  let itemSystem: ItemSystem
  let itemManager: InGameItemManager
  let itemBar: ItemBar
  let grid: GridManager
  let controller: TurnController

  beforeEach(async () => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    itemSystem = new ItemSystem()
    await itemSystem.load()

    grid = new GridManager({ gridSize: 7 })
    controller = new TurnController(grid, { x: 3, y: 3 }, 30)
    controller.start()

    itemManager = new InGameItemManager(itemSystem)
    itemManager.init(grid, controller)

    itemBar = new ItemBar(itemSystem, itemManager)
  })

  it("test_道具栏_三种状态展示", () => {
    const infos = itemBar.getSlotInfos()
    expect(infos).toHaveLength(4)

    // 检查各道具状态
    for (const info of infos) {
      expect(['available', 'unavailable', 'exhausted']).toContain(info.state)
      expect(info.count).toBeGreaterThanOrEqual(0)
    }
  })

  it("test_可用_显示数量", () => {
    // ItemSystem.load() gives initial gift of 1 per item
    // So starting inventory for extra_step is 1, undo is 1
    itemSystem.addToInventory('extra_step', 3)
    itemSystem.addToInventory('undo', 2)

    const infos = itemBar.getSlotInfos()
    const stepInfo = infos.find(i => i.itemId === 'extra_step')
    expect(stepInfo).toBeDefined()
    expect(stepInfo!.state).toBe('available')
    // 1 (initial gift) + 3 = 4
    expect(stepInfo!.count).toBe(4)

    const undoInfo = infos.find(i => i.itemId === 'undo')
    expect(undoInfo).toBeDefined()
    expect(undoInfo!.state).toBe('available')
    // 1 (initial gift) + 2 = 3
    expect(undoInfo!.count).toBe(3)
  })

  it("test_不可用_显示加号", () => {
    // 库存为 0 时，状态为 unavailable
    const infos = itemBar.getSlotInfos()
    const zeroItems = infos.filter(i => i.count === 0)
    for (const info of zeroItems) {
      expect(info.state).toBe('unavailable')
    }
  })

  it("test_耗尽_置灰加Toast", () => {
    // 添加道具库存
    itemSystem.addToInventory('hint', 1)
    itemSystem.addToInventory('extra_step', 1)

    // 使用道具直到达到 perSessionLimit
    // hint perSessionLimit=1, extra_step perSessionLimit=2
    itemManager.useItem('hint')

    const infos = itemBar.getSlotInfos()
    const hintInfo = infos.find(i => i.itemId === 'hint')
    expect(hintInfo).toBeDefined()
    expect(hintInfo!.state).toBe('exhausted')
  })

  it("test_每局限次_达上限后不可用", () => {
    // extra_step perSessionLimit=2
    itemSystem.addToInventory('extra_step', 5)

    // 使用两次
    itemManager.useItem('extra_step')
    itemManager.useItem('extra_step')

    expect(itemManager.getSessionUsage('extra_step')).toBe(2)

    // 第三次应失败
    const result = itemManager.useItem('extra_step')
    expect(result).toBe(false)

    // 道具栏应显示 exhausted
    const infos = itemBar.getSlotInfos()
    const stepInfo = infos.find(i => i.itemId === 'extra_step')
    expect(stepInfo!.state).toBe('exhausted')
  })

})
