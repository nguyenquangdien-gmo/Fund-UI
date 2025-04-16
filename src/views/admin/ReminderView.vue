<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-center">Danh Sách Nhắc Nhở</h2>

      <!-- Search and Create Button (Only for Admin) -->
      <div class="mb-3 flex justify-content-between align-items-center">
        <InputText
          v-if="reminders.length > 0"
          v-model="searchQuery"
          placeholder="Tìm kiếm theo tiêu đề nhắc nhở..."
          style="width: 20%"
          class="w-full p-inputtext-sm mr-3"
        />
        <Button
          v-if="isAdmin"
          label="Tạo Nhắc Nhở"
          class="left-10"
          severity="success"
          raised
          size="small"
          @click="openCreateDialog"
          style="margin-left: 10px"
        />
      </div>

      <!-- Reminder DataTable -->
      <DataTable
        v-if="reminders.length > 0"
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
            <Tag style="width: 100%" :severity="getReminderTypeSeverity(data.type)">{{
              data.type === 'CONTRIBUTION'
                ? 'Đóng quỹ'
                : data.type === 'PENALTY'
                  ? 'Phạt'
                  : data.type === 'OTHER'
                    ? 'Khác'
                    : 'Khảo sát'
            }}</Tag>
          </template>
        </Column>
        <Column field="scheduledTime" header="Thời Gian Lên Lịch" sortable>
          <template #body="{ data }">
            {{ data.scheduledTime ? formatDateTime(data.scheduledTime) : 'Ngay lập tức' }}
          </template>
        </Column>
        <!-- <Column field="status" header="Trạng Thái" sortable>
                    <template #body="{ data }">
                        <Tag :severity="data.status === 'SENT' ? 'success' : 'secondary'">
                            {{ data.status === 'READ' ? 'Đã Đọc' : 'Đã Gửi' }}
                        </Tag>
                    </template>
                </Column> -->
        <Column field="isSendChatGroup" header="Gửi Đến Nhóm" sortable>
          <template #body="{ data }">
            <i
              :class="[
                'pi',
                data.isSendChatGroup ? 'pi-check text-green-500' : 'pi-times text-red-500',
              ]"
            ></i>
          </template>
        </Column>
        <Column field="users" header="Người Nhận" style="width: 20%">
          <template #body="{ data }">
            <div v-if="isAllUsersSelected(data.users)">Tất cả</div>
            <div v-else>{{ data.users.length }} người</div>
          </template>
        </Column>
        <!-- Action Column (Only for Admin) -->
        <Column v-if="isAdmin" header="Thao Tác" style="width: 22%">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                label="Sửa"
                icon="pi pi-pencil"
                style="margin-left: 5px"
                severity="info"
                size="small"
                @click="openUpdateDialog(data)"
                v-if="!data.scheduledTime || new Date(data.scheduledTime) > new Date()"
              />
              <Button
                label="Xóa"
                icon="pi pi-trash"
                severity="danger"
                size="small"
                @click="confirmDeleteReminder(data)"
                style="margin-left: 5px"
              />
            </div>
            <!-- Nếu đã quá hạn thì không hiển thị gì hoặc hiển thị message -->
          </template>
        </Column>
      </DataTable>
      <div v-else>Chưa có bất kỳ nhắc nhở nào!😊</div>
    </div>
  </div>

  <!-- Confirm Delete Dialog -->
  <Dialog
    v-model:visible="showConfirmDialog"
    modal
    header="Xác Nhận Xóa"
    :style="{ width: '25rem' }"
  >
    <div class="confirmation-content">Bạn có chắc chắn muốn xóa nhắc nhở này không?</div>
    <div class="dialog-delete-buttons">
      <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
      <Button label="Xóa" severity="danger" @click="deleteReminder" />
    </div>
  </Dialog>

  <!-- Reminder Form Dialog (Only for Admin) -->
  <Dialog
    v-if="isAdmin"
    v-model:visible="showReminderDialog"
    modal
    :header="isUpdate ? 'Cập Nhật Nhắc Nhở' : 'Tạo Nhắc Nhở'"
    class="container-dialog"
  >
    <div class="col-12 mb-3 item-dialog">
      <label for="title" class="font-bold mb-2"> Tiêu Đề <span class="text-danger">*</span> </label>
      <InputText
        id="title"
        v-model="form.title"
        :class="{ 'p-invalid': errors.title }"
        class="w-full"
      />
      <small class="p-error" v-if="errors.title">{{ errors.title }}</small>
    </div>

    <div class="col-12 mb-3 item-dialog">
      <label for="description" class="font-bold mb-2">
        Mô Tả <span class="text-danger">*</span>
      </label>
      <Textarea
        id="description"
        v-model="form.description"
        rows="3"
        :class="{ 'p-invalid': errors.description }"
        class="w-full"
      />
      <small class="p-error" v-if="errors.description">{{ errors.description }}</small>
    </div>

    <div class="col-12 mb-3 item-dialog">
      <label for="type" class="font-bold mb-2">
        Loại Nhắc Nhở <span class="text-danger">*</span>
      </label>
      <Dropdown
        id="type"
        v-model="form.reminderType"
        :options="reminderTypes"
        optionLabel="name"
        optionValue="value"
        placeholder="Chọn loại nhắc nhở"
        :class="{ 'p-invalid': errors.type }"
        class="w-full"
      />
      <small class="p-error" v-if="errors.type">{{ errors.type }}</small>
    </div>

    <div class="col-12 mb-3 item-dialog">
      <label for="scheduledTime" class="font-bold mb-2"> Thời Gian Lên Lịch </label>
      <Calendar
        id="scheduledTime"
        v-model="form.scheduledTime"
        showTime
        hourFormat="24"
        placeholder="Để trống nếu gửi ngay"
        class="w-full"
      />
    </div>

    <div class="col-12 mb-3 item-dialog">
      <label for="users" class="font-bold mb-2"> Người Nhận </label>
      <MultiSelect
        id="users"
        v-model="selectedUsers"
        :options="userOptions"
        optionLabel="fullName"
        optionValue="id"
        placeholder="Chọn người nhận"
        :class="{ 'p-invalid': errors.users }"
        class="w-full"
      />
      <!-- <small class="p-error" v-if="errors.users">{{ errors.users }}</small> -->
    </div>

    <div class="col-12 mb-3 item-dialog">
      <label for="isSendChatGroup" class="font-bold mb-2"> Gửi Đến Nhóm </label>
      <ToggleButton v-model="form.isSendChatGroup" onLabel="Có" offLabel="Không" class="w-6" />
    </div>

    <div class="actions-dialog">
      <div>
        <Button
          label="Hủy"
          severity="secondary"
          @click="showReminderDialog = false"
          class="p-button-outlined"
        />
      </div>
      <div>
        <Button
          :label="isUpdate ? 'Cập Nhật' : 'Tạo'"
          severity="primary"
          @click="saveReminder"
          class="p-button-raised"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance from '@/router/Interceptor'

