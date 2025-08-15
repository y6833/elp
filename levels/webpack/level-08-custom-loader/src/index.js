// 导入样式
import './style.css';

// 导入 Markdown 内容（通过自定义 loader 处理）
import readme from './content.md';

console.log('自定义 Loader 示例启动');

// 创建应用
class LoaderDemo {
  constructor() {
    this.init();
  }
  
  init() {
    this.createUI();
    this.bindEvents();
    this.loadMarkdownContent();
  }
  
  createUI() {
    const app = document.createElement('div');
    app.className = 'app';
    
    app.innerHTML = `
      <header class="header">
        <h1>🔧 自定义 Loader 示例</h1>
        <p>学习如何开发和使用自定义的 Webpack Loader</p>
      </header>
      
      <main class="main">
        <section class="loader-info">
          <h2>Loader 信息</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Markdown Loader:</label>
              <span class="status active">✅ 已加载</span>
            </div>
            <div class="info-item">
              <label>Banner Loader:</label>
              <span class="status active">✅ 已应用</span>
            </div>
            <div class="info-item">
              <label>处理文件:</label>
              <span>content.md</span>
            </div>
          </div>
        </section>
        
        <section class="markdown-section">
          <h2>Markdown 内容</h2>
          <div id="markdown-content" class="markdown-content">
            <!-- Markdown 内容将在这里显示 -->
          </div>
        </section>
        
        <section class="demo-section">
          <h2>Loader 功能演示</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <h3>文件转换</h3>
              <p>Markdown 文件被转换为 JavaScript 模块</p>
              <button id="show-raw" class="btn">查看原始内容</button>
            </div>
            <div class="demo-item">
              <h3>代码注释</h3>
              <p>JavaScript 文件自动添加了头部注释</p>
              <button id="show-source" class="btn">查看源码</button>
            </div>
          </div>
        </section>
      </main>
      
      <footer class="footer">
        <p>由自定义 Webpack Loader 处理 • 构建时间: ${new Date().toLocaleString()}</p>
      </footer>
    `;
    
    document.body.appendChild(app);
  }
  
  bindEvents() {
    // 显示原始内容
    document.getElementById('show-raw').addEventListener('click', () => {
      if (readme.html) {
        alert(`HTML 长度: ${readme.html.length} 字符`);
      }
    });
    
    // 显示源码（模拟）
    document.getElementById('show-source').addEventListener('click', () => {
      const sourceInfo = `
文件: ${__filename || 'src/index.js'}
构建时间: ${new Date().toISOString()}
Loader 处理: Banner Loader 已添加头部注释
      `.trim();
      
      alert(sourceInfo);
    });
  }
  
  loadMarkdownContent() {
    const container = document.getElementById('markdown-content');
    
    if (readme && readme.render) {
      // 使用 loader 提供的 render 方法
      readme.render(container);
    } else if (readme && readme.html) {
      // 直接使用 HTML 内容
      container.innerHTML = readme.html;
    } else {
      container.innerHTML = '<p>Markdown 内容加载失败</p>';
    }
  }
}

// 启动应用
new LoaderDemo();

// 热模块替换支持
if (module.hot) {
  module.hot.accept('./content.md', () => {
    console.log('Markdown 内容已更新');
    location.reload();
  });
}