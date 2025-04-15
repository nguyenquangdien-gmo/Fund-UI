<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-center">Danh Sách Nhắc Nhở</h2>

      <!-- Search Bar -->
      <div class="mb-3 flex justify-content-between align-items-center">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm theo tiêu đề nhắc nhở..."
          style="width: 20%"
          class="w-full p-inputtext-sm"
        />
      </div>

      <!-- Reminder DataTable -->
      <DataTable
        :value="filteredReminders"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 15, 20]"
        class="p-datatable-sm"
      >
        <Column header="STT" sortable>
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>
        <Column field="title" header="Tiêu Đề" sortable></Column>
        <Column field="description" header="Mô Tả" sortable>
          <template #body="{ data }">
            <div v-html="formatTextWithLinks(data.description)"></div>
          </template>
        </Column>
        <Column field="type" header="Loại Nhắc Nhở" sortable>
          <template #body="{ data }">
            <Tag style="width: 50%" :severity="getReminderTypeSeverity(data.reminderType)">
              {{
                data.reminderType === 'CONTRIBUTION'
                  ? 'Đóng quỹ'
                  : data.reminderType === 'PENALTY'
                    ? 'Phạt'
                    : data.reminderType === 'OTHER'
                      ? 'Khác'
                      : 'Khảo sát'
              }}
            </Tag>
          </template>
        </Column>
        <Column field="status" header="Trạng Thái">
          <template #body="{ data }">
            <Tag :severity="checkStatusReminder(data) === 'Đã đọc' ? 'secondary' : 'info'">
              {{ checkStatusReminder(data) }}
            </Tag>
          </template>
        </Column>

        <Column field="scheduledTime" header="Thời Gian" sortable>
          <template #body="{ data }">
            {{ data.scheduledTime ? formatDateTime(data.scheduledTime) : 'Ngay lập tức' }}
          </template>
        </Column>
        <Column v-if="hasPendingSurvey" header="Thao tác" sortable>
          <template #body="{ data }">
            <Button
              v-if="!surveyCompletionStatus[data.id]"
              label="Hoàn thành"
              icon="pi pi-check"
              class="p-button-sm"
              @click="openDialog(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
    <Dialog
      v-model:visible="showConfirmDialog"
      modal
      header="Xác nhận đã hoàn thành khảo sát"
      :style="{ width: '25rem' }"
    >
      <div>Bạn chắc chắn đã hoàn thành khảo sát?</div>
      <div class="d-flex justify-content-end gap-2 mt-3">
        <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
        <Button label="Xác nhận" severity="success" @click="handleConfirm" />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance from '@/router/Interceptor'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import formatTextWithLinks from '@/utils/FormateTextWithUrl'
import type Reminder from '@/types/Reminder'
import { useUserStore } from '@/pinia/userStore'
import { eventBus } from '@/event/EventBus'

const router = useRouter()
const token = localStorage.getItem('accessToken')
const reminders = ref<Reminder[]>([])
const searchQuery = ref('')

const userStore = useUserStore()
const user = computed(() => userStore.user)

const fetchReminders = async () => {
  try {
    const response = await axiosInstance.get<Reminder[]>(`users/${user.value.id}/reminders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    reminders.value = response.data
    await loadSurveyCompletionStatus()
  } catch (error) {
    console.error('Error fetching reminders:', error)
  }
}

const filteredReminders = computed(() => {
  if (!searchQuery.value) return reminders.value
  return reminders.value.filter((reminder) =>
    reminder.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const getReminderTypeSeverity = (type: string): string => {
  switch (type) {
    case 'CONTRIBUTION':
      return 'info'
    case 'PENALTY':
      return 'danger'
    case 'OTHER':
      return 'success'
    case 'SURVEY':
      return 'warn'
    default:
      return 'info'
  }
}

//check status reminder
const checkStatusReminder = (reminder: Reminder) => {
  const readReminders = JSON.parse(localStorage.getItem('readReminders') || '[]')
  return readReminders.includes(reminder.id) ? 'Đã đọc' : 'Chưa đọc'
}

//check completed survey
const surveyCompletionStatus = ref<Record<number, boolean>>({})

const loadSurveyCompletionStatus = async () => {
  const statusMap: Record<number, boolean> = {}

  for (const r of reminders.value) {
    if (r.reminderType === 'SURVEY') {
      try {
        const response = await axiosInstance.get(`/reminders/${r.id}/user/completed`)
        statusMap[r.id] = response.data
      } catch (error) {
        console.error(`Error checking survey for reminder ${r.id}:`, error)
        statusMap[r.id] = false
      }
    }
  }

  surveyCompletionStatus.value = statusMap
}

//handle confirm action
const form = ref({
  reminderId: 0,
  userId: 0,
})

const hasPendingSurvey = computed(() =>
  reminders.value.some(
    (r) =>
      r.reminderType === 'SURVEY' &&
      r.status === 'SENT' &&
      surveyCompletionStatus.value[r.id] === false,
  ),
)

const showConfirmDialog = ref(false)

const handleConfirm = async () => {
  // const data =  {
  //   reminderId: form.value.reminderId,
  //   userId: form.value.userId,
  // }
  console.log('form.value', form.value)

  try {
    await axiosInstance.post(`/reminders/${form.value.reminderId}/survey/completed`, form.value)
    eventBus.emit('showMessage', {
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã hoàn thành khảo sát',
    })
    showConfirmDialog.value = false
    await fetchReminders()
    eventBus.emit('reminder:updated')
  } catch (error) {
    console.error('Error confirming reminder:', error)
  }
}
const openDialog = (remider: Reminder) => {
  showConfirmDialog.value = true

  form.value.reminderId = remider.id
  form.value.userId = user.value.id
}

onMounted(() => {
  if (!token) {
    router.push('/login')
  } else {
    fetchReminders()
    eventBus.on('reminder:updated', fetchReminders)
  }
})
onBeforeUnmount(() => {
  eventBus.off('reminder:updated', fetchReminders)
})
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}

.text-center {
  text-align: center;
  font: 1.5em sans-serif;
  margin-bottom: 1rem;
}
</style>
