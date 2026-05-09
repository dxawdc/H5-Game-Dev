// GameState.ts
// 职责：全局游戏状态单例，管理关卡、道具、Session 数据
// 依赖：ToolManager, GameData

import { ToolManager } from './ToolManager'
import { GameData } from '../core/GameData'
import { GridManager } from './GridManager'
import { BossAI } from './BossAI'
import { setLevelLabel, showTutorial, updateStepCount, updateTimer, updateToolBadges } from '../dom/GameUI'
import { showScreen } from '../dom/DOMHelper'
import { eventBus } from '../core/EventBus'

export interface SessionData {
  wins: number
  bestSteps: number | null
  bestTime: number | null
  carryTools: Record<string, number> | null
}

class GameStateSingleton {
  level: number = 1
  tools: ToolManager = new ToolManager()

  session: SessionData = {
    wins: 0,
    bestSteps: null,
    bestTime: null,
    carryTools: null,
  }

  loadFromGameData(): void {
    this.session.wins = GameData.totalClears
    this.session.bestSteps = GameData.bestLevel2Steps !== 999 ? GameData.bestLevel2Steps : null
    this.session.bestTime = GameData.bestLevel2Time !== 999 ? GameData.bestLevel2Time : null
  }

  saveToGameData(): void {
    GameData.totalClears = this.session.wins
    if (this.session.bestSteps !== null) GameData.bestLevel2Steps = this.session.bestSteps
    if (this.session.bestTime !== null) GameData.bestLevel2Time = this.session.bestTime
    GameData.saveToLocalStorage()
  }

  persistStats(): void {
    this.saveToGameData()
  }

  updateHomeStats(): void {
    const w = document.getElementById('stat-wins')
    const s = document.getElementById('stat-best-steps')
    const t = document.getElementById('stat-best-time')
    if (w) w.textContent = String(this.session.wins)
    if (s) s.textContent = this.session.bestSteps !== null ? String(this.session.bestSteps) : '--'
    if (t) t.textContent = this.session.bestTime !== null ? this.session.bestTime + 's' : '--'
  }

  /** 准备游戏数据并通过 EventBus 触发场景切换 */
  startGame(level: number): void {
    this.level = level
    const size = level === 1 ? 7 : 9
    const center = Math.floor(size / 2)

    const gm = new GridManager(size)
    gm.initLevel(level)
    gm.setCell(center, center, 3 as const)

    const bossAI = new BossAI(gm)

    this.tools = new ToolManager()
    if (level === 1) {
      this.tools.initLevel1()
    } else {
      this.tools.initLevel2(this.session.carryTools)
      this.session.carryTools = null
    }

    setLevelLabel(level === 1 ? '第1关 · 新手教程' : '第2关 · 极限挑战')
    showTutorial(level === 1)
    updateStepCount(0)
    updateTimer(0)
    updateToolBadges(this.tools)
    showScreen('game-screen')

    eventBus.emit('gameStart', { level, gridManager: gm, bossAI })
  }

  /** 返回主菜单 */
  goHome(): void {
    showScreen('home-screen')
    this.updateHomeStats()
    eventBus.emit('goHome')
  }

  /** 重新开始当前关卡 */
  restartGame(): void {
    this.startGame(this.level)
  }
}

export const gameState = new GameStateSingleton()
