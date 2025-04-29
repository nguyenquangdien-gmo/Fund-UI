<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">PHÊ DUYỆT</h2>

    <div class="mb-4 flex items-center">
      <InputText v-model="searchQuery" placeholder="Tìm kiếm theo tên or mô tả..." class="p-inputtext w-64 mr-3" />
      <Dropdown v-model="selectedType" :options="typeFilterOptions" optionLabel="label" optionValue="value"
        placeholder="Tất cả loại" class="w-48" />
    </div>

    <p v-if="loading">Đang tải dữ liệu...</p>

    <!-- Unified Approval Table -->
    <DataTable v-if="filteredItems.length > 0" :value="filteredItems" class="p-datatable" paginator :first="first"
      @page="onPage" :rows="10" :rowsPerPageOptions="[10, 50, 100]" responsiveLayout="scroll"
      :rowClass="(data) => (isPending(data.displayStatus) ? 'bg-blue-50' : '')">
      <Column header="STT" sortable>
        <template #body="{ index }">
          {{ first + index + 1 }}
        </template>
      </Column>
      <Column field="displayName" header="Tên" sortable />
      <Column field="typeLabel" header="Loại" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.typeLabel" :severity="slotProps.data.typeSeverity" />
        </template>
      </Column>
      <Column field="description" header="Mô tả" sortable>
        <template #body="slotProps">
          {{ getItemDescription(slotProps.data) }}
        </template>
      </Column>
      <Column field="displayStatus" header="Trạng thái" sortable style="text-align: center">
        <template #body="slotProps">
          <Tag :value="getStatusLabel(slotProps.data)" :severity="getStatusSeverity(slotProps.data)" />
        </template>
      </Column>
      <Column field="displayAmount" header="Số tiền" sortable>
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.displayAmount) }}
        </template>
      </Column>
      <Column field="displayDate" header="Ngày tạo" sortable>
        <template #body="slotProps">
          {{ new Date(slotProps.data.displayDate).toLocaleDateString('vi-VN') }}
        </template>
      </Column>
      <Column header="Hành động" style="width: 22%" v-if="hasActionableItems">
        <template #body="{ data }">
          <Button label="Xác nhận" icon="pi pi-check" severity="success" @click="openConfirmDialog(data, 'confirm')"
            :hidden="!canPerformAction(data)" />
          <Button label="Hủy" icon="pi pi-times" severity="danger" class="ml-2 left-10"
            @click="openConfirmDialog(data, 'cancel')" :hidden="!canPerformAction(data)" />
        </template>
      </Column>
    </DataTable>

    <div v-else>
      <p class="text-center">Chưa có bất kỳ đơn nào cần phê duyệt.</p>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog v-model:visible="showConfirmDialog" header="Xác nhận" modal :style="{ width: '17%' }">
      <div class="confirmation-content">
        <span>{{ confirmDialogMessage }}</span>

        <div class="flex col-2 mt-3" v-if="confirmAction !== 'confirm'">
          <label for="reason">Lý do<span class="text-danger">*</span></label>
          <Textarea v-model="rejectedReason" class="mt-3" rows="5" cols="30" />
        </div>
      </div>

      <div v-if="
        selectedItemToConfirm &&
        selectedItemToConfirm.itemType === 'invoice' &&
        confirmAction === 'confirm'
      " class="mt-3">
        <label for="fundType" class="block mb-2">
          Chọn quỹ: <span class="text-danger">*</span>
        </label>
        <Dropdown id="fundType" v-model="selectedFundType" :options="fundOptions" optionLabel="label"
          optionValue="value" placeholder="Chọn quỹ" class="w-full" />
        <div>
          <small class="text-danger">{{ errorMessage }}</small>
        </div>
        <label class="block mb-2 mt-3">
          QR:
        </label>
        <div class="avatar-image">
          <img v-if="qrCode" :src="qrCode" class="avatar-preview cursor-pointer" @click="zoomImage(qrCode)" />
        </div>
        <label class="block mb-2">
          Hóa đơn:
        </label>
        <div class="avatar-image">
          <img v-if="billImage" :src="billImage" class="avatar-preview cursor-pointer" @click="zoomImage(billImage)" />
        </div>
      </div>

      <template #footer>
        <Button label="Không" icon="pi pi-times" @click="showConfirmDialog = false" severity="secondary" />
        <Button label="Có" icon="pi pi-check" @click="handleConfirmAction" severity="primary" />
      </template>
    </Dialog>
    <Dialog v-model:visible="showImageDialog" class="image-preview" modal :closable="true" header="Xem ảnh"
      :style="{ width: '60vw' }">
      <img :src="zoomedImageSrc" class="w-full" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import axiosInstance from '@/router/Interceptor'
