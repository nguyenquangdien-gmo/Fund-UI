<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-xl">NHÓM</h2>
      <div class="mb-3 flex justify-between">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm theo tên team..."
          class="w-full p-inputtext-sm"
        />
        <Button
          label="Tạo team"
          severity="success"
          class="btn"
          raised
          size="small"
          @click="openCreateDialog"
          style="margin-left: 10px; padding-top: 5px"
        />
      </div>
      <DataTable
        :value="filteredTeams"
        paginator
        :first="first"
        @page="onPage"
        :rows="10"
        :rowsPerPageOptions="[10, 20, 30]"
        class="p-datatable-sm"
      >
        <Column header="STT">
          <template #body="{ index }">
            {{ first + index + 1 }}
          </template>
        </Column>

        <Column field="name" header="Tên Team" sortable style="width: 20%"></Column>
        <Column field="slug" header="Slug" sortable></Column>
        <Column header="QR Code" style="width: 20%">
          <template #body="{ data }">
            <img v-if="data.qrCodeUrl" :src="data.qrCodeUrl" class="qr-code" />
            <span v-else>Chưa có QR</span>
          </template>
        </Column>
        <Column header="Actions" style="width: 20%">
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
              severity="danger"
              class="ml-2"
              style="margin-left: 10px"
              @click="confirmDeleteTeam(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <Dialog
    v-model:visible="showTeamDialog"
    modal
    :header="isUpdate ? 'Cập nhật' : 'Tạo'"
    @hide="resetForm"
    :style="{ width: '30rem' }"
  >
    <div class="mb-3">
      <label class="fw-bold">Tên nhóm <span class="text-danger">*</span></label>
      <InputText v-model="form.name" class="w-100" />
      <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
    </div>
    <div class="mb-3">
      <label class="fw-bold">Slug <span class="text-danger">*</span></label>
      <InputText v-model="form.slug" class="w-100" />
      <small class="text-danger" v-if="errors.slug">{{ errors.slug }}</small>
    </div>
    <div class="mb-3">
      <label class="fw-bold">Channel ID <span v-if="!isUpdate" class="text-danger">*</span></label>
      <InputText
        v-model="form.channelId"
        class="w-100"
        placeholder="Nhập channel Id của team trong chatops"
      />
      <small class="text-danger" v-if="errors.channelId">{{ errors.channelId }}</small>
    </div>
    <div class="mb-3">
      <label class="fw-bold">Token <span v-if="!isUpdate" class="text-danger">*</span></label>
      <InputText
        v-model="form.token"
        class="w-100"
        placeholder="Nhập token của người quản lý team từ chatops"
      />
      <small class="text-danger" v-if="errors.token">{{ errors.token }}</small>
    </div>
    <div class="mb-3">
      <label class="fw-bold">Mã QR <span class="text-danger">*</span></label>
      <FileUpload mode="basic" accept="image/*" customUpload @select="handleFileUpload" />
      <div class="qrcode-image">
        <img v-if="qrPreview" :src="qrPreview" class="qr-preview" />
      </div>
      <small class="text-danger" v-if="errors.qrCode">{{ errors.qrCode }}</small>
    </div>
    <div class="d-flex justify-content-end gap-2">
      <Button label="Hủy" severity="secondary" @click="showTeamDialog = false" />
      <Button label="Lưu" severity="primary" @click="saveTeam" />
    </div>
  </Dialog>

  <Dialog
    v-model:visible="showConfirmDialog"
    modal
    header="Xác nhận xóa"
    :style="{ width: '25rem' }"
  >
    <p>
      Bạn có chắc chắn muốn xóa team <strong>{{ teamToDelete?.name }}</strong> không?
    </p>
    <div class="d-flex justify-content-end gap-2">
      <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
      <Button label="Xóa" severity="danger" @click="deleteTeam" />
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/router/Interceptor'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'

// const baseURL = "http://localhost:8080/api/v1";
const token = localStorage.getItem('accessToken')
const teams = ref([])
const searchQuery = ref('')
const showTeamDialog = ref(false)
const isUpdate = ref(false)
const form = ref({ id: '', name: '', slug: '', channelId: '', token: '', qrCodeFile: null })
const qrPreview = ref(null)

