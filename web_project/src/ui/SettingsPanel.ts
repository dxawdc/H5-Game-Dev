// SettingsPanel.ts
// 职责：设置面板，含音效/震动开关、退出挑战确认对话框、版本信息，Canvas渲染
// 依赖：GameData, EventBus, SceneManager

import { GameData } from '../core/GameData'
import { eventBus } from '../core/EventBus'

const CANVAS_WIDTH = 648
const CANVAS_HEIGHT = 1152

const PANEL_WIDTH = 400
const PANEL_HEIGHT = 380
const PANEL_X = (CANVAS_WIDTH - PANEL_WIDTH) / 2
const PANEL_Y = (CANVAS_HEIGHT - PANEL_HEIGHT) / 2

const DIALOG_WIDTH = 320
const DIALOG_HEIGHT = 180
const DIALOG_X = (CANVAS_WIDTH - DIALOG_WIDTH) / 2
const DIALOG_Y = (CANVAS_HEIGHT - DIALOG_HEIGHT) / 2

export class SettingsPanel {
  private _isOpen: boolean = false
  private _isInGame: boolean = false
  private _showExitDialog: boolean = false

  /** 打开面板 */
  open(isInGame: boolean): void {
    this._isOpen = true
    this._isInGame = isInGame
    this._showExitDialog = false
  }

  /** 关闭面板 */
  close(): void {
    this._isOpen = false
    this._showExitDialog = false
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  get isShowingExitDialog(): boolean {
    return this._showExitDialog
  }

  /** 更新（预留动画） */
  update(_deltaTime: number): void {
    // 未来可添加过渡动画
  }

  /** 渲染面板 */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this._isOpen) return

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (this._showExitDialog) {
      this._renderExitDialog(ctx)
      return
    }

