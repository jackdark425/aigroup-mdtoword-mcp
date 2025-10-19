# aigroup-mdtoword-mcp

本地 Markdown 到 Word 文档转换工具，支持最新 MCP (Model Context Protocol) 协议。

## ✨ 特性

### 核心功能
- ✅ 完整的 Markdown 语法支持（标题、段落、列表、表格、代码块、引用等）
- 🎨 丰富的样式配置系统
- 📋 多种预设模板（学术论文、商务报告、客户分析等）
- 🖼️ 增强的图片处理（自适应尺寸、格式检测、错误处理）
- 💧 水印支持（自定义文本、透明度、旋转角度）
- 📄 页眉页脚（自定义内容、自动页码）
- 📑 自动目录生成（可配置级别和样式）
- 🎨 主题系统（统一颜色、字体、间距管理）
- 📊 增强的表格样式（12种预定义样式、列宽控制、单元格对齐、斑马纹）
- 📥 表格数据导入（支持CSV和JSON格式）
- 🔀 复杂表格支持（合并单元格、嵌套表格）
- ⚡ 性能优化（智能缓存、批量处理）
- 💾 本地文件处理，无需云存储

### MCP 协议特性 (v3.0.0)
- 🚀 **最新 MCP SDK 1.20.1** - 使用最新的 TypeScript SDK
- 📝 **Zod 类型验证** - 完整的输入输出类型安全
- 🌐 **Streamable HTTP Transport** - 支持 HTTP 和 stdio 双传输方式
- 🔄 **通知防抖** - 优化网络性能，减少不必要的通知
- 📊 **结构化输出** - 工具返回结构化数据便于处理
- 🎯 **动态资源** - 使用 ResourceTemplate 支持参数化资源
- 🤖 **AI Sampling** - 集成 LLM 能力进行文档摘要等
- 🏷️ **丰富元数据** - 所有工具、资源、提示都有清晰的 title 和描述

## 📦 安装

### 全局安装

```bash
npm install -g aigroup-mdtoword-mcp
```

### 本地安装

```bash
npm install aigroup-mdtoword-mcp
```

### 通过 npx 直接使用

```bash
npx aigroup-mdtoword-mcp
```

## 🚀 使用方式

### 1. 作为 MCP 服务器 (Stdio)

在 Roo Code、Claude Desktop 或其他支持 MCP 的工具中配置：

```json
{
  "mcpServers": {
    "aigroup-mdtoword-mcp": {
      "command": "npx",
      "args": ["-y", "aigroup-mdtoword-mcp"],
      "alwaysAllow": ["markdown_to_docx", "summarize_markdown"]
    }
  }
}
```

### 2. 作为 HTTP 服务器

启动 HTTP 服务器：

```bash
npm run server:http
# 或
node dist/http-server.js
```

服务器将在 `http://localhost:3000/mcp` 上运行。

#### 在 MCP 客户端中连接

```bash
# 使用 MCP Inspector
npx @modelcontextprotocol/inspector http://localhost:3000/mcp

# 使用 Claude Code
claude mcp add --transport http my-server http://localhost:3000/mcp

# 使用 VS Code
code --add-mcp '{"name":"my-server","type":"http","url":"http://localhost:3000/mcp"}'
```

#### CORS 支持

HTTP 服务器已配置 CORS，支持浏览器客户端访问。生产环境请修改 `src/http-server.ts` 中的 `origin` 配置。

### 3. 基本用法示例

#### 最简单的转换

```json
{
  "markdown": "# 我的文档\n\n这是正文内容，会自动应用默认样式。",
  "filename": "output.docx"
}
```

#### 从文件读取

```json
{
  "inputPath": "./input/document.md",
  "filename": "output.docx",
  "outputPath": "./output"
}
```

#### 使用预设模板

```json
{
  "markdown": "# 学术论文\n\n## 摘要\n\n本文探讨...",
  "filename": "paper.docx",
  "template": {
    "type": "preset",
    "presetId": "academic"
  }
}
```

#### 自定义样式配置