import formatDate from '@/utils/FormatDate'

// Define enums
enum InvoiceType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

enum FundType {
  COMMON = 'COMMON',
  SNACK = 'SNACK',
}

enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
  LATE = 'LATE',
}

enum InvoiceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

// Define interfaces
interface Invoice {
  id: number
  name: string
  description: string
  userId: number
  amount: number
  type: InvoiceType
  fundType: FundType
  createdAt: string
  status: InvoiceStatus
  user?: {
    fullName: string
  }
  invoiceType?: string
}

interface Contribution {
  id: number
  memberId: number
  memberName: string
  periodId: number
  periodName: string
  totalAmount: number
  paymentStatus: PaymentStatus
  note: string
  deadline: string
  isLate: boolean
  owedAmount: number
  overPaidAmount: number
  createdAt: string
}

interface PenBill {
  id: number
  penaltyId: string
  amount: number
  dueDate: string
  description: string
  status: string
  paymentStatus: PaymentStatus
  createdAt: string
  user?: {
    fullName: string
  }
  penalty?: {
    name: string
  }
}

interface FundOption {
  label: string
  value: FundType
}

interface TypeFilterOption {
  label: string
  value: string | null
}

interface DisplayItem {
  id: number
  itemType: 'invoice' | 'contribution' | 'penBill'
  displayName: string
  displayAmount: number
  displayStatus: string
  displayDate: string
  typeSeverity: string
  typeLabel: string
  sortOrder: number
  description?: string
  periodName?: string
  status?: string
  paymentStatus?: string
  user?: {
    id: number
    fullName: string
  }
  invoiceType?: string
  penalty?: {
    name: string
  }
  [key: string]: any // For additional properties
}

//zoom image
const showImageDialog = ref(false)
const zoomedImageSrc = ref('')

const zoomImage = (src: string) => {
  zoomedImageSrc.value = src
  showImageDialog.value = true
}

//qrcode of member

const qrCode = ref<string | null>(null)
const fetchQrCode = async (userId: number) => {
  try {
    const qrCodeRes = await axiosInstance.get(`/users/${userId}/qr-code`, {
      responseType: 'blob',
    })
    const blob = new Blob([qrCodeRes.data], { type: 'image/png' })
    qrCode.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error fetching QR code:', error)
  }
}

//bill image of invoice
const billImage = ref<string | null>(null)
const fetchBillImage = async (userId: number) => {
  try {
    const billRes = await axiosInstance.get(`/invoices/${userId}/bill-image`, {
      responseType: 'blob',
    })
    const blob = new Blob([billRes.data], { type: 'image/png' })
    billImage.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error fetching QR code:', error)
  }
}
//hide action button if no items to approve
const hasActionableItems = computed<boolean>(() => {
  return filteredItems.value.some((item) => canPerformAction(item))
})

// Component setup
const token = localStorage.getItem('accessToken')
const loading = ref<boolean>(true)
const searchQuery = ref<string>('')
const selectedType = ref<string | null>(null)
const allItems = ref<DisplayItem[]>([])

// Type filter options
const typeFilterOptions = ref<TypeFilterOption[]>([
  { label: 'Tất cả', value: null },
  { label: 'Phiếu thu', value: 'income' },
  { label: 'Phiếu chi', value: 'expense' },
  { label: 'Đóng quỹ', value: 'contribution' },
  { label: 'Nộp phạt', value: 'penBill' },
])

