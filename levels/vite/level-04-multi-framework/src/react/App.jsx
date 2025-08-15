import React, { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [framework] = useState('React')

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Vite + {framework}</h1>
        <p>多框架支持示例</p>
      </header>
      
      <main className="app-main">
        <div className="counter-section">
          <h2>计数器示例</h2>
          <div className="counter">
            <button 
              className="counter-btn"
              onClick={() => setCount(count - 1)}
            >
              -
            </button>
            <span className="counter-value">{count}</span>
            <button 
              className="counter-btn"
              onClick={() => setCount(count + 1)}
            >
              +
            </button>
          </div>
          <p className="counter-text">
            点击按钮来测试 {framework} 的响应式更新
          </p>
        </div>
        
        <div className="features-section">
          <h2>框架特性</h2>
          <ul className="features-list">
            <li>✅ JSX 语法支持</li>
            <li>✅ Hooks 状态管理</li>
            <li>✅ 组件化开发</li>
            <li>✅ 热模块替换</li>
            <li>✅ TypeScript 支持</li>
          </ul>
        </div>
        
        <div className="info-section">
          <h2>构建信息</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>框架:</label>
              <span>{framework}</span>
            </div>
            <div className="info-item">
              <label>构建工具:</label>
              <span>Vite</span>
            </div>
            <div className="info-item">
              <label>开发模式:</label>
              <span>{import.meta.env.DEV ? '是' : '否'}</span>
            </div>
            <div className="info-item">
              <label>热更新:</label>
              <span>{import.meta.hot ? '启用' : '禁用'}</span>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>由 Vite 构建 • 支持多框架开发</p>
      </footer>
    </div>
  )
}

export default App