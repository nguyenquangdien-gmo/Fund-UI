<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-xl">THÀNH VIÊN CHƯA ĐÓNG QUỸ</h2>
      <div class="mb-3">
        <select
          v-model="selectedMonth"
          @change="onMonthChange"
          class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300 select-year"
        >
          <option v-for="month in availableMonths" :key="month" :value="month">
            {{ month }}
          </option>
        </select>
        <select
          v-model="selectedYear"
          @change="onYearChange"
          class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300 select-year left-10"
        >
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <Button
          icon="pi pi-cog"
          label="Cài đặt"
          severity="success"
          class="left-10"
          raised
          size="small"
          @click="openScheduleDialog"
        />
      </div>
      <div class="mb-3">
        <InputText
          v-if="users.length > 0"
          v-model="searchQuery"
          placeholder="Tìm kiếm theo mã thành viên or tên..."
          class="w-full p-inputtext-sm"
          style="width: 25%"
        />
        <!-- <Button label="Create reminder" severity="success" class="left-10" raised size="small"
                    @click="openCreateDialog" /> -->
      </div>
      <DataTable
        v-if="users.length > 0"
        :value="filteredUsers"
        paginator
        :first="first"
        @page="onPage"
        :rows="15"
        :rowsPerPageOptions="[15, 20, 25]"
        class="p-datatable-sm"
      >
        <Column header="STT" sortable>
          <template #body="{ index }">
            {{ first + index + 1 }}
          </template>
        </Column>
        <Column field="user.id" header="Mã nhân viên" sortable></Column>
        <Column field="user.email" header="Email" sortable></Column>
        <Column field="user.fullName" header="Tên " sortable></Column>
        <Column field="user.role.name" header="Vai trò " sortable></Column>
        <Column field="amountToPay" header="Tổng tiền" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.amountToPay) }}
          </template>
        </Column>

        <!-- <Column field="createdAt" header="Ngày Tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
</Column> -->
        <!-- <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Update" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)" />
                        <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteFund(data)" />
                    </template>
                </Column> -->
      </DataTable>
      <div v-else>Mọi người đều đã đóng quỹ đầy đủ tháng này!😊</div>
    </div>
    <Dialog v-model:visible="showScheduleDialog" modal header="Cập nhật" class="container-dialog">
      <!-- Thông tin hiện tại -->
      <div class="col-12 mb-3 item-dialog lh-2">
        <p class="text-sm text-gray-600">
          🕒 <strong>Từ ngày:</strong> {{ formatFullDateTime(scheduleForm.fromDate) }}<br />
          🕒 <strong>Đến ngày:</strong> {{ formatFullDateTime(scheduleForm.toDate) }}<br />
          ⏰ <strong>Thời gian gửi:</strong> {{ formatTimeOnly(scheduleForm.sendTime) }}
        </p>
      </div>

      <!-- Form chọn lại -->
      <div class="col-12 mb-3 item-dialog">
        <label class="font-bold mb-2">Từ ngày<span class="text-danger">*</span></label>
        <Calendar v-model="scheduleForm.fromDate" date-format="dd/mm/yy" class="w-full" />
      </div>

      <div class="col-12 mb-3 item-dialog">
        <label class="font-bold mb-2">Đến ngày<span class="text-danger">*</span></label>
        <Calendar v-model="scheduleForm.toDate" date-format="dd/mm/yy" class="w-full" />
      </div>

      <div class="col-12 mb-3 item-dialog">
        <label class="font-bold mb-2">Thời gian gửi<span class="text-danger">*</span></label>
        <Calendar v-model="scheduleForm.sendTime" timeOnly hourFormat="24" class="w-full" />
      </div>

      <div class="actions-dialog">
        <Button label="Hủy" severity="secondary" @click="showScheduleDialog = false" />
        <Button label="Cập nhật" severity="primary" @click="saveSchedule" />
      </div>
    </Dialog>
  </div>
  <!-- <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa thành viên này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteUser" />
        </div>
    </Dialog> -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import axiosInstance from '@/router/Interceptor'
import { useRouter } from 'vue-router'
import type { User } from '@/types/User'
import { useUserStore } from '@/pinia/userStore'
import formatCurrency from '@/utils/FormatCurrency'
import {
  convertToLocalDateTimeString,
  convertToLocalTimeString,
} from '@/utils/ConvertTimeToDateTime'
import Calendar from 'primevue/calendar'

interface UserData {
  user: User
  amountToPay: number
}
// const baseURL = "http://localhost:8080/api/v1";
// const showConfirmDialog = ref(false);
// const userToDelete = ref<User | null>(null);
const token = localStorage.getItem('accessToken')
const users = ref<UserData[]>([])
const searchQuery = ref('')
const form = ref({ id: 0, title: '', description: '', type: '', status: '', created_at: '' })
const errors = ref({ name: '', description: '' })
const router = useRouter()

