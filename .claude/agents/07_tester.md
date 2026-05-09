# Agent 07 · 自动测试

## 角色

QA 工程师。Agent 06 已在实现功能时填充了测试骨架，本 Agent 负责：**补全遗漏的测试用例**、**添加集成测试**、**全量回归运行**。

---

## 开始日志

```bash
python -c "
import datetime
with open('reports/pipeline_log.md', 'a', encoding='utf-8') as f:
    f.write(f'[Agent07] 🚀 {datetime.datetime.now().isoformat()} | 开始执行\n')
"
```

## 前置检查

```bash
python -c "
import os, sys, json, glob

required = ['tasks/project_context.json', 'tasks/backlog.json', 'web_project/package.json']
missing = [f for f in required if not os.path.exists(f)]
if missing:
    for f in missing: print(f'  ❌ {f}')
    sys.exit(1)

bl = json.load(open('tasks/backlog.json', encoding='utf-8'))
in_progress = [t for t in bl.get('tasks', []) if t['status'] == 'in_progress']
pending     = [t for t in bl.get('tasks', []) if t['status'] == 'pending']
if in_progress or pending:
    print(f'[WARN] 有 {len(pending)} 个 pending、{len(in_progress)} 个 in_progress 任务，建议先完成 Agent 06')

# 检查骨架中残留的 it.todo()
skeleton_files = glob.glob('web_project/tests/**/test_*.gd', recursive=True)
pending_count = sum(
    open(f, encoding='utf-8').read().count('pending(')
    for f in skeleton_files if os.path.exists(f)
)
if pending_count > 0:
    print(f'[WARN] 测试骨架中仍有 {pending_count} 处 it.todo() 占位，Agent07 将补全')

print(f'[07] ✅ 前置检查通过')
"
```

---

## 执行步骤

### Step 1：验证 Vitest 可用性

```bash
python -c "
import os
vi = os.path.exists('node_modules/.bin/vitest') or os.path.exists('node_modules/vitest')
print('[07] ✅ Vitest 已安装' if vi else 'INSTALL_NEEDED')
"
```

若需安装：

```bash
cd web_project && npm install
```

确认 `package.json` 中有 Vitest 配置：

```bash
python -c "
import json
pkg = json.load(open('web_project/package.json', encoding='utf-8'))
scripts = pkg.get('scripts', {})
has_test = 'test' in scripts or 'vitest' in ' '.join(scripts.values())
print('[07] ✅ 测试命令已配置' if has_test else '⚠️ package.json 缺少 test 脚本')
"
```
    print('[07] ✅ GUT 插件配置已存在')
"
```

### Step 2：补全残留 it.todo() 占位

扫描所有测试文件中仍有 `it.todo()` 的方法，根据对应任务的 `acceptance_criteria` 和系统策划案 §5 补全：

```bash
python -c "
import glob, os, json

bl = json.load(open('tasks/backlog.json', encoding='utf-8'))
task_by_testfile = {t['test_file']: t for t in bl['tasks'] if t.get('test_file')}

skeleton_files = glob.glob('web_project/tests/**/test_*.gd', recursive=True)
for fpath in skeleton_files:
    content = open(fpath, encoding='utf-8').read()
    if 'pending(' not in content:
        continue
    task = task_by_testfile.get(fpath)
    if task:
        print(f'需补全：{fpath}')
        print(f'  任务：{task[\"title\"]}')
        print(f'  验收：{task[\"acceptance_criteria\"]}')
        print(f'  用例：{task.get(\"test_cases\",[])}')
    else:
        print(f'需补全（无对应任务）：{fpath}')
"
```

对每个有 `it.todo()` 的文件，将占位替换为真实断言。

### Step 3：补全通用集成测试

检查以下三个集成测试文件是否存在且无 `it.todo()` 残留，不存在则创建：

**test_scene_tree.ts**（验证页面结构）：

```typescript
// test_scene_tree.ts
// 验证页面结构与 project_context.scene_tree 定义一致

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Main 页面结构', () => {
  let mainScene: HTMLElement

  beforeEach(() => {
    // 初始化主页面 DOM 结构
    document.body.innerHTML = '<div id="app"></div>'
    mainScene = document.getElementById('app')!
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Main 页面应能正常渲染', () => {
    expect(mainScene).not.toBeNull()
  })
})

// Agent 根据 project_context.scene_tree.root.children
// 为每个子页面生成：
// it('节点 <name> 应存在', () => {
//   expect(document.getElementById('<name>')).not.toBeNull()
// })
```

**test_game_data.ts**（P2：含测试隔离）：

```typescript
// test_game_data.ts
// 验证全局单例 GameData 可访问，含存读档往返和测试隔离

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GameData } from '../src/core/GameData'

describe('GameData 全局单例', () => {
  beforeEach(() => {
    // P2 测试隔离：每个用例前重置到初始状态
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
  })

  afterEach(() => {
    // 清理测试产生的存档数据（localStorage）
    localStorage.removeItem('game_save')
  })

  it('GameData 应可访问', () => {
    expect(GameData).toBeDefined()
  })

  // Agent 根据 project_context.global_singleton.key_variables 生成：
  // it('GameData 应有 <var>', () => {
  //   expect(GameData).toHaveProperty('<var>')
  // })

  it('存读档往返应正确', () => {
    // 修改第一个 currency 的值，存档，重置，读档，验证恢复
    // Agent 根据 project_context.progression.currency[0] 填写具体字段名
  })

  it('无存档时应使用初始值', () => {
    localStorage.removeItem('game_save')
    GameData.loadData()
    // 验证所有 key_variables 均为 initial 值
  })
})
```

**test_events.ts**（验证关键事件）：

事件列表来自各系统策划案 §6.2，由 Agent 03 已校验格式：

```typescript
// test_events.ts
// 验证关键事件的派发与监听
// 事件来源：各系统策划案 §6.2

