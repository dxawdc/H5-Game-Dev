// test_vitest_smoke.ts
// 测试任务：安装并验证 Vitest 测试框架
// 验收条件：['vitest 已安装至 devDependencies', 'npx vitest run 可正常执行并退出']

import { describe, it, expect } from 'vitest'

describe("安装并验证 Vitest 测试框架", () => {

  it("test_vitest_正常运行", () => {
    // 验证 Vitest 可正常执行
    expect(true).toBe(true)
  })

  it("test_基本断言功能", () => {
    expect(1 + 1).toBe(2)
    expect({ a: 1 }).toEqual({ a: 1 })
    expect([1, 2, 3]).toHaveLength(3)
    expect(null).toBeNull()
    expect(undefined).not.toBeNull()
  })

})
