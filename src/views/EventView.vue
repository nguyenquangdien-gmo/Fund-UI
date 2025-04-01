<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách Sự Kiện</h2>

            <!-- Search and Create Button (Only for Admin) -->
            <div class="mb-3 flex justify-content-between align-items-center">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo tên sự kiện..."
                    class="w-full p-inputtext-sm mr-3" />
                <Button v-if="isAdmin" label="Tạo Sự Kiện" class="left-10" severity="success" raised size="small"
                    @click="openCreateDialog" />
            </div>

            <!-- Event DataTable -->
            <DataTable :value="filteredEvents" paginator :rows="10" :rowsPerPageOptions="[10, 15, 20]"
                class="p-datatable-sm">
                <Column field="id" header="ID" sortable></Column>
                <Column field="name" header="Tên Sự Kiện" sortable></Column>
                <Column field="eventTime" header="Thời Gian" sortable>
                    <template #body="{ data }">
                        {{ formatDateTime(data.eventTime) }}
                    </template>
                </Column>
                <Column field="location" header="Địa Điểm" sortable>
                    <template #body="{ data }">
                        <div v-html="formatTextWithLinks(data.location)"></div>
                    </template>
                </Column>
                <Column header="Chủ Sự Kiện" style="width: 20%;">
                    <template #body="{ data }">
                        <div>
                            {{data.hosts?.map((host: User) => host?.fullName ?? 'Không xác định').join(', ')
                                || 'Không có chủ sự kiện'}}
                        </div>
                    </template>
                </Column>
                <!-- Action Column (Only for Admin) -->
                <Column v-if="isAdmin" header="Thao Tác">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button label="Sửa" icon="pi pi-pencil" severity="info" size="small"
                                @click="openUpdateDialog(data)" />
                            <Button label="Xóa" icon="pi pi-trash" class="left-10" severity="danger" size="small"
                                @click="confirmDeleteEvent(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <Dialog v-model:visible="showConfirmDialog" modal header="Xác Nhận Xóa" :style="{ width: '25rem' }">
        <div class="confirmation-content">
            Bạn có chắc chắn muốn xóa sự kiện này không?
        </div>
        <div class="flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteEvent" />
        </div>
    </Dialog>

    <!-- Event Form Dialog (Only for Admin) -->
    <Dialog v-if="isAdmin" v-model:visible="showEventDialog" modal
        :header="isUpdate ? 'Cập Nhật Sự Kiện' : 'Tạo Sự Kiện'" class="container-dialog">
        <div class="col-12 mb-3 item-dialog">
            <label for="name" class="font-bold mb-2 ">Tên Sự Kiện</label>
            <InputText id="name" v-model="form.name" :class="{ 'p-invalid': errors.name }" class="w-full" />
            <small class="p-error" v-if="errors.name">{{ errors.name }}</small>
        </div>

        <div class="col-12 mb-3 item-dialog">
            <label for="eventTime" class="font-bold mb-2">Thời Gian</label>
            <Calendar id="eventTime" v-model="form.eventTime" showTime hourFormat="24"
                :class="{ 'p-invalid': errors.eventTime }" class="w-full" />
            <small class="p-error" v-if="errors.eventTime">{{ errors.eventTime }}</small>
        </div>

        <div class="col-12 mb-3 item-dialog">
            <label for="location" class="font-bold mb-2">Địa Điểm</label>
            <InputText id="location" v-model="form.location" :class="{ 'p-invalid': errors.location }" class="w-full" />
            <small class="p-error" v-if="errors.location">{{ errors.location }}</small>
        </div>

        <div class="col-12 mb-3 item-dialog">
            <label for="hosts" class="font-bold mb-2">Chủ Sự Kiện</label>
            <MultiSelect id="hosts" v-model="selectedHosts" :options="userOptions" optionLabel="fullName"
                optionValue="id" placeholder="Chọn chủ sự kiện" :class="{ 'p-invalid': errors.hosts }" class="w-full" />
            <small class="p-error" v-if="errors.hosts">{{ errors.hosts }}</small>
        </div>

        <div class="actions-dialog">
            <Button label="Hủy" severity="secondary" @click="showEventDialog = false" class="p-button-outlined" />
            <Button :label="isUpdate ? 'Cập Nhật' : 'Tạo'" severity="primary" @click="saveEvent"
                class="p-button-raised" />
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '@/router/Interceptor';

