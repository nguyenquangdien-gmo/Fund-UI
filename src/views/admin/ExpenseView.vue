<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách quỹ chi</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo mã quỹ..." class="w-full p-inputtext-sm" />
                <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" />
            </div>
            <DataTable :value="filteredExpense" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20]"
                class="p-datatable-sm">
                <Column field="id" header="ID" sortable></Column>
                <Column field="expenseType" header="Mã Quỹ" sortable></Column>
                <Column field="description" header="Tên Quỹ" sortable></Column>
                <Column field="amount" header="Số Tiền" sortable>
                    <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                    </template>
                </Column>
                <!-- <Column field="userId" header="Tạo bởi" sortable></Column> -->
                <Column field="createdAt" header="Ngày Tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Update" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)" />
                        <!-- <Button label="Delete" icon="pi pi-trash" severity="danger"
                            @click="confirmDeleteExpense(data)" /> -->
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
    <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa quỹ này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteExpense" />
        </div>
    </Dialog>

    <Dialog v-model:visible="showExpense" modal :header="isUpdate ? 'Update' : 'Create'" @hide="resetErrors"
        :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="name" class="fw-bold">Tên</label>
            <InputText id="name" v-model="form.name" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
        </div>
        <div class="mb-3">
            <label for="description" class="fw-bold">Mô tả</label>
            <InputText id="description" v-model="form.description" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
        </div>
        <div class="mb-3">
            <label for="amount" class="fw-bold">Tổng tiền</label>
            <InputText id="amount" type="number" v-model="form.amount" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.amount">{{ errors.amount }}</small>
        </div>
        <div class="mb-3">
            <label for="type" class="fw-bold">Loại quỹ</label>
            <Dropdown v-model="selectedType" :options="types" optionLabel="label" optionValue="value"
                placeholder="Chọn loại quỹ" class="w-100 md:w-56" />
            <small class="text-danger" v-if="errors.type">{{ errors.type }}</small>
        </div>
        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showExpense = false"></Button>
            <Button type="button" label="Save" severity="primary" @click="saveExpense"></Button>
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
import type FundType from '@/types/FundType';
import formatCurrency from '@/utils/FormatCurrency';
import type Expense from '@/types/Expense';
import { useUserStore } from '@/pinia/userStore';
import Dropdown from 'primevue/dropdown';
import ExpenseType from '@/types/ExpenseType';

const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false);
const expeneseToDelete = ref<Expense | null>(null);
const token = localStorage.getItem('accessToken');
const expenses = ref<Expense[]>([]);
const searchQuery = ref("");
const showExpense = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, name: "", description: "", userId: 0, expenseType: "", amount: "" });
const errors = ref({ name: "", description: "", type: "", amount: "" });
const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);

const selectedType = ref<ExpenseType | null>(null);
const types = ref([
    { label: "Quỹ chung", value: ExpenseType.COMMON },
    { label: "Quỹ ăn vặt", value: ExpenseType.SNACK }
]);


const fetchExpense = async () => {
    try {
        const response = await axios.get(`${baseURL}/expenses`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expenses.value = response.data;
    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
};

const filteredExpense = computed(() => {
    if (!searchQuery.value) return expenses.value;
    return expenses.value.filter(expense => expense.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const openCreateDialog = () => {
    form.value = { id: 0, name: "", userId: 0, description: "", expenseType: "", amount: "" };
    isUpdate.value = false;
    showExpense.value = true;
};

const openUpdateDialog = (expense: Expense) => {
    form.value = {
        id: expense.id,
        name: expense.name,
        userId: user.value.id,
        description: expense.description,
        expenseType: expense.expenseType.toString(),
        amount: expense.amount.toString()
    };
    selectedType.value = types.value.find(t => t.value === expense.expenseType)?.value || null;

    isUpdate.value = true;
    showExpense.value = true;
    console.log(form.value);

};




const validateForm = () => {
    errors.value = { name: "", description: "", type: "", amount: "" };
    if (!form.value.name) errors.value.name = "Name is required!";
    if (!form.value.description) errors.value.name = "Description is required!";
    if (!selectedType.value) errors.value.type = "Type is required!";
    if (!form.value.amount || Number(form.value.amount) < 0)
        errors.value.amount = "Amount is required and must be greater than 0!";
    return Object.values(errors.value).every(err => err === "");
};

const saveExpense = async () => {
    if (!validateForm()) return;
    try {
        if (isUpdate.value) {
            if (selectedType.value) {
                form.value.expenseType = selectedType.value;
            }
            console.log(selectedType.value);

            await axios.put(`${baseURL}/expenses/${form.value.id}`, form.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(form.value);

        } else {
            if (selectedType.value) {
                form.value.expenseType = selectedType.value;
                form.value.userId = user.value.id;
                console.log(form.value);
                await axios.post(`${baseURL}/expenses`, form.value, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(form.value);
            }
        }
        showExpense.value = false;
        fetchExpense();
    } catch (error) {
        console.error('Error saving fund:', error);
    }
}; const resetErrors = () => {
    errors.value = { name: "", description: "", type: "", amount: "" };
};

const deleteExpense = async () => {
    if (!expeneseToDelete.value) return;
    try {
        await axios.delete(`${baseURL}/expenses/${expeneseToDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchExpense();
    } catch (error) {
        console.error('Error deleting fund:', error);
    } finally {
        showConfirmDialog.value = false;
        expeneseToDelete.value = null;
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
        fetchExpense();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}
</style>