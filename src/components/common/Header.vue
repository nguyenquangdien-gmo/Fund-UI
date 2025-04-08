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
                                @mouseenter="toggleReminder($event)" @click="handleClick" />

                            <Badge v-if="unreadRemindersCount > 0" :value="unreadRemindersCount"
                                class="notification-badge" style="background-color: #f77a86;" />
                        </template>
                    </Message>

                    <!-- Popup Reminders -->
                    <OverlayPanel ref="reminderPanel">
                        <div v-if="reminders.length > 0" class="remainder-panel">
                            <ul class="reminder-list">
                                <li v-for="reminder in reminders" :key="reminder.id"
                                    @click="markAsReadAndGo(reminder.id)" class="reminder-item">
                                    <div :style="getReminderStyle(reminder.id)">
                                        <strong>{{ reminder.title }}</strong>
                                        <p>{{ reminder.description }}</p>
                                    </div>
                                </li>
                            </ul>
                            <!-- Nút Đã xem tất cả -->

                        </div>
                        <Button v-if="unreadRemindersCount > 0" label="Đã xem tất cả"
                            class="p-button-sm p-button-text mark-all-read-btn" @click="markAllAsRead" />
                        <div v-else>
                            <p class="no-reminder">Không có nhắc nhở mới!</p>
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
import axiosInstance from '@/router/Interceptor';
import type Reminder from "@/types/Reminder";
import ReminderType from "@/types/ReminderType";

const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);
const isLoggedIn = computed(() => !!user.value.role);


const reminders = ref<Reminder[]>([]);
const reminderPanel = ref<InstanceType<typeof OverlayPanel> | null>(null);

const fetchReminders = async () => {
    try {
        const response = await axiosInstance.get(`/users/${user.value.id}/reminders`);
        reminders.value = response.data;
        // console.log("Reminders:", reminders.value);


    } catch (error) {
        console.error("Error fetching reminders:", error);
    }
};

const unreadRemindersCount = computed(() => {
    const readReminders = JSON.parse(localStorage.getItem('readReminders') || '[]');
    return reminders.value.filter(reminder => !readReminders.includes(reminder.id)).length;
});
const markAsReadAndGo = (reminderId: number) => {
    try {
        const reminder = reminders.value.find(r => r.id === reminderId);
        if (!reminder) return;

        const readReminders = JSON.parse(localStorage.getItem('readReminders') || '[]');
        if (!readReminders.includes(reminderId)) {
            readReminders.push(reminderId);
            localStorage.setItem('readReminders', JSON.stringify(readReminders));
        }

        reminders.value = reminders.value.map(r => {
            if (r.id === reminderId) {
                return { ...r, isRead: true };
            }
            return r;
        });

        if (reminder.type !== ReminderType.OTHER) {
            router.push("/contributions");
        } else {
            router.push("/user/reminders");
        }

        if (reminderPanel.value) {
            reminderPanel.value.hide();
        }
    } catch (error) {
        console.error("Error marking reminder as read:", error);
    }
};

const markAllAsRead = () => {
    if (reminders.value.length === 0) return;

    try {
        const reminderIds = reminders.value.map(reminder => reminder.id);

        localStorage.setItem('readReminders', JSON.stringify(reminderIds));

        reminders.value = reminders.value.map(r => ({ ...r, isRead: true }));

        if (reminderPanel.value) {
            reminderPanel.value.hide();
        }
    } catch (error) {
        console.error("Error marking all reminders as read:", error);
    }
};

const getReminderStyle = (reminderId: number) => {
    const readReminders = JSON.parse(localStorage.getItem('readReminders') || '[]');
    const isRead = readReminders.includes(reminderId);

    return {
        fontWeight: isRead ? 'normal' : 'bold',
        opacity: isRead ? 0.5 : 1,
    };
};

const toggleReminder = (event: Event) => {
    if (reminderPanel.value) {
        reminderPanel.value.toggle(event);
    }
};
const handleClick = (event: Event) => {
    router.push("/user/reminders");
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
    { label: "Profile", icon: "pi pi-sparkles", command: () => router.push("/profile") },
    {
        label: "Danh sách",
        icon: "pi pi-list",
        items: [
            { label: "Quỹ chưa đóng", icon: "pi pi-bolt", command: () => router.push("/contributions") },
            { label: "Đi muộn", icon: "pi pi-calendar-times", command: () => router.push("/user/late") },
            { label: "Nợ phạt", icon: "pi pi-pencil", command: () => router.push("/bills") },
            { label: "Hóa đơn", icon: "pi pi-bell", command: () => router.push("/user/invoices") },
        ]
    },
    { label: "Lịch sử", icon: "pi pi-history", command: () => router.push("/histories") },
    { label: "Sự kiện", icon: "pi pi-sparkles", command: () => router.push("/events") },

];

const adminItems = [
    { label: "Thống kê", icon: "pi pi-chart-line", command: () => router.push("/stats") },
    { label: "Logs", icon: "pi pi-clock", command: () => router.push("/logs") },
    {
        label: "Quản lý",
        icon: "pi pi-list",
        items: [
            { label: "Nhóm", icon: "pi pi-users", command: () => router.push("/teams") },
            { label: "Role", icon: "pi pi-address-book", command: () => router.push("/roles") },
            { label: "Thành viên", icon: "pi pi-user", command: () => router.push("/users") },
            { label: "Chi tiêu", icon: "pi pi-shopping-bag", command: () => router.push("/invoices") },
            { label: "Phê duyệt", icon: "pi pi-file-check", command: () => router.push("/approvals") },
            { label: "Chưa đóng quỹ", icon: "pi pi-bolt", command: () => router.push("/users/not-paid") },
            { label: "Đóng muộn", icon: "pi pi-server", command: () => router.push("/users/late-contributions") },
            { label: "Đi muộn", icon: "pi pi-calendar-times", command: () => router.push("/late-checkin") },
            // { label: "Quỹ hàng tháng", icon: "pi pi-pencil", command: () => router.push("/periods") },
            { label: "Thông báo", icon: "pi pi-bell", command: () => router.push("/reminders") }
        ]
    },
    {
        label: "Tạo",
        icon: "pi pi-list",
        items: [
            { label: "Quỹ mới", icon: "pi pi-bolt", command: () => router.push("/funds") },
            { label: "Quỹ Phạt", icon: "pi pi-server", command: () => router.push("/penalties") },
            { label: "Quỹ hàng tháng", icon: "pi pi-file-edit", command: () => router.push("/periods") },
            // { label: "Tạo nhắc nhở", icon: "pi pi-pencil", command: () => router.push("/reminders") }
        ]
    }
];

const filteredItems = computed(() => {
    if (user.value.role === "ADMIN") {
        return [...baseItems, ...adminItems];
    }
    return baseItems;
});

// axiosInstance.interceptors.response.use(
//     response => response,
//     error => {
//         if (error.response && error.response.status === 401) {
//             alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
//             handleLogout();
//         }
//         return Promise.reject(error);
//     }
// );
// Logout
const handleLogout = async () => {
    try {
        await axiosInstance.post('/auth/logout', {}, {
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

.remainder-panel {
    max-height: 300px;
    overflow-y: auto;
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
