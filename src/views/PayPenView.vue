<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-center">NỢ PHẠT</h2>
      <div v-if="bills.length > 0">
        <div class="mb-3">
          <div class="mb-3 flex gap-2">
            <Dropdown
              v-model="selectedMonth"
              :options="months"
              optionLabel="label"
              placeholder="Chọn tháng"
              class="w-1/2 p-inputtext-sm"
            />

            <Dropdown
              v-model="selectedYear"
              :options="years"
              optionLabel="label"
              placeholder="Chọn năm"
              class="w-1/2 p-inputtext-sm"
            />
          </div>

          <!-- <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" /> -->
        </div>
        <DataTable
          v-if="filteredBills.length > 0"
          :value="filteredBills"
          paginator
          :rows="15"
          :first="first"
          @page="onPage"
          :rowsPerPageOptions="[15, 20, 25]"
          class="p-datatable-sm"
        >
          <Column header="STT" sortable>
            <template #body="{ index }">
              {{ first + index + 1 }}
            </template>
          </Column>
          <Column field="description" header="Mô Tả" sortable></Column>
          <Column field="amount" header="Tổng cộng" sortable>
            <template #body="{ data }">
              {{ formatCurrency(data.amount) }}
            </template>
          </Column>

          <Column field="createdAt" header="Ngày tạo" sortable>
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }">
              <Button
                v-if="data.paymentStatus === 'UNPAID'"
                label="Đóng phạt"
                icon="pi pi-wallet"
                @click="confirmPay(data)"
                severity="info"
              />
              <Button
                v-if="data.paymentStatus === 'PENDING'"
                label="Chờ xác nhận"
                icon="pi pi-hourglass"
                severity="info"
                disabled
              />
              <!-- <Button v-else label="Đã đóng phạt" icon="pi pi-check-square" severity="success" disabled /> -->
            </template>
          </Column>
        </DataTable>
        <div v-else>
          <p>Bạn không có bất kỳ nợ phạt nào!🎉</p>
        </div>
      </div>
    </div>
  </div>

  <Dialog
    v-model:visible="showConfirmDialog"
    modal
    header="Xác nhận đóng phạt"
    style="text-align: center"
  >
    <div><img :src="qrCode" alt="Mã QR" class="w-full mt-4" /></div>

    <div class="d-flex justify-content-center gap-2">
      <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
      <Button label="Xác nhận" severity="primary" @click="payBill" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import axiosInstance from '@/router/Interceptor'
import { useRouter } from 'vue-router'
import formatCurrency from '@/utils/FormatCurrency'
import type PenBill from '@/types/PenBill'
import Dropdown from 'primevue/dropdown'

// const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false)
const token = localStorage.getItem('accessToken')
const bills = ref<PenBill[]>([])
const form = ref({ id: 0, userId: 0, penaltyId: 0, dueDate: '', description: '', amount: '' })
const router = useRouter()
const user = ref(JSON.parse(sessionStorage.getItem('user') || '{}'))

//fetch pen bill
const fetchBills = async () => {
  try {
    const response = await axiosInstance.get(`/pen-bills/user/${user.value.id}/unpaid`)
    bills.value = response.data
    console.log(bills.value)
  } catch (error) {
    console.error('Error fetching periods:', error)
  }
}

//pagenation
const first = ref<number>(0)

const onPage = (event: { first: number }) => {
  first.value = event.first
}

const qrCode = ref<string | undefined>(undefined)
const fetchTeam = async () => {
  try {
    if (!token) {
      throw new Error('Unauthorized')
    }

    const response = await axiosInstance.get(`/teams/${user.value.id}/team`)
    const qrResponse = await axiosInstance.get(`/teams/${response.data.slug}/qrcode`)
    const qrBlob = new Blob([qrResponse.data], { type: 'image/png' })
    qrCode.value = URL.createObjectURL(qrBlob)
    // team.value = response.data;
  } catch (err) {
    console.error(err)
  }
}

//filter by month and year
interface DropdownOption {
  label: string
  value: number
}

const selectedMonth = ref<DropdownOption | null>(null)
const selectedYear = ref<DropdownOption | null>(null)

const months = Array.from({ length: 12 }, (_, i) => ({
  label: `Tháng ${i + 1}`,
  value: i + 1,
}))

const currentYear = new Date().getFullYear()
const startYear = 2022

const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => ({
  label: `${startYear + i}`,
  value: startYear + i,
}))

// In your filteredBills computed property
const filteredBills = computed(() => {
  return bills.value.filter((bill) => {
    const created = new Date(bill.createdAt)
    const billMonth = created.getMonth() + 1
    const billYear = created.getFullYear()

    // Check if selectedMonth is null or if it contains the value property
    const monthValue = selectedMonth.value?.value || null
    const yearValue = selectedYear.value?.value || null

    const matchMonth = monthValue ? billMonth === monthValue : true
    const matchYear = yearValue ? billYear === yearValue : true

    return matchMonth && matchYear
  })
})
const confirmPay = (bill: PenBill) => {
  form.value = {
    id: bill.id,
    userId: user.value.id,
    penaltyId: Number(bill.penaltyId),
    dueDate: bill.dueDate,
    description: bill.description,
    amount: bill.amount.toString(),
  }
  showConfirmDialog.value = true
}

const payBill = async () => {
  const billData = {
    userId: Number(form.value.userId),
    penaltyId: Number(form.value.penaltyId),
    dueDate: form.value.dueDate,
    amount: Number(form.value.amount),
    description: form.value.description,
  }
  try {
    await axiosInstance.put(`/pen-bills/${form.value.id}`, billData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    showConfirmDialog.value = false
    fetchBills()
  } catch (error) {
    console.error('Error saving period:', error)
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
    const now = new Date()
    selectedMonth.value = months.find((month) => month.value === now.getMonth() + 1) || null
    selectedYear.value = years.find((year) => year.value === currentYear) || null
    fetchBills()
    fetchTeam()
  }
})
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}

.text-xl {
  text-align: center;
  font: 2em sans-serif;
}
.p-select {
  margin-right: 5px;
}
</style>
