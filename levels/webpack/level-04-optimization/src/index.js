import { formatDate, calculateSum } from './utils';

console.log('代码分割示例启动！');

// 同步导入的工具函数
console.log('当前时间:', formatDate(new Date()));
console.log('计算结果:', calculateSum([1, 2, 3, 4, 5]));

// 创建主应用
function createApp() {
  const app = document.createElement('div');
  app.innerHTML = `
    <h1>📦 代码分割与优化</h1>
    <p>这个示例展示了如何使用 webpack 进行代码分割</p>
    <button id="load-component">点击加载组件 (懒加载)</button>
    <div id="component-container"></div>
  `;
  
  // 懒加载组件
  const button = app.querySelector('#load-component');
  const container = app.querySelector('#component-container');
  
  button.addEventListener('click', async () => {
    button.textContent = '加载中...';
    button.disabled = true;
    
    try {
      // TODO: 使用动态导入实现懒加载
      // const { default: LazyComponent } = await import('./components/LazyComponent');
      // const component = new LazyComponent();
      // container.appendChild(component.render());
      
      // 临时模拟
      setTimeout(() => {
        container.innerHTML = '<p style="color: green;">✅ 组件加载成功！</p>';
        button.style.display = 'none';
      }, 1000);
      
    } catch (error) {
      console.error('组件加载失败:', error);
      container.innerHTML = '<p style="color: red;">❌ 组件加载失败</p>';
      button.textContent = '重试';
      button.disabled = false;
    }
  });
  
  return app;
}

document.body.appendChild(createApp());