<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách Thành viên</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo mã quỹ..." class="w-full p-inputtext-sm" />
                <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" />
            </div>
            <DataTable :value="filteredFunds" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20]"
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
                        <Button label="Update" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)" />
                        <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteFund(data)" />
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

    <Dialog v-model:visible="showUserDialog" modal :header="isUpdate ? 'Update' : 'Create'" @hide="resetErrors"
        :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="fullName" class="fw-bold">Tên</label>
            <InputText id="fullName" v-model="form.fullName" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.fullName">{{ errors.fullName }}</small>
        </div>
        <div class="mb-3">
            <label for="email" class="fw-bold">Email</label>
            <InputText id="email" v-model="form.email" class="w-100" type="email" autocomplete="off"
                :disabled="isUpdate" />
            <small class="text-danger" v-if="errors.email">{{ errors.email }}</small>
        </div>
        <div class="mb-3" v-if="!isUpdate">
            <label for="password" class="fw-bold">Mật khẩu</label>
            <InputText id="password" type="text" v-model="form.password" class="w-100" autocomplete="off" />
            <!-- <small class="text-danger" v-if="errors.password">{{ errors.password }}</small> -->
        </div>
        <div class="mb-3">
            <label for="type" class="fw-bold">Vai trò</label>
            <Dropdown v-model="selectedRole" :options="roles" optionLabel="label" optionValue="value"
                placeholder="Chọn vai trò" class="w-100 md:w-56" />

            <small class="text-danger" v-if="errors.role">{{ errors.role }}</small>
        </div>
        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showUserDialog = false"></Button>
            <Button type="button" label="Save" severity="primary" @click="saveUser"></Button>
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
import axios from 'axios';
import { useRouter } from 'vue-router';
import type { User } from '@/types/User';
import Dropdown from 'primevue/dropdown';
import UserRole from '@/types/UserRole';


const showConfirmDialog = ref(false);
const userToDelete = ref<User | null>(null);
const token = localStorage.getItem('accessToken');
const users = ref<User[]>([]);
const searchQuery = ref("");
const showUserDialog = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, email: "", password: "", fullName: "", role: "" });
const errors = ref({ email: "", fullName: "", role: "" });
const router = useRouter();

const selectedRole = ref<UserRole | null>(null);
const roles = ref([
    { label: "Admin", value: UserRole.ADMIN },
    { label: "Member", value: UserRole.MEMBER }
]);

const fetchUsers = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/v1/users', {
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
    isUpdate.value = false;
    showUserDialog.value = true;
};

const openUpdateDialog = (user: User) => {
    form.value = { id: user.id, email: user.email, fullName: user.fullName, role: user.role, password: "" };
    selectedRole.value = roles.value.find(r => r.value === user.role)?.value || null;
    isUpdate.value = true;
    showUserDialog.value = true;
};
const confirmDeleteFund = (user: User) => {
    userToDelete.value = user;
    showConfirmDialog.value = true;
};


const validateForm = () => {
    errors.value = { email: "", fullName: "", role: "" };
    if (!form.value.email) errors.value.email = "Email is required!";
    if (!form.value.fullName) errors.value.fullName = "Fullname is required!";
    if (!selectedRole) errors.value.role = "Role is required!";

    return Object.values(errors.value).every(err => err === "");
};

const saveUser = async () => {
    if (!validateForm()) return;
    try {
        if (isUpdate.value) {
            await axios.put(`http://localhost:8080/api/v1/users//${form.value.id}`, form.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            if (selectedRole.value) {
                form.value.role = selectedRole.value;
                console.log(form.value);
                await axios.post('http://localhost:8080/api/v1/auth/register', form.value, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(form.value);
            }
        }
        showUserDialog.value = false;
        fetchUsers();
    } catch (error) {
        console.error('Error saving user:', error);
    }
}; const resetErrors = () => {
    errors.value = { email: "", fullName: "", role: "" };
};

const deleteUser = async () => {
    if (!userToDelete.value) return;
    try {
        await axios.delete(`http://localhost:8080/api/v1/users/${userToDelete.value.id}`, {
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
</style>