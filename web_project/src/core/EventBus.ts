// EventBus.ts
// 职责：全局事件总线，支持 on/off/emit 方法，事件名使用 camelCase 过去式
// 依赖：无

type Callback = (...args: unknown[]) => void

export class EventBus {
  private _listeners: Map<string, Set<Callback>> = new Map()

  /** 订阅事件 */
  on(event: string, callback: Callback): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event)!.add(callback)
  }

  /** 取消订阅 */
  off(event: string, callback: Callback): void {
    const callbacks = this._listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this._listeners.delete(event)
      }
    }
  }

  /** 派发事件 */
  emit(event: string, ...args: unknown[]): void {
    const callbacks = this._listeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(...args)
        } catch (e) {
          console.error(`EventBus.emit error on event "${event}":`, e)
        }
      })
    }
  }

  /** 清除所有订阅 */
  clear(): void {
    this._listeners.clear()
  }
}

export const eventBus = new EventBus()
