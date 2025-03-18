<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4" style="text-align: center;">Danh sách quỹ chưa đóng</h2>

        <p v-if="error" class="text-red-500">{{ error }}</p>
        <p v-if="loading">Đang tải dữ liệu...</p>

        <div v-if="paginatedContributions.length > 0">
            <div class="mb-4 flex items-center gap-4">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo tháng, năm, mô tả..."
                    class="p-inputtext w-64" />
            </div>

            <!-- DataTable với phân trang -->
            <DataTable :value="paginatedContributions" class="p-datatable-striped" paginator :rows="rowsPerPage"
                :totalRecords="filteredContributions.length" @page="onPageChange" responsiveLayout="scroll">
                <Column field="month" header="Tháng" />
                <Column field="year" header="Năm" />
                <Column field="deadline" header="Hạn chót">
                    <template #body="slotProps">
                        <span :class="{ 'text-red-500': new Date() > new Date(slotProps.data.deadline) }">
                            {{ slotProps.data.deadline }}
                        </span>
                    </template>
                </Column>
                <Column field="description" header="Mô tả" />
                <Column header="Hành động">
                    <template #body="slotProps">
                        <Button label="Đóng quỹ" @click="openPaymentDialog(slotProps.data)"
                            class="p-button-success p-button-sm" />
                    </template>
                </Column>
            </DataTable>
        </div>
        <div v-else>
            <p class="text-red-500">Bạn không có quỹ nào cần đóng!</p>
        </div>

        <!-- Dialog Thanh Toán -->
        <Dialog v-model:visible="showDialog" header="Đóng Quỹ" :modal="true">
            <div class="p-fluid">
                <p class="mb-2">Nhập số tiền cần đóng:</p>
                <InputText v-model="paymentAmount" type="number" class="p-inputtext w-full" />
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Hủy" class="p-button-text" @click="showDialog = false" />
                    <Button label="Xác nhận" class="p-button-primary" @click="confirmPayment" />
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

// Pagination
const rowsPerPage = ref(5); // Số dòng hiển thị trên mỗi trang
const currentPage = ref(0); // Trang hiện tại

// Fetch Data
const fetchPendingContributions = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            throw new Error("Unauthorized");
        }

        const response = await axios.get(`http://localhost:8080/api/periods/unpaid/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
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

// Filter Search
const filteredContributions = computed(() => {
    if (!searchQuery.value) return contributions.value;

    return contributions.value.filter((contribution) =>
        (contribution.month && contribution.month.toString().includes(searchQuery.value)) ||
        (contribution.year && contribution.year.toString().includes(searchQuery.value)) ||
        (contribution.description && contribution.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});

// Phân trang dữ liệu đã lọc
const paginatedContributions = computed(() => {
    const start = currentPage.value * rowsPerPage.value;
    return filteredContributions.value.slice(start, start + rowsPerPage.value);
});

// Xử lý chuyển trang
const onPageChange = (event) => {
    currentPage.value = event.page;
};

// Mở Dialog Thanh Toán
const openPaymentDialog = (contribution) => {
    selectedContribution.value = contribution;
    paymentAmount.value = 0;
    showDialog.value = true;
};

// Xác nhận thanh toán
const confirmPayment = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            throw new Error("Unauthorized");
        }

        const paymentData = {
            periodId: selectedContribution.value.id,
            userId: userId.value,
            totalAmount: paymentAmount.value,
            note: `Thanh toán quỹ tháng ${selectedContribution.value.month} năm ${selectedContribution.value.year}`,
        };

        await axios.post(`http://localhost:8080/api/v1/contributions`, paymentData, {
            headers: { Authorization: `Bearer ${token}` },
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