```json
{
  "markdown": "# 标题\n\n正文内容",
  "filename": "custom.docx",
  "styleConfig": {
    "theme": {
      "name": "专业主题",
      "colors": {
        "primary": "2E74B5",
        "text": "333333"
      },
      "fonts": {
        "heading": "微软雅黑",
        "body": "宋体"
      }
    },
    "watermark": {
      "text": "机密",
      "opacity": 0.2,
      "rotation": -45
    }
  }
}
```

## 📋 预设模板

### customer-analysis（默认）⭐
客户分析模板，特点：
- 正文首行缩进 2 个字符（480缇）
- 黑色文本，宋体字体
- 符合中文文档规范

### academic
学术论文模板，适合：
- 学术论文
- 研究报告
- 毕业论文

### business
商务报告模板，适合：
- 商务报告
- 工作总结
- 项目方案

### technical
技术文档模板，适合：
- API 文档
- 技术规范
- 开发文档

### minimal
极简模板，适合：
- 简单文档
- 快速笔记
- 临时文档

### enhanced-features
增强功能示例模板，展示：
- 主题系统
- 水印功能
- 页眉页脚
- 自动目录
- 增强表格
- 优化图片处理

## 🔧 MCP 工具

### markdown_to_docx

将 Markdown 文档转换为 Word 文档（DOCX 格式）。

**输入参数（使用 Zod 验证）：**

```typescript
{
  markdown?: string,           // Markdown内容（与inputPath二选一）
  inputPath?: string,          // Markdown文件路径（与markdown二选一）
  filename: string,            // 输出文件名，必须以.docx结尾
  outputPath?: string,         // 输出目录，默认为当前工作目录
  template?: {
    type: 'preset',
    presetId: string           // 预设模板ID
  },
  styleConfig?: {              // 完整的样式配置对象
    theme?: { ... },
    watermark?: { ... },
    tableOfContents?: { ... },
    headerFooter?: { ... },
    tableStyles?: { ... },
    imageStyles?: { ... }
  }
}
```

**输出（结构化）：**

```typescript
{
  success: boolean,
  filename: string,
  path: string,
  size: number,
  message?: string
}
```

### create_table_from_csv

将CSV数据转换为可用于文档的表格数据。

**输入参数：**

```typescript
{
  csvData: string,             // CSV格式的数据
  hasHeader?: boolean,         // 第一行是否为表头（默认true）
  delimiter?: string,          // 分隔符（默认逗号）
  styleName?: string          // 表格样式名称（默认minimal）
}
```

**输出（结构化）：**

```typescript
{
  success: boolean,
  rowCount: number,
  columnCount: number,
  styleName: string,
  preview: string
}
```

### create_table_from_json

将JSON数组数据转换为可用于文档的表格数据。

**输入参数：**

```typescript
{
  jsonData: string,            // JSON格式的数据（数组）
  columns?: string[],          // 要包含的列名（可选）
  styleName?: string          // 表格样式名称（默认minimal）
}
```

**输出（结构化）：**

```typescript
{
  success: boolean,
  rowCount: number,
  columnCount: number,
  styleName: string,
  preview: string
}
```

### list_table_styles

获取所有可用的预定义表格样式。

**输出（结构化）：**

```typescript
{
  styles: Array<{
    name: string,
    description: string
  }>,
  count: number
}
```

### summarize_markdown

使用 AI 总结 Markdown 文档内容（演示 MCP Sampling 功能）。

**输入参数：**

```typescript
{
  markdown: string,            // 要总结的Markdown内容
  maxLength?: number          // 摘要最大长度（50-500字符，默认200）
}
```

**输出（结构化）：**

```typescript
{
  summary: string,
  originalLength: number,
  summaryLength: number
}
```

**注意：** 此功能需要客户端支持 MCP sampling 能力。

## 📚 MCP 资源

### 静态资源

#### 模板相关
- `templates://list` - 获取所有可用的预设模板列表
- `templates://default` - 获取默认模板信息
- `templates://categories` - 📦 **新增** 按分类组织的模板信息
- `style-guide://complete` - 获取完整的样式配置指南

#### 系统信息
- `converters://supported_formats` - 📦 **新增** 支持的输入输出格式列表
- `performance://metrics` - 📦 **新增** 性能指标说明和优化建议
- `integrations://available` - 📦 **新增** 可用的集成服务列表

### 动态资源（使用 ResourceTemplate）

