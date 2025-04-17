<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-xl">Danh sách chưa hoàn thành khỏa sát</h2>
      <h4 class="text-center">
        {{ reminder.title }}
      </h4>
      <div class="mb-3">
        <InputText
          v-if="survey.length > 0"
          v-model="searchQuery"
          placeholder="Tìm kiếm theo Mã NV, tên thành viên, trạng thái..."
          class="w-full p-inputtext-sm"
          style="width: 20%"
        />
        <!-- <Button
          class="left-10"
          label="Tạo phiếu thu"
          severity="success"
          raised
          size="small"
          @click="openCreateDialog"
        /> -->
      </div>
      <DataTable
        v-if="survey.length > 0"
        :value="filteredSurveys"
        paginator
        :first="first"
        @page="onPage"
        :rows="15"
        :rowsPerPageOptions="[15, 20, 25]"
        class="p-datatable-sm"
      >
        <Column header="STT">
          <template #body="{ index }">
            {{ first + index + 1 }}
          </template>
        </Column>
        <Column field="userId" header="Mã nhân viên" sortable></Column>
        <Column field="fullName" header="Tên thành viên" sortable></Column>
        <Column field="completed" header="Trạng thái" sortable>
          <template #body="{ data }">
            <Tag :severity="data.completed ? 'success' : 'danger'" style="width: 50%">
              {{ data.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành' }}
            </Tag>
          </template>
        </Column>
        <Column field="finishedAt" header="Ngày hoàn thành" sortable>
          <template #body="{ data }">
            <div v-if="data.finishedAt">
              {{ formatDate(data.finishedAt) }}
            </div>
            <div v-else>Chưa hoàn thành</div>
          </template>
        </Column>
        <!-- <Column header="Actions">
          <template #body="{ data }">
            <Button
              label="Sửa"
              icon="pi pi-pencil"
              severity="info"
              @click="openUpdateDialog(data)"
            />
            <Button label="Xóa" icon="pi pi-trash" severity="danger" @click="confirmDeleteSurvey(data)" />
          </template>
        </Column> -->
      </DataTable>
    </div>
  </div>

  <!-- <Dialog
    v-model:visible="showSurveyDialog"
    modal
    :header="isUpdate ? 'Cập nhật' : 'Tạo'"
    :style="{ width: '30rem' }"
    @hide="resetErrors"
  >
    <div class="mb-3">
      <label for="month" class="fw-bold"> Tháng <span class="text-danger">*</span> </label>
      <Dropdown
        id="month"
        v-model="form.month"
        :options="months"
        optionLabel="label"
        optionValue="value"
        class="w-100"
      />
      <small class="text-danger" v-if="errors.month">{{ errors.month }}</small>
    </div>
    <div class="mb-3">
      <label for="year" class="fw-bold"> Năm <span class="text-danger">*</span> </label>
      <InputText
        id="year"
        type="number"
        v-model="form.year"
        class="w-100"
        autocomplete="off"
        disabled
      />
      <small class="text-danger" v-if="errors.year">{{ errors.year }}</small>
    </div>
    <div class="mb-3">
      <label for="deadline" class="fw-bold"> Thời hạn <span class="text-danger">*</span> </label>
      <Calendar id="deadline" v-model="form.deadline" class="w-100" showIcon />
      <small class="text-danger" v-if="errors.deadline">{{ errors.deadline }}</small>
    </div>
    <div class="mb-3">
      <label for="description" class="fw-bold"> Mô Tả <span class="text-danger">*</span> </label>
      <InputText id="description" v-model="form.description" class="w-100" autocomplete="off" />
      <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
    </div>
    <div class="d-flex justify-content-end gap-2">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        @click="showSurveyDialog = false"
      ></Button>
      <Button type="button" label="Save" severity="primary" @click="saveSurvey"></Button>
    </div>
  </Dialog> -->
  <!-- 
  <Dialog
    v-model:visible="showConfirmDialog"
    modal
    header="Xác nhận xóa"
    :style="{ width: '25rem' }"
  >
    <div>Bạn có chắc chắn muốn xóa quỹ này?</div>
    <div class="d-flex justify-content-end gap-2 mt-3">
      <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
      <Button label="Xóa" severity="danger" @click="deleteSurvey" />
    </div>
  </Dialog> -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import axiosInstance from '@/router/Interceptor'
import { useRoute, useRouter } from 'vue-router'
import type { Survey } from '@/types/Survey'
import Tag from 'primevue/tag'

//pagenation
const first = ref<number>(0)
const onPage = (event: { first: number }) => {
  first.value = event.first
}
// const baseURL = "http://localhost:8080/api/v1";
// const showConfirmDialog = ref(false)
// const surveyToDelete = ref<Survey | null>(null)
const token = localStorage.getItem('accessToken')
const survey = ref<Survey[]>([])
const searchQuery = ref('')
// const showSurveyDialog = ref(false)
// const isUpdate = ref(false)
// const form = ref({
//   userId: 0,
//   fullName: '',
//   completed: false,
//   finishedAt: new Date(),
// })

const router = useRouter()
const route = useRoute()
const reminderId = route.params.reminderId as string
const reminder = ref({
  title: '',
  description: '',
})

const fetchSurveys = async () => {
  try {
    const res = await axiosInstance.get(`reminders/${reminderId}`)
    reminder.value = {
      title: res.data.title,
      description: res.data.description,
    }
    const response = await axiosInstance.get(`reminders/${reminderId}/survey/status`)
    survey.value = response.data
    console.log('survey', survey.value)
  } catch (error) {
    console.error('Error fetching survey:', error)
  }
}

// validate
// const errors = ref({ userId: '', fullName: '', completed: '', finishedAt: '' })
// const validateForm = () => {

//   return Object.values(errors.value).every((err) => err === '')
// }

// const resetErrors = () => {
//   errors.value = { month: '', year: '', description: '', deadline: '' }
// }

const filteredSurveys = computed(() => {
  if (!searchQuery.value) return survey.value
  return survey.value.filter(
    (survey) =>
      survey.userId.toString().includes(searchQuery.value) ||
      survey.fullName.toString().includes(searchQuery.value) ||
      'Đã hoàn thành'.includes(searchQuery.value) ||
      'Chưa hoàn thành'.includes(searchQuery.value),
  )
})

// const openCreateDialog = () => {
//   form.value = {
//     id: 0,
//     month: 1,
//     year: new Date().getFullYear().toString(),
//     deadline: new Date(),
//     description: '',
//   }
//   isUpdate.value = false
//   showSurveyDialog.value = true
// }

// const openUpdateDialog = (survey: Survey) => {
//   form.value = {
//     id: survey.id,
//     month: survey.month,
//     year: survey.year.toString(),
//     deadline: new Date(survey.deadline),
//     description: survey.description,
//   }
//   isUpdate.value = true
//   showSurveyDialog.value = true
// }

// const confirmDeleteSurvey = (survey: survey) => {
//     periodToDelete.value = survey;
//     showConfirmDialog.value = true;
// };

// const saveSurvey = async () => {
//   try {
//     if (!validateForm()) return
//     const periodData = { ...form.value, deadline: form.value.deadline.toISOString().split('T')[0] }
//     if (isUpdate.value) {
//       await axiosInstance.put(`/survey/${form.value.id}`, periodData, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//     } else {
//       await axiosInstance.post(`/survey`, periodData, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//     }
//     showSurveyDialog.value = false
//     fetchSurveys()
//   } catch (error) {
//     console.error('Error saving survey:', error)
//   }
// }

// const deleteSurvey = async () => {
//   if (!periodToDelete.value) return
//   try {
//     await axiosInstance.delete(`/survey/${periodToDelete.value.id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//     fetchSurveys()
//   } catch (error) {
//     console.error('Error deleting survey:', error)
//   } finally {
//     showConfirmDialog.value = false
//     periodToDelete.value = null
//   }
// }

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

onMounted(() => {
  if (!token) {
    router.push('/')
  } else {
    fetchSurveys()
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
