<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-center text-xl">DANH SÁCH THU CHI</h2>
      <div class="mb-3">
        <InputText v-if="invoices.length > 0" v-model="searchQuery" placeholder="Tìm kiếm theo tên chi tiêu..."
          style="width: 20%" class="w-full p-inputtext-sm" />
        <Button label="Tạo phiếu" class="btn-create" severity="success" raised size="small" @click="openCreateDialog" />
      </div>
      <DataTable v-if="invoices.length > 0" :value="filteredInvoice" paginator :rows="10" :first="first" @page="onPage"
        :rowsPerPageOptions="[10, 50, 100]" class="p-datatable-sm">
        <Column header="STT" sortable>
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>

        <Column field="description" header="Mô tả" sortable>
          <template #body="{ data }">
            {{ data.description !== '' ? data.description : '-' }}
          </template>
        </Column>
        <Column field="amount" header="Số Tiền" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.amount) }}
          </template>
        </Column>
        <Column field="invoiceType" header="Loại" sortable>
          <template #body="{ data }">
            <Tag :value="getInvoiceTypeLabel(data.invoiceType)" :severity="getInvoiceTypeSeverity(data.invoiceType)" />
          </template>
        </Column>
        <Column field="status" header="Trạng thái" sortable>
          <template #body="{ data }">
            <Tag :value="getInvoiceStatusLabel(data.status)" :severity="getInvoiceStatusSeverity(data.status)" />
          </template>
        </Column>
        <!-- <Column field="userId" header="Tạo bởi" sortable></Column> -->
        <Column field="createdAt" header="Ngày Tạo" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <Column header="Actions" style="width: 20%">
          <template #body="{ data }">
            <Button label="Sửa" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)"
              :hidden="data.status === 'APPROVED' || data.status === 'CANCELLED'" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteInvoice(data)"
              style="margin-left: 10px" :hidden="data.status === 'APPROVED' || data.status === 'CANCELLED'" />
            <p v-if="data.status === 'APPROVED' || data.status === 'CANCELLED'">Đã duyệt</p>
          </template>
        </Column>
      </DataTable>
      <div v-else>
        <p class="text-center">Không tìm thấy phiếu chi nào</p>
      </div>
    </div>
  </div>
  <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
    <div>Bạn có chắc chắn muốn xóa quỹ này?</div>
    <div class="d-flex justify-content-end gap-2 mt-3">
      <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
      <Button label="Xóa" severity="danger" @click="deleteInvoice" />
    </div>
  </Dialog>

  <Dialog v-model:visible="showInvoice" modal :header="isUpdate ? 'Cập nhật' : 'Tạo'" @hide="resetErrors"
    :style="{ width: '30rem' }">
    <div class="mb-3">
      <label for="name" class="fw-bold">Tên</label>
      <InputText id="name" v-model="user.fullName" class="w-100" autocomplete="off" disabled />
    </div>
    <div class="mb-3">
      <label for="description" class="fw-bold">Mô tả<span class="text-danger">*</span></label>
      <InputText id="description" v-model="form.description" class="w-100" autocomplete="off" />
      <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
    </div>
    <div class="mb-3">
      <label for="amount" class="fw-bold">Số tiền<span class="text-danger">*</span></label>
      <InputNumber id="amount" v-model="form.amount" mode="currency" currency="VND" class="w-100" locale="en-US"
        :min="0" />
      <small class="text-danger" v-if="errors.amount">{{ errors.amount }}</small>
    </div>
    <div class="mb-3">
      <label for="type" class="fw-bold">Loại quỹ<span class="text-danger">*</span></label>
      <Dropdown v-model="selectedType" :options="types" optionLabel="label" optionValue="value"
        placeholder="Chọn loại quỹ" class="w-100 md:w-56" />
      <small class="text-danger" v-if="errors.type">{{ errors.type }}</small>
    </div>
    <div class="mb-3">
      <label class="fw-bold">Hóa đơn<span class="text-danger">*</span></label>
      <FileUpload mode="basic" accept="image/*" customUpload @select="handleInvoiceUpload" />
      <div class="avatar-image">
        <img v-if="billImage" :src="billImage" class="avatar-preview" />
      </div>
      <small class="text-danger" v-if="errors.billImage">{{ errors.billImage }}</small>
    </div>
    <div class="d-flex justify-content-end gap-2">
      <Button type="button" label="Cancel" severity="secondary" @click="showInvoice = false"></Button>
      <Button type="button" label="Save" severity="primary" @click="saveInvoice"></Button>
    </div>
  </Dialog>
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
import formatCurrency from '@/utils/FormatCurrency'
import { useUserStore } from '@/pinia/userStore'
import Dropdown from 'primevue/dropdown'
import InvoiceType from '@/types/InvoiceType'
import Tag from 'primevue/tag'
import type FundType from '@/types/FundType'
import FileUpload from 'primevue/fileupload'

