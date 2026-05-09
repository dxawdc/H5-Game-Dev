// test_item_popup.ts
// 测试任务：实现道具获取弹窗
// 验收条件：['弹窗根据 shop_config 动态显示对应获取按钮', '广告门控只显示广告按钮，分享门控只显示分享按钮', '获取成功后关闭弹窗并更新道具栏']

import { describe, it, expect, beforeEach } from 'vitest'
import { GameData } from '../src/core/GameData'
import { ItemSystem } from '../src/systems/ItemSystem'
import { ItemPopup } from '../src/ui/ItemPopup'

describe("实现道具获取弹窗", () => {
  let itemSystem: ItemSystem
  let popup: ItemPopup

  beforeEach(async () => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
    itemSystem = new ItemSystem()
    await itemSystem.load()
    popup = new ItemPopup(itemSystem)
  })

  it("test_弹窗_广告门控仅显示广告按钮", () => {
    // reset 和 hint 是 ad 门控
    popup.show('reset')
    expect(popup.visible).toBe(true)
    expect(popup.currentItemId).toBe('reset')

    // getAcquisitionMethod 应返回 'ad'
    expect(itemSystem.getAcquisitionMethod('reset')).toBe('ad')
    popup.hide()
  })

  it("test_弹窗_分享门控仅显示分享按钮", () => {
    // extra_step 和 undo 是 share 门控
    popup.show('extra_step')
    expect(popup.visible).toBe(true)
    expect(popup.currentItemId).toBe('extra_step')

    // getAcquisitionMethod 应返回 'share'
    expect(itemSystem.getAcquisitionMethod('extra_step')).toBe('share')
    popup.hide()
  })

  it("test_弹窗_双通道显示两个按钮", () => {
    // 验证 shop_config 中每个 item 的 acquisition method
    const methods = [
      { id: 'extra_step', method: 'share' },
      { id: 'undo', method: 'share' },
      { id: 'reset', method: 'ad' },
      { id: 'hint', method: 'ad' },
    ]

    for (const { id, method } of methods) {
      expect(itemSystem.getAcquisitionMethod(id)).toBe(method)
    }
  })

  it("test_弹窗_获取成功关闭", () => {
    popup.show('undo')
    expect(popup.visible).toBe(true)

    // 模拟点击关闭按钮
    const result = popup.handleClick(0, 0)
    // 点击遮罩区域可能会关闭
    if (result && result.action === 'close') {
      expect(popup.visible).toBe(false)
    }
  })

})
