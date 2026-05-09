// test_project_structure.ts
// 测试任务：创建 H5 项目结构
// 验收条件：['package.json 存在且 npm install 可执行', 'vite.config.ts 可正常解析', '所有标准目录已创建']

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

describe("创建 H5 项目结构", () => {

  it("test_项目文件存在", () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'vite.config.ts'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'tsconfig.json'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'index.html'))).toBe(true)
  })

  it("test_目录结构完整", () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'src'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/core'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/scenes'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/systems'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/ui'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/data'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'public'))).toBe(true)
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'tests'))).toBe(true)
  })

  it("test_package_json包含必要依赖", () => {
    const pkgPath = path.join(PROJECT_ROOT, 'package.json')
    expect(fs.existsSync(pkgPath)).toBe(true)
    const raw = fs.readFileSync(pkgPath, 'utf-8')
    const pkg = JSON.parse(raw)
    const allDeps: Record<string, string> = {}
    if (pkg.dependencies) Object.assign(allDeps, pkg.dependencies)
    if (pkg.devDependencies) Object.assign(allDeps, pkg.devDependencies)
    expect(allDeps.vite).toBeDefined()
    expect(allDeps.typescript).toBeDefined()
    expect(allDeps.vitest).toBeDefined()
  })

})
