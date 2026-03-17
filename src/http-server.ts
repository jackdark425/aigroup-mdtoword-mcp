#!/usr/bin/env node

import express from 'express';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { DocxMarkdownConverter } from './converter/markdown.js';
import { presetTemplateLoader } from './template/presetLoader.js';
import { DocxTemplateProcessor } from './template/processor.js';
import path from 'path';
import fs from 'fs/promises';

// 创建Express应用
const app = express();
app.use(express.json());

// CORS配置（用于浏览器客户端）
import cors from 'cors';
app.use(
  cors({
    origin: '*', // 生产环境应配置具体域名
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
  })
);

// 复用src/index.ts中的Schema定义
const ThemeSchema = z.object({
  name: z.string().optional().describe('主题名称'),
  colors: z.object({
    primary: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
    secondary: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
    text: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
  }).optional(),
  fonts: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
    code: z.string().optional(),
  }).optional(),
}).optional();

const WatermarkSchema = z.object({
  text: z.string(),
  font: z.string().optional(),
  size: z.number().min(1).max(200).optional(),
  color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
  opacity: z.number().min(0).max(1).optional(),
  rotation: z.number().min(-90).max(90).optional(),
}).optional();

const TableOfContentsSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().optional(),
  levels: z.array(z.number().min(1).max(6)).optional(),
  showPageNumbers: z.boolean().optional(),
  tabLeader: z.enum(['dot', 'hyphen', 'underscore', 'none']).optional(),
}).optional();

const HeaderFooterSchema = z.object({
  header: z.object({
    content: z.string().optional().describe('页眉内容文本'),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional().describe('页眉对齐方式'),
  }).optional().describe('默认页眉配置'),
  footer: z.object({
    content: z.string().optional().describe('页脚内容（页码前的文字，如"第 "）'),
    showPageNumber: z.boolean().optional().describe('是否显示当前页码'),
    pageNumberFormat: z.string().optional().describe('页码后缀文本（如" 页"）。示例：content="第 " + 页码 + pageNumberFormat=" 页" = "第 1 页"'),
    showTotalPages: z.boolean().optional().describe('是否显示总页数'),
    totalPagesFormat: z.string().optional().describe('总页数连接文本（如" / 共 "）。示例："第 1 页 / 共 5 页"'),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional().describe('页脚对齐方式'),
  }).optional().describe('默认页脚配置。支持灵活的页码格式组合'),
  firstPageHeader: z.object({
    content: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
  }).optional().describe('首页专用页眉（需设置differentFirstPage为true）'),
  firstPageFooter: z.object({
    content: z.string().optional(),
    showPageNumber: z.boolean().optional(),
    pageNumberFormat: z.string().optional(),
    showTotalPages: z.boolean().optional(),
    totalPagesFormat: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
  }).optional().describe('首页专用页脚（需设置differentFirstPage为true）'),
  evenPageHeader: z.object({
    content: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
  }).optional().describe('偶数页专用页眉（需设置differentOddEven为true）'),
  evenPageFooter: z.object({
    content: z.string().optional(),
    showPageNumber: z.boolean().optional(),
    pageNumberFormat: z.string().optional(),
    showTotalPages: z.boolean().optional(),
    totalPagesFormat: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
  }).optional().describe('偶数页专用页脚（需设置differentOddEven为true）'),
  differentFirstPage: z.boolean().optional().describe('是否首页不同'),
  differentOddEven: z.boolean().optional().describe('是否奇偶页不同'),
  pageNumberStart: z.number().optional().describe('页码起始编号，默认为1'),
  pageNumberFormatType: z.enum(['decimal', 'upperRoman', 'lowerRoman', 'upperLetter', 'lowerLetter']).optional().describe('页码格式：decimal(1,2,3)、upperRoman(I,II,III)、lowerRoman(i,ii,iii)、upperLetter(A,B,C)、lowerLetter(a,b,c)'),
}).optional().describe('页眉页脚配置。支持页码、总页数、不同首页、奇偶页不同。页码格式示例："第 1 页 / 共 5 页"、"Page 1 of 5"');

const TableStylesSchema = z.object({
  default: z.object({
    columnWidths: z.array(z.number()).optional(),
    cellAlignment: z.object({
      horizontal: z.enum(['left', 'center', 'right']).optional(),
      vertical: z.enum(['top', 'center', 'bottom']).optional(),
    }).optional(),
    stripedRows: z.object({
      enabled: z.boolean().optional(),
      oddRowShading: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
      evenRowShading: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
    }).optional(),
  }).optional(),
}).optional();

const ImageStylesSchema = z.object({
  default: z.object({
    maxWidth: z.number().optional(),
    maxHeight: z.number().optional(),
    maintainAspectRatio: z.boolean().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    border: z.object({
      color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
      width: z.number().optional(),
      style: z.enum(['single', 'double', 'dotted', 'dashed']).optional(),
    }).optional(),
  }).optional(),
}).optional();