#### 模板详情
- `templates://{templateId}` - 获取特定模板的详细配置

**示例：**
```
templates://academic
templates://business
templates://customer-analysis
```

#### 批处理任务
- `batch://{jobId}/status` - 📦 **新增** 查看批处理任务状态

**示例：**
```
batch://job-123/status
batch://conversion-2025/status
```

#### 文档分析
- `analysis://{docId}/report` - 📦 **新增** 获取文档的详细分析报告

**示例：**
```
analysis://doc-456/report
analysis://my-document/report
```

## 💬 MCP 提示

### markdown_to_docx_help
获取使用帮助和快速开始指南

### markdown_to_docx_examples
获取实用示例和最佳实践

### create_document
引导创建新文档（支持参数化）

**参数：**
- `documentType`: 'academic' | 'business' | 'technical' | 'report'

### batch_processing_workflow
📦 **新增** 批量处理工作流指导

引导用户进行批量文档处理，提供针对不同场景的最佳实践。

**参数：**
- `scenario`: 'academic' | 'business' | 'technical'

**提供内容：**
- 分步骤的处理流程
- 场景特定的最佳实践
- 配置示例和建议
- 性能优化提示

### troubleshooting_guide
📦 **新增** 故障排除指南

提供常见问题的诊断和解决方案。

**参数：**
- `errorType`: 'conversion' | 'performance' | 'integration'

**涵盖问题：**
- **conversion** - 图片显示、表格格式、样式应用等转换问题
- **performance** - 转换速度、内存占用等性能问题
- **integration** - MCP 连接、Sampling、资源访问等集成问题

## 🎨 新增功能详解

### 主题系统

主题系统允许统一管理文档的颜色、字体和间距：

```json
{
  "styleConfig": {
    "theme": {
      "name": "专业蓝色主题",
      "colors": {
        "primary": "2E5C8A",
        "secondary": "5A8FC4",
        "text": "333333"
      },
      "fonts": {
        "heading": "微软雅黑",
        "body": "宋体",
        "code": "Consolas"
      },
      "spacing": {
        "small": 120,
        "medium": 240,
        "large": 480
      }
    }
  }
}
```

### 水印功能

为文档添加自定义水印：

```json
{
  "styleConfig": {
    "watermark": {
      "text": "机密文档",
      "font": "宋体",
      "size": 80,
      "color": "E0E0E0",
      "opacity": 0.2,
      "rotation": -45
    }
  }
}
```

### 页眉页脚

自定义页眉和页脚：

```json
{
  "styleConfig": {
    "headerFooter": {
      "header": {
        "content": "企业内部文档",
        "alignment": "center"
      },
      "footer": {
        "content": "第 ",
        "showPageNumber": true,
        "pageNumberFormat": "页"
      }
    }
  }
}
```

### 自动目录

自动生成文档目录：

```json
{
  "styleConfig": {
    "tableOfContents": {
      "enabled": true,
      "title": "目 录",
      "levels": [1, 2, 3],
      "showPageNumbers": true,
      "tabLeader": "dot"
    }
  }
}
```

### 增强的表格样式

支持更丰富的表格配置：

```json
{
  "styleConfig": {
    "tableStyles": {
      "default": {
        "columnWidths": [2000, 3000, 2000],
        "cellAlignment": {
          "horizontal": "left",
          "vertical": "center"
        },
        "stripedRows": {
          "enabled": true,
          "oddRowShading": "FFFFFF",
          "evenRowShading": "F5F8FB"
        }
      }
    }
  }
}
```

### 图片处理优化

图片处理现在更加智能：

```json
{
  "styleConfig": {
    "imageStyles": {
      "default": {
        "maxWidth": 600,
        "maxHeight": 800,
        "maintainAspectRatio": true,
        "alignment": "center",
        "border": {
          "color": "CCCCCC",
          "width": 1,
          "style": "single"
        }
      }
    }
  }
}
```

## 📊 样式配置说明

### 单位换算

- **缇（Twip）**: 1/1440英寸 = 1/20点，用于间距和边距
- **半点**: 字号单位，24半点 = 12pt
- **示例**: 
  - 2个字符缩进 = 480缇
  - 1英寸边距 = 1440缇
  - 12pt字号 = 24半点

