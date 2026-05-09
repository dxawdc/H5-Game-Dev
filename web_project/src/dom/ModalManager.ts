// ModalManager.ts
// 职责：管理 DOM 弹窗内容，动态填充数据
// 依赖：DOMHelper

import { openOverlay, closeOverlay } from './DOMHelper'

export interface WinModalOptions {
  steps: number
  time: number
  level: number
  onChangeLevel?: () => void
  onGoHome?: () => void
}

export function showWinModal(opts: WinModalOptions): void {
  document.getElementById('win-steps')!.textContent = String(opts.steps)
  document.getElementById('win-time')!.textContent = opts.time + 's'

  const subtitles = [
    `搞定Boss，只用${opts.steps}招，不到${opts.time}秒！`,
    `太厉害了！Boss被你玩弄于股掌！`,
    `${opts.steps}步解决战斗，你是高手！`,
  ]
  document.getElementById('win-subtitle')!.textContent =
    subtitles[Math.floor(Math.random() * subtitles.length)]

  const btnsEl = document.getElementById('win-btns')!
  if (opts.level === 1) {
    btnsEl.innerHTML = `
      <button class="btn btn-primary" id="btn-win-next">⚡ 挑战第2关</button>
      <button class="btn btn-ghost" id="btn-win-home">🏠 回到大厅</button>
    `
  } else {
    btnsEl.innerHTML = `
      <button class="btn btn-primary" id="btn-win-again">🔥 继续挑战</button>
      <button class="btn btn-ghost" id="btn-win-home">🏠 回到大厅</button>
    `
  }
  document.getElementById('btn-win-home')!.addEventListener('click', () => {
    closeOverlay('win-overlay')
    opts.onGoHome?.()
  })
  if (opts.level === 1) {
    document.getElementById('btn-win-next')!.addEventListener('click', () => {
      closeOverlay('win-overlay')
      opts.onChangeLevel?.()
    })
  } else {
    const again = document.getElementById('btn-win-again')
    if (again) {
      again.addEventListener('click', () => {
        closeOverlay('win-overlay')
        opts.onChangeLevel?.()
      })
    }
  }

  setTimeout(() => openOverlay('win-overlay'), 400)
}

export function showLoseModal(onRetry?: () => void, onHome?: () => void): void {
  const retry = document.getElementById('btn-lose-retry')
  const home = document.getElementById('btn-lose-home')
  if (retry) {
    const newRetry = retry.cloneNode(true) as HTMLElement
    retry.parentNode?.replaceChild(newRetry, retry)
    newRetry.addEventListener('click', () => {
      closeOverlay('lose-overlay')
      onRetry?.()
    })
  }
  if (home) {
    const newHome = home.cloneNode(true) as HTMLElement
    home.parentNode?.replaceChild(newHome, home)
    newHome.addEventListener('click', () => {
      closeOverlay('lose-overlay')
      onHome?.()
    })
  }
  setTimeout(() => openOverlay('lose-overlay'), 300)
}

export interface ToolConfirmOptions {
  key: string
  emoji: string
  title: string
  desc: string
  onConfirm: () => void
}

export function showToolConfirmModal(opts: ToolConfirmOptions): void {
  document.getElementById('tc-emoji')!.textContent = opts.emoji
  document.getElementById('tc-title')!.textContent = opts.title
  document.getElementById('tc-desc')!.textContent = opts.desc

  const btn = document.getElementById('btn-tool-confirm')
  const cancel = document.getElementById('btn-tool-cancel')
  const closeBtn = document.getElementById('modal-close-tool-confirm')

  const cleanup = () => {
    btn?.removeEventListener('click', handleConfirm)
    cancel?.removeEventListener('click', handleCancel)
    closeBtn?.removeEventListener('click', handleCancel)
  }
  const handleConfirm = () => { cleanup(); closeOverlay('tool-confirm-overlay'); opts.onConfirm() }
  const handleCancel = () => { cleanup(); closeOverlay('tool-confirm-overlay') }

  btn?.addEventListener('click', handleConfirm)
  cancel?.addEventListener('click', handleCancel)
  closeBtn?.addEventListener('click', handleCancel)

  openOverlay('tool-confirm-overlay')
}

export interface ToolGetOptions {
  key: string
  emoji: string
  title: string
  desc: string
  onAd: () => void
  onShare: () => void
}

export function showToolGetModal(opts: ToolGetOptions): void {
  document.getElementById('tg-emoji')!.textContent = opts.emoji
  document.getElementById('tg-title')!.textContent = opts.title
  document.getElementById('tg-desc')!.textContent = opts.desc

  const btnAd = document.getElementById('btn-tool-ad')
  const btnShare = document.getElementById('btn-tool-share')
  const btnSkip = document.getElementById('btn-tool-skip')
  const closeBtn = document.getElementById('modal-close-tool-get')

  const cleanup = () => {
    btnAd?.removeEventListener('click', handleAd)
    btnShare?.removeEventListener('click', handleShare)
    btnSkip?.removeEventListener('click', handleSkip)
    closeBtn?.removeEventListener('click', handleSkip)
  }
  const handleAd = () => { cleanup(); closeOverlay('tool-get-overlay'); opts.onAd() }
  const handleShare = () => { cleanup(); closeOverlay('tool-get-overlay'); opts.onShare() }
  const handleSkip = () => { cleanup(); closeOverlay('tool-get-overlay') }

  btnAd?.addEventListener('click', handleAd)
  btnShare?.addEventListener('click', handleShare)
  btnSkip?.addEventListener('click', handleSkip)
  closeBtn?.addEventListener('click', handleSkip)

  openOverlay('tool-get-overlay')
}

