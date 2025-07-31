# AI Code Review CLI

> 基于 AI 的自动化代码审查工具，支持 Git 钩子与独立 CLI，支持多 AI 服务、丰富配置与灵活集成。

---

## ✨ 功能特性

- **自动分析暂存区 diff**，仅审查已 git add 的变更。
- **多 AI 服务支持**：支持 Qwen（通义千问）、OpenAI（可扩展）。
- **分块处理大 diff**，避免模型 token 超限。
- **自定义严格程度**：高/中/低，影响审查范围和阻断策略。
- **可配置忽略文件/目录**，防止无关内容进入审查。
- **自定义提示词模板**，满足多样审查风格。
- **结构化输出**：file、line、issue、severity、suggestion。
- **彩色高亮 CLI 输出**，严重性一目了然。
- **支持跳过审查（环境变量/命令行参数）**。
- **健壮的错误处理与重试机制**。
- **安全：API 密钥仅从配置/环境变量读取，无硬编码。**

---

## 🚀 快速开始

### 1. 安装

```bash
npm install -D @hope-ym/ai-code-review
```

或全局安装：

```bash
npm install -g @hope-ym/ai-code-review
```

### 2. 配置 AI 密钥

在项目根目录新建 `.env` 文件：

```
QWEN_API_KEY=你的密钥
```

或直接写入 `ai-cr.config.js`（见下方）。

### 3. 可选：生成/编辑配置文件

在项目根目录创建 `ai-cr.config.js`，支持如下配置：

```js
export default {
  provider: 'qwen', // 'qwen' | 'openai' | ...
  apiKey: '你的密钥', // 优先使用此处
  strictness: 'medium', // 'high'/'medium'/'low'
  ignore: ['node_modules', 'dist', '*.md', '*.test.*', '.git', '*.lock'],
  promptTemplate: '', // 可选，自定义提示词模板，${diff} 占位符自动替换
};
```

- 配置文件优先级：`ai-cr.config.js` > `.env` > 默认值
- 忽略规则支持通配符、目录、文件名
- promptTemplate 支持任意字符串，`${diff}` 自动替换为本次 diff 内容

### 4. 运行代码审查

```bash
npx ai-cr
```
或
```bash
npm run ai-cr
```

### 5. 集成 Git 钩子（pre-commit）

在 `.husky/pre-commit` 或 `.git/hooks/pre-commit` 中添加：

```bash
npx ai-cr || exit 1
```

如有严重问题将阻止提交。

---

## ⚙️ 配置说明（ai-cr.config.js）

| 字段           | 说明                               | 示例/默认值 |
|----------------|------------------------------------|-------------|
| provider       | AI 服务商标识                      | 'qwen'      |
| apiKey         | AI 服务密钥                        | ''          |
| strictness     | 审查严格程度（high/medium/low）    | 'medium'    |
| ignore         | 忽略文件/目录/通配符数组           | ['node_modules', '*.md'] |
| promptTemplate | 自定义 AI 审查提示词模板           | ''          |
| dryRun         | dry-run 测试模式（不调用 AI）      | false       |
| tokenLimit     | 单次审查最大 token 数（防止爆量）  | 50000       |

---

## 🖥️ 输出示例

```bash
🔍 正在检查暂存区代码变更...
🚨 AI 审查发现 2 个问题：

1. [high] src/index.js:42
   存在 SQL 注入风险
   💡 建议: 使用参数化查询

2. [low] README.md:1
   缺少文件头注释
   💡 建议: 添加项目描述注释

❌ 建议修复问题后再提交。
```

---

## 📝 常见问题与注意事项

- **API 密钥安全**：请勿将密钥提交到 git，建议 `.env` 和 `ai-cr.config.js` 写入 `.gitignore`。
- **成本与延迟**：AI 审查可能产生费用和延迟，请合理配置 ignore 和分块参数。
- **幻觉风险**：AI 结果仅供参考，最终判断请由开发者把控。
- **隐私说明**：代码 diff 会发送到第三方 AI 服务，敏感项目请谨慎使用。
- **自定义 prompt**：如需特殊审查风格，直接在 promptTemplate 填写，`${diff}` 自动替换。
- **跳过审查**：可用 `AI_CR_SKIP=1 npx ai-cr` 或 `npx ai-cr --no-verify` 跳过。
- **dry-run 测试模式**：
    - 配置 `dryRun: true`，或命令行加 `--dry-run`，或环境变量 `AI_CR_DRY_RUN=1`，可只输出 diff hash，不调用 AI、不消耗 token，适合开发/CI 测试。
- **tokenLimit 限制**：
    - 配置 `tokenLimit` 可自定义单次最大 token 数，超限自动终止，避免意外爆量消耗。
- **diff 缓存机制**：
    - 工具会自动缓存每个 diff prompt 的 AI 结果（基于 hash），同样内容不会重复请求，显著节省 token。

---

## 📦 进阶用法

- 支持多 provider 扩展（如需接入更多 AI，可自定义 provider 字段）。
- 支持 dry-run、输出到文件、CI 集成等高级用法：
    - dry-run：`npx ai-cr --dry-run` 或 `AI_CR_DRY_RUN=1 npx ai-cr`
    - token 限制：`tokenLimit: 20000`（在 config 配置）
    - 缓存：同一 diff（内容 hash 相同）只会请求一次，反复运行不再消耗 token
- 可通过 `files` 字段限制 npm 包发布内容，保护隐私。

---

## 🛠️ 贡献与反馈

欢迎 issue、PR 或定制需求！

---

## License

MIT
