const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true
    },
    
    // 配置source map用于调试
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    // 统计信息配置
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      timings: true,
      errors: true,
      errorDetails: true,
      warnings: true
    },
    
    plugins: [
      // 只在分析模式下启用bundle analyzer
      ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : [])
    ],
    
    // 优化配置
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          }
        }
      }
    },
    
    // 性能提示
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 250000,
      maxAssetSize: 250000
    }
  };
};