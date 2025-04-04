<template>
    <div class="container grid grid-cols-10 gap-4 p-4">
        <!-- Profile Section (70%) -->
        <div class="col-span-7 card p-4 left-side">
            <h2 class="text-center text-xl font-bold">Thông Tin Cá Nhân</h2>
            <div class="profile-container">
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
                        <p>{{ form.position ?? 'Chưa cập nhật' }}</p>
                    </div>
                    <div>
                        <span>Số Điện Thoại:</span>
                        <p>{{ form.phone ?? 'Chưa cập nhật' }}</p>
                    </div>
                    <div>
                        <span>Ngày Sinh:</span>
                        <p>{{ formatDate(form.dob) }}</p>
                    </div>
                    <div>
                        <span>Ngày Gia Nhập:</span>
                        <p>{{ formatDate(form.joinDate) }}</p>
                    </div>
                    <div>
                        <span>Team:</span>
                        <p>{{ user.team?.name ?? 'Chưa có nhóm' }}</p>
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axiosInstance from '@/router/Interceptor';
import Password from 'primevue/password';
import Button from 'primevue/button';
import { useUserStore } from '@/pinia/userStore';
import { useToast } from "primevue/usetoast";


const userStore = useUserStore();
const user = computed(() => userStore.user);
const error = ref({ oldPass: "", newPass: "", confirmPass: "", summary: '' });
const toast = useToast();

type User = {
    fullName: string;
    email: string;
    position?: string;
    phone?: string;
    dob?: string;
    joinDate?: string;
    team?: string;
    status: string;
};

const form = ref<User>({
    fullName: '',
    email: '',
    position: '',
    phone: '',
    dob: '',
    joinDate: '',
    team: '',
    status: ''
});

const passwordData = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const fetchUserProfile = async () => {
    try {
        const response = await axiosInstance.post('/users/get-user', { email: user.value.email });
        form.value = response.data;
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
};
const validatePassword = () => {
    if (!passwordData.value.currentPassword) {
        error.value.oldPass = 'Vui lòng nhập mật khẩu hiện tại!';
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng nhập mật khẩu hiện tại!', life: 3000 });
        return false;
    }
    if (!passwordData.value.newPassword) {
        error.value.newPass = 'Vui lòng nhập mật khẩu mới!';
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng nhập mật khẩu mới!', life: 3000 });
        return false;
    }
    if (!passwordData.value.confirmPassword) {
        error.value.confirmPass = 'Vui lòng nhập mật khẩu xác nhận!';
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng nhập mật khẩu xác nhận!', life: 3000 });
        return false;
    }
    if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
        error.value.confirmPass = 'Mật khẩu xác nhận không khớp!';
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Mật khẩu xác nhận không khớp!', life: 3000 });
        return false;
    }
    return true;
};

const changePassword = async () => {
    if (!validatePassword()) {
        return;
    }
    try {
        await axiosInstance.post('/auth/change-password', {
            email: user.value.email,
            oldPassword: passwordData.value.currentPassword,
            newPassword: passwordData.value.newPassword
        });
        resetForm();
        toast.add({ severity: 'success', summary: 'Đổi mật khẩu thành công!', life: 3000 });
        // alert('Đổi mật khẩu thành công!');
    } catch (err) {
        console.error('Error changing password:', err);
        toast.add({ severity: 'error', summary: 'Đổi mật khẩu thất bại!', life: 3000 });
        // alert('Có lỗi xảy ra!');
    }
};
const resetForm = () => {
    passwordData.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };
    error.value = {
        oldPass: '',
        newPass: '',
        confirmPass: '',
        summary: ''
    };
}
const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
};

onMounted(fetchUserProfile);
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
    margin-left: 20px;
    width: 40%;
}

.left-side {
    margin-left: 20px;
    width: 60%;
    line-height: 1cm;
}

.profile-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;
    width: 100%;
    max-width: 600px;
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
    width: 60%;
    margin: 0;
}

.flex {
    display: flex;
    justify-content: space-between;
}
</style>
