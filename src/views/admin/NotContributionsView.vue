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
        <Button
          icon="pi pi-verified"
          label="Xác nhận"
          severity="success"
          class="left-10"
          raised
          size="small"
          @click="openConfirmDialog"
        />
      </div>
      <div class="mb-3">
        <InputText
          v-if="users.length > 0"
          v-model="searchQuery"
          placeholder="Tìm kiếm theo mã thành viên, email or tên..."
          class="w-full p-inputtext-sm"
          style="width: 22rem"
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

    <Dialog
      v-model:visible="showConfirmDialog"
      modal
      header="Xác nhận đóng quỹ"
      class="container-dialog"
    >
      <div class="col-12 mb-3 item-dialog">
        <label for="name" class="font-bold mb-2"
          >Chọn loại quỹ<span class="text-danger">*</span></label
        >
        <Dropdown
          id="fundType"
          v-model="selectedFund"
          :options="fundOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Chọn quỹ"
          :class="{ 'p-invalid': errors.selectedType }"
        />
        <small class="p-error" v-if="errors.selectedType">{{ errors.selectedType }}</small>

        <label class="font-bold mb-2 mt-2">Số tiền:</label>
        <InputText
          :value="formatCurrency(paymentAmount)"
          type="text"
          class="p-inputtext w-full"
          disabled
        />
      </div>

      <div class="col-12 mb-3 item-dialog">
        <label for="hosts" class="font-bold mb-2"
          >Thành viên<span class="text-danger">*</span></label
        >
        <MultiSelect
          id="hosts"
          v-model="selectedUsers"
          :options="users"
          optionLabel="user.fullName"
          optionValue="user.id"
          placeholder="Chọn thành viên"
          class="w-full"
          style="width: 100%"
          :class="{ 'p-invalid': errors.users }"
        />
        <small class="p-error" v-if="errors.users">{{ errors.users }}</small>
      </div>

      <div class="actions-dialog">
        <Button
          label="Hủy"
          severity="secondary"
          @click="showConfirmDialog = false"
          class="p-button-outlined"
        />
        <Button
          label="Đồng ý"
          severity="primary"
          @click="confirmContribution"
          class="p-button-raised"
        />
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/pinia/userStore'
import axiosInstance from '@/router/Interceptor'
import formatCurrency from '@/utils/FormatCurrency'
import {
  convertToLocalDateTimeString,
  convertToLocalTimeString,
} from '@/utils/ConvertTimeToDateTime'

// PrimeVue Components
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'

// Interfaces
interface User {
  id: number
  fullName: string
  email: string
  role: {
    name: string
  }
}

interface UserData {
  user: User
  amountToPay: number
}

interface Fund {
  id: number
  name: string
  description: string
  type: string
  amount: number
  createdAt: string
  updatedAt: string
}

interface FundOption {
  label: string
  value: string
}

interface Period {
  id: number
  month: number
  year: number
  deadline: string
  description: string
  totalAmount: number
  createdAt: string
  updatedAt: string
}

// State
const router = useRouter()
const token = localStorage.getItem('accessToken')
const userStore = useUserStore()
const user = computed(() => userStore.user)
const isAdmin = computed(() => user.value?.role === 'ADMIN')