    this._renderPanel(ctx)
  }

  /** 渲染设置面板 */
  private _renderPanel(ctx: CanvasRenderingContext2D): void {
    // 面板背景
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    this._roundRect(ctx, PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 16)
    ctx.fill()

    // 面板阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4
    ctx.strokeStyle = '#EEEEEE'
    ctx.lineWidth = 1
    ctx.beginPath()
    this._roundRect(ctx, PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 16)
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // 标题
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('设置', CANVAS_WIDTH / 2, PANEL_Y + 40)

    // 关闭按钮
    ctx.fillStyle = '#999999'
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✕', PANEL_X + PANEL_WIDTH - 28, PANEL_Y + 32)

    // 音效开关
    this._renderToggle(ctx, PANEL_X + 40, PANEL_Y + 100, '音效', GameData.soundEnabled)

    // 震动开关
    this._renderToggle(ctx, PANEL_X + 40, PANEL_Y + 170, '震动', GameData.vibrationEnabled)

    // 退出挑战按钮（仅游戏内显示）
    if (this._isInGame) {
      const btnX = PANEL_X + 40
      const btnY = PANEL_Y + 250
      const btnW = PANEL_WIDTH - 80
      const btnH = 50

      ctx.fillStyle = '#E53935'
      ctx.beginPath()
      this._roundRect(ctx, btnX, btnY, btnW, btnH, 25)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('退出挑战', btnX + btnW / 2, btnY + btnH / 2)
    }

    // 版本号
    ctx.fillStyle = '#BBBBBB'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText('版本 0.1.0', CANVAS_WIDTH / 2, PANEL_Y + PANEL_HEIGHT - 16)
  }

  /** 渲染开关组件 */
  private _renderToggle(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, enabled: boolean): void {
    // 标签文字
    ctx.fillStyle = '#333333'
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x, y + 16)

    // 开关背景
    const toggleX = x + 180
    const toggleW = 60
    const toggleH = 30
    const toggleR = 15

    ctx.fillStyle = enabled ? '#4CAF50' : '#BDBDBD'
    ctx.beginPath()
    this._roundRect(ctx, toggleX, y + 1, toggleW, toggleH, toggleR)
    ctx.fill()

    // 开关滑块
    const knobR = toggleH / 2 - 4
    const knobX = enabled ? toggleX + toggleW - toggleH + 4 : toggleX + 4
    const knobY = y + 1 + toggleH / 2

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(knobX + knobR, knobY, knobR, 0, Math.PI * 2)
    ctx.fill()

    // 滑块阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1
    ctx.beginPath()
    ctx.arc(knobX + knobR, knobY, knobR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  /** 渲染退出确认对话框 */
  private _renderExitDialog(ctx: CanvasRenderingContext2D): void {
    // 对话框背景
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    this._roundRect(ctx, DIALOG_X, DIALOG_Y, DIALOG_WIDTH, DIALOG_HEIGHT, 16)
    ctx.fill()

    // 阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4
    ctx.strokeStyle = '#EEEEEE'
    ctx.lineWidth = 1
    ctx.beginPath()
    this._roundRect(ctx, DIALOG_X, DIALOG_Y, DIALOG_WIDTH, DIALOG_HEIGHT, 16)
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // 提示文字
    ctx.fillStyle = '#333333'
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('确定退出当前挑战吗？', CANVAS_WIDTH / 2, DIALOG_Y + 65)

    // 取消按钮
    const cancelBtnX = DIALOG_X + 28
    const cancelBtnY = DIALOG_Y + 110
    const cancelBtnW = 120
    const cancelBtnH = 46

    ctx.fillStyle = '#BDBDBD'
    ctx.beginPath()
    this._roundRect(ctx, cancelBtnX, cancelBtnY, cancelBtnW, cancelBtnH, 23)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('取消', cancelBtnX + cancelBtnW / 2, cancelBtnY + cancelBtnH / 2)

    // 确定按钮
    const confirmBtnX = DIALOG_X + DIALOG_WIDTH - 28 - 120
    const confirmBtnY = DIALOG_Y + 110
    const confirmBtnW = 120
    const confirmBtnH = 46

    ctx.fillStyle = '#E53935'
    ctx.beginPath()
    this._roundRect(ctx, confirmBtnX, confirmBtnY, confirmBtnW, confirmBtnH, 23)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('确定', confirmBtnX + confirmBtnW / 2, confirmBtnY + confirmBtnH / 2)
  }

  /** 处理点击事件，返回 true 表示消费了事件 */
  handleClick(x: number, y: number): boolean {
    if (!this._isOpen) return false

    // 退出确认对话框模式
    if (this._showExitDialog) {
      return this._handleExitDialogClick(x, y)
    }

    // 关闭按钮
    if (this._isPointInRect(x, y, PANEL_X + PANEL_WIDTH - 48, PANEL_Y + 8, 40, 40)) {
      this.close()
      return true
    }

    // 音效开关
    if (this._isPointInRect(x, y, PANEL_X + 220, PANEL_Y + 100, 60, 32)) {
      GameData.soundEnabled = !GameData.soundEnabled
      GameData.saveToLocalStorage()
      return true
    }

    // 震动开关
    if (this._isPointInRect(x, y, PANEL_X + 220, PANEL_Y + 170, 60, 32)) {
      GameData.vibrationEnabled = !GameData.vibrationEnabled
      if (GameData.vibrationEnabled && typeof wx !== 'undefined') {
        try {
          wx.vibrateShort({ type: 'medium' })
        } catch (e) {
          console.warn('SettingsPanel: 震动反馈失败', e)
        }
      }
      GameData.saveToLocalStorage()
      return true
    }

    // 退出挑战按钮（仅游戏内）
    if (this._isInGame) {
      const btnX = PANEL_X + 40
      const btnY = PANEL_Y + 250
      const btnW = PANEL_WIDTH - 80
      const btnH = 50
      if (this._isPointInRect(x, y, btnX, btnY, btnW, btnH)) {
        this._showExitDialog = true
        return true
      }
    }

    // 点击遮罩关闭面板
    return true
  }

  /** 处理退出确认对话框的点击 */
  private _handleExitDialogClick(x: number, y: number): boolean {
    // 取消按钮
    const cancelBtnX = DIALOG_X + 28
    const cancelBtnY = DIALOG_Y + 110
    const cancelBtnW = 120
    const cancelBtnH = 46
    if (this._isPointInRect(x, y, cancelBtnX, cancelBtnY, cancelBtnW, cancelBtnH)) {
      this._showExitDialog = false
      return true
    }

    // 确定按钮
    const confirmBtnX = DIALOG_X + DIALOG_WIDTH - 28 - 120
    const confirmBtnY = DIALOG_Y + 110
    const confirmBtnW = 120
    const confirmBtnH = 46
    if (this._isPointInRect(x, y, confirmBtnX, confirmBtnY, confirmBtnW, confirmBtnH)) {
      this._showExitDialog = false
      this._isOpen = false
      // 派发退出挑战事件，GameScene 监听并处理场景切换
      eventBus.emit('exitChallenge')
      return true
    }

    return true
  }

  /** 判断点是否在矩形区域内 */
  private _isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
  }

  /** 绘制圆角矩形路径 */
  private _roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }
}
