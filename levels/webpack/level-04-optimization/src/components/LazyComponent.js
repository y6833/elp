// 懒加载组件示例

export default class LazyComponent {
  constructor() {
    this.name = 'LazyComponent';
    console.log('LazyComponent 已加载！');
  }
  
  render() {
    const element = document.createElement('div');
    element.className = 'lazy-component';
    element.innerHTML = `
      <div style="
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 20px;
        border-radius: 10px;
        margin: 20px 0;
        text-align: center;
      ">
        <h3>🎉 懒加载组件</h3>
        <p>这个组件是通过动态导入加载的！</p>
        <p>只有在需要时才会下载和执行</p>
        <small>加载时间: ${new Date().toLocaleTimeString()}</small>
      </div>
    `;
    
    return element;
  }
}