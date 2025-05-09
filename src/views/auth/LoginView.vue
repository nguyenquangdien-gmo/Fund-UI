<template>
  <div class="marquee-container">
    <div class="marquee-content text-danger fw-bold fs-5 p-2">
      Thời gian hoạt động từ 8:30 - 10:30 thứ 2 đến thứ 6.
    </div>
  </div>

  <div class="login-container">
    <Card class="p-4 shadow-lg">
      <template #content>
        <div class="text-center mb-3">
          <h3>Login</h3>
        </div>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <span class="p-input-icon-left input-left w-100">
              <i class="pi pi-user"></i>
              <div class="input-email">
                <InputText v-model="email" type="email" placeholder="E-mail address" class="w-100" />
              </div>
            </span>
            <small class="text-danger">{{ errors.email }}</small>
          </div>
          <div class="mb-3">
            <span class="p-input-icon-left w-100">
              <i class="pi pi-lock"></i>
              <div class="input-password">
                <Password v-model="password" placeholder="Password" toggleMask class="w-100" :feedback="false" />
              </div>
            </span>
            <small class="text-danger">{{ errors.password }}</small>
          </div>
          <div class="mb-3 d-flex align-items-center">
            <Checkbox v-model="rememberMe" binary class="me-2" />
            <label for="remember-me" class="mb-0">Remember me</label>
          </div>
          <Button label="Login" class="w-100 p-button-info text-white" type="submit" />
          <small class="text-danger">{{ errorMessage }}</small>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox';
import { useRouter } from 'vue-router'
import axiosInstance, { resetAuthFlags } from '@/router/Interceptor'
import { useUserStore } from '@/pinia/userStore'
import CryptoJS from "crypto-js";


interface Error {
  email: string
  password: string
}

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
const email = ref('')
const password = ref('')
const rememberMe = ref(false);
const errors = reactive<Error>({
  email: '',
  password: '',
})
const router = useRouter()

const errorMessage = ref('')
const validateForm = (): boolean => {
  let isValid = true
  errors.email = ''
  errors.password = ''
  errorMessage.value = ''
  if (!email.value.trim()) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.email = 'Please enter a valid email'
    isValid = false
  }

  if (!password.value.trim()) {
    errors.password = 'Password is required'
    isValid = false
  } else if (password.value.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }

  return isValid
}

const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

const decrypt = (cipher: string): string => {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

onMounted(() => {
  const encryptedEmail = localStorage.getItem("savedEmail");
  const encryptedPassword = localStorage.getItem("savedPassword");

  if (encryptedEmail && encryptedPassword) {
    email.value = decrypt(encryptedEmail);
    password.value = decrypt(encryptedPassword);
    rememberMe.value = true;
  }
});

const userStore = useUserStore()
const handleLogin = async () => {
  if (validateForm()) {
    try {
      const response = await axiosInstance.post(`/auth/login`, {
        email: email.value,
        password: password.value,
      })
      if (response.data) {
        localStorage.setItem('accessToken', response.data.accessToken)
        sessionStorage.setItem('user', JSON.stringify(response.data.user))
        // console.log('login successful');
        const user = response.data.user
        // console.log('user', user);
        userStore.setUser(user)
        resetAuthFlags()
        if (rememberMe.value) {
          localStorage.setItem("savedEmail", encrypt(email.value));
          localStorage.setItem("savedPassword", encrypt(password.value));
        } else {
          localStorage.removeItem("savedEmail");
          localStorage.removeItem("savedPassword");
        }
        router.push('/')
      } else {
        errorMessage.value = 'Email or password is incorrect'
      }
    } catch (error) {
      errorMessage.value = 'An error occurred. Please try again later.'
    }
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
}

.input-email {
  width: 100%;
}

:deep(.p-password input) {
  padding-left: 40px !important;
  width: 100%;
}

.p-input-icon-left {
  position: relative;
  display: block;
}

.p-input-icon-left i {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0.75rem;
  color: #6c757d;
  z-index: 1;
}

.p-input-icon-left input {
  padding-left: 2.5rem !important;
  width: 100%;
}

.p-input-icon-left:hover i {
  color: #495057;
}

.text-red-500 {
  color: #ef4444;
  /* Tailwind's red-500 color */
}

.marquee-container {
  position: relative;
  overflow: hidden;
  height: 40px;
}

.marquee-content {
  position: absolute;
  white-space: nowrap;
  will-change: transform;
  animation: marquee 12s linear infinite;
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }

  100% {
    transform: translateX(-100%);
  }
}
</style>
