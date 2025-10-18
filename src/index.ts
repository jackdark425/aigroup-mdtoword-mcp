#!/usr/bin/env node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DocxMarkdownConverter } from './converter/markdown.js';
import { presetTemplateLoader } from './template/presetLoader.js';
import { DocxTemplateProcessor } from './template/processor.js';
import path from 'path';
import fs from 'fs/promises';

// 创建MCP服务器，启用通知防抖以优化性能
const server = new McpServer(
  {
    name: 'aigroup-mdtoword-mcp',
    version: '3.0.0',
  },
  {
    // 启用通知防抖，减少网络流量
    debouncedNotificationMethods: [
      'notifications/tools/list_changed',
      'notifications/resources/list_changed',
      'notifications/prompts/list_changed',
    ],
  }
);

// ==================== Zod Schemas ====================

// 主题配置 Schema
const ThemeSchema = z.object({
  name: z.string().optional().describe('主题名称'),
  colors: z.object({
    primary: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('主色调（6位十六进制）'),
    secondary: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('辅助色（6位十六进制）'),
    text: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('文本颜色（6位十六进制）'),
  }).optional(),
  fonts: z.object({
    heading: z.string().optional().describe('标题字体'),
    body: z.string().optional().describe('正文字体'),
    code: z.string().optional().describe('代码字体'),
  }).optional(),
  spacing: z.object({
    small: z.number().optional().describe('小间距（缇）'),
    medium: z.number().optional().describe('中间距（缇）'),
    large: z.number().optional().describe('大间距（缇）'),
  }).optional(),
}).optional();

// 水印配置 Schema
const WatermarkSchema = z.object({
  text: z.string().describe('水印文本'),
  font: z.string().optional().describe('水印字体'),
  size: z.number().min(1).max(200).optional().describe('水印字号'),
  color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('水印颜色（6位十六进制）'),
  opacity: z.number().min(0).max(1).optional().describe('透明度（0-1）'),
  rotation: z.number().min(-90).max(90).optional().describe('旋转角度（-90到90）'),
}).optional();

// 目录配置 Schema
const TableOfContentsSchema = z.object({
  enabled: z.boolean().optional().describe('是否启用目录'),
  title: z.string().optional().describe('目录标题'),
  levels: z.array(z.number().min(1).max(6)).optional().describe('包含的标题级别'),
  showPageNumbers: z.boolean().optional().describe('是否显示页码'),
  tabLeader: z.enum(['dot', 'hyphen', 'underscore', 'none']).optional().describe('页码引导符'),
}).optional();

// 页眉页脚配置 Schema
const HeaderFooterSchema = z.object({
  header: z.object({
    content: z.string().optional().describe('页眉内容'),
    alignment: z.enum(['left', 'center', 'right']).optional().describe('对齐方式'),
  }).optional(),
  footer: z.object({
    content: z.string().optional().describe('页脚内容'),
    showPageNumber: z.boolean().optional().describe('是否显示页码'),
    pageNumberFormat: z.string().optional().describe('页码格式文字'),
  }).optional(),
}).optional();

// 表格样式配置 Schema
const TableStylesSchema = z.object({
  default: z.object({
    columnWidths: z.array(z.number()).optional().describe('列宽数组（缇）'),
    cellAlignment: z.object({
      horizontal: z.enum(['left', 'center', 'right']).optional().describe('水平对齐'),
      vertical: z.enum(['top', 'center', 'bottom']).optional().describe('垂直对齐'),
    }).optional(),
    stripedRows: z.object({
      enabled: z.boolean().optional().describe('是否启用斑马纹'),
      oddRowShading: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('奇数行背景色'),
      evenRowShading: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('偶数行背景色'),
    }).optional(),
  }).optional(),
}).optional();

// 图片样式配置 Schema
const ImageStylesSchema = z.object({
  default: z.object({
    maxWidth: z.number().optional().describe('最大宽度（缇）'),
    maxHeight: z.number().optional().describe('最大高度（缇）'),
    maintainAspectRatio: z.boolean().optional().describe('保持宽高比'),
    alignment: z.enum(['left', 'center', 'right']).optional().describe('对齐方式'),
    border: z.object({
      color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('边框颜色'),
      width: z.number().optional().describe('边框宽度'),
      style: z.enum(['single', 'double', 'dotted', 'dashed']).optional().describe('边框样式'),
    }).optional(),
  }).optional(),
}).optional();

