<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-xl">Danh Sách Vai trò</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo tên role" class="w-full p-inputtext-sm" />
                <Button label="Tạo vai trò" severity="success" class="left-10" raised size="small"
                    @click="openCreateDialog" />
            </div>
            <DataTable :value="filteredRoles" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
                class="p-datatable-sm">
                <Column header="STT" sortable style="width: 10%;">
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
                <Column field="name" header="Tên vai trò" sortable style="width: 70%;"></Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Sửa" icon="pi pi-pencil" severity="info" @click="openUpdateDialog(data)" />
                        <Button label="Xóa" icon="pi pi-trash" class="left-10" severity="danger"
                            @click="confirmDeleteRole(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>

    <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa vai trò này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteRole" />
        </div>
    </Dialog>
    <Dialog v-model:visible="showRoleDialog" modal :header="isUpdate ? 'Cập nhật' : 'Tạo'" @hide="resetErrors"
    :style="{ width: '30rem' }">
    <div class="mb-3">
        <label for="name" class="fw-bold">
            Tên vai trò <span class="text-danger">*</span>
        </label>
        <InputText id="name" type="text" v-model="form.name" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
    </div>

    <div class="d-flex justify-content-end gap-2">
        <Button type="button" label="Hủy" severity="secondary" @click="showRoleDialog = false" />
        <Button type="button" label="Lưu" severity="primary" @click="saveRole" />
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
import type Role from '@/types/Role';

const showConfirmDialog = ref(false);
const roleDelete = ref<Role | null>(null);
const token = localStorage.getItem('accessToken');
const roles = ref<Role[]>([]);
const searchQuery = ref("");
const showRoleDialog = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, name: "" });
const router = useRouter();
const errors = ref({ name: "" });

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get(`/roles`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        roles.value = response.data;
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
};

const validateForm = () => {
    errors.value = { name: "" };

    if (!form.value.name) errors.value.name = "Vui lòng nhập tên vai trò!";

    return Object.values(errors.value).every(err => err === "");
};

const resetErrors = () => {
    errors.value = { name: "" };
};

const filteredRoles = computed(() => {
    if (!searchQuery.value) return roles.value;
    return roles.value.filter(role => role.name.includes(searchQuery.value) || role.id.toString().includes(searchQuery.value));
});

const openCreateDialog = () => {
    form.value = { id: 0, name: "" };
    isUpdate.value = false;
    showRoleDialog.value = true;
};

const openUpdateDialog = (role: Role) => {
    form.value = { id: role.id, name: role.name };
    isUpdate.value = true;
    showRoleDialog.value = true;
};

const confirmDeleteRole = (role: Role) => {
    roleDelete.value = role;
    showConfirmDialog.value = true;
};

const saveRole = async () => {
    if (!validateForm()) return;
    try {
        const roleData = { ...form.value };
        if (isUpdate.value) {
            await axiosInstance.put(`/roles/${form.value.id}`, roleData
            );
        } else {
            await axiosInstance.post(`/roles`, roleData);
        }
        showRoleDialog.value = false;
        fetchRoles();
    } catch (error) {
        console.error('Error saving role:', error);
    }
};

const deleteRole = async () => {
    if (!roleDelete.value) return;
    try {
        await axiosInstance.delete(`/roles/${roleDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchRoles();
    } catch (error) {
        console.error('Error deleting role:', error);
    } finally {
        showConfirmDialog.value = false;
        roleDelete.value = null;
    }
};


onMounted(() => {
    if (!token) {
        router.push('/');
    } else {
        fetchRoles();
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
