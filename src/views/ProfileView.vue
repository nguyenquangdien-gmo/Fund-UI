<template>
  <div class="container grid grid-cols-10 gap-4 p-4">
    <!-- Profile Section (70%) -->
    <div class="col-span-7 card p-4 left-side">
      <h4 class="text-center text-xl font-bold">THÔNG TIN CÁ NHÂN</h4>
      <div class="profile-container">
        <div class="avatar-info">
          <img :src="form.avatarImage || '/image.png'" alt="Avatar" class="avatar" />
          <Button severity="info" @click="openUpdateDialog(form)" class="btn-update">Cập nhật thông tin</Button>
        </div>
        <div class="profile-info">
          <div>
            <span>Họ và Tên:</span>
            <p>{{ form.fullName }}</p>
          </div>
          <div>
            <span>Email:</span>
            <p>{{ form.email }}</p>
          </div>
          <div>
            <span>Chức Vụ:</span>
            <p>{{ form.position ? form.position : 'Chưa cập nhật' }}</p>
          </div>
          <div>
            <span>SĐT:</span>
            <p>{{ form.phoneNumber ? form.phoneNumber : 'Chưa cập nhật' }}</p>
          </div>
          <div>
            <span>Ngày Sinh:</span>
            <p>{{ formatDate(form.dob) }}</p>
          </div>
          <div>
            <span>Gia Nhập:</span>
            <p>{{ formatDate(form.joinDate) }}</p>
          </div>
          <div>
            <span>Team:</span>
            <p>{{ user.team ?? 'Chưa có nhóm' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Section (30%) -->
    <div class="col-span-3 card p-4 right-side">
      <h2 class="text-center text-xl font-bold">Đổi Mật Khẩu</h2>
      <div class="mt-4 flex">
        <label class="block font-bold mt-2">Mật khẩu hiện tại</label>
        <Password v-model="passwordData.currentPassword" toggleMask class="w-full" />
      </div>
      <small class="text-danger">{{ error.oldPass }}</small>

      <div class="mt-4 flex">
        <label class="block font-bold mt-2">Mật khẩu mới</label>
        <Password v-model="passwordData.newPassword" toggleMask class="w-full" />
      </div>
      <small class="text-danger">{{ error.newPass }}</small>

      <div class="mt-4 flex">
        <label class="block font-bold mt-2">Xác nhận mật khẩu</label>
        <Password v-model="passwordData.confirmPassword" toggleMask class="w-full" />
      </div>
      <small class="text-danger">{{ error.confirmPass }}</small>

      <div class="mt-4 text-center">
        <Button label="Đổi mật khẩu" severity="primary" @click="changePassword" class="w-full" />
      </div>
    </div>
    <Dialog v-model:visible="showUserDialog" modal :header="isUpdate ? 'Cập nhật' : 'Thêm'" @hide="resetErrors"
      :style="{ width: '30rem' }">
      <div class="mb-3">
        <label for="id" class="fw-bold"> Mã nhân viên <span class="text-danger">*</span> </label>
        <InputNumber id="id" :useGrouping="false" v-model="form.id" class="w-100" type="number" disabled
          autocomplete="off" />
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
        <InputText :useGrouping="false" id="phone" v-model="form.phoneNumber" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.phone">{{ errors.phone }}</small>
      </div>
      <div class="mb-3">
        <label for="position" class="fw-bold">Chức vụ</label>
        <InputText id="position" v-model="form.position" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.position">{{ errors.phone }}</small>
      </div>
      <!-- <div class="mb-3">
        <label for="position" class="fw-bold">Chức vụ</label>
        <InputText id="position" v-model="form.position" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.position">{{ errors.position }}</small>
    </div> -->
      <div class="mb-3">
        <label for="slugTeam" class="fw-bold"> Team <span class="text-danger">*</span> </label>
        <Dropdown id="slugTeam" v-model="selectedTeam" :options="teams" optionLabel="name" optionValue="slug"
          placeholder="Chọn Team" class="w-100" />
        <small class="text-danger" v-if="errors.slugTeam">{{ errors.slugTeam }}</small>
      </div>
      <div class="mb-3">
        <label for="joinDate" class="fw-bold">
          Ngày tham gia <span class="text-danger">*</span>
        </label>
        <Calendar id="joinDate" v-model="seletedJoinDate" dateFormat="dd/mm/yy" class="w-100" showIcon />
        <small class="text-danger" v-if="errors.joinDate">{{ errors.joinDate }}</small>
      </div>
      <div class="mb-3">
        <label class="fw-bold">Avatar <span class="text-danger">*</span></label>
        <FileUpload mode="basic" accept="image/*" customUpload @select="handleFileUpload" />
        <div class="avatar-image">
          <img v-if="avatar" :src="avatar" class="avatar-preview" />
        </div>
        <small class="text-danger" v-if="errors.avatar">{{ errors.avatar }}</small>
      </div>
      <div class="mb-3">
        <label class="fw-bold">QR<span class="text-danger">*</span></label>
        <FileUpload mode="basic" accept="image/*" customUpload @select="handleQrCodeUpload" />
        <div class="avatar-image">
          <img v-if="qrCode" :src="qrCode" class="avatar-preview" />
        </div>
        <small class="text-danger" v-if="errors.qrCode">{{ errors.qrCode }}</small>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <Button type="button" label="Hủy" severity="secondary" @click="showUserDialog = false"></Button>
        <Button type="button" label="Lưu" severity="primary" @click="saveUser"></Button>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axiosInstance from '@/router/Interceptor'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useUserStore } from '@/pinia/userStore'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import FileUpload from 'primevue/fileupload'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const error = ref({ oldPass: '', newPass: '', confirmPass: '', summary: '' })
const toast = useToast()

type User = {
  id: number
  fullName: string
  email: string
  position?: string
  phoneNumber?: string
  dob?: string
  joinDate?: string
  team?: string
  avatarImage: string | null
  qrCode: string | null
}

const form = ref<User>({
  id: 0,
  fullName: '',
  email: '',
  position: '',
  phoneNumber: '',
  dob: '',
  joinDate: '',
  team: '',
  avatarImage: null,
  qrCode: null,
})

const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const avatar = ref<string | null>(null)
const qrCode = ref<string | null>(null)
// const fetchAvatar = async () => {
//   try {
//     const response = await axiosInstance.get(`/users/${user.value.id}/avatar`, {
//       responseType: 'blob',
//     })
//     const blob = new Blob([response.data], { type: 'image/png' })
//     form.value.avatarImage = URL.createObjectURL(blob)
//   } catch (error) {
//     console.error('Error fetching avatar:', error)
//   }
const fetchUserProfile = async () => {
  try {
    const response = await axiosInstance.post('/users/get-user', { email: user.value.email })
    form.value = response.data
    oldId.value = response.data.id
    console.log(response.data)

    const imageRes = await axiosInstance.get(`/users/${user.value.id}/avatar`, {
      responseType: 'blob',
    })
    const image = new Blob([imageRes.data], { type: 'image/png' })
    form.value.avatarImage = URL.createObjectURL(image)

    const qrCodeRes = await axiosInstance.get(`/users/${user.value.id}/qr-code`, {
      responseType: 'blob',
    })
    const qrCode = new Blob([qrCodeRes.data], { type: 'image/png' })
    form.value.qrCode = URL.createObjectURL(qrCode)
    console.log('form.value', form.value)

  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}

const validatePassword = () => {
  if (!passwordData.value.currentPassword) {
    error.value.oldPass = 'Vui lòng nhập mật khẩu hiện tại!'
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Vui lòng nhập mật khẩu hiện tại!',
      life: 3000,
    })
    return false
  }
  if (!passwordData.value.newPassword) {
    error.value.newPass = 'Vui lòng nhập mật khẩu mới!'
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Vui lòng nhập mật khẩu mới!',
      life: 3000,
    })
    return false
  }
  if (!passwordData.value.confirmPassword) {
    error.value.confirmPass = 'Vui lòng nhập mật khẩu xác nhận!'
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Vui lòng nhập mật khẩu xác nhận!',
      life: 3000,
    })
    return false
  }
  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    error.value.confirmPass = 'Mật khẩu xác nhận không khớp!'
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Mật khẩu xác nhận không khớp!',
      life: 3000,
    })
    return false
  }
  return true
}

