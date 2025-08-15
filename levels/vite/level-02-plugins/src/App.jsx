import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>⚡ Vite + React</h1>
        <p>体验极速的开发环境</p>
      </header>
      
      <main className="app-main">
        <div className="counter">
          <button onClick={() => setCount(count - 1)}>-</button>
          <span className="count">{count}</span>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
        
        <div className="features">
          <h3>🚀 Vite 特性</h3>
          <ul>
            <li>⚡ 极速的冷启动</li>
            <li>🔥 即时的热更新</li>
            <li>📦 优化的构建</li>
            <li>🔌 丰富的插件</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;