// 样式配置 Schema
const StyleConfigSchema = z.object({
  theme: ThemeSchema,
  watermark: WatermarkSchema,
  tableOfContents: TableOfContentsSchema,
  headerFooter: HeaderFooterSchema,
  tableStyles: TableStylesSchema,
  imageStyles: ImageStylesSchema,
  document: z.object({
    defaultFont: z.string().optional().describe('默认字体'),
    defaultSize: z.number().optional().describe('默认字号（半点）'),
  }).optional(),
  paragraphStyles: z.record(z.any()).optional().describe('段落样式配置'),
  headingStyles: z.record(z.any()).optional().describe('标题样式配置'),
}).optional();

// 模板配置 Schema
const TemplateSchema = z.object({
  type: z.enum(['preset']).describe('模板类型：preset=预设模板'),
  presetId: z.string().describe('预设模板ID。可选值：academic（学术论文）、business（商务报告）、customer-analysis（客户分析-默认）、technical（技术文档）、minimal（极简风格）、enhanced-features（增强功能示例）'),
}).optional().describe('模板配置。使用预设模板可以快速应用专业样式，也可以与styleConfig组合使用');

// 工具输入 Schema
const MarkdownToDocxInputSchema = z.object({
  markdown: z.string().optional().describe('Markdown格式的文本内容（与inputPath二选一）'),
  inputPath: z.string().optional().describe('Markdown文件路径（与markdown二选一）'),
  filename: z.string().regex(/\.docx$/).describe('输出的Word文档文件名，必须以.docx结尾'),
  outputPath: z.string().optional().describe('输出目录，默认为当前工作目录'),
  template: TemplateSchema,
  styleConfig: StyleConfigSchema.describe('样式配置对象。支持主题系统（theme）、水印（watermark）、页眉页脚（headerFooter）、自动目录（tableOfContents）、表格样式（tableStyles）、图片样式（imageStyles）等。可与template组合使用以覆盖模板的默认样式'),
});

// 工具输出 Schema
const MarkdownToDocxOutputSchema = z.object({
  success: z.boolean(),
  filename: z.string(),
  path: z.string(),
  size: z.number(),
  message: z.string().optional(),
});

// ==================== 工具注册 ====================

server.registerTool(
  'markdown_to_docx',
  {
    title: 'Markdown 转 Word',
    description: '将Markdown文档转换为Word文档（DOCX格式），支持样式配置和模板系统',
    inputSchema: MarkdownToDocxInputSchema.shape,
    outputSchema: MarkdownToDocxOutputSchema.shape,
  },
  async (args) => {
    try {
      // 参数验证
      if (!args.markdown && !args.inputPath) {
        throw new Error('必须提供 markdown 或 inputPath 参数');
      }

      // 获取Markdown内容
      let markdownContent: string;
      if (args.inputPath) {
        markdownContent = await fs.readFile(args.inputPath, 'utf-8');
      } else {
        markdownContent = args.markdown!;
      }

      // 处理样式配置
      let finalStyleConfig = args.styleConfig;
      const templateProcessor = new DocxTemplateProcessor();

      // 如果没有指定模板和样式配置，使用默认的客户分析模板
      if (!args.template && !args.styleConfig) {
        const defaultTemplate = presetTemplateLoader.getDefaultTemplate();
        if (defaultTemplate) {
          finalStyleConfig = defaultTemplate.styleConfig as any;
        }
      }

      // 如果有模板配置，从模板提取样式并与直接样式配置合并
      if (args.template?.type === 'preset' && args.template.presetId) {
        const presetTemplate = presetTemplateLoader.getPresetTemplate(args.template.presetId);
        if (presetTemplate) {
          const templateStyleConfig = presetTemplate.styleConfig;
          if (finalStyleConfig) {
            const { styleEngine } = await import('./utils/styleEngine.js');
            finalStyleConfig = styleEngine.mergeStyleConfigs(templateStyleConfig as any, finalStyleConfig as any) as any;
          } else {
            finalStyleConfig = templateStyleConfig as any;
          }
        } else {
          throw new Error(`预设模板 "${args.template.presetId}" 不存在`);
        }
      }

      // 执行转换
      const converter = new DocxMarkdownConverter(finalStyleConfig as any);
      const docxContent = await converter.convert(markdownContent);

      // 保存文件
      const outputPath = args.outputPath || process.cwd();
      await fs.mkdir(outputPath, { recursive: true });

      const fullPath = path.join(outputPath, args.filename);
      await fs.writeFile(fullPath, docxContent);

      const output = {
        success: true,
        filename: args.filename,
        path: fullPath,
        size: docxContent.length,
        message: '文档转换成功！',
      };

      return {
        content: [
          {
            type: 'text',
            text: `✅ ${output.message}\n\n📄 文件名: ${output.filename}\n📁 保存路径: ${output.path}\n💾 文件大小: ${output.size} 字节`,
          },
        ],
        structuredContent: output,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return {
        content: [
          {
            type: 'text',
            text: `❌ 转换失败: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ==================== 资源注册 ====================

// 静态资源：模板列表
server.registerResource(
  'templates-list',
  'templates://list',
  {
    title: '模板列表',
    description: '所有可用的预设模板',
    mimeType: 'text/markdown',
  },
  async (uri) => {
    const templates = presetTemplateLoader.getTemplateList();
    const templateInfo = templates
      .map(
        (t) =>
          `- **${t.id}**: ${t.name}${t.isDefault ? ' ⭐ (默认)' : ''}\n  分类: ${t.category}\n  描述: ${t.description}`
      )
      .join('\n\n');

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: `# 可用模板列表\n\n${templateInfo}\n\n## 使用方法\n\n在 template 参数中指定：\n\`\`\`json\n{\n  "type": "preset",\n  "presetId": "模板ID"\n}\n\`\`\``,
        },
      ],
    };
  }
);

// 静态资源：默认模板
server.registerResource(
  'templates-default',
  'templates://default',
  {
    title: '默认模板',
    description: '默认的客户分析模板信息',
    mimeType: 'text/markdown',
  },
  async (uri) => {
    const defaultTemplate = presetTemplateLoader.getDefaultTemplate();
    const defaultId = presetTemplateLoader.getDefaultTemplateId();

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: `# 默认模板\n\nID: ${defaultId}\n名称: ${defaultTemplate?.name}\n分类: ${defaultTemplate?.category}\n描述: ${defaultTemplate?.description}\n\n特点：\n- 正文首行缩进2个字符\n- 黑色文本，宋体字体\n- 符合中文文档规范`,
        },
      ],
    };
  }
);

