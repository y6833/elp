const path = require('path');
// TODO: 导入需要的插件
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  mode: 'development',
  
  // TODO: 配置插件
  plugins: [
    // TODO: 添加 CleanWebpackPlugin
    new CleanWebpackPlugin()
    // TODO: 添加 HtmlWebpackPlugin
    new HtmlWebpackPlugin()
    // 提示：可以指定 template 选项使用自定义模板
  ]
};