### 常用颜色（6位十六进制）

- `000000` - 纯黑色
- `333333` - 深灰色
- `666666` - 中灰色
- `2E74B5` - 专业蓝色
- `D73A49` - 警告红色

### 首行缩进计算

公式：字号(半点) × 字符数 × 10

- 24号字体 2字符: 480缇
- 28号字体 2字符: 560缇
- 20号字体 2字符: 400缇

## 🔧 开发

### 构建项目

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

### 启动 Stdio 服务器

```bash
npm run server:stdio
```

### 启动 HTTP 服务器

```bash
npm run server:http
```

### 运行测试

```bash
npm test
```

## 📋 系统要求

- Node.js >= 18.0.0
- npm >= 8.0.0

## 🖥️ 支持的操作系统

- Windows
- macOS
- Linux

## 🎯 最佳实践

### 使用主题提高一致性

```json
{
  "styleConfig": {
    "theme": {
      "name": "公司标准主题",
      "colors": {
        "primary": "公司主色",
        "secondary": "公司辅助色"
      },
      "fonts": {
        "heading": "统一标题字体",
        "body": "统一正文字体"
      }
    }
  }
}
```

### 结合多个功能

```json
{
  "markdown": "# 我的文档",
  "filename": "output.docx",
  "styleConfig": {
    "theme": { "name": "专业主题" },
    "watermark": { "text": "机密" },
    "tableOfContents": { "enabled": true },
    "headerFooter": {
      "footer": { "showPageNumber": true }
    }
  }
}
```

### 性能建议

1. 对于相同配置的多次转换，缓存会自动提高性能
2. 图片尽量使用合适的尺寸，避免过大
3. 使用预设模板可以获得最佳性能
4. HTTP 服务器支持并发请求，适合批量处理

## 🚀 新版本特性

### 3.0.0 (2025-01-18)

#### MCP 协议升级
- 🎉 **升级到 MCP SDK 1.20.1** - 使用最新的 TypeScript SDK
- 📝 **Zod 类型验证** - 所有工具输入输出都有完整的类型安全
- 🌐 **Streamable HTTP Transport** - 新增 HTTP 服务器支持
- 🔄 **通知防抖** - 自动合并相同类型的通知，优化性能
- 📊 **结构化输出** - 工具返回 structuredContent 便于程序处理

#### 新 API
- ✨ **registerTool/registerResource/registerPrompt** - 使用新的高级 API
- 🎯 **ResourceTemplate** - 支持动态资源和参数化 URI
- 🏷️ **title 元数据** - 所有组件都有清晰的显示名称
- 🤖 **Sampling 支持** - 演示 AI 辅助功能（文档摘要）

#### 开发体验
- 🔧 **更好的错误处理** - 详细的错误信息和恢复建议
- 📖 **完善的文档** - 包含所有新特性的使用示例
- 🧪 **类型安全** - 完整的 TypeScript 类型定义

### 2.0.0 (2025-01-18)

- 🎨 **新增** 主题系统 - 统一颜色、字体、间距管理
- 💧 **新增** 水印功能 - 支持自定义文本、透明度、旋转
- 📄 **新增** 页眉页脚 - 自定义内容和自动页码
- 📑 **新增** 自动目录生成 - 可配置级别和样式
- 📊 **增强** 表格样式 - 列宽控制、单元格对齐、斑马纹
- 🖼️ **优化** 图片处理 - 自适应尺寸、格式检测、错误处理
- ⚡ **优化** 性能 - 智能缓存、批量处理、增量验证
- 🛠️ **改进** 错误处理 - 详细错误信息和自动修复建议
- 📝 **新增** enhanced-features 示例模板

### 1.0.0 (2024-10-18)

- 🎉 首次发布
- ✅ 支持完整的 Markdown 语法
- 🎨 提供丰富的样式配置系统
- 📋 内置 5 种预设模板
- 🔧 完整的 MCP 协议支持
- 💾 本地文件处理，无需云存储

## 📄 许可证

MIT

## 🐛 问题反馈

如有问题，请在 GitHub Issues 中提交：
https://github.com/aigroup/aigroup-mdtoword-mcp/issues

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