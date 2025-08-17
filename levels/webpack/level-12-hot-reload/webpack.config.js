const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  
  // 开发服务器配置
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    open: true,
    hot: true, // 启用热模块替换
    compress: true,
    historyApiFallback: true,
    
    // API代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    
    // 客户端日志级别
    client: {
      logging: 'info',
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    
    // 监听文件变化
    watchFiles: ['src/**/*', 'public/**/*'],
  },
  
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ],
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html'
    })
  ],
  
  // 开发工具
  devtool: 'eval-source-map',
  
  // 优化配置
  optimization: {
    runtimeChunk: 'single',
  },
};