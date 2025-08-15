const { spawn } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🚀 启动开发服务器...'));

// 启动主服务器
const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error(chalk.red('启动失败:'), error);
});

server.on('close', (code) => {
  console.log(chalk.yellow(`服务器进程退出，代码: ${code}`));
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n正在关闭服务器...'));
  server.kill('SIGINT');
  process.exit(0);
});