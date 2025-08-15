// Vite 项目入口文件
import './style.css';

console.log('Hello Vite!');

function createApp() {
  const app = document.createElement('div');
  app.id = 'app';
  app.innerHTML = `
    <h1>🚀 欢迎使用 Vite</h1>
    <p>体验极速的开发服务器</p>
  `;
  return app;
}

document.body.appendChild(createApp());