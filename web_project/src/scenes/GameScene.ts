// GameScene.ts
// 职责：关卡游戏主场景，协调 Canvas 棋盘渲染 + DOM UI + 游戏逻辑
// 依赖：GridManager, BossAI, TurnController, CanvasGrid, GameUI, ModalManager, GameState

import { Scene } from '../core/SceneManager'
import { GridManager, EMPTY, BOSS } from '../systems/GridManager'
import type { OffsetCoord } from '../systems/GridManager'
import { BossAI } from '../systems/BossAI'
import { TurnController } from '../systems/TurnController'
import { CanvasGrid } from '../dom/CanvasGrid'
import { gameState } from '../systems/GameState'
import { soundManager } from '../systems/SoundManager'
import { confettiManager } from '../systems/ConfettiManager'
import { GameData } from '../core/GameData'
import { updateStepCount, updateTimer, updateToolBadges, getToolName, bindToolButtons } from '../dom/GameUI'
import { showWinModal, showLoseModal, showToolConfirmModal, showToolGetModal, showSettingsModal, showQuitConfirmModal } from '../dom/ModalManager'
import { showToast } from '../dom/DOMHelper'
import type { ToolKey } from '../systems/ToolManager'

export class GameScene implements Scene {
  private _grid: GridManager
  private _controller: TurnController
  private _canvasGrid: CanvasGrid
  private _level: number
  private _elapsed: number = 0
  private _timerStarted: boolean = false
  private _timer: number | null = null
  private _gameOver: boolean = false
  private _hintCells: OffsetCoord[] = []

  private _boundHandleToolUse!: (key: ToolKey) => void
  private _boundSettingsClick!: () => void
  private _boundCanvasClick!: (e: MouseEvent) => void
  private _boundCanvasTouch!: (e: TouchEvent) => void

  constructor(grid: GridManager, bossAI: BossAI, canvasGrid: CanvasGrid, level: number) {
    this._grid = grid
    this._canvasGrid = canvasGrid
    this._level = level

    const center = Math.floor(grid.gridSize / 2)
    grid.setCell(center, center, BOSS)

    this._controller = new TurnController(grid, bossAI, { r: center, c: center })
  }

  onEnter(): void {
    this._gameOver = false
    this._elapsed = 0
    this._timerStarted = false
    this._timer = null
    this._hintCells = []

    this._setupDOMHandlers()
    this._controller.start()
    this._renderGrid()

    updateStepCount(0)
    updateTimer(0)
    updateToolBadges(gameState.tools)
  }

  onExit(): void {
    this._cleanupDOMHandlers()
    if (this._timer !== null) {
      clearInterval(this._timer)
      this._timer = null
    }
  }

  update(_deltaTime: number): void {
    if (this._timerStarted && !this._gameOver) {
      this._elapsed += _deltaTime
      updateTimer(Math.floor(this._elapsed))
    }
  }

  render(_ctx: CanvasRenderingContext2D): void {
    this._canvasGrid.render(this._grid, this._controller.bossPos, this._controller.bossTrapped, this._hintCells)
  }

  // ==================== DOM 事件绑定 ====================

