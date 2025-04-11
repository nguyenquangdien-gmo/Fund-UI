import { defineStore } from 'pinia'

export const useLoaderStore = defineStore('loader', {
  state: () => ({
    isLoading: false,
    pendingRequests: 0,
  }),
  actions: {
    startLoading() {
      this.pendingRequests++
      this.isLoading = true
    },
    finishLoading() {
      this.pendingRequests--
      if (this.pendingRequests <= 0) {
        this.pendingRequests = 0
        this.isLoading = false
      }
    },
    resetLoader() {
      this.pendingRequests = 0
      this.isLoading = false
    },
  },
})
