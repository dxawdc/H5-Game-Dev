// SoundManager.ts
// 职责：Web Audio API 音效管理
// 依赖：GameData

import { GameData } from '../core/GameData'

class SoundManagerSingleton {
  private _ctx: AudioContext | null = null
  private _enabled: boolean = true

  get enabled(): boolean { return this._enabled }
  set enabled(v: boolean) {
    this._enabled = v
    GameData.soundEnabled = v
    GameData.saveToLocalStorage()
  }

  private _getContext(): AudioContext | null {
    if (!this._enabled) return null
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      } catch {
        return null
      }
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume()
    }
    return this._ctx
  }

  playTone(freq: number, dur: number, type: OscillatorType = 'sine', gain: number = 0.2): void {
    const ctx = this._getContext()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gainNode.gain.setValueAtTime(gain, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + dur)
    } catch { /* ignore */ }
  }

  playClick(): void {
    this.playTone(440, 0.08, 'square', 0.1)
  }

  playWin(): void {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.25, 'sine', 0.2), i * 120)
    })
  }

  playLose(): void {
    [400, 300, 200].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sawtooth', 0.15), i * 150)
    })
  }

  vibrate(): void {
    if (GameData.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(20)
    }
  }
}

export const soundManager = new SoundManagerSingleton()
