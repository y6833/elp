// 故意引入一些问题用于调试练习
import { utils } from './utils';
import './styles.css';

console.log('应用启动...');

// 模拟一个可能出错的函数
function initApp() {
  try {
    const result = utils.calculate(10, 0);
    console.log('计算结果:', result);
    
    // 创建DOM元素
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <h1>Webpack 调试练习</h1>
        <p>计算结果: ${result}</p>
        <button onclick="handleClick()">点击测试</button>
      `;
    }
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
}

// 全局函数用于测试
window.handleClick = function() {
  console.log('按钮被点击');
  // 故意的错误用于调试
  const undefinedVar = someUndefinedVariable;
  console.log(undefinedVar);
};

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);