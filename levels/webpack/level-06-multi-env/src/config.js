// 应用配置文件
// 根据环境变量动态配置应用

class AppConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    this.debug = process.env.DEBUG === 'true';
    
    this.init();
  }
  
  init() {
    console.log(`应用运行在 ${this.env} 环境`);
    
    if (this.debug) {
      console.log('调试模式已启用');
      console.log('API 地址:', this.apiUrl);
    }
  }
  
  // API 请求配置
  getApiConfig() {
    return {
      baseURL: this.apiUrl,
      timeout: this.env === 'production' ? 10000 : 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  
  // 日志配置
  getLogConfig() {
    return {
      level: this.env === 'production' ? 'error' : 'debug',
      console: this.debug,
      remote: this.env === 'production'
    };
  }
  
  // 功能开关配置
  getFeatureFlags() {
    return {
      enableAnalytics: this.env === 'production',
      enableHotReload: this.env === 'development',
      enableServiceWorker: this.env === 'production',
      enableErrorReporting: this.env === 'production'
    };
  }
  
  // 获取环境特定的配置
  getEnvironmentConfig() {
    const configs = {
      development: {
        mockData: true,
        showDebugInfo: true,
        enableDevTools: true
      },
      production: {
        mockData: false,
        showDebugInfo: false,
        enableDevTools: false,
        enableCompression: true,
        enableCaching: true
      },
      test: {
        mockData: true,
        showDebugInfo: false,
        enableDevTools: false
      }
    };
    
    return configs[this.env] || configs.development;
  }
}

// 导出单例实例
export default new AppConfig();