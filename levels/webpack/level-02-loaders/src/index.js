// 导入样式文件
import './styles.css';

// 导入图片
import logo from './logo.png';

console.log('Hello Webpack with Loaders!');

function createApp() {
  const app = document.createElement('div');
  app.className = 'app';
  
  const title = document.createElement('h1');
  title.textContent = '学习 Webpack 加载器';
  
  const img = document.createElement('img');
  img.src = logo;
  img.alt = 'Logo';
  
  app.appendChild(title);
  app.appendChild(img);
  
  return app;
}

document.body.appendChild(createApp());