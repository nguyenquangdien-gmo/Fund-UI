<script setup>
import { ref, onMounted, computed } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import axios from "axios";

const contributions = ref([]);
const loading = ref(true);
const error = ref(null);
const user = JSON.parse(sessionStorage.getItem("user"));
const userId = ref(user ? user.id : null);
const searchQuery = ref("");
const rowsPerPage = ref(5); // Số dòng mỗi trang
const currentPage = ref(0);

const fetchContributions = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            throw new Error("Unauthorized");
        }

        const response = await axios.get(`http://localhost:8080/api/v1/contributions/user/${userId.value}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        contributions.value = response.data;
    } catch (err) {
        error.value = "Không thể tải dữ liệu";
        console.error(err);
    } finally {
        loading.value = false;
    }
};
onMounted(fetchContributions);

const formatCurrency = (value) => {
    return value.toLocaleString() + " VND";
};

const getStatusSeverity = (status) => {
    switch (status) {
        case "PAID":
            return "success";
        case "PENDING":
            return "info";
        case "OVERDUE":
            return "danger";
        case "PARTIAL":
            return "warn";
        default:
            return "secondary";
    }
};

const filteredContributions = computed(() => {
    if (!searchQuery.value) {
        return contributions.value;
    }
    return contributions.value.filter((contribution) =>
        (contribution.id && contribution.id.toString().includes(searchQuery.value)) ||
        (contribution.periodName && contribution.periodName.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
        (contribution.paymentStatus && contribution.paymentStatus.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});

const paginatedContributions = computed(() => {
    const start = currentPage.value * rowsPerPage.value;
    const end = start + rowsPerPage.value;
    return filteredContributions.value.slice(start, end);
});

const onPageChange = (event) => {
    currentPage.value = event.page;
};
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">Lịch sử đóng quỹ</h2>

        <div v-if="filteredContributions.length > 0">
            <div class="mb-4 flex items-center gap-4">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo Id, Kỳ đóng, Trạng thái..."
                    class="p-inputtext w-64" />
                <Dropdown v-model="rowsPerPage" :options="[5, 10, 15]" placeholder="Số dòng/trang" class="w-32" />
            </div>

            <p v-if="error" class="text-red-500">{{ error }}</p>
            <p v-if="loading">Đang tải dữ liệu...</p>

            <DataTable v-else :value="paginatedContributions" class="p-datatable-striped" paginator :rows="rowsPerPage"
                :totalRecords="filteredContributions.length" :first="currentPage * rowsPerPage" @page="onPageChange">
                <Column field="id" header="Id" />
                <Column field="periodName" header="Kỳ đóng" />
                <Column field="totalAmount" header="Số tiền">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.totalAmount) }}
                    </template>
                </Column>
                <Column field="paymentStatus" header="Trạng thái">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.paymentStatus"
                            :severity="getStatusSeverity(slotProps.data.paymentStatus)" />
                    </template>
                </Column>
                <Column field="note" header="Ghi chú" />
                <Column field="deadline" header="Hạn chót">
                    <template #body="slotProps">
                        <span :class="{ 'text-red-500': slotProps.data.isLate }">
                            {{ slotProps.data.deadline }}
                        </span>
                    </template>
                </Column>
                <Column field="owedAmount" header="Thiếu">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.owedAmount) }}
                    </template>
                </Column>
                <Column field="overpaidAmount" header="Dư">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.overpaidAmount) }}
                    </template>
                </Column>
            </DataTable>
        </div>
        <p v-else>Bạn chưa đóng bất kì quỹ nào</p>

    </div>
</template>

<style scoped>
.p-datatable th {
    background-color: #f4f4f4;
    text-align: left;
}
</style>
