// ItemBar.ts
// 职责：游戏底部道具栏 UI 组件，显示 4 个道具槽位
// 依赖：ItemSystem, InGameItemManager, PlaceholderAssets

import { ItemSystem, InGameItemManager } from '../systems/ItemSystem'
import { PlaceholderAssets } from '../core/PlaceholderAssets'

export interface ItemSlotInfo {
  itemId: string
  state: 'available' | 'unavailable' | 'exhausted'
  count: number
  acquisitionMethod: string
}

export interface ItemBarClickResult {
  itemId: string
  action: 'use' | 'acquire'
}

export class ItemBar {
  private _itemSystem: ItemSystem
  private _itemManager: InGameItemManager
  private _slotCount: number = 4
  private _itemIds: string[] = []
  private _minTouchSize: number = 88

  constructor(itemSystem: ItemSystem, itemManager: InGameItemManager) {
    this._itemSystem = itemSystem
    this._itemManager = itemManager
    this._itemIds = itemSystem.getAllItemDefs().map(def => def.id)
  }

  get slotCount(): number {
    return this._slotCount
  }

  get minTouchSize(): number {
    return this._minTouchSize
  }

  /** 计算单槽像素尺寸 */
  getSlotSize(barWidth: number): number {
    const slotWidth = barWidth / this._slotCount
    return Math.max(this._minTouchSize, slotWidth - 8)
  }

  /** 获取所有道具槽位信息 */
  getSlotInfos(): ItemSlotInfo[] {
    return this._itemIds.map(itemId => {
      const def = this._itemSystem.getItemDef(itemId)
      if (!def) {
        return { itemId, state: 'exhausted' as const, count: 0, acquisitionMethod: 'share' }
      }

      const inventory = this._itemSystem.getInventory(itemId)
      const usage = this._itemManager.getSessionUsage(itemId)
      const exhausted = usage >= def.perSessionLimit
      const acquisitionMethod = this._itemSystem.getAcquisitionMethod(itemId)

      let state: 'available' | 'unavailable' | 'exhausted'
      if (exhausted) {
        state = 'exhausted'
      } else if (inventory > 0) {
        state = 'available'
      } else {
        state = 'unavailable'
      }

      return { itemId, state, count: inventory, acquisitionMethod }
    })
  }

  /** 渲染道具栏 */
  render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    const slotSize = this.getSlotSize(width)
    const infos = this.getSlotInfos()

    ctx.save()
    for (let i = 0; i < this._slotCount; i++) {
      const slotWidth = width / this._slotCount
      const slotX = x + i * slotWidth + (slotWidth - slotSize) / 2
      this._drawSlot(ctx, slotX, y, slotSize, infos[i])
    }
    ctx.restore()
  }

  /** 绘制单个道具槽位 */
  private _drawSlot(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, info: ItemSlotInfo): void {
    const def = this._itemSystem.getItemDef(info.itemId)
    if (!def) return

    const isExhausted = info.state === 'exhausted'
    const isUnavailable = info.state === 'unavailable'
    const iconColor = this._getIconColor(info.itemId)

    // 背景
    const borderRadius = 12
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, borderRadius)

    if (isExhausted) {
      ctx.fillStyle = '#E0E0E0'
      ctx.fill()
    } else {
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.strokeStyle = iconColor
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 内部图标区域
    const cx = x + size / 2
    const cy = y + size / 2
    const iconSize = size * 0.45

    if (isExhausted || isUnavailable) {
      // 显示 "+" 获取按钮
      ctx.fillStyle = isExhausted ? '#BDBDBD' : iconColor
      ctx.font = `bold ${iconSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', cx, cy)
    } else {
      // 显示道具彩色圆形图标
      ctx.beginPath()
      ctx.arc(cx, cy, iconSize * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = iconColor
      ctx.fill()

      // 图标内标识文字
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `bold ${iconSize * 0.55}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(this._getShortLabel(info.itemId), cx, cy)

      // 右上角数量角标
      if (info.count > 0) {
        this._drawBadge(ctx, x + size - 4, y + 4, info.count)
      }
    }
  }

  /** 绘制数量角标 */
  private _drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, count: number): void {
    const text = `${count}`
    const fontSize = 13
    const padding = 4
    ctx.font = `bold ${fontSize}px sans-serif`
    const textWidth = ctx.measureText(text).width
    const badgeWidth = Math.max(20, textWidth + padding * 2)
    const badgeHeight = 20
    const radius = badgeHeight / 2

    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    ctx.roundRect(x - badgeWidth, y, badgeWidth, badgeHeight, radius)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x - badgeWidth / 2, y + badgeHeight / 2)
  }

  /** 获取道具对应图标颜色 */
  private _getIconColor(itemId: string): string {
    return PlaceholderAssets.getEntityColor(`item_${itemId}`)
  }

  /** 获取道具短标签文字 */
  private _getShortLabel(itemId: string): string {
    const labels: Record<string, string> = {
      extra_step: '步',
      undo: '退',
      reset: '重',
      hint: '?',
    }
    return labels[itemId] || '?'
  }

  /** 触控命中检测 */
  handleClick(touchX: number, touchY: number, barX: number, barY: number, barWidth: number): ItemBarClickResult | null {
    const slotSize = this.getSlotSize(barWidth)
    const infos = this.getSlotInfos()

    for (let i = 0; i < this._slotCount; i++) {
      const slotWidth = barWidth / this._slotCount
      const slotX = barX + i * slotWidth + (slotWidth - slotSize) / 2

      if (touchX >= slotX && touchX <= slotX + slotSize &&
          touchY >= barY && touchY <= barY + slotSize) {
        const info = infos[i]
        if (info.state === 'available') {
          return { itemId: info.itemId, action: 'use' }
        } else if (info.state === 'unavailable') {
          return { itemId: info.itemId, action: 'acquire' }
        }
        // exhausted 状态无操作
        return null
      }
    }
    return null
  }
}
