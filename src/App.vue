<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Header from '@/components/common/Header.vue'

import { onMounted } from 'vue'
import { eventBus } from './event/EventBus'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Loader from '@/components/common/Loader.vue'

const toast = useToast()

onMounted(() => {
  eventBus.on('showMessage', ({ severity, summary, detail }) => {
    toast.add({ severity, summary, detail, life: 3000 })
  })
})
</script>

<template>
  <div class="container">
    <Header />
    <Loader />
    <RouterView />
    <Toast />
    <!--  -->
  </div>
</template>

<style scoped>
.container {
  background-color: #f1f5f9;
  border-radius: 15px;
  padding: 0;
}
</style>
