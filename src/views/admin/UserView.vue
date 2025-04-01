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
                <Column field="dob" header="Ngày sinh" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.dob) }}
                    </template>
                </Column>
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
    <Dialog v-model:visible="showUserDialog" modal :header="isUpdate ? 'Cập nhật' : 'Thêm'" @hide="resetErrors"
        :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="fullName" class="fw-bold">Tên</label>
            <InputText id="fullName" v-model="form.fullName" class="w-100" autocomplete="off" />
        </div>
        <div class="mb-3">
            <label for="email" class="fw-bold">Email</label>
            <InputText id="email" v-model="form.email" class="w-100" type="email" autocomplete="off" />
        </div>
        <div class="mb-3" v-if="!isUpdate">
            <label for="password" class="fw-bold">Mật khẩu</label>
            <InputText id="password" type="password" v-model="form.password" class="w-100" autocomplete="off" />
        </div>
        <div class="mb-3">
            <label for="dob" class="fw-bold">Ngày sinh</label>
            <Calendar id="dob" v-model="form.dob" class="w-100" dateFormat="dd/mm/yy" showIcon />
        </div>
        <div class="mb-3">
            <label for="role" class="fw-bold">Vai trò</label>
            <Dropdown :disabled="isUpdate" v-model="selectedRole" :options="roles" optionLabel="label"
                optionValue="value" placeholder="Chọn vai trò" class="w-100 md:w-56" />
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
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import axiosInstance from '@/router/Interceptor';
import { useRouter } from 'vue-router';
import type { User } from '@/types/User';
import UserRole from '@/types/UserRole';

const showUserDialog = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, email: "", password: "", fullName: "", role: "", dob: null });
const selectedRole = ref<UserRole | null>(null);
const roles = ref([
    { label: "Admin", value: UserRole.ADMIN },
    { label: "Member", value: UserRole.MEMBER }
]);

const openCreateDialog = () => {
    form.value = { id: 0, email: "", password: "", fullName: "", role: "", dob: null };
    selectedRole.value = null;
    isUpdate.value = false;
    showUserDialog.value = true;
};

const openUpdateDialog = (user: User) => {
    form.value = { ...user, dob: new Date(user.dob) };
    selectedRole.value = roles.value.find(r => r.value === user.role)?.value || null;
    isUpdate.value = true;
    showUserDialog.value = true;
};

const saveUser = async () => {
    try {
        if (isUpdate.value) {
            await axiosInstance.put(`/users/${form.value.id}`, form.value);
        } else {
            form.value.role = selectedRole.value || "";
            await axiosInstance.post(`/auth/register`, form.value);
        }
        showUserDialog.value = false;
    } catch (error) {
        console.error('Error saving user:', error);
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};
</script>

<style scoped>
.left-10 {
    margin-left: 10px;
}
</style>