// const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false)
const invoiceToDelete = ref<Invoice | null>(null)
const token = localStorage.getItem('accessToken')
const invoices = ref<Invoice[]>([])
const searchQuery = ref('')
const showInvoice = ref(false)
const isUpdate = ref(false)
const form = ref({ id: 0, invoiceType: '', description: '', userId: 0, amount: 0, billImage: null as string | null })
const errors = ref({ description: '', type: '', amount: '', billImage: '' })
const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)
const billImage = ref<string | null>(null)

//pagenation
const first = ref<number>(0)

const onPage = (event: { first: number }) => {
  first.value = event.first
}
const selectedType = ref<InvoiceType | null>(null)
const types = ref([
  { label: 'Quỹ thu', value: InvoiceType.INCOME },
  { label: 'Quỹ chi', value: InvoiceType.EXPENSE },
])
// const status = ref([
//   { label: 'Chưa duyệt', value: InvoiceType.INCOME },
//   { label: 'Đã duyệt', value: InvoiceType.EXPENSE },
//   { label: 'Bị hủy', value: InvoiceType.EXPENSE },
// ])

interface Invoice {
  id: number
  name: string
  description: string
  userId: number
  amount: number
  invoiceType: InvoiceType
  fundType: FundType
  createdAt: string
}

const getInvoiceStatusSeverity = (status: string) => {
  switch (
  status.toUpperCase() // Đảm bảo không phân biệt chữ hoa/thường
  ) {
    case 'PENDING':
      return 'info' // Chưa duyệt -> màu xanh dương
    case 'CANCELLED':
      return 'secondary' // Bị hủy -> màu xám
    case 'APPROVED':
      return 'success' // Đã duyệt -> màu xanh lá
    default:
      return 'warning' // Trạng thái không xác định -> màu vàng
  }
}
const getInvoiceTypeSeverity = (type: string) => {
  switch (
  type.toUpperCase() // Đảm bảo không phân biệt chữ hoa/thường
  ) {
    case 'EXPENSE':
      return 'warn'
    case 'INCOME':
      return 'success' // Chưa duyệt -> màu xanh dương
  }
}
const getInvoiceTypeLabel = (type: string) => {
  switch (
  type.toUpperCase() // Đảm bảo không phân biệt chữ hoa/thường
  ) {
    case 'EXPENSE':
      return 'Chi' // Chưa duyệt -> màu xanh dương
    default:
      return 'Thu' // Trạng thái không xác định -> màu vàng
  }
}
const getInvoiceStatusLabel = (status: string) => {
  switch (
  status.toUpperCase() // Đảm bảo không phân biệt chữ hoa/thường
  ) {
    case 'PENDING':
      return 'Chờ duyệt' // Chưa duyệt -> màu xanh dương
    case 'CANCELLED':
      return 'Đã hủy' // Bị hủy -> màu xám
    case 'APPROVED':
      return 'Đã duyệt' // Đã duyệt -> màu xanh lá
  }
}

