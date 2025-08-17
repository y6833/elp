// 导入样式文件
import './styles.css';

console.log('Hello Webpack with Loaders!');

function createApp() {
  const app = document.createElement('div');
  app.className = 'app';
  
  const title = document.createElement('h1');
  title.textContent = '学习 Webpack 加载器';
  
  const description = document.createElement('p');
  description.textContent = '这个示例展示了如何使用 CSS 加载器处理样式文件。';
  
  app.appendChild(title);
  app.appendChild(description);
  
  return app;
}

document.body.appendChild(createApp());