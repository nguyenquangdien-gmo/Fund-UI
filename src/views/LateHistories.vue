<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Calendar from "primevue/calendar";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import axiosInstance from '@/router/Interceptor';
import formatDate from "@/utils/FormatDate";
import { useUserStore } from "@/pinia/userStore";

interface User {
    id?: string | null;
    fullName?: string | null;
}

interface LateRecord {
    user?: User | null;
    checkinAt: string;
    note: string | null;
    date: string;
}

const token = localStorage.getItem('accessToken');
const fromDate = ref<Date | null>(new Date());
const toDate = ref<Date | null>(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
const lateRecords = ref<LateRecord[]>([]);
const searchTerm = ref("");
// const baseURL = "http://localhost:8080/api/v1";

const userStore = useUserStore();
const user = computed(() => userStore.user);


const fetchLateRecords = async () => {
    if (!fromDate.value || !toDate.value) return;

    try {
        const response = await axiosInstance.get(`/late/users/${user.value?.id}`, {
            params: {
                fromDate: fromDate.value.toISOString().split("T")[0],
                toDate: toDate.value.toISOString().split("T")[0],
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        lateRecords.value = response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đi trễ:", error);
    }
};

onMounted(fetchLateRecords);

// Cải tiến hàm lọc với kiểm tra an toàn
const filteredRecords = computed(() => {
    return lateRecords.value.filter(record => {
        // Kiểm tra ngày
        const matchDate = fromDate.value && toDate.value
            ? new Date(record.date) >= fromDate.value &&
            new Date(record.date) <= toDate.value
            : true;

        // Kiểm tra search term
        const matchSearch = !searchTerm.value ||
            // Kiểm tra fullName
            (record.user?.fullName &&
                record.user.fullName.toString().toLowerCase().includes(searchTerm.value.toLowerCase())) ||
            // Kiểm tra id
            (record.user?.id &&
                record.user.id.toString().toLowerCase().includes(searchTerm.value.toLowerCase()));

        return matchDate && matchSearch;
    });
});
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">Danh sách đi muộn</h2>

        <div class="flex gap-4 mb-4">
            Từ
            <Calendar v-model="fromDate" dateFormat="dd-mm-yy" placeholder="Từ ngày" @date-select="fetchLateRecords" />
            đến
            <Calendar v-model="toDate" dateFormat="dd-mm-yy" placeholder="Đến ngày" @date-select="fetchLateRecords" />
            Tìm kiếm
            <InputText v-model="searchTerm" placeholder="🔍 Tìm theo tên hoặc ID" class="p-inputtext-sm" />
        </div>

        <DataTable v-if="filteredRecords.length > 0" :value="filteredRecords" :paginator="true" :rows="15"
            :rowsPerPageOptions="[15, 20, 25]" stripedRows responsiveLayout="scroll">
            <Column header="STT" sortable>
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>
            <Column field="user.id" header="Mã nhân viên">
                <template #body="{ data }">
                    {{ data.user?.id || '-' }}
                </template>
            </Column>
            <Column field="user.fullName" header="Tên nhân viên">
                <template #body="{ data }">
                    {{ data.user?.fullName || '-' }}
                </template>
            </Column>
            <Column field="checkinAt" header="Check-in">
                <template #body="{ data }">
                    {{ data.checkinAt ?? "-" }}
                </template>
            </Column>
            <Column field="note" header="Ghi chú">
                <template #body="{ data }">
                    {{ data.note?.trim() ? data.note : "-" }}
                </template>
            </Column>
            <Column field="date" header="Ngày">
                <template #body="{ data }">
                    {{ formatDate(data.date) }}
                </template>
            </Column>
        </DataTable>

        <div v-else="filteredRecords.length === 0" class="text-center text-gray-500">
            Không có dữ liệu để hiển thị.
        </div>
    </div>
</template>