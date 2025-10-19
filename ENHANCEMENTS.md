# 增强功能说明 (v3.0.2)

本文档详细说明了 v3.0.2 版本中新增的资源系统和提示系统增强功能。

## 🎯 新增功能概览

### 📦 新增 6 个资源
- **3 个静态资源** - 提供系统级信息
- **3 个动态资源** - 支持参数化查询

### 💬 新增 2 个提示模板
- **batch_processing_workflow** - 批量处理工作流指导
- **troubleshooting_guide** - 故障排除指南

## 📚 新增资源详解

### 1. converters://supported_formats
**支持的格式列表**

提供完整的输入输出格式支持信息，包括：
- 输入格式（Markdown）的详细信息
- 输出格式（DOCX）的功能特性
- 计划中的格式（PDF、HTML）

**使用场景：**
- 了解系统支持的文件格式
- 查看各格式的特性和限制
- 了解未来的格式扩展计划

**返回格式：** JSON

### 2. templates://categories
**模板分类信息**

按分类组织所有可用模板，提供：
- 分类名称和描述
- 每个分类下的模板列表
- 模板的详细信息和默认标记

**使用场景：**
- 按类型浏览模板
- 了解不同类别模板的用途
- 快速找到适合的模板

**返回格式：** JSON

**示例响应：**
```json
{
  "business": {
    "name": "商务类",
    "description": "适用于商务报告、分析文档等商业场景",
    "templates": [
      {
        "id": "business",
        "name": "商务报告模板",
        "description": "...",
        "isDefault": false
      }
    ]
  }
}
```

### 3. performance://metrics
**性能指标说明**

提供系统性能基准和优化建议：
- 不同文档大小的转换时间预期
- 内存使用情况
- 优化建议（图片、表格、样式）
- 系统要求

**使用场景：**
- 评估转换性能
- 优化大文档处理
- 诊断性能问题

**返回格式：** Markdown

### 4. batch://{jobId}/status
**批处理任务状态**（动态资源）

查询批量转换任务的实时状态：
- 任务进度（总数、完成、失败、待处理）
- 开始时间和预计完成时间
- 每个文件的详细状态
- 错误信息（如有）

**使用场景：**
- 监控批量转换进度
- 诊断失败的文件
- 估算剩余时间

**参数：**
- `jobId` - 批处理任务 ID

**示例 URI：**
```
batch://job-123/status
batch://conversion-2025/status
```

**返回格式：** JSON

### 5. analysis://{docId}/report
**文档分析报告**（动态资源）

获取文档的详细分析信息：
- 统计数据（字数、段落数、图片数等）
- 文档结构（标题层级、嵌套深度）
- 复杂度评估
- 优化建议

**使用场景：**
- 了解文档结构
- 评估转换复杂度
- 获取优化建议

**参数：**
- `docId` - 文档 ID

**示例 URI：**
```
analysis://doc-456/report
analysis://my-document/report
```

**返回格式：** JSON

**示例响应：**
```json
{
  "documentId": "doc-456",
  "analysis": {
    "statistics": {
      "wordCount": 1250,
      "characterCount": 5420,
      "paragraphCount": 45,
      "headingCount": 12,
      "imageCount": 3,
      "tableCount": 2,
      "codeBlockCount": 5
    },
    "complexity": {
      "level": "medium",
      "score": 6.5
    },
    "recommendations": [
      "建议添加自动目录以改善导航",
      "考虑使用 technical 模板以更好地展示代码"
    ]
  }
}
```

### 6. integrations://available
**可用集成服务**

列出所有可用和计划中的集成服务：
- 存储集成（本地、云存储）
- AI 集成（摘要、翻译）
- 导出集成（PDF、HTML）

**使用场景：**
- 了解可用集成
- 规划功能使用
- 检查服务状态

**返回格式：** JSON

## 💬 新增提示模板详解

### 1. batch_processing_workflow
**批量处理工作流指导**

为不同场景提供批量文档处理的最佳实践。

**参数：**
- `scenario`: 'academic' | 'business' | 'technical'

**提供内容：**

#### Academic（学术场景）
- 论文章节批量处理流程
- 学术格式统一配置
- 引用和图表编号建议
- 目录和页眉页脚设置

#### Business（商务场景）
- 部门报告批量转换
- 企业品牌标识统一
- 水印和保密设置
- 表格和数据可视化优化

#### Technical（技术场景）
- API 文档批量生成
- 代码块样式配置
- 技术术语一致性
- 清晰的标题层级

**使用示例：**
```json
{
  "name": "batch_processing_workflow",
  "arguments": {
    "scenario": "business"
  }
}
```

