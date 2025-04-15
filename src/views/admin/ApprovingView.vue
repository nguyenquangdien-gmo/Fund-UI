<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import axiosInstance from '@/router/Interceptor'
import Button from 'primevue/button'

const token = localStorage.getItem('accessToken')
const loading = ref(true)
const searchQuery = ref('')
const allItems = ref([])

const fundOptions = ref([
  { label: 'Quỹ chung', value: 'COMMON' },
  { label: 'Quỹ ăn vặt', value: 'SNACK' },
])

const selectedFundType = ref(null)
// Confirmation dialog state
const showConfirmDialog = ref(false)
const confirmDialogMessage = ref('')
const selectedItemToConfirm = ref(null)
const confirmAction = ref(null)
const errorMessage = ref('')

// Fetch all data and combine into one list
const fetchAllData = async () => {
  try {
    loading.value = true
    if (!token) throw new Error('Unauthorized')

    // Fetch all three types of data in parallel
    const [invoicesResponse, contributionsResponse, penBillsResponse] = await Promise.all([
      axiosInstance.get(`/invoices/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axiosInstance.get(`/contributions/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axiosInstance.get(`/pen-bills/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    // Transform invoices data
    const invoicesData = invoicesResponse.data.map((item) => ({
      ...item,
      itemType: 'invoice',
      displayName: item.name,
      displayAmount: item.amount,
      displayStatus: item.status,
      displayDate: item.createdAt,
      typeSeverity: item.invoiceType === 'INCOME' ? 'success' : 'danger',
      typeLabel: item.invoiceType === 'INCOME' ? 'Phiếu thu' : 'Phiếu chi',
      sortOrder: isPending(item.status) ? 0 : 1, // Pending items get priority
    }))

    // Transform contributions data
    const contributionsData = contributionsResponse.data.map((item) => ({
      ...item,
      itemType: 'contribution',
      displayName: item.memberName,
      displayAmount: item.totalAmount,
      displayStatus: item.paymentStatus,
      displayDate: new Date().toISOString(), // Default to current date if not available
      typeSeverity: 'info',
      typeLabel: 'Đóng quỹ',
      sortOrder: isPending(item.paymentStatus) ? 0 : 1, // Pending items get priority
    }))

    // Transform penalty bills data
    const penBillsData = penBillsResponse.data.map((item) => ({
      ...item,
      itemType: 'penBill',
      displayName: item.userDto?.fullName || 'N/A',
      displayAmount: item.amount,
      displayStatus: item.paymentStatus,
      displayDate: new Date().toISOString(), // Default to current date if not available
      typeSeverity: 'warn',
      typeLabel: 'Nộp phạt',
      sortOrder: isPending(item.paymentStatus) ? 0 : 1, // Pending items get priority
    }))

    // Combine all data
    allItems.value = [...invoicesData, ...contributionsData, ...penBillsData]
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Helper function to check if status is pending
const isPending = (status) => {
  return status === 'PENDING'
}

onMounted(() => {
  fetchAllData()
})

// Filter and sort function for combined list - now puts pending items first
const filteredItems = computed(() => {
  let items = allItems.value

  // Apply search filter if query exists
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter((item) => {
      // Common fields to search in
      if (item.id && item.id.toString().includes(query)) return true
      if (item.displayName && item.displayName.toLowerCase().includes(query)) return true

      // Item-specific fields
      if (item.itemType === 'invoice') {
        return (
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.name && item.name.toLowerCase().includes(query))
        )
      } else if (item.itemType === 'contribution') {
        return item.periodName && item.periodName.toLowerCase().includes(query)
      } else if (item.itemType === 'penBill') {
        return (
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.penalty?.name && item.penalty.name.toLowerCase().includes(query))
        )
      }

      return false
    })
  }

  // Sort by sortOrder (pending first) and then by date (newest first)
  return items.sort((a, b) => {
    // First sort by pending status
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }

    // Then sort by date (newest first)
    const dateA = new Date(a.displayDate)
    const dateB = new Date(b.displayDate)
    return dateB - dateA
  })
})

const formatCurrency = (value) => value.toLocaleString() + ' VND'

// Get status label and severity for any item type
const getStatusLabel = (item) => {
  const status = item.displayStatus

  if (item.itemType === 'invoice') {
    return status === 'APPROVED' ? 'Đã duyệt' : status === 'CANCELLED' ? 'Bị hủy' : 'Đang chờ'
  } else {
    return status === 'PAID'
      ? 'Đã thanh toán'
      : status === 'CANCELED'
        ? 'Bị hủy'
        : status === 'LATE'
          ? 'Trễ hạn'
          : 'Đang chờ'
  }
}

const getStatusSeverity = (item) => {
  const status = item.displayStatus

  if (item.itemType === 'invoice') {
    return status === 'APPROVED' ? 'success' : status === 'PENDING' ? 'info' : 'secondary'
  } else {
    return status === 'PAID'
      ? 'success'
      : status === 'PENDING'
        ? 'info'
        : status === 'LATE'
          ? 'warn'
          : 'secondary'
  }
}

const getItemDescription = (item) => {
  if (item.itemType === 'invoice') {
    return item.description || '-'
  } else if (item.itemType === 'contribution') {
    return item.periodName || '-'
  } else if (item.itemType === 'penBill') {
    return item.description || '-'
  }
  return ''
}

const validateForm = (action, item) => {
  errorMessage.value = ''

  if (action === 'confirm' && item.itemType === 'invoice' && !selectedFundType.value) {
    errorMessage.value = 'Vui lòng chọn quỹ trước khi phê duyệt!'
    return false
  }

  return true
}

// Unified action handler
const handleConfirmAction = async () => {
  if (!selectedItemToConfirm.value) return

  const item = selectedItemToConfirm.value
  const action = confirmAction.value

  if (!validateForm(action, item)) return

  try {
    loading.value = true

    let endpoint = ''
    let method = 'post'
    let params = {}

    if (item.itemType === 'invoice') {
      endpoint =
        action === 'confirm' ? `/invoices/${item.id}/approve` : `/invoices/${item.id}/reject`
      method = 'put'

      if (action === 'confirm') {
        params = { fundType: selectedFundType.value }
      }
    } else if (item.itemType === 'contribution') {
      endpoint =
        action === 'confirm'
          ? `/contributions/${item.id}/approve`
          : `/contributions/${item.id}/reject`
      method = 'post'
    } else if (item.itemType === 'penBill') {
      endpoint =
        action === 'confirm' ? `/pen-bills/${item.id}/approve` : `/pen-bills/${item.id}/reject`
      method = 'post'
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    if (method === 'put') {
      if (Object.keys(params).length > 0) {
        await axiosInstance.put(
          `${endpoint}?fundType=${encodeURIComponent(params.fundType)}`,
          {},
          { headers },
        )
      } else {
        await axiosInstance.put(endpoint, {}, { headers })
      }
    } else {
      await axiosInstance.post(endpoint, {}, { headers })
    }

    fetchAllData()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
    showConfirmDialog.value = false
    selectedFundType.value = null
  }
}

// Open confirmation dialog
const openConfirmDialog = (item, action) => {
  selectedItemToConfirm.value = item
  confirmAction.value = action
  confirmDialogMessage.value =
    action === 'confirm'
      ? 'Bạn có chắc chắn muốn phê duyệt không?'
      : 'Bạn có chắc chắn muốn hủy không?'

  if (action === 'confirm' && item.itemType === 'invoice') {
    selectedFundType.value = null
  }

  showConfirmDialog.value = true
}

// Helper to check if item can be approved/rejected
const canPerformAction = (item) => {
  if (item.itemType === 'invoice') {
    return item.status !== 'APPROVED' && item.status !== 'CANCELLED'
  } else {
    return (
      item.paymentStatus !== 'PAID' &&
      item.paymentStatus !== 'CANCELED' &&
      item.paymentStatus !== 'LATE'
    )
  }
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Quản lý phê duyệt</h2>

    <div class="mb-4 flex items-center gap-4">
      <InputText
        v-model="searchQuery"
        placeholder="Tìm kiếm theo tên or mô tả..."
        class="p-inputtext w-64"
        style="width: 20%"
      />
      <!-- <div class="ml-auto">
                <Tag value="Đang chờ" severity="info" class="mr-2" />
                <span class="text-sm">: Ưu tiên hiển thị</span>
            </div> -->
    </div>

    <p v-if="loading">Đang tải dữ liệu...</p>

    <!-- Unified Approval Table -->
    <DataTable
      v-if="filteredItems.length > 0"
      :value="filteredItems"
      class="p-datatable"
      paginator
      :rows="15"
      :rowsPerPageOptions="[15, 20, 25]"
      responsiveLayout="scroll"
      :rowClass="(data) => (isPending(data.displayStatus) ? 'bg-blue-50' : '')"
    >
      <Column header="STT" sortable>
        <template #body="{ index }">
          {{ index + 1 }}
        </template>
      </Column>
      <Column field="displayName" header="Tên" sortable />
      <Column header="Loại" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.typeLabel" :severity="slotProps.data.typeSeverity" />
        </template>
      </Column>
      <Column header="Mô tả" sortable>
        <template #body="slotProps">
          {{ getItemDescription(slotProps.data) }}
        </template>
      </Column>
      <Column header="Trạng thái" sortable style="text-align: center">
        <template #body="slotProps">
          <Tag
            :value="getStatusLabel(slotProps.data)"
            :severity="getStatusSeverity(slotProps.data)"
          />
        </template>
      </Column>
      <Column header="Số tiền" sortable>
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.displayAmount) }}
        </template>
      </Column>
      <Column field="displayDate" header="Ngày tạo" sortable>
        <template #body="slotProps">
          {{ new Date(slotProps.data.displayDate).toLocaleDateString('vi-VN') }}
        </template>
      </Column>
      <Column header="Hành động" style="width: 22%">
        <template #body="{ data }">
          <Button
            label="Xác nhận"
            icon="pi pi-check"
            severity="success"
            @click="openConfirmDialog(data, 'confirm')"
            :hidden="!canPerformAction(data)"
          />
          <Button
            label="Hủy"
            icon="pi pi-times"
            severity="danger"
            class="ml-2 left-10"
            @click="openConfirmDialog(data, 'cancel')"
            :hidden="!canPerformAction(data)"
          />
        </template>
      </Column>
    </DataTable>

    <div v-else>
      <p class="text-center">Chưa có bất kỳ đơn nào cần phê duyệt.</p>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog v-model:visible="showConfirmDialog" header="Xác nhận" modal :style="{ width: '350px' }">
      <div class="confirmation-content">
        <span>{{ confirmDialogMessage }}</span>
      </div>

      <div
        v-if="
          selectedItemToConfirm &&
          selectedItemToConfirm.itemType === 'invoice' &&
          confirmAction === 'confirm'
        "
        class="mt-3"
      >
        <label for="fundType" class="block mb-2">
          Chọn quỹ: <span class="text-danger">*</span>
        </label>
        <Dropdown
          id="fundType"
          v-model="selectedFundType"
          :options="fundOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Chọn quỹ"
          class="w-full"
        />
        <div>
          <small class="text-danger">{{ errorMessage }}</small>
        </div>
      </div>

      <template #footer>
        <Button
          label="Không"
          icon="pi pi-times"
          @click="showConfirmDialog = false"
          severity="secondary"
        />
        <Button label="Có" icon="pi pi-check" @click="handleConfirmAction" severity="primary" />
      </template>
    </Dialog>
  </div>
</template>

<style>
:global(.p-button) {
  margin-left: 10px;
}
.left-10 {
  margin-left: 10px;
}

#fundType {
  margin-top: 10px;
  width: 90%;
  margin-left: 10px;
}

/* Highlight pending rows */
.bg-blue-50 {
  background-color: #eff6ff !important;
}
.p-tag {
  width: 90%;
}
</style>
