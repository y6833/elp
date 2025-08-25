import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加请求时间戳，避免缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 统一处理响应格式
    const { data } = response
    
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success) {
        return {
          ...response,
          data: data.data || data
        }
      } else {
        throw new Error(data.error || data.message || '请求失败')
      }
    }
    
    return response
  },
  async (error) => {
    const { config, response } = error
    
    // 处理网络错误
    if (!response) {
      console.error('网络错误:', error.message)
      throw new Error('网络连接失败，请检查网络连接')
    }
    
    const { status, data } = response
    
    // 处理不同的HTTP状态码
    switch (status) {
      case 401:
        // 未授权，可能需要重新登录
        console.error('认证失败，请重新登录')
        
        // 如果不是登录接口，则清除认证信息并跳转登录
        if (!config.url?.includes('/auth/login')) {
          // 这里可以调用pinia store的logout方法
          // 或者发送事件通知主应用处理
          window.dispatchEvent(new CustomEvent('auth-error', { detail: { status, message: '请重新登录' } }))
        }
        
        throw new Error(data?.message || '认证失败，请重新登录')
      
      case 403:
        throw new Error(data?.message || '权限不足，无法访问该资源')
      
      case 404:
        throw new Error(data?.message || '请求的资源不存在')
      
      case 422:
        throw new Error(data?.message || '请求参数验证失败')
      
      case 429:
        throw new Error('请求过于频繁，请稍后再试')
      
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error(data?.message || '服务器错误，请稍后再试')
      
      default:
        throw new Error(data?.message || `请求失败 (${status})`)
    }
  }
)

// 请求方法封装
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.get(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.post(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.put(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.delete(url, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.patch(url, data, config)
}

// 上传文件方法
export const uploadFile = async (
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<AxiosResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        onProgress(progress)
      }
    }
  })
}

// 下载文件方法
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('下载文件失败:', error)
    throw error
  }
}

// 批量请求方法
export const batchRequest = async <T>(
  requests: (() => Promise<T>)[]
): Promise<T[]> => {
  const results = await Promise.allSettled(requests.map(req => req()))
  
  const fulfilled = results
    .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
    .map(result => result.value)
  
  const rejected = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map(result => result.reason)
  
  if (rejected.length > 0) {
    console.warn('批量请求中有失败的请求:', rejected)
  }
  
  return fulfilled
}

// 重试机制
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (i === maxRetries) {
        throw lastError
      }
      
      // 指数退避
      const retryDelay = delay * Math.pow(2, i)
      console.warn(`请求失败，${retryDelay}ms后重试 (${i + 1}/${maxRetries + 1}):`, lastError.message)
      
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  
  throw lastError!
}

// 设置认证token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// 取消令牌管理
const cancelTokens = new Map<string, AbortController>()

export const createCancelToken = (key: string): AbortController => {
  // 取消之前的请求
  if (cancelTokens.has(key)) {
    cancelTokens.get(key)!.abort()
  }
  
  const controller = new AbortController()
  cancelTokens.set(key, controller)
  
  return controller
}

export const cancelRequest = (key: string) => {
  const controller = cancelTokens.get(key)
  if (controller) {
    controller.abort()
    cancelTokens.delete(key)
  }
}

export { api }
export default api