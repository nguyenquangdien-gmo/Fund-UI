<!-- src/components/Loader.vue -->
<template>
  <transition name="fade">
    <div v-if="isLoading" class="loader-overlay">
      <div class="loader-spinner"></div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { eventBus } from '@/event/EventBus'

const isLoading = ref<boolean>(false)

function showLoader(): void {
  isLoading.value = true
}

function hideLoader(): void {
  isLoading.value = false
}

onMounted(() => {
  eventBus.on('loader:show', showLoader)
  eventBus.on('loader:hide', hideLoader)
})

onUnmounted(() => {
  eventBus.off('loader:show', showLoader)
  eventBus.off('loader:hide', hideLoader)
})
</script>

<style scoped>
.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loader-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
