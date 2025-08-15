const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  
  module: {
    rules: [
      // TODO: 配置自定义 markdown-loader
      {
        test: /\.md$/,
        use: [
          {
            loader: path.resolve(__dirname, 'loaders/markdown-loader.js'),
            options: {
              // TODO: 配置 loader 选项
              // breaks: true,
              // sanitize: false,
              // raw: false
            }
          }
        ]
      },
      
      // TODO: 配置 banner-loader 为 JavaScript 文件添加头部注释
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: path.resolve(__dirname, 'loaders/banner-loader.js'),
            options: {
              // TODO: 配置 banner 选项
              // author: 'Your Name',
              // date: true,
              // multiline: true
            }
          }
        ]
      },
      
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: '自定义 Loader 示例'
    })
  ],
  
  devServer: {
    static: './dist',
    hot: true,
    open: true,
    port: 3000
  },
  
  // 解析配置
  resolveLoader: {
    // 添加自定义 loader 的搜索路径
    modules: ['node_modules', path.resolve(__dirname, 'loaders')]
  }
};