// PrimeVue Components
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import MultiSelect from 'primevue/multiselect';
import type { User } from '@/types/User';
import type Event from '@/types/Event';
import formatTextWithLinks from '@/utils/FormateTextWithUrl';



// Configuration
// const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// Composition Setup
const router = useRouter();
const token = localStorage.getItem('accessToken');

// Reactive State
const events = ref<Event[]>([]);
const searchQuery = ref("");
const showConfirmDialog = ref(false);
const showEventDialog = ref(false);
const isUpdate = ref(false);
const eventToDelete = ref<Event | null>(null);
const userOptions = ref<User[]>([]);
const isAdmin = ref(false);

const checkIsAdmin = async () => {
    if (!token) return;
    // console.log("Token gửi lên:", token); // Debug
    try {
        const response = await axiosInstance.get(`/tokens/is-admin?token=${token}`);
        console.log("API response:", response.data); // Debug
        isAdmin.value = response.data;
    } catch (error) {
        console.error("Error checking admin status:", error);
        isAdmin.value = false;
    }
};

// Current User and Role Management

// Form State
const form = ref({
    id: 0,
    name: "",
    eventTime: new Date(),
    location: "",
});
const selectedHosts = ref<number[]>([]);
const errors = ref({
    name: "",
    eventTime: "",
    location: "",
    hosts: ""
});



// Data Fetching Methods
const fetchUsers = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.get<User[]>(`/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        userOptions.value = response.data;

    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

const fetchEvents = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.get<Event[]>(`/events`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        events.value = response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

// Computed Properties
const filteredEvents = computed(() => {
    if (!searchQuery.value) return events.value;
    return events.value.filter(event =>
        event.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

// Dialog and Form Methods
const openCreateDialog = () => {
    if (!isAdmin.value) return;

    form.value = { id: 0, name: "", eventTime: new Date(), location: "" };
    selectedHosts.value = [];
    isUpdate.value = false;
    showEventDialog.value = true;
};

const openUpdateDialog = (event: Event) => {
    if (!isAdmin.value) return;

    form.value = {
        id: event.id,
        name: event.name,
        eventTime: new Date(event.eventTime),
        location: event.location
    };
    selectedHosts.value = event.hosts.map(host => host.id);
    isUpdate.value = true;
    showEventDialog.value = true;
};

const confirmDeleteEvent = (event: Event) => {
    if (!isAdmin.value) return;

    eventToDelete.value = event;
    showConfirmDialog.value = true;
};

// Validation Method
const validateForm = () => {
    errors.value = { name: "", eventTime: "", location: "", hosts: "" };

    if (!form.value.name) errors.value.name = "Tên sự kiện là bắt buộc";
    if (!form.value.eventTime) errors.value.eventTime = "Thời gian là bắt buộc";
    if (!form.value.location) errors.value.location = "Địa điểm là bắt buộc";
    if (selectedHosts.value.length === 0) errors.value.hosts = "Phải chọn ít nhất một chủ sự kiện";

    return Object.values(errors.value).every(err => err === "");
};

// Event CRUD Methods
const saveEvent = async () => {
    if (!isAdmin.value || !validateForm()) return;

    try {
        const token = localStorage.getItem('accessToken');
        const eventData = {
            ...form.value,
            hostIds: selectedHosts.value
        };

        if (isUpdate.value) {
            await axiosInstance.put(`/events/${form.value.id}`, eventData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            await axiosInstance.post(`/events`, eventData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }

        showEventDialog.value = false;
        fetchEvents();
    } catch (error) {
        console.error('Error saving event:', error);
    }
};

const deleteEvent = async () => {
    if (!isAdmin.value || !eventToDelete.value) return;

    try {
        const token = localStorage.getItem('accessToken');
        await axiosInstance.delete(`/events/${eventToDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
    } finally {
        showConfirmDialog.value = false;
        eventToDelete.value = null;
    }
};

// Utility Functions
const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// Lifecycle Hooks
onMounted(() => {
    if (!token) {
        router.push('/login');
    } else {
        fetchEvents();
        fetchUsers();
        checkIsAdmin();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}

:global(.container-dialog) {
    width: 400px;
    max-width: 600px;
    margin: 0 auto;
}

:global(.item-dialog) {
    display: flex;
    justify-content: space-between;
}

:global(.actions-dialog) {
    display: flex;
    justify-content: right;
    gap: 20px;
}

:global(#hosts) {
    width: 58%;
}

.text-xl {
    text-align: center;
    font: 2em sans-serif;
}

.left-10 {
    margin-left: 10px;
}
</style>