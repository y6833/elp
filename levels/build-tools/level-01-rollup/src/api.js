// API 客户端模块

export class ApiClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 5000;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
  }
  
  /**
   * 发送 HTTP 请求
   * @param {string} url - 请求地址
   * @param {object} options - 请求选项
   * @returns {Promise} 请求结果
   */
  async request(url, options = {}) {
    const config = {
      method: 'GET',
      headers: { ...this.headers },
      ...options
    };
    
    const fullUrl = this.baseURL + url;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(fullUrl, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
  
  /**
   * GET 请求
   */
  get(url, params = {}) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return this.request(fullUrl);
  }
  
  /**
   * POST 请求
   */
  post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  /**
   * PUT 请求
   */
  put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  /**
   * DELETE 请求
   */
  delete(url) {
    return this.request(url, {
      method: 'DELETE'
    });
  }
}