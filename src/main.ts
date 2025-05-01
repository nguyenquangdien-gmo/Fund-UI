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
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

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
app.component('InputNumber', InputNumber)
app.component('Button', Button)
app.component('Dialog', Dialog)

setupAxiosInterceptors()

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})
app.mount('#app')
