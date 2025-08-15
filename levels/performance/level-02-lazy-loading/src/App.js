import React, { Suspense, useState } from 'react';

// TODO: 实现懒加载
// 1. 使用 React.lazy 懒加载组件
// 2. 配置 Suspense 边界
// 3. 实现路由级别的懒加载
// 4. 添加加载状态

// const LazyComponent = React.lazy(() => import('./components/LazyComponent'));
// const HeavyChart = React.lazy(() => import('./components/HeavyChart'));

function App() {
  const [showLazy, setShowLazy] = useState(false);
  const [showChart, setShowChart] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h1>懒加载示例</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowLazy(!showLazy)}>
          {showLazy ? '隐藏' : '显示'} 懒加载组件
        </button>
        
        <button onClick={() => setShowChart(!showChart)} style={{ marginLeft: '10px' }}>
          {showChart ? '隐藏' : '显示'} 图表组件
        </button>
      </div>

      {/* TODO: 添加 Suspense 包装器 */}
      {showLazy && (
        <div>
          {/* <Suspense fallback={<div>加载中...</div>}>
            <LazyComponent />
          </Suspense> */}
          <p>请配置懒加载组件</p>
        </div>
      )}

      {showChart && (
        <div>
          {/* <Suspense fallback={<div>加载图表中...</div>}>
            <HeavyChart />
          </Suspense> */}
          <p>请配置图表组件</p>
        </div>
      )}
    </div>
  );
}

export default App;