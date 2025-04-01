<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-xl">Danh Sách thành viên chưa đóng quỹ hoặc nợ quỹ</h2>
            <div class="mb-3">
                <select v-model="selectedMonth" @change="onMonthChange"
                    class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300 select-year">
                    <option v-for="month in availableMonths" :key="month" :value="month">
                        {{ month }}
                    </option>
                </select>
                <select v-model="selectedYear" @change="onYearChange"
                    class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300 select-year left-10">
                    <option v-for="year in availableYears" :key="year" :value="year">
                        {{ year }}
                    </option>
                </select>
            </div>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo mã thành viên or tên..."
                    class="w-full p-inputtext-sm" style="width: 25%;" />
                <Button label="Create reminder" severity="success" class="left-10" raised size="small"
                    @click="openCreateDialog" />
            </div>
            <DataTable :value="filteredUsers" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
                class="p-datatable-sm">
                <Column field="user.id" header="ID" sortable></Column>
                <Column field="user.email" header="Email" sortable></Column>
                <Column field="user.fullName" header="Tên " sortable></Column>
                <Column field="user.role" header="Vai trò " sortable></Column>
                <Column field="amountToPay" header="Tổng tiền" sortable>
                    <template #body="{ data }">
                        {{ formatCurrency(data.amountToPay) }}
                    </template>
                </Column>

                <!-- <Column field="createdAt" header="Ngày Tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
</Column> -->
                <!-- <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Update" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)" />
                        <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteFund(data)" />
                    </template>
                </Column> -->
            </DataTable>
        </div>
    </div>
    <!-- <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa thành viên này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteUser" />
        </div>
    </Dialog> -->

    <Dialog v-if="isAdmin" v-model:visible="showReminderDialog" modal :header="'Create Reminder'" @hide="resetErrors"
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
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, type Ref } from 'vue';
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
import post from '@/functions/Reminder';
import type UserRole from '@/types/UserRole';

interface UserData {
    user: User;
    amountToPay: number;
}
// const baseURL = "http://localhost:8080/api/v1";
// const showConfirmDialog = ref(false);
// const userToDelete = ref<User | null>(null);
const token = localStorage.getItem('accessToken');
const users = ref<UserData[]>([]);
const searchQuery = ref("");
const form = ref({ id: 0, title: "", description: "", type: "", status: "", created_at: "" });
const errors = ref({ name: "", description: "" });
const router = useRouter();


// const selectedRole = ref<UserRole | null>(null);
// const roles = ref([
//     { label: "Admin", value: UserRole.ADMIN },
//     { label: "Member", value: UserRole.MEMBER }
// ]);
const userStore = useUserStore();
const user = computed(() => userStore.user);
const isAdmin = computed(() => user.value?.role === "ADMIN");

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const availableYears = ref<number[]>([]);

const showReminderDialog = ref(false);

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
        const response = await axiosInstance.get(`/users/no-contribution/period`, {
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
//crate  reminder




const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value;
    return users.value.filter(user => user.user.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const openCreateDialog = () => {
    form.value = { id: 0, title: "", description: "", type: "", status: "", created_at: "" };
    showReminderDialog.value = true;
};
// const confirmDeleteFund = (user: User) => {
//     userToDelete.value = user;
//     showConfirmDialog.value = true;
// };


const validateForm = () => {
    errors.value = { name: "", description: "" };

    if (!form.value.title) {
        errors.value.name = "Title is required!";
    }
    if (!form.value.description) {
        errors.value.description = "Description is required!";
    }

    return Object.values(errors.value).every(err => err === "");
};

const message = ref('');
const formatDebtMessageForExcel = (users: UserData[]): string => {
    let message = "|STT | TÊN | TIỀN NỢ|\n";
    message += "|--- | --- | ---|\n";

    users.forEach((userDebt, index) => {
        const stt = (index + 1).toString();
        const name = userDebt.user.fullName;
        const amount = formatCurrency(userDebt.amountToPay.toLocaleString());

        message += `|${stt} | ${name} | ${amount}|\n`;
    });

    return message;
};

const saveReminder = async () => {
    if (!validateForm()) return;
    try {
        await axiosInstance.post(`/reminders/create/other`, form.value, {
            headers: { Authorization: `Bearer ${token}` }
        });

        message.value = `@all **Các anh/chị/em chưa đóng quỹ tháng ${selectedMonth.value}**\n\n`;
        message.value += formatDebtMessageForExcel(users.value);

        await post(message.value);

        showReminderDialog.value = false;
        fetchUsers();
    } catch (error) {
        console.error('Error saving reminder:', error);
    }
};


const resetErrors = () => {
    errors.value = { name: "", description: "" };
}


// const deleteUser = async () => {
//     if (!userToDelete.value) return;
//     try {
//         await axiosInstance.delete(`${baseURL} /users/${userToDelete.value.id} `, {
//             headers: { Authorization: `Bearer ${token} ` }
//         });
//         fetchUsers();
//     } catch (error) {
//         console.error('Error deleting user:', error);
//     } finally {
//         showConfirmDialog.value = false;
//         userToDelete.value = null;
//     }
// };



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