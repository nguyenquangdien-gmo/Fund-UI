<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-xl">Danh Sách Quỹ</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo mã quỹ..." class="w-full p-inputtext-sm" />
                <!-- <Button label="Tạo quỹ" severity="success" class="btn" raised size="small" @click="openCreateDialog" /> -->
            </div>
            <DataTable :value="filteredFunds" paginator :rows="15" :rowsPerPageOptions="[15, 20, 25]"
                class="p-datatable-sm">
                <Column header="STT" sortable>
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
                <Column field="type" header="Mã Quỹ" sortable></Column>
                <Column field="name" header="Tên Quỹ" sortable></Column>
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
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Sửa" icon="pi pi-pencil" severity="info" @click="openUpdateDialog(data)" />
                        <!-- <Button label="Xóa" icon="pi pi-trash" severity="danger" style="margin-left: 10px;"
                            @click="confirmDeleteFund(data)" /> -->
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
    <!-- <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa quỹ này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteFund" />
        </div>
    </Dialog> -->

    <Dialog v-model:visible="showFundDialog" modal :header="isUpdate ? 'Cập nhật' : 'Tạo'" @hide="resetErrors"
    :style="{ width: '30rem' }">
    <div class="mb-3">
        <label for="name" class="fw-bold">
            Tên <span class="text-danger">*</span>
        </label>
        <InputText id="name" v-model="form.name" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
    </div>
    <div class="mb-3">
        <label for="description" class="fw-bold">
            Mô tả <span class="text-danger">*</span>
        </label>
        <InputText id="description" v-model="form.description" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
    </div>
    <div class="mb-3">
        <label for="amount" class="fw-bold">
            Tổng tiền <span class="text-danger">*</span>
        </label>
        <InputText id="amount" type="number" v-model="form.amount" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.amount">{{ errors.amount }}</small>
    </div>
    <div class="mb-3">
        <label for="type" class="fw-bold">
            Loại quỹ <span class="text-danger">*</span>
        </label>
        <Dropdown v-model="selectedFund" :options="types" optionLabel="label" optionValue="value"
            placeholder="Chọn loại quỹ" class="w-100 md:w-56" :disabled="true" />
        <small class="text-danger" v-if="errors.type">{{ errors.type }}</small>
    </div>
    <div class="d-flex justify-content-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" @click="showFundDialog = false"></Button>
        <Button type="button" label="Save" severity="primary" @click="saveFund"></Button>
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
import type Fund from '@/types/Fund';
import formatCurrency from '@/utils/FormatCurrency';
import FundType from '@/types/FundType';
import Dropdown from 'primevue/dropdown';


// const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false);
const fundToDelete = ref<Fund | null>(null);
const token = localStorage.getItem('accessToken');
const funds = ref<Fund[]>([]);
const searchQuery = ref("");
const showFundDialog = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, name: "", description: "", type: "", amount: "" });
const errors = ref({ name: "", description: "", type: "", amount: "" });
const router = useRouter();

const selectedFund = ref<FundType | null>(null);
const types = ref([
    { label: "Quỹ chung", value: FundType.COMMON },
    { label: "Quỹ ăn vặt", value: FundType.SNACK }
]);

const fetchFunds = async () => {
    try {
        const response = await axiosInstance.get(`/funds`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        funds.value = response.data;
    } catch (error) {
        console.error('Error fetching funds:', error);
    }
};

const filteredFunds = computed(() => {
    if (!searchQuery.value) return funds.value;
    return funds.value.filter(fund => fund.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

// const openCreateDialog = () => {
//     form.value = { id: 0, name: "", description: "", type: "", amount: "" };
//     isUpdate.value = false;
//     showFundDialog.value = true;
// };

const openUpdateDialog = (fund: Fund) => {
    form.value = { id: fund.id, name: fund.name, description: fund.description, type: fund.type, amount: String(fund.amount) };
    selectedFund.value = types.value.find(t => t.value === fund.type)?.value || null;
    isUpdate.value = true;
    showFundDialog.value = true;
};

// const confirmDeleteFund = (fund: Fund) => {
//     fundToDelete.value = fund;
//     showConfirmDialog.value = true;
// };


const validateForm = () => {
    errors.value = { name: "", description: "", type: "", amount: "" };
    if (!form.value.name) errors.value.name = "Name is required!";
    if (!form.value.description) errors.value.name = "Description is required!";
    if (!selectedFund) errors.value.type = "Type is required!";
    if (!form.value.amount || Number(form.value.amount) < 0)
        errors.value.amount = "Amount is required and must be greater than 0!";
    return Object.values(errors.value).every(err => err === "");
};

const saveFund = async () => {
    if (!validateForm()) return;
    try {
        if (isUpdate.value) {
            await axiosInstance.put(`/funds/${form.value.id}`, form.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // } else {
            //     if (selectedFund.value) {
            //         form.value.type = selectedFund.value;
            //         // console.log(form.value);
            //         await axiosInstance.post(`/funds`, form.value, {
            //             headers: { Authorization: `Bearer ${token}` }
            //         });
            //         // console.log(form.value);
            //     }
        }
        showFundDialog.value = false;
        fetchFunds();
    } catch (error) {
        console.error('Error saving fund:', error);
    }
}; const resetErrors = () => {
    errors.value = { name: "", description: "", type: "", amount: "" };
};

// const deleteFund = async () => {
//     if (!fundToDelete.value) return;
//     try {
//         await axiosInstance.delete(`/funds/${fundToDelete.value.id}`, {
//             headers: { Authorization: `Bearer ${token}` }
//         });
//         fetchFunds();
//     } catch (error) {
//         console.error('Error deleting fund:', error);
//     } finally {
//         showConfirmDialog.value = false;
//         fundToDelete.value = null;
//     }
// };


const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

onMounted(() => {
    if (!token) {
        router.push('/');
    } else {
        fetchFunds();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}

.btn {
    margin-left: 10px;
}
</style>