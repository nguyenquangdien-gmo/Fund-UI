<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách quỹ chi</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo mã quỹ..." class="w-full p-inputtext-sm" />
                <!-- <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" /> -->
            </div>
            <DataTable :value="filteredTrans" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20]"
                class="p-datatable-sm">
                <Column field="id" header="ID" sortable></Column>
                <Column field="transactionType" header="Mã Quỹ" sortable></Column>
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
                <!-- <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Update" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)" />
                        <Button label="Delete" icon="pi pi-trash" severity="danger"
                            @click="confirmDeleteExpense(data)" />
                    </template>
                </Column> -->
            </DataTable>
        </div>
    </div>
    <!-- <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa quỹ này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteExpense" />
        </div>
    </Dialog> -->

    <!-- <Dialog v-model:visible="showExpense" modal :header="isUpdate ? 'Update Fund' : 'Create Fund'" @hide="resetErrors"
        :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="description" class="fw-bold">Description</label>
            <InputText id="description" v-model="form.description" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
        </div>
        <div class="mb-3">
            <label for="amount" class="fw-bold">Total</label>
            <InputText id="amount" type="number" v-model="form.amount" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.amount">{{ errors.amount }}</small>
        </div>
        <div class="mb-3">
            <label for="type" class="fw-bold">Category</label>
            <Select v-model="selectedExpense" :options="typeOfTrans" optionLabel="name" placeholder="Select a category"
                class="w-100 md:w-56" />
            <small class="text-danger" v-if="errors.transactionType">{{ errors.transactionType }}</small>
        </div>
        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showExpense = false"></Button>
            <Button type="button" label="Save" severity="primary" @click="saveExpense"></Button>
        </div>
    </Dialog> -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import axios from 'axios';
import { useRouter } from 'vue-router';
import formatCurrency from '@/utils/FormatCurrency';
import type Trans from '@/types/Trans';


const token = localStorage.getItem('accessToken');
const trans = ref<Trans[]>([]);
const searchQuery = ref("");
const router = useRouter();

const fetchExpense = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/v1/expenses', {
            headers: { Authorization: `Bearer ${token}` }
        });
        trans.value = response.data;
    } catch (error) {
        console.error('Error fetching funds:', error);
    }
}

const filteredTrans = computed(() => {
    if (!searchQuery.value) return trans.value;
    return trans.value.filter(tran => tran.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

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