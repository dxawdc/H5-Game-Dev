// GameUI.ts
// 职责：更新游戏界面 DOM 元素（步数、计时、道具栏、关卡标签等）
// 依赖：DOMHelper, ToolManager

import { showToast } from './DOMHelper'
import type { ToolManager, ToolKey } from '../systems/ToolManager'

export function updateStepCount(n: number): void {
  const el = document.getElementById('step-count')
  if (el) el.textContent = String(n)
}

export function updateTimer(s: number): void {
  const el = document.getElementById('time-count')
  if (el) el.textContent = String(s)
}

export function setLevelLabel(text: string): void {
  const el = document.getElementById('level-label')
  if (el) el.textContent = text
}

export function showTutorial(show: boolean): void {
  const el = document.getElementById('tutorial-chip')
  if (el) el.style.display = show ? 'block' : 'none'
}

const TOOL_KEYS: ToolKey[] = ['extra', 'undo', 'hint', 'reset']
const TOOL_NAMES: Record<ToolKey, string> = {
  extra: '多走1步',
  undo: '悔一步',
  hint: '提示',
  reset: '重置',
}

export function updateToolBadges(tools: ToolManager): void {
  for (const key of TOOL_KEYS) {
    const badge = document.getElementById('badge-' + key)
    const btn = document.getElementById('tool-' + key)
    if (!badge || !btn) continue

    const count = tools.getCount(key)
    const maxed = tools.isExhausted(key)

    if (maxed) {
      btn.classList.add('disabled')
      badge.style.display = 'none'
      continue
    }

    if (count === 0) {
      badge.textContent = '+'
      badge.className = 'tool-badge plus'
      badge.style.display = 'flex'
      btn.classList.remove('disabled')
    } else {
      badge.textContent = String(count)
      badge.className = 'tool-badge'
      badge.style.display = 'flex'
      btn.classList.remove('disabled')
    }
  }
}

export function getToolName(key: ToolKey): string {
  return TOOL_NAMES[key]
}

export function bindToolButtons(tools: ToolManager, onUse: (key: ToolKey) => void): void {
  for (const key of TOOL_KEYS) {
    const btn = document.getElementById('tool-' + key)
    if (!btn) continue
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) {
        if (tools.isExhausted(key)) {
          showToast(`${getToolName(key)} 今局已达上限`)
        }
        return
      }
      onUse(key)
    })
  }
}
