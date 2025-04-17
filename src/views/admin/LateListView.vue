<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Danh sách đi muộn</h2>

    <div class="navbar-actions">
      <div class="flex gap-4">
        Từ
        <Calendar
          v-model="fromDate"
          dateFormat="dd-mm-yy"
          placeholder="Từ ngày"
          @date-select="fetchLateRecords"
        />
        đến
        <Calendar
          v-model="toDate"
          dateFormat="dd-mm-yy"
          placeholder="Đến ngày"
          @date-select="fetchLateRecords"
        />
        Tìm kiếm
        <InputText
          v-model="searchTerm"
          placeholder="🔍 Tìm theo tên hoặc ID"
          class="p-inputtext-sm"
        />
      </div>
      <div>
        <!-- <Button label="Tìm kiếm" icon="pi pi-search" class="p-button-sm mr-2" @click="fetchLateRecords" /> -->
        <Button
          v-if="isAdmin"
          label="Cài đặt"
          icon="pi pi-cog"
          class="p-button-sm"
          severity="success"
          raised
          @click="openScheduleDialog('settings')"
        />
        <Button
          v-if="isAdmin"
          label="Check now"
          icon="pi pi-check"
          class="p-button-sm"
          severity="success"
          raised
          @click="openScheduleDialog('check')"
        />
      </div>
    </div>

    <DataTable
      v-if="filteredRecords.length > 0"
      :value="filteredRecords"
      :paginator="true"
      :rows="15"
      :rowsPerPageOptions="[15, 20, 25]"
      stripedRows
      responsiveLayout="scroll"
    >
      <Column header="STT" sortable>
        <template #body="{ index }">
          {{ index + 1 }}
        </template>
      </Column>
      <Column field="user.id" header="Mã nhân viên">
        <template #body="{ data }">
          {{ data.user?.id || '-' }}
        </template>
      </Column>
      <Column field="user.fullName" header="Tên nhân viên">
        <template #body="{ data }">
          {{ data.user?.fullName || '-' }}
        </template>
      </Column>
      <Column field="checkinAt" header="Check-in">
        <template #body="{ data }">
          {{ data.checkinAt ?? '-' }}
        </template>
      </Column>
      <Column field="note" header="Ghi chú">
        <template #body="{ data }">
          {{ data.note?.trim() ? data.note : 'Không có' }}
        </template>
      </Column>
      <Column field="date" header="Ngày">
        <template #body="{ data }">
          {{ formatDate(data.date) }}
        </template>
      </Column>
    </DataTable>

    <div v-else class="text-center text-gray-500">Không có dữ liệu để hiển thị.</div>
  </div>

  <!-- Dialog Cài đặt thông báo đi muộn -->
  <Dialog v-model:visible="showScheduleDialog" modal :header="dialogTitle" class="container-dialog">
    <!-- Thông tin hiện tại -->
    <div class="col-12 mb-3 item-dialog lh-2">
      <p class="text-sm text-gray-600">
        ⏰ <strong>Thời gian lấy check in:</strong> {{ formatTimeOnly(scheduleForm.sendTime) }}
      </p>
    </div>

    <!-- Form chọn lại -->
    <div class="col-12 mb-3 item-dialog">
      <label class="font-bold mb-2">
        Channel id <span class="text-danger" :hidden="dialogMode === 'settings'">*</span></label
      >
      <InputText
        v-model="scheduleForm.channelId"
        placeholder="Vui lòng nhập channel id của chatops"
        class="w-full"
      />
      <small class="text-danger" v-if="errors.channelId && dialogMode !== 'settings'">{{
        errors.channelId
      }}</small>
      <label class="font-bold mb-2"> Thời gian gửi <span class="text-danger">*</span> </label>
      <Calendar v-model="scheduleForm.sendTime" timeOnly hourFormat="24" class="w-full" />
    </div>

    <div class="actions-dialog">
      <Button label="Hủy" severity="secondary" @click="showScheduleDialog = false" />
      <Button
        :label="dialogMode === 'settings' ? 'Cập nhật' : 'Kiểm tra ngay'"
        severity="primary"
        @click="handleAction"
      />
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import axiosInstance from '@/router/Interceptor'
import formatDate from '@/utils/FormatDate'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

interface User {
  id?: string | null
  fullName?: string | null
}

interface LateRecord {
  user?: User | null
  checkinAt: string
  note: string | null
  date: string
}

const token = localStorage.getItem('accessToken')
const fromDate = ref<Date | null>(new Date(new Date().getTime() - 24 * 60 * 60 * 1000))
const toDate = ref<Date | null>(new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000))
const lateRecords = ref<LateRecord[]>([])
const searchTerm = ref('')
const isAdmin = ref(false)

// Thêm state cho phần cài đặt thông báo đi muộn
const showScheduleDialog = ref(false)
const scheduleForm = ref({
  fromDate: new Date(),
  sendTime: new Date(),
  type: 'late_notification',
  channelId: '',
})
const dialogMode = ref<'settings' | 'check'>('settings')
const dialogTitle = computed(() => {
  return dialogMode.value === 'settings'
    ? 'Cài đặt thông báo đi muộn'
    : 'Kiểm tra thông báo đi muộn ngay'
})

