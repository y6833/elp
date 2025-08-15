#!/usr/bin/env node

/**
 * postinstall 脚本
 * 在 npm install 后自动执行的脚本
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const requiredVersion = '16.0.0';
  
  const current = currentVersion.slice(1).split('.').map(Number);
  const required = requiredVersion.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (current[i] > required[i]) return true;
    if (current[i] < required[i]) return false;
  }
  return true;
}

function setupGitHooks() {
  const hooksDir = path.join(process.cwd(), '.git', 'hooks');
  
  if (!fs.existsSync(hooksDir)) {
    log('⚠️  Git 仓库未初始化，跳过 Git hooks 设置', '\x1b[33m');
    return;
  }
  
  // 创建 pre-commit hook
  const preCommitHook = `#!/bin/sh
# 运行 lint-staged
npx lint-staged
`;
  
  const preCommitPath = path.join(hooksDir, 'pre-commit');
  fs.writeFileSync(preCommitPath, preCommitHook);
  fs.chmodSync(preCommitPath, '755');
  
  log('✅ Git hooks 设置完成', '\x1b[32m');
}

function createConfigFiles() {
  const configs = [
    {
      file: '.editorconfig',
      content: `root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
`
    },
    {
      file: '.gitignore',
      content: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
.cache/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Coverage
coverage/
.nyc_output/
`
    }
  ];
  
  configs.forEach(({ file, content }) => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      log(`✅ 创建 ${file}`, '\x1b[32m');
    }
  });
}

function showWelcomeMessage() {
  const packageJson = require('../package.json');
  
  log('\n🎉 安装完成!', '\x1b[32m');
  log(`📦 ${packageJson.name} v${packageJson.version}`, '\x1b[36m');
  log('\n可用的脚本命令:', '\x1b[33m');
  
  Object.keys(packageJson.scripts).forEach(script => {
    log(`  npm run ${script}`, '\x1b[37m');
  });
  
  log('\n📚 更多信息请查看 README.md', '\x1b[36m');
}

function main() {
  log('🔧 执行 postinstall 脚本...', '\x1b[34m');
  
  // 检查 Node.js 版本
  if (!checkNodeVersion()) {
    log('❌ Node.js 版本过低，请升级到 16.0.0 或更高版本', '\x1b[31m');
    process.exit(1);
  }
  
  // 设置开发环境
  try {
    setupGitHooks();
    createConfigFiles();
    showWelcomeMessage();
  } catch (error) {
    log(`❌ postinstall 脚本执行失败: ${error.message}`, '\x1b[31m');
  }
}

if (require.main === module) {
  main();
}