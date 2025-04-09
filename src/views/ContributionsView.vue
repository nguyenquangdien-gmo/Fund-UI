<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4" style="text-align: center;">Danh sách quỹ chưa đóng</h2>

        <!-- <p v-if="error" class="text-red-500">{{ error }}</p> -->
        <p v-if="loading">Đang tải dữ liệu...</p>

        <div v-if="contributions.length > 0">
            <div class="mb-4 flex items-center gap-4">
                <InputText v-model="searchQuery" placeholder="Tìm kiếm theo tháng, năm, mô tả..."
                    class="p-inputtext w-64" style="width: 25%;" />
            </div>

            <!-- DataTable với phân trang -->
            <DataTable :value="filteredContributions" class="p-datatable-striped" paginator :rows="15"
                :rowsPerPageOptions="[15, 20, 25]" responsiveLayout=" scroll">
                <Column header="STT" sortable>
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
                <Column field="month" header="Tháng" />
                <Column field="year" header="Năm" />
                <Column field="totalAmount" header="Tổng tiền">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.totalAmount) }}
                    </template>
                </Column>
                <Column field="deadline" header="Hạn chót">
                    <template #body="slotProps">
                        <span :class="{ 'text-red-500': new Date() > new Date(slotProps.data.deadline) }">
                            {{ formatDate(slotProps.data.deadline) }}
                        </span>
                    </template>
                </Column>
                <Column field="description" header="Mô tả" />
                <Column header="Hành động">
                    <template #body="slotProps">
                        <Button v-if="slotProps.data.paymentStatus !== 'PENDING'" label="Đóng quỹ"
                            @click="openPaymentDialog(slotProps.data)" class="p-button-success p-button-sm" />
                        <Button v-else label="Chờ xác nhận" icon="pi pi-hourglass" severity="info" disabled />
                    </template>
                </Column>
            </DataTable>
        </div>
        <div v-else>
            <p class="text-red-500">Bạn không có quỹ nào cần đóng!</p>
        </div>

        <!-- Dialog Thanh Toán -->
        <Dialog v-model:visible="showDialog" header="Đóng Quỹ" :modal="true">
            <div class="p-fluid">
                <!-- <p class="mb-2">Bạn có chắc muốn đóng quỹ?</p> -->
                <div><img :src="qrCode" alt="Mã QR" class="w-full mt-4" /></div>
                <Dropdown id="fundType" v-model="selectedFundType" :options="fundOptions" optionLabel="label"
                    optionValue="value" placeholder="Chọn quỹ" class="w-full" />
                <InputText :value="formatCurrency(paymentAmount)" type="text" class="p-inputtext w-full" disabled />
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Hủy" class="p-button-text" @click="showDialog = false" />
                    <Button label="Xác nhận" class="p-button-primary" @click="confirmPayment" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import axiosInstance from '@/router/Interceptor';
import formatCurrency from "@/utils/FormatCurrency";
import formatDate from "@/utils/FormatDate";
import Dropdown from "primevue/dropdown";


// const baseURL = "http://localhost:8080/api/v1";
const contributions = ref([]);
const loading = ref(true);
// const error = ref(null);
const user = JSON.parse(sessionStorage.getItem("user"));
const userId = ref(user ? user.id : null);
const searchQuery = ref("");
const selectedContribution = ref(null);
const showDialog = ref(false);
const paymentAmount = ref(0);
const token = localStorage.getItem("accessToken");

const fetchPendingContributions = async () => {
    try {
        if (!token) {
            throw new Error("Unauthorized");
        }

        const response = await axiosInstance.get(`/periods/unpaid/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        contributions.value = response.data;
    } catch (err) {
        // error.value = "Không thể tải dữ liệu";
        console.error(err);
    } finally {
        loading.value = false;
    }
};
//fetch fund
const funds = ref([]);
const fundOptions = ref([]);
const selectedFundType = ref('ALL');

// Theo dõi thay đổi selectedFundType
watch(selectedFundType, (newValue) => {
    if (newValue === "ALL" || (Array.isArray(newValue) && newValue.length === 0)) {
        // Nếu chọn "Tất cả", lấy tất cả quỹ
        const total = funds.value.reduce((sum, fund) => sum + Number(fund.amount), 0);
        paymentAmount.value = total;
        return;
    }

    const selectedTypes = Array.isArray(newValue) ? newValue : [newValue];

    const total = funds.value
        .filter(fund => selectedTypes.includes(fund.type))
        .reduce((sum, fund) => sum + Number(fund.amount), 0);

    paymentAmount.value = total;
});


const fetchFund = async () => {
    try {
        if (!token) {
            throw new Error("Unauthorized");
        }

        const response = await axiosInstance.get(`/funds`);
        funds.value = response.data;

        fundOptions.value = [
            { label: "Tất cả", value: "ALL" },
            ...funds.value.map((fund) => ({
                label: fund.name,
                value: fund.type
            }))
        ];
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};


const qrCode = ref(null);
const fetchTeam = async () => {
    try {
        if (!token) {
            throw new Error("Unauthorized");
        }

        const response = await axiosInstance.get(`/teams/${user.id}/team`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const qrResponse = await axiosInstance.get(`/teams/${response.data.slug}/qrcode`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob",
        });
        const qrBlob = new Blob([qrResponse.data], { type: "image/png" });
        qrCode.value = URL.createObjectURL(qrBlob);
        // team.value = response.data;
        // console.log(team.value);
    } catch (err) {
        error.value = "Không thể tải dữ liệu";
        // console.error(err);
    } finally {
        loading.value = false;
    }

}
onMounted(() => {
    fetchTeam();
    fetchFund();
    fetchPendingContributions();
});
const filteredContributions = computed(() => {
    if (!searchQuery.value) return contributions.value;

    return contributions.value.filter((contribution) =>
        (contribution.month && contribution.month.toString().includes(searchQuery.value)) ||
        (contribution.year && contribution.year.toString().includes(searchQuery.value)) ||
        (contribution.description && contribution.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});


const openPaymentDialog = (contribution) => {
    selectedContribution.value = contribution;
    paymentAmount.value = 150000;
    showDialog.value = true;
};

const confirmPayment = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            throw new Error("Unauthorized");
        }

        const paymentData = {
            periodId: selectedContribution.value.id,
            userId: userId.value,
            totalAmount: paymentAmount.value,
            fundType: selectedFundType.value === 'ALL' ? '' : selectedFundType.value,
            note: `Thanh toán quỹ tháng ${selectedContribution.value.month} năm ${selectedContribution.value.year}`,
        };
        console.log("Payment Data:", paymentData);
        selectedFundType.value = 'ALL';
        // console.log(paymentData);


        await axiosInstance.post(`/contributions`, paymentData, {
            headers: { Authorization: `Bearer ${token}` },
        });

        showDialog.value = false;
        fetchPendingContributions();
    } catch (err) {
        console.error("Lỗi khi thanh toán:", err);
    }
};
</script>

<style scoped>
.p-datatable th {
    background-color: #f4f4f4;
    text-align: left;
}

.text-xl {
    text-align: center;
    font: 2em sans-serif;
}

.p-fluid {
    text-align: center;
}

#fundType {
    margin: 0;
    margin-bottom: 10px;
    width: 66%;
}
</style>
