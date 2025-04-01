import axios from 'axios'
import router from '@/router'
import { useUserStore } from '@/pinia/userStore'
import { eventBus } from '@/event/EventBus'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

let isLogoutProcessing = false

export function setupAxiosInterceptors() {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const isUnauthorized = error.response?.status === 401 || error.response?.status === 403

      if (isUnauthorized && !isLogoutProcessing) {
        try {
          isLogoutProcessing = true
          const userStore = useUserStore()

          localStorage.removeItem('accessToken')
          userStore.logout()

          // Gửi sự kiện để hiển thị toast
          eventBus.emit('showMessage', {
            severity: 'error',
            summary: 'Phiên đăng nhập hết hạn',
            detail: 'Vui lòng đăng nhập lại.',
          })

          await router.push('/login')
        } catch (logoutError) {
          console.error('Lỗi trong quá trình logout:', logoutError)
        } finally {
          isLogoutProcessing = false
        }
      }

      return Promise.reject(error)
    },
  )
}

export default axiosInstance