export interface SettingsOptions {
  soundEnabled: boolean
  vibrationEnabled: boolean
  gameOver: boolean
  onToggleSound: () => void
  onToggleVibration: () => void
  onQuit: () => void
}

export function showSettingsModal(opts: SettingsOptions): void {
  const quitBtn = document.getElementById('quit-btn')!
  quitBtn.style.display = opts.gameOver ? 'none' : 'block'

  const sfxToggle = document.getElementById('sfx-toggle')!
  sfxToggle.className = 'toggle' + (opts.soundEnabled ? ' on' : '')
  const vibToggle = document.getElementById('vib-toggle')!
  vibToggle.className = 'toggle' + (opts.vibrationEnabled ? ' on' : '')

  sfxToggle.replaceWith(sfxToggle.cloneNode(true))
  vibToggle.replaceWith(vibToggle.cloneNode(true))
  quitBtn.replaceWith(quitBtn.cloneNode(true))

  document.getElementById('sfx-toggle')!.addEventListener('click', opts.onToggleSound)
  document.getElementById('vib-toggle')!.addEventListener('click', opts.onToggleVibration)
  document.getElementById('quit-btn')!.addEventListener('click', () => {
    closeOverlay('settings-overlay')
    opts.onQuit()
  })
  document.getElementById('modal-close-settings')!.addEventListener('click', () => {
    closeOverlay('settings-overlay')
  })

  openOverlay('settings-overlay')
}

export function showQuitConfirmModal(onYes?: () => void, onNo?: () => void): void {
  const yesBtn = document.getElementById('btn-quit-yes')!
  const noBtn = document.getElementById('btn-quit-no')!
  const closeBtn = document.getElementById('modal-close-quit')!

  yesBtn.replaceWith(yesBtn.cloneNode(true))
  noBtn.replaceWith(noBtn.cloneNode(true))
  closeBtn.replaceWith(closeBtn.cloneNode(true))

  document.getElementById('btn-quit-yes')!.addEventListener('click', () => {
    closeOverlay('quit-overlay')
    onYes?.()
  })
  document.getElementById('btn-quit-no')!.addEventListener('click', () => {
    closeOverlay('quit-overlay')
    onNo?.()
  })
  document.getElementById('modal-close-quit')!.addEventListener('click', () => {
    closeOverlay('quit-overlay')
    onNo?.()
  })

  openOverlay('quit-overlay')
}

const lbData = [
  [
    { name: '玩家小明', emoji: '🐉', val: '12次' },
    { name: '玩家大帅', emoji: '🦁', val: '8次' },
    { name: '玩家豆豆', emoji: '🐼', val: '5次' },
  ],
  [
    { name: '玩家小明', emoji: '🐉', val: '13步' },
    { name: '玩家大帅', emoji: '🦁', val: '15步' },
    { name: '你', emoji: '😊', val: '--' },
  ],
  [
    { name: '玩家小明', emoji: '🐉', val: '22s' },
    { name: '玩家大帅', emoji: '🦁', val: '31s' },
    { name: '你', emoji: '😊', val: '--' },
  ],
]

export function showLeaderboardModal(bestSteps: number | null, bestTime: number | null, wins: number): void {
  lbData[1][2].val = bestSteps ? bestSteps + '步' : '--'
  lbData[2][2].val = bestTime ? bestTime + 's' : '--'
  lbData[0][2] = { name: '你', emoji: '😊', val: wins + '次' }

  const renderTab = (tab: number) => {
    const data = lbData[tab]
    const medals = ['🥇', '🥈', '🥉']
    document.getElementById('lb-content')!.innerHTML = data.map((item, i) => `
      <div class="lb-item">
        <div class="lb-rank">${medals[i] || i + 1}</div>
        <div class="lb-avatar">${item.emoji}</div>
        <div class="lb-name">${item.name}</div>
        <div class="lb-val">${item.val}</div>
      </div>
    `).join('')
  }

  const tabBtns = document.querySelectorAll('.lb-tab')
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = parseInt((btn as HTMLElement).dataset.tab || '0')
      tabBtns.forEach(b => {
        const el = b as HTMLElement
        el.style.background = el.dataset.tab === String(tab) ? '#FF6B35' : '#F0E8E0'
        el.style.color = el.dataset.tab === String(tab) ? 'white' : '#888'
      })
      renderTab(tab)
    })
  })

  renderTab(0)

  document.getElementById('modal-close-lb')!.addEventListener('click', () => {
    closeOverlay('lb-overlay')
  })

  openOverlay('lb-overlay')
}