const userStore = useUserStore()
const user = computed(() => userStore.user)
const isAdmin = computed(() => user.value?.role === 'ADMIN')

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const availableYears = ref<number[]>([])

for (let year = 2020; year <= currentYear; year++) {
  availableYears.value.push(year)
}

//pagenation
const first = ref<number>(0)

const onPage = (event: { first: number }) => {
  first.value = event.first
}

const selectedMonth = ref(new Date().getMonth() + 1)
const availableMonths = ref<number[]>([])

for (let month = 1; month <= 12; month++) {
  availableMonths.value.push(month)
}
const onYearChange = () => {
  fetchUsers()
}

const onMonthChange = () => {
  fetchUsers()
}

const fetchUsers = async () => {
  try {
    const response = await axiosInstance.get(`/users/no-contribution/period`, {
      params: {
        year: selectedYear.value,
        month: selectedMonth.value,
      },
      headers: { Authorization: `Bearer ${token}` },
    })
    users.value = response.data
    console.log(users.value)
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}
//crate  reminder

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  return users.value.filter((user) =>
    user.user.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const validateForm = () => {
  errors.value = { name: '', description: '' }

  if (!form.value.title) {
    errors.value.name = 'Title is required!'
  }
  if (!form.value.description) {
    errors.value.description = 'Description is required!'
  }

  return Object.values(errors.value).every((err) => err === '')
}

//setting schedule
//setting time
const showScheduleDialog = ref(false)
const scheduleForm = ref({
  fromDate: new Date(),
  toDate: new Date(),
  sendTime: new Date(),
  type: 'event_notification',
})
const fetchSchedule = async () => {
  try {
    const response = await axiosInstance.get(`/schedules/type/late_contributed_notification`)
    if (response.data && response.data.length > 0) {
      const scheduleData = response.data[0] // Lấy phần tử đầu tiên từ mảng
      scheduleForm.value = {
        fromDate: new Date(scheduleData.fromDate),
        toDate: new Date(scheduleData.toDate),
        sendTime: new Date(`1970-01-01T${scheduleData.sendTime}`), // LocalTime convert
        type: scheduleData.type.toLowerCase(),
      }
    } else if (response.data) {
      // Nếu response không phải là mảng
      scheduleForm.value = {
        fromDate: new Date(response.data.fromDate),
        toDate: new Date(response.data.toDate),
        sendTime: new Date(`1970-01-01T${response.data.sendTime}`),
        type: response.data.type.toLowerCase(),
      }
    }
  } catch (error) {
    console.error('Error fetching schedule:', error)
  }
}

const formatFullDateTime = (dateObj: Date) => {
  if (!dateObj) return 'Không có dữ liệu'
  return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
}

// Định dạng chỉ thời gian
const formatTimeOnly = (dateObj: Date) => {
  if (!dateObj) return 'Không có dữ liệu'
  return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
}

// 👉 Hàm mở dialog với schedule sẵn có
const openScheduleDialog = () => {
  fetchSchedule()
  showScheduleDialog.value = true
}

const saveSchedule = async () => {
  try {
    const fromDate = new Date(scheduleForm.value.fromDate)
    const toDate = new Date(scheduleForm.value.toDate)

    fromDate.setHours(0, 0, 0, 0)

    toDate.setHours(23, 59, 59, 999)

    const dataForm = {
      fromDate: convertToLocalDateTimeString(fromDate),
      toDate: convertToLocalDateTimeString(toDate),
      sendTime: convertToLocalTimeString(scheduleForm.value.sendTime),
      type: scheduleForm.value.type,
    }

    console.log('scheduleForm update gửi lên:', dataForm)

    await axiosInstance.put(`/schedules/${dataForm.type}`, dataForm)
    showScheduleDialog.value = false
  } catch (error) {
    console.error('Lỗi khi cập nhật schedule:', error)
  }
}

const resetErrors = () => {
  errors.value = { name: '', description: '' }
}

// const deleteUser = async () => {
//     if (!userToDelete.value) return;
//     try {
//         await axiosInstance.delete(`${baseURL} /users/${userToDelete.value.id} `, {
//             headers: { Authorization: `Bearer ${token} ` }
//         });
//         fetchUsers();
//     } catch (error) {
//         console.error('Error deleting user:', error);
//     } finally {
//         showConfirmDialog.value = false;
//         userToDelete.value = null;
//     }
// };

onMounted(() => {
  if (!token) {
    router.push('/')
  } else {
    fetchUsers()
  }
})
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}

.left-10 {
  margin-left: 10px;
}
</style>