const fetchInvoice = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/user/${user.value.id}`)
    invoices.value = response.data;

    console.log(invoices.value)
  } catch (error) {
    console.error('Error fetching invoices:', error)
  }
}

const filteredInvoice = computed(() => {
  if (!searchQuery.value) return invoices.value
  return invoices.value.filter((invoice) =>
    invoice.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

//handle upload image
const handleInvoiceUpload = (event: any) => {
  const file = event.files[0]
  if (file) {
    form.value.billImage = file
    billImage.value = URL.createObjectURL(file)
  }
}


const openCreateDialog = () => {
  form.value = { id: 0, userId: 0, description: '', invoiceType: '', amount: 0, billImage: null }
  isUpdate.value = false
  selectedType.value = null
  showInvoice.value = true
}

const openUpdateDialog = async (invoice: Invoice) => {
  try {
    const imageRes = await axiosInstance.get(`/invoices/${invoice.id}/bill-image`, {
      responseType: 'blob',
    })
    const image = new Blob([imageRes.data], { type: 'image/png' })
    billImage.value = URL.createObjectURL(image)
    console.log(billImage.value);

  } catch (error) {
    console.error('Error fetching image:', error)
  }
  form.value = {
    id: invoice.id,
    userId: user.value.id,
    description: invoice.description,
    invoiceType: invoice.invoiceType,
    amount: invoice.amount,
    billImage: billImage.value,
  }

  // Just use this line - set selectedType to the enum value directly
  selectedType.value = invoice.invoiceType === 'INCOME' ? InvoiceType.INCOME : InvoiceType.EXPENSE

  isUpdate.value = true
  showInvoice.value = true

  console.log(form.value)
}

const confirmDeleteInvoice = (invoice: Invoice) => {
  invoiceToDelete.value = invoice
  showConfirmDialog.value = true
}

const validateForm = () => {
  errors.value = { description: '', type: '', amount: '', billImage: '' }
  if (!form.value.description) errors.value.description = 'Vui lòng nhập mô tả về phí!'
  if (!selectedType.value) errors.value.type = 'Vui lòng chọn loại phí!'
  if (!form.value.billImage) {
    errors.value.billImage = 'Vui lòng upload hóa đơn làm bằng chứng!'
  }

  if (!form.value.amount || form.value.amount <= 0)
    errors.value.amount = 'Số tiền cần phải lớn hơn 0!'
  return Object.values(errors.value).every((err) => err === '')
}

const saveInvoice = async () => {
  if (!validateForm()) return

  try {
    if (selectedType.value) {
      form.value.invoiceType = selectedType.value.toString()
    }
    form.value.userId = user.value.id

    const formData = new FormData()

    const invoiceData = {
      invoiceType: form.value.invoiceType,
      description: form.value.description,
      userId: form.value.userId,
      amount: form.value.amount,
    }

    formData.append(
      'dto',
      new Blob([JSON.stringify(invoiceData)], { type: 'application/json' })
    )

    if (form.value.billImage && typeof form.value.billImage !== 'string') {
      formData.append('billImage', form.value.billImage)
    }

    if (isUpdate.value) {
      await axiosInstance.put(`/invoices/${form.value.id}/update`, formData)
    } else {
      await axiosInstance.post('/invoices', formData)
    }

    showInvoice.value = false
    fetchInvoice()
    resetForm()
    selectedType.value = null
    resetErrors()
    billImage.value = null
  } catch (error) {
    console.error('Error saving invoice:', error)
  }
}



const resetErrors = () => {
  errors.value = { description: '', type: '', amount: '', billImage: '' }
}

const resetForm = () => {
  form.value = { id: 0, userId: 0, description: '', invoiceType: '', amount: 0, billImage: null }
  selectedType.value = null
}

const deleteInvoice = async () => {
  if (!invoiceToDelete.value) return
  try {
    await axiosInstance.delete(`/invoices/${invoiceToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchInvoice()
  } catch (error) {
    console.error('Error deleting fund:', error)
  } finally {
    showConfirmDialog.value = false
    invoiceToDelete.value = null
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

onMounted(() => {
  if (!token) {
    router.push('/')
  } else {
    fetchInvoice()
  }
})
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}

.btn-create {
  margin-left: 10px;
}

.p-tag {
  width: 60%;
  text-align: center;
}
</style>
