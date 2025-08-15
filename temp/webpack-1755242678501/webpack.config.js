const path = require('path');

module.exports = {
  // TODO: 设置入口文件
  entry: './src/index.js',
  
  // TODO: 配置输出
  output: {
    // 输出目录
    path: path.resolve(__dirname, 'dist'),
    // 输出文件名
    filename: 'bundle.js'
  },
  
  // TODO: 设置模式
  mode: 'test'
};