// PrimeVue Components
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import MultiSelect from 'primevue/multiselect'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import ToggleButton from 'primevue/togglebutton'

// Types
import type { User } from '@/types/User'
import formatTextWithLinks from '@/utils/FormateTextWithUrl'
import { useUserStore } from '@/pinia/userStore'
import { useToast } from 'primevue'
import { formatDateToLocalISOString } from '@/utils/FormatDate'
import { eventBus } from '@/event/EventBus'

const toast = useToast()

const isAllUsersSelected = (users: User[]) => {
  // Kiểm tra nếu số lượng người dùng được chọn bằng tổng số người dùng có thể chọn
  return users.length > 0 && users.length === userOptions.value.length
}

const userStore = useUserStore()
const user = computed(() => userStore.user)

interface Reminder {
  id: number
  title: string
  description: string
  type: string
  status: string
  createdAt: string
  scheduledTime: string | null
  isSendChatGroup: boolean
  users: User[]
}
// Composition Setup
const router = useRouter()
const token = localStorage.getItem('accessToken')

// Reactive State
const reminders = ref<Reminder[]>([])
const searchQuery = ref('')
const showConfirmDialog = ref(false)
const showReminderDialog = ref(false)
const isUpdate = ref(false)
const reminderToDelete = ref<Reminder | null>(null)
const userOptions = ref<User[]>([])
const isAdmin = ref(false)
const selectedUsers = ref<number[]>([])
// const sendNow = ref(false);

// Reminder type options
const reminderTypes = [
  { name: 'Đóng quỹ', value: 'CONTRIBUTION' },
  { name: 'Phạt', value: 'PENALTY' },
  { name: 'Khảo sát', value: 'SURVEY' },
  { name: 'Khác', value: 'OTHER' },
]

// Form State
const form = ref({
  id: 0,
  title: '',
  description: '',
  reminderType: '',
  scheduledTime: new Date(),
  isSendChatGroup: false,
})

const errors = ref({
  title: '',
  description: '',
  type: '',
  users: '',
})

// Check if user is admin
const checkIsAdmin = async () => {
  if (!token) return
  try {
    const response = await axiosInstance.get(`/tokens/is-admin?token=${token}`)
    isAdmin.value = response.data
  } catch (error) {
    console.error('Error checking admin status:', error)
    isAdmin.value = false
  }
}

