import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState(null)
  
  // 检测是否在客户端
  useEffect(() => {
    setIsClient(true)
    
    // 模拟数据获取
    const fetchData = async () => {
      try {
        // 模拟 API 调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        setData({
          message: '这是从服务端获取的数据',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      } catch (error) {
        console.error('数据获取失败:', error)
      }
    }
    
    fetchData()
  }, [])
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Vite SSR 示例</h1>
        <p>服务端渲染 + 客户端水合</p>
      </header>
      
      <main className="app-main">
        <section className="render-info">
          <h2>渲染信息</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>渲染环境:</label>
              <span className={isClient ? 'client' : 'server'}>
                {isClient ? '客户端' : '服务端'}
              </span>
            </div>
            <div className="info-item">
              <label>水合状态:</label>
              <span>{isClient ? '已水合' : '未水合'}</span>
            </div>
            <div className="info-item">
              <label>当前时间:</label>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </section>
        
        <section className="counter-section">
          <h2>交互式计数器</h2>
          <div className="counter">
            <button 
              className="counter-btn"
              onClick={() => setCount(count - 1)}
              disabled={!isClient}
            >
              -
            </button>
            <span className="counter-value">{count}</span>
            <button 
              className="counter-btn"
              onClick={() => setCount(count + 1)}
              disabled={!isClient}
            >
              +
            </button>
          </div>
          <p className="counter-text">
            {isClient ? '点击按钮测试客户端交互' : '等待客户端水合...'}
          </p>
        </section>
        
        <section className="data-section">
          <h2>异步数据</h2>
          {data ? (
            <div className="data-content">
              <p><strong>消息:</strong> {data.message}</p>
              <p><strong>时间戳:</strong> {data.timestamp}</p>
              <p><strong>用户代理:</strong> {data.userAgent.substring(0, 50)}...</p>
            </div>
          ) : (
            <div className="loading">
              {isClient ? '加载数据中...' : '服务端渲染完成，等待客户端数据'}
            </div>
          )}
        </section>
        
        <section className="features-section">
          <h2>SSR 特性</h2>
          <ul className="features-list">
            <li className={isClient ? 'active' : ''}>
              ✅ 服务端预渲染
            </li>
            <li className={isClient ? 'active' : ''}>
              ✅ 客户端水合
            </li>
            <li className={isClient ? 'active' : ''}>
              ✅ SEO 友好
            </li>
            <li className={isClient ? 'active' : ''}>
              ✅ 首屏加载优化
            </li>
            <li className={isClient ? 'active' : ''}>
              ✅ 渐进式增强
            </li>
          </ul>
        </section>
      </main>
      
      <footer className="app-footer">
        <p>
          由 Vite SSR 驱动 • 
          {isClient ? '客户端已激活' : '服务端渲染'}
        </p>
      </footer>
    </div>
  )
}

export default App