<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-xl">CHI TIẾT</h2>

      <div class="mb-4">
        <h3 class="text-lg font-bold">Thông Tin Team</h3>
        <p><strong>Tên:</strong> {{ team?.name }}</p>
        <p><strong>Mô Tả:</strong> {{ team?.description }}</p>
        <p><strong>Quy Định:</strong> {{ team?.regulation }}</p>
      </div>
      
      <div class="mb-3 flex justify-between">
        <!-- <InputText
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
        /> -->
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
import { useRoute } from 'vue-router'
import type { User } from '@/types/User'
import type Team from '@/types/Team'

// const baseURL = "http://localhost:8080/api/v1";
const members = ref<User[]>([])
const team = ref<Team>()
const searchQuery = ref('')

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

const fetchTeams = async () => {
  try {
    const response = await axiosInstance.get(`/teams/${teamId}`)
    team.value = response.data
  } catch (error) {
    console.error('Error fetching teams:', error)
  }
}

onMounted(() => {
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
