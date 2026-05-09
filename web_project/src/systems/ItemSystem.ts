// ItemSystem.ts
// 职责：道具配置加载、库存管理、每日刷新调度
// 依赖：GameData

import { GameData } from '../core/GameData'
import { BoardSerializer } from './BoardSerializer'
import type { BoardSnapshot } from './BoardSerializer'
import type { TurnController } from './TurnController'
import type { GridManager } from './GridManager'
import { eventBus } from '../core/EventBus'

export interface ItemDef {
  id: string
  name: string
  description: string
  icon: string
  perSessionLimit: number
  inventoryCap: number
  effectType: string
  effectValue: number
}

interface ItemsData {
  items: ItemDef[]
}

interface ShopConfig {
  acquisitionMap: Record<string, string>
  dailyLimits: { share: number; ad: number }
  cooldownSeconds: number
  initialGift: Record<string, number>
}

export class ItemSystem {
  private _itemDefs: Map<string, ItemDef> = new Map()
  private _shopConfig: ShopConfig | null = null
  private _loaded: boolean = false

  /** 加载道具配置 */
  async load(): Promise<boolean> {
    try {
      const itemsData = await import('../data/items.json') as unknown as ItemsData
      const shopData = await import('../data/shop_config.json') as unknown as ShopConfig
      this._itemDefs.clear()
      itemsData.items.forEach(item => this._itemDefs.set(item.id, item))
      this._shopConfig = shopData as unknown as ShopConfig

      // 如果玩家还没有初始道具，发放初始礼包
      const hasItems = Object.values(GameData.items).some(v => v > 0)
      if (!hasItems && this._shopConfig) {
        const gift = this._shopConfig.initialGift
        for (const [itemId, count] of Object.entries(gift)) {
          this.addToInventory(itemId, count)
        }
        GameData.saveToLocalStorage()
      }

      this._loaded = true
      return true
    } catch (e) {
      console.error('ItemSystem.load failed:', e)
      return false
    }
  }

  get loaded(): boolean { return this._loaded }

  /** 获取道具定义 */
  getItemDef(itemId: string): ItemDef | undefined {
    return this._itemDefs.get(itemId)
  }

  /** 获取所有道具定义 */
  getAllItemDefs(): ItemDef[] {
    return Array.from(this._itemDefs.values())
  }

  /** 获取道具库存数量 */
  getInventory(itemId: string): number {
    const items = GameData.items as unknown as Record<string, number>
    return items[itemId] || 0
  }

  /** 向库存添加道具（受上限限制） */
  addToInventory(itemId: string, count: number): number {
    const def = this._itemDefs.get(itemId)
    if (!def) return 0
    const items = GameData.items as unknown as Record<string, number>
    const current = items[itemId] || 0
    const added = Math.min(count, def.inventoryCap - current)
    if (added > 0) {
      items[itemId] = current + added
    }
    return added
  }

  /** 从库存扣除道具 */
  removeFromInventory(itemId: string, count: number): boolean {
    const items = GameData.items as unknown as Record<string, number>
    const current = items[itemId] || 0
    if (current < count) return false
    items[itemId] = current - count
    return true
  }

  /** 获取道具获取方式 */
  getAcquisitionMethod(itemId: string): string {
    if (!this._shopConfig) return 'share'
    return this._shopConfig.acquisitionMap[itemId] || 'share'
  }

  /** 检查每日分享次数是否已达上限 */
  canShareToday(): boolean {
    if (!this._shopConfig) return true
    return GameData.dailyShareCount < this._shopConfig.dailyLimits.share
  }

  /** 检查每日广告次数是否已达上限 */
  canWatchAdToday(): boolean {
    if (!this._shopConfig) return true
    return GameData.dailyAdCount < this._shopConfig.dailyLimits.ad
  }

  /** 签到分享并发放奖励 */
  claimShareReward(): string | null {
    if (!this.canShareToday()) return null
    GameData.dailyShareCount++
    // 随机发放一种道具
    const itemIds = Array.from(this._itemDefs.keys())
    const randomId = itemIds[Math.floor(Math.random() * itemIds.length)]
    this.addToInventory(randomId, 1)
    GameData.saveToLocalStorage()
    return randomId
  }

  /** 签到广告观看并发放奖励 */
  claimAdReward(itemId: string): boolean {
    if (!this.canWatchAdToday()) return false
    GameData.dailyAdCount++
    this.addToInventory(itemId, 1)
    GameData.saveToLocalStorage()
    return true
  }

  /** 检查每日是否需要刷新（UTC+8 0点重置） */
  checkDailyReset(): void {
    const lastDate = localStorage.getItem('itemDailyResetDate')
    const now = new Date()
    const todayUTC8 = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    if (lastDate !== todayUTC8) {
      GameData.dailyShareCount = 0
      GameData.dailyAdCount = 0
      localStorage.setItem('itemDailyResetDate', todayUTC8)
      GameData.saveToLocalStorage()
    }
  }
}

// ---- 道具效果执行器 ----

export interface EffectContext {
  controller: TurnController
  grid: GridManager
  undoSnapshot?: BoardSnapshot
  initialSnapshot?: BoardSnapshot
}

