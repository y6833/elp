const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js'
  },
  mode: 'production',
  
  // TODO: 配置优化选项
  optimization: {
    // TODO: 配置代码分割
    splitChunks: {
      chunks: '', // 'all', 'async', 'initial'
      cacheGroups: {
        // TODO: 配置缓存组
        vendor: {
          // 提取第三方库
        },
        common: {
          // 提取公共代码
        }
      }
    },
    
    // TODO: 分离运行时代码
    runtimeChunk: ''
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]
};