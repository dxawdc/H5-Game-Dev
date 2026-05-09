// ItemPopup.ts
// 职责：道具获取弹窗，展示获取方式并提供操作按钮
// 依赖：ItemSystem, EventBus, PlaceholderAssets

import { ItemSystem } from '../systems/ItemSystem'
import { eventBus } from '../core/EventBus'
import { PlaceholderAssets } from '../core/PlaceholderAssets'

export interface PopupResult {
  action: 'share' | 'ad' | 'close'
  itemId: string
}

export class ItemPopup {
  private _itemSystem: ItemSystem
  private _itemId: string = ''
  private _visible: boolean = false
  private _closeBtnRect: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 }
  private _actionBtnRect: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 }

  constructor(itemSystem: ItemSystem) {
    this._itemSystem = itemSystem
  }

  /** 显示弹窗 */
  show(itemId: string): void {
    this._itemId = itemId
    this._visible = true
    eventBus.emit('popupOpened', { type: 'itemAcquisition', itemId })
  }

  /** 隐藏弹窗 */
  hide(): void {
    this._visible = false
    this._itemId = ''
    eventBus.emit('popupClosed', { type: 'itemAcquisition' })
  }

  get visible(): boolean {
    return this._visible
  }

  get currentItemId(): string {
    return this._itemId
  }

  /** 渲染弹窗 */
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this._visible) return

    const def = this._itemSystem.getItemDef(this._itemId)
    if (!def) return

    // 半透明背景遮罩
    ctx.fillStyle = PlaceholderAssets.getBackgroundColor('item_popup')
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 弹窗尺寸
    const popupW = 400
    const popupH = 300
    const popupX = (canvasWidth - popupW) / 2
    const popupY = (canvasHeight - popupH) / 2

    // 弹窗背景
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(popupX, popupY, popupW, popupH, 16)
    ctx.fill()

    // 道具图标（圆形色块）
    const iconCX = popupX + popupW / 2
    const iconCY = popupY + 60
    const iconRadius = 28
    const iconColor = PlaceholderAssets.getEntityColor(`item_${this._itemId}`)
    ctx.beginPath()
    ctx.arc(iconCX, iconCY, iconRadius, 0, Math.PI * 2)
    ctx.fillStyle = iconColor
    ctx.fill()

    // 道具名称
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(def.name, popupX + popupW / 2, popupY + 100)

    // 道具描述
    ctx.fillStyle = '#666666'
    ctx.font = '16px sans-serif'
    ctx.textBaseline = 'top'
    ctx.fillText(def.description, popupX + popupW / 2, popupY + 135)

    // 获取方式
    const method = this._itemSystem.getAcquisitionMethod(this._itemId)

    // 操作按钮
    const btnW = 200
    const btnH = 56
    const btnX = popupX + (popupW - btnW) / 2
    const btnY = popupY + popupH - 105

    this._actionBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH }

    ctx.beginPath()
    ctx.roundRect(btnX, btnY, btnW, btnH, 28)

    if (method === 'ad') {
      ctx.fillStyle = '#4CAF50'
    } else {
      ctx.fillStyle = '#FF6B35'
    }
    ctx.fill()

    const canUse = method === 'share'
      ? this._itemSystem.canShareToday()
      : this._itemSystem.canWatchAdToday()

    const btnText = method === 'ad' ? '观看广告获取' : '分享获取'
    ctx.fillStyle = canUse ? '#FFFFFF' : '#BDBDBD'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(btnText, btnX + btnW / 2, btnY + btnH / 2)

    if (!canUse) {
      ctx.fillStyle = '#999999'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const limitText = method === 'share' ? '今日分享次数已用完' : '今日观看次数已用完'
      ctx.fillText(limitText, popupX + popupW / 2, btnY + btnH + 12)
    }

    // 关闭按钮 (X)
    const closeBtnSize = 36
    const closeBtnX = popupX + popupW - closeBtnSize - 10
    const closeBtnY = popupY + 10
    this._closeBtnRect = { x: closeBtnX, y: closeBtnY, w: closeBtnSize, h: closeBtnSize }

    ctx.strokeStyle = '#999999'
    ctx.lineWidth = 2
    const pad = 10
    ctx.beginPath()
    ctx.moveTo(closeBtnX + pad, closeBtnY + pad)
    ctx.lineTo(closeBtnX + closeBtnSize - pad, closeBtnY + closeBtnSize - pad)
    ctx.moveTo(closeBtnX + closeBtnSize - pad, closeBtnY + pad)
    ctx.lineTo(closeBtnX + pad, closeBtnY + closeBtnSize - pad)
    ctx.stroke()
  }

  /** 触控处理 */
  handleClick(touchX: number, touchY: number): PopupResult | null {
    if (!this._visible) return null

    // 检查关闭按钮
    const cb = this._closeBtnRect
    if (touchX >= cb.x && touchX <= cb.x + cb.w && touchY >= cb.y && touchY <= cb.y + cb.h) {
      this.hide()
      return { action: 'close', itemId: this._itemId }
    }

    // 检查操作按钮
    const ab = this._actionBtnRect
    if (touchX >= ab.x && touchX <= ab.x + ab.w && touchY >= ab.y && touchY <= ab.y + ab.h) {
      const method = this._itemSystem.getAcquisitionMethod(this._itemId)

      // 检查是否还有可用次数
      if (method === 'share' && !this._itemSystem.canShareToday()) return null
      if (method === 'ad' && !this._itemSystem.canWatchAdToday()) return null

      this.hide()
      return { action: method as 'share' | 'ad', itemId: this._itemId }
    }

    return null
  }
}
