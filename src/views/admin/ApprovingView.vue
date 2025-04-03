<script setup>
import { ref, onMounted, computed, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import Dialog from "primevue/dialog";
import axiosInstance from '@/router/Interceptor';
import Button from "primevue/button";

const token = localStorage.getItem("accessToken");
// const baseURL = "http://localhost:8080/api/v1";
const loading = ref(true);
const searchQuery = ref("");
// Thay đổi giá trị mặc định thành "invoices"
const selectedListType = ref("invoices");
const listOptions = ref([
    { label: "Phê duyệt thu chi", value: "invoices" },
    { label: "Phê duyệt đóng quỹ", value: "contributions" },
    { label: "Phê duyệt nộp phạt", value: "penBills" }
]);

const fundOptions = ref([
    { label: "Quỹ chung", value: "COMMON" },
    { label: "Quỹ ăn vặt", value: "SNACK" }
]);

const selectedFundType = ref(null);
// Confirmation dialog state
const showConfirmDialog = ref(false);
const confirmDialogMessage = ref("");
const selectedItemToConfirm = ref(null);
const confirmAction = ref(null);

const contributions = ref([]);
const penBills = ref([]);
// Thêm mảng cho danh sách thu chi
const invoices = ref([]);

// Fetch contributions
const fetchContributions = async () => {
    try {
        if (!token) throw new Error("Unauthorized");
        const response = await axiosInstance.get(`/contributions/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        contributions.value = response.data;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Fetch penalty bills
const fetchPenBills = async () => {
    try {
        if (!token) throw new Error("Unauthorized");
        const response = await axiosInstance.get(`/pen-bills/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        penBills.value = response.data;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Thêm hàm fetch danh sách thu chi
const fetchInvoices = async () => {
    try {
        if (!token) throw new Error("Unauthorized");
        const response = await axiosInstance.get(`/invoices/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        invoices.value = response.data;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // Mặc định gọi API lấy danh sách thu chi
    fetchInvoices();
    // Vẫn gọi API các danh sách khác để tải sẵn dữ liệu
    fetchContributions();
    fetchPenBills();
});

watch(selectedListType, () => {
    loading.value = true;
    if (selectedListType.value === "contributions") {
        fetchContributions();
    } else if (selectedListType.value === "penBills") {
        fetchPenBills();
    } else if (selectedListType.value === "invoices") {
        fetchInvoices();
    }
});

// Confirm or cancel contribution
const handleContributionAction = async (action) => {
    try {
        loading.value = true;
        const endpoint = action === 'confirm'
            ? `/contributions/${selectedItemToConfirm.value.id}/approve`
            : `/contributions/${selectedItemToConfirm.value.id}/reject`;

        await axiosInstance.post(endpoint, {}, {
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
            ? `/pen-bills/${selectedItemToConfirm.value.id}/approve`
            : `/pen-bills/${selectedItemToConfirm.value.id}/reject`;

        await axiosInstance.post(endpoint, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        fetchPenBills();

    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
        showConfirmDialog.value = false;
    }
};

// Thêm hàm xử lý phê duyệt thu chi

const errorMessageInvoice = ref('');
const handleInvoiceAction = async (action) => {
    try {
        loading.value = true;

        if (action === 'confirm' && !selectedFundType.value) {
            errorMessageInvoice.value = "Vui lòng chọn quỹ trước khi phê duyệt!";

        }

        const endpoint = action === 'confirm'
            ? `/invoices/${selectedItemToConfirm.value.id}/approve`
            : `/invoices/${selectedItemToConfirm.value.id}/reject`;

        await axiosInstance.post(endpoint, {
            fundType: action === 'confirm' ? selectedFundType.value : null
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        errorMessageInvoice.value = '';

        fetchInvoices();
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
        showConfirmDialog.value = false;
        selectedFundType.value = null;
    }
};

// Open confirmation dialog
const openConfirmDialog = (item, action) => {
    selectedItemToConfirm.value = item;
    confirmAction.value = action;
    confirmDialogMessage.value = action === 'confirm'
        ? 'Bạn có chắc chắn muốn phê duyệt không?'
        : 'Bạn có chắc chắn muốn hủy không?';

    if (action === 'confirm' && selectedListType.value === 'invoices') {
        selectedFundType.value = null;
    }

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

const filteredPenBills = computed(() => {
    if (!searchQuery.value) return penBills.value;
    return penBills.value.filter(item =>
        item.id.toString().includes(searchQuery.value) ||
        item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

// Thêm computed property cho danh sách thu chi đã lọc
const filteredInvoices = computed(() => {
    if (!searchQuery.value) return invoices.value;
    return invoices.value.filter(item =>
        item.id.toString().includes(searchQuery.value) ||
        item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const formatCurrency = (value) => value.toLocaleString() + " VND";

const getStatusSeverity = (status) => {
    return { PAID: "success", PENDING: "info", UNPAID: "danger", PARTIAL: "warn" }[status] || "secondary";
};

// Thêm hàm để lấy nhãn cho loại thu chi
const getInvoiceTypeLabel = (type) => {
    return type === "INCOME" ? "Thu" : type === "EXPENSE" ? "Chi" : type;
};

// Thêm hàm để lấy severity cho loại thu chi
const getInvoiceTypeSeverity = (type) => {
    return type === "INCOME" ? "success" : type === "EXPENSE" ? "danger" : "info";
};
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">Quản lý phê duyệt</h2>

        <div class="mb-4 flex items-center gap-4">
            <Dropdown v-model="selectedListType" :options="listOptions" optionLabel="label" optionValue="value"
                placeholder="Chọn danh sách" class="w-64" />

            <InputText v-model="searchQuery" placeholder="Tìm kiếm..." class="p-inputtext w-64 left-10"
                style="width: 27%;" />

        </div>

        <p v-if="loading">Đang tải dữ liệu...</p>

        <!-- Bảng thu chi -->
        <DataTable v-if="selectedListType === 'invoices' && filteredInvoices.length > 0" :value="filteredInvoices"
            class="p-datatable-striped" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
            responsiveLayout="scroll">
            <Column header="STT" sortable>
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>
            <Column field="name" header="Tên" sortable />
            <Column field="description" header="Mô tả" sortable style="width: 15%;" />
            <Column field="type" header="Loại" sortable style="text-align: center;">
                <template #body="slotProps">
                    <Tag v-if="slotProps.data.fundType !== 'null'" :value="getInvoiceTypeLabel(slotProps.data.fundType)"
                        :severity="getInvoiceTypeSeverity(slotProps.data.fundType)" />
                    <Tag v-else value="chưa duyệt" severity="warn" />
                </template>
            </Column>
            <Column field="amount" header="Số tiền" sortable>
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.amount) }}
                </template>
            </Column>
            <Column field="createdAt" header="Ngày tạo" sortable>
                <template #body="slotProps">
                    {{ new Date(slotProps.data.createdAt).toLocaleDateString('vi-VN') }}
                </template>
            </Column>
            <Column header="Hành động">
                <template #body="{ data }">
                    <Button label="Xác nhận" icon="pi pi-check" severity="success"
                        @click="openConfirmDialog(data, 'confirm')" />
                    <Button label="Hủy" icon="pi pi-times" severity="danger" class="ml-2 left-10"
                        @click="openConfirmDialog(data, 'cancel')" />
                </template>
            </Column>
        </DataTable>

        <!-- Bảng đóng quỹ -->
        <DataTable v-else-if="selectedListType === 'contributions' && filteredContributions.length > 0"
            :value="filteredContributions" class="p-datatable-striped" paginator :rows="15"
            :rowsPerPageOptions="[15, 20, 25]" responsiveLayout="scroll">
            <Column header="STT" sortable>
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>
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
                    <Button label="Hủy" icon="pi pi-times" severity="danger" class="ml-2 left-10"
                        @click="openConfirmDialog(data, 'cancel')" />
                </template>
            </Column>
        </DataTable>

        <!-- Bảng nộp phạt -->
        <DataTable v-else-if="selectedListType === 'penBills' && filteredPenBills.length > 0" :value="filteredPenBills"
            class="p-datatable-striped" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
            responsiveLayout="scroll">
            <Column header="STT" sortable>
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>
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
                    <Button label="Hủy" icon="pi pi-times" severity="danger" class="ml-2 left-10"
                        @click="openConfirmDialog(data, 'cancel')" />
                </template>
            </Column>
        </DataTable>

        <div v-else>
            <p class="text-center">Chưa có bất kỳ đơn nào cần phê duyệt.</p>
        </div>

        <!-- Confirmation Dialog -->
        <!-- Confirmation Dialog -->
        <Dialog v-model:visible="showConfirmDialog" header="Xác nhận" modal :style="{ width: '350px' }">
            <div class="confirmation-content">
                <span>{{ confirmDialogMessage }}</span>
            </div>

            <div v-if="selectedListType === 'invoices' && confirmAction === 'confirm'" class="mt-3">
                <label for="fundType" class="block mb-2">Chọn quỹ:</label>
                <Dropdown id="fundType" v-model="selectedFundType" :options="fundOptions" optionLabel="label"
                    optionValue="value" placeholder="Chọn quỹ" class="w-full" />
                <small class="text-danger">{{ errorMessageInvoice.value }}</small>
            </div>

            <template #footer>
                <Button label="Không" icon="pi pi-times" @click="showConfirmDialog = false" severity="secondary" />
                <Button label="Có" icon="pi pi-check" @click="
                    selectedListType === 'contributions' ? handleContributionAction(confirmAction) :
                        selectedListType === 'penBills' ? handlePenBillAction(confirmAction) :
                            handleInvoiceAction(confirmAction)" severity="primary" />
            </template>
        </Dialog>

    </div>
</template>
<style>
:global(.p-button) {
    margin-left: 10px;
}

.left-10 {
    margin-left: 10px;
}
</style>