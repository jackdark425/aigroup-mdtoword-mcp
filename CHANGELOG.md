# 更新日志

本文档记录了项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.0.2] - 2025-01-18

### 新增
- 📦 **新增静态资源**
  - `converters://supported_formats` - 支持的格式列表
  - `templates://categories` - 模板分类信息
  - `performance://metrics` - 性能指标说明
  - `integrations://available` - 可用集成服务

- 🎯 **新增动态资源模板**
  - `batch://{jobId}/status` - 批处理任务状态查询
  - `analysis://{docId}/report` - 文档分析报告
  - 支持参数化 URI，提供更灵活的资源访问

- 💬 **新增提示模板**
  - `batch_processing_workflow` - 批量处理工作流指导
    - 支持学术、商务、技术三种场景
    - 提供分步骤处理流程
    - 包含最佳实践和配置示例
  - `troubleshooting_guide` - 故障排除指南
    - 涵盖转换、性能、集成三类问题
    - 提供问题诊断和解决方案
    - 包含常见错误的快速修复

### 修复
- ✅ 修复现有资源无法访问的问题
- ✅ 改进资源响应格式，提升可读性
- ✅ 优化资源加载性能

### 改进
- 📚 更新文档，添加所有新资源和提示的使用说明
- 🧪 新增测试脚本验证资源和提示功能
- 🎨 改进资源内容的结构化展示

## [3.0.1] - 2025-01-18

### 修复
- 🐛 修复包元数据问题
- 📦 更新依赖版本

## [3.0.0] - 2025-01-18

### 重大更新

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

#### 新功能
- 🛠️ **HTTP 服务器** - 支持通过 HTTP 访问 MCP 服务
- 📡 **CORS 支持** - 允许浏览器客户端访问
- 🎯 **动态资源** - 使用 ResourceTemplate 实现参数化资源
- 🤖 **AI 摘要** - 使用 MCP sampling 功能生成文档摘要

#### 开发体验
- 🔧 **更好的错误处理** - 详细的错误信息和恢复建议
- 📖 **完善的文档** - 包含所有新特性的使用示例
- 🧪 **类型安全** - 完整的 TypeScript 类型定义

### 破坏性变更
- ⚠️ 需要 MCP SDK >= 1.20.0
- ⚠️ 工具返回格式变更（增加 structuredContent）
- ⚠️ 某些内部 API 签名变更

### 迁移指南
参见 [UPGRADE.md](UPGRADE.md) 了解从 2.x 升级到 3.x 的详细步骤。

## [2.0.0] - 2025-01-18

### 新增功能
- 🎨 **主题系统** - 统一颜色、字体、间距管理
- 💧 **水印功能** - 支持自定义文本、透明度、旋转
- 📄 **页眉页脚** - 自定义内容和自动页码
- 📑 **自动目录生成** - 可配置级别和样式
- 📊 **增强表格样式** - 列宽控制、单元格对齐、斑马纹
- 🖼️ **优化图片处理** - 自适应尺寸、格式检测、错误处理

### 性能优化
- ⚡ **智能缓存** - 提升重复转换性能
- 📦 **批量处理** - 支持并发转换
- 🔍 **增量验证** - 减少不必要的验证开销

### 改进
- 🛠️ **改进错误处理** - 详细错误信息和自动修复建议
- 📝 **新增示例模板** - enhanced-features 展示所有新功能
- 📚 **完善文档** - 添加所有新功能的使用说明

## [1.0.0] - 2024-10-18

### 首次发布
- 🎉 初始版本发布
- ✅ 支持完整的 Markdown 语法
- 🎨 提供丰富的样式配置系统
- 📋 内置 5 种预设模板
- 🔧 完整的 MCP 协议支持
- 💾 本地文件处理，无需云存储

### 核心功能
- Markdown 到 DOCX 转换
- 预设模板系统
- 样式配置
- MCP 工具和资源
- 提示系统

---

[3.0.2]: https://github.com/aigroup/aigroup-mdtoword-mcp/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/aigroup/aigroup-mdtoword-mcp/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/aigroup/aigroup-mdtoword-mcp/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/aigroup/aigroup-mdtoword-mcp/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/aigroup/aigroup-mdtoword-mcp/releases/tag/v1.0.0