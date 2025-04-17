<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-center">Thông báo</h2>

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
        :value="filteredUserReminders"
        paginator
        :rows="10"
        :first="first"
        @page="onPage"
        :rowsPerPageOptions="[10, 15, 20]"
        class="p-datatable-sm"
      >
        <Column header="STT" sortable>
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>
        <Column field="reminder.title" header="Tiêu Đề" sortable></Column>
        <Column field="reminder.description" header="Mô Tả" sortable>
          <template #body="{ data }">
            <div v-html="formatTextWithLinks(data.reminder.description)"></div>
          </template>
        </Column>
        <Column field="reminder.reminderType" header="Loại Nhắc Nhở" sortable>
          <template #body="{ data }">
            <Tag style="width: 50%" :severity="getReminderTypeSeverity(data.reminder.reminderType)">
              {{
                data.reminder.reminderType === 'CONTRIBUTION'
                  ? 'Đóng quỹ'
                  : data.reminder.reminderType === 'PENALTY'
                    ? 'Phạt'
                    : data.reminder.reminderType === 'OTHER'
                      ? 'Khác'
                      : 'Khảo sát'
              }}
            </Tag>
          </template>
        </Column>
        <Column field="status" header="Trạng Thái">
          <template #body="{ data }">
            <Tag :severity="data.status === 'READ' ? 'secondary' : 'info'">
              {{ data.status === 'READ' ? 'Đã đọc' : 'Chưa đọc' }}
            </Tag>
          </template>
        </Column>

        <Column field="reminder.scheduledTime" header="Thời Gian" sortable>
          <template #body="{ data }">
            {{
              data.reminder.scheduledTime
                ? formatDateTime(data.reminder.scheduledTime)
                : 'Ngay lập tức'
            }}
          </template>
        </Column>
        <Column v-if="hasPendingSurvey" header="Thao tác" sortable>
          <template #body="{ data }">
            <Button
              v-if="!data.completed && data.reminder.reminderType === 'SURVEY'"
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
const userStore = useUserStore()
const user = computed(() => userStore.user)
const searchQuery = ref('')

// Interface for UserReminder from API
interface UserReminder {
  reminder: Reminder
  userId: number
  status: 'READ' | 'SENT'
  completed: boolean
  finishedAt: string | null
}

//pagenation
const first = ref<number>(0)

const onPage = (event: { first: number }) => {
  first.value = event.first
}

const userReminders = ref<UserReminder[]>([])
const showConfirmDialog = ref(false)

// Form data for survey completion
const form = ref({
  reminderId: 0,
  userId: 0,
})

// Fetch user reminders from the API
const fetchUserReminders = async () => {
  try {
    const response = await axiosInstance.get(`reminders/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    userReminders.value = response.data
    console.log('User reminders:', userReminders.value)
  } catch (error) {
    console.error('Error fetching user reminders:', error)
  }
}

// Filter reminders based on search query
const filteredUserReminders = computed(() => {
  if (!searchQuery.value) return userReminders.value
  return userReminders.value.filter((userReminder) =>
    userReminder.reminder.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// Format date for display
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()} ${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Get severity class based on reminder type
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

// Check if there are any pending surveys
const hasPendingSurvey = computed(() =>
  userReminders.value.some((ur) => ur.reminder.reminderType === 'SURVEY' && !ur.completed),
)

// Open confirmation dialog for survey completion
const openDialog = (userReminder: UserReminder) => {
  showConfirmDialog.value = true
  form.value.reminderId = userReminder.reminder.id
  form.value.userId = user.value.id
}

// Handle survey completion confirmation
const handleConfirm = async () => {
  try {
    await axiosInstance.post(`/reminders/${form.value.reminderId}/survey/completed`, form.value)

    // Update local state to reflect the completion
    userReminders.value = userReminders.value.map((ur) => {
      if (ur.reminder.id === form.value.reminderId) {
        return { ...ur, completed: true }
      }
      return ur
    })

    eventBus.emit('showMessage', {
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã hoàn thành khảo sát',
    })

    showConfirmDialog.value = false
    eventBus.emit('reminder:updated')
  } catch (error) {
    console.error('Error confirming survey completion:', error)
    eventBus.emit('showMessage', {
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể hoàn thành khảo sát. Vui lòng thử lại.',
    })
  }
}

// Lifecycle hooks
onMounted(() => {
  if (!token) {
    router.push('/login')
  } else {
    fetchUserReminders()
    eventBus.on('reminder:updated', fetchUserReminders)
  }
})

onBeforeUnmount(() => {
  eventBus.off('reminder:updated', fetchUserReminders)
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
