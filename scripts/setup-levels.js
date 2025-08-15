#!/usr/bin/env node

/**
 * 关卡设置脚本
 * 自动安装所有关卡需要的依赖包
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
    return false;
  }
  return true;
}

// 所有关卡需要的依赖包
const dependencies = {
  // 构建工具
  'rollup': '^3.20.0',
  '@rollup/plugin-node-resolve': '^15.0.0',
  '@rollup/plugin-commonjs': '^24.0.0',
  '@rollup/plugin-babel': '^6.0.0',
  '@rollup/plugin-terser': '^0.4.0',
  'parcel': '^2.8.0',
  'esbuild': '^0.17.0',
  '@swc/core': '^1.3.0',
  '@swc/cli': '^0.1.0',
  
  // 包管理器工具
  'npm-check-updates': '^16.0.0',
  'rimraf': '^4.0.0',
  'cross-env': '^7.0.0',
  
  // 测试工具
  'jest': '^29.0.0',
  '@types/jest': '^29.0.0',
  'cypress': '^12.0.0',
  '@playwright/test': '^1.30.0',
  'puppeteer': '^19.0.0',
  
  // CI/CD 工具
  'husky': '^8.0.0',
  'lint-staged': '^13.0.0',
  'semantic-release': '^20.0.0',
  
  // 性能优化工具
  'webpack-bundle-analyzer': '^4.8.0',
  'lighthouse': '^10.0.0',
  '@lhci/cli': '^0.12.0',
  'workbox-webpack-plugin': '^6.5.0',
  'workbox-cli': '^6.5.0',
  
  // 部署工具
  'netlify-cli': '^13.0.0',
  'vercel': '^28.0.0',
  'gh-pages': '^5.0.0',
  'aws-cli': '^1.27.0',
  
  // 代码质量工具
  'eslint': '^8.0.0',
  'prettier': '^2.8.0',
  'typescript': '^4.9.0',
  '@typescript-eslint/eslint-plugin': '^5.0.0',
  '@typescript-eslint/parser': '^5.0.0',
  
  // 其他工具
  'chalk': '^4.1.2',
  'inquirer': '^8.2.6',
  'ora': '^6.1.0',
  'figlet': '^1.5.2'
};

function showWelcome() {
  log('\n🎯 前端工程化学习平台 - 关卡设置', 'cyan');
  log('═'.repeat(50), 'cyan');
  log('这个脚本将为你安装所有关卡需要的依赖包', 'yellow');
  log('包含构建工具、测试框架、CI/CD 工具等', 'yellow');
  log('═'.repeat(50), 'cyan');
}

function checkEnvironment() {
  log('\n🔍 检查环境...', 'blue');
  
  // 检查 Node.js 版本
  const nodeVersion = process.version;
  log(`Node.js 版本: ${nodeVersion}`, 'yellow');
  
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 16) {
    log('❌ Node.js 版本过低，需要 16.0.0 或更高版本', 'red');
    process.exit(1);
  }
  
  // 检查包管理器
  const packageManagers = ['npm', 'yarn', 'pnpm'];
  const availableManagers = [];
  
  packageManagers.forEach(manager => {
    try {
      execSync(`${manager} --version`, { stdio: 'pipe' });
      availableManagers.push(manager);
      log(`✅ ${manager} 可用`, 'green');
    } catch (error) {
      log(`⚠️  ${manager} 不可用`, 'yellow');
    }
  });
  
  if (availableManagers.length === 0) {
    log('❌ 没有找到可用的包管理器', 'red');
    process.exit(1);
  }
  
  return availableManagers[0]; // 返回第一个可用的包管理器
}

function installDependencies(packageManager) {
  log('\n📦 安装依赖包...', 'blue');
  
  const dependencyList = Object.entries(dependencies)
    .map(([name, version]) => `${name}@${version}`)
    .join(' ');
  
  let installCommand;
  switch (packageManager) {
    case 'npm':
      installCommand = `npm install --save-dev ${dependencyList}`;
      break;
    case 'yarn':
      installCommand = `yarn add --dev ${dependencyList}`;
      break;
    case 'pnpm':
      installCommand = `pnpm add --save-dev ${dependencyList}`;
      break;
    default:
      installCommand = `npm install --save-dev ${dependencyList}`;
  }
  
  return execCommand(installCommand, '安装依赖包');
}

function createLevelDirectories() {
  log('\n📁 创建关卡目录...', 'blue');
  
  const levelStructure = {
    'build-tools': ['level-01-rollup', 'level-02-parcel', 'level-03-esbuild', 'level-04-swc', 'level-05-comparison'],
    'package-managers': ['level-01-npm-advanced', 'level-02-yarn', 'level-03-pnpm', 'level-04-monorepo'],
    'ci-cd': ['level-01-github-actions', 'level-02-gitlab-ci', 'level-03-docker', 'level-04-automated-deployment'],
    'testing': ['level-01-jest', 'level-02-cypress', 'level-03-playwright', 'level-04-coverage'],
    'performance': ['level-01-bundle-analysis', 'level-02-lazy-loading', 'level-03-pwa', 'level-04-micro-frontends'],
    'deployment': ['level-01-static-hosting', 'level-02-cdn', 'level-03-serverless', 'level-04-kubernetes']
  };
  
  const levelsDir = path.join(process.cwd(), 'levels');
  
  Object.entries(levelStructure).forEach(([category, levels]) => {
    const categoryDir = path.join(levelsDir, category);
    
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      log(`✅ 创建目录: levels/${category}`, 'green');
    }
    
    levels.forEach(level => {
      const levelDir = path.join(categoryDir, level);
      if (!fs.existsSync(levelDir)) {
        fs.mkdirSync(levelDir, { recursive: true });
        log(`✅ 创建目录: levels/${category}/${level}`, 'green');
      }
    });
  });
}

function updatePackageJson() {
  log('\n📝 更新 package.json...', 'blue');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ 找不到 package.json 文件', 'red');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 添加新的脚本
    const newScripts = {
      'setup:levels': 'node scripts/setup-levels.js',
      'test:all': 'npm run test && npm run test:e2e',
      'test:e2e': 'cypress run',
      'test:unit': 'jest',
      'test:coverage': 'jest --coverage',
      'build:all': 'npm run build:webpack && npm run build:vite && npm run build:rollup',
      'build:rollup': 'rollup -c',
      'build:parcel': 'parcel build src/index.html',
      'build:esbuild': 'node build.js',
      'lint:all': 'eslint . --ext .js,.ts,.jsx,.tsx',
      'format:all': 'prettier --write "**/*.{js,ts,jsx,tsx,json,md}"',
      'clean:all': 'rimraf dist build .cache .parcel-cache coverage'
    };
    
    packageJson.scripts = {
      ...packageJson.scripts,
      ...newScripts
    };
    
    // 更新描述
    packageJson.description = '一个通过关卡式学习掌握前端工程化（33个关卡）的交互式项目';
    
    // 添加关键词
    const newKeywords = [
      'rollup', 'parcel', 'esbuild', 'swc',
      'yarn', 'pnpm', 'monorepo',
      'jest', 'cypress', 'playwright',
      'github-actions', 'gitlab-ci', 'docker',
      'pwa', 'micro-frontends', 'performance',
      'netlify', 'vercel', 'serverless', 'kubernetes'
    ];
    
    packageJson.keywords = [
      ...new Set([...(packageJson.keywords || []), ...newKeywords])
    ];
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('✅ package.json 更新完成', 'green');
    return true;
    
  } catch (error) {
    log(`❌ 更新 package.json 失败: ${error.message}`, 'red');
    return false;
  }
}

