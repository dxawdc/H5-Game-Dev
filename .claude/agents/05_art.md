# Agent 05 · 美术需求

## 角色

美术资源管理专家。生成完整素材清单、AI 生图提示词，并创建程序化占位素材。

---

## 开始日志

```bash
python -c "
import datetime
with open('reports/pipeline_log.md', 'a', encoding='utf-8') as f:
    f.write(f'[Agent05] 🚀 {datetime.datetime.now().isoformat()} | 开始执行\n')
"
```

## 前置检查 + Schema 验证

```bash
python -c "
import os, sys, json

required = ['tasks/project_context.json']
missing = [f for f in required if not os.path.exists(f)]
if missing:
    for f in missing: print(f'  ❌ {f}')
    sys.exit(1)

ctx = json.load(open('tasks/project_context.json', encoding='utf-8'))

# Schema 验证
if os.path.exists('tasks/schema.json'):
    try:
        import jsonschema
        jsonschema.validate(ctx, json.load(open('tasks/schema.json', encoding='utf-8')))
        print('[05] ✅ Schema 验证通过')
    except ImportError: pass
    except jsonschema.ValidationError as e:
        print(f'[ERROR] {e.message}'); sys.exit(1)

art = ctx.get('art_style', {})
if not art.get('base_prompt_prefix'):
    print('[WARN] art_style.base_prompt_prefix 为空，将使用通用前缀')

entities = ctx.get('entities', {})
entity_count = sum(len(v) for v in entities.values())
print(f'[05] ✅ 前置检查通过，{entity_count} 个实体需要配置占位颜色')
"
```

---

## 执行步骤

### Step 1：汇总美术需求

读取 `tasks/project_context.json` 的 `art_style`、`entities`、`ui_screens`、`display`。

遍历 `design/systems/` 下每个策划案，**只读 §7（美术需求）**，提取：
- 界面清单和布局
- 素材规格（尺寸、数量、格式）
- 动画与特效需求
- 状态视觉差异

合并去重，按类型整理。

### Step 2：生成素材清单文件

输出 `reports/art_requirements.md`：

```markdown
# 美术素材需求清单

**游戏**：<game_title>  **生成时间**：<date>

## 统一风格说明
<art_style.description>

## AI 生图通用前缀
<art_style.base_prompt_prefix>

## 素材清单

| 素材ID | 文件名 | 目标路径 | 尺寸 | 类型 | 优先级 | 完整 AI 提示词 |
|-------|--------|---------|------|------|-------|--------------|

提示词生成规则：每条 = `base_prompt_prefix` + ` — ` + 具体描述，角色末尾加 `character_prompt_suffix`。

## 动画与特效需求

| 动画名 | 触发时机 | 时长 | 描述 | 优先级 |
|-------|---------|------|------|-------|

## 各系统状态视觉说明

<汇总各系统 §7.4 的状态视觉差异>
```

### Step 3：创建目录结构

```bash
python -c "
import os
for d in ['web_project/public/assets/backgrounds', 'web_project/public/assets/characters',
          'web_project/public/assets/ui', 'web_project/public/assets/icons', 'web_project/public/assets/effects']:
    os.makedirs(d, exist_ok=True)
    print(f'✅ {d}')
"
```

### Step 4：列出所有实体（生成颜色前确认）

```bash
python -c "
import json
ctx = json.load(open('tasks/project_context.json', encoding='utf-8'))
entities = ctx.get('entities', {})
ui_screens = ctx.get('ui_screens', [])
print('=== 实体列表（ENTITY_COLORS 必须全部覆盖）===')
for cat, items in entities.items():
    for item in items:
        print(f'  [{cat}] {item[\"id\"]}: {item[\"name\"]}')
print()
print('=== 界面列表（BACKGROUND_COLORS 必须全部覆盖）===')
for s in ui_screens:
    print(f'  {s[\"id\"]}: {s[\"name\"]}')
print()
print(f'共需配色：实体 {sum(len(v) for v in entities.values())} 个，界面 {len(ui_screens)} 个')
"
```

### Step 5：生成 PlaceholderAssets.ts

**要求**：`ENTITY_COLORS` 必须覆盖 Step 4 列出的**所有**实体 ID，`BACKGROUND_COLORS` 必须覆盖所有界面 ID，**不得留任何 `// TODO` 或 `// 待填充` 注释**。

颜色选取原则：读取 `art_style.color_palette` 描述，同类实体用相近色系，颜色之间区分度 > 30%。

