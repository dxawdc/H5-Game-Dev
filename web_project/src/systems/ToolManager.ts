// ToolManager.ts
// 职责：4 种道具的库存、每局限次、关卡继承管理
// 依赖：无

export type ToolKey = 'extra' | 'undo' | 'hint' | 'reset'

interface ToolState {
  count: number
  used: number
  maxUse: number
}

const TOOL_DEFAULTS: Record<ToolKey, { maxUse: number }> = {
  extra: { maxUse: 2 },
  undo: { maxUse: 2 },
  hint: { maxUse: 1 },
  reset: { maxUse: 1 },
}

export class ToolManager {
  private _tools: Record<ToolKey, ToolState>

  constructor() {
    this._tools = {} as Record<ToolKey, ToolState>
    for (const key of Object.keys(TOOL_DEFAULTS) as ToolKey[]) {
      this._tools[key] = { count: 0, used: 0, maxUse: TOOL_DEFAULTS[key].maxUse }
    }
  }

  /** 第1关：每个道具初始 1 个 */
  initLevel1(): void {
    for (const key of Object.keys(this._tools) as ToolKey[]) {
      this._tools[key].count = 1
      this._tools[key].used = 0
    }
  }

  /** 第2关：继承第1关未用完的道具 */
  initLevel2(carry?: Record<string, number> | null): void {
    for (const key of Object.keys(this._tools) as ToolKey[]) {
      this._tools[key].count = 0
      this._tools[key].used = 0
    }
    if (carry) {
      for (const key of Object.keys(carry) as ToolKey[]) {
        if (this._tools[key]) {
          this._tools[key].count = carry[key] || 0
        }
      }
    }
  }

  /** 获取道具剩余数量 */
  getCount(key: ToolKey): number {
    return this._tools[key]?.count ?? 0
  }

  /** 检查该道具是否已达本局上限 */
  isExhausted(key: ToolKey): boolean {
    const t = this._tools[key]
    return t ? t.used >= t.maxUse : true
  }

  /** 检查是否可以使用该道具 */
  canUse(key: ToolKey): boolean {
    return !this.isExhausted(key) && this._tools[key].count > 0
  }

  /** 使用道具（扣除库存，记录使用次数） */
  useTool(key: ToolKey): boolean {
    const t = this._tools[key]
    if (!t || t.used >= t.maxUse || t.count <= 0) return false
    t.count--
    t.used++
    return true
  }

  /** 获得道具 */
  grantTool(key: ToolKey): void {
    const t = this._tools[key]
    if (t) t.count++
  }

  /** 获取当前道具库存快照（用于关卡继承） */
  getSnapshot(): Record<string, number> {
    const snap: Record<string, number> = {}
    for (const key of Object.keys(this._tools) as ToolKey[]) {
      snap[key] = this._tools[key].count
    }
    return snap
  }

  /** 获取所有工具状态（用于 UI 渲染） */
  getAllStates(): Record<ToolKey, { count: number; used: number; maxUse: number }> {
    return { ...this._tools }
  }
}
