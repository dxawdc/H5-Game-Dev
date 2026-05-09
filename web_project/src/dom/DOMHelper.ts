// DOMHelper.ts
// 职责：DOM 层的通用辅助函数（屏幕切换、弹窗、Toast）
// 依赖：无

export function showScreen(id: string): void {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'))
  const el = document.getElementById(id)
  if (el) el.classList.remove('hidden')
}

export function openOverlay(id: string): void {
  document.getElementById(id)?.classList.remove('hidden')
}

export function closeOverlay(id: string): void {
  document.getElementById(id)?.classList.add('hidden')
}

let _toastTimer: number | undefined

export function showToast(msg: string): void {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.classList.add('show')
  clearTimeout(_toastTimer)
  _toastTimer = window.setTimeout(() => t.classList.remove('show'), 2200)
}