const changePassword = async () => {
  if (!validatePassword()) {
    return
  }
  try {
    await axiosInstance.post('/auth/change-password', {
      email: user.value.email,
      oldPassword: passwordData.value.currentPassword,
      newPassword: passwordData.value.newPassword,
    })
    resetForm()
    toast.add({ severity: 'success', summary: 'Đổi mật khẩu thành công!', life: 3000 })
    // alert('Đổi mật khẩu thành công!');
  } catch (err) {
    console.error('Error changing password:', err)
    toast.add({ severity: 'error', summary: 'Đổi mật khẩu thất bại!', life: 3000 })
    // alert('Có lỗi xảy ra!');
  }
}
const resetForm = () => {
  passwordData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  error.value = {
    oldPass: '',
    newPass: '',
    confirmPass: '',
    summary: '',
  }
}
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Chưa cập nhật'
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN')
}

// fetch teams
const fetchTeams = async () => {
  try {
    const response = await axiosInstance.get('/teams') // API lấy danh sách team
    teams.value = response.data
  } catch (error) {
    console.error('Error fetching teams:', error)
  }
}

//handle file upload

const handleFileUpload = (event: any) => {
  const file = event.files[0]
  if (file) {
    form.value.avatarImage = file
    avatar.value = URL.createObjectURL(file)
  }
}

