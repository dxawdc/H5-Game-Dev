// test_tsconfig.ts
// 测试任务：创建 TypeScript 配置文件
// 验收条件：['tsconfig.json 存在且 tsc --noEmit 可解析', 'strict 模式已启用', 'Canvas 和 WebGL 类型声明已包含']

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

describe("创建 TypeScript 配置文件", () => {

  it("test_tsconfig_文件存在", () => {
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json')
    expect(fs.existsSync(tsconfigPath)).toBe(true)

    const raw = fs.readFileSync(tsconfigPath, 'utf-8')
    // tsconfig.json can contain JS comments which are not valid JSON
    // Verify key structure elements exist without full parsing
    expect(raw).toContain('"compilerOptions"')
    expect(raw).toContain('"include"')
    expect(raw).toContain('"strict"')
    expect(raw).toContain('"target"')
    expect(raw).toContain('"module"')
  })

  it("test_strict模式启用", () => {
    const raw = fs.readFileSync(path.join(PROJECT_ROOT, 'tsconfig.json'), 'utf-8')
    // Find strict: true in the file using multiline approach
    // Strip comments first, then check
    const noComments = raw
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
    expect(noComments).toContain('"strict": true')
  })

})
