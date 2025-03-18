<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4 text-center">Danh sách quỹ còn nợ</h2>

        <p v-if="error" class="text-red-500">{{ error }}</p>
        <p v-if="loading">Đang tải dữ liệu...</p>

        <div v-if="filteredContributions.length > 0">
            <div class="mb-4 flex items-center gap-4">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo tháng, năm, mô tả..."
                    class="p-inputtext w-64" />
            </div>

            <DataTable :value="paginatedContributions" class="p-datatable-striped">
                <Column field="periodName" header="Kỳ hạn" />
                <Column field="deadline" header="Hạn chót">
                    <template #body="slotProps">
                        <span :class="{ 'text-red-500': new Date() > new Date(slotProps.data.deadline) }">
                            {{ slotProps.data.deadline }}
                        </span>
                    </template>
                </Column>
                <Column field="note" header="Mô tả" />
                <Column field="owedAmount" header="Số tiền còn nợ" />
                <Column header="Hành động">
                    <template #body="slotProps">
                        <Button label="Đóng quỹ" @click="openUpdateDialog(slotProps.data)"
                            class="p-button-success p-button-sm" />
                    </template>
                </Column>
            </DataTable>

            <Paginator :rows="rowsPerPage" :totalRecords="filteredContributions.length" @page="onPageChange" />
        </div>
        <div v-else>
            <p class="text-red-500">Bạn đang không có nợ quỹ!</p>
        </div>

        <Dialog v-model:visible="showDialog" header="Thanh toán quỹ" :modal="true">
            <div class="p-fluid">
                <p class="mb-2">Nhập số tiền cần đóng:</p>
                <InputText v-model="paymentAmount" type="number" class="p-inputtext w-full" />
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Hủy" class="p-button-text" @click="showDialog = false" />
                    <Button label="Xác nhận" class="p-button-primary" @click="confirmUpdate" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Paginator from "primevue/paginator";
import axios from "axios";

const contributions = ref([]);
const loading = ref(true);
const error = ref(null);
const user = JSON.parse(sessionStorage.getItem("user"));
const userId = ref(user ? user.id : null);
const searchQuery = ref("");
const selectedContribution = ref(null);
const showDialog = ref(false);
const paymentAmount = ref(0);

// Pagination states
const rowsPerPage = ref(5);
const currentPage = ref(0);

const fetchPendingContributions = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            throw new Error("Unauthorized");
        }

        const response = await axios.get(`http://localhost:8080/api/v1/contributions/owed/${userId.value}`, {
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

onMounted(fetchPendingContributions);

const filteredContributions = computed(() => {
    if (!searchQuery.value) {
        return contributions.value;
    }
    return contributions.value.filter((contribution) =>
        (contribution.periodName && contribution.periodName.includes(searchQuery.value)) ||
        (contribution.note && contribution.note.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});

// Phân trang dữ liệu
const paginatedContributions = computed(() => {
    const start = currentPage.value * rowsPerPage.value;
    const end = start + rowsPerPage.value;
    return filteredContributions.value.slice(start, end);
});

const onPageChange = (event) => {
    currentPage.value = event.page;
};

const openUpdateDialog = (contribution) => {
    selectedContribution.value = contribution;
    console.log(selectedContribution.value);

    paymentAmount.value = contribution.owedAmount; // Gán số tiền mặc định là số tiền còn nợ
    showDialog.value = true;
};

const confirmUpdate = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            throw new Error("Unauthorized");
        }

        const paymentData = {
            periodId: selectedContribution.value.periodId,
            userId: selectedContribution.value.memberId,
            totalAmount: paymentAmount.value, // Dùng số tiền nhập vào
            note: "Thanh toán bổ sung quỹ " + selectedContribution.value.periodName,
        };

        await axios.put(`http://localhost:8080/api/v1/contributions/${selectedContribution.value.id}`, paymentData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        showDialog.value = false;
        fetchPendingContributions(); // Refresh danh sách sau khi thanh toán
    } catch (err) {
        console.error("Lỗi khi thanh toán:", err);
    }
};
</script>

<style scoped>
.p-datatable th {
    background-color: #f4f4f4;
    text-align: left;
}
</style>
