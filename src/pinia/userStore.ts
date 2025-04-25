import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem('user') || '{}'),
  }),
  actions: {
    setUser(newUser: any) {
      this.user = newUser
      sessionStorage.setItem('user', JSON.stringify(newUser))
    },
    logout() {
      this.user = {}
      sessionStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      Cookies.remove('user')
      Cookies.remove('AUTHTOKEN')
    },
  },
})
