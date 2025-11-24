import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios'

// 从环境变量获取配置
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
const timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 60000 // 默认60秒

const request: AxiosInstance = axios.create({
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 刷新 token 的状态管理
let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 返回data字段中的实际数据
    // 如果有 response.data.data 字段，返回它；否则返回 response.data
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data
    }
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // 如果不是 401 错误，直接拒绝
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // 如果已经重试过，直接跳转登录
    if (originalRequest._retry) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login-before'
      return Promise.reject(error)
    }

    // 获取 refreshToken
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      localStorage.removeItem('token')
      window.location.href = '/login-before'
      return Promise.reject(error)
    }

    // 如果正在刷新 token，将请求加入队列
    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingQueue.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(request(originalRequest))
        })
      })
    }

    // 标记为正在刷新
    originalRequest._retry = true
    isRefreshing = true

    try {
      // 获取当前的 accessToken（虽然已过期，但刷新接口需要在 header 中传递）
      const currentToken = localStorage.getItem('token')

      // 调用刷新接口 - 使用POST方法，refreshToken作为query参数
      const response = await axios.post(`${request.defaults.baseURL}/user/refresh-token`, null, {
        params: { refreshToken },
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      // 处理后端返回的data嵌套结构
      const data = response.data.data || response.data
      const { accessToken, refreshToken: newRefreshToken } = data

      // 更新 token
      localStorage.setItem('token', accessToken)
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken)
      }

      // 更新原始请求的 token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`

      // 处理队列中的请求
      pendingQueue.forEach((callback) => callback(accessToken))
      pendingQueue = []

      // 重试原始请求
      return request(originalRequest)
    } catch (refreshError) {
      // 刷新失败，清除 token 并跳转登录
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login-before'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default request
