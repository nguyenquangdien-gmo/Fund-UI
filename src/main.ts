import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import ToastService from 'primevue/toastservice'
import Chart from 'chart.js/auto'
import { setupAxiosInterceptors } from './router/Interceptor'

declare global {
  interface Window {
    Chart: typeof Chart
  }
}
window.Chart = Chart
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ToastService)

setupAxiosInterceptors()

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})
app.mount('#app')
