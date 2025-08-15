// 工具库主入口文件

// 导入各个模块
import { formatDate, formatCurrency } from './utils/formatters.js';
import { debounce, throttle } from './utils/performance.js';
import { EventEmitter } from './utils/events.js';
import { Storage } from './utils/storage.js';
import { HttpClient } from './utils/http.js';

// 导入样式（可选）
import './styles/index.css';

// 主库类
class MyLibrary {
  constructor(options = {}) {
    this.version = '1.0.0';
    this.options = {
      debug: false,
      prefix: 'mylib',
      ...options
    };
    
    // 初始化各个模块
    this.events = new EventEmitter();
    this.storage = new Storage(this.options.prefix);
    this.http = new HttpClient(this.options);
    
    if (this.options.debug) {
      console.log(`MyLibrary v${this.version} initialized`);
    }
  }
  
  // 格式化工具
  format = {
    date: formatDate,
    currency: formatCurrency
  };
  
  // 性能工具
  performance = {
    debounce,
    throttle
  };
  
  // 获取版本信息
  getVersion() {
    return this.version;
  }
  
  // 设置配置
  setConfig(config) {
    this.options = { ...this.options, ...config };
    return this;
  }
  
  // 销毁实例
  destroy() {
    this.events.removeAllListeners();
    this.storage.clear();
    
    if (this.options.debug) {
      console.log('MyLibrary instance destroyed');
    }
  }
}

// 静态方法
MyLibrary.create = function(options) {
  return new MyLibrary(options);
};

// 版本信息
MyLibrary.version = '1.0.0';

// 导出主类和工具函数
export default MyLibrary;

// 命名导出
export {
  // 格式化工具
  formatDate,
  formatCurrency,
  
  // 性能工具
  debounce,
  throttle,
  
  // 核心类
  EventEmitter,
  Storage,
  HttpClient
};

// UMD 兼容
if (typeof window !== 'undefined') {
  window.MyLibrary = MyLibrary;
}