// User data
const users = ref<UserData[]>([])
const searchQuery = ref('')
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  return users.value.filter(
    (user) =>
      user.user.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.user.id.toString().toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// Period and date filters
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const selectedMonth = ref(new Date().getMonth() + 1)

const availableYears = ref<number[]>([])
const availableMonths = ref<number[]>([])

for (let year = 2020; year <= currentYear; year++) {
  availableYears.value.push(year)
}

for (let month = 1; month <= 12; month++) {
  availableMonths.value.push(month)
}

// Pagination
const first = ref<number>(0)
const onPage = (event: { first: number }) => {
  first.value = event.first
}

// Fund data
const funds = ref<Fund[]>([])
const fundOptions = ref<FundOption[]>([])
const selectedFund = ref<string | null>(null)
const paymentAmount = ref(0)

// Period data
const periodId = ref<number | null>(null)

// Contribution form
const form = ref({
  periodId: '',
  totalAmount: 0,
  note: '',
  fundType: '',
  userIds: [] as number[],
})

const errors = ref({
  selectedType: '',
  users: '',
})

const selectedUsers = ref<number[]>([])

// Dialogs
const showConfirmDialog = ref(false)
const showScheduleDialog = ref(false)

// Schedule form
const scheduleForm = ref({
  fromDate: new Date(),
  toDate: new Date(),
  sendTime: new Date(),
  type: 'late_contributed_notification',
})

// Data fetching functions
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
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const fetchFund = async () => {
  try {
    if (!token) {
      throw new Error('Unauthorized')
    }

    const response = await axiosInstance.get(`/funds`)
    funds.value = response.data

    fundOptions.value = [
      { label: 'Tất cả', value: 'ALL' },
      ...funds.value.map((fund) => ({
        label: fund.name,
        value: fund.type,
      })),
    ]
    if (!selectedFund.value) {
      selectedFund.value = 'ALL'
    }
  } catch (error) {
    console.error('Error fetching funds:', error)
  }
}

const fetchPeriodByMonth = async () => {
  try {
    const response = await axiosInstance.get('/periods/get-by-month', {
      params: {
        month: selectedMonth.value,
        year: selectedYear.value,
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    periodId.value = response.data.id
  } catch (error) {
    console.error('Error fetching period:', error)
  }
}

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

// Event handlers
const onYearChange = () => {
  fetchUsers()
  fetchPeriodByMonth()
}

const onMonthChange = () => {
  fetchUsers()
  fetchPeriodByMonth()
}

const openConfirmDialog = async () => {
  resetErrors()
  selectedUsers.value = []

  // Make sure funds are loaded
  if (funds.value.length === 0) {
    await fetchFund()
  }

  // Set the selected fund to 'ALL' first
  selectedFund.value = 'ALL'

  // Calculate total amount from all funds and set it
  const total = funds.value.reduce((sum, fund) => sum + Number(fund.amount), 0)
  paymentAmount.value = total
  form.value.fundType = 'ALL'

  await fetchPeriodByMonth()
  showConfirmDialog.value = true
}

const openScheduleDialog = () => {
  fetchSchedule()
  showScheduleDialog.value = true
}

// Form handling
const resetErrors = () => {
  errors.value = { selectedType: '', users: '' }
}

const validateForm = () => {
  resetErrors()

  if (!selectedFund.value) {
    errors.value.selectedType = 'Vui lòng chọn loại quỹ!'
  }

  if (selectedUsers.value.length === 0) {
    errors.value.users = 'Vui lòng chọn thành viên!'
  }

  return Object.values(errors.value).every((err) => err === '')
}

// Fund selection watcher
watch(selectedFund, (newValue) => {
  if (!newValue) {
    paymentAmount.value = 0
    form.value.fundType = ''
    return
  }

  if (newValue === 'ALL') {
    // If selecting "All", sum all funds
    const total = funds.value.reduce((sum, fund) => sum + Number(fund.amount), 0)
    paymentAmount.value = total
    form.value.fundType = 'ALL'
    return
  }

  // For single fund selection
  const fund = funds.value.find((f) => f.type === newValue)
  if (fund) {
    paymentAmount.value = Number(fund.amount)
    form.value.fundType = fund.type
  } else {
    paymentAmount.value = 0
    form.value.fundType = ''
  }
})

// API actions
const confirmContribution = async () => {
  if (!validateForm()) return

  try {
    // Make sure we have the period ID
    if (!periodId.value) {
      await fetchPeriodByMonth()
    }

    const requestData = {
      periodId: periodId.value,
      totalAmount: paymentAmount.value,
      note: `Đóng quỹ tháng ${selectedMonth.value}`,
      fundType: form.value.fundType || selectedFund.value,
      userIds: selectedUsers.value,
    }

    const response = await axiosInstance.post(
      `/contributions/confirm/dept-contribution`,
      requestData,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    showConfirmDialog.value = false
    fetchUsers()
  } catch (error) {
    console.error('Error confirming contribution:', error)
  }
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

    await axiosInstance.put(`/schedules/${dataForm.type}`, dataForm)
    showScheduleDialog.value = false
  } catch (error) {
    console.error('Lỗi khi cập nhật schedule:', error)
  }
}

// Formatters
const formatFullDateTime = (dateObj: Date) => {
  if (!dateObj) return 'Không có dữ liệu'
  return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
}

const formatTimeOnly = (dateObj: Date) => {
  if (!dateObj) return 'Không có dữ liệu'
  return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
}

// Lifecycle hooks
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
#fundType {
  width: 100%;
  margin-left: 0;
}
.border {
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