  private _setupDOMHandlers(): void {
    this._boundHandleToolUse = (key: ToolKey) => this._handleToolUse(key)
    bindToolButtons(gameState.tools, this._boundHandleToolUse)

    this._boundSettingsClick = () => this._openSettings()
    document.getElementById('btn-settings')?.addEventListener('click', this._boundSettingsClick)

    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    this._boundCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      this._handleCanvasClick(e.clientX - rect.left, e.clientY - rect.top)
    }
    this._boundCanvasTouch = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect()
        this._handleCanvasClick(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top)
      }
    }
    canvas.addEventListener('click', this._boundCanvasClick)
    canvas.addEventListener('touchstart', this._boundCanvasTouch, { passive: false })
  }

  private _cleanupDOMHandlers(): void {
    document.getElementById('btn-settings')?.removeEventListener('click', this._boundSettingsClick)
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    canvas?.removeEventListener('click', this._boundCanvasClick)
    canvas?.removeEventListener('touchstart', this._boundCanvasTouch)
  }

  // ==================== 棋盘点击 ====================

  private _handleCanvasClick(px: number, py: number): void {
    if (this._gameOver) return
    const cell = this._canvasGrid.pixelToCell(px, py)
    if (!cell) return
    if (this._grid.getCell(cell.r, cell.c) !== EMPTY) return
    this._handleCellClick(cell.r, cell.c)
  }

  private _handleCellClick(r: number, c: number): void {
    soundManager.playClick()
    soundManager.vibrate()

    if (!this._timerStarted) {
      this._timerStarted = true
      this._timer = window.setInterval(() => {
        updateTimer(Math.floor(this._elapsed))
      }, 500)
    }

    this._hintCells = []
    this._canvasGrid.clearHints()

    const result = this._controller.placeObstacle(r, c)
    if (!result) return

    updateStepCount(this._controller.steps)
    this._renderGrid()

    if (this._controller.phase === 'victory') {
      this._endGame(true)
    } else if (this._controller.phase === 'defeat') {
      this._endGame(false)
    }
  }

  // ==================== 工具系统 ====================

  private _handleToolUse(key: ToolKey): void {
    if (this._gameOver) return
    const tools = gameState.tools
    if (tools.isExhausted(key)) {
      showToast(`${getToolName(key)} 今局已达上限`)
      return
    }
    if (tools.getCount(key) === 0) {
      this._showToolGet(key)
      return
    }
    const info: Record<ToolKey, { emoji: string; title: string; desc: string }> = {
      extra: { emoji: '👟', title: '使用「多走1步」？', desc: '使用后 Boss 不会移动，你可以多走一步！' },
      undo: { emoji: '↩️', title: '使用「悔一步」？', desc: '撤销上一步操作，回到之前的状态。' },
      hint: { emoji: '💡', title: '使用「提示」？', desc: '高亮显示 Boss 当前的逃跑路线。' },
      reset: { emoji: '🔄', title: '使用「重置本关」？', desc: '放弃当前进度，重新开始这一关。' },
    }
    const i = info[key]
    showToolConfirmModal({
      key,
      emoji: i.emoji,
      title: i.title,
      desc: i.desc,
      onConfirm: () => this._executeTool(key),
    })
  }

  private _executeTool(key: ToolKey): void {
    const tools = gameState.tools
    if (!tools.useTool(key)) return
    updateToolBadges(tools)

    switch (key) {
      case 'extra':
        this._controller.extraMove = true
        showToast('👟 下一步 Boss 不会移动！')
        soundManager.playClick()
        break
      case 'undo':
        if (this._controller.historyLength === 0) {
          showToast('没有可以悔的步骤了')
          return
        }
        this._controller.undo()
        this._hintCells = []
        this._canvasGrid.clearHints()
        updateStepCount(this._controller.steps)
        this._renderGrid()
        soundManager.playClick()
        break
      case 'hint': {
        const path = this._controller.getHintPath()
        if (path) {
          this._hintCells = path.slice(1)
          this._canvasGrid.setHintCells(this._hintCells)
          showToast('💡 已显示 Boss 逃跑路线')
        } else {
          showToast('Boss 已经无路可逃了！')
        }
        this._renderGrid()
        soundManager.playClick()
        break
      }
      case 'reset':
        gameState.restartGame()
        soundManager.playClick()
        break
    }
  }

  private _showToolGet(key: ToolKey): void {
    const info: Record<ToolKey, { emoji: string; title: string; desc: string }> = {
      extra: { emoji: '👟', title: '获得「多走1步」', desc: '使用后Boss不动，你可以多走一步！' },
      undo: { emoji: '↩️', title: '获得「悔一步」', desc: '回到上一步的状态！' },
      hint: { emoji: '💡', title: '获得「提示」', desc: '显示Boss的逃跑路线！' },
      reset: { emoji: '🔄', title: '获得「重置本关」', desc: '重新开始这一关！' },
    }
    const i = info[key]
    showToolGetModal({
      key,
      emoji: i.emoji,
      title: i.title,
      desc: i.desc,
      onAd: () => this._grantTool(key),
      onShare: () => this._grantTool(key),
    })
  }

  private _grantTool(key: ToolKey): void {
    gameState.tools.grantTool(key)
    showToast(`🎉 获得道具：${getToolName(key)}`)
    updateToolBadges(gameState.tools)
    setTimeout(() => this._handleToolUse(key), 300)
  }

  // ==================== 游戏结束 ====================

  private _endGame(win: boolean): void {
    this._gameOver = true
    if (this._timer !== null) {
      clearInterval(this._timer)
      this._timer = null
    }

    if (win) {
      soundManager.playWin()
      confettiManager.spawn()

      if (this._level === 2) {
        const elapsed = Math.floor(this._elapsed)
        gameState.session.wins++
        if (!gameState.session.bestSteps || this._controller.steps < gameState.session.bestSteps) {
          gameState.session.bestSteps = this._controller.steps
        }
        if (!gameState.session.bestTime || elapsed < gameState.session.bestTime) {
          gameState.session.bestTime = elapsed
        }
        gameState.persistStats()
      }

      if (this._level === 1) {
        gameState.session.carryTools = gameState.tools.getSnapshot()
      }

      showWinModal({
        steps: this._controller.steps,
        time: Math.floor(this._elapsed),
        level: this._level,
        onChangeLevel: () => {
          if (this._level === 1) {
            gameState.startGame(2)
          } else {
            gameState.restartGame()
          }
        },
        onGoHome: () => gameState.goHome(),
      })
    } else {
      soundManager.playLose()
      showLoseModal(
        () => gameState.restartGame(),
        () => gameState.goHome(),
      )
    }
  }

  // ==================== 设置 ====================

  private _openSettings(): void {
    showSettingsModal({
      soundEnabled: soundManager.enabled,
      vibrationEnabled: GameData.vibrationEnabled,
      gameOver: this._gameOver,
      onToggleSound: () => {
        soundManager.enabled = !soundManager.enabled
      },
      onToggleVibration: () => {
        GameData.vibrationEnabled = !GameData.vibrationEnabled
        GameData.saveToLocalStorage()
      },
      onQuit: () => {
        showQuitConfirmModal(
          () => gameState.goHome(),
          () => {},
        )
      },
    })
  }

  // ==================== 渲染 ====================

  private _renderGrid(): void {
    this._canvasGrid.setBossTrapped(this._controller.bossTrapped)
  }
}
