const webpack = require('webpack');
const config = require('./webpack.config.js');

// TODO: 完成分析脚本
// 1. 生成构建统计信息
// 2. 分析依赖关系
// 3. 输出优化建议

console.log('🔍 开始分析 Bundle...');

// 运行 webpack 构建
webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error('构建失败:', err || stats.toJson().errors);
    return;
  }

  const info = stats.toJson();
  
  console.log('📊 构建统计信息:');
  console.log(`- 总文件数: ${info.assets.length}`);
  console.log(`- 总大小: ${(info.assets.reduce((sum, asset) => sum + asset.size, 0) / 1024).toFixed(2)} KB`);
  
  console.log('\n📦 最大的文件:');
  info.assets
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .forEach(asset => {
      console.log(`- ${asset.name}: ${(asset.size / 1024).toFixed(2)} KB`);
    });
  
  console.log('\n💡 优化建议:');
  console.log('- 使用动态导入拆分大型模块');
  console.log('- 移除未使用的依赖');
  console.log('- 启用 Tree Shaking');
  console.log('- 使用 CDN 加载第三方库');
});