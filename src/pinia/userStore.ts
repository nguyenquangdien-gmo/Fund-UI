import { defineStore } from 'pinia'

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
    },
  },
})
