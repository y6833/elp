const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  mode: 'production',
  
  // TODO: 配置缓存
  cache: {
    type: '', // 'filesystem' 或 'memory'
    // buildDependencies: {
    //   config: [__filename]
    // }
  },
  
  // TODO: 配置模块解析优化
  resolve: {
    // 设置别名
    alias: {
      // '@': path.resolve(__dirname, 'src'),
      // 'utils': path.resolve(__dirname, 'src/utils')
    },
    // 优化扩展名解析
    extensions: ['.js', '.json'],
    // 优化模块查找
    modules: ['node_modules']
  },
  
  // TODO: 配置外部依赖
  externals: {
    // 'lodash': '_',
    // 'react': 'React'
  },
  
  optimization: {
    // 启用 Tree Shaking
    usedExports: true,
    sideEffects: false,
    
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true
      }
    }),
    
    // TODO: 添加性能分析插件
    // new webpack.BundleAnalyzerPlugin()
  ]
};