const fundOptions = ref<FundOption[]>([
  { label: 'Quỹ chung', value: FundType.COMMON },
  { label: 'Quỹ ăn vặt', value: FundType.SNACK },
])

const selectedFundType = ref<FundType | null>(null)
// Confirmation dialog state
const showConfirmDialog = ref<boolean>(false)
const confirmDialogMessage = ref<string>('')
const selectedItemToConfirm = ref<DisplayItem | null>(null)
const confirmAction = ref<'confirm' | 'cancel' | null>(null)
const errorMessage = ref<string>('')
const rejectedReason = ref<string>('')

//pagenation
const first = ref<number>(0)

const onPage = (event: { first: number }) => {
  first.value = event.first
}

// Fetch all data and combine into one list
const fetchAllData = async (): Promise<void> => {
  try {
    loading.value = true
    if (!token) throw new Error('Unauthorized')

    // Fetch all three types of data in parallel
    const [invoicesResponse, contributionsResponse, penBillsResponse] = await Promise.all([
      axiosInstance.get('/invoices/pending'),
      axiosInstance.get('/contributions/pending'),
      axiosInstance.get('/pen-bills/pending'),
    ])
    console.log('Penpill:', penBillsResponse.data)

    // Transform invoices data
    const invoicesData: DisplayItem[] = invoicesResponse.data.map((item: Invoice) => ({
      ...item,
      itemType: 'invoice',
      displayName: item.user?.fullName || 'N/A',
      displayAmount: item.amount,
      displayStatus: item.status,
      displayDate: item.createdAt,
      typeSeverity: item.invoiceType === 'INCOME' ? 'success' : 'danger',
      typeLabel: item.invoiceType === 'INCOME' ? 'Phiếu thu' : 'Phiếu chi',
      sortOrder: isPending(item.status) ? 0 : 1, // Pending items get priority
      // Add a property to filter by type
      filterType: item.invoiceType === 'INCOME' ? 'income' : 'expense',
    }))

    // Transform contributions data
    const contributionsData: DisplayItem[] = contributionsResponse.data.map(
      (item: Contribution) => ({
        ...item,
        itemType: 'contribution',
        displayName: item.memberName,
        displayAmount: item.totalAmount,
        displayStatus: item.paymentStatus,
        displayDate: item.createdAt,
        typeSeverity: 'info',
        typeLabel: 'Đóng quỹ',
        sortOrder: isPending(item.paymentStatus) ? 0 : 1, // Pending items get priority
        filterType: 'contribution',
      }),
    )

    // Transform penalty bills data
    const penBillsData: DisplayItem[] = penBillsResponse.data.map((item: PenBill) => ({
      ...item,
      itemType: 'penBill',
      displayName: item.user?.fullName || 'N/A',
      displayAmount: item.amount,
      displayStatus: item.paymentStatus,
      displayDate: item.createdAt,
      typeSeverity: 'warn',
      typeLabel: 'Nộp phạt',
      sortOrder: isPending(item.paymentStatus) ? 0 : 1, // Pending items get priority
      filterType: 'penBill',
    }))

    // Combine all data
    allItems.value = [...invoicesData, ...contributionsData, ...penBillsData]

    console.log('Combined Data:', allItems.value)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Helper function to check if status is pending
const isPending = (status: string): boolean => {
  return status === 'PENDING'
}

onMounted(() => {
  fetchAllData()
})

// Filter and sort function for combined list - now puts pending items first
const filteredItems = computed<DisplayItem[]>(() => {
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

  // Apply type filter if selected
  if (selectedType.value) {
    items = items.filter((item) => item.filterType === selectedType.value)
  }

  // Sort by sortOrder (pending first) and then by date (newest first)
  return items.sort((a, b) => {
    // Ưu tiên đơn phạt chưa duyệt lên đầu
    if (selectedType.value === null) {
      // Chỉ áp dụng khi xem tất cả loại
      // Nếu a là đơn phạt đang chờ và b không phải
      if (
        a.itemType === 'penBill' &&
        isPending(a.displayStatus) &&
        (b.itemType !== 'penBill' || !isPending(b.displayStatus))
      ) {
        return -1
      }
      // Nếu b là đơn phạt đang chờ và a không phải
      if (
        b.itemType === 'penBill' &&
        isPending(b.displayStatus) &&
        (a.itemType !== 'penBill' || !isPending(a.displayStatus))
      ) {
        return 1
      }
    }

    // Tiếp tục sắp xếp theo trạng thái pending
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }

    // Sau đó sắp xếp theo ngày (mới nhất lên đầu)
    const dateA = new Date(a.displayDate)
    const dateB = new Date(b.displayDate)
    return dateB.getTime() - dateA.getTime()
  })
})

const formatCurrency = (value: number): string => value.toLocaleString() + ' VND'

// Get status label and severity for any item type
const getStatusLabel = (item: DisplayItem): string => {
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

const getStatusSeverity = (item: DisplayItem): string => {
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

const getItemDescription = (item: DisplayItem): string => {
  if (item.itemType === 'invoice') {
    return item.description || '-'
  } else if (item.itemType === 'contribution') {
    return item.periodName || '-'
  } else if (item.itemType === 'penBill') {
    return item.description || '-'
  }
  return ''
}

const validateForm = (action: string, item: DisplayItem): boolean => {
  errorMessage.value = ''

  if (action === 'confirm' && item.itemType === 'invoice' && !selectedFundType.value) {
    errorMessage.value = 'Vui lòng chọn quỹ trước khi phê duyệt!'
    return false
  } else if (action !== 'confirm' && !rejectedReason.value) {
    errorMessage.value = 'Vui lòng nhập lý do từ chối!'
    return false
  }

  return true
}

// Unified action handler
const handleConfirmAction = async (): Promise<void> => {
  if (!selectedItemToConfirm.value) return

  const item = selectedItemToConfirm.value
  const action = confirmAction.value
  console.log('reason:', rejectedReason.value)

  if (!validateForm(action || '', item)) return

  try {
    loading.value = true

    let endpoint = ''
    let method: 'post' | 'put' = 'post'
    let params: { fundType?: FundType } = {}

    if (item.itemType === 'invoice') {
      endpoint =
        action === 'confirm' ? `/invoices/${item.id}/approve` : `/invoices/${item.id}/reject`
      method = 'put'

      if (action === 'confirm') {
        params = { fundType: selectedFundType.value as FundType }
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

    if (method === 'put') {
      if (Object.keys(params).length > 0) {
        await axiosInstance.put(
          `${endpoint}?fundType=${encodeURIComponent(params.fundType as string)}`,
          {
            reason: rejectedReason.value,
          },
        )
      } else {
        await axiosInstance.put(endpoint, { reason: rejectedReason.value })
      }
    } else {
      await axiosInstance.post(endpoint, { reason: rejectedReason.value })
    }

    fetchAllData()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
    showConfirmDialog.value = false
    selectedFundType.value = null
    rejectedReason.value = ''
  }
}

// Open confirmation dialog
const openConfirmDialog = (item: DisplayItem, action: 'confirm' | 'cancel'): void => {
  console.log('item:', item)
  if (item.user && item.user.id) {
    fetchQrCode(item.user.id)
  }
  selectedItemToConfirm.value = item
  confirmAction.value = action
  confirmDialogMessage.value =
    action === 'confirm'
      ? 'Bạn có chắc chắn muốn phê duyệt không?'
      : 'Bạn có chắc chắn muốn hủy không?'

  if (action === 'confirm' && item.itemType === 'invoice') {
    selectedFundType.value = null
    fetchBillImage(item.id)
  }


  rejectedReason.value = ''
  showConfirmDialog.value = true
}

// Helper to check if item can be approved/rejected
const canPerformAction = (item: DisplayItem): boolean => {
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

/* Add spacing between the search and dropdown */
.mr-3 {
  margin-right: 0.75rem;
}

.avatar-preview {
  margin-top: 5px;
  max-width: 100%;
  height: 100%;
  text-align: center;
  border-radius: 10px;
  object-fit: contain;
}

.avatar-image {
  text-align: center;
}

.image-preview {
  text-align: center;
  margin-top: 10px;
}
</style>
