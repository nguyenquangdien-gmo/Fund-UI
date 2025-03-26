<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách quỹ chi</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo mã quỹ..." class="w-full p-inputtext-sm" />
                <!-- <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" /> -->
            </div>
            <DataTable :value="filteredTrans" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
                class="p-datatable-sm">
                <!-- <Column field="id" header="ID" sortable></Column> -->
                <Column field="transactionType" header="Loại giao dịch" sortable>
                    <template #body="{ data }">
                        {{ getTransactionLabel(data.transactionType) }}
                    </template>
                </Column>

                <Column field="userDto.fullName" header="Tên thành viên" sortable>
                    <template #body="{ data }">
                        {{ data.userDto?.fullName || 'N/A' }}
                    </template>
                </Column>
                <Column field="description" header="Mô tả" sortable></Column>
                <Column field="amount" header="Số Tiền" sortable>
                    <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                    </template>
                </Column>
                <Column field="createdAt" header="Ngày Tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>

            </DataTable>
        </div>
    </div>

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

const baseURL = "http://localhost:8080/api/v1";
const token = localStorage.getItem('accessToken');
const trans = ref<Trans[]>([]);
const searchQuery = ref("");
const router = useRouter();

const getTransactionLabel = (type: string) => {
    const mapping: Record<string, string> = {
        INCOME_FUND: "Đóng quỹ",
        INCOME_PENALTY: "Đóng phạt",
        EXPENSE: "Chi tiêu"
    };
    return mapping[type] || "Không xác định";
};


const fetchExpense = async () => {
    try {
        const response = await axios.get(`${baseURL}/trans`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        trans.value = response.data;
        console.log();
    } catch (error) {
        console.error('Error fetching funds:', error);
    }
}

const filteredTrans = computed(() => {
    if (!searchQuery.value) return trans.value;

    return trans.value.filter(tran => {
        const descriptionMatch = tran.description?.toLowerCase().includes(searchQuery.value.toLowerCase());
        const fullnameMatch = tran.userDto?.fullName?.toLowerCase().includes(searchQuery.value.toLowerCase());

        return descriptionMatch || fullnameMatch;
    });
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