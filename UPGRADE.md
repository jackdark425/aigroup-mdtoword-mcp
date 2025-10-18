# 升级指南 - v2.0.0 到 v3.0.0

## 概述

版本 3.0.0 将项目升级到最新的 MCP SDK 1.20.1，引入了多项新特性和改进。

## 重大变更

### 1. MCP SDK 升级

从 `1.11.3` 升级到 `1.20.1`

**主要变化：**
- 使用新的 `McpServer` 高级 API 替代低级 `Server` API
- 所有工具、资源、提示使用 `register*` 方法注册
- 添加 Zod schema 进行类型验证
- 支持 Streamable HTTP transport

### 2. 依赖包升级

```json
{
  "@modelcontextprotocol/sdk": "^1.11.3" → "^1.20.1",
  "express": "新增 ^4.21.2",
  "node-fetch": "^2.6.7" → "^3.3.2",
  "zod": "^3.24.4" (保持不变),
  "@types/node": "^18.19.83" → "^22.10.7",
  "typescript": "^5.3.3" → "^5.7.3"
}
```

### 3. API 变更

#### 旧版本 (v2.0.0)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "app", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{ name: "tool", description: "desc", inputSchema: { ... } }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // 处理逻辑
});
```

#### 新版本 (v3.0.0)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer(
  { name: "app", version: "3.0.0" },
  {
    debouncedNotificationMethods: [
      'notifications/tools/list_changed'
    ]
  }
);

server.registerTool(
  'tool-name',
  {
    title: 'Tool Title',
    description: 'Tool description',
    inputSchema: z.object({
      param: z.string()
    }),
    outputSchema: z.object({
      result: z.string()
    })
  },
  async (args) => {
    return {
      content: [{ type: 'text', text: 'result' }],
      structuredContent: { result: 'value' }
    };
  }
);
```

### 4. 资源注册变更

#### 旧版本

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [{ uri: "resource://id", name: "name", mimeType: "text/plain" }]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  // 处理逻辑
});
```

#### 新版本

```typescript
// 静态资源
server.registerResource(
  'resource-id',
  'resource://uri',
  {
    title: 'Resource Title',
    description: 'Description',
    mimeType: 'text/plain'
  },
  async (uri) => ({
    contents: [{ uri: uri.href, text: 'content' }]
  })
);

// 动态资源 (新功能!)
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

server.registerResource(
  'dynamic-resource',
  new ResourceTemplate('resource://{param}', { list: undefined }),
  {
    title: 'Dynamic Resource',
    description: 'Description'
  },
  async (uri, { param }) => ({
    contents: [{ uri: uri.href, text: `content for ${param}` }]
  })
);
```

### 5. 提示注册变更

#### 旧版本

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [{ name: "prompt", description: "desc" }]
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  // 处理逻辑
});
```

#### 新版本

```typescript
server.registerPrompt(
  'prompt-name',
  {
    title: 'Prompt Title',
    description: 'Description',
    argsSchema: {
      param: z.string().describe('Parameter description')
    }
  },
  ({ param }) => ({
    messages: [
      {
        role: 'user',
        content: { type: 'text', text: `Prompt with ${param}` }
      }
    ]
  })
);
```

## 新功能

### 1. Streamable HTTP Transport

新增 HTTP 服务器支持，可以通过 HTTP 协议访问 MCP 服务：

```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const app = express();
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

### 2. 通知防抖

优化性能，减少不必要的网络流量：

```typescript
const server = new McpServer(
  { name: "app", version: "3.0.0" },
  {
    debouncedNotificationMethods: [
      'notifications/tools/list_changed',
      'notifications/resources/list_changed',
      'notifications/prompts/list_changed'
    ]
  }
);
```

### 3. 结构化输出

工具现在可以返回结构化数据：

```typescript
return {
  content: [{ type: 'text', text: 'Human readable text' }],
  structuredContent: { key: 'value' } // 机器可解析的数据
};
```

### 4. Sampling 支持

可以在工具中调用 LLM：

```typescript
server.registerTool('summarize', { ... }, async (args) => {
  const response = await server.server.createMessage({
    messages: [{ role: 'user', content: { type: 'text', text: 'Summarize...' } }],
    maxTokens: 500
  });
  
  return {
    content: [{ type: 'text', text: response.content.text }]
  };
});
```

### 5. Zod 类型验证

所有输入输出都有类型安全：

```typescript
const InputSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(150).optional()
});

server.registerTool('tool', {
  inputSchema: InputSchema,
  outputSchema: z.object({ result: z.boolean() })
}, async (args) => {
  // args 自动类型推断和验证
});
```

## 迁移步骤

### 1. 更新依赖

```bash
npm install @modelcontextprotocol/sdk@^1.20.1
npm install express@^4.21.2
npm install --save-dev @types/express@^5.0.0
npm install --save-dev @types/node@^22.10.7
npm install --save-dev typescript@^5.7.3
```

### 2. 更新代码

1. 将 `Server` 改为 `McpServer`
2. 将 `setRequestHandler` 改为 `register*` 方法
3. 添加 Zod schemas
4. 更新工具返回格式，添加 `structuredContent`

### 3. 测试

```bash
npm run build
npm test
npm run dev
```

### 4. 更新配置文件

确保 `package.json` 中的脚本包含 HTTP 服务器：

```json
{
  "scripts": {
    "server:stdio": "node dist/index.js",
    "server:http": "node dist/http-server.js"
  }
}
```

## 向后兼容性

### 保持兼容的部分

- ✅ 所有预设模板保持不变
- ✅ 样式配置格式保持不变
- ✅ 输出的 DOCX 文件格式保持不变
- ✅ Stdio transport 继续工作

### 不兼容的部分

- ❌ 旧的 `Server` API 不再使用（但仍可用）
- ❌ 需要重新构建项目
- ❌ Node.js 版本要求 >= 18.0.0

## 故障排除

### 构建错误

如果遇到构建错误：

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 类型错误

确保使用正确的类型导入：

```typescript
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
```

### HTTP 服务器无法启动

检查端口是否被占用：

```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

## 获取帮助

如有问题：

1. 查看 [README.md](./README.md) 完整文档
2. 访问 [MCP 官方文档](https://modelcontextprotocol.io)
3. 提交 [GitHub Issue](https://github.com/aigroup/aigroup-mdtoword-mcp/issues)

## 总结

v3.0.0 是一个重大升级，带来了更好的类型安全、更强大的功能和更好的性能。虽然需要一些代码迁移工作，但新的 API 更加直观和易用。

建议所有用户升级到 v3.0.0 以获得最佳体验！