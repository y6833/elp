import React from 'react';
import ReactDOM from 'react-dom/client';
import Button from './Button';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>远程应用 (Remote)</h1>
      <p>这是一个独立的远程应用，它暴露组件给其他应用使用。</p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>本地预览:</h3>
        <Button />
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h4>微前端信息:</h4>
        <ul>
          <li>应用名称: remote</li>
          <li>运行端口: 3002</li>
          <li>暴露组件: Button</li>
          <li>入口文件: remoteEntry.js</li>
        </ul>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);