const fetchTeams = async () => {
  try {
    const response = await axiosInstance.get(`/teams`)
    teams.value = response.data
    console.log('Fetched teams:', teams.value)

    // Lấy ảnh QR code cho từng team
    for (const team of teams.value) {
      try {
        const qrResponse = await axiosInstance.get(`/teams/${team.slug}/qrcode`, {
          responseType: 'blob',
        })
        const qrBlob = new Blob([qrResponse.data], { type: 'image/png' })
        team.qrCodeUrl = URL.createObjectURL(qrBlob)
      } catch (error) {
        team.qrCodeUrl = null
      }
    }
  } catch (error) {
    console.error('Error fetching teams:', error)
  }
}

const filteredTeams = computed(() => {
  if (!searchQuery.value) return teams.value
  return teams.value.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const openCreateDialog = () => {
  form.value = { id: '', name: '', slug: '', channelId: '', token: '', qrCodeFile: null }
  qrPreview.value = null
  isUpdate.value = false
  showTeamDialog.value = true
}

const openUpdateDialog = (team) => {
  form.value = { ...team }
  qrPreview.value = team.qrCodeUrl
  isUpdate.value = true
  showTeamDialog.value = true
}

const handleFileUpload = (event) => {
  const file = event.files[0]
  if (file) {
    form.value.qrCodeFile = file
    qrPreview.value = URL.createObjectURL(file)
  }
}

const errors = ref({})
const validateForm = () => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Tên Team không được để trống.'
  }
  if (!form.value.slug.trim()) {
    errors.value.slug = 'Slug không được để trống.'
  }
  if (!isUpdate.value) {
    if (!form.value.channelId.trim()) {
      errors.value.channelId = 'Channel ID không được để trống.'
    }
    if (!form.value.token.trim()) {
      errors.value.token = 'Token không được để trống.'
    }
  }
  if (!isUpdate.value && !form.value.qrCodeFile) {
    errors.value.qrCode = 'QR Code không được để trống khi tạo mới.'
  }

  // Trả về `false` nếu có lỗi, ngược lại trả về `true`
  return Object.keys(errors.value).length === 0
}

const saveTeam = async () => {
  if (!validateForm()) return
  try {
    const formData = new FormData()
    const teamData = {
      name: form.value.name,
      slug: form.value.slug,
      channelId: form.value.channelId,
      token: form.value.token,
    }

    // Chuyển object thành JSON string
    formData.append('team', new Blob([JSON.stringify(teamData)], { type: 'application/json' }))

    if (form.value.qrCodeFile) {
      formData.append('qrCode', form.value.qrCodeFile)
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      // Không cần set Content-Type, axiosInstance sẽ tự thêm đúng giá trị
    }

    if (isUpdate.value) {
      await axiosInstance.put(`/teams/${encodeURIComponent(form.value.slug)}`, formData, {
        headers,
      })
      console.log('Cập nhật thành công', form.value)
    } else {
      await axiosInstance.post(`/teams`, formData, { headers })
    }

    showTeamDialog.value = false
    fetchTeams()
  } catch (error) {
    console.error('Error saving team:', error.response?.data || error.message)
  }
}

const resetForm = () => {
  form.value = { id: '', name: '', slug: '', channelId: '', token: '', qrCodeFile: null }
  qrPreview.value = null
}

onMounted(() => {
  fetchTeams()
})

const showConfirmDialog = ref(false)
const teamToDelete = ref(null)

const confirmDeleteTeam = (team) => {
  teamToDelete.value = team
  showConfirmDialog.value = true
}

const deleteTeam = async () => {
  if (!teamToDelete.value) return
  try {
    await axiosInstance.delete(`/teams/${teamToDelete.value.slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    showConfirmDialog.value = false
    fetchTeams()
  } catch (error) {
    console.error('Error deleting team:', error.response?.data || error.message)
  }
}
</script>

<style>
.qr-preview {
  max-width: 100%;
  height: 100%;
  text-align: center;
}

.qr-code {
  height: 20%;
  width: 20%;
}

.qrcode-image {
  text-align: center;
}
</style>
