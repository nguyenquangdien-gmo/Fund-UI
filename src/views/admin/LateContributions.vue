<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-xl">Danh Sách thành viên đóng quỹ muộn</h2>
            <div class="mb-3">
                <select v-model="selectedMonth" @change="onMonthChange"
                    class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300 select-year">
                    <option v-for="month in availableMonths" :key="month" :value="month">
                        {{ month }}
                    </option>
                </select>
                <select v-model="selectedYear" @change="onYearChange"
                    class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300 select-year">
                    <option v-for="year in availableYears" :key="year" :value="year">
                        {{ year }}
                    </option>
                </select>
            </div>
            <div class="mb-3">
                <InputText v-if="users.length > 0" v-model="searchQuery"
                    placeholder="Tìm kiếm theo tên or mã NV..." class="w-full p-inputtext-sm" style="width: 20%;" />
                <!-- <Button label="Create reminder" severity="success" raised size="small" @click="openCreateDialog" /> -->
            </div>
            <DataTable v-if="users.length > 0" :value="filteredFunds" paginator :rows="15"
                :rowsPerPageOptions="[15, 20, 25]" class="p-datatable-sm">
                <Column header="STT" sortable>
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
                <Column field="user.email" header="Email" sortable></Column>
                <Column field="user.fullName" header="Tên " sortable></Column>
                <Column field="user.team.name" header="Team" sortable></Column>
                <Column field="totalAmount" header="Tổng tiền" sortable>
                    <template #body="{ data }">
                        {{ formatCurrency(data.totalAmount) }}
                    </template>
                </Column>
                <Column field="user.paymentDate" header="Ngày Tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.paymentDate) }}
                    </template>
                </Column>
                <!-- <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Update" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)" />
                        <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteFund(data)" />
                    </template>
                </Column> -->
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

    <!-- <Dialog v-if="isAdmin" v-model:visible="showReminderDialog" modal :header="'Create Reminder'" @hide="resetErrors"
        :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="title" class="fw-bold">Title</label>
            <InputText id="title" v-model="form.title" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
        </div>
        <div class="mb-3">
            <label for="description" class="fw-bold">Description</label>
            <Textarea id="description" v-model="form.description" class="w-100" rows="5" cols="30" />
            <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
        </div>

        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showReminderDialog = false"></Button>
            <Button type="button" label="Save" severity="primary" @click="saveReminder"></Button>
        </div>
    </Dialog> -->
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
import Textarea from 'primevue/textarea';
import { useUserStore } from '@/pinia/userStore';
import formatCurrency from '@/utils/FormatCurrency';

// const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false);
const userToDelete = ref<User | null>(null);
const token = localStorage.getItem('accessToken');
const users = ref<User[]>([]);
const searchQuery = ref("");
const form = ref({ id: 0, title: "", description: "", type: "", status: "", created_at: "" });
const errors = ref({ name: "", description: "" });
const router = useRouter();

// const selectedRole = ref<UserRole | null>(null);
// const roles = ref([
//     { label: "Admin", value: UserRole.ADMIN },
//     { label: "Member", value: UserRole.MEMBER }
// ]);
// const userStore = useUserStore();
// const user = computed(() => userStore.user);
// const isAdmin = computed(() => user.value?.role === "ADMIN");

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const availableYears = ref<number[]>([]);

// const showReminderDialog = ref(false);

for (let year = 2020; year <= currentYear; year++) {
    availableYears.value.push(year);
}

const selectedMonth = ref(new Date().getMonth() + 1);
const availableMonths = ref<number[]>([]);

for (let month = 1; month <= 12; month++) {
    availableMonths.value.push(month);
}
const onYearChange = () => {
    // fetchDataMonths(selectedYear.value);
    // fetchExpenseByYear();
    // fetchChargeByYear();
    fetchUsers();
};

const onMonthChange = () => {
    // fetchDataMonths(selectedYear.value);
    // fetchExpenseByYear();
    // fetchChargeByYear();
    fetchUsers();
};

const fetchUsers = async () => {
    try {
        const response = await axiosInstance.get(`/users/late-payments`, {
            params: {
                year: selectedYear.value,
                month: selectedMonth.value
            },
            headers: { Authorization: `Bearer ${token}` }
        });
        users.value = response.data;
        // console.log(users.value);

    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

const filteredFunds = computed(() => {
    if (!searchQuery.value) return users.value;
    return users.value.filter(user => user.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) || user.id === Number(searchQuery.value));
});

// const openCreateDialog = () => {
//     form.value = { id: 0, title: "", description: "", type: "", status: "", created_at: "" };
//     showReminderDialog.value = true;
// };
// const confirmDeleteFund = (user: User) => {
//     userToDelete.value = user;
//     showConfirmDialog.value = true;
// };



// const validateForm = () => {
//     errors.value = { name: "", description: "" };
//     if (!form.value.title) errors.value.name = "Name is required!";
//     if (!form.value.description) errors.value.name = "Description is required!";

//     return Object.values(errors.value).every(err => err === "");
// };
// const saveReminder = async () => {
//     if (!validateForm()) return;
//     try {

//         await axiosInstance.post(`${baseURL}/reminders/create/other`, form.value, {
//             headers: { Authorization: `Bearer ${token}` }
//         });
//         console.log(form.value);

//         showReminderDialog.value = false;

//         fetchUsers();
//     } catch (error) {
//         console.error('Error saving reminder:', error);
//     }
// };
// const resetErrors = () => {
//     errors.value = { name: "", description: "" };
// }


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
</style>