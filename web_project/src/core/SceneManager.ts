// SceneManager.ts
// 职责：场景管理器，管理场景切换和生命周期
// 依赖：无

export interface Scene {
  onEnter(): void
  onExit(): void
  update(deltaTime: number): void
  render(ctx: CanvasRenderingContext2D): void
  /** 处理点击/触控事件，返回 true 表示已消费 */
  handleClick?(x: number, y: number): boolean
}

export class SceneManager {
  private _scenes: Scene[] = []
  private _currentIndex: number = -1

  /** 获取当前场景 */
  get current(): Scene | null {
    return this._currentIndex >= 0 && this._currentIndex < this._scenes.length
      ? this._scenes[this._currentIndex]
      : null
  }

  /** 切换到指定场景（替换当前） */
  switchTo(scene: Scene): void {
    const old = this.current
    if (old) {
      old.onExit()
    }
    this._scenes.push(scene)
    this._currentIndex = this._scenes.length - 1
    scene.onEnter()
  }

  /** 推入新场景（暂停当前） */
  push(scene: Scene): void {
    this._scenes.push(scene)
    this._currentIndex = this._scenes.length - 1
    scene.onEnter()
  }

  /** 弹出当前场景（恢复上一个） */
  pop(): void {
    if (this._scenes.length === 0) return
    const old = this._scenes.pop()!
    old.onExit()
    this._currentIndex = this._scenes.length - 1
    if (this.current) {
      this.current.onEnter()
    }
  }

  /** 更新当前场景 */
  update(deltaTime: number): void {
    this.current?.update(deltaTime)
  }

  /** 渲染当前场景 */
  render(ctx: CanvasRenderingContext2D): void {
    this.current?.render(ctx)
  }

  /** 清除所有场景 */
  clear(): void {
    while (this._scenes.length > 0) {
      this._scenes.pop()!.onExit()
    }
    this._currentIndex = -1
  }
}

export const sceneManager = new SceneManager()
