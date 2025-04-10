<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-xl">Danh sách thông báo thu quỹ</h2>
            <div class="mb-3">
                <InputText v-if="periods.length > 0" v-model="searchQuery" placeholder="Tìm kiếm theo tháng, năm..."
                    class="w-full p-inputtext-sm" style="width: 20%;" />
                <Button class="left-10" label="Tạo phiếu thu" severity="success" raised size="small"
                    @click="openCreateDialog" />
            </div>
            <DataTable v-if="periods.length > 0" :value="filteredPeriods" paginator :rows="15"
                :rowsPerPageOptions="[15, 20, 25]" class="p-datatable-sm">
                <Column field="id" header="ID" sortable></Column>
                <Column field="month" header="Tháng" sortable></Column>
                <Column field="year" header="Năm" sortable></Column>
                <Column field="totalAmount" header="Tổng cộng" sortable>
                    <template #body="{ data }">
                        {{ formatCurrency(data.totalAmount) }}
                    </template>
                </Column>
                <Column field="deadline" header="Hạn Chót" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.deadline) }}
                    </template>
                </Column>
                <Column field="description" header="Mô Tả" sortable></Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Sửa" icon="pi pi-pencil" severity="info" @click="openUpdateDialog(data)" />
                        <!-- <Button label="Xóa" icon="pi pi-trash" severity="danger" @click="confirmDeletePeriod(data)" /> -->
                    </template>
                </Column>
            </DataTable>
            <div v-else>
                <h4 class="text-center">Không tìm thấy kỳ hạn nào.</h4>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="showPeriodDialog" modal :header="isUpdate ? 'Cập nhật' : 'Tạo'" :style="{ width: '30rem' }"
    @hide="resetErrors">
    <div class="mb-3">
        <label for="month" class="fw-bold">
            Tháng <span class="text-danger">*</span>
        </label>
        <Dropdown id="month" v-model="form.month" :options="months" optionLabel="label" optionValue="value"
            class="w-100" />
        <small class="text-danger" v-if="errors.month">{{ errors.month }}</small>
    </div>
    <div class="mb-3">
        <label for="year" class="fw-bold">
            Năm <span class="text-danger">*</span>
        </label>
        <InputText id="year" type="number" v-model="form.year" class="w-100" autocomplete="off" disabled />
        <small class="text-danger" v-if="errors.year">{{ errors.year }}</small>
    </div>
    <div class="mb-3">
        <label for="deadline" class="fw-bold">
            Thời hạn <span class="text-danger">*</span>
        </label>
        <Calendar id="deadline" v-model="form.deadline" class="w-100" showIcon />
        <small class="text-danger" v-if="errors.deadline">{{ errors.deadline }}</small>
    </div>
    <div class="mb-3">
        <label for="description" class="fw-bold">
            Mô Tả <span class="text-danger">*</span>
        </label>
        <InputText id="description" v-model="form.description" class="w-100" autocomplete="off" />
        <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
    </div>
    <div class="d-flex justify-content-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" @click="showPeriodDialog = false"></Button>
        <Button type="button" label="Save" severity="primary" @click="savePeriod"></Button>
    </div>
</Dialog>

    <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa quỹ này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deletePeriod" />
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
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import axiosInstance from '@/router/Interceptor';
import { useRouter } from 'vue-router';
import type Period from '@/types/Period';
import months from '@/utils/Months';
import formatCurrency from '@/utils/FormatCurrency';

// const baseURL = "http://localhost:8080/api/v1";
const showConfirmDialog = ref(false);
const periodToDelete = ref<Period | null>(null);
const token = localStorage.getItem('accessToken');
const periods = ref<Period[]>([]);
const searchQuery = ref("");
const showPeriodDialog = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, month: 1, year: new Date().getFullYear().toString(), deadline: new Date(), description: "" });
const router = useRouter();
const errors = ref({ month: "", year: "", description: "", deadline: "" });

const fetchPeriods = async () => {
    try {
        const response = await axiosInstance.get(`/periods`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        periods.value = response.data;
    } catch (error) {
        console.error('Error fetching periods:', error);
    }
};
const validateForm = () => {
    errors.value = { month: "", year: "", description: "", deadline: "" };
    if (!form.value.month) errors.value.month = "Vui lòng chọn tháng!";
    if (!form.value.year) errors.value.year = "Vui lòng chọn năm!";
    if (!form.value.description) errors.value.description = "Vui lòng nhập mô tả!";
    if (!form.value.deadline) errors.value.description = "Vui lòng chọn hạn nộp!";;

    return Object.values(errors.value).every(err => err === "");
};

const resetErrors = () => {
    errors.value = { month: "", year: "", description: "", deadline: "" };
};

const filteredPeriods = computed(() => {
    if (!searchQuery.value) return periods.value;
    return periods.value.filter(period => period.year.toString().includes(searchQuery.value) || period.month.toString().includes(searchQuery.value));
});

const openCreateDialog = () => {
    form.value = { id: 0, month: 1, year: new Date().getFullYear().toString(), deadline: new Date(), description: "" };
    isUpdate.value = false;
    showPeriodDialog.value = true;
};

const openUpdateDialog = (period: Period) => {
    form.value = { id: period.id, month: period.month, year: period.year.toString(), deadline: new Date(period.deadline), description: period.description };
    isUpdate.value = true;
    showPeriodDialog.value = true;
};

// const confirmDeletePeriod = (period: Period) => {
//     periodToDelete.value = period;
//     showConfirmDialog.value = true;
// };

const savePeriod = async () => {
    try {
        if (!validateForm()) return;
        const periodData = { ...form.value, deadline: form.value.deadline.toISOString().split('T')[0] };
        if (isUpdate.value) {
            await axiosInstance.put(`/periods/${form.value.id}`, periodData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            await axiosInstance.post(`/periods`, periodData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        showPeriodDialog.value = false;
        fetchPeriods();
    } catch (error) {
        console.error('Error saving period:', error);
    }
};

const deletePeriod = async () => {
    if (!periodToDelete.value) return;
    try {
        await axiosInstance.delete(`/periods/${periodToDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchPeriods();
    } catch (error) {
        console.error('Error deleting period:', error);
    } finally {
        showConfirmDialog.value = false;
        periodToDelete.value = null;
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
        fetchPeriods();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}

.left-10 {
    margin-left: 10px;
}
</style>
