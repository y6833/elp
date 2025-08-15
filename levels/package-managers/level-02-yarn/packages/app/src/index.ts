import { formatDate, capitalize, Logger } from '@workspace/shared';

const logger = new Logger('APP');

logger.log('应用启动');
logger.log(`今天是: ${formatDate(new Date())}`);
logger.log(`欢迎使用 ${capitalize('yarn')} 工作空间！`);

export default function main() {
  console.log('Yarn 工作空间示例应用运行中...');
}