import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'

import router from '@/router'
import { useUserStore } from '@/pinia/userStore'
import { eventBus } from '@/event/EventBus'

interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  hideLoader?: boolean
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

let isLogoutProcessing: boolean = false
let hasShownExpiredMessage: boolean = false
let pendingRequests: number = 0

export function setupAxiosInterceptors(): void {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const customConfig = config as CustomInternalAxiosRequestConfig

      if (customConfig.hideLoader !== true) {
        pendingRequests++
        eventBus.emit('loader:show')
      }

      const token = localStorage.getItem('accessToken')
      if (token) {
        customConfig.headers.Authorization = `Bearer ${token}`
      }

      return customConfig
    },

    (error: AxiosError): Promise<AxiosError> => {
      // Giảm số lượng request đang chờ và ẩn loader nếu không còn request nào
      const config = error.config as CustomInternalAxiosRequestConfig | undefined
      if (config?.hideLoader !== true) {
        pendingRequests--
        if (pendingRequests <= 0) {
          pendingRequests = 0
          eventBus.emit('loader:hide')
        }
      }
      return Promise.reject(error)
    },
  )

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      // Giảm số lượng request đang chờ và ẩn loader nếu không còn request nào
      const config = response.config as CustomInternalAxiosRequestConfig
      if (config.hideLoader !== true) {
        pendingRequests--
        if (pendingRequests <= 0) {
          pendingRequests = 0
          eventBus.emit('loader:hide')
        }
      }
      return response
    },
    (error: AxiosError): Promise<AxiosError> => {
      // Giảm số lượng request đang chờ và ẩn loader nếu không còn request nào
      const config = error.config as CustomInternalAxiosRequestConfig | undefined
      if (config?.hideLoader !== true) {
        pendingRequests--
        if (pendingRequests <= 0) {
          pendingRequests = 0
          eventBus.emit('loader:hide')
        }
      }

      const isUnauthorized = error.response?.status === 401 || error.response?.status === 403

      if (isUnauthorized && !isLogoutProcessing) {
        try {
          isLogoutProcessing = true
          const userStore = useUserStore()

          localStorage.removeItem('accessToken')
          userStore.logout()

          if (!hasShownExpiredMessage) {
            hasShownExpiredMessage = true
            // Gửi sự kiện để hiển thị toast
            eventBus.emit('showMessage', {
              severity: 'error',
              summary: 'Phiên đăng nhập hết hạn',
              detail: 'Vui lòng đăng nhập lại.',
            })
          }

          router.push('/login')
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

// Thêm hàm để reset trạng thái loader
export function resetLoader(): void {
  pendingRequests = 0
  eventBus.emit('loader:hide')
}

export function resetAuthFlags(): void {
  hasShownExpiredMessage = false
}

// Thiết lập interceptors cho router
export function setupRouterInterceptors(): void {
  router.beforeEach((to, from, next) => {
    if (!to.meta.noLoader) {
      eventBus.emit('loader:show')
    }
    next()
  })

  router.afterEach((to) => {
    setTimeout(() => {
      if (!to.meta.noLoader) {
        eventBus.emit('loader:hide')
      }
    }, 200)
  })
}

export default axiosInstance