// 动态资源：特定模板详情
server.registerResource(
  'template-details',
  new ResourceTemplate('templates://{templateId}', { list: undefined }),
  {
    title: '模板详情',
    description: '查看特定模板的详细配置',
    mimeType: 'application/json',
  },
  async (uri, { templateId }) => {
    const template = presetTemplateLoader.getPresetTemplate(templateId as string);
    
    if (!template) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: `模板 "${templateId}" 不存在`,
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(template, null, 2),
        },
      ],
    };
  }
);

// 静态资源：样式配置指南
server.registerResource(
  'style-guide',
  'style-guide://complete',
  {
    title: '样式配置指南',
    description: '完整的样式配置文档',
    mimeType: 'text/markdown',
  },
  async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: `# Markdown转Word样式配置指南

## 单位换算
- **缇（Twip）**: 1/1440英寸 = 1/20点，用于间距和边距
- **半点**: 字号单位，24半点 = 12pt
- **示例**: 2个字符缩进 = 480缇，1英寸边距 = 1440缇

## 常用颜色（6位十六进制）
- \`000000\` - 纯黑色
- \`333333\` - 深灰色
- \`666666\` - 中灰色
- \`2E74B5\` - 专业蓝色

## 配置示例

### 基础段落样式
\`\`\`json
{
  "styleConfig": {
    "paragraphStyles": {
      "normal": {
        "font": "宋体",
        "size": 24,
        "indent": { "firstLine": 480 },
        "alignment": "justify"
      }
    }
  }
}
\`\`\`

### 标题样式
\`\`\`json
{
  "styleConfig": {
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
\`\`\`

### 主题系统
\`\`\`json
{
  "styleConfig": {
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
    }
  }
}
\`\`\``,
        },
      ],
    };
  }
);

// ==================== 提示注册 ====================

server.registerPrompt(
  'markdown_to_docx_help',
  {
    title: '使用帮助',
    description: '获取Markdown转Word服务的使用帮助',
  },
  () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `# Markdown转Word服务使用指南

## 🚀 快速开始
最简单的使用方式（使用默认模板）：
\`\`\`json
{
  "markdown": "# 我的报告\\n\\n这是正文内容",
  "filename": "report.docx"
}
\`\`\`

## 📋 可用预设模板
- **academic**: 学术论文
- **business**: 商务报告
- **customer-analysis**: 客户分析（默认）⭐
- **minimal**: 极简风格
- **technical**: 技术文档
- **enhanced-features**: 增强功能示例

## 💡 使用提示
1. 查看 'templates://list' 资源获取所有模板
2. 查看 'style-guide://complete' 资源获取样式指南
3. 可以同时使用模板和自定义样式
4. 输出文件默认保存在当前目录

## 🎨 新特性
- 主题系统：统一颜色、字体管理
- 水印功能：自定义文本、透明度、旋转
- 页眉页脚：自定义内容和自动页码
- 自动目录：可配置级别和样式
- 增强表格：列宽、对齐、斑马纹
- 优化图片：自适应尺寸、格式检测`,
        },
      },
    ],
  })
);

