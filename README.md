# aigroup-mdtoword-mcp

本地 Markdown 到 Word 文档转换工具，支持 MCP (Model Context Protocol) 协议通信。

## 特性

- ✅ 完整的 Markdown 语法支持（标题、段落、列表、表格、代码块、引用等）
- 🎨 丰富的样式配置系统
- 📋 多种预设模板（学术论文、商务报告、客户分析等）
- 🖼️ 增强的图片处理（自适应尺寸、格式检测、错误处理）
- 💧 水印支持（自定义文本、透明度、旋转角度）
- 📄 页眉页脚（自定义内容、自动页码）
- 📑 自动目录生成（可配置级别和样式）
- 🎨 主题系统（统一颜色、字体、间距管理）
- 📊 增强的表格样式（列宽控制、单元格对齐、斑马纹）
- ⚡ 性能优化（智能缓存、批量处理）
- 🔧 MCP 协议支持，易于集成到 AI 工具链
- 💾 本地文件处理，无需云存储

## 安装

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

## 使用方式

### 1. 作为 MCP 服务器

在 Roo Code 或其他支持 MCP 的工具中配置：

```json
{
  "mcpServers": {
    "aigroup-mdtoword-mcp": {
      "command": "npx",
      "args": ["-y", "aigroup-mdtoword-mcp"],
      "alwaysAllow": ["markdown_to_docx"]
    }
  }
}
```

### 2. 基本用法示例

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
    "document": {
      "defaultFont": "微软雅黑",
      "defaultSize": 24
    },
    "paragraphStyles": {
      "normal": {
        "indent": {
          "firstLine": 480
        },
        "alignment": "justify"
      }
    },
    "headingStyles": {
      "h1": {
        "font": "黑体",
        "size": 36,
        "color": "2E74B5",
        "bold": true
      }
    }
  }
}
```

## 预设模板

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

## MCP 工具

### markdown_to_docx

将 Markdown 文档转换为 Word 文档（DOCX 格式）。

**参数：**

- `markdown` (string, 可选): Markdown 内容（与 inputPath 二选一）
- `inputPath` (string, 可选): Markdown 文件路径（与 markdown 二选一）
- `filename` (string, 必需): 输出文件名，必须以 .docx 结尾
- `outputPath` (string, 可选): 输出目录，默认为当前工作目录
- `template` (object, 可选): 模板配置
  - `type`: 模板类型（preset）
  - `presetId`: 预设模板 ID
- `styleConfig` (object, 可选): 样式配置对象

## MCP 资源

### templates://list
获取所有可用的预设模板列表

### templates://default
获取默认模板信息

### style-guide://complete
获取完整的样式配置指南

## MCP 提示

### markdown_to_docx_help
获取使用帮助和快速开始指南

### markdown_to_docx_examples
获取实用示例和最佳实践

## 新增功能详解

### 🎨 主题系统

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

### 💧 水印功能

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

### 📄 页眉页脚

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

### 📑 自动目录

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

### 📊 增强的表格样式

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

### 🖼️ 图片处理优化

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

**新增特性：**
- ✅ 自适应尺寸调整
- ✅ 自动格式检测
- ✅ 加载失败占位符
- ✅ 支持更多图片格式（jpg, png, gif, bmp, svg, webp）

### ⚡ 性能优化

项目包含多项性能优化：

1. **智能缓存** - 样式配置自动缓存，避免重复计算
2. **批量处理** - 图片批量加载和处理
3. **增量验证** - 只验证变更的配置项
4. **错误恢复** - 自动修复常见配置错误

查看缓存统计：
```
📊 [缓存统计] 命中率: 85.5%, 大小: 12
```

## 样式配置说明

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

## 开发

### 构建项目

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

### 运行测试

```bash
npm test
```

## 系统要求

- Node.js >= 18.0.0
- npm >= 8.0.0

## 支持的操作系统

- Windows
- macOS
- Linux

## 许可证

MIT

## 问题反馈

如有问题，请在 GitHub Issues 中提交：
https://github.com/aigroup/aigroup-mdtoword-mcp/issues

## 贡献

欢迎提交 Pull Request！

## 最佳实践

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

## 更新日志

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