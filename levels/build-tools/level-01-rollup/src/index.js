// 主入口文件
import { formatDate, debounce } from './utils.js';
import { ApiClient } from './api.js';

// 导出主要功能
export { formatDate, debounce } from './utils.js';
export { ApiClient } from './api.js';

// 默认导出
export default class MyLibrary {
  constructor(options = {}) {
    this.options = {
      debug: false,
      timeout: 5000,
      ...options
    };
    
    this.apiClient = new ApiClient(this.options);
  }
  
  // 格式化日期的便捷方法
  formatDate(date, format = 'YYYY-MM-DD') {
    return formatDate(date, format);
  }
  
  // 防抖处理
  debounce(func, delay = 300) {
    return debounce(func, delay);
  }
  
  // API 调用
  async request(url, options = {}) {
    return this.apiClient.request(url, options);
  }
  
  // 获取版本信息
  getVersion() {
    return '1.0.0';
  }
  
  // 调试信息
  debug(message) {
    if (this.options.debug) {
      console.log(`[MyLibrary] ${message}`);
    }
  }
}