function showSummary() {
  log('\n🎉 设置完成!', 'green');
  log('═'.repeat(50), 'green');
  log('现在你可以开始学习以下关卡:', 'yellow');
  log('', 'reset');
  
  const categories = [
    '🔧 构建工具对比 (5个关卡)',
    '📦 包管理器进阶 (4个关卡)', 
    '🚀 CI/CD 工程化 (4个关卡)',
    '🧪 测试工程化 (4个关卡)',
    '⚡ 性能优化 (4个关卡)',
    '🌐 部署工程化 (4个关卡)'
  ];
  
  categories.forEach(category => {
    log(`  ${category}`, 'cyan');
  });
  
  log('', 'reset');
  log('📚 查看完整关卡列表: cat LEVELS_OVERVIEW.md', 'blue');
  log('🚀 开始学习: npm start', 'blue');
  log('💡 快速开始: cat QUICK_START.md', 'blue');
  log('═'.repeat(50), 'green');
}

// 主函数
async function main() {
  try {
    showWelcome();
    
    const packageManager = checkEnvironment();
    log(`\n使用包管理器: ${packageManager}`, 'cyan');
    
    createLevelDirectories();
    
    const installSuccess = installDependencies(packageManager);
    if (!installSuccess) {
      log('\n⚠️  依赖安装失败，但你仍然可以使用现有的关卡', 'yellow');
    }
    
    updatePackageJson();
    showSummary();
    
  } catch (error) {
    log(`\n❌ 设置过程中出现错误: ${error.message}`, 'red');
    log('请检查错误信息并重试', 'yellow');
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
  installDependencies,
  createLevelDirectories,
  updatePackageJson
};