const StyleConfigSchema = z.object({
  theme: ThemeSchema,
  watermark: WatermarkSchema,
  tableOfContents: TableOfContentsSchema,
  headerFooter: HeaderFooterSchema,
  tableStyles: TableStylesSchema,
  imageStyles: ImageStylesSchema,
  document: z.object({
    defaultFont: z.string().optional(),
    defaultSize: z.number().optional(),
  }).optional(),
  paragraphStyles: z.record(z.any()).optional(),
  headingStyles: z.record(z.any()).optional(),
}).optional();

const TemplateSchema = z.object({
  type: z.enum(['preset']).describe('模板类型：preset=预设模板'),
  presetId: z.string().describe('预设模板ID。可选值：academic（学术论文）、business（商务报告）、customer-analysis（客户分析-默认）、technical（技术文档）、minimal（极简风格）、enhanced-features（增强功能示例）'),
}).optional().describe('模板配置。使用预设模板可以快速应用专业样式，也可以与styleConfig组合使用');

const MarkdownToDocxInputSchema = z.object({
  markdown: z.string().optional().describe('Markdown格式的文本内容（与inputPath二选一）'),
  inputPath: z.string().optional().describe('Markdown文件路径（与markdown二选一）'),
  filename: z.string().regex(/\.docx$/).describe('输出的Word文档文件名，必须以.docx结尾'),
  outputPath: z.string().optional().describe('输出目录，默认为当前工作目录'),
  template: TemplateSchema,
  styleConfig: StyleConfigSchema.describe('样式配置对象。支持主题系统（theme）、水印（watermark）、页眉页脚（headerFooter）、自动目录（tableOfContents）、表格样式（tableStyles）、图片样式（imageStyles）等。可与template组合使用以覆盖模板的默认样式'),
});

const MarkdownToDocxOutputSchema = z.object({
  success: z.boolean(),
  filename: z.string(),
  path: z.string(),
  size: z.number(),
  message: z.string().optional(),
});

// 创建服务器配置函数
function createMcpServer() {
  const server = new McpServer(
    {
      name: 'aigroup-mdtoword-mcp',
      version: '3.0.0',
    },
    {
      debouncedNotificationMethods: [
        'notifications/tools/list_changed',
        'notifications/resources/list_changed',
        'notifications/prompts/list_changed',
      ],
    }
  );

  // 注册工具
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
        if (!args.markdown && !args.inputPath) {
          throw new Error('必须提供 markdown 或 inputPath 参数');
        }

        let markdownContent: string;
        if (args.inputPath) {
          markdownContent = await fs.readFile(args.inputPath, 'utf-8');
        } else {
          markdownContent = args.markdown!;
        }

        let finalStyleConfig = args.styleConfig;

        if (!args.template && !args.styleConfig) {
          const defaultTemplate = presetTemplateLoader.getDefaultTemplate();
          if (defaultTemplate) {
            finalStyleConfig = defaultTemplate.styleConfig as any;
          }
        }

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

        // 传递 baseDir 以支持相对路径图片
        const baseDir = args.inputPath ? path.dirname(args.inputPath) : process.cwd();
        const converter = new DocxMarkdownConverter(finalStyleConfig as any, baseDir);
        const docxContent = await converter.convert(markdownContent);

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

  // 注册资源
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
            text: `# Markdown转Word样式配置指南\n\n## 单位换算\n- **缇（Twip）**: 1/1440英寸 = 1/20点\n- **半点**: 字号单位，24半点 = 12pt\n\n## 常用颜色\n- \`000000\` - 纯黑色\n- \`2E74B5\` - 专业蓝色`,
          },
        ],
      };
    }
  );

  // 注册提示
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
            text: '查看完整使用指南请访问 README.md',
          },
        },
      ],
    })
  );

  return server;
}

// HTTP端点处理
app.post('/mcp', async (req, res) => {
  try {
    // 为每个请求创建新的transport，防止请求ID冲突
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close();
    });

    const server = createMcpServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('处理MCP请求错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'aigroup-mdtoword-mcp',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 根路径信息
app.get('/', (_req, res) => {
  res.json({
    name: 'aigroup-mdtoword-mcp',
    version: '3.0.0',
    description: 'Markdown to Word conversion service with MCP protocol support',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
    documentation: 'https://github.com/aigroup/aigroup-mdtoword-mcp',
  });
});

// 启动服务器
const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`🚀 aigroup-mdtoword-mcp HTTP服务器运行中`);
  console.log(`📍 地址: http://localhost:${port}/mcp`);
  console.log(`💚 健康检查: http://localhost:${port}/health`);
  console.log(`📖 版本: 3.0.0`);
  console.log(`🔧 使用最新 MCP SDK 1.20.1 with Streamable HTTP`);
}).on('error', (error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});