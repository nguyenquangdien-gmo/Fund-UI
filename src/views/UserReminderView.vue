<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách Nhắc Nhở</h2>

            <!-- Search Bar -->
            <div class="mb-3 flex justify-content-between align-items-center">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo tiêu đề nhắc nhở..." style="width: 20%;"
                    class="w-full p-inputtext-sm" />
            </div>

            <!-- Reminder DataTable -->
            <DataTable :value="filteredReminders" paginator :rows="10" :rowsPerPageOptions="[10, 15, 20]"
                class="p-datatable-sm">
                <Column header="STT" sortable>
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
                <Column field="title" header="Tiêu Đề" sortable></Column>
                <Column field="description" header="Mô Tả" sortable>
                    <template #body="{ data }">
                        <div v-html="formatTextWithLinks(data.description)"></div>
                    </template>
                </Column>
                <Column field="type" header="Loại Nhắc Nhở" sortable>
                    <template #body="{ data }">
                        <Tag style="width: 100%;" :severity="getReminderTypeSeverity(data.reminderType)">
                            {{ data.reminderType === 'CONTRIBUTION' ? 'Đóng quỹ' : data.reminderType === 'PENALTY' ?
                                'Phạt' : 'Khác' }}
                        </Tag>
                    </template>
                </Column>
                <Column field="scheduledTime" header="Thời Gian" sortable>
                    <template #body="{ data }">
                        {{ data.scheduledTime ? formatDateTime(data.scheduledTime) : 'Ngay lập tức' }}
                    </template>
                </Column>

            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '@/router/Interceptor';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import formatTextWithLinks from '@/utils/FormateTextWithUrl';
import type Reminder from '@/types/Reminder';
import { useUserStore } from '@/pinia/userStore';

const router = useRouter();
const token = localStorage.getItem('accessToken');
const reminders = ref<Reminder[]>([]);
const searchQuery = ref("");

const userStore = useUserStore();
const user = computed(() => userStore.user);

const fetchReminders = async () => {
    try {
        const response = await axiosInstance.get<Reminder[]>(`users/${user.value.id}/reminders`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        reminders.value = response.data;
    } catch (error) {
        console.error('Error fetching reminders:', error);
    }
};

const filteredReminders = computed(() => {
    if (!searchQuery.value) return reminders.value;
    return reminders.value.filter(reminder =>
        reminder.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getReminderTypeSeverity = (type: string): string => {
    switch (type) {
        case 'CONTRIBUTION': return 'info';
        case 'PENALTY': return 'danger';
        case 'OTHER': return 'warning';
        default: return 'info';
    }
};

onMounted(() => {
    if (!token) {
        router.push('/login');
    } else {
        fetchReminders();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}

.text-center {
    text-align: center;
    font: 1.5em sans-serif;
    margin-bottom: 1rem;
}
</style>