<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-xl">DANH SÁCH THÀNH VIÊN</h2>
      <div class="mb-3 mt-3">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm theo email, tên, MNV..."
          class="w-full p-inputtext-sm"
          style="width: 20%"
        />
        <Button
          v-if="admin"
          label="Thêm thành viên"
          severity="success"
          raised
          size="small"
          @click="openCreateDialog"
          style="margin-left: 10px"
        />
      </div>
      <DataTable
        :value="filteredFunds"
        paginator
        :rows="15"
        :rowsPerPageOptions="[15, 20, 25]"
        class="p-datatable-sm"
      >
        <Column header="STT" sortable style="width: 5%">
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>
        <Column field="id" header="Mã nhân viên" sortable style="width: 10%"></Column>
        <Column field="email" header="Email" sortable></Column>
        <Column field="fullName" header="Tên " sortable></Column>
        <Column field="dob" header="Ngày sinh" sortable>
          <template #body="{ data }">
            {{ formatDate(data.dob) }}
          </template>
        </Column>
        <Column field="phoneNumber" header="SĐT" sortable>
          <template #body="{ data }">
            {{ data.phoneNumber ? data.phoneNumber : 'Chưa cập nhật' }}
          </template></Column
        >
        <!-- <Column field="position" header="Chức vụ" sortable></Column> -->
        <Column field="role" header="Vai trò " sortable></Column>

        <Column field="joinDate" header="Ngày tham gia" sortable>
          <template #body="{ data }">
            {{ formatDate(data.joinDate) }}
          </template>
        </Column>
        <Column v-if="admin" header="Actions" style="width: 25%">
          <template #body="{ data }">
            <Button
              label="Sửa"
              icon="pi pi-user-edit"
              severity="info"
              @click="openUpdateDialog(data)"
            />
            <Button
              label="Reset"
              icon="pi pi-undo"
              severity="Warn"
              class="left-10"
              @click="confirmReset(data.email)"
              :hidden="data.email === user.email"
            />
            <Button
              label="Xóa"
              class="left-10"
              icon="pi pi-trash"
              severity="danger"
              @click="confirmDelete(data)"
              :hidden="data.email === user.email"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
  <Dialog
    v-if="admin"
    v-model:visible="showConfirmDialog"
    modal
    :header="isDelete ? 'Xác nhận xóa' : 'Xác nhận tạo lại mật khẩu'"
    :style="{ width: '25rem' }"
  >
    <div>Bạn có chắc chắn muốn {{ isDelete ? 'xóa thành viên này' : 'tạo lại mật khẩu' }}?</div>
    <div class="d-flex justify-content-end gap-2 mt-3">
      <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
      <Button v-if="isDelete" label="Xóa" severity="danger" @click="deleteUser" />
      <Button v-else label="Reset" severity="success" @click="resetPassword(emailToReset)" />
    </div>
  </Dialog>

  <Dialog
    v-if="admin"
    v-model:visible="showUserDialog"
    modal
    :header="isUpdate ? 'Cập nhật' : 'Thêm'"
    @hide="resetErrors"
    :style="{ width: '30rem' }"
  >
    <div class="mb-3">
      <label for="id" class="fw-bold"> Mã nhân viên <span class="text-danger">*</span> </label>
      <InputText id="id" v-model="userId" class="w-100" type="number" autocomplete="off" />
      <small class="text-danger" v-if="errors.id">{{ errors.id }}</small>
    </div>
    <div class="mb-3">
      <label for="fullName" class="fw-bold"> Tên <span class="text-danger">*</span> </label>
      <InputText id="fullName" v-model="form.fullName" class="w-100" autocomplete="off" />
      <small class="text-danger" v-if="errors.fullName">{{ errors.fullName }}</small>
    </div>
    <div class="mb-3">
      <label for="email" class="fw-bold"> Email <span class="text-danger">*</span> </label>
      <InputText id="email" v-model="form.email" class="w-100" type="email" autocomplete="off" />
      <small class="text-danger" v-if="errors.email">{{ errors.email }}</small>
    </div>
    <div class="mb-3">
      <label for="dob" class="fw-bold"> Ngày sinh <span class="text-danger">*</span> </label>
      <Calendar id="dob" v-model="seletedDob" dateFormat="dd/mm/yy" class="w-100" showIcon />
      <small class="text-danger" v-if="errors.dob">{{ errors.dob }}</small>
    </div>
    <div class="mb-3">
      <label for="phone" class="fw-bold">SĐT</label>
      <InputText id="phone" v-model="form.phoneNumber" class="w-100" autocomplete="off" />
      <small class="text-danger" v-if="errors.phone">{{ errors.phone }}</small>
    </div>
    <!-- <div class="mb-3">
        <label for="position" class="fw-bold">Chức vụ</label>
        <InputText id="position" v-model="form.position" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.position">{{ errors.position }}</small>
    </div> -->
    <div class="mb-3">
      <label for="slugTeam" class="fw-bold"> Team <span class="text-danger">*</span> </label>
      <Dropdown
        id="slugTeam"
        v-model="selectedTeam"
        :options="teams"
        optionLabel="name"
        optionValue="slug"
        placeholder="Chọn Team"
        class="w-100"
      />
      <small class="text-danger" v-if="errors.slugTeam">{{ errors.slugTeam }}</small>
    </div>
    <div class="mb-3">
      <label for="joinDate" class="fw-bold">
        Ngày tham gia <span class="text-danger">*</span>
      </label>
      <Calendar
        id="joinDate"
        v-model="seletedJoinDate"
        dateFormat="dd/mm/yy"
        class="w-100"
        showIcon
      />
      <small class="text-danger" v-if="errors.joinDate">{{ errors.joinDate }}</small>
    </div>
    <div class="mb-3">
      <label for="type" class="fw-bold"> Vai trò <span class="text-danger">*</span> </label>
      <Dropdown
        :disabled="form.email === user.email"
        v-model="selectedRole"
        :options="roles"
        optionLabel="name"
        optionValue="name"
        placeholder="Chọn vai trò"
        class="w-100"
      />
      <small class="text-danger" v-if="errors.role">{{ errors.role }}</small>
    </div>
    <div class="d-flex justify-content-end gap-2">
      <Button
        type="button"
        label="Hủy"
        severity="secondary"
        @click="showUserDialog = false"
      ></Button>
      <Button type="button" label="Lưu" severity="primary" @click="saveUser"></Button>
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
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import axiosInstance from '@/router/Interceptor'
import { useRouter } from 'vue-router'
import type { User } from '@/types/User'
import { useToast } from 'primevue'
import { useUserStore } from '@/pinia/userStore'
// import UserRole from '@/types/UserRole';