export class ItemEffectExecutor {
  /** 执行道具效果 */
  execute(effectType: string, value: number, context: EffectContext): boolean {
    switch (effectType) {
      case 'add_steps': {
        context.controller.addSteps(value)
        return true
      }
      case 'undo_move': {
        if (!context.undoSnapshot) {
          console.warn('ItemEffectExecutor: 没有可用的撤销快照')
          return false
        }
        BoardSerializer.restoreSnapshot(context.grid, context.undoSnapshot)
        context.controller.restoreFromSnapshot(context.undoSnapshot)
        return true
      }
      case 'reset_level': {
        if (!context.initialSnapshot) {
          console.warn('ItemEffectExecutor: 没有可用的初始快照')
          return false
        }
        BoardSerializer.restoreSnapshot(context.grid, context.initialSnapshot)
        context.controller.restoreFromSnapshot(context.initialSnapshot)
        return true
      }
      case 'show_hint': {
        const nextMove = context.controller.getBossNextMove()
        eventBus.emit('hintReady', { position: nextMove })
        return true
      }
      default: {
        console.warn(`ItemEffectExecutor: 未知效果类型 "${effectType}"`)
        return false
      }
    }
  }
}

// ---- 局内道具管理器 ----

export class InGameItemManager {
  private _executor: ItemEffectExecutor
  private _itemSystem: ItemSystem
  private _sessionUsage: Map<string, number> = new Map()
  private _undoStack: BoardSnapshot[] = []
  private _initialSnapshot: BoardSnapshot | null = null
  private _grid: GridManager | null = null
  private _controller: TurnController | null = null
  private _maxUndoStack: number = 10

  constructor(itemSystem: ItemSystem, executor?: ItemEffectExecutor) {
    this._itemSystem = itemSystem
    this._executor = executor ?? new ItemEffectExecutor()
  }

  /** 初始化关卡（由 GameScene 在关卡开始时调用） */
  init(grid: GridManager, controller: TurnController): void {
    this._grid = grid
    this._controller = controller
    this._sessionUsage.clear()
    this._undoStack = []
    this._initialSnapshot = BoardSerializer.createSnapshot(grid, controller)
    eventBus.emit('itemManagerInitialized')
  }

  /** 在玩家放置障碍物前调用，保存撤销快照 */
  pushUndoSnapshot(): void {
    const grid = this._grid
    const controller = this._controller
    if (!grid || !controller) return
    if (this._undoStack.length >= this._maxUndoStack) {
      this._undoStack.shift()
    }
    this._undoStack.push(BoardSerializer.createSnapshot(grid, controller))
  }

  /** 使用道具 */
  useItem(itemId: string): boolean {
    const grid = this._grid
    const controller = this._controller
    if (!grid || !controller) {
      console.warn('InGameItemManager: 未初始化')
      return false
    }

    const def = this._itemSystem.getItemDef(itemId)
    if (!def) {
      console.warn(`InGameItemManager: 未知道具 "${itemId}"`)
      return false
    }

    // 检查库存
    if (this._itemSystem.getInventory(itemId) <= 0) {
      console.warn(`InGameItemManager: 库存不足 "${itemId}"`)
      return false
    }

    // 检查本局使用次数上限
    const usageCount = this._sessionUsage.get(itemId) || 0
    if (usageCount >= def.perSessionLimit) {
      console.warn(`InGameItemManager: 本局使用次数已达上限 "${itemId}"`)
      return false
    }

    // 构建执行上下文
    let undoSnapshot: BoardSnapshot | undefined
    if (def.effectType === 'undo_move') {
      undoSnapshot = this._undoStack.pop()
      if (!undoSnapshot) {
        console.warn('InGameItemManager: 撤销栈为空')
        return false
      }
    }

    const context: EffectContext = {
      controller,
      grid,
      undoSnapshot,
      initialSnapshot: this._initialSnapshot ?? undefined,
    }

    // 执行效果
    const success = this._executor.execute(def.effectType, def.effectValue, context)
    if (!success) {
      // undo 失败时把快照放回栈
      if (def.effectType === 'undo_move' && undoSnapshot) {
        this._undoStack.push(undoSnapshot)
      }
      return false
    }

    // 扣除库存
    this._itemSystem.removeFromInventory(itemId, 1)
    // 记录本局使用次数
    this._sessionUsage.set(itemId, usageCount + 1)
    // 持久化
    GameData.saveToLocalStorage()

    eventBus.emit('itemUsed', { itemId })

    // reset 道具清除局内状态
    if (def.effectType === 'reset_level') {
      this._undoStack = []
      this._sessionUsage.clear()
      if (grid && controller) {
        this._initialSnapshot = BoardSerializer.createSnapshot(grid, controller)
      }
    }

    return true
  }

  /** 获取本局使用次数 */
  getSessionUsage(itemId: string): number {
    return this._sessionUsage.get(itemId) || 0
  }

  /** 获取撤销栈深度 */
  get undoStackSize(): number {
    return this._undoStack.length
  }

  /** 获取初始快照 */
  get initialSnapshot(): BoardSnapshot | null {
    return this._initialSnapshot
  }

  /** 获取执行器 */
  get executor(): ItemEffectExecutor {
    return this._executor
  }
}
