// StepCounter.ts
// 职责：记录当前步数、剩余步数，与道具系统联动
// 依赖：无

export class StepCounter {
  private _currentStep: number = 0
  private _maxSteps: number = 30

  constructor(maxSteps: number = 30) {
    this._maxSteps = maxSteps
  }

  get currentStep(): number { return this._currentStep }
  get maxSteps(): number { return this._maxSteps }
  get stepsRemaining(): number { return Math.max(0, this._maxSteps - this._currentStep) }
  get isExhausted(): boolean { return this._currentStep >= this._maxSteps }

  /** 前进 1 步，返回 true 表示步数未耗尽 */
  advance(): boolean {
    this._currentStep++
    return !this.isExhausted
  }

  /** 增加步数上限（道具效果） */
  addMaxSteps(extra: number): void {
    this._maxSteps += extra
  }

  /** 重置 */
  reset(maxSteps: number): void {
    this._currentStep = 0
    this._maxSteps = maxSteps
  }

  /** 获取进度百分比 */
  getProgressPercent(): number {
    if (this._maxSteps <= 0) return 0
    return Math.min(100, Math.round((this._currentStep / this._maxSteps) * 100))
  }
}
