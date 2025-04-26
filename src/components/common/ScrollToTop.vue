<template>
  <Button v-show="showButton" icon="pi pi-arrow-up" @click="scrollToTop"
    class="btn-top hover:bg-blue-700 transition-all z-50" aria-label="Scroll to top" severity="primary" rounded />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const showButton = ref<boolean>(false)

const handleScroll = (): void => {
  showButton.value = window.scrollY > 300
}

const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.btn-top {
  position: fixed;
  bottom: 0;
  right: 15%;
  transform: translateY(-50%);
}
</style>
