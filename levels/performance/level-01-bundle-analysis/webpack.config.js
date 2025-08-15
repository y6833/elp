const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// TODO: 完成 Bundle 分析配置
// 1. 配置 BundleAnalyzerPlugin
// 2. 设置代码分割
// 3. 配置性能预算
// 4. 添加构建统计信息

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    // 在这里添加 BundleAnalyzerPlugin 配置
  ],
  // 配置性能预算
  // performance: {
  //   maxAssetSize: 250000,
  //   maxEntrypointSize: 250000,
  //   hints: 'warning'
  // },
  // 配置代码分割
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //     cacheGroups: {
  //       vendor: {
  //         test: /[\\/]node_modules[\\/]/,
  //         name: 'vendors',
  //         chunks: 'all'
  //       }
  //     }
  //   }
  // }
};