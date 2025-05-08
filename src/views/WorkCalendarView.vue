<template>
  <div class="calendar-wrapper">
    <div class="p-3">
      <h2 class="text-center mb-4 text-xl">LỊCH LÀM VIỆC</h2>

      <!-- Tab Selection -->
      <div class="d-flex justify-content-center mb-4">
        <div class="btn-group" role="group" aria-label="Calendar Tabs">
          <button class="btn" :class="activeTab === 'personal' ? 'btn-primary' : 'btn-outline-primary'"
            @click="activeTab = 'personal'">
            Lịch Cá Nhân
          </button>
          <button class="btn" :class="activeTab === 'team' ? 'btn-primary' : 'btn-outline-primary'"
            @click="activeTab = 'team'">
            Lịch Nhóm
          </button>
        </div>
      </div>

      <!-- Calendar Components -->
      <div class="calendar-container">
        <PersonalCalendar v-if="activeTab === 'personal'" />
        <TeamCalendar v-if="activeTab === 'team'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PersonalCalendar from '@/components/calendar/PersonalCalendar.vue'
import TeamCalendar from '@/components/calendar/TeamCalendar.vue'

// Active tab state
const activeTab = ref<'personal' | 'team'>('personal')
</script>

<style scoped>
.calendar-container {
  width: 100%;
}

.calendar-wrapper {
  margin: 0;
}

.p-3 {
  margin-left: 0;
  margin-right: 0;
}
</style>