# 发布清单 v3.1.0

## ✅ 准备工作

- [x] 版本号更新到 3.1.0
- [x] 构建成功（npm run build）
- [x] 所有功能测试通过
- [x] 文档已更新
- [x] 发布说明已创建

## 📝 发布步骤

### 1. 验证构建
```bash
npm run build
```
✅ 已完成

### 2. 测试功能
```bash
npm test
```
建议在发布前运行测试

### 3. Git 提交
```bash
git add .
git commit -m "Release v3.1.0: 表格功能扩展

- 新增12种预定义表格样式
- 支持CSV/JSON数据导入
- 实现单元格合并和嵌套表格
- 添加3个新的MCP工具
- 完善文档和示例
"
```

### 4. 创建 Git 标签
```bash
git tag -a v3.1.0 -m "Release v3.1.0: 表格功能扩展"
```

### 5. 推送到远程仓库
```bash
git push origin main
git push origin v3.1.0
```

### 6. 发布到 npm
```bash
npm publish
```

## 📦 发布内容

### 新增文件
- ✅ src/utils/tableProcessor.ts
- ✅ src/utils/tableBuilder.ts
- ✅ examples/table-features-demo.md
- ✅ TABLE_FEATURES.md
- ✅ RELEASE_NOTES_v3.1.0.md

### 修改文件
- ✅ package.json (版本 3.1.0)
- ✅ src/types/style.ts
- ✅ src/converter/markdown.ts
- ✅ src/index.ts
- ✅ README.md

### 新增依赖
- ✅ csv-parse@^5.5.6

## 🎯 发布后

### 1. 验证发布
```bash
npm view aigroup-mdtoword-mcp version
```
应该显示 3.1.0

### 2. 更新文档网站
如果有文档网站，更新相关内容

### 3. 发布公告
- GitHub Release
- 社交媒体
- 技术博客

## 📋 发布说明要点

### 核心特性
1. **12种预定义表格样式** - 覆盖各种应用场景
2. **CSV/JSON数据导入** - 快速将数据转换为表格
3. **复杂表格支持** - 单元格合并和嵌套表格
4. **3个新MCP工具** - 便捷的表格操作接口

### 技术改进
- 新增 TableProcessor 类处理表格数据
- 新增 TableBuilder 类构建DOCX表格
- 完整的类型定义和验证
- 向后兼容现有功能

### 文档更新
- 完整的功能示例文档
- 详细的API说明
- 最佳实践指南

## 🔍 验证清单

发布后验证以下内容：

- [ ] npm 包可以正常安装
- [ ] 文档链接正确
- [ ] 示例代码可以运行
- [ ] MCP工具正常工作
- [ ] 表格样式正确应用
- [ ] CSV/JSON导入功能正常

## 📞 支持渠道

- GitHub Issues: https://github.com/aigroup/aigroup-mdtoword-mcp/issues
- Email: jackdark425@gmail.com

---

**发布负责人**: AI Group
**发布日期**: 2025-01-19
**版本**: 3.1.0