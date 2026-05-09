// test_data_files.ts
// 测试任务：创建所有数据 JSON 文件
// 验收条件：['所有 data_files 中的文件存在且是合法 JSON', 'levels.json 包含 gridSize bossStart exits initialObstacles maxSteps 字段', 'items.json 包含四种道具类型及每局限次配置']

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../src/data')

describe("创建所有数据 JSON 文件", () => {

  it("test_levels_json_结构完整", () => {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'levels.json'), 'utf-8')
    const data = JSON.parse(raw)
    expect(data.levels).toBeInstanceOf(Array)
    expect(data.levels.length).toBeGreaterThanOrEqual(2)

    for (const level of data.levels) {
      expect(level.id).toBeDefined()
      expect(level.gridSize).toBeDefined()
      expect(level.bossStart).toBeDefined()
      expect(level.bossStart.r).toBeDefined()
      expect(level.bossStart.c).toBeDefined()
      expect(level.exits).toBeDefined()
      expect(level.maxSteps).toBeDefined()
    }

    // 第一关 gridSize 应为 7
    expect(data.levels[0].id).toBe(1)
    expect(data.levels[0].gridSize).toBe(7)
    // 第二关 gridSize 应为 9
    expect(data.levels[1].id).toBe(2)
    expect(data.levels[1].gridSize).toBe(9)
  })

  it("test_items_json_四类道具定义", () => {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'items.json'), 'utf-8')
    const data = JSON.parse(raw)
    expect(data.items).toBeInstanceOf(Array)
    expect(data.items).toHaveLength(4)

    const itemIds = data.items.map((i: { id: string }) => i.id)
    expect(itemIds).toContain('extra_step')
    expect(itemIds).toContain('undo')
    expect(itemIds).toContain('reset')
    expect(itemIds).toContain('hint')

    for (const item of data.items) {
      expect(item.perSessionLimit).toBeDefined()
      expect(item.inventoryCap).toBe(10)
      expect(item.effectType).toBeDefined()
    }
  })

  it("test_shop_config_json_获取方式配置", () => {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'shop_config.json'), 'utf-8')
    const data = JSON.parse(raw)
    expect(data.acquisitionMap).toBeDefined()
    expect(data.acquisitionMap.extra_step).toBe('share')
    expect(data.acquisitionMap.undo).toBe('share')
    expect(data.acquisitionMap.reset).toBe('ad')
    expect(data.acquisitionMap.hint).toBe('ad')
    expect(data.dailyLimits).toBeDefined()
    expect(data.dailyLimits.share).toBe(1)
    expect(data.dailyLimits.ad).toBe(3)
    expect(data.cooldownSeconds).toBe(30)
    expect(data.initialGift).toBeDefined()
  })

  it("test_JSON文件合法可解析", () => {
    const files = ['levels.json', 'items.json', 'shop_config.json']
    for (const file of files) {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8')
      expect(() => JSON.parse(raw)).not.toThrow()
    }
  })

})
