const marked = require('marked');
const loaderUtils = require('loader-utils');

/**
 * Markdown Loader
 * 将 Markdown 文件转换为 HTML 字符串
 */
module.exports = function(source) {
  // 获取 loader 选项
  const options = loaderUtils.getOptions(this) || {};
  
  // 配置 marked 选项
  const markedOptions = {
    gfm: true, // GitHub Flavored Markdown
    breaks: options.breaks !== false, // 换行符转换为 <br>
    sanitize: options.sanitize === true, // 清理 HTML
    ...options.marked
  };
  
  try {
    // 转换 Markdown 为 HTML
    const html = marked(source, markedOptions);
    
    // 根据选项决定返回格式
    if (options.raw) {
      // 返回原始 HTML 字符串
      return `module.exports = ${JSON.stringify(html)};`;
    } else {
      // 返回包装后的 JavaScript 模块
      return `
        // Markdown Loader 生成的模块
        const html = ${JSON.stringify(html)};
        
        // 创建 DOM 元素的辅助函数
        function createMarkdownElement() {
          const div = document.createElement('div');
          div.className = 'markdown-content';
          div.innerHTML = html;
          return div;
        }
        
        // 导出 HTML 内容和辅助函数
        module.exports = {
          html: html,
          createElement: createMarkdownElement,
          render: function(container) {
            if (typeof container === 'string') {
              container = document.querySelector(container);
            }
            if (container) {
              container.appendChild(createMarkdownElement());
            }
          }
        };
      `;
    }
  } catch (error) {
    // 使用 Webpack 的错误报告机制
    this.emitError(new Error(`Markdown Loader: ${error.message}`));
    return '';
  }
};

// 标记为原始 loader（处理字符串而不是 Buffer）
module.exports.raw = false;