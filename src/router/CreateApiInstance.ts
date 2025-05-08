import axios from 'axios'
import type { AxiosInstance } from 'axios'

// Tạo instance axios với cấu hình cơ bản
const createApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true // Cho phép gửi cookie với request
})

// Thêm interceptor để tự động thêm Bearer token từ localStorage
createApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default createApi
