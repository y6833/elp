const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development',
  
  // TODO: 配置模块规则
  module: {
    rules: [
      // TODO: 添加 CSS 加载器规则
      {
        test: /\.css$/,
        use: ['style-loader','css-loader']
      },
      // TODO: 添加图片加载器规则
      {
        test: /\.(png|jpg|gif)$/,
        use: ['file-loader']
      }
    ]
  }
};