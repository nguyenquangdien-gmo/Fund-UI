<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center text-xl">Danh sách Thu/Chi</h2>
            <div class="mb-3">
                <InputText v-if="invoices.length > 0" v-model="searchQuery" placeholder="Tìm kiếm theo tên chi tiêu..."
                    style="width: 20%;" class="w-full p-inputtext-sm" />
                <Button label="Tạo phiếu" class="btn-create" severity="success" raised size="small"
                    @click="openCreateDialog" />
            </div>
            <DataTable v-if="invoices.length > 0" :value="filteredInvoice" paginator :rows="15"
                :rowsPerPageOptions="[15, 20, 25]" class="p-datatable-sm">
                <Column header="STT" sortable>
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
                <Column field="name" header="Tên" sortable></Column>

                <Column field="description" header="Mô tả" sortable></Column>
                <Column field="amount" header="Số Tiền" sortable>
                    <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                    </template>
                </Column>
                <Column field="status" header="Trạng thái" sortable>
                    <template #body="{ data }">
                        <Tag :value="data.status" :severity="getInvoiceTypeSeverity(data.status)" />
                    </template>
                </Column>
                <!-- <Column field="userId" header="Tạo bởi" sortable></Column> -->
                <Column field="createdAt" header="Ngày Tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>
                <Column header="Actions" style="width: 20%;">
                    <template #body="{ data }">
                        <Button label="Sửa" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)"
                            :hidden="data.status === 'APPROVED' || data.status === 'CANCELLED'" />
                        <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteInvoice(data)"
                            style="margin-left: 10px;"
                            :hidden="data.status === 'APPROVED' || data.status === 'CANCELLED'" />
                    </template>
                </Column>
            </DataTable>
            <div v-else>
                <p class="text-center">Không tìm thấy phiếu chi nào</p>
            </div>
        </div>
    </div>
    <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa quỹ này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteInvoice" />
        </div>
    </Dialog>

    <Dialog v-model:visible="showInvoice" modal :header="isUpdate ? 'Update' : 'Create'" @hide="resetErrors"
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
            <label for="amount" class="fw-bold">Số tiền</label>
            <InputText id="amount" type="number" v-model="amount" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.amount">{{ errors.amount }}</small>
        </div>
        <div class="mb-3">
            <label for="type" class="fw-bold">Loại quỹ</label>
            <Dropdown v-model="selectedType" :options="types" optionLabel="label" optionValue="value"
                placeholder="Chọn loại quỹ" class="w-100 md:w-56" />
            <small class="text-danger" v-if="errors.type">{{ errors.type }}</small>
        </div>
        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showInvoice = false"></Button>
            <Button type="button" label="Save" severity="primary" @click="saveInvoice"></Button>
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
import axiosInstance from '@/router/Interceptor';
import { useRouter } from 'vue-router';
import formatCurrency from '@/utils/FormatCurrency';
import { useUserStore } from '@/pinia/userStore';
import Dropdown from 'primevue/dropdown';
import type Invoice from '@/types/Invoice';
import InvoiceType from '@/types/InvoiceType';
import type InvoiceStatus from '@/types/InvoiceStatus';
import Tag from 'primevue/tag';

// const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false);
const invoiceToDelete = ref<Invoice | null>(null);
const token = localStorage.getItem('accessToken');
const invoices = ref<Invoice[]>([]);
const searchQuery = ref("");
const showInvoice = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, name: "", invoiceType: "", description: "", userId: 0, amount: 0 });
const errors = ref({ name: "", description: "", type: "", amount: "" });
const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);
const amount = ref('');

const selectedType = ref<InvoiceType | null>(null);
const types = ref([
    { label: "Quỹ thu", value: InvoiceType.INCOME },
    { label: "Quỹ chi", value: InvoiceType.EXPENSE }
]);
const status = ref([
    { label: "Chưa duyệt", value: InvoiceType.INCOME },
    { label: "Đã duyệt", value: InvoiceType.EXPENSE },
    { label: "Bị hủy", value: InvoiceType.EXPENSE }
]);