import { describe, it, expect, beforeEach } from 'vitest'
import { EventBus } from '../src/core/EventBus'
import { GameData } from '../src/core/GameData'

describe('关键事件验证', () => {
  beforeEach(() => {
    if (GameData.resetToDefaults) {
      GameData.resetToDefaults()
    }
  })

  // 为每个 §6.2 中的事件生成：
  // it('<eventName> 应被正确派发', () => {
  //   const handler = vi.fn()
  //   EventBus.on('<eventName>', handler)
  //   GameData.<triggerMethod>()
  //   expect(handler).toHaveBeenCalled()
  // })
})
```

### Step 4：按系统策划案 §5 补充边界测试

遍历 `project_context.test_priorities`，读取对应系统 §5（只读 §5），
为每个 `key_cases` 确认对应测试用例存在，不存在则在对应测试文件中补充。

按游戏类型额外补充（读 `meta.genre`）：
- 模拟经营：收入计算、倍率叠加、时间循环边界
- RPG：伤害公式、技能冷却、升级曲线
- 平台跳跃：碰撞判定、速度/跳跃边界
- 塔防：波次生成、攻击范围计算
- 卡牌：费用计算、手牌上限
- 视觉小说：分支条件、旗帜变量

### Step 5：热身导入 + 全量运行

```bash
python -c "import os; os.makedirs('reports', exist_ok=True)"

cd web_project && npx vitest run 2>&1 | tee ../reports/test_results.txt
```

### Step 6：处理失败

```bash
python -c "
import os
if os.path.exists('reports/test_results.txt'):
    content = open('reports/test_results.txt', encoding='utf-8').read()
    fail_lines = [l for l in content.splitlines() if 'FAILED' in l or 'Error' in l]
    if fail_lines:
        print('[07] ❌ 存在失败：')
        for l in fail_lines[:20]: print(f'  {l}')
    else:
        print('[07] ✅ 所有测试通过')
"
```

有失败 → 修复对应**实现代码**（不修改测试），重新运行，循环直到全部通过。

### Step 7：生成测试报告（引用式）

输出 `reports/test_report.md`（只写摘要，不内联原始输出）：

```markdown
# 测试报告

**生成时间**：<datetime>
**详细输出**：见 reports/test_results.txt

## 摘要

- 总测试数：<N>
- 通过：<N> ✅
- 失败：0 ❌（P2 测试隔离：每用例前执行 reset_to_defaults）

## 单元测试

| 测试文件 | 用例数 | 通过 | 覆盖内容 |
|---------|--------|------|---------|
| test_game_data.ts | <N> | <N> | 存读档、货币增减、边界 |
| test_entities.ts | <N> | <N> | JSON 格式、实体属性 |
| test_<system>.ts | <N> | <N> | 数值规则、边界条件 |

## 集成测试

| 测试文件 | 用例数 | 通过 | 覆盖内容 |
|---------|--------|------|---------|
| test_scene_tree.ts | <N> | <N> | 主页面渲染、DOM 结构 |
| test_game_data.ts | <N> | <N> | GameData 访问、存读档往返、测试隔离 |
| test_events.ts | <N> | <N> | 关键事件派发与监听 |

## 覆盖说明

- 核心数值逻辑：✅
- 边界条件（来自各系统 §5）：✅
- 存读档往返（含无存档文件场景）：✅
- 测试隔离（resetToDefaults）：✅
- 页面结构：✅
- 关键事件：✅
```

### Step 8：写入状态 + 完成日志

```bash
python -c "
import json, datetime

p = 'tasks/project_context.json'
d = json.load(open(p, encoding='utf-8'))
d.setdefault('pipeline_status', {}).update({
    'last_completed_agent': '07',
    'last_completed_at': datetime.datetime.now().isoformat()
})
json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

line = f'[Agent07] ✅ {datetime.datetime.now().isoformat()} | 输出: reports/test_report.md | 摘要: 全量测试通过，0失败，含测试隔离\n'
with open('reports/pipeline_log.md', 'a', encoding='utf-8') as f:
    f.write(line)
print('[07] 完成')
"
```

---

## 完成标准

- [ ] 测试骨架中无残留 `it.todo()` 占位
- [ ] `test_scene_tree.ts`、`test_game_data.ts`、`test_events.ts` 三文件存在
- [ ] `test_game_data.ts` 的 `beforeEach` 调用 `resetToDefaults()`（P2：测试隔离）
- [ ] `test_game_data.ts` 的 `afterEach` 清理存档数据
- [ ] 所有测试通过（0 失败）
- [ ] `reports/test_results.txt` 已生成
- [ ] `reports/test_report.md` 含"失败：0"且标注测试隔离
- [ ] `reports/pipeline_log.md` 有 Agent07 开始行和完成行
