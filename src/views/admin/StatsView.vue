<template>
    <div class="container mx-auto p-6">
        <!-- Thống kê tổng quan -->
        <select v-model="selectedYear" @change="onYearChange"
            class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300 select-year">
            <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
            </option>
        </select>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sumary-stats">
            <div class="stat-card">
                <div class="icon bg-blue-100 text-blue-600"><i class="pi pi-dollar"></i></div>
                <div>
                    <h3 class="text-gray">Tiền chung</h3>
                    <p class="text-2xl font-semibold" v-if="balance.length > 0"> ${{
                        formatCurrency(balance[1].totalAmount) }}
                    </p>
                    <p class="text-green-500 text-sm">Tổng tiền chung của nhóm</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="icon bg-yellow-100 text-yellow-600"><i class="pi pi-credit-card"></i></div>
                <div>
                    <h3 class="text-gray">Tiền ăn vặt</h3>
                    <p class="text-2xl font-semibold">
                        {{ balance.length > 1 ? `$${formatCurrency(balance[0].totalAmount)}` : 'Đang tải...' }}
                    </p>

                    <p class="text-green-500 text-sm">Tổng tiền ăn vặt của nhóm</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="icon bg-teal-100 text-teal-600"><i class="pi pi-wallet"></i></div>
                <div>
                    <h3 class="text-gray">Tiền thu</h3>
                    <p class="text-2xl font-semibold">$ {{ formatCurrency(amountCharge) }}</p>
                    <p class="text-green-500 text-sm">Tiền thu vào của nhóm</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="icon bg-purple-100 text-purple-600"><i class="pi pi-cart-plus"></i></div>
                <div>
                    <h3 class="text-gray">Tiền chi</h3>
                    <p class="text-2xl font-semibold">{{ formatCurrency(amountExpense) }}</p>
                    <p class="text-green-500 text-sm">Tiền chi ra của nhóm</p>
                </div>
            </div>
        </div>

        <!-- Biểu đồ -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 charts">
            <div class="bg-white shadow-lg rounded-lg p-5 line">
                <div class="flex items-center justify-between mb-4">
                    <p class="text-xl font-semibold text-gray-700">Quỹ hàng tháng</p>

                </div>
                <Chart type="line" :data="chartDataMonths" :options="chartMonthOptions" class="h-[20rem]" />
            </div>

            <div class="bg-white shadow-lg rounded-lg p-5 column">
                <p class="text-xl font-semibold text-gray-700 mb-4">Quỹ hàng năm</p>
                <Chart type="bar" :data="chartDataYears" :options="chartYearOptions" class="h-[20rem]" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Chart from 'primevue/chart';
import formatCurrency from '@/utils/FormatCurrency';

const baseURL = "http://localhost:8080/api/v1";
const token = localStorage.getItem('accessToken');

// const stats = ref({
//     orders: 152,
//     newOrders: 24,
//     revenue: 2100,
//     revenueGrowth: 52,
//     customers: 28441,
//     newCustomers: 520,
//     unreadComments: 152,
//     respondedComments: 85
// });

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const availableYears = ref([]);

for (let year = 2020; year <= currentYear; year++) {
    availableYears.value.push(year);
}

const fundMonths = ref([]);
const months = ref([]);
const amountsMonths = ref([]);
const fundYears = ref([]);
const balance = ref([]);


const chartDataMonths = ref({});
const chartMonthOptions = ref({});
const chartDataYears = ref({});
const chartYearOptions = ref({});


const fetchDataMonths = async (year) => {
    try {
        const response = await axios.get(`${baseURL}/contributions/monthly-stats`, {
            params: { year },
            headers: { Authorization: `Bearer ${token}` }
        });

        fundMonths.value = response.data;
        months.value = response.data.map(item => `Tháng ${item.month}`);
        amountsMonths.value = response.data.map(item => item.totalAmount);

        chartDataMonths.value = {
            labels: months.value,
            datasets: [
                {
                    label: 'Tổng số tiền',
                    data: amountsMonths.value,
                    borderColor: '#42A5F5',
                    fill: true,
                    tension: 0.4,
                    backgroundColor: 'rgba(66, 165, 245, 0.5)',
                    borderWidth: 3
                }
            ]
        };
    } catch (error) {
        console.error('Error fetching monthly data:', error.response?.data || error.message);
    }
};

const fetchBalance = async () => {
    try {
        const response = await axios.get(`${baseURL}/balances`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        balance.value = response.data;
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching common funds:', error.response?.data || error.message);
    }
}
const amountExpense = ref({ value: 0 });
const fetchExpenseByYear = async () => {
    try {
        const response = await axios.get(`${baseURL}/expenses/total-year`, {
            params: { year: selectedYear.value },
            headers: { Authorization: `Bearer ${token}` }
        });
        amountExpense.value = response.data;
        console.log('charge' + amountExpense.value);
    } catch (error) {
        console.error('Error fetching expenses:', error.response?.data || error.message);
    }
}
const amountCharge = ref({ value: 0 });
const fetchChargeByYear = async () => {
    try {
        const response = await axios.get(`${baseURL}/contributions/total`, {
            params: { year: selectedYear.value },
            headers: { Authorization: `Bearer ${token}` }
        });
        amountCharge.value = response.data;
        console.log('charge' + amountCharge.value);
    } catch (error) {
        console.error('Error fetching expenses:', error.response?.data || error.message);
    }
}

const fetchDataYears = async () => {
    try {
        const response = await axios.get(`${baseURL}/contributions/yearly-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        fundYears.value = response.data;

        chartDataYears.value = {
            labels: fundYears.value.map(item => `Năm ${item.year}`),
            datasets: [
                {
                    label: 'Tổng số tiền',
                    data: fundYears.value.map(item => item.totalAmount),
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: '#8B5CF6',
                    borderWidth: 2
                }
            ]
        };
    } catch (error) {
        console.error('Error fetching yearly data:', error.response?.data || error.message);
    }
};

onMounted(() => {
    fetchDataMonths(selectedYear.value);
    fetchDataYears();
    fetchBalance();
    fetchExpenseByYear();
    fetchChargeByYear();
});
const onYearChange = () => {
    fetchDataMonths(selectedYear.value);
    fetchExpenseByYear();
    fetchChargeByYear();
};

chartMonthOptions.value = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
        legend: { labels: { color: '#4B5563', font: { size: 14, weight: 'bold' } } }
    },
    scales: {
        x: { ticks: { color: '#4B5563' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } },
        y: { ticks: { color: '#4B5563' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } }
    }
};

chartYearOptions.value = {
    plugins: {
        legend: { labels: { color: '#4B5563', font: { size: 14, weight: 'bold' } } }
    },
    scales: {
        x: { ticks: { color: '#4B5563' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } },
        y: { beginAtZero: true, ticks: { color: '#4B5563' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } }
    }
};
</script>

<style scoped>
.stat-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgb(207 250 254);
    color: rgb(6 182 212);
}

.sumary-stats {
    display: flex;
    justify-content: space-between;
}

.stat-card {
    width: 24%;
    margin: 20px auto 20px;
}

.select-year {
    margin: 20px 0 0 5px;
}

.text-gray {
    color: #6474a9;
}

.text-2xl {
    color: #10b981;
}

.charts {
    display: flex;
    justify-content: space-between;
    /* gap: 5px; */

}

.line {
    width: 49%;
    border-radius: 10px;
    margin: 0 5px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.column {
    width: 49%;
    border-radius: 10px;
    margin: 0 5px;
    padding: 0;
}

.text-xl {
    color: #6474a9;
}
</style>
