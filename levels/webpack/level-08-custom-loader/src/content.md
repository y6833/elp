# 自定义 Loader 示例

这是一个 **Markdown** 文件，将通过我们自定义的 `markdown-loader` 转换为 HTML。

## 功能特性

- 支持 GitHub Flavored Markdown
- 自动转换链接和代码块
- 支持表格和任务列表

### 代码示例

```javascript
// 这是一个 JavaScript 代码块
function hello(name) {
  console.log(`Hello, ${name}!`);
}

hello('Webpack');
```

### 表格示例

| 特性 | 支持 | 说明 |
|------|------|------|
| 标题 | ✅ | 支持 1-6 级标题 |
| 列表 | ✅ | 有序和无序列表 |
| 代码 | ✅ | 行内和块级代码 |
| 表格 | ✅ | Markdown 表格语法 |

### 任务列表

- [x] 创建 markdown-loader
- [x] 支持基本 Markdown 语法
- [ ] 添加语法高亮
- [ ] 支持数学公式

> 这是一个引用块，用于突出显示重要信息。

---

通过自定义 Loader，我们可以将任何格式的文件转换为 JavaScript 模块！