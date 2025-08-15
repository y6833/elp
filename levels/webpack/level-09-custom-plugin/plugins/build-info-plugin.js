const fs = require('fs');
const path = require('path');

/**
 * BuildInfoPlugin
 * 生成构建信息文件的自定义插件
 */
class BuildInfoPlugin {
  constructor(options = {}) {
    this.options = {
      filename: 'build-info.json',
      includeHash: true,
      includeTimestamp: true,
      includeGitInfo: true,
      ...options
    };
  }
  
  apply(compiler) {
    const pluginName = 'BuildInfoPlugin';
    
    // 在 emit 阶段生成构建信息
    compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
      try {
        const buildInfo = this.generateBuildInfo(compilation);
        const content = JSON.stringify(buildInfo, null, 2);
        
        // 添加到输出资源中
        compilation.assets[this.options.filename] = {
          source: () => content,
          size: () => content.length
        };
        
        console.log(`✅ ${pluginName}: 构建信息已生成`);
        callback();
      } catch (error) {
        console.error(`❌ ${pluginName}: ${error.message}`);
        callback(error);
      }
    });
    
    // 在构建完成后输出统计信息
    compiler.hooks.done.tap(pluginName, (stats) => {
      const { time, errors, warnings } = stats.toJson();
      
      console.log(`\n📊 ${pluginName} 构建统计:`);
      console.log(`   构建时间: ${time}ms`);
      console.log(`   错误数量: ${errors.length}`);
      console.log(`   警告数量: ${warnings.length}`);
      
      if (this.options.includeHash) {
        console.log(`   构建哈希: ${stats.hash}`);
      }
    });
  }
  
  generateBuildInfo(compilation) {
    const buildInfo = {
      version: require('../package.json').version || '1.0.0',
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      webpack: compilation.compiler.webpack.version
    };
    
    // 包含构建哈希
    if (this.options.includeHash) {
      buildInfo.hash = compilation.hash;
      buildInfo.fullHash = compilation.fullHash;
    }
    
    // 包含时间戳
    if (this.options.includeTimestamp) {
      buildInfo.timestamp = Date.now();
    }
    
    // 包含 Git 信息
    if (this.options.includeGitInfo) {
      buildInfo.git = this.getGitInfo();
    }
    
    // 包含资源信息
    buildInfo.assets = this.getAssetsInfo(compilation);
    
    // 包含模块信息
    buildInfo.modules = {
      total: compilation.modules.size,
      cached: Array.from(compilation.modules).filter(m => m.buildInfo?.cached).length
    };
    
    return buildInfo;
  }
  
  getGitInfo() {
    try {
      const { execSync } = require('child_process');
      
      return {
        branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        shortCommit: execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(),
        author: execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim(),
        date: execSync('git log -1 --pretty=format:"%ai"', { encoding: 'utf8' }).trim(),
        message: execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim()
      };
    } catch (error) {
      return {
        error: 'Git 信息获取失败',
        message: error.message
      };
    }
  }
  
  getAssetsInfo(compilation) {
    const assets = {};
    
    for (const [name, asset] of Object.entries(compilation.assets)) {
      assets[name] = {
        size: asset.size(),
        type: path.extname(name).slice(1) || 'unknown'
      };
    }
    
    return assets;
  }
}

module.exports = BuildInfoPlugin;