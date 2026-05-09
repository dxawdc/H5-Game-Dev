// test_item_system.ts
// 测试任务：实现道具配置加载器和库存管理
// 验收条件：['加载 items.json 和 shop_config.json 配置正确', '库存管理支持增/减/查且上限为 10', '每日 UTC+8 0点自动重置获取次数']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { ItemSystem } from '../src/systems/ItemSystem'

describe("实现道具配置加载器和库存管理", () => {
  let itemSystem: ItemSystem

  beforeEach(async () => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    itemSystem = new ItemSystem()
    await itemSystem.load()
  })

  it("test_道具配置_四类道具定义完整", () => {
    const defs = itemSystem.getAllItemDefs()
    expect(defs).toHaveLength(4)

    const ids = defs.map(d => d.id).sort()
    expect(ids).toEqual(['extra_step', 'hint', 'reset', 'undo'])

    // 验证各道具属性
    const stepDef = itemSystem.getItemDef('extra_step')
    expect(stepDef).toBeDefined()
    expect(stepDef!.name).toBe('多走1步')
    expect(stepDef!.inventoryCap).toBe(10)
    expect(stepDef!.effectType).toBe('add_steps')
    expect(stepDef!.effectValue).toBe(5)

    const undoDef = itemSystem.getItemDef('undo')
    expect(undoDef).toBeDefined()
    expect(undoDef!.perSessionLimit).toBe(3)
    expect(undoDef!.effectType).toBe('undo_move')
  })

  it("test_库存_增加减少查询", () => {
    // ItemSystem.load() gives initial gift of 1 per item
    // So starting inventory for extra_step is 1

    // 增加道具
    const added = itemSystem.addToInventory('extra_step', 3)
    expect(added).toBe(3)
    expect(itemSystem.getInventory('extra_step')).toBe(4)

    // 再增加
    itemSystem.addToInventory('extra_step', 2)
    expect(itemSystem.getInventory('extra_step')).toBe(6)

    // 扣除
    const removed = itemSystem.removeFromInventory('extra_step', 2)
    expect(removed).toBe(true)
    expect(itemSystem.getInventory('extra_step')).toBe(4)

    // 扣除超出库存应失败
    const overRemove = itemSystem.removeFromInventory('extra_step', 10)
    expect(overRemove).toBe(false)
    expect(itemSystem.getInventory('extra_step')).toBe(4)
  })

  it("test_库存上限_达上限不再增加", () => {
    // ItemSystem.load() gives initial gift of 1 per item
    // So starting inventory for extra_step is 1 (cap is 10, room for 9 more)

    const added1 = itemSystem.addToInventory('extra_step', 8)
    expect(added1).toBe(8)

    const added2 = itemSystem.addToInventory('extra_step', 5)
    // At 9 now, can only add 1 to reach cap 10
    expect(added2).toBe(1)
    expect(itemSystem.getInventory('extra_step')).toBe(10)

    // 已达上限，再增加返回 0
    const added3 = itemSystem.addToInventory('extra_step', 1)
    expect(added3).toBe(0)
    expect(itemSystem.getInventory('extra_step')).toBe(10)
  })

  it("test_每日刷新_UTC+8重置", () => {
    // 设置 dailyShareCount 和 dailyAdCount
    GameData.dailyShareCount = 1
    GameData.dailyAdCount = 2

    // 更新 localStorage 的日期为昨天，触发重置
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`
    localStorage.setItem('itemDailyResetDate', yesterdayStr)

    // 执行重置检查
    itemSystem.checkDailyReset()

    // 检查是否被重置
    expect(GameData.dailyShareCount).toBe(0)
    expect(GameData.dailyAdCount).toBe(0)

    // 今天的日期应该已更新
    const now = new Date()
    const todayUTC8 = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    expect(localStorage.getItem('itemDailyResetDate')).toBe(todayUTC8)
  })

  it("test_道具获取方式_从配置读取", () => {
    expect(itemSystem.getAcquisitionMethod('extra_step')).toBe('share')
    expect(itemSystem.getAcquisitionMethod('undo')).toBe('share')
    expect(itemSystem.getAcquisitionMethod('reset')).toBe('ad')
    expect(itemSystem.getAcquisitionMethod('hint')).toBe('ad')
  })

})
