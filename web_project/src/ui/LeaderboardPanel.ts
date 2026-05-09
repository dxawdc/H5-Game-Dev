// LeaderboardPanel.ts
// 职责：排行榜UI面板，Canvas渲染，支持3个维度标签切换、好友列表展示、空状态、滑入动画
// 依赖：LeaderboardSystem, EventBus

import { LeaderboardSystem, RankingDimension, RankingEntry } from '../systems/LeaderboardSystem'
import { eventBus } from '../core/EventBus'

const CANVAS_WIDTH = 648
const CANVAS_HEIGHT = 1152

const PANEL_WIDTH = 500
const PANEL_HEIGHT = 700
const PANEL_X = CANVAS_WIDTH - PANEL_WIDTH
const PANEL_Y = (CANVAS_HEIGHT - PANEL_HEIGHT) / 2

const TAB_KEYS: RankingDimension[] = ['totalClears', 'minSteps', 'fastestTime']
const TAB_LABELS: Record<RankingDimension, string> = {
  totalClears: '通关数',
  minSteps: '最少步数',
  fastestTime: '最快时间',
}

const ROW_HEIGHT = 60
const TAB_BAR_Y = 80
const LIST_START_Y = TAB_BAR_Y + 60
const LIST_END_Y = PANEL_HEIGHT - 60

export class LeaderboardPanel {
  private _leaderboard: LeaderboardSystem
  private _activeTab: RankingDimension = 'totalClears'
  private _slideOffset: number = PANEL_WIDTH
  private _isAnimating: boolean = false
  private _isVisible: boolean = false
  private _rankingData: RankingEntry[] = []

  constructor(leaderboard: LeaderboardSystem) {
    this._leaderboard = leaderboard
  }

  /** 打开面板 */
  open(): void {
    this._isVisible = true
    this._isAnimating = true
    this._slideOffset = PANEL_WIDTH
    this._refreshData()
  }

  /** 关闭面板 */
  close(): void {
    this._isAnimating = true
  }

  /** 切换标签 */
  switchTab(dimension: RankingDimension): void {
    if (this._activeTab === dimension) return
    this._activeTab = dimension
    this._refreshData()
  }

  get activeTab(): RankingDimension {
    return this._activeTab
  }

  get isVisible(): boolean {
    return this._isVisible
  }

  get isAnimating(): boolean {
    return this._isAnimating
  }

  /** 刷新排行榜数据 */
  private _refreshData(): void {
    this._rankingData = this._leaderboard.getRankingData(this._activeTab)
  }

  /** 更新动画 */
  update(deltaTime: number): void {
    if (!this._isAnimating) return

    const speed = 800 // px/s

    if (this._isVisible) {
      this._slideOffset = Math.max(0, this._slideOffset - deltaTime * speed)
      if (this._slideOffset <= 0) {
        this._slideOffset = 0
        this._isAnimating = false
      }
    } else {
      this._slideOffset = Math.min(PANEL_WIDTH, this._slideOffset + deltaTime * speed)
      if (this._slideOffset >= PANEL_WIDTH) {
        this._slideOffset = PANEL_WIDTH
        this._isAnimating = false
        this._isVisible = false
      }
    }
  }