const handleQrCodeUpload = (event: any) => {
  const file = event.files[0]
  if (file) {
    form.value.qrCode = file
    qrCode.value = URL.createObjectURL(file)
  }
}
// update user profile
const teams = ref<{ id: string; name: string; slug: string }[]>([])
const selectedTeam = ref('')
const isUpdate = ref(false)
const showUserDialog = ref(false)
const oldId = ref(0)

// const userForm = ref({
//   id: 0,
//   email: '',
//   fullName: '',
//   dob: '',
//   phoneNumber: '',
//   position: '',
//   joinDate: '',
//   slugTeam: '',
// })

const errors = ref({
  id: '',
  email: '',
  fullName: '',
  dob: '',
  phone: '',
  position: '',
  joinDate: '',
  slugTeam: '',
  avatar: '',
  qrCode: '',
})
const resetErrors = () => {
  errors.value = {
    id: '',
    email: '',
    fullName: '',
    dob: '',
    phone: '',
    position: '',
    joinDate: '',
    slugTeam: '',
    avatar: '',
    qrCode: '',
  }
}

const seletedDob = ref<Date | null>(new Date())
const seletedJoinDate = ref<Date | null>(new Date())

const findTeam = (slugTeam: string) => {
  const team = teams.value.find((team) => team.name === slugTeam)
  return team ? team.slug : ''
}

const openUpdateDialog = (user: User) => {
  form.value = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    dob: user.dob,
    phoneNumber: user.phoneNumber || '',
    position: user.position || '',
    joinDate: user.joinDate,
    team: findTeam(user.team ?? ''),
    avatarImage: user.avatarImage,
    qrCode: user.qrCode,
  }
  avatar.value = user.avatarImage
  qrCode.value = user.qrCode
  selectedTeam.value = findTeam(user.team ?? '')
  oldId.value = user.id
  // console.log('team', user.team, 'slug', user.team)
  // Chuyển đổi chuỗi ngày tháng thành đối tượng Date
  seletedDob.value = user.dob ? new Date(user.dob) : null
  seletedJoinDate.value = user.joinDate ? new Date(user.joinDate) : null

  isUpdate.value = true
  showUserDialog.value = true
}