// const baseURL = "http://localhost:8080/api/v1";
const toast = useToast()
const showConfirmDialog = ref(false)
const userToDelete = ref<User | null>(null)
const token = localStorage.getItem('accessToken')
const users = ref<User[]>([])
const searchQuery = ref('')
const showUserDialog = ref(false)
const isUpdate = ref(false)
const isDelete = ref(false)
const isAdmin = ref(false)
const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)

const admin = ref(false)
const checkAdmin = async () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return false
  try {
    const response = await axiosInstance.get('/tokens/is-admin', {
      params: { token },
    })
    return response.data // Trả về true nếu là admin
  } catch (error) {
    // consol e.error('Lỗi khi kiểm tra quyền admin:', error)
    return false
  }
}

const form = ref({
  id: 0,
  email: '',
  fullName: '',
  role: '',
  dob: '',
  phoneNumber: '',
  position: '',
  joinDate: '',
  slugTeam: '',
})

const errors = ref({
  id: '',
  email: '',
  fullName: '',
  role: '',
  dob: '',
  phone: '',
  position: '',
  joinDate: '',
  slugTeam: '',
})

const userId = ref('')
const oldId = ref(0)

const selectedRole = ref('')
const seletedDob = ref<Date | null>(null)
const seletedJoinDate = ref<Date | null>(null)
const roles = ref<{ id: number; name: string }[]>([])
const teams = ref<{ id: string; name: string; slug: string }[]>([])
const selectedTeam = ref('')

const fetchTeams = async () => {
  try {
    const response = await axiosInstance.get('/teams') // API lấy danh sách team
    teams.value = response.data
  } catch (error) {
    console.error('Error fetching teams:', error)
  }
}

const fetchRoles = async () => {
  try {
    const response = await axiosInstance.get('/roles')
    roles.value = response.data
  } catch (error) {
    console.error('Error fetching roles:', error)
  }
}