const getInvoiceTypeSeverity = (status: string) => {
    switch (status.toUpperCase()) {  // Đảm bảo không phân biệt chữ hoa/thường
        case 'PENDING': return 'info';        // Chưa duyệt -> màu xanh dương
        case 'CANCELLED': return 'secondary';  // Bị hủy -> màu xám
        case 'APPROVED': return 'success';    // Đã duyệt -> màu xanh lá
        default: return 'warning';            // Trạng thái không xác định -> màu vàng
    }
};


const fetchInvoice = async () => {
    try {
        const response = await axiosInstance.get(`/invoices/user/${user.value.id}`);
        invoices.value = response.data;
    } catch (error) {
        console.error('Error fetching invoices:', error);
    }
};

const filteredInvoice = computed(() => {
    if (!searchQuery.value) return invoices.value;
    return invoices.value.filter(invoice => invoice.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const openCreateDialog = () => {
    form.value = { id: 0, name: "", userId: 0, description: "", invoiceType: "", amount: 0 };
    isUpdate.value = false;
    showInvoice.value = true;
};


const openUpdateDialog = (invoice: Invoice) => {
    form.value = {
        id: invoice.id,
        name: invoice.name,
        userId: user.value.id,
        description: invoice.description,
        invoiceType: invoice.type,
        amount: invoice.amount
    };
    amount.value = invoice.amount.toString();

    // Just use this line - set selectedType to the enum value directly
    selectedType.value = invoice.type === InvoiceType.INCOME ? InvoiceType.INCOME : InvoiceType.EXPENSE;

    isUpdate.value = true;
    showInvoice.value = true;

    console.log(form.value);

};

const confirmDeleteInvoice = (invoice: Invoice) => {
    invoiceToDelete.value = invoice;
    showConfirmDialog.value = true;
};

const validateForm = () => {
    errors.value = { name: "", description: "", type: "", amount: "" };
    if (!form.value.name) errors.value.name = "Vui lòng nhập tên phí!";
    if (!form.value.description) errors.value.name = "Vui lòng nhập mô tả phí!";
    if (!selectedType.value) errors.value.type = "Vui lòng chọn loại phí!";
    if (!amount.value || Number(amount.value) < 0)
        errors.value.amount = "Số tiền cần phải lớn hơn 0!";
    return Object.values(errors.value).every(err => err === "");
};

const saveInvoice = async () => {
    if (!validateForm()) return;
    try {
        if (isUpdate.value) {
            if (selectedType.value) {
                form.value.invoiceType = selectedType.value.toString();
            }
            form.value.amount = Number(amount.value);
            console.log(form.value);

            await axiosInstance.put(`/invoices/${form.value.id}/update`, form.value);
            // console.log(form.value);

        } else {
            if (selectedType.value) {
                form.value.invoiceType = selectedType.value;
                form.value.userId = user.value.id;
                form.value.amount = Number(amount.value);
                // console.log(form.value);

                // console.log(form.value);
                await axiosInstance.post(`/invoices`, form.value);
                resetForm();
            }

        }
        showInvoice.value = false;
        fetchInvoice();
    } catch (error) {
        console.error('Error saving fund:', error);
    }
};

const resetErrors = () => {
    errors.value = { name: "", description: "", type: "", amount: "" };
};



const resetForm = () => {
    form.value = { id: 0, name: "", userId: 0, description: "", invoiceType: "", amount: 0 };
    amount.value = '';
    selectedType.value = null;
}

const deleteInvoice = async () => {
    if (!invoiceToDelete.value) return;
    try {
        await axiosInstance.delete(`/invoices/${invoiceToDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchInvoice();
    } catch (error) {
        console.error('Error deleting fund:', error);
    } finally {
        showConfirmDialog.value = false;
        invoiceToDelete.value = null;
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
        fetchInvoice();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}

.btn-create {
    margin-left: 10px;
}
</style>