# Agent 08 · 构建导出

## 角色

DevOps 工程师。配置构建参数，完成项目打包。

---

## 开始日志

```bash
python -c "
import datetime
with open('reports/pipeline_log.md', 'a', encoding='utf-8') as f:
    f.write(f'[Agent08] 🚀 {datetime.datetime.now().isoformat()} | 开始执行\n')
"
```

## 前置检查

```bash
python -c "
import os, sys

required = ['tasks/project_context.json', 'reports/test_report.md', 'web_project/package.json']
missing = [f for f in required if not os.path.exists(f)]
if missing:
    for f in missing: print(f'  ❌ {f}')
    sys.exit(1)

content = open('reports/test_report.md', encoding='utf-8').read()
if '失败：0' not in content and 'failed: 0' not in content.lower():
    print('[08] ❌ 测试报告未显示"失败：0"，请先修复失败的测试')
    sys.exit(1)

print('[08] ✅ 前置检查通过，开始构建')
"
```

---

## 执行步骤

### Step 1：读取构建参数

```bash
python -c "
import json
ctx = json.load(open('tasks/project_context.json', encoding='utf-8'))
m, d, s = ctx['meta'], ctx['display'], ctx['global_singleton']
print(f'游戏：{m[\"game_title\"]}  v{m[\"version\"]}')
print(f'分辨率：{d[\"viewport_width\"]}x{d[\"viewport_height\"]}（{d[\"orientation\"]}）')
print(f'单例：{s[\"class_name\"]} → {s[\"script_path\"]}')
"
```

### Step 2：确保构建配置完整

检查 `web_project/vite.config.ts` 和 `web_project/tsconfig.json` 是否存在：

```bash
python -c "
import os, json

errors = []
if not os.path.exists('web_project/vite.config.ts'):
    errors.append('web_project/vite.config.ts 不存在')

if os.path.exists('web_project/package.json'):
    pkg = json.load(open('web_project/package.json', encoding='utf-8'))
    scripts = pkg.get('scripts', {})
    if 'build' not in scripts:
        errors.append('package.json 缺少 build 脚本')
    if 'dev' not in scripts:
        errors.append('package.json 缺少 dev 脚本')

if errors:
    for e in errors: print(f'[08] ❌ {e}')
else:
    print('[08] ✅ 构建配置完整')
"
```

### Step 3：最终语法检查

```bash
cd web_project && npx tsc --noEmit 2>&1
```

有 ERROR → 停止，不继续构建。

### Step 4：执行构建

```bash
python -c "
import os; os.makedirs('builds', exist_ok=True)
os.makedirs('web_project/dist', exist_ok=True)
"

cd web_project && npm run build 2>&1
```

验证构建产物：

```bash
python -c "
import os, sys, glob

# 检查 dist 目录
dist_files = glob.glob('web_project/dist/**/*', recursive=True)
dist_files = [f for f in dist_files if os.path.isfile(f)]

if not dist_files:
    print('[08] ❌ web_project/dist/ 为空，构建可能失败')
    sys.exit(1)

total_size = sum(os.path.getsize(f) for f in dist_files)
main_js = [f for f in dist_files if f.endswith('.js')]
main_html = [f for f in dist_files if f.endswith('.html')]

print(f'[08] ✅ 构建成功')
print(f'  文件数：{len(dist_files)}')
print(f'  总大小：{total_size // 1024} KB')
print(f'  JS：{len(main_js)} 个  HTML：{len(main_html)} 个')

# 复制 dist 到 builds（归档）
import shutil
if os.path.exists('builds/dist'):
    shutil.rmtree('builds/dist')
shutil.copytree('web_project/dist', 'builds/dist')
print(f'[08] ✅ builds/dist 已归档')
"
```

### Step 5：生成报告

**reports/build_report.md**（简洁引用式）：

```markdown
# 构建报告

**游戏**：<game_title>  **版本**：<version>  **时间**：<datetime>

## 产物

| 产物 | 路径 | 说明 |
|-----|------|------|
| 构建目录 | builds/dist/ | 完整 HTML5 构建产物 |
| 入口 HTML | builds/dist/index.html | 游戏入口页 |
| JS 包 | builds/dist/assets/*.js | 编译后脚本 |

## 配置

- 分辨率：<W>×<H>（<orientation>） 构建工具：Vite  TS 严格模式：true

## 质量门

- 测试：✅ 全部通过（见 reports/test_report.md）
- 语法检查：✅ 无错误
- 构建：✅ 成功

下一步：见 reports/build_guide.md
```

**reports/build_guide.md**（Web 部署指南）：

```markdown
# Web 构建部署指南

## 构建产物

构建产物位于 `builds/dist/`（从 `web_project/dist/` 复制归档）。

## 部署方式

### 方式一：静态服务器（推荐）

将 `builds/dist/` 目录部署到任意静态 Web 服务器（Nginx、Apache、GitHub Pages、Vercel 等）。

```bash
# 本地预览（需全局安装 http-server）
npx http-server builds/dist -p 8080
```

### 方式二：GitHub Pages

1. 将 `builds/dist/` 内容推送到 `gh-pages` 分支
2. 在仓库 Settings → Pages 中选择该分支

### 方式三：嵌入 App（WebView）

```html
<!-- Android WebView -->
<WebView
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:hardwareAccelerated="true"
  android:webChromeClient="@+id/webChrome"
  app:srcCompat="@+id/webview" />

webView.getSettings().setJavaScriptEnabled(true)
webView.getSettings().setAllowFileAccess(true)
webView.loadUrl("file:///android_asset/index.html")
```

## 性能优化建议

- 启用 Vite 的 `minify: 'terser'` 进一步压缩
- 图片资源使用 WebP 格式
- 代码分割：动态 `import()` 懒加载非核心模块
- 启用 gzip / brotli 压缩
```

### Step 6：写入状态 + 完成日志

```bash
python -c "
import json, datetime, os, glob

p = 'tasks/project_context.json'
d = json.load(open(p, encoding='utf-8'))
d.setdefault('pipeline_status', {}).update({
    'last_completed_agent': '08',
    'last_completed_at': datetime.datetime.now().isoformat()
})
json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# 统计构建产物
dist_files = glob.glob('web_project/dist/**/*', recursive=True)
file_count = len([f for f in dist_files if os.path.isfile(f)])
line = f'[Agent08] ✅ {datetime.datetime.now().isoformat()} | 输出: builds/dist/ | 摘要: 构建成功，{file_count}个文件\n'
with open('reports/pipeline_log.md', 'a', encoding='utf-8') as f:
    f.write(line)
print('[08] 完成')
"
```

---

## 完成标准

- [ ] `builds/dist/index.html` 存在且为有效 HTML
- [ ] `builds/dist/` 包含 `.js` 入口文件
- [ ] 语法检查无 ERROR
- [ ] `reports/build_report.md` 和 `reports/build_guide.md` 已生成
- [ ] `reports/pipeline_log.md` 有 Agent08 开始行和完成行
