# aigroup-mdtoword-mcp

[![Version](https://img.shields.io/npm/v/aigroup-mdtoword-mcp.svg)](https://www.npmjs.com/package/aigroup-mdtoword-mcp)
[![License](https://img.shields.io/npm/l/aigroup-mdtoword-mcp.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)

「墨稿大师」是一款基于 MCP 协议构建的本地文档转换工具。它将 Markdown 高效转换为 Word 文档，并原生集成丰富的预设模板、精准的样式配置、以及页眉页脚、数学公式等高级功能，致力于为您提供专业级的排版体验。

## ✨ 核心特性

### 🎯 文档转换
- ✅ **完整的 Markdown 语法支持** - 标题、段落、列表、表格、代码块、引用等
- ✅ **数学公式支持** - 完整的 LaTeX 数学表达式解析和转换
- ✅ **多种预设模板** - 学术论文、商务报告、技术文档等专业模板
- ✅ **丰富的样式配置** - 主题系统、字体、颜色、间距等全面控制

### 🎨 样式系统
- ✅ **主题系统** - 统一颜色、字体、间距管理
- ✅ **水印功能** - 自定义文本、透明度、旋转角度
- ✅ **页眉页脚** - 自定义内容、自动页码、首页/奇偶页不同
- ✅ **自动目录** - 可配置级别和样式，支持页码引导符

### 📊 表格处理
- ✅ **12种预定义表格样式** - 简约、专业、斑马纹、网格等
- ✅ **列宽控制** - 精确控制每列宽度
- ✅ **单元格对齐** - 水平和垂直对齐方式
- ✅ **斑马纹样式** - 奇偶行不同背景色
- ✅ **数据导入** - 支持 CSV 和 JSON 格式数据导入

### 🖼️ 图像处理
- ✅ **多种图像来源** - 本地文件、网络图片、Base64 编码
- ✅ **自适应尺寸** - 自动调整图片大小
- ✅ **格式检测** - 智能识别 PNG、JPEG、GIF、SVG 等格式
- ✅ **Mermaid 流程图支持** - ```mermaid 代码块可渲染为图片嵌入 Word，失败时自动回退为普通代码块
- ✅ **错误处理** - 加载失败时显示占位符

### 🧮 数学公式
- ✅ **LaTeX 数学表达式** - 完整的 LaTeX 语法支持
- ✅ **行内和行间公式** - `$...$` 和 `$$...$$` 格式
- ✅ **多种数学组件** - 分数、根式、上下标、求和、积分等
- ✅ **高性能处理** - 数学公式预处理仅需毫秒级时间

### 🔧 MCP 协议特性
- ✅ **最新 MCP SDK 1.20.1** - 使用最新的 TypeScript SDK
- ✅ **Zod 类型验证** - 完整的输入输出类型安全
- ✅ **Streamable HTTP Transport** - 支持 HTTP 和 stdio 双传输方式
- ✅ **通知防抖** - 优化网络性能，减少不必要的通知
- ✅ **结构化输出** - 工具返回结构化数据便于处理

## 🚀 快速开始

### 安装

#### 全局安装
```bash
npm install -g aigroup-mdtoword-mcp
```

#### 本地安装
```bash
npm install aigroup-mdtoword-mcp
```

#### 通过 npx 直接使用
```bash
npx aigroup-mdtoword-mcp
```

### 使用方式

#### 1. 作为 MCP 服务器 (Stdio)

在 Roo Code、Claude Desktop 或其他支持 MCP 的工具中配置：

```json
{
  "mcpServers": {
    "aigroup-mdtoword-mcp": {
      "command": "npx",
      "args": ["-y", "aigroup-mdtoword-mcp"]
    }
  }
}
```

#### 2. 作为 HTTP 服务器

```bash
npm run server:http
# 或
node dist/http-server.js
```

服务器将在 http://localhost:3000 启动，支持 CORS 配置。

## 📋 MCP 工具

### 主要工具

| 工具名称 | 功能描述 | 核心特性 |
|---------|---------|---------|
| `markdown_to_docx` | Markdown转Word文档 | 核心功能，支持模板和样式配置 |
| `create_table_from_csv` | CSV转表格数据 | 表格数据导入，支持多种分隔符 |
| `create_table_from_json` | JSON转表格数据 | JSON数据转表格，支持列选择 |
| `list_table_styles` | 表格样式管理 | 查看可用表格样式，无需输入参数 |

### 资源

| 资源名称 | 描述 | URI 格式 |
|---------|------|---------|
| `templates-list` | 所有可用模板列表 | `templates://list` |
| `templates-default` | 默认模板信息 | `templates://default` |
| `template-details` | 特定模板详情 | `templates://{templateId}` |
| `style-guide` | 样式配置指南 | `style-guide://complete` |
| `converters-supported-formats` | 支持的格式列表 | `converters://supported_formats` |
| `performance-metrics` | 性能指标说明 | `performance://metrics` |

### 提示

| 提示名称 | 描述 | 参数 |
|---------|------|------|
| `markdown_to_docx_help` | 使用帮助 | 无 |
| `markdown_to_docx_examples` | 实用示例 | 无 |
| `create_document` | 创建文档引导 | `documentType` |
| `batch_processing_workflow` | 批量处理工作流 | `scenario` |
| `troubleshooting_guide` | 故障排除指南 | `errorType` |

## 📝 使用示例

### 基础转换

```json
{
  "markdown": "# 我的文档\n\n这是正文内容，会自动应用默认样式。",
  "filename": "output.docx"
}
```

### 使用预设模板

```json
{
  "markdown": "# 学术论文\n\n内容",
  "filename": "paper.docx",
  "template": {
    "type": "preset",
    "presetId": "academic"
  }
}
```

### 包含数学公式

```json
{
  "markdown": "# 数学测试\n\n勾股定理：$a^2 + b^2 = c^2$\n\n二次方程求根公式：\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$",
  "filename": "math-test.docx"
}
```

### 包含 Mermaid 流程图

```json
{
  "markdown": "# 流程图测试\n\n```mermaid\nflowchart TD\n  A[开始] --> B{参数合法?}\n  B -->|是| C[生成 Word]\n  B -->|否| D[返回错误]\n```",
  "filename": "mermaid-test.docx"
}
```

### 添加水印和页眉页脚

```json
{
  "markdown": "# 机密文档\n\n内容",
  "filename": "confidential.docx",
  "styleConfig": {
    "watermark": {
      "text": "机密",
      "opacity": 0.2,
      "rotation": -45
    },
    "headerFooter": {
      "header": {
        "content": "公司文档",
        "alignment": "center"
      },
      "footer": {
        "content": "第 ",
        "showPageNumber": true,
        "pageNumberFormat": " 页",
        "showTotalPages": true,
        "totalPagesFormat": " / 共 ",
        "alignment": "center"
      }
    }
  }
}
```

### 从文件读取

```json
{
  "inputPath": "./input/document.md",
  "filename": "output.docx",
  "outputPath": "./output"
}
```

## 🎨 预设模板

### 可用模板

| 模板ID | 名称 | 分类 | 描述 | 默认 |
|--------|------|------|------|------|
| `customer-analysis` | 客户分析模板 | business | 专为客户分析报告设计的模板 | ⭐ |
| `academic` | 学术论文模板 | academic | 适用于学术论文的专业模板 | |
| `business` | 商务报告模板 | business | 适用于商务报告的专业模板 | |
| `technical` | 技术文档模板 | technical | 适用于技术文档的模板 | |
| `minimal` | 简约模板 | minimal | 简洁的文档模板 | |
| `enhanced-features` | 增强功能示例 | other | 展示所有增强功能的模板 | |

### 表格样式

系统提供 12 种预定义表格样式：

1. **minimal** - 简约现代风格
2. **professional** - 专业商务风格
3. **striped** - 斑马纹风格
4. **grid** - 网格风格
5. **elegant** - 优雅风格
6. **colorful** - 彩色风格
7. **compact** - 紧凑风格
8. **fresh** - 清新风格
9. **tech** - 科技风格
10. **report** - 报告风格
11. **financial** - 财务风格
12. **academic** - 学术风格

## 🧮 数学公式支持

### 支持的 LaTeX 命令

| 类型 | LaTeX命令 | 示例 | 说明 |
|------|-----------|------|------|
| **分数** | `\frac{分子}{分母}` | `\frac{1}{2}` | 分数表达式 |
| **根式** | `\sqrt{内容}` | `\sqrt{2}` | 平方根 |
| **根式** | `\sqrt[次数]{内容}` | `\sqrt[3]{8}` | n次根 |
| **上标** | `^{内容}` | `x^2` | 指数/上标 |
| **下标** | `_{内容}` | `x_1` | 下标 |
| **求和** | `\sum_{下限}^{上限}` | `\sum_{i=1}^{n}` | 求和符号 |
| **积分** | `\int` | `\int f(x)dx` | 积分符号 |
| **三角函数** | `\sin`, `\cos`, `\tan` | `\sin\theta` | 三角函数 |
| **对数** | `\log`, `\ln` | `\ln x` | 对数函数 |
| **极限** | `\lim` | `\lim_{x \to 0}` | 极限 |
| **希腊字母** | `\alpha`, `\beta`, `\pi`等 | `\pi r^2` | 希腊字母 |

### 使用示例

```markdown
# 数学公式示例

## 行内公式
这是一个行内公式：$E = mc^2$，非常简单。

## 行间公式
欧拉公式：

$$e^{i\pi} + 1 = 0$$

## 复杂公式
二次方程求根公式：

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

## 🔧 配置说明

### 样式配置结构

```typescript
{
  "styleConfig": {
    "document": {
      "defaultFont": "宋体",
      "defaultSize": 24,
      "page": {
        "size": "A4",
        "orientation": "portrait",
        "margins": {
          "top": 1440,
          "bottom": 1440,
          "left": 1440,
          "right": 1440
        }
      }
    },
    "theme": {
      "name": "专业主题",
      "colors": {
        "primary": "2E74B5",
        "secondary": "5A8FC4",
        "text": "333333"
      },
      "fonts": {
        "heading": "微软雅黑",
        "body": "宋体",
        "code": "Consolas"
      }
    },
    "watermark": {
      "text": "水印文本",
      "font": "Arial",
      "size": 48,
      "color": "CCCCCC",
      "opacity": 0.1,
      "rotation": -45
    },
    "tableOfContents": {
      "enabled": true,
      "title": "目 录",
      "levels": [1, 2, 3],
      "showPageNumbers": true,
      "tabLeader": "dot"
    },
    "headerFooter": {
      "header": {
        "content": "页眉内容",
        "alignment": "center"
      },
      "footer": {
        "content": "第 ",
        "showPageNumber": true,
        "pageNumberFormat": " 页",
        "showTotalPages": true,
        "totalPagesFormat": " / 共 ",
        "alignment": "center"
      },
      "differentFirstPage": true,
      "differentOddEven": false,
      "pageNumberStart": 1,
      "pageNumberFormatType": "decimal"
    }
  }
}
```

### 单位说明

- **缇（Twip）**: 1/1440英寸 = 1/20点，用于间距和边距
- **半点**: 字号单位，24半点 = 12pt
- **示例**: 2个字符缩进 = 480缇，1英寸边距 = 1440缇

## 📊 性能指标

### 转换性能

| 文档大小 | 数学公式数量 | 预处理时间 | 总转换时间 | 内存使用 |
|---------|-------------|-----------|-----------|---------|
| < 10KB | 0-10个 | < 10ms | < 100ms | < 50MB |
| 10KB - 100KB | 10-50个 | 10-50ms | 100-500ms | 50-100MB |
| > 100KB | 50-200个 | 50-200ms | 500ms-2s | 100-200MB |

### 系统要求

- **Node.js**: >= 18.0.0
- **内存**: 至少 512MB 可用内存
- **磁盘**: 至少 100MB 可用空间

## 🔍 故障排除

### 常见问题

1. **Mermaid 流程图没有渲染成图片**
   - 确认代码块语言标记为 `mermaid`
   - 检查 Mermaid 语法是否正确
   - 如果当前环境渲染失败，系统会自动回退为普通代码块，不会导致整个文档转换失败

2. **图片无法显示**
   - 检查图片路径是否正确
   - 确保使用 PNG、JPEG、GIF 等常见格式
   - 压缩图片到 5MB 以下

2. **数学公式转换失败**
   - 检查 LaTeX 语法是否正确
   - 确保使用支持的 LaTeX 命令
   - 简化过于复杂的嵌套结构

3. **样式未生效**
   - 验证 JSON 格式是否正确
   - 检查样式优先级（自定义样式会覆盖模板）
   - 使用 6 位十六进制颜色值

### 获取帮助

- 查看完整文档：`style-guide://complete`
- 查看模板列表：`templates://list`
- 查看性能指标：`performance://metrics`
- 查看支持的格式：`converters://supported_formats`

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Pull Request！

## 📚 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Zod 文档](https://zod.dev)
- [docx 库文档](https://docx.js.org)

## 👨‍💻 作者

AI Group - [jackdark425@gmail.com](mailto:jackdark425@gmail.com)

---

⭐ 如果这个项目对你有帮助，请给一个 Star！