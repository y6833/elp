const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('📦 开始构建项目...'));

// 创建必要的目录
const dirs = ['public', 'levels/webpack', 'levels/vite'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(chalk.green(`✅ 创建目录: ${dir}`));
  }
});

console.log(chalk.green('🎉 构建完成！'));
console.log(chalk.blue('💡 运行 npm start 启动学习平台'));