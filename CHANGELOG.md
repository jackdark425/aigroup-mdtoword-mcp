# 更新日志

## [3.0.0] - 2025-01-18

### 🎉 重大升级 - MCP SDK 1.20.1

这是一个重大版本升级，将项目完全迁移到最新的 MCP SDK 1.20.1，引入了多项现代化特性和改进。

### ✨ 新增特性

#### MCP 协议增强
- **最新 SDK 1.20.1**: 升级到最新的 MCP TypeScript SDK
- **McpServer 高级 API**: 使用新的 `McpServer` 类替代低级 `Server` API
- **Zod 类型验证**: 所有工具输入输出都有完整的类型安全验证
- **结构化输出**: 工具返回 `structuredContent` 便于程序化处理
- **通知防抖**: 自动合并相同类型的通知，优化网络性能

#### 新传输方式
- **Streamable HTTP Transport**: 新增 HTTP 服务器支持 (`src/http-server.ts`)
  - 支持通过 HTTP POST `/mcp` 访问
  - 健康检查端点 `/health`
  - 完整的 CORS 支持
  - 并发请求处理

#### 动态资源
- **ResourceTemplate**: 支持参数化资源 URI
  - `templates://{templateId}` - 动态获取特定模板详情
  - 自动参数提取和类型转换

#### 高级功能
- **AI Sampling**: 新增 `summarize_markdown` 工具演示 LLM 集成
  - 自动总结 Markdown 文档内容
  - 可配置摘要长度
  - 演示如何在工具中调用 LLM

#### 更好的元数据
- 所有工具、资源、提示都有 `title` 字段
- 详细的 `description` 说明
- Zod schema 提供参数级别的文档

### 📦 依赖升级

```json
{
  "@modelcontextprotocol/sdk": "1.11.3 → 1.20.1",
  "express": "新增 4.21.2",
  "node-fetch": "2.6.7 → 3.3.2",
  "@types/node": "18.19.83 → 22.10.7",
  "@types/express": "新增 5.0.0",
  "@types/cors": "新增",
  "typescript": "5.3.3 → 5.7.3",
  "tsx": "4.7.1 → 4.19.2"
}
```

### 🔧 API 变更

#### 工具注册
**旧方式 (v2.0.0)**:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // 处理逻辑
});
```

**新方式 (v3.0.0)**:
```typescript
server.registerTool(
  'tool-name',
  {
    title: 'Tool Title',
    description: 'Description',
    inputSchema: { param: z.string() },
    outputSchema: { result: z.string() }
  },
  async (args) => ({
    content: [{ type: 'text', text: 'result' }],
    structuredContent: { result: 'value' }
  })
);
```

#### 资源注册
**静态资源**:
```typescript
server.registerResource(
  'resource-id',
  'resource://uri',
  { title: 'Title', description: 'Desc' },
  async (uri) => ({ contents: [...] })
);
```

**动态资源** (新功能):
```typescript
server.registerResource(
  'dynamic-resource',
  new ResourceTemplate('resource://{param}', { list: undefined }),
  { title: 'Dynamic Resource' },
  async (uri, { param }) => ({ contents: [...] })
);
```

#### 提示注册
```typescript
server.registerPrompt(
  'prompt-name',
  {
    title: 'Prompt Title',
    argsSchema: { param: z.string() }
  },
  ({ param }) => ({ messages: [...] })
);
```

### 🚀 新功能使用

#### 启动 HTTP 服务器
```bash
npm run server:http
# 服务器运行在 http://localhost:3000/mcp
```

#### 连接到 HTTP 服务器
```bash
# MCP Inspector
npx @modelcontextprotocol/inspector http://localhost:3000/mcp

# Claude Code
claude mcp add --transport http my-server http://localhost:3000/mcp
```

#### 使用 Sampling 功能
```json
{
  "markdown": "# 长篇文档\n\n...很多内容...",
  "maxLength": 200
}
```

### 📝 新增文件

- `src/http-server.ts` - HTTP 传输服务器实现
- `UPGRADE.md` - 详细的升级指南
- `CHANGELOG.md` - 完整的更新日志

### 🔄 配置变更

#### package.json
- 更新版本到 `3.0.0`
- 新增 `server:http` 脚本
- 新增 Express 相关依赖

#### tsconfig.json
- 更新 target 到 `ES2022`
- 启用 `moduleResolution: bundler`
- 优化类型检查配置

### 🐛 修复

- 修复类型不匹配问题
- 改进错误处理
- 优化性能

### 📚 文档更新

- 完全重写 README.md，包含所有新特性
- 新增 UPGRADE.md 升级指南
- 更新代码示例
- 添加 HTTP 服务器使用说明

### ⚡ 性能优化

- **通知防抖**: 减少不必要的网络通信
- **类型缓存**: Zod schema 自动缓存
- **批量处理**: HTTP 服务器支持并发请求

### 🔒 向后兼容性

#### 保持兼容
- ✅ 所有预设模板
- ✅ 样式配置格式
- ✅ 输出的 DOCX 文件格式
- ✅ Stdio transport

#### 不兼容
- ❌ 需要 Node.js >= 18.0.0
- ❌ 需要重新安装依赖和构建
- ❌ API 调用方式变更（但功能保持）

### 📊 统计

- **新增代码**: ~800 行
- **修改文件**: 8 个
- **新增文件**: 3 个
- **升级依赖**: 7 个
- **新增功能**: 6 个

### 🙏 致谢

感谢 MCP 团队提供优秀的 SDK 和文档！

---

## [2.0.0] - 2025-01-18

### 新增
- 🎨 主题系统
- 💧 水印功能
- 📄 页眉页脚
- 📑 自动目录生成
- 📊 增强的表格样式
- 🖼️ 图片处理优化

### 改进
- ⚡ 性能优化（缓存、批量处理）
- 🛠️ 错误处理改进

---

## [1.0.0] - 2024-10-18

### 初始发布
- 🎉 完整的 Markdown 到 Word 转换
- 🎨 样式配置系统
- 📋 5 种预设模板
- 🔧 MCP 协议支持
- 💾 本地文件处理