<template>
  <div class="container">
    <div class="p-4">
      <div v-if="!isEdit" class="mb-2 p-4 border rounded shadow-md bg-white">
        <div class="mb-3">
            <div v-html="team?.regulation || 'N/A'"></div>
          </div>
      </div>

      <div v-if="isEdit" class="mb-2 p-4 border rounded shadow-md bg-white mt-4">
        <TextEditor v-if="team" v-model="team.regulation" :initialData="team?.regulation || ''" />
        <div class="mt-3 d-flex justify-content-end">
          <Button @click="saveContent">Lưu</Button>
        </div>
      </div>

      <div class="mb-3 d-flex justify-content-between">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm theo tên..." 
          class="w-full p-inputtext-sm"
        />
        <Button
          v-if="isAdmin"
          label="Sửa Nội Quy"
          icon="pi pi-pencil"
          severity="success"
          class="btn"
          raised
          size="small"
          @click="openEdit"
          style="margin-left: 10px; padding-top: 5px"
        />
      </div>
      <DataTable
        :value="filteredMembers"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 50, 100]"
        class="p-datatable-sm"
      >
        <Column header="STT">
          <template #body="{ index }">
        {{ index + 1 }}
          </template>
        </Column>

        <Column field="fullName" header="Họ và Tên" sortable></Column>
        <Column field="email" header="Email" sortable></Column>
        <Column field="role" header="Vai Trò" sortable></Column>
        <Column field="dob" header="Ngày Sinh" sortable></Column>
        <!-- <Column field="position" header="Chức Vụ" sortable></Column> -->
        <Column field="phoneNumber" header="Số Điện Thoại" sortable></Column>
        <!-- <Column field="slugTeam" header="Nhóm" sortable></Column> -->
        <Column field="joinDate" header="Ngày Tham Gia" sortable>
          <template #body="{ data }">
            {{ new Date(data.joinDate).toLocaleDateString('vi-VN') }}
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/router/Interceptor'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { useRoute } from 'vue-router'
import type { User } from '@/types/User'
import type Team from '@/types/Team'
import TextEditor from '@/components/editor/TextEditor.vue'
import { useToast } from 'primevue'

// const baseURL = "http://localhost:8080/api/v1";
const members = ref<User[]>([])
const team = ref<Team>()
const searchQuery = ref('')
const toast = useToast()
const isEdit = ref(false)
const isAdmin = ref(false)

const route = useRoute()
const teamId = route.params.teamId as string

const fetchMembers = async () => {
  try {
    console.log('Fetching members for team ID:', teamId);
    const response = await axiosInstance.get(`/teams/${teamId}/members`)
    console.log('Members response:', response.data);
    members.value = response.data
  } catch (error) {
    console.error('Error fetching members:', error)
  }
}

const checkAdmin = async () => {
  const userData = sessionStorage.getItem('user');
  
  if (!userData) return false;
  try {
    const user = JSON.parse(userData);
    return user.role === 'ADMIN';
  } catch (error) {
    console.error('Error parsing user data from sessionStorage:', error);
    return false;
  }
};

const fetchTeams = async () => {
  try {
    const response = await axiosInstance.get(`/teams/${teamId}`)
    team.value = response.data
  } catch (error) {
    console.error('Error fetching teams:', error)
  }
}

const openEdit = () => {
  isEdit.value = !isEdit.value
}

const saveContent = async () => {
  try {
    if (team.value) {
      await axiosInstance.put(`/teams/${teamId}/regulation`, {
        regulation: team.value.regulation,
      })
      isEdit.value = false
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Nội quy đã được lưu thành công!',
        life: 3000,
      })
    }
  } catch (error) {
    console.error('Error saving regulation:', error)
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Đã xảy ra lỗi khi lưu nội quy!',
      life: 3000,
    })  
  }
}

onMounted(async () => {
  isAdmin.value = await checkAdmin()
  fetchMembers()
  fetchTeams()
})

const filteredMembers = computed(() => {
  if (!searchQuery.value) {
    return members.value
  }
  return members.value.filter((meber: User) =>
    meber.fullName.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
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
