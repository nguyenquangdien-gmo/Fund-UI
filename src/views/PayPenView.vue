<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách nợ phạt</h2>
            <div v-if="bills.length > 0">
                <div class="mb-3">
                    <InputText v-model="searchQuery" placeholder="Tìm kiếm theo id, tên..."
                        class="w-full p-inputtext-sm" />
                    <!-- <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" /> -->
                </div>
                <DataTable :value="filteredBills" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
                    class="p-datatable-sm">
                    <Column field="description" header="Mô Tả" sortable></Column>
                    <Column field="amount" header="Tổng cộng" sortable>
                        <template #body="{ data }">
                            {{ formatCurrency(data.amount) }}
                        </template>
                    </Column>

                    <Column field="created" header="Ngày tạo" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.dueDate) }}
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body="{ data }">
                            <Button v-if="data.paymentStatus === 'UNPAID'" label="Đóng phạt" icon="pi pi-wallet"
                                @click="confirmPay(data)" severity="info" />
                            <Button v-if="data.paymentStatus === 'PENDING'" label="Chờ xác nhận" icon="pi pi-hourglass"
                                severity="info" disabled />
                            <!-- <Button v-else label="Đã đóng phạt" icon="pi pi-check-square" severity="success" disabled /> -->
                        </template>
                    </Column>
                </DataTable>
            </div>
            <div v-else>
                <p>Bạn không có bất kỳ nợ phạt nào!</p>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận đóng quỹ" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn đóng quỹ phạt này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Đóng quỹ" severity="primary" @click="payBill" />
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
import formatCurrency from '@/utils/FormatCurrency';
import type PenBill from '@/types/PenBill';

const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false);
const token = localStorage.getItem('accessToken');
const bills = ref<PenBill[]>([]);
const searchQuery = ref("");
const form = ref({ id: 0, userId: 0, penaltyId: 0, dueDate: "", description: "", amount: "" });
const router = useRouter();
const user = ref(JSON.parse(sessionStorage.getItem('user') || '{}'));
const fetchBills = async () => {
    try {
        const response = await axios.get(`${baseURL}/pen-bills/user/${user.value.id}/unpaid`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        bills.value = response.data;
        console.log(bills.value);

    } catch (error) {
        console.error('Error fetching periods:', error);
    }
};


const filteredBills = computed(() => {
    if (!searchQuery.value) return bills.value;
    return bills.value.filter(bill => bill.description.includes(searchQuery.value) || bill.dueDate.includes(searchQuery.value));
});


const confirmPay = (bill: PenBill) => {
    form.value = { id: bill.id, userId: user.value.id, penaltyId: Number(bill.penaltyId), dueDate: bill.dueDate, description: bill.description, amount: bill.amount.toString() };
    showConfirmDialog.value = true;
};

const payBill = async () => {
    const billData = {
        userId: Number(form.value.userId),
        penaltyId: Number(form.value.penaltyId),
        dueDate: form.value.dueDate,
        amount: Number(form.value.amount),
        description: form.value.description
    }
    try {
        await axios.put(`${baseURL}/pen-bills/${form.value.id}`, billData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        showConfirmDialog.value = false;
        fetchBills();
    } catch (error) {
        console.error('Error saving period:', error);
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
        fetchBills();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}
</style>
