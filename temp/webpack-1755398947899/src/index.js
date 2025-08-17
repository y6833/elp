console.log('学习 Webpack 插件系统！');

// 创建应用
function createApp() {
  const app = document.createElement('div');
  app.className = 'container';
  
  const title = document.createElement('h1');
  title.textContent = '🔌 Webpack 插件系统';
  title.style.color = '#667eea';
  
  const description = document.createElement('p');
  description.textContent = '插件让 webpack 功能更强大！';
  description.style.fontSize = '18px';
  
  const list = document.createElement('ul');
  const features = [
    'HtmlWebpackPlugin - 自动生成 HTML',
    'CleanWebpackPlugin - 清理输出目录', 
    'MiniCssExtractPlugin - 提取 CSS',
    'OptimizeCSSAssetsPlugin - 优化 CSS'
  ];
  
  features.forEach(feature => {
    const li = document.createElement('li');
    li.textContent = feature;
    li.style.margin = '10px 0';
    list.appendChild(li);
  });
  
  app.appendChild(title);
  app.appendChild(description);
  app.appendChild(list);
  
  return app;
}

document.body.appendChild(createApp());