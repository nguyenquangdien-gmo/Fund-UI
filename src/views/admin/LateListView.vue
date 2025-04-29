<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">ĐI MUỘN</h2>

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
        <AutoComplete
          :suggestions="suggestions"
          @complete="searchItems"
          @item-select="handleSelect"
          optionLabel="label"
          dropdown
          placeholder="🔍 Tìm theo tên hoặc ID"
          class="p-inputtext-sm w-64"
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
      :first="first"
      @page="onPage"
      :rowsPerPageOptions="[10, 50, 100]"
      stripedRows
      responsiveLayout="scroll"
    >
      <Column header="STT" sortable>
        <template #body="{ index }">
          {{ first + index + 1 }}
        </template>
      </Column>
      <Column field="user.id" header="Mã nhân viên" sortable>
        <template #body="{ data }">
          {{ data.user?.id || '-' }}
        </template>
      </Column>
      <Column field="user.fullName" header="Tên nhân viên" sortable>
        <template #body="{ data }">
          {{ data.user?.fullName || '-' }}
        </template>
      </Column>
      <Column field="checkinAt" header="Check-in" sortable>
        <template #body="{ data }">
          {{ data.checkinAt ?? '-' }}
        </template>
      </Column>
      <Column field="note" header="Ghi chú">
        <template #body="{ data }">
          {{ data.note?.trim() ? data.note : 'Không có' }}
        </template>
      </Column>
      <Column field="date" header="Ngày" sortable>
        <template #body="{ data }">
          {{ formatDate(data.date) }}
        </template>
      </Column>
      <Column field="penBill" header="Trạng thái" sortable>
        <template #body="{ data }">
          <Tag style="width: 100%" :severity="getReminderTypeSeverity(data.penBill?.paymentStatus)">
            {{
              data.penBill?.paymentStatus === 'PAID'
                ? 'Đã đóng'
                : data.penBill?.paymentStatus === 'UNPAID'
                  ? 'Chưa đóng'
                  : data.penBill?.paymentStatus === 'PENDING'
                    ? 'Đang chờ'
                    : 'Lần 1'
            }}
          </Tag>
        </template>
      </Column>
      <Column header="Hành động" v-if="isAdmin">
        <template #body="{ data }">
          <Button
            label="Xóa"
            icon="pi pi-trash"
            class="p-button-danger p-button-sm"
            @click="deleteRecord(data)"
          />
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
      <label class="font-bold mb-2"> Channel id</label>
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
import { useToast } from 'primevue/usetoast'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import axiosInstance from '@/router/Interceptor'
import formatDate from '@/utils/FormatDate'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import AutoComplete from 'primevue/autocomplete'

interface User {
  id?: string | null
  fullName?: string | null
}

interface LateRecord {
  id: number
  user?: User | null
  checkinAt: string
  note: string | null
  date: string
  penBill?: {
    id: number
    userId: number
    penaltySlug: string
    dueDate: string
    amount: number
    description: string
    paymentStatus: 'PAID' | 'UNPAID' | 'PENDING'
    userIds: number[] | null
  } | null
}

//pagination
const first = ref<number>(0)

const onPage = (event: { first: number }) => {
  first.value = event.first
}

const token = localStorage.getItem('accessToken')
const fromDate = ref<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const toDate = ref<Date | null>(
  new Date(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
)
const lateRecords = ref<LateRecord[]>([])
const searchTerm = ref('')
const isAdmin = ref(false)

const suggestions = ref<{ label: string; value: string }[]>([])

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
// const checkIsAdmin = async () => {
//   if (!token) return
//   try {
//     const response = await axiosInstance.get(`/tokens/is-admin?token=${token}`)
//     isAdmin.value = response.data
//   } catch (error) {
//     console.error('Error checking admin status:', error)
//     isAdmin.value = false
//   }
// }

const checkIsAdmin = async () => {
  const userData = sessionStorage.getItem('user');
  
  if (!userData) return false;
  try {
    const user = JSON.parse(userData);
    console.log('User role:', user.role);
    console.log(user.role === 'ADMIN');
    isAdmin.value = user.role === 'ADMIN';
  } catch (error) {
    console.error('Error parsing user data from sessionStorage:', error);
    isAdmin.value = false;
  }
};

const fetchLateRecords = async () => {
  if (!fromDate.value || !toDate.value) return

  if (fromDate.value > toDate.value) {
    toDate.value = fromDate.value
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Ngày bắt đầu không được lớn hơn ngày kết thúc',
      life: 3000,
    })
    return
  }

  if (toDate.value < fromDate.value) {
    toDate.value = fromDate.value
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
      life: 3000,
    })
    return
  }
  try {
    const response = await axiosInstance.get(`/late/users`, {
      params: {
        fromDate: fromDate.value.toISOString().split('T')[0],
        toDate: toDate.value.toISOString().split('T')[0],
      },
    })
    lateRecords.value = response.data
    // Trường hợp API trả về chuỗi JSON, cần parse
    const parsedData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data

    const plainRecords = JSON.parse(JSON.stringify(parsedData))

    lateRecords.value = plainRecords

    // Lọc dữ liệu trùng lặp chỉ cho suggestions
    const uniqueSuggestions = plainRecords.filter(
      (record: LateRecord, index: number, self: LateRecord[]) =>
        index === self.findIndex((r) => r.user?.id === record.user?.id),
    )

    suggestions.value = uniqueSuggestions.map((record: LateRecord) => ({
      label: `${record.user?.id ?? ''} - ${record.user?.fullName ?? ''}`,
      value: record.user?.id ?? '',
    }))
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đi trễ:', error)
  }
}

