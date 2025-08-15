import React from 'react';
import ReactDOM from 'react-dom/client';

// TODO: 动态导入远程组件
// 使用 import() 语法异步加载远程模块
// 例如: const RemoteButton = React.lazy(() => import('remote/Button'));

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>主应用 (Host)</h1>
      <p>这是主应用，它将加载来自远程应用的组件。</p>
      
      {/* TODO: 使用远程组件 */}
      {/* 
      <React.Suspense fallback={<div>Loading...</div>}>
        <RemoteButton />
      </React.Suspense>
      */}
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>本地组件</h3>
        <button onClick={() => alert('来自主应用的按钮')}>
          主应用按钮
        </button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);