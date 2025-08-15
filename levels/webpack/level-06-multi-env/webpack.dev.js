const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'development',
  
  // 开发环境使用 eval-source-map 获得最佳调试体验
  devtool: 'eval-source-map',
  
  devServer: {
    static: './dist',
    hot: true,
    open: true,
    port: 3000,
    historyApiFallback: true,
    compress: true
  },
  
  plugins: [
    // 热模块替换插件
    new webpack.HotModuleReplacementPlugin(),
    
    // 定义环境变量
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.API_URL': JSON.stringify('http://localhost:8080/api'),
      'process.env.DEBUG': JSON.stringify(true)
    })
  ],
  
  // 开发环境优化配置
  optimization: {
    // 保持模块名称便于调试
    moduleIds: 'named',
    chunkIds: 'named'
  },
  
  // 性能提示在开发环境关闭
  performance: {
    hints: false
  }
});