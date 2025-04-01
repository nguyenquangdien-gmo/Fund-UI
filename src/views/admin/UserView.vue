<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-xl">Danh Sách Thành viên</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo mã quỹ..." class="w-full p-inputtext-sm" />
                <Button class="left-10" label="Thêm thành viên" severity="success" raised size="small"
                    @click="openCreateDialog" />
            </div>
            <DataTable :value="filteredFunds" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
                class="p-datatable-sm">
                <Column field="id" header="ID" sortable></Column>
                <Column field="email" header="Email" sortable></Column>
                <Column field="fullName" header="Tên " sortable></Column>
                <Column field="role" header="Vai trò " sortable></Column>

                <Column field="createdAt" header="Ngày Tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Sửa" icon="pi pi-user-edit" severity="info" @click="openUpdateDialog(data)" />
                        <Button label="Xóa" class="left-10" icon="pi pi-trash" severity="danger"
                            @click="confirmDeleteFund(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
    <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa thành viên này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteUser" />
        </div>
    </Dialog>

    <Dialog v-model:visible="showUserDialog" modal :header="isUpdate ? 'Cập nhật' : 'Thêm'" @hide="resetErrors"
        :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="id" class="fw-bold">Mã nhân viên</label>
            <InputText id="id" v-model="userId" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.fullName">{{ errors.fullName }}</small>
        </div>
        <div class="mb-3">
            <label for="fullName" class="fw-bold">Tên</label>
            <InputText id="fullName" v-model="form.fullName" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.fullName">{{ errors.fullName }}</small>
        </div>
        <div class="mb-3">
            <label for="email" class="fw-bold">Email</label>
            <InputText id="email" v-model="form.email" class="w-100" type="email" autocomplete="off" />
            <small class="text-danger" v-if="errors.email">{{ errors.email }}</small>
        </div>
        <div class="mb-3" v-if="!isUpdate">
            <label for="password" class="fw-bold">Mật khẩu</label>
            <InputText id="password" type="text" v-model="form.password" class="w-100" autocomplete="off" />
            <!-- <small class="text-danger" v-if="errors.password">{{ errors.password }}</small> -->
        </div>
        <div class="mb-3">
            <label for="type" class="fw-bold">Vai trò</label>
            <Dropdown :disabled="isUpdate" v-model="selectedRole" :options="roles" optionLabel="label"
                optionValue="value" placeholder="Chọn vai trò" class="w-100 md:w-56" />

            <small class="text-danger" v-if="errors.role">{{ errors.role }}</small>
        </div>
        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Hủy" severity="secondary" @click="showUserDialog = false"></Button>
            <Button type="button" label="Lưu" severity="primary" @click="saveUser"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import axiosInstance from '@/router/Interceptor';
import { useRouter } from 'vue-router';
import type { User } from '@/types/User';
import Dropdown from 'primevue/dropdown';
import UserRole from '@/types/UserRole';

// const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false);
const userToDelete = ref<User | null>(null);
const token = localStorage.getItem('accessToken');
const users = ref<User[]>([]);
const searchQuery = ref("");
const showUserDialog = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, email: "", password: "", fullName: "", role: "" });
const errors = ref({ id: "", email: "", fullName: "", role: "" });
const router = useRouter();
const userId = ref('');

const selectedRole = ref<UserRole | null>(null);
const roles = ref([
    { label: "Admin", value: UserRole.ADMIN },
    { label: "Member", value: UserRole.MEMBER }
]);

const fetchUsers = async () => {
    try {
        const response = await axiosInstance.get(`/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        users.value = response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

const filteredFunds = computed(() => {
    if (!searchQuery.value) return users.value;
    return users.value.filter(user => user.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const openCreateDialog = () => {
    form.value = { id: 0, email: "", password: "", fullName: "", role: "" };
    userId.value = '';
    isUpdate.value = false;
    showUserDialog.value = true;
};

const openUpdateDialog = (user: User) => {
    form.value = { id: user.id, email: user.email, fullName: user.fullName, role: user.role, password: "" };
    selectedRole.value = roles.value.find(r => r.value === user.role)?.value || null;
    userId.value = user.id.toString();
    isUpdate.value = true;
    showUserDialog.value = true;
};
const confirmDeleteFund = (user: User) => {
    userToDelete.value = user;
    showConfirmDialog.value = true;
};


const validateForm = () => {
    errors.value = { id: "", email: "", fullName: "", role: "" };
    if (!userId.value) errors.value.id = "Vui lòng nhập mã nhân viên!";
    if (!form.value.email) errors.value.email = "Vui lòng nhập email!";
    if (!form.value.fullName) errors.value.fullName = "Vui lòng nhập họ tên!";
    if (!selectedRole) errors.value.role = "Vui lòng chọn vai trò!";

    return Object.values(errors.value).every(err => err === "");
};

const saveUser = async () => {
    if (!validateForm()) return;
    try {
        if (isUpdate.value) {
            form.value.id = parseInt(userId.value);
            await axiosInstance.put(`/users/${form.value.id}`, form.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            if (selectedRole.value) {
                form.value.role = selectedRole.value;
                form.value.id = Number(userId.value);
                // console.log(form.value);
                await axiosInstance.post(`/auth/register`, form.value, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // console.log(form.value);
            }
        }
        showUserDialog.value = false;
        fetchUsers();
    } catch (error) {
        console.error('Error saving user:', error);
    }
}; const resetErrors = () => {
    errors.value = { id: "", email: "", fullName: "", role: "" };
};

const deleteUser = async () => {
    if (!userToDelete.value) return;
    try {
        await axiosInstance.delete(`/users/${userToDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        showConfirmDialog.value = false;
        userToDelete.value = null;
    }
};


const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

onMounted(() => {
    if (!token) {
        router.push('/');
    } else {
        fetchUsers();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}

.left-10 {
    margin-left: 10px;
}
</style>