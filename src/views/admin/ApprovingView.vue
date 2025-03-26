<script setup>
import { ref, onMounted, computed, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import Dialog from "primevue/dialog";
import axios from "axios";
import Button from "primevue/button";

const token = localStorage.getItem("accessToken");
const baseURL = "http://localhost:8080/api/v1";
const loading = ref(true);
const error = ref(null);
const user = JSON.parse(sessionStorage.getItem("user"));
const userId = ref(user ? user.id : null);
const searchQuery = ref("");
const rowsPerPage = ref(5);
const currentPage = ref(0);
const selectedListType = ref("contributions");
const listOptions = ref([
    { label: "Phê duyệt đóng quỹ", value: "contributions" },
    { label: "Phê duyệt nộp phạt", value: "penBills" }
]);

// Confirmation dialog state
const showConfirmDialog = ref(false);
const confirmDialogMessage = ref("");
const selectedItemToConfirm = ref(null);
const confirmAction = ref(null);

const contributions = ref([]);
const penBills = ref([]);

// Fetch contributions
const fetchContributions = async () => {
    try {
        if (!token) throw new Error("Unauthorized");
        const response = await axios.get(`${baseURL}/contributions/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        contributions.value = response.data;
    } catch (err) {
        error.value = "Không thể tải dữ liệu đóng quỹ";
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Fetch penalty bills
const fetchPenBills = async () => {
    try {
        if (!token) throw new Error("Unauthorized");
        const response = await axios.get(`${baseURL}/pen-bills/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        penBills.value = response.data;
    } catch (err) {
        error.value = "Không thể tải dữ liệu nộp phạt";
        console.error(err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchContributions();
    fetchPenBills();
});

watch(selectedListType, () => {
    loading.value = true;
    if (selectedListType.value === "contributions") {
        fetchContributions();
    } else {
        fetchPenBills();
    }
});

// Confirm or cancel contribution
const handleContributionAction = async (action) => {
    try {
        loading.value = true;
        const endpoint = action === 'confirm'
            ? `${baseURL}/contributions/${selectedItemToConfirm.value.id}/approve`
            : `${baseURL}/contributions/${selectedItemToConfirm.value.id}/reject`;

        await axios.post(endpoint, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Remove the item from the list
        contributions.value = contributions.value.filter(
            item => item.id !== selectedItemToConfirm.value.id
        );


    } catch (err) {
        error.value = `Không thể ${action === 'confirm' ? 'phê duyệt' : 'hủy'} đóng quỹ`;
        console.error(err);
    } finally {
        loading.value = false;
        showConfirmDialog.value = false;
    }
};

// Confirm or cancel penalty bill
const handlePenBillAction = async (action) => {
    try {
        loading.value = true;
        const endpoint = action === 'confirm'
            ? `${baseURL}/pen-bills/${selectedItemToConfirm.value.id}/approve`
            : `${baseURL}/pen-bills/${selectedItemToConfirm.value.id}/reject`;

        await axios.post(endpoint, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        fetchPenBills();


    } catch (err) {
        error.value = `Không thể ${action === 'confirm' ? 'phê duyệt' : 'hủy'} nộp phạt`;
        console.error(err);
    } finally {
        loading.value = false;
        showConfirmDialog.value = false;
    }
};

// Open confirmation dialog
const openConfirmDialog = (item, action) => {
    selectedItemToConfirm.value = item;
    confirmAction.value = action;
    confirmDialogMessage.value = action === 'confirm'
        ? 'Bạn có chắc chắn muốn phê duyệt không?'
        : 'Bạn có chắc chắn muốn hủy không?';
    showConfirmDialog.value = true;
};

// Computed filters and pagination
const filteredContributions = computed(() => {
    if (!searchQuery.value) return contributions.value;
    return contributions.value.filter(item =>
        item.id.toString().includes(searchQuery.value) ||
        item.periodName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        item.paymentStatus.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const paginatedContributions = computed(() => {
    const start = currentPage.value * rowsPerPage.value;
    return filteredContributions.value.slice(start, start + rowsPerPage.value);
});

const filteredPenBills = computed(() => penBills.value);
const paginatedPenBills = computed(() => {
    const start = currentPage.value * rowsPerPage.value;
    return filteredPenBills.value.slice(start, start + rowsPerPage.value);
});

const onPageChange = (event) => {
    currentPage.value = event.page;
};

const formatCurrency = (value) => value.toLocaleString() + " VND";

const getStatusSeverity = (status) => {
    return { PAID: "success", PENDING: "info", UNPAID: "danger", PARTIAL: "warn" }[status] || "secondary";
};
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">Quản lý phê duyệt</h2>

        <div class="mb-4 flex items-center gap-4">
            <Dropdown v-model="selectedListType" :options="listOptions" optionLabel="label" optionValue="value"
                placeholder="Chọn danh sách" class="w-64" />

            <InputText v-model="searchQuery" placeholder="Tìm kiếm theo Id, Kỳ đóng, Trạng thái..."
                class="p-inputtext w-64" />

        </div>

        <p v-if="error" class="text-red-500">{{ error }}</p>
        <p v-if="loading">Đang tải dữ liệu...</p>

        <DataTable v-if="selectedListType === 'contributions'" :value="filteredContributions"
            class="p-datatable-striped" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
            responsiveLayout=" scroll">
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
            <Column header="Hành động">
                <template #body="{ data }">
                    <Button label="Xác nhận" icon="pi pi-check" severity="success"
                        @click="openConfirmDialog(data, 'confirm')" />
                    <Button label="Hủy" icon="pi pi-times" severity="danger" class="ml-2"
                        @click="openConfirmDialog(data, 'cancel')" />
                </template>
            </Column>
        </DataTable>

        <DataTable v-else-if="selectedListType === 'penBills'" :value="filteredPenBills" class="p-datatable-striped"
            paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]" responsiveLayout=" scroll">
            <Column field="description" header="Mô Tả" sortable></Column>
            <Column field="amount" header="Tổng cộng" sortable>
                <template #body="{ data }">
                    {{ formatCurrency(data.amount) }}
                </template>
            </Column>
            <Column header="Hành động">
                <template #body="{ data }">
                    <Button label="Xác nhận" icon="pi pi-check" severity="success"
                        @click="openConfirmDialog(data, 'confirm')" />
                    <Button label="Hủy" icon="pi pi-times" severity="danger" class="ml-2"
                        @click="openConfirmDialog(data, 'cancel')" />

                </template>
            </Column>
        </DataTable>

        <!-- Confirmation Dialog -->
        <Dialog v-model:visible="showConfirmDialog" header="Xác nhận" modal :style="{ width: '350px' }">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>{{ confirmDialogMessage }}</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" @click="showConfirmDialog = false" severity="secondary" />
                <Button label="Có" icon="pi pi-check" @click="selectedListType === 'contributions'
                    ? handleContributionAction(confirmAction)
                    : handlePenBillAction(confirmAction)" severity="primary" />
            </template>
        </Dialog>
    </div>
</template>