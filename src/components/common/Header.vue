<template>
    <div v-if="isLoggedIn" class="card">
        <Menubar :model="filteredItems">
            <template #end>
                <div class="flex items-center gap-2 info-box">
                    <Message severity="success">
                        <template #icon>
                            <span class="ml-2">
                                {{ user.fullName || "Guest" }}
                            </span>

                            <!-- Nút Thông báo -->
                            <Button icon="pi pi-bell" style="font-size: 1.2rem;"
                                class="p-button-rounded p-button-text p-button-plain"
                                @mouseenter="toggleReminder($event)" />

                            <Badge v-if="reminders.length > 0" :value="reminders.length" class="notification-badge"
                                style="background-color: #f77a86;" />
                        </template>
                    </Message>

                    <!-- Popup Reminders -->
                    <OverlayPanel ref="reminderPanel">
                        <div v-if="reminders.length > 0">
                            <ul class="reminder-list">
                                <li v-for="reminder in reminders" :key="reminder.id"
                                    @click="markAsReadAndGo(reminder.id)" class="reminder-item">
                                    <strong>{{ reminder.title }}</strong>
                                    <p>{{ reminder.description }}</p>
                                </li>
                            </ul>
                            <!-- Nút Đã xem tất cả -->
                            <Button label="Đã xem tất cả" class="p-button-sm p-button-text mark-all-read-btn"
                                @click="markAllAsRead" />
                        </div>
                        <div v-else>
                            <p class="no-reminder">No reminders</p>
                        </div>
                    </OverlayPanel>

                    <!-- Nút Logout -->
                    <Button label="Logout" icon="pi pi-sign-out" class="p-button-danger" @click="handleLogout" />
                </div>
            </template>
        </Menubar>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/pinia/userStore";
import Menubar from "primevue/menubar";
import Message from "primevue/message";
import Badge from "primevue/badge";
import Button from "primevue/button";
import OverlayPanel from "primevue/overlaypanel";
import axios from "axios";
import type Reminder from "@/types/Reminder";
import ReminderType from "@/types/ReminderType";

const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);
const isLoggedIn = computed(() => !!user.value.role);


const token = localStorage.getItem("accessToken");
const reminders = ref<Reminder[]>([]);
const reminderPanel = ref<InstanceType<typeof OverlayPanel> | null>(null);

const fetchReminders = async () => {
    try {
        const response = await axios.get(`http://localhost:8080/api/v1/reminders/user/${user.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        reminders.value = response.data;
        console.log("Reminders:", reminders.value);


    } catch (error) {
        console.error("Error fetching reminders:", error);
    }
};

const markAsReadAndGo = async (reminderId: number) => {
    try {
        const reminder = reminders.value.find(r => r.id === reminderId);
        if (!reminder) return;

        await axios.put(`http://localhost:8080/api/v1/reminders/mark-read/${reminderId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        reminders.value = reminders.value.filter(r => r.id !== reminderId);

        if (reminder.type !== ReminderType.OTHER) {
            router.push("/contributions");
        } else {
            router.push("/reminders");
        }

        if (reminderPanel.value) {
            reminderPanel.value.hide();
        }
    } catch (error) {
        console.error("Error marking reminder as read:", error);
    }
};
const markAllAsRead = async () => {
    if (reminders.value.length === 0) return;

    try {
        const reminderIds = reminders.value.map(reminder => reminder.id);

        await axios.put(`http://localhost:8080/api/v1/reminders/mark-reads`, { reminderIds }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        });

        reminders.value = [];

        if (reminderPanel.value) {
            reminderPanel.value.hide();
        }
    } catch (error) {
        console.error("Error marking all reminders as read:", error);
    }
};

const toggleReminder = (event: Event) => {
    if (reminderPanel.value) {
        reminderPanel.value.toggle(event);
    }
};

onMounted(() => {
    if (isLoggedIn.value) {
        fetchReminders();
    } else {
        router.push("/login");
    }
});

watch(user, (newUser) => {
    if (newUser?.id) {
        fetchReminders();
    } else {
        reminders.value = [];
    }
});


const baseItems = [
    {
        label: "Danh sách",
        icon: "pi pi-list",
        items: [
            { label: "Quỹ chưa đóng", icon: "pi pi-bolt", command: () => router.push("/contributions") },
            { label: "Quỹ nợ", icon: "pi pi-server", command: () => router.push("/contributions/owed") },
            { label: "Nợ phạt", icon: "pi pi-pencil", command: () => router.push("/bills") }
        ]
    },
    { label: "Lịch sử", icon: "pi pi-history", command: () => router.push("/histories") }
];

const adminItems = [
    { label: "Thống kê", icon: "pi pi-chart-line", command: () => router.push("/stats") },
    { label: "Logs", icon: "pi pi-clock", command: () => router.push("/logs") },
    { label: "Danh sách Chi", icon: "pi pi-cart-plus", command: () => router.push("/expenses") },
    {
        label: "Tạo quỹ",
        icon: "pi pi-list",
        items: [
            { label: "Quỹ mới", icon: "pi pi-bolt", command: () => router.push("/funds") },
            { label: "Quỹ Phạt", icon: "pi pi-server", command: () => router.push("/penalties") },
            { label: "Quỹ hàng tháng", icon: "pi pi-pencil", command: () => router.push("/periods") },
            { label: "Tạo nhắc nhở", icon: "pi pi-pencil", command: () => router.push("/reminders") }
        ]
    }
];

const filteredItems = computed(() => {
    if (user.value.role === "ADMIN") {
        return [...baseItems, ...adminItems];
    }
    return baseItems;
});

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            handleLogout();
        }
        return Promise.reject(error);
    }
);
// Logout
const handleLogout = async () => {
    try {
        await axios.post('http://localhost:8080/api/v1/auth/logout', {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        });
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("user");
        userStore.logout();
        router.push("/login");
        reminders.value = [];
    } catch (error) {
        console.error("Logout error:", error);
    }
};
</script>

<style scoped>
.info-box {
    display: flex;
}

/* Notification Badge */
.notification-badge {
    position: absolute;
    color: white;
    height: 18px;
    font-size: 9px;
    border-radius: 50%;
    padding: 0.3rem 0.5rem;
    top: 18px;
    right: 130px;
}

/* Reminder Popup */
.reminder-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.reminder-item {
    padding: 10px;
    border-bottom: 1px solid #ddd;
    cursor: pointer;
    transition: background 0.3s;
}

.reminder-item:hover {
    background: #f5f5f5;
}

.no-reminder {
    text-align: center;
    padding: 10px;
    color: #888;
}
</style>
