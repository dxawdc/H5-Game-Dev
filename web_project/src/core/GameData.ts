// GameData.ts
// 职责：全局游戏状态单例，管理所有游戏数据、持久化存档
// 依赖：无

interface GameDataState {
  currentLevel: number
  totalClears: number
  bestLevel2Steps: number
  bestLevel2Time: number
  dailyShareCount: number
  dailyAdCount: number
  soundEnabled: boolean
  vibrationEnabled: boolean
}

const DEFAULT_STATE: GameDataState = {
  currentLevel: 1,
  totalClears: 0,
  bestLevel2Steps: 999,
  bestLevel2Time: 999.0,
  dailyShareCount: 0,
  dailyAdCount: 0,
  soundEnabled: true,
  vibrationEnabled: true,
}

const STORAGE_KEY = 'SurroundTheBoss_GameData'

class GameDataSingleton {
  private _state: GameDataState

  constructor() {
    this._state = { ...DEFAULT_STATE }
  }

  get currentLevel(): number { return this._state.currentLevel }
  set currentLevel(v: number) { this._state.currentLevel = v }

  get totalClears(): number { return this._state.totalClears }
  set totalClears(v: number) { this._state.totalClears = v }

  get bestLevel2Steps(): number { return this._state.bestLevel2Steps }
  set bestLevel2Steps(v: number) { this._state.bestLevel2Steps = v }

  get bestLevel2Time(): number { return this._state.bestLevel2Time }
  set bestLevel2Time(v: number) { this._state.bestLevel2Time = v }

  get dailyShareCount(): number { return this._state.dailyShareCount }
  set dailyShareCount(v: number) { this._state.dailyShareCount = v }

  get dailyAdCount(): number { return this._state.dailyAdCount }
  set dailyAdCount(v: number) { this._state.dailyAdCount = v }

  get soundEnabled(): boolean { return this._state.soundEnabled }
  set soundEnabled(v: boolean) { this._state.soundEnabled = v }

  get vibrationEnabled(): boolean { return this._state.vibrationEnabled }
  set vibrationEnabled(v: boolean) { this._state.vibrationEnabled = v }

  saveToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state))
    } catch (e) {
      console.error('GameData.saveToLocalStorage failed:', e)
    }
  }

  loadFromLocalStorage(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const parsed = JSON.parse(raw) as Partial<GameDataState>
      Object.assign(this._state, parsed)
      return true
    } catch (e) {
      console.error('GameData.loadFromLocalStorage failed:', e)
      return false
    }
  }

  resetToDefaults(): void {
    this._state = { ...DEFAULT_STATE }
    console.warn('GameData.resetToDefaults() called - testing only')
  }

  getState(): GameDataState {
    return { ...this._state }
  }
}

export const GameData = new GameDataSingleton()
