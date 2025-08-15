import './style.css';
import config from './config.js';

// 应用入口
class App {
  constructor() {
    this.config = config;
    this.init();
  }
  
  init() {
    this.createUI();
    this.bindEvents();
    this.loadEnvironmentInfo();
  }
  
  createUI() {
    const app = document.createElement('div');
    app.className = 'app';
    
    app.innerHTML = `
      <header class="header">
        <h1>多环境配置示例</h1>
        <div class="env-badge ${this.config.env}">${this.config.env.toUpperCase()}</div>
      </header>
      
      <main class="main">
        <section class="config-section">
          <h2>当前配置</h2>
          <div class="config-grid" id="config-info">
            <!-- 配置信息将在这里显示 -->
          </div>
        </section>
        
        <section class="feature-section">
          <h2>功能开关</h2>
          <div class="feature-grid" id="feature-flags">
            <!-- 功能开关将在这里显示 -->
          </div>
        </section>
        
        <section class="api-section">
          <h2>API 测试</h2>
          <button id="test-api" class="btn primary">测试 API 连接</button>
          <div id="api-result" class="api-result"></div>
        </section>
      </main>
    `;
    
    document.body.appendChild(app);
  }
  
  bindEvents() {
    const testApiBtn = document.getElementById('test-api');
    testApiBtn.addEventListener('click', () => this.testApi());
  }
  
  loadEnvironmentInfo() {
    // 显示配置信息
    const configInfo = document.getElementById('config-info');
    const apiConfig = this.config.getApiConfig();
    const envConfig = this.config.getEnvironmentConfig();
    
    configInfo.innerHTML = `
      <div class="config-item">
        <label>环境:</label>
        <span>${this.config.env}</span>
      </div>
      <div class="config-item">
        <label>API 地址:</label>
        <span>${apiConfig.baseURL}</span>
      </div>
      <div class="config-item">
        <label>超时时间:</label>
        <span>${apiConfig.timeout}ms</span>
      </div>
      <div class="config-item">
        <label>调试模式:</label>
        <span>${this.config.debug ? '启用' : '禁用'}</span>
      </div>
      <div class="config-item">
        <label>模拟数据:</label>
        <span>${envConfig.mockData ? '启用' : '禁用'}</span>
      </div>
    `;
    
    // 显示功能开关
    const featureFlags = document.getElementById('feature-flags');
    const features = this.config.getFeatureFlags();
    
    featureFlags.innerHTML = Object.entries(features)
      .map(([key, value]) => `
        <div class="feature-item ${value ? 'enabled' : 'disabled'}">
          <span class="feature-name">${key}</span>
          <span class="feature-status">${value ? '✅' : '❌'}</span>
        </div>
      `).join('');
  }
  
  async testApi() {
    const resultDiv = document.getElementById('api-result');
    const apiConfig = this.config.getApiConfig();
    
    resultDiv.innerHTML = '<div class="loading">测试中...</div>';
    
    try {
      // 模拟 API 请求
      const response = await fetch(apiConfig.baseURL + '/health', {
        method: 'GET',
        headers: apiConfig.headers,
        timeout: apiConfig.timeout
      });
      
      if (response.ok) {
        resultDiv.innerHTML = `
          <div class="success">
            ✅ API 连接成功<br>
            状态码: ${response.status}<br>
            响应时间: ${Date.now() - startTime}ms
          </div>
        `;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="error">
          ❌ API 连接失败<br>
          错误: ${error.message}<br>
          ${this.config.debug ? '检查控制台获取详细信息' : ''}
        </div>
      `;
      
      if (this.config.debug) {
        console.error('API 测试失败:', error);
      }
    }
  }
}

// 启动应用
new App();

// 热模块替换支持
if (module.hot) {
  module.hot.accept('./config.js', () => {
    console.log('配置文件已更新，重新加载...');
    location.reload();
  });
}