//validate user form
const validateUserForm = async () => {
  errors.value = {
    id: '',
    email: '',
    fullName: '',
    dob: '',
    phone: '',
    position: '',
    joinDate: '',
    slugTeam: '',
    avatar: '',
    qrCode: '',
  }

  if (!form.value.id) errors.value.id = 'Vui lòng nhập mã nhân viên!'
  if (form.value.id <= 0) errors.value.id = 'Mã nhân viên không hợp lệ!'

  if (!form.value.email) {
    errors.value.email = 'Vui lòng nhập email!'
  } else {
    const response = await axiosInstance.post('/users/check-email', {
      email: form.value.email,
    })
    if (user.value.email !== form.value.email && response.data === true) {
      errors.value.email = 'Email đã tồn tại!'
    }
  }

  if (!form.value.phoneNumber) {
    errors.value.phone = 'Vui lòng nhập số điện thoại!'
  } else if (!/^\d{10}$/.test(form.value.phoneNumber)) {
    errors.value.phone = 'Số điện thoại không hợp lệ!'
  }

  if (!form.value.fullName) errors.value.fullName = 'Vui lòng nhập họ tên!'
  if (!seletedDob.value) errors.value.dob = 'Vui lòng chọn ngày sinh!'
  if (!seletedJoinDate.value) errors.value.joinDate = 'Vui lòng chọn ngày tham gia!'
  if (!selectedTeam.value) errors.value.slugTeam = 'Vui lòng nhập team!'

  if (!form.value.avatarImage) {
    errors.value.avatar = 'Vui lòng chọn ảnh đại diện!'
  }

  if (!form.value.qrCode) {
    errors.value.qrCode = 'Vui lòng chọn mã QR!'
  }

  return Object.values(errors.value).every((err) => err === '')
}


//save user
// Sửa lại hàm saveUser để xử lý file upload đúng cách
const saveUser = async () => {
  const isValid = await validateUserForm()
  if (!isValid) return
  try {
    const formData = new FormData()

    const userData = {
      id: form.value.id,
      email: form.value.email.includes('@')
        ? form.value.email
        : form.value.email + '@runsystem.net',
      fullName: form.value.fullName,
      dob: seletedDob.value ? formatDateForAPI(seletedDob.value) : '',
      phoneNumber: form.value.phoneNumber,
      position: form.value.position,
      joinDate: seletedJoinDate.value ? formatDateForAPI(seletedJoinDate.value) : '',
      slugTeam: selectedTeam.value.toLowerCase(),
    }

    // Thêm user data dưới dạng JSON blob
    formData.append('user', new Blob([JSON.stringify(userData)], { type: 'application/json' }))

    // Xử lý file avatar
    if (form.value.avatarImage && typeof form.value.avatarImage !== 'string') {
      formData.append('avatarImage', form.value.avatarImage)
    }

    if (form.value.qrCode && typeof form.value.qrCode !== 'string') {
      formData.append('qrCode', form.value.qrCode)
    }
    console.log('formData', formData)

    // Gửi request với FormData
    await axiosInstance.put(`/users/${oldId.value}/update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    toast.add({ severity: 'success', summary: 'Cập nhật thành công!', life: 3000 })
    showUserDialog.value = false
    fetchUserProfile()
    // fetchAvatar() // Cập nhật lại avatar sau khi đã upload thành công
  } catch (error) {
    console.error('Error saving user:', error)
    toast.add({
      severity: 'error',
      summary: 'Lỗi cập nhật',
      detail: 'Vui lòng thử lại',
      life: 3000,
    })
  }
}

// Add this helper function before onMounted
const formatDateForAPI = (date: Date) => {
  // Adjust for timezone to prevent date shift
  const d = new Date(date)
  d.setHours(12) // Set to noon to avoid timezone issues
  return d.toISOString().split('T')[0]
}

onMounted(() => {
  fetchUserProfile()
  fetchTeams()
  // fetchAvatar()
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.container {
  display: flex;
}

.right-side {
  width: 40%;
}

.left-side {
  width: 60%;
  line-height: 1cm;
}

.profile-container {
  display: flex;
  align-items: center;
  text-align: left;
  width: 100%;
  max-width: 700px;
  /* Giới hạn chiều rộng */
  margin: 0 auto;
  /* Căn giữa */
}

.profile-container h2 {
  text-align: center;
}

.profile-info {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.profile-info div {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 5px 0px 0px 40px;
}

.profile-info div span {
  font-weight: bold;
  width: 40%;
}

.profile-info div p {
  width: 70%;
  margin: 0;
}

.avatar-info {
  text-align: center;
}

.avatar-info .avatar {
  width: 225px;
  height: 225px;
  border-radius: 10px;
}

.avatar-info .btn-update {
  margin-top: 10px;
  padding: 0 15px;
}

.flex {
  display: flex;
  justify-content: space-between;
}

.avatar-preview {
  margin-top: 5px;
  max-width: 100%;
  height: 100%;
  text-align: center;
  border-radius: 10px;
}

.avatar-image {
  text-align: center;
}
</style>
