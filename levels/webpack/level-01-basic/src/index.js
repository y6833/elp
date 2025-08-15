// 这是项目的入口文件
console.log('Hello Webpack!');

// 创建一个简单的应用
function createApp() {
  const app = document.createElement('div');
  app.innerHTML = '<h1>欢迎来到 Webpack 学习之旅！</h1>';
  return app;
}

document.body.appendChild(createApp());