// Gợi ý tìm kiếm (AutoComplete)
function searchItems(event: { query: string }) {
  const query = event.query.toLowerCase()
  const uniqueSuggestions = new Map()

  lateRecords.value.forEach((item) => {
    if (item.user?.id || item.user?.fullName) {
      const label = `${item.user?.id ?? ''} - ${item.user?.fullName ?? ''}`
      if (!uniqueSuggestions.has(label)) {
        uniqueSuggestions.set(label, {
          label,
          value: label,
        })
      }
    }
  })

  suggestions.value = [
    { label: 'All Members', value: 'All Members' },
    ...Array.from(uniqueSuggestions.values()).filter((item) =>
      item.label.toLowerCase().includes(query),
    ),
  ]
}

const handleSelect = (event: { originalEvent: Event; value: { label: string; value: string } }) => {
  const selected = event.value
  const selectedId = selected.label === 'All Members' ? '' : selected.value.split(' - ')[0]

  searchTerm.value = selectedId
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

    if (dialogMode.value === 'check') {
      scheduleForm.value.sendTime = new Date()
      scheduleForm.value.sendTime.setHours(10, 0, 0, 0) // Set sendTime to 10:00AM
    }
  } catch (error) {
    console.error('Error fetching schedule:', error)
  }
}
const toast = useToast()

// watch([fromDate, toDate], ([newFromDate, newToDate], [oldFromDate, oldToDate]) => {
//   if (newFromDate && newToDate) {
//     if (newToDate < newFromDate) {
//       fromDate.value = toDate.value;
//       toDate.value = oldToDate;
//       toast.add({
//         severity: 'error',
//         summary: 'Lỗi',
//         detail: 'Ngày bắt đầu không được lớn hơn ngày kết thúc',
//         life: 3000,
//       });
//     } else if (newFromDate > newToDate) {
//       toDate.value = fromDate.value;
//       fromDate.value = oldFromDate;
//       toast.add({
//         severity: 'error',
//         summary: 'Lỗi',
//         detail: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
//         life: 3000,
//       });
//     }
//   }
// });

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
// const validateForm = () => {
//   errors.value = { channelId: '' }

//   if (!scheduleForm.value.channelId)
//     errors.value.channelId = 'Vui lòng nhập channel id để lấy checkin!'
//   return Object.values(errors.value).every((err) => err === '')
// }

// Hàm xử lý hành động dựa trên chế độ dialog

const handleAction = async () => {
  if (dialogMode.value === 'settings') {
    await saveSchedule()
  } else {
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
    toast.add({ severity: 'warn', summary: 'Hãy cấu hình channel id trong phần schedule để không cần nhập!', life: 3000 })
    console.error('Lỗi khi kiểm tra ngay:', error)
  }
}

const getReminderTypeSeverity = (status: string | undefined): string => {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'UNPAID':
      return 'danger'
    case 'PENDING':
      return 'warning'
    default:
      return 'secondary'
  }
}

const deleteRecord = async (data: LateRecord) => {
  if (!data || !data.user?.id) return

  try {
    await axiosInstance.delete(`/late/users/${data.id}?penBillId=${data.penBill?.id}`)

    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Xóa bản ghi thành công',
      life: 3000,
    })

    // Cập nhật danh sách sau khi xóa
    fetchLateRecords()
  } catch (error) {
    console.error('Lỗi khi xóa bản ghi:', error)
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể xóa bản ghi',
      life: 3000,
    })
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