// Data Fetching Methods
const fetchUsers = async () => {
  try {
    const response = await axiosInstance.get<User[]>(`/users`)

    userOptions.value = response.data
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const fetchReminders = async () => {
  try {
    const response = await axiosInstance.get<Reminder[]>(`/reminders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    reminders.value = response.data
    console.log(response.data)
  } catch (error) {
    console.error('Error fetching reminders:', error)
  }
}

//send now
const sendReminderToGroup = async (reminder: Reminder) => {
  try {
    // Gọi API gửi nhắc nhở
    await axiosInstance.post(`/reminders/${reminder.id}/send`)
    toast.add({
      severity: 'success',
      summary: 'Gửi thành công',
      detail: 'Đã gửi thông báo lên nhóm.',
    })
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'Gửi thất bại',
      detail: 'Không thể gửi nhắc nhở lên nhóm.',
    })
  }
}

// Computed Properties
const filteredReminders = computed(() => {
  if (!searchQuery.value) return reminders.value
  return reminders.value.filter((reminder) =>
    reminder.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// Dialog and Form Methods
const openCreateDialog = () => {
  // if (!isAdmin.value) return;

  form.value = {
    id: 0,
    title: '',
    description: '',
    reminderType: '',
    scheduledTime: new Date(),
    isSendChatGroup: false,
  }
  selectedUsers.value = []
  isUpdate.value = false
  showReminderDialog.value = true
}

const openUpdateDialog = (reminder: Reminder) => {
  form.value = {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    reminderType: reminder.type,
    scheduledTime: reminder.scheduledTime ? new Date(reminder.scheduledTime) : new Date(),
    isSendChatGroup: reminder.isSendChatGroup,
  }
  selectedUsers.value = reminder.users.map((user) => user.id)
  isUpdate.value = true
  showReminderDialog.value = true
}

const confirmDeleteReminder = (reminder: Reminder) => {
  if (!isAdmin.value) return

  reminderToDelete.value = reminder
  showConfirmDialog.value = true
}

// Validation Method
const validateForm = () => {
  errors.value = {
    title: '',
    description: '',
    type: '',
    users: '',
  }

  if (!form.value.title) errors.value.title = 'Tiêu đề là bắt buộc'
  if (!form.value.description) errors.value.description = 'Mô tả là bắt buộc'
  if (!form.value.reminderType) errors.value.type = 'Loại nhắc nhở là bắt buộc'
  // if (selectedUsers.value.length === 0) errors.value.users = "Phải chọn ít nhất một người nhận";

  // if (form.value.scheduledTime) {
  //   const now = new Date()
  //   const selected = new Date(form.value.scheduledTime)
  //   if (selected < now) {
  //     errors.value.scheduledTime = 'Thời gian lên lịch không được nhỏ hơn thời gian hiện tại'
  //   }
  // }

  return Object.values(errors.value).every((err) => err === '')
}

// CRUD Methods

const saveReminder = async () => {
  if (!isAdmin.value || !validateForm()) return

  try {
    const reminderData = {
      id: form.value.id,
      title: form.value.title,
      description: form.value.description,
      type: form.value.reminderType,
      scheduledTime: form.value.scheduledTime
        ? formatDateToLocalISOString(form.value.scheduledTime) // hoặc formatDateToLocalISOString nếu muốn giữ nguyên giờ
        : null,

      isSendChatGroup: form.value.isSendChatGroup,
      userIds: selectedUsers.value,
    }
    console.log(reminderData)

    if (isUpdate.value) {
      await axiosInstance.put(`/reminders/${form.value.id}`, reminderData)
      eventBus.emit('notifications:updated')
    } else {
      await axiosInstance.post(`/reminders/create`, reminderData)
      eventBus.emit('notifications:updated')
      selectedUsers.value = []
    }

    showReminderDialog.value = false
    fetchReminders()
  } catch (error) {
    console.error('Error saving reminder:', error)
  }
}
//delete reminder
const deleteReminder = async () => {
  if (!isAdmin.value || !reminderToDelete.value) return

  try {
    await axiosInstance.delete(`/reminders/${reminderToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    eventBus.emit('reminder:updated')
    fetchReminders()
  } catch (error) {
    console.error('Error deleting reminder:', error)
  } finally {
    showConfirmDialog.value = false
    reminderToDelete.value = null
  }
}

// Utility Functions
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

// const getUserNames = (reminder: Reminder): string => {
//   if (!reminder.users || reminder.users.length === 0) return 'Không có người nhận'
//   return reminder.users.map((user) => user.fullName || 'Không xác định').join(', ')
// }

// Lifecycle Hooks
onMounted(() => {
  if (!token) {
    router.push('/login')
  } else {
    fetchReminders()
    fetchUsers()
    checkIsAdmin()
  }
})
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}

:global(.container-dialog) {
  width: 400px;
  max-width: 600px;
  margin: 0 auto;
}

:global(.item-dialog) {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

:global(.item-dialog label) {
  margin-bottom: 0.5rem;
}

:global(.actions-dialog) {
  display: flex;
  justify-content: right;
  gap: 20px;
}

.text-center {
  text-align: center;
  font: 1.5em sans-serif;
  margin-bottom: 1rem;
}

.left-10 {
  margin-top: 10px;
  margin-left: 0;
}

.dialog-delete-buttons {
  display: flex;
  justify-content: end;
  gap: 10px;
  margin-top: 20px;
}
</style>