  /** 渲染面板 */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this._isVisible && this._slideOffset >= PANEL_WIDTH) return

    const offsetX = PANEL_X + this._slideOffset

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 面板背景
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    this._roundRect(ctx, offsetX, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 16)
    ctx.fill()

    // 面板阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetX = -4
    ctx.strokeStyle = '#EEEEEE'
    ctx.lineWidth = 1
    ctx.beginPath()
    this._roundRect(ctx, offsetX, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 16)
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0

    // 标题
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('排行榜', offsetX + PANEL_WIDTH / 2, PANEL_Y + 40)

    // 关闭按钮
    ctx.fillStyle = '#999999'
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✕', offsetX + PANEL_WIDTH - 30, PANEL_Y + 35)

    // 标签栏
    this._renderTabs(ctx, offsetX)

    // 列表
    if (this._rankingData.length <= 1 && this._rankingData[0]?.isSelf) {
      this._renderEmptyState(ctx, offsetX)
    } else {
      this._renderList(ctx, offsetX)
    }
  }

  /** 渲染标签页切换 */
  private _renderTabs(ctx: CanvasRenderingContext2D, offsetX: number): void {
    const tabWidth = PANEL_WIDTH / 3
    const tabY = PANEL_Y + TAB_BAR_Y
    const tabH = 44

    TAB_KEYS.forEach((key, index) => {
      const tabX = offsetX + index * tabWidth
      const isActive = key === this._activeTab

      // 标签背景
      if (isActive) {
        ctx.fillStyle = '#FF6B35'
        ctx.beginPath()
        this._roundRect(ctx, tabX + 8, tabY, tabWidth - 16, tabH, 8)
        ctx.fill()
        ctx.fillStyle = '#FFFFFF'
      } else {
        ctx.fillStyle = '#666666'
      }

      ctx.font = isActive ? 'bold 16px sans-serif' : '15px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(TAB_LABELS[key], tabX + tabWidth / 2, tabY + tabH / 2)
    })
  }

  /** 渲染好友列表 */
  private _renderList(ctx: CanvasRenderingContext2D, offsetX: number): void {
    const startY = PANEL_Y + LIST_START_Y
    const visibleCount = Math.min(this._rankingData.length, Math.floor((LIST_END_Y - LIST_START_Y) / ROW_HEIGHT))

    for (let i = 0; i < visibleCount; i++) {
      const entry = this._rankingData[i]
      const rowY = startY + i * ROW_HEIGHT
      const isSelf = entry.isSelf

      // 自身行高亮背景
      if (isSelf) {
        ctx.fillStyle = '#FFF0E8'
        ctx.beginPath()
        this._roundRect(ctx, offsetX + 16, rowY, PANEL_WIDTH - 32, ROW_HEIGHT - 4, 8)
        ctx.fill()
      }

      // 排名
      ctx.fillStyle = isSelf ? '#FF6B35' : '#999999'
      ctx.font = isSelf ? 'bold 18px sans-serif' : '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const rankText = i < 3 ? ['🥇', '🥈', '🥉'][i] : String(i + 1)
      ctx.fillText(rankText, offsetX + 45, rowY + ROW_HEIGHT / 2)

      // 头像占位（彩色圆形）
      const avatarColors = ['#FF6B35', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63', '#607D8B']
      const avatarColor = avatarColors[i % avatarColors.length]
      ctx.fillStyle = avatarColor
      ctx.beginPath()
      ctx.arc(offsetX + 90, rowY + ROW_HEIGHT / 2, 20, 0, Math.PI * 2)
      ctx.fill()

      // 头像首字母
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(entry.nickName.charAt(0), offsetX + 90, rowY + ROW_HEIGHT / 2)

      // 昵称
      ctx.fillStyle = '#333333'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const displayName = entry.nickName.length > 8 ? entry.nickName.slice(0, 8) + '...' : entry.nickName
      ctx.fillText(displayName, offsetX + 120, rowY + ROW_HEIGHT / 2)

      // 分数
      ctx.fillStyle = isSelf ? '#FF6B35' : '#666666'
      ctx.font = isSelf ? 'bold 18px sans-serif' : '16px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      const scoreText = this._formatScore(this._activeTab, entry.score)
      ctx.fillText(scoreText, offsetX + PANEL_WIDTH - 30, rowY + ROW_HEIGHT / 2)
    }
  }

  /** 渲染空状态 */
  private _renderEmptyState(ctx: CanvasRenderingContext2D, offsetX: number): void {
    const centerY = PANEL_Y + PANEL_HEIGHT * 0.5

    // 空状态图标
    ctx.fillStyle = '#E0E0E0'
    ctx.font = '48px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📋', offsetX + PANEL_WIDTH / 2, centerY - 60)

    // 提示文本
    ctx.fillStyle = '#999999'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('还没有好友数据，邀请好友一起来玩！', offsetX + PANEL_WIDTH / 2, centerY + 10)

    // 邀请按钮
    const btnW = 200
    const btnH = 48
    const btnX = offsetX + (PANEL_WIDTH - btnW) / 2
    const btnY = centerY + 50
    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 24)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('邀请好友', btnX + btnW / 2, btnY + btnH / 2)
  }

  /** 处理点击事件 */
  handleClick(x: number, y: number): boolean {
    if (!this._isVisible) return false

    const offsetX = PANEL_X + this._slideOffset

    // 关闭按钮
    if (this._isPointInRect(x, y, offsetX + PANEL_WIDTH - 50, PANEL_Y + 10, 40, 40)) {
      this.close()
      return true
    }

    // 标签切换
    const tabWidth = PANEL_WIDTH / 3
    const tabY = PANEL_Y + TAB_BAR_Y
    const tabH = 44
    for (let i = 0; i < TAB_KEYS.length; i++) {
      if (this._isPointInRect(x, y, offsetX + i * tabWidth + 8, tabY, tabWidth - 16, tabH)) {
        this.switchTab(TAB_KEYS[i])
        return true
      }
    }

    // 空状态的邀请按钮
    if (this._rankingData.length <= 1 && this._rankingData[0]?.isSelf) {
      const centerY = PANEL_Y + PANEL_HEIGHT * 0.5
      const btnW = 200
      const btnH = 48
      const btnX = offsetX + (PANEL_WIDTH - btnW) / 2
      const btnY = centerY + 50
      if (this._isPointInRect(x, y, btnX, btnY, btnW, btnH)) {
        eventBus.emit('inviteFriends')
        return true
      }
    }

    return false
  }

  /** 格式化分数显示 */
  private _formatScore(dimension: RankingDimension, score: number): string {
    switch (dimension) {
      case 'totalClears':
        return `${score}次`
      case 'minSteps':
        return score >= 999 ? '--' : `${score}步`
      case 'fastestTime':
        return score >= 999 ? '--' : `${score.toFixed(1)}秒`
    }
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
