import axios from 'axios'
import type { AxiosInstance } from 'axios'
import Cookies from 'js-cookie'

// Tạo instance axios với cấu hình cơ bản
const createApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_CREATE_URL,
  headers: {
    Authorization: 'Basic ZHhpbnRlcm5hbF9wbDpnb0R4QDIwMjE=',
  },
})

// Thêm interceptor để tự động thêm X-Access-Token từ cookie
createApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('AUTHTOKEN')
    // console.log('token:', token);
    if (token) {
      config.headers['X-Access-Token'] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Hàm trợ giúp để lưu token vào cookie sau khi đăng nhập
export function saveAuthToken(token: string): void {
  Cookies.set('AUTHTOKEN', token, { path: '/' })
}

// Hàm trợ giúp để xóa token khỏi cookie khi đăng xuất
export function removeAuthToken(): void {
  Cookies.remove('AUTHTOKEN')
}

export default createApi
