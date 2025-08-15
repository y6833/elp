const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  
  // 生产环境使用 source-map 便于错误追踪
  devtool: 'source-map',
  
  plugins: [
    // 提取 CSS 到单独文件
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css'
    }),
    
    // 定义生产环境变量
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.API_URL': JSON.stringify('https://api.example.com'),
      'process.env.DEBUG': JSON.stringify(false)
    })
  ],
  
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          // 生产环境提取 CSS
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  
  optimization: {
    minimize: true,
    minimizer: [
      // JavaScript 压缩
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除 console
            drop_debugger: true // 移除 debugger
          }
        }
      }),
      // CSS 压缩
      new CssMinimizerPlugin()
    ],
    
    // 更激进的代码分割
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all'
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    },
    
    // 运行时代码分离
    runtimeChunk: {
      name: 'runtime'
    }
  },
  
  // 生产环境性能提示
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
});