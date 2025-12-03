import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: '/api', // 使用代理，会被vite转发到后端
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config: any) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const res = response.data
    
    // 如果响应状态码不是200，说明有错误
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      
      // 如果是401未授权，清除token并跳转到登录页
      if (res.code === 401) {
        localStorage.removeItem('token')
        // 可以在这里添加路由跳转到登录页
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return response
  },
  (error: any) => {
    console.error('API请求错误:', error)
    
    // 处理HTTP错误
    if (error.response) {
      const { status, data } = error.response
      
      // 如果后端返回了错误消息，使用后端的消息
      const errorMessage = data?.message || data?.data?.message
      
      switch (status) {
        case 401:
          if (!errorMessage) {
            ElMessage.error('未授权，请重新登录')
          }
          localStorage.removeItem('token')
          break
        case 403:
          ElMessage.error(errorMessage || '拒绝访问')
          break
        case 404:
          ElMessage.error(errorMessage || '请求的资源不存在')
          break
        case 500:
          ElMessage.error(errorMessage || '服务器错误')
          break
        default:
          ElMessage.error(errorMessage || `请求失败 (${status})`)
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('网络错误 - 请求已发送但无响应:', error.request)
      ElMessage.error('网络错误，请检查网络连接或后端服务是否运行')
    } else {
      // 请求配置错误
      console.error('请求配置错误:', error.message)
      ElMessage.error(error.message || '请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.get<ApiResponse<T>>(url, config).then((res: any) => res.data)
  },
  
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.post<ApiResponse<T>>(url, data, config).then((res: any) => res.data)
  },
  
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.put<ApiResponse<T>>(url, data, config).then((res: any) => res.data)
  },
  
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.patch<ApiResponse<T>>(url, data, config).then((res: any) => res.data)
  },
  
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.delete<ApiResponse<T>>(url, config).then((res: any) => res.data)
  }
}

export default api

