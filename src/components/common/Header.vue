<template>
  <div v-if="isLoggedIn" class="card">
    <Menubar :model="filteredItems">
      <template #end>
        <div class="flex items-center gap-2 info-box">
          <Message severity="success">
            <template #icon>
              <span class="ml-2">
                {{ user.fullName || 'Guest' }}
              </span>

              <!-- Nút Thông báo -->
              <Button
                icon="pi pi-bell"
                style="font-size: 1.2rem"
                class="p-button-rounded p-button-text p-button-plain"
                @mouseenter="toggleReminder($event)"
                @click="handleClick"
              />

              <Badge
                v-if="unreadRemindersCount > 0"
                :value="unreadRemindersCount"
                class="notification-badge"
                style="background-color: #f77a86"
              />
            </template>
          </Message>

          <!-- Popup Reminders -->
          <OverlayPanel ref="reminderPanel">
            <div v-if="userReminders.length > 0" class="remainder-panel">
              <ul class="reminder-list">
                <li
                  v-for="userReminder in userReminders"
                  :key="userReminder.reminder.id"
                  @click="markAsReadAndGo(userReminder)"
                  class="reminder-item"
                >
                  <div :style="getReminderStyle(userReminder.status)">
                    <strong>{{ userReminder.reminder.title }}</strong>
                    <p>{{ userReminder.reminder.description }}</p>
                  </div>
                </li>
              </ul>
              <!-- Nút Đã xem tất cả -->
            </div>
            <Button
              v-if="unreadRemindersCount > 0"
              label="Đã xem tất cả"
              class="p-button-sm p-button-text mark-all-read-btn"
              @click="markAllAsRead"
            />
            <div v-if="userReminders.length === 0">Bạn không có thông báo nào!</div>
          </OverlayPanel>

          <!-- Nút Logout -->
          <Button
            label="Logout"
            icon="pi pi-sign-out"
            class="p-button-danger"
            @click="handleLogout"
          />
        </div>
      </template>
    </Menubar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/pinia/userStore'
import Menubar from 'primevue/menubar'
import Message from 'primevue/message'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import OverlayPanel from 'primevue/overlaypanel'
import axiosInstance from '@/router/Interceptor'
import type Reminder from '@/types/Reminder'
import ReminderType from '@/types/ReminderType'
import { eventBus } from '@/event/EventBus'

const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => !!user.value.role)
const isAdmin = ref(false)

// New interface for the user reminder response
interface UserReminder {
  reminder: Reminder
  userId: number
  status: 'READ' | 'SENT'
  completed: boolean
  finishedAt: string | null
}

const userReminders = ref<UserReminder[]>([])
const reminderPanel = ref<InstanceType<typeof OverlayPanel> | null>(null)

const fetchReminders = async () => {
  try {
    const response = await axiosInstance.get(`reminders/user`)
    userReminders.value = response.data
    console.log('User Reminders:', userReminders.value)
  } catch (error) {
    console.error('Error fetching reminders:', error)
  }
}

const checkAdmin = async () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return false
  try {
    const response = await axiosInstance.get('/tokens/is-admin', {
      params: { token },
    })
    return response.data // Trả về true nếu là admin
  } catch (error) {
    // console.error('Lỗi khi kiểm tra quyền admin:', error)
    return false
  }
}

const unreadRemindersCount = computed(() => {
  return userReminders.value.filter((userReminder) => userReminder.status === 'SENT').length
})

const markAsReadAndGo = async (userReminder: UserReminder) => {
  try {
    if (userReminder.status === 'SENT') {
      // Call API to mark reminder as read
      await axiosInstance.put(`reminders/user/${userReminder.reminder.id}/read`)

      // Update the local state
      userReminders.value = userReminders.value.map((ur) => {
        if (ur.reminder.id === userReminder.reminder.id) {
          return { ...ur, status: 'READ' }
        }
        return ur
      })
    }

    // Navigate based on reminder type
    if (userReminder.reminder.reminderType === ReminderType.CONTRIBUTION) {
      router.push('/contributions')
    } else if (userReminder.reminder.reminderType === ReminderType.SURVEY && isAdmin.value) {
      router.push(`/reminder/${userReminder.reminder.id}/survey`)
    } else if (userReminder.reminder.reminderType === ReminderType.OTHER && isAdmin.value) {
      router.push('/reminders')
    } else {
      router.push('/user/reminders')
    }

    eventBus.emit('reminder:updated')
    if (reminderPanel.value) {
      reminderPanel.value.hide()
    }
  } catch (error) {
    console.error('Error marking reminder as read:', error)
  }
}

const markAllAsRead = async () => {
  if (userReminders.value.length === 0) return

  try {
    // Call API to mark all reminders as read
    await axiosInstance.put(`reminders/user/read/all`)

    // Update local state
    userReminders.value = userReminders.value.map((ur) => ({ ...ur, status: 'READ' }))
    eventBus.emit('reminder:updated')

    if (reminderPanel.value) {
      reminderPanel.value.hide()
    }
  } catch (error) {
    console.error('Error marking all reminders as read:', error)
  }
}

