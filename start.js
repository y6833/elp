const { spawn, execSync } = require('child_process');
const fs = require('fs');
const chalk = require('chalk');

console.log(chalk.blue('🚀 启动前端工程化学习平台...'));

// 检查是否已安装依赖
if (!fs.existsSync('node_modules')) {
    console.log(chalk.yellow('📦 正在安装依赖...'));
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log(chalk.green('✅ 依赖安装完成！'));
    } catch (error) {
        console.error(chalk.red('❌ 依赖安装失败:'), error.message);
        process.exit(1);
    }
}

// 启动服务器
console.log(chalk.blue('🌟 启动学习平台服务器...'));

const server = spawn('node', ['server/index.js'], {
    stdio: 'inherit',
    shell: true
});

server.on('error', (error) => {
    console.error(chalk.red('❌ 启动失败:'), error);
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

process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
});