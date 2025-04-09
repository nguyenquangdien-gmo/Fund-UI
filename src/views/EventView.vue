<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center">Danh Sách Sự Kiện</h2>

            <!-- Search and Create Button (Only for Admin) -->
            <div class="navbar-actions">
                <div class=" mb-3 flex justify-content-between align-items-center">
                    <InputText v-model="searchQuery" placeholder="Tìm kiếm theo tên sự kiện..."
                        class="w-full p-inputtext-sm mr-3" />
                    <Button v-if="isAdmin" label="Tạo Sự Kiện" class="left-10" severity="success" raised size="small"
                        @click="openCreateDialog" />
                </div>
                <div class="navbar-actions-time">
                    <div class="navbar-actions-time">
                        <p></p>
                        <Button v-if="isAdmin" label="Cài đặt" icon="pi pi-calendar-plus" class="left-10"
                            severity="success" raised size="small" @click="openScheduleDialog" />
                    </div>

                </div>
            </div>

            <!-- Event DataTable -->
            <DataTable :value="filteredEvents" paginator :rows="10" :rowsPerPageOptions="[10, 15, 20]"
                class="p-datatable-sm">
                <Column header="STT" sortable>
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
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
                optionValue="id" placeholder="Chọn chủ sự kiện" :class="{ 'p-invalid': errors.hosts }" class="w-full"
                style="width: 100%;" />
            <small class="p-error" v-if="errors.hosts">{{ errors.hosts }}</small>
        </div>

        <div class="actions-dialog">
            <Button label="Hủy" severity="secondary" @click="showEventDialog = false" class="p-button-outlined" />
            <Button :label="isUpdate ? 'Cập Nhật' : 'Tạo'" severity="primary" @click="saveEvent"
                class="p-button-raised" />
        </div>
    </Dialog>

    <!-- dialog setting time  -->
    <Dialog v-model:visible="showScheduleDialog" modal header="Cập nhật" class="container-dialog">
        <!-- Thông tin hiện tại -->
        <div class="col-12 mb-3 item-dialog lh-2">
            <p class="text-sm text-gray-600">
                🕒 <strong>Từ ngày:</strong> {{ formatFullDateTime(scheduleForm.fromDate) }}<br />
                🕒 <strong>Đến ngày:</strong> {{ formatFullDateTime(scheduleForm.toDate) }}<br />
                ⏰ <strong>Thời gian gửi:</strong> {{ formatTimeOnly(scheduleForm.sendTime) }}
            </p>
        </div>

        <!-- Form chọn lại -->
        <div class="col-12 mb-3 item-dialog">
            <label class="font-bold mb-2">Từ ngày</label>
            <Calendar v-model="scheduleForm.fromDate" date-format="dd/mm/yy" class="w-full" />
        </div>

        <div class="col-12 mb-3 item-dialog">
            <label class="font-bold mb-2">Đến ngày</label>
            <Calendar v-model="scheduleForm.toDate" date-format="dd/mm/yy" class="w-full" />
        </div>

        <div class="col-12 mb-3 item-dialog">
            <label class="font-bold mb-2">Thời gian gửi</label>
            <Calendar v-model="scheduleForm.sendTime" timeOnly hourFormat="24" class="w-full" />
        </div>

        <div class="actions-dialog">
            <Button label="Hủy" severity="secondary" @click="showScheduleDialog = false" />
            <Button label="Cập nhật" severity="primary" @click="saveSchedule" />
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
import { convertToLocalDateTimeString, convertToLocalTimeString } from '@/utils/ConvertTimeToDateTime';

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
    try {
        const response = await axiosInstance.get(`/tokens/is-admin?token=${token}`);
        isAdmin.value = response.data;
    } catch (error) {
        console.error("Error checking admin status:", error);
        isAdmin.value = false;
    }
};

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

const filteredEvents = computed(() => {
    if (!searchQuery.value) return events.value;
    return events.value.filter(event =>
        event.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});
//setting time
const showScheduleDialog = ref(false);
const scheduleForm = ref({
    fromDate: new Date(),
    toDate: new Date(),
    sendTime: new Date(),
    type: 'event_notification',
});
const fetchSchedule = async () => {
    try {
        const response = await axiosInstance.get(`/schedules/type/event_notification`);
        if (response.data && response.data.length > 0) {
            const scheduleData = response.data[0]; // Lấy phần tử đầu tiên từ mảng
            scheduleForm.value = {
                fromDate: new Date(scheduleData.fromDate),
                toDate: new Date(scheduleData.toDate),
                sendTime: new Date(`1970-01-01T${scheduleData.sendTime}`), // LocalTime convert
                type: scheduleData.type.toLowerCase(),
            };
        } else if (response.data) { // Nếu response không phải là mảng
            scheduleForm.value = {
                fromDate: new Date(response.data.fromDate),
                toDate: new Date(response.data.toDate),
                sendTime: new Date(`1970-01-01T${response.data.sendTime}`),
                type: response.data.type.toLowerCase(),
            };
        }
    } catch (error) {
        console.error('Error fetching schedule:', error);
    }
};

const formatFullDateTime = (dateObj: Date) => {
    if (!dateObj) return "Không có dữ liệu";
    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
};

// Định dạng chỉ thời gian
const formatTimeOnly = (dateObj: Date) => {
    if (!dateObj) return "Không có dữ liệu";
    return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
};

// 👉 Hàm mở dialog với schedule sẵn có
const openScheduleDialog = () => {
    fetchSchedule();
    showScheduleDialog.value = true;
};

const saveSchedule = async () => {
    try {
        const fromDate = new Date(scheduleForm.value.fromDate);
        const toDate = new Date(scheduleForm.value.toDate);

        fromDate.setHours(0, 0, 0, 0);

        toDate.setHours(23, 59, 59, 999);

        const dataForm = {
            fromDate: convertToLocalDateTimeString(fromDate),
            toDate: convertToLocalDateTimeString(toDate),
            sendTime: convertToLocalTimeString(scheduleForm.value.sendTime),
            type: scheduleForm.value.type,
        };

        console.log('scheduleForm update gửi lên:', dataForm);

        await axiosInstance.put(`/schedules/${dataForm.type}`, dataForm);
        showScheduleDialog.value = false;
    } catch (error) {
        console.error('Lỗi khi cập nhật schedule:', error);
    }
};

function parseTimeWithDate(dateStr: string, timeStr: string): Date | null {
    if (!dateStr || !timeStr) return null;
    const baseDate = dateStr.split("T")[0];
    const combined = `${baseDate}T${timeStr}`;
    const parsed = new Date(combined);
    return isNaN(parsed.getTime()) ? null : parsed;
}


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
        fetchSchedule();
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

.navbar-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f5f5f5;
    align-items: center;
}

.navbar-actions-time {
    display: flex;
    align-items: center;
}

.navbar-actions-time p {
    margin: 0;
}
</style>