<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-xl">Danh sách phiếu phạt</h2>
      <div class="mb-3">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm theo id, tên..."
          class="w-full p-inputtext-sm"
        />
        <Button
          label="Tạo quỹ phạt"
          severity="success"
          class="left-10"
          raised
          size="small"
          @click="openCreateDialog"
        />
      </div>
      <DataTable
        :value="filteredPeriods"
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
        <Column field="name" header="Tên quỹ phạt" sortable></Column>
        <Column field="description" header="Mô tả" sortable>
          <template #body="{ data }">
            {{ data.description !== '' ? data.description : '-' }}
          </template>
        </Column>
        <Column field="amount" header="Tổng cộng" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.amount) }}
          </template>
        </Column>
        <Column field="created" header="Ngày tạo" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <Column field="slug" header="Slug" sortable></Column>
        <Column header="Actions">
          <template #body="{ data }">
            <Button
              label="Sửa"
              icon="pi pi-pencil"
              severity="info"
              @click="openUpdateDialog(data)"
            />
            <Button
              label="Xóa"
              icon="pi pi-trash"
              class="left-10"
              severity="danger"
              @click="confirmDeletePenalty(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <Dialog
    v-model:visible="showConfirmDialog"
    modal
    header="Xác nhận xóa"
    :style="{ width: '25rem' }"
  >
    <div>Bạn có chắc chắn muốn xóa quỹ phạt này?</div>
    <div class="d-flex justify-content-end gap-2 mt-3">
      <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
      <Button label="Xóa" severity="danger" @click="deletePenalty" />
    </div>
  </Dialog>

  <Dialog
    v-model:visible="showPenaltyDialog"
    modal
    :header="isUpdate ? 'Cập nhật' : 'Tạo'"
    @hide="resetErrors"
    :style="{ width: '30rem' }"
  >
    <div class="mb-3">
      <label for="id" class="fw-bold"> Tên quỹ <span class="text-danger">*</span> </label>
      <InputText id="name" type="text" v-model="form.name" class="w-100" autocomplete="off" />
      <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
    </div>
    <div class="mb-3">
      <label for="description" class="fw-bold"> Mô tả</label>
      <InputText
        id="description"
        type="text"
        v-model="form.description"
        class="w-100"
        autocomplete="off"
      />
    </div>
    <div class="mb-3">
      <label for="slug" class="fw-bold"> Slug <span class="text-danger">*</span> </label>
      <InputText id="slug" type="text" v-model="form.slug" class="w-100" autocomplete="off" />
      <small class="text-danger" v-if="errors.slug">{{ errors.slug }}</small>
    </div>
    <div class="mb-3">
      <label for="amount" class="fw-bold"> Tổng tiền <span class="text-danger">*</span> </label>
      <InputNumber
        id="amount"
        v-model="form.amount"
        mode="currency"
        currency="VND"
        class="w-100"
        locale="en-US"
        :min="0"
      />
      <small class="text-danger" v-if="errors.amount">{{ errors.amount }}</small>
    </div>
    <div class="d-flex justify-content-end gap-2">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        @click="showPenaltyDialog = false"
      ></Button>
      <Button type="button" label="Save" severity="primary" @click="savePenalty"></Button>
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
import type Penalty from '@/types/Penalty'

// const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false)
const penaltyDelete = ref<Penalty | null>(null)
const token = localStorage.getItem('accessToken')
const penalties = ref<Penalty[]>([])
const searchQuery = ref('')
const showPenaltyDialog = ref(false)
const isUpdate = ref(false)
const form = ref({ id: 0, name: '', description: '', amount: 0, slug: '' })
const router = useRouter()
const errors = ref({ name: '', amount: '', slug: '' })

//pagenation
const first = ref<number>(0)
const onPage = (event: { first: number }) => {
  first.value = event.first
}
const fetchPenalties = async () => {
  try {
    const response = await axiosInstance.get(`/penalties`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    penalties.value = response.data
  } catch (error) {
    console.error('Error fetching periods:', error)
  }
}

const validateForm = () => {
  errors.value = { name: '', amount: '', slug: '' }

  if (!form.value.name) errors.value.name = 'Vui lòng nhập tên quỹ phạt!'
  if (!form.value.amount || isNaN(Number(form.value.amount)))
    errors.value.amount = 'Vui lòng nhập số tiền hợp lệ!'
  if (!form.value.slug) errors.value.slug = 'Vui lòng nhập slug!'

  return Object.values(errors.value).every((err) => err === '')
}

const resetErrors = () => {
  errors.value = { name: '', amount: '', slug: '' }
}

const filteredPeriods = computed(() => {
  if (!searchQuery.value) return penalties.value
  return penalties.value.filter(
    (pen) => pen.name.includes(searchQuery.value) || pen.id.toString().includes(searchQuery.value),
  )
})

const openCreateDialog = () => {
  form.value = { id: 0, name: '', description: '', amount: 0, slug: '' }
  isUpdate.value = false
  showPenaltyDialog.value = true
}

const openUpdateDialog = (penalty: Penalty) => {
  form.value = {
    id: penalty.id,
    name: penalty.name,
    description: penalty.description,
    slug: penalty.slug,
    amount: penalty.amount,
  }
  isUpdate.value = true
  showPenaltyDialog.value = true
}

const confirmDeletePenalty = (pen: Penalty) => {
  penaltyDelete.value = pen
  showConfirmDialog.value = true
}

const savePenalty = async () => {
  if (!validateForm()) return
  try {
    const penaltyData = { ...form.value }
    if (isUpdate.value) {
      await axiosInstance.put(`/penalties/${form.value.id}`, penaltyData, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } else {
      await axiosInstance.post(`/penalties`, penaltyData, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
    showPenaltyDialog.value = false
    fetchPenalties()
  } catch (error) {
    console.error('Error saving penalty:', error)
  }
}

const deletePenalty = async () => {
  if (!penaltyDelete.value) return
  try {
    await axiosInstance.delete(`/penalties/${penaltyDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchPenalties()
  } catch (error) {
    console.error('Error deleting period:', error)
  } finally {
    showConfirmDialog.value = false
    penaltyDelete.value = null
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
    fetchPenalties()
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
