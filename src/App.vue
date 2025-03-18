<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Header from '@/components/common/Header.vue'
</script>

<template>
  <div class="container">
    <Header />
    <RouterView />
  </div>

</template>

<style scoped></style>