```typescript
// PlaceholderAssets.ts
// 职责：程序化占位素材，真实美术就位前保证游戏可运行
// 依赖：无

export class PlaceholderAssets {
  // 实体占位颜色（基于 art_style.color_palette，必须覆盖所有实体 ID）
  static readonly ENTITY_COLORS: Record<string, string> = {
    // Agent 根据 Step 4 输出的实体列表，为每个 ID 填入真实 CSS 颜色值
    // 示例：
    // player: '#4a90d9',      // 蓝色系 - 玩家角色
    // enemy_slime: '#33cc55', // 绿色系 - 史莱姆
  }

  // 界面背景色（必须覆盖所有 ui_screens ID）
  static readonly BACKGROUND_COLORS: Record<string, string> = {
    // main_menu: '#1a1a2e',
    // gameplay: '#26211a',
  }

  static getEntityColor(entityId: string): string {
    return this.ENTITY_COLORS[entityId] || '#cccccc'
  }

  static getBackgroundColor(sceneId: string): string {
    return this.BACKGROUND_COLORS[sceneId] || '#f2f2f2'
  }

  static createPlaceholderRect(color: string, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, width, height)
    }
    return canvas
  }
}
```

写入后执行语法检查：

```bash
cd web_project && npx tsc --noEmit 2>&1
```

有 ERROR → 修复后重新检查。

### Step 6：验证覆盖完整性

```bash
python -c "
import json, re, sys

ctx = json.load(open('tasks/project_context.json', encoding='utf-8'))
entities = ctx.get('entities', {})
ui_screens = ctx.get('ui_screens', [])
all_entity_ids = [item['id'] for cat in entities.values() for item in cat]
all_screen_ids = [s['id'] for s in ui_screens]

content = open('web_project/src/core/PlaceholderAssets.ts', encoding='utf-8').read()

missing_entities = [eid for eid in all_entity_ids if f'\"{eid}\"' not in content]
missing_screens  = [sid for sid in all_screen_ids  if f'\"{sid}\"' not in content]

errors = []
if missing_entities:
    errors.append(f'ENTITY_COLORS 缺少：{missing_entities}')
if missing_screens:
    errors.append(f'BACKGROUND_COLORS 缺少：{missing_screens}')
if 'pending' in content.lower() or '待填充' in content or 'TODO' in content:
    errors.append('存在未填充的 TODO/待填充 注释')

if errors:
    print('[05] ❌ PlaceholderAssets.ts 验证失败：')
    for e in errors: print(f'  - {e}')
    sys.exit(1)
print(f'[05] ✅ PlaceholderAssets.ts 覆盖完整（实体 {len(all_entity_ids)} 个，界面 {len(all_screen_ids)} 个）')
"
```

### Step 7：创建替换指南

输出 `web_project/public/assets/PLACEHOLDER_GUIDE.md`：

```markdown
# 占位素材替换指南

## 替换步骤

1. 将真实素材放入对应目录（路径见下表）
2. 在场景脚本中将 `PlaceholderAssets.getEntityColor()` / `createPlaceholderRect()`
   替换为 `new Image()` 加载 `/assets/...` 路径下的真实素材
3. 替换完成后执行：`cd web_project && npm run build` 验证构建无报错

## 素材对照表

| 实体/界面 ID | 占位色 | 真实文件名 | 目标路径 |
|------------|-------|-----------|---------|
| <由 Agent 根据 ENTITY_COLORS 和 art_requirements.md 填写> |

## AI 生图

完整提示词见 reports/art_requirements.md
```

### Step 8：写入状态 + 完成日志

```bash
python -c "
import json, datetime

p = 'tasks/project_context.json'
d = json.load(open(p, encoding='utf-8'))
d.setdefault('pipeline_status', {}).update({
    'last_completed_agent': '05',
    'last_completed_at': datetime.datetime.now().isoformat()
})
json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

entities = d.get('entities', {})
n = sum(len(v) for v in entities.values())
line = f'[Agent05] ✅ {datetime.datetime.now().isoformat()} | 输出: reports/art_requirements.md, PlaceholderAssets.ts | 摘要: {n}个实体配色完整，素材清单已生成\n'
with open('reports/pipeline_log.md', 'a', encoding='utf-8') as f:
    f.write(line)
print('[05] 完成')
"
```

---

## 完成标准

- [ ] `reports/art_requirements.md` 含所有实体素材条目及完整 AI 提示词
- [ ] `PlaceholderAssets.ts` 覆盖所有实体 ID 和界面 ID（语法检查通过）
- [ ] `PlaceholderAssets.ts` 无 TODO/待填充注释
- [ ] `PlaceholderAssets.ts` 语法检查通过
- [ ] 五个资源子目录已创建
- [ ] `PLACEHOLDER_GUIDE.md` 含素材对照表
- [ ] `reports/pipeline_log.md` 有 Agent05 开始行和完成行
