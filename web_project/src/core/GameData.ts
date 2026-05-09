// GameData.ts
// 职责：全局游戏状态单例，管理所有游戏数据、持久化存档
// 依赖：无

interface ItemInventory {
  extra_step: number
  undo: number
  reset: number
  hint: number
}

interface GameDataState {
  currentLevel: number
  stepCount: number
  isBossCaught: boolean
  isBossEscaped: boolean
  items: ItemInventory
  currentItems: ItemInventory
  dailyShareCount: number
  dailyAdCount: number
  bestLevel2Steps: number
  bestLevel2Time: number
  totalClears: number
  soundEnabled: boolean
  vibrationEnabled: boolean
  undoHistory: Array<unknown>
}

const DEFAULT_STATE: GameDataState = {
  currentLevel: 1,
  stepCount: 0,
  isBossCaught: false,
  isBossEscaped: false,
  items: { extra_step: 0, undo: 0, reset: 0, hint: 0 },
  currentItems: { extra_step: 0, undo: 0, reset: 0, hint: 0 },
  dailyShareCount: 0,
  dailyAdCount: 0,
  bestLevel2Steps: 999,
  bestLevel2Time: 999.0,
  totalClears: 0,
  soundEnabled: true,
  vibrationEnabled: true,
  undoHistory: [],
}

const STORAGE_KEY = 'SurroundTheBoss_GameData'

class GameDataSingleton {
  private _state: GameDataState

  constructor() {
    this._state = { ...DEFAULT_STATE, items: { ...DEFAULT_STATE.items }, currentItems: { ...DEFAULT_STATE.currentItems } }
  }

  get currentLevel(): number { return this._state.currentLevel }
  set currentLevel(v: number) { this._state.currentLevel = v }

  get stepCount(): number { return this._state.stepCount }
  set stepCount(v: number) { this._state.stepCount = v }

  get isBossCaught(): boolean { return this._state.isBossCaught }
  set isBossCaught(v: boolean) { this._state.isBossCaught = v }

  get isBossEscaped(): boolean { return this._state.isBossEscaped }
  set isBossEscaped(v: boolean) { this._state.isBossEscaped = v }

  get items(): ItemInventory { return this._state.items }
  set items(v: ItemInventory) { this._state.items = v }

  get currentItems(): ItemInventory { return this._state.currentItems }
  set currentItems(v: ItemInventory) { this._state.currentItems = v }

  get dailyShareCount(): number { return this._state.dailyShareCount }
  set dailyShareCount(v: number) { this._state.dailyShareCount = v }

  get dailyAdCount(): number { return this._state.dailyAdCount }
  set dailyAdCount(v: number) { this._state.dailyAdCount = v }

  get bestLevel2Steps(): number { return this._state.bestLevel2Steps }
  set bestLevel2Steps(v: number) { this._state.bestLevel2Steps = v }

  get bestLevel2Time(): number { return this._state.bestLevel2Time }
  set bestLevel2Time(v: number) { this._state.bestLevel2Time = v }

  get totalClears(): number { return this._state.totalClears }
  set totalClears(v: number) { this._state.totalClears = v }

  get soundEnabled(): boolean { return this._state.soundEnabled }
  set soundEnabled(v: boolean) { this._state.soundEnabled = v }

  get vibrationEnabled(): boolean { return this._state.vibrationEnabled }
  set vibrationEnabled(v: boolean) { this._state.vibrationEnabled = v }

  get undoHistory(): Array<unknown> { return this._state.undoHistory }
  set undoHistory(v: Array<unknown>) { this._state.undoHistory = v }

  /** 将当前状态保存到 localStorage */
  saveToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state))
    } catch (e) {
      console.error('GameData.saveToLocalStorage failed:', e)
    }
  }

  /** 从 localStorage 读取状态并覆盖当前状态 */
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

  /** 重置所有变量为初始值（仅测试环境调用） */
  resetToDefaults(): void {
    this._state = { ...DEFAULT_STATE, items: { ...DEFAULT_STATE.items }, currentItems: { ...DEFAULT_STATE.currentItems } }
    console.warn('GameData.resetToDefaults() called - testing only')
  }

  /** 获取完整状态快照 */
  getState(): GameDataState {
    return { ...this._state, items: { ...this._state.items }, currentItems: { ...this._state.currentItems }, undoHistory: [...this._state.undoHistory] }
  }
}

export const GameData = new GameDataSingleton()
