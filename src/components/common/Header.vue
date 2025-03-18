<template>
    <div class="card">
        <Menubar :model="items">
            <template #end>
                <div class="flex items-center gap-2 info-box">
                    <Message severity="success">
                        <template #icon>
                            <span class="ml-2">
                                {{ user.fullName || "Guest" }}
                            </span>
                            <Button icon="pi pi-bell" style="font-size: 1.2rem;"
                                class="p-button-rounded p-button-text p-button-plain" />
                            <Badge :value="8" class="notification-badge" style="background-color: #f77a86;" />
                        </template>
                    </Message>
                </div>
            </template>
        </Menubar>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router"; // Import router
import Menubar from "primevue/menubar";
import Message from "primevue/message";
import Badge from "primevue/badge";
import Button from "primevue/button";

const router = useRouter(); // Sử dụng Vue Router

const user = ref(JSON.parse(sessionStorage.getItem("user") || "{}"));

const items = ref([
    {
        label: "Thống kê",
        icon: "pi pi-chart-line",
        command: () => router.push("/home") // Điều hướng đến trang chủ
    },
    {
        label: "Danh sách",
        icon: "pi pi-list",
        items: [
            {
                label: "Quỹ chưa đóng",
                icon: "pi pi-bolt",
                command: () => router.push("/contributions")
            },
            {
                label: "Quỹ nợ",
                icon: "pi pi-server",
                command: () => router.push("/contributions/owed")
            },
            {
                label: "Nợ phạt",
                icon: "pi pi-pencil",
                command: () => router.push("/bills")
            }
        ]
    },
    {
        label: "Tạo quỹ",
        icon: "pi pi-list",
        items: [
            {
                label: "Quỹ mới",
                icon: "pi pi-bolt",
                command: () => router.push("/funds")
            },
            {
                label: "Quỹ nợ",
                icon: "pi pi-server",
                command: () => router.push("/periods")
            },
            {
                label: "Quỹ hàng tháng",
                icon: "pi pi-pencil",
                command: () => router.push("/penalties")
            }
        ]
    },
    {
        label: "Lịch sử",
        icon: "pi pi-history",
        command: () => router.push("/histories")
    }
]);
</script>

<style scoped>
.info-box {
    display: flex;
}

.notification-badge {
    position: absolute;
    color: white;
    height: 18px;
    font-size: 9px;
    border-radius: 50%;
    padding: 0.3rem 0.5rem;
    top: 18px;
    right: 19px;
}
</style>