const fetchUsers = async () => {
  try {
    const response = await axiosInstance.get(`/users`)
    users.value = response.data
    console.log(users.value)
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const filteredFunds = computed(() => {
  if (!searchQuery.value) return users.value
  return users.value.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.id === parseInt(searchQuery.value),
  )
})
const emailDomain = '@runsystem.net'
const openCreateDialog = () => {
  form.value = {
    id: 0,
    email: emailDomain,
    fullName: '',
    role: '',
    dob: '',
    phoneNumber: '',
    position: '',
    joinDate: '',
    slugTeam: '',
  }
  userId.value = ''
  selectedRole.value = ''
  isUpdate.value = false
  showUserDialog.value = true
  seletedDob.value = null
  seletedJoinDate.value = null
  selectedTeam.value = findTeam('Java')
}
const findTeam = (slugTeam: string) => {
  const team = teams.value.find((team) => team.name === slugTeam)
  return team ? team.slug : ''
}
const openUpdateDialog = (user: User) => {
  form.value = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: typeof user.role === 'object' && user.role !== null ? user.role.name : user.role || '',
    dob: user.dob,
    phoneNumber: user.phoneNumber || '',
    position: user.position || '',
    joinDate: user.joinDate,
    slugTeam: findTeam(
      typeof user.team === 'object' && user.team !== null ? user.team.name : user.team || '',
    ),
  }
  selectedTeam.value = findTeam(
    typeof user.team === 'object' && user.team !== null ? user.team.name : user.team || '',
  )

  selectedRole.value =
    typeof user.role === 'object' && user.role !== null ? user.role.name : user.role || ''
  isAdmin.value = selectedRole.value === 'ADMIN'
  userId.value = user.id.toString()
  oldId.value = user.id

  console.log('team', user.team, 'slug', user.team)

  // Chuyển đổi chuỗi ngày tháng thành đối tượng Date
  seletedDob.value = user.dob ? new Date(user.dob) : null
  seletedJoinDate.value = user.joinDate ? new Date(user.joinDate) : null

  isUpdate.value = true
  showUserDialog.value = true
}

const confirmDelete = (user: User) => {
  userToDelete.value = user
  showConfirmDialog.value = true
  isDelete.value = true
}

//confirm reset password
const emailToReset = ref('')
const confirmReset = (email: string) => {
  emailToReset.value = email
  showConfirmDialog.value = true
  isDelete.value = false
}

const validateForm = () => {
  errors.value = {
    id: '',
    email: '',
    fullName: '',
    role: '',
    dob: '',
    phone: '',
    position: '',
    joinDate: '',
    slugTeam: '',
  }

  if (!userId.value) errors.value.id = 'Vui lòng nhập mã nhân viên!'
  if (!form.value.email) {
    errors.value.email = 'Vui lòng nhập email!'
  } else {
    // Kiểm tra email có bị trùng với users hay không
    const emailExists = users.value.some(
      (user) =>
        user.email.toLowerCase() === form.value.email.toLowerCase() &&
        user.id !== Number(userId.value), // nếu đang edit thì bỏ qua chính mình
    )
    if (!isUpdate && emailExists) {
      errors.value.email = 'Email đã tồn tại!'
    }
  }

  if (!form.value.fullName) errors.value.fullName = 'Vui lòng nhập họ tên!'
  if (!selectedRole.value) errors.value.role = 'Vui lòng chọn vai trò!'
  if (!seletedDob.value) errors.value.dob = 'Vui lòng chọn ngày sinh!'
  if (!seletedJoinDate.value) errors.value.joinDate = 'Vui lòng chọn ngày tham gia!'
  if (!selectedTeam.value) errors.value.slugTeam = 'Vui lòng nhập team!'

  return Object.values(errors.value).every((err) => err === '')
}

const saveUser = async () => {
  try {
    if (!validateForm()) return

    form.value.id = parseInt(userId.value)
    form.value.role = selectedRole.value ?? ''

    form.value.dob = seletedDob.value ? seletedDob.value.toISOString().split('T')[0] : ''
    form.value.joinDate = seletedJoinDate.value
      ? seletedJoinDate.value.toISOString().split('T')[0]
      : ''
    form.value.slugTeam = selectedTeam.value

    if (form.value.email && !form.value.email.includes('@')) {
      form.value.email += '@runsystem.net'
    }

    if (isUpdate.value) {
      console.log('Updating user:', form.value)
      await axiosInstance.put(`/users/${oldId.value}`, form.value)
    } else {
      console.log('Creating user:', form.value)
      await axiosInstance.post(`/auth/register`, form.value)
    }

    showUserDialog.value = false
    fetchUsers()
  } catch (error) {
    console.error('Error saving user:', error)
  }
}

const resetPassword = async (email: string) => {
  try {
    await axiosInstance.post('/auth/reset-password', { email })
    toast.add({ severity: 'success', summary: 'Reset mật khẩu thành công!', life: 3000 })
    if (user.value.email === email) {
      userStore.logout()
      router.push('/')
    }
    showConfirmDialog.value = false
  } catch (error) {
    console.error('Error resetting password:', error)
  }
}

const resetErrors = () => {
  errors.value = {
    id: '',
    email: '',
    fullName: '',
    role: '',
    dob: '',
    phone: '',
    position: '',
    joinDate: '',
    slugTeam: '',
  }
}

const deleteUser = async () => {
  if (!userToDelete.value) return
  try {
    await axiosInstance.delete(`/users/${userToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
  } finally {
    showConfirmDialog.value = false
    userToDelete.value = null
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

onMounted(async () => {
  if (!token) {
    router.push('/')
  } else {
    admin.value = await checkAdmin()
    fetchTeams()
    fetchUsers()
    fetchRoles()
  }
})
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}

.left-10 {
  margin-left: 5px;
  margin-top: 5px;
}
</style>
