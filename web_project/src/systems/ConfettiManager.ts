// ConfettiManager.ts
// 职责：DOM 彩纸特效（匹配参考 HTML）
// 依赖：无

class ConfettiManagerSingleton {
  private _colors = ['#FF6B35', '#4ECDC4', '#FFE66D', '#9B59B6', '#2ECC71']

  spawn(count: number = 40): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement('div')
        el.className = 'confetti-piece'
        el.style.left = Math.random() * 100 + 'vw'
        el.style.top = '-20px'
        el.style.background = this._colors[Math.floor(Math.random() * this._colors.length)]
        el.style.width = (6 + Math.random() * 8) + 'px'
        el.style.height = (6 + Math.random() * 8) + 'px'
        el.style.animationDuration = (1.5 + Math.random() * 2) + 's'
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
        document.body.appendChild(el)
        setTimeout(() => el.remove(), 4000)
      }, i * 40)
    }
  }
}

export const confettiManager = new ConfettiManagerSingleton()
