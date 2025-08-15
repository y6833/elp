const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');

// TODO: 配置 PWA 构建
// 1. 配置 Workbox 插件
// 2. 生成 Service Worker
// 3. 配置缓存策略
// 4. 添加 Web App Manifest

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    // TODO: 配置 Workbox 插件
    // new GenerateSW({
    //   clientsClaim: true,
    //   skipWaiting: true,
    //   runtimeCaching: [{
    //     urlPattern: /^https:\/\/api\./,
    //     handler: 'NetworkFirst',
    //     options: {
    //       cacheName: 'api-cache',
    //       expiration: {
    //         maxEntries: 50,
    //         maxAgeSeconds: 300
    //       }
    //     }
    //   }]
    // })
  ]
};