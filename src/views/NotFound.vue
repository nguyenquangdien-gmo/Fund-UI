<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 not-found"
  >
    <div class="text-center p-6 shadow-lg rounded-2xl bg-white">
      <i class="pi pi-exclamation-triangle text-6xl text-yellow-500"></i>
      <h1 class="text-5xl font-bold text-gray-700 mt-4">404</h1>
      <h2 class="text-2xl font-semibold mt-2">Trang không tồn tại</h2>
      <p class="text-gray-500 mt-2">Xin lỗi, trang bạn đang tìm kiếm không tồn tại.</p>

      <Button
        label="Quay lại trang chủ"
        icon="pi pi-home"
        class="p-button-raised p-button-rounded p-button-primary mt-6"
        @click="goHome"
      />
      <br />
      <br />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>
<style scoped>
.not-found {
  border-radius: 20px;
}
</style>
