<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách quỹ phạt</h2>
            <div class="mb-3">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo id, tên..." class="w-full p-inputtext-sm" />
                <Button label="Create" severity="success" raised size="small" @click="openCreateDialog" />
            </div>
            <DataTable :value="filteredPeriods" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20]"
                class="p-datatable-sm">
                <Column field="id" header="ID" sortable></Column>
                <Column field="name" header="Tên quỹ phạt" sortable></Column>
                <Column field="description" header="Mô tả" sortable></Column>
                <Column field="amount" header="Tổng cộng" sortable>
                    <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                    </template>
                </Column>
                <Column field="created" header="Ngày tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>
                <Column field="description" header="Mô Tả" sortable></Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Update" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)" />
                        <Button label="Delete" icon="pi pi-trash" severity="danger"
                            @click="confirmDeletePenalty(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>

    <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa quỹ phạt này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deletePenalty" />
        </div>
    </Dialog>

    <Dialog v-model:visible="showPenaltyDialog" modal :header="isUpdate ? 'Update Period' : 'Create Period'"
        @hide="resetErrors" :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="id" class="fw-bold">Tên quỹ</label>
            <InputText id="name" type="text" v-model="form.name" class="w-100" autocomplete="off" />

        </div>
        <div class="mb-3">
            <label for="description" class="fw-bold">Mô tả</label>
            <InputText id="description" type="text" v-model="form.description" class="w-100" autocomplete="off" />
        </div>
        <div class="mb-3">
            <label for="amount" class="fw-bold">Tổng tiền</label>
            <InputText id="amount" v-model="form.amount" class="w-100" autocomplete="off" />
        </div>
        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showPenaltyDialog = false"></Button>
            <Button type="button" label="Save" severity="primary" @click="savePeriod"></Button>
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
import axios from 'axios';
import { useRouter } from 'vue-router';
import months from '@/utils/Months';
import formatCurrency from '@/utils/FormatCurrency';
import type Penalty from '@/types/Penalty';

const showConfirmDialog = ref(false);
const penaltyDelete = ref<Penalty | null>(null);
const token = localStorage.getItem('accessToken');
const penalties = ref<Penalty[]>([]);
const searchQuery = ref("");
const showPenaltyDialog = ref(false);
const isUpdate = ref(false);
const form = ref({ id: 0, name: "", description: "", amount: "" });
const router = useRouter();
const errors = ref({ name: "", description: "", amount: 0 });

const fetchPeriods = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/v1/penalties', {
            headers: { Authorization: `Bearer ${token}` }
        });
        penalties.value = response.data;
    } catch (error) {
        console.error('Error fetching periods:', error);
    }
};

const resetErrors = () => {
    errors.value = { name: "", description: "", amount: 0 };
};

const filteredPeriods = computed(() => {
    if (!searchQuery.value) return penalties.value;
    return penalties.value.filter(pen => pen.name.includes(searchQuery.value) || pen.id.toString().includes(searchQuery.value));
});

const openCreateDialog = () => {
    form.value = { id: 0, name: "", description: "", amount: "" };
    isUpdate.value = false;
    showPenaltyDialog.value = true;
};

const openUpdateDialog = (penalty: Penalty) => {
    form.value = { id: penalty.id, name: penalty.name, description: penalty.description, amount: penalty.amount.toString() };
    isUpdate.value = true;
    showPenaltyDialog.value = true;
};

const confirmDeletePenalty = (pen: Penalty) => {
    penaltyDelete.value = pen;
    showConfirmDialog.value = true;
};

const savePeriod = async () => {
    try {
        const penaltyData = { ...form.value };
        if (isUpdate.value) {
            await axios.put(`http://localhost:8080/api/v1/penalties/${form.value.id}`, penaltyData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            await axios.post('http://localhost:8080/api/v1/penalties', penaltyData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        showPenaltyDialog.value = false;
        fetchPeriods();
    } catch (error) {
        console.error('Error saving period:', error);
    }
};

const deletePenalty = async () => {
    if (!penaltyDelete.value) return;
    try {
        await axios.delete(`http://localhost:8080/api/v1/penalties/${penaltyDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchPeriods();
    } catch (error) {
        console.error('Error deleting period:', error);
    } finally {
        showConfirmDialog.value = false;
        penaltyDelete.value = null;
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
</style>