server.registerPrompt(
  'markdown_to_docx_examples',
  {
    title: '实用示例',
    description: '获取实用示例和最佳实践',
  },
  () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `# 实用示例

## 📝 基础转换
\`\`\`json
{
  "markdown": "# 标题\\n\\n正文内容",
  "filename": "output.docx"
}
\`\`\`

## 📖 从文件读取
\`\`\`json
{
  "inputPath": "./input/document.md",
  "filename": "output.docx",
  "outputPath": "./output"
}
\`\`\`

## 🎨 使用模板
\`\`\`json
{
  "markdown": "# 学术论文\\n\\n内容",
  "filename": "paper.docx",
  "template": {
    "type": "preset",
    "presetId": "academic"
  }
}
\`\`\`

## 💧 添加水印
\`\`\`json
{
  "markdown": "# 机密文档\\n\\n内容",
  "filename": "confidential.docx",
  "styleConfig": {
    "watermark": {
      "text": "机密",
      "opacity": 0.2,
      "rotation": -45
    }
  }
}
\`\`\`

## 📑 自动目录
\`\`\`json
{
  "markdown": "# 第一章\\n\\n## 1.1 节\\n\\n## 1.2 节",
  "filename": "with-toc.docx",
  "styleConfig": {
    "tableOfContents": {
      "enabled": true,
      "title": "目 录",
      "levels": [1, 2, 3]
    }
  }
}
\`\`\``,
        },
      },
    ],
  })
);

server.registerPrompt(
  'create_document',
  {
    title: '创建文档',
    description: '引导用户创建新的Word文档',
    argsSchema: {
      documentType: z.enum(['academic', 'business', 'technical', 'report']).describe('文档类型'),
    },
  },
  ({ documentType }) => {
    const templates: Record<string, string> = {
      academic: 'academic',
      business: 'business',
      technical: 'technical',
      report: 'customer-analysis',
    };

    return {
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: `我将帮你创建一个${documentType}文档。建议使用 "${templates[documentType]}" 模板。\n\n请提供文档内容的Markdown格式文本，我会将其转换为专业的Word文档。`,
          },
        },
      ],
    };
  }
);

// ==================== Sampling 示例工具 ====================

// 添加一个使用LLM采样来总结Markdown内容的工具
server.registerTool(
  'summarize_markdown',
  {
    title: 'Markdown 内容摘要',
    description: '使用AI总结Markdown文档内容（需要客户端支持sampling）',
    inputSchema: {
      markdown: z.string().describe('要总结的Markdown内容'),
      maxLength: z.number().min(50).max(500).optional().default(200).describe('摘要最大长度（字符数）'),
    },
    outputSchema: {
      summary: z.string(),
      originalLength: z.number(),
      summaryLength: z.number(),
    },
  },
  async ({ markdown, maxLength = 200 }) => {
    try {
      // 使用MCP sampling功能调用LLM生成摘要
      const response = await server.server.createMessage({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请用中文总结以下Markdown文档的核心内容，摘要长度不超过${maxLength}字符：\n\n${markdown}`,
            },
          },
        ],
        maxTokens: 500,
      });

      const summary =
        response.content.type === 'text'
          ? response.content.text
          : '无法生成摘要';

      const output = {
        summary,
        originalLength: markdown.length,
        summaryLength: summary.length,
      };

      return {
        content: [
          {
            type: 'text',
            text: `📝 **文档摘要**\n\n${summary}\n\n---\n📊 原文长度: ${output.originalLength} 字符\n📊 摘要长度: ${output.summaryLength} 字符`,
          },
        ],
        structuredContent: output,
      };
    } catch (error) {
      // 如果客户端不支持sampling，提供友好的错误消息
      const errorMessage =
        error instanceof Error ? error.message : '未知错误';
      return {
        content: [
          {
            type: 'text',
            text: `❌ 无法生成摘要: ${errorMessage}\n\n💡 提示：此功能需要客户端支持 MCP sampling 能力。`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ==================== 服务器启动 ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('aigroup-mdtoword-mcp MCP 服务器已启动 (v3.0.0)');
  console.error('- 使用最新 MCP SDK 1.20.1');
  console.error('- 支持 Zod 类型验证');
  console.error('- 启用通知防抖优化');
  console.error('- 提供结构化输出');
  console.error('- 支持 Sampling（AI辅助摘要）');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});