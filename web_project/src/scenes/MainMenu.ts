// MainMenu.ts
// 职责：游戏主界面场景（DOM 驱动）
// 依赖：Scene, GameState, DOMHelper

import { Scene } from '../core/SceneManager'
import { gameState } from '../systems/GameState'
import { showScreen } from '../dom/DOMHelper'
import { showLeaderboardModal } from '../dom/ModalManager'

export class MainMenu implements Scene {
  private _boundStart!: () => void
  private _boundLb!: () => void

  onEnter(): void {
    showScreen('home-screen')
    gameState.updateHomeStats()

    this._boundStart = () => gameState.startGame(1)
    this._boundLb = () => showLeaderboardModal(
      gameState.session.bestSteps,
      gameState.session.bestTime,
      gameState.session.wins,
    )

    document.getElementById('btn-start')?.addEventListener('click', this._boundStart)
    document.getElementById('btn-leaderboard')?.addEventListener('click', this._boundLb)
  }

  onExit(): void {
    document.getElementById('btn-start')?.removeEventListener('click', this._boundStart)
    document.getElementById('btn-leaderboard')?.removeEventListener('click', this._boundLb)
  }

  update(_deltaTime: number): void { /* DOM 驱动 */ }

  render(_ctx: CanvasRenderingContext2D): void { /* DOM 负责 */ }

  handleClick(_x: number, _y: number): boolean { return false }
}
