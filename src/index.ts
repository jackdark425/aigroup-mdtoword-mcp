#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DocxMarkdownConverter } from './converter/markdown.js';
import { createMcpServer } from './mcp-server.js';
import path from 'path';
import fs from 'fs/promises';

// FileSystem handler for Node environment
const fileSystem = {
  readFile: (p: string, encoding: string) => fs.readFile(p, { encoding: encoding as BufferEncoding }),
  writeFile: async (p: string, content: any) => { await fs.writeFile(p, content); },
  mkdir: async (p: string, options?: any) => { await fs.mkdir(p, options); },
  resolvePath: path.resolve,
  dirname: path.dirname,
  cwd: process.cwd
};

function redirectConsoleToStderr() {
  const toStderr = (...args: unknown[]) => process.stderr.write(args.join(' ') + '\n');
  console.log = toStderr;
  console.info = toStderr;
  console.debug = toStderr;
  console.warn = toStderr;
}

async function main() {
  redirectConsoleToStderr();

  const server = createMcpServer({
    name: 'aigroup-mdtoword-mcp',
    version: '4.0.2',
    ConverterClass: DocxMarkdownConverter,
    fileSystem
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('aigroup-mdtoword-mcp MCP 服务器已启动 (v4.0.2)');
  console.error('- 使用最新 MCP SDK');
  console.error('- 支持 Zod 类型验证');
  console.error('- 启用通知防抖优化');
  console.error('- 提供结构化输出');
  console.error('- 支持 Sampling（AI辅助摘要）');
  console.error('- 运行环境: Node.js (Stdio)');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});