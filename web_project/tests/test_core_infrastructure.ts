// test_core_infrastructure.ts
// 测试任务：实现 EventBus 事件总线与 SceneManager 场景管理器
// 验收条件：['EventBus 支持 on/off/emit 方法且类型安全', 'SceneManager 支持 push/pop/switchTo 场景切换', '场景切换时正确调用 onEnter/onExit 生命周期']

import { describe, it, expect, beforeEach } from 'vitest'
import { EventBus } from '../src/core/EventBus'
import { SceneManager, Scene } from '../src/core/SceneManager'

describe("实现 EventBus 事件总线与 SceneManager 场景管理器", () => {
  let bus: EventBus

  beforeEach(() => {
    bus = new EventBus()
  })

  it("test_EventBus_on_emit_订阅派发", () => {
    const received: number[] = []
    bus.on('testEvent', (arg: unknown) => {
      received.push(arg as number)
    })

    bus.emit('testEvent', 42)
    expect(received).toHaveLength(1)
    expect(received[0]).toBe(42)

    bus.emit('testEvent', 100)
    expect(received).toHaveLength(2)
    expect(received[1]).toBe(100)
  })

  it("test_EventBus_off_取消订阅", () => {
    const received: number[] = []
    const callback = (arg: unknown) => {
      received.push(arg as number)
    }

    bus.on('testEvent', callback)
    bus.emit('testEvent', 1)
    expect(received).toHaveLength(1)

    bus.off('testEvent', callback)
    bus.emit('testEvent', 2)
    // 取消订阅后不应再收到事件
    expect(received).toHaveLength(1)
  })

  it("test_SceneManager_场景切换", () => {
    const manager = new SceneManager()
    expect(manager.current).toBeNull()

    // 创建 Mock 场景
    const scene1: Scene = {
      onEnter: () => {},
      onExit: () => {},
      update: () => {},
      render: () => {},
    }

    manager.switchTo(scene1)
    expect(manager.current).toBe(scene1)

    // 切换到新场景
    const scene2: Scene = {
      onEnter: () => {},
      onExit: () => {},
      update: () => {},
      render: () => {},
    }
    manager.switchTo(scene2)
    expect(manager.current).toBe(scene2)
  })

  it("test_SceneManager_生命周期顺序", () => {
    const manager = new SceneManager()
    const calls: string[] = []

    const sceneA: Scene = {
      onEnter: () => { calls.push('A.onEnter') },
      onExit: () => { calls.push('A.onExit') },
      update: () => {},
      render: () => {},
    }

    const sceneB: Scene = {
      onEnter: () => { calls.push('B.onEnter') },
      onExit: () => { calls.push('B.onExit') },
      update: () => {},
      render: () => {},
    }

    manager.switchTo(sceneA)
    expect(calls).toEqual(['A.onEnter'])

    manager.switchTo(sceneB)
    // 退出 A，进入 B
    expect(calls).toEqual(['A.onEnter', 'A.onExit', 'B.onEnter'])

    // push/pop 测试
    const sceneC: Scene = {
      onEnter: () => { calls.push('C.onEnter') },
      onExit: () => { calls.push('C.onExit') },
      update: () => {},
      render: () => {},
    }

    manager.push(sceneC)
    expect(calls).toEqual(['A.onEnter', 'A.onExit', 'B.onEnter', 'C.onEnter'])
    expect(manager.current).toBe(sceneC)

    manager.pop()
    // pop 后 C.onExit 被调用，然后 pop 方法会调用 current.onEnter (即 B.onEnter)
    expect(calls).toEqual(['A.onEnter', 'A.onExit', 'B.onEnter', 'C.onEnter', 'C.onExit', 'B.onEnter'])
    expect(manager.current).toBe(sceneB)
  })

})
