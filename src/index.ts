#!/usr/bin/env node

// Redirect console.log/info/debug/warn to stderr BEFORE any module-level
// side effects (e.g. presetTemplateLoader singleton constructor) can run.
// Static imports are hoisted, so we use dynamic imports below instead.
const toStderr = (...args: unknown[]) => process.stderr.write(args.join(' ') + '\n');
console.log = toStderr as typeof console.log;
console.info = toStderr as typeof console.info;
console.debug = toStderr as typeof console.debug;
console.warn = toStderr as typeof console.warn;

async function main() {
  const [
    { StdioServerTransport },
    { DocxMarkdownConverter },
    { createMcpServer },
    { default: path },
    { default: fs },
  ] = await Promise.all([
    import('@modelcontextprotocol/sdk/server/stdio.js'),
    import('./converter/markdown.js'),
    import('./mcp-server.js'),
    import('path'),
    import('fs/promises'),
  ]);

  const fileSystem = {
    readFile: (p: string, encoding: string) => (fs as any).readFile(p, { encoding: encoding as BufferEncoding }),
    writeFile: async (p: string, content: any) => { await (fs as any).writeFile(p, content); },
    mkdir: async (p: string, options?: any) => { await (fs as any).mkdir(p, options); },
    resolvePath: (path as any).resolve,
    dirname: (path as any).dirname,
    cwd: process.cwd,
  };

  const server = createMcpServer({
    name: 'aigroup-mdtoword-mcp',
    version: '4.0.2',
    ConverterClass: DocxMarkdownConverter,
    fileSystem,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('aigroup-mdtoword-mcp MCP 服务器已启动 (v4.0.2)');
  console.error('- 使用最新 MCP SDK');
  console.error('- 支持 Zod 类型验证');
  console.error('- 启用通知防抖优化');
  console.error('- 提供结构化输出');
  console.error('- 运行环境: Node.js (Stdio)');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
