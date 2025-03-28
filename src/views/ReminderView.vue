<template>
    <div class="container">
        <div class="p-4">
            <h2 class="text-center text-xl">Thông báo nhắc nhở</h2>
            <div class="mb-3">
                <InputText v-if="reminders.length > 0" v-model="searchQuery" placeholder="Tìm kiếm theo mã quỹ..."
                    class="w-full p-inputtext-sm" />
                <Button v-if="isAdmin" label="Tạo nhắc nhở" severity="success" raised size="small"
                    @click="openCreateDialog" style="margin-left: 10px;" />

            </div>
            <DataTable v-if="reminders.length > 0" :value="filteredFunds" paginator :rows="15"
                :rowsPerPageOptions="[15, 20, 25]" class="p-datatable-sm">
                <Column field="id" header="ID" sortable></Column>
                <Column field="title" header="Tên" sortable></Column>
                <Column field="type" header="Loại" sortable></Column>
                <Column field="description" header="Mô tả" sortable></Column>
                <!-- <Column field="status" header="Trạng thái" sortable></Column> -->

                <Column field="createdAt" header="Ngày Tạo" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>

            </DataTable>
            <div v-else>
                <p>Bạn không có bất kỳ thông báo nào!</p>
            </div>
        </div>

    </div>


    <Dialog v-if="isAdmin" v-model:visible="showReminderDialog" modal :header="'Tạo'" @hide="resetErrors"
        :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="title" class="fw-bold">Tên</label>
            <InputText id="title" v-model="form.title" class="w-100" autocomplete="off"
                placeholder="Vui lòng nhập tên..." />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
        </div>
        <div class="mb-3">
            <label for="description" class="fw-bold">Nội dung</label>
            <Textarea id="description" v-model="form.description" class="w-100" autocomplete="off"
                placeholder="Vui lòng nhập nội dung..." />
            <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
        </div>

        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Hủy" severity="secondary" @click="showReminderDialog = false"></Button>
            <Button type="button" label="Lưu" severity="primary" @click="saveReminder"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import axios from 'axios';
import { useRouter } from 'vue-router';
import type Reminder from '@/types/Reminder';
import formatDate from '@/utils/FormatDate';
import { useUserStore } from '@/pinia/userStore';

const baseURL = "http://localhost:8080/api/v1";
const token = localStorage.getItem('accessToken');
const reminders = ref<Reminder[]>([]);
const searchQuery = ref("");
const showReminderDialog = ref(false);
// const isUpdate = ref(false);
const form = ref({ id: 0, title: "", description: "", type: "", status: "", created_at: "" });
const errors = ref({ name: "", description: "" });
const router = useRouter();

const userStore = useUserStore();
// const user = computed(() => userStore.user);
const isAdmin = ref(false); // Mặc định là false

const checkIsAdmin = async () => {
    if (!token) return;
    try {
        const response = await axios.get(`${baseURL}/tokens/is-admin?token=${token}`);
        isAdmin.value = response.data; // API trả về true/false
    } catch (error) {
        console.error("Error checking admin status:", error);
        isAdmin.value = false;
    }
};

onMounted(() => {
    if (!token) {
        router.push('/');
    } else {
        fetchReminders();
        checkIsAdmin(); // Gọi API kiểm tra quyền admin
    }
});



const fetchReminders = async () => {
    try {
        const response = await axios.get(`${baseURL}/reminders`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        reminders.value = response.data;
    } catch (error) {
        console.error('Error fetching funds:', error);
    }
};

const filteredFunds = computed(() => {
    if (!searchQuery.value) return reminders.value;
    return reminders.value.filter(reminder => reminder.title.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const openCreateDialog = () => {
    form.value = { id: 0, title: "", description: "", type: "", status: "", created_at: "" };
    showReminderDialog.value = true;
};

const validateForm = () => {
    errors.value = { name: "", description: "" };
    if (!form.value.title) errors.value.name = "Name is required!";
    if (!form.value.description) errors.value.name = "Description is required!";

    return Object.values(errors.value).every(err => err === "");
};

const saveReminder = async () => {
    if (!validateForm()) return;
    try {

        await axios.post(`${baseURL}/reminders/create/other`, form.value, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(form.value);

        showReminderDialog.value = false;
        fetchReminders();
    } catch (error) {
        console.error('Error saving reminder:', error);
    }
};
const resetErrors = () => {
    errors.value = { name: "", description: "" };
}



onMounted(() => {
    if (!token) {
        router.push('/');
    } else {
        fetchReminders();
    }
});
</script>

<style scoped>
.p-datatable-sm {
    font-size: 14px;
}

.text-xl {
    text-align: center;
    font: 2em sans-serif;
}
</style>