const getReminderStyle = (status: string) => {
  const isRead = status === 'READ'

  return {
    fontWeight: isRead ? 'normal' : 'bold',
    opacity: isRead ? 0.5 : 1,
  }
}

const toggleReminder = (event: Event) => {
  if (reminderPanel.value) {
    reminderPanel.value.toggle(event)
  }
}

const handleClick = (event: Event) => {
  router.push('/user/reminders')
}

onMounted(async () => {
  eventBus.on('notifications:updated', fetchReminders)
  if (isLoggedIn.value) {
    fetchReminders()
    isAdmin.value = await checkAdmin()
  } else {
    router.push('/login')
  }
})

onBeforeUnmount(() => {
  eventBus.off('notifications:updated', fetchReminders)
})

watch(user, (newUser) => {
  if (newUser?.id) {
    fetchReminders()
  } else {
    userReminders.value = []
  }
})

const baseItems = [
  { label: 'Profile', icon: 'pi pi-user', command: () => router.push('/profile') },
  { label: 'Thống kê', icon: 'pi pi-chart-line', command: () => router.push('/stats') },
  {
    label: 'Danh sách',
    icon: 'pi pi-list',
    items: [
      { label: 'Thành viên', icon: 'pi pi-user', command: () => router.push('/users') },
      { label: 'Thu/Chi', icon: 'pi pi-shopping-bag', command: () => router.push('/invoices') },
      { label: 'Quỹ chưa đóng', icon: 'pi pi-bolt', command: () => router.push('/contributions') },
      { label: 'Đi muộn', icon: 'pi pi-calendar-times', command: () => router.push('/user/late') },
      { label: 'Nợ phạt', icon: 'pi pi-times-circle', command: () => router.push('/bills') },
      { label: 'Hóa đơn', icon: 'pi pi-receipt', command: () => router.push('/user/invoices') },
    ],
  },
  { label: 'Lịch sử', icon: 'pi pi-history', command: () => router.push('/histories') },
  { label: 'Sự kiện', icon: 'pi pi-sparkles', command: () => router.push('/events') },
]

const adminItems = [
  // { label: "Logs", icon: "pi pi-clock", command: () => router.push("/logs") },
  {
    label: 'Quản lý',
    icon: 'pi pi-list',
    items: [
      { label: 'Nhóm', icon: 'pi pi-users', command: () => router.push('/teams') },
      { label: 'Role', icon: 'pi pi-address-book', command: () => router.push('/roles') },
      { label: 'Thành viên', icon: 'pi pi-user', command: () => router.push('/users') },
      { label: 'Phê duyệt', icon: 'pi pi-file-check', command: () => router.push('/approvals') },
      { label: 'Chưa đóng quỹ', icon: 'pi pi-bolt', command: () => router.push('/users/not-paid') },
      {
        label: 'Đóng muộn',
        icon: 'pi pi-server',
        command: () => router.push('/users/late-contributions'),
      },
      {
        label: 'Đi muộn',
        icon: 'pi pi-calendar-times',
        command: () => router.push('/late-checkin'),
      },
      {
        label: 'Giao dịch',
        icon: 'pi pi-arrow-right-arrow-left',
        command: () => router.push('/logs'),
      },
      // { label: "Quỹ hàng tháng", icon: "pi pi-pencil", command: () => router.push("/periods") },
      { label: 'Thông báo', icon: 'pi pi-bell', command: () => router.push('/reminders') },
    ],
  },
  {
    label: 'Tạo',
    icon: 'pi pi-list',
    items: [
      { label: 'Quỹ mới', icon: 'pi pi-bolt', command: () => router.push('/funds') },
      { label: 'Quỹ Phạt', icon: 'pi pi-server', command: () => router.push('/penalties') },
      { label: 'Quỹ hàng tháng', icon: 'pi pi-file-edit', command: () => router.push('/periods') },
      // { label: "Tạo nhắc nhở", icon: "pi pi-pencil", command: () => router.push("/reminders") }
    ],
  },
]

const filteredItems = computed(() => {
  if (user.value.role === 'ADMIN') {
    return [...baseItems, ...adminItems]
  }
  return baseItems
})

// Logout
const handleLogout = async () => {
  try {
    await axiosInstance.post('/auth/logout', {})
    userStore.logout()
    router.push('/login')
    userReminders.value = []
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<style scoped>
.info-box {
  display: flex;
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  color: white;
  height: 18px;
  font-size: 9px;
  border-radius: 50%;
  padding: 0.3rem 0.5rem;
  top: 18px;
  right: 130px;
}

.remainder-panel {
  max-height: 300px;
  overflow-y: auto;
}

/* Reminder Popup */
.reminder-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.reminder-item {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  transition: background 0.3s;
}

.reminder-item:hover {
  background: #f5f5f5;
}

.no-reminder {
  text-align: center;
  padding: 10px;
  color: #888;
}
</style>