### 2. troubleshooting_guide
**故障排除指南**

提供常见问题的诊断和解决方案。

**参数：**
- `errorType`: 'conversion' | 'performance' | 'integration'

**覆盖问题：**

#### Conversion（转换错误）
- ❌ 图片无法显示
  - 原因分析：路径、格式、大小、网络
  - 解决方案：路径检查、格式转换、压缩、本地化
- ❌ 表格格式错误
  - 原因分析：语法、复杂度、列宽
  - 解决方案：语法修正、简化、配置
- ❌ 样式未生效
  - 原因分析：语法、冲突、格式
  - 解决方案：验证、优先级、标准化

#### Performance（性能问题）
- ⚠️ 转换速度慢
  - 原因分析：文档大小、图片、资源
  - 解决方案：分割、优化、资源管理
- ⚠️ 内存占用高
  - 原因分析：批量、压缩、复杂度
  - 解决方案：分批、压缩、简化

#### Integration（集成问题）
- 🔌 MCP 连接失败
  - 原因分析：版本、依赖、端口
  - 解决方案：升级、安装、释放
- 🔌 Sampling 不可用
  - 原因分析：客户端支持、版本
  - 解决方案：更新、检查、替代方案
- 🔌 资源访问失败
  - 原因分析：URI 格式、参数
  - 解决方案：格式检查、参数补充、列表查看

**使用示例：**
```json
{
  "name": "troubleshooting_guide",
  "arguments": {
    "errorType": "conversion"
  }
}
```

## 🚀 使用建议

### 资源访问最佳实践

1. **静态资源** - 获取系统级信息
```javascript
// 查看支持的格式
await client.readResource('converters://supported_formats');

// 按分类浏览模板
await client.readResource('templates://categories');

// 了解性能指标
await client.readResource('performance://metrics');
```

2. **动态资源** - 查询特定信息
```javascript
// 查看批处理状态
await client.readResource('batch://job-123/status');

// 获取文档分析
await client.readResource('analysis://my-doc/report');
```

### 提示使用最佳实践

1. **工作流指导** - 批量处理前获取建议
```javascript
// 学术文档批处理指导
await client.getPrompt('batch_processing_workflow', {
  scenario: 'academic'
});
```

2. **故障排除** - 遇到问题时快速诊断
```javascript
// 转换问题排查
await client.getPrompt('troubleshooting_guide', {
  errorType: 'conversion'
});
```

## 📊 功能对比

| 功能 | v3.0.1 | v3.0.2 | 说明 |
|------|--------|--------|------|
| 静态资源 | 3 | 6 | +3 个系统信息资源 |
| 动态资源 | 1 | 4 | +3 个参数化资源 |
| 提示模板 | 3 | 5 | +2 个交互式提示 |
| 资源分类 | ❌ | ✅ | 支持按分类浏览 |
| 批处理指导 | ❌ | ✅ | 完整的工作流建议 |
| 故障排除 | ❌ | ✅ | 系统化的问题诊断 |

## 🎯 实际应用场景

### 场景 1：批量转换学术论文
```javascript
// 1. 查看学术模板分类
const categories = await readResource('templates://categories');

// 2. 获取批量处理指导
const guide = await getPrompt('batch_processing_workflow', {
  scenario: 'academic'
});

// 3. 执行批量转换
// ...

// 4. 监控批处理进度
const status = await readResource('batch://academic-batch-1/status');
```

### 场景 2：诊断转换问题
```javascript
// 1. 文档分析
const report = await readResource('analysis://my-doc/report');

// 2. 获取故障排除指导
const troubleshoot = await getPrompt('troubleshooting_guide', {
  errorType: 'conversion'
});

// 3. 根据建议修复问题
// ...
```

### 场景 3：性能优化
```javascript
// 1. 查看性能指标
const metrics = await readResource('performance://metrics');

// 2. 获取性能问题指导
const perfGuide = await getPrompt('troubleshooting_guide', {
  errorType: 'performance'
});

// 3. 应用优化建议
// ...
```

## 📝 总结

v3.0.2 版本通过增强资源和提示系统，显著提升了用户体验：

✅ **更丰富的信息** - 6 个新资源提供全面的系统信息
✅ **更智能的指导** - 2 个新提示提供场景化的最佳实践
✅ **更好的可发现性** - 分类和结构化展示便于查找
✅ **更强的实用性** - 覆盖实际工作流和问题诊断

这些增强使得 MCP 服务器不仅是一个转换工具，更是一个完整的文档处理解决方案！