// Kiểm tra quyền admin
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

const fetchLateRecords = async () => {
  if (!fromDate.value || !toDate.value) return

  try {
    const response = await axiosInstance.get(`/late/users`, {
      params: {
        fromDate: fromDate.value.toISOString().split('T')[0],
        toDate: toDate.value.toISOString().split('T')[0],
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    lateRecords.value = response.data
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đi trễ:', error)
  }
}

// Hàm lấy thông tin cài đặt thông báo đi muộn
const fetchSchedule = async () => {
  try {
    const response = await axiosInstance.get(`/schedules/type/late_notification`)
    if (response.data && response.data.length > 0) {
      const scheduleData = response.data[0]
      scheduleForm.value = {
        fromDate: new Date(scheduleData.fromDate),
        sendTime: new Date(`1970-01-01T${scheduleData.sendTime}`),
        type: scheduleData.type.toLowerCase(),
        channelId: '',
      }
    } else if (response.data) {
      scheduleForm.value = {
        fromDate: new Date(response.data.fromDate),
        sendTime: new Date(`1970-01-01T${response.data.sendTime}`),
        type: response.data.type.toLowerCase(),
        channelId: '',
      }
    }
  } catch (error) {
    console.error('Error fetching schedule:', error)
  }
}

// Hàm định dạng hiển thị ngày tháng
// const formatFullDateTime = (dateObj: Date) => {
//   if (!dateObj) return 'Không có dữ liệu'
//   return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
// }

// Định dạng chỉ thời gian
const formatTimeOnly = (dateObj: Date) => {
  if (!dateObj) return 'Không có dữ liệu'
  return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
}

// Hàm mở dialog cài đặt
const openScheduleDialog = (mode: 'settings' | 'check' = 'settings') => {
  errors.value = { channelId: '' }
  dialogMode.value = mode
  fetchSchedule()
  showScheduleDialog.value = true
}

// Hàm định dạng ngày tháng theo yêu cầu API (yyyy-MM-dd)
const formatDateToApiString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T00:00:00`
}

// Hàm định dạng thời gian theo yêu cầu API (HH:mm:ss)
const formatTimeToApiString = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

//validate form
const errors = ref({ channelId: '' })
const validateForm = () => {
  errors.value = { channelId: '' }

  if (!scheduleForm.value.channelId)
    errors.value.channelId = 'Vui lòng nhập channel id để lấy checkin!'
  return Object.values(errors.value).every((err) => err === '')
}

// Hàm xử lý hành động dựa trên chế độ dialog

const handleAction = async () => {
  if (dialogMode.value === 'settings') {
    await saveSchedule()
  } else {
    if (!validateForm()) return
    await checkNow()
  }
}

// Hàm lưu cài đặt thông báo
const saveSchedule = async () => {
  try {
    const dataForm = {
      fromDate: formatDateToApiString(scheduleForm.value.fromDate),
      sendTime: formatTimeToApiString(scheduleForm.value.sendTime),
      type: scheduleForm.value.type,
      channelId: scheduleForm.value.channelId,
    }

    console.log('scheduleForm update gửi lên:', dataForm)

    await axiosInstance.put(`/schedules/${dataForm.type}`, dataForm)
    showScheduleDialog.value = false
  } catch (error) {
    console.error('Lỗi khi cập nhật schedule:', error)
  }
}

// Hàm gọi API check now
const checkNow = async () => {
  try {
    const dataForm = {
      channelId: scheduleForm.value.channelId,
      time: formatTimeToApiString(scheduleForm.value.sendTime),
    }

    console.log('checkNow request data:', dataForm)

    // Gọi API check now
    await axiosInstance.post(`/late/check-now`, dataForm)
    showScheduleDialog.value = false
  } catch (error) {
    console.error('Lỗi khi kiểm tra ngay:', error)
  }
}

onMounted(() => {
  fetchLateRecords()
  checkIsAdmin()
})

// Cải tiến hàm lọc với kiểm tra an toàn
const filteredRecords = computed(() => {
  return lateRecords.value.filter((record) => {
    // Kiểm tra ngày
    const matchDate =
      fromDate.value && toDate.value
        ? new Date(record.date) >= fromDate.value && new Date(record.date) <= toDate.value
        : true

    // Kiểm tra search term
    const matchSearch =
      !searchTerm.value ||
      // Kiểm tra fullName
      (record.user?.fullName &&
        record.user.fullName.toString().toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      // Kiểm tra id
      (record.user?.id &&
        record.user.id.toString().toLowerCase().includes(searchTerm.value.toLowerCase()))

    return matchDate && matchSearch
  })
})
</script>
<style scoped>
.navbar-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
}

.navbar-actions .p-button {
  margin-left: 1rem;
}

.select-year {
  width: 150px;
  margin-left: 10px;
}

:global(.container-dialog) {
  width: 400px;
  max-width: 600px;
  margin: 0 auto;
}

:global(.item-dialog) {
  display: flex;
  flex-direction: column;
}

:global(.actions-dialog) {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.lh-2 {
  line-height: 1.6;
}

.text-danger {
  color: red;
}
</style>
