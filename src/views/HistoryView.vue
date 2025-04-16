<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import axiosInstance from '@/router/Interceptor'
import formatDate from '@/utils/FormatDate'
import Button from 'primevue/button'

const token = localStorage.getItem('accessToken')
// const baseURL = "http://localhost:8080/api/v1";
const loading = ref(true)
// const error = ref(null);
const user = JSON.parse(sessionStorage.getItem('user'))
const userId = ref(user ? user.id : null)
const searchQuery = ref('')
const selectedListType = ref('contributions') // Mặc định hiển thị danh sách đóng quỹ
const listOptions = ref([
  { label: 'Lịch sử đóng quỹ', value: 'contributions' },
  { label: 'Lịch sử nộp phạt', value: 'penBills' },
])

const contributions = ref([])
const penBills = ref([])

// Fetch dữ liệu Contributions
const fetchContributions = async () => {
  try {
    if (!token) throw new Error('Unauthorized')

    const response = await axiosInstance.get(`/contributions/user/${userId.value}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    contributions.value = response.data
  } catch (err) {
    // error.value = "Không thể tải dữ liệu đóng quỹ";
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Fetch dữ liệu Pen Bills
const fetchPenBills = async () => {
  try {
    if (!token) throw new Error('Unauthorized')

    const response = await axiosInstance.get(`/pen-bills/user/${userId.value}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    penBills.value = response.data
  } catch (err) {
    // error.value = "Không thể tải dữ liệu nộp phạt";
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Gọi API khi mounted hoặc khi thay đổi danh sách
onMounted(() => {
  fetchContributions()
  fetchPenBills()
})

watch(selectedListType, () => {
  loading.value = true
  if (selectedListType.value === 'contributions') {
    fetchContributions()
  } else {
    fetchPenBills()
  }
})

// Filter và Pagination
const filteredContributions = computed(() => {
  if (!searchQuery.value) return contributions.value
  return contributions.value.filter(
    (item) =>
      item.id.toString().includes(searchQuery.value) ||
      item.periodName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.paymentStatus.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const filteredPenBills = computed(() => {
  if (!searchQuery.value) return penBills.value
  return penBills.value.filter(
    (item) =>
      item.id.toString().includes(searchQuery.value) ||
      item.periodName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.paymentStatus.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const formatCurrency = (value) => value.toLocaleString() + ' VND'

// const getStatusSeverity = (status) => {
//     return { PAID: "success", PENDING: "info" }[status] || "secondary";
// };
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Lịch sử đóng quỹ</h2>

    <div class="mb-4 flex items-center gap-4">
      <Dropdown
        v-model="selectedListType"
        :options="listOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Chọn danh sách"
        class="w-64"
      />

      <InputText
        v-model="searchQuery"
        placeholder="Tìm kiếm theo Id, Kỳ đóng, Trạng thái..."
        style="margin-left: 10px; width: 28%"
        class="p-inputtext w-64"
      />
    </div>

    <!-- <p v-if="error" class="text-red-500">{{ error }}</p> -->
    <p v-if="loading">Đang tải dữ liệu...</p>

    <!-- Hiển thị danh sách Contributions -->
    <DataTable
      v-if="selectedListType === 'contributions' && filteredContributions.length > 0"
      :value="filteredContributions"
      paginator
      :rows="15"
      :rowsPerPageOptions="[15, 20, 25]"
      responsiveLayout=" scroll"
    >
      <Column header="STT" sortable>
        <template #body="{ index }">
          {{ index + 1 }}
        </template>
      </Column>
      <Column field="periodName" header="Kỳ đóng" />
      <Column field="totalAmount" header="Số tiền">
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.totalAmount) }}
        </template>
      </Column>
      <Column field="paymentStatus" header="Trạng thái">
        <template #body="slotProps">
          <Button
            class="status"
            v-if="slotProps.data.paymentStatus === 'PAID'"
            label="Đã thu"
            icon="pi pi-check-square"
            severity="success"
            disabled
          />
          <Button
            class="status"
            v-if="slotProps.data.paymentStatus === 'PENDING'"
            label="Chờ xác nhận"
            icon="pi pi-hourglass"
            severity="info"
            disabled
          />
          <Button
            class="status"
            v-if="slotProps.data.paymentStatus === 'CANCELED'"
            label="Bị hủy"
            icon="pi pi-times-circle"
            severity="warn"
            disabled
          />
        </template>
      </Column>
      <Column field="note" header="Ghi chú" />
      <Column field="deadline" header="Thời hạn">
        <template #body="slotProps">
          <span :class="{ 'text-red-500': slotProps.data.isLate }">
            {{ formatDate(slotProps.data.deadline) }}
          </span>
        </template>
      </Column>
    </DataTable>

    <!-- Hiển thị danh sách Pen Bills -->
    <DataTable
      v-else-if="selectedListType === 'penBills' && filteredPenBills.length > 0"
      :value="filteredPenBills"
      paginator
      :rows="15"
      :rowsPerPageOptions="[15, 20, 25]"
      responsiveLayout=" scroll"
    >
      <Column header="STT" sortable>
        <template #body="{ index }">
          {{ index + 1 }}
        </template>
      </Column>
      <Column field="description" header="Mô Tả" sortable style="width: 50%"></Column>
      <Column field="amount" header="Tổng cộng" sortable>
        <template #body="{ data }">
          {{ formatCurrency(data.amount) }}
        </template>
      </Column>

      <Column field="created" header="Ngày tạo" sortable>
        <template #body="{ data }">
          {{ formatDate(data.dueDate) }}
        </template>
      </Column>
      <Column header="Trạng thái">
        <template #body="{ data }">
          <Button
            class="status"
            v-if="data.paymentStatus === 'PAID'"
            label="Đã đóng phạt"
            icon="pi pi-check-square"
            severity="success"
            disabled
          />
          <Button
            class="status"
            v-if="data.paymentStatus === 'PENDING'"
            label="Chờ xác nhận"
            icon="pi pi-hourglass"
            severity="info"
            disabled
          />
          <Button
            class="status"
            v-if="data.paymentStatus === 'CANCELED'"
            label="Bị hủy "
            icon="pi pi-times-circle"
            severity="warn"
            disabled
          />
        </template>
      </Column>
    </DataTable>

    <p v-else>Bạn chưa có dữ liệu</p>
  </div>
</template>

<style scoped>
.p-datatable th {
  background-color: #f4f4f4;
  text-align: center;
}

.text-xl {
  text-align: center;
  font: 2em sans-serif;
}

.status {
  width: 80%;
}
</style>
