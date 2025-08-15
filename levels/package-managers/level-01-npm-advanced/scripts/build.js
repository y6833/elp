#!/usr/bin/env node

/**
 * 自定义构建脚本
 * 演示如何使用 Node.js 编写复杂的构建逻辑
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n📦 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} 完成`, 'green');
  } catch (error) {
    log(`❌ ${description} 失败`, 'red');
    process.exit(1);
  }
}

function checkEnvironment() {
  log('🔍 检查构建环境...', 'cyan');
  
  // 检查 Node.js 版本
  const nodeVersion = process.version;
  const requiredVersion = '16.0.0';
  log(`Node.js 版本: ${nodeVersion}`, 'yellow');
  
  // 检查必要的工具
  const tools = ['npm', 'git'];
  tools.forEach(tool => {
    try {
      execSync(`${tool} --version`, { stdio: 'pipe' });
      log(`✅ ${tool} 可用`, 'green');
    } catch (error) {
      log(`❌ ${tool} 不可用`, 'red');
      process.exit(1);
    }
  });
}

function cleanDist() {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    log('🧹 清理 dist 目录...', 'yellow');
    fs.rmSync(distPath, { recursive: true, force: true });
  }
}

function generateBuildInfo() {
  const buildInfo = {
    version: require('../package.json').version,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    gitCommit: getGitCommit(),
    gitBranch: getGitBranch()
  };
  
  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(distPath, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  log('📝 生成构建信息文件', 'green');
}

function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function validateBuild() {
  log('🔍 验证构建结果...', 'cyan');
  
  const requiredFiles = [
    'dist/index.js',
    'dist/index.esm.js',
    'dist/build-info.json'
  ];
  
  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file} 存在`, 'green');
    } else {
      log(`❌ ${file} 不存在`, 'red');
      allFilesExist = false;
    }
  });
  
  if (!allFilesExist) {
    log('❌ 构建验证失败', 'red');
    process.exit(1);
  }
  
  log('✅ 构建验证通过', 'green');
}

function showBuildSummary() {
  log('\n📊 构建摘要:', 'magenta');
  
  const distPath = path.join(process.cwd(), 'dist');
  const files = fs.readdirSync(distPath);
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    log(`  📄 ${file}: ${size} KB`, 'yellow');
  });
}

// 主构建流程
async function main() {
  log('🚀 开始构建...', 'cyan');
  
  try {
    checkEnvironment();
    cleanDist();
    
    // 执行构建命令
    execCommand('npm run build:lib', '构建库文件');
    execCommand('npm run build:types', '生成类型定义');
    
    generateBuildInfo();
    validateBuild();
    showBuildSummary();
    
    log('\n🎉 构建完成!', 'green');
    
  } catch (error) {
    log(`\n❌ 构建失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkEnvironment,
  cleanDist,
  generateBuildInfo,
  validateBuild
};