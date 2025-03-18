<template>
    <div class="container mx-auto p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Biểu đồ hàng tháng -->
            <div class="bg-white shadow-lg rounded-lg p-5b line">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-semibold text-gray-700">Quỹ hàng tháng</h3>
                    <select v-model="selectedYear" @change="fetchDataMonths(selectedYear)"
                        class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300">
                        <option v-for="year in availableYears" :key="year" :value="year">
                            {{ year }}
                        </option>
                    </select>
                </div>
                <Chart type="line" :data="chartDataMonths" :options="chartMonthOptions" class="h-[20rem]" />
            </div>

            <!-- Biểu đồ hàng năm -->
            <div class="bg-white shadow-lg rounded-lg p-5 column">
                <h3 class="text-xl font-semibold text-gray-700 mb-4">Quỹ hàng hàng năm</h3>
                <Chart type="bar" :data="chartDataYears" :options="chartYearOptions" class="h-[20rem]" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Chart from 'primevue/chart';

const token = localStorage.getItem('accessToken');

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const availableYears = ref([]);

// Tạo danh sách năm từ 2020 đến năm hiện tại
for (let year = 2020; year <= currentYear; year++) {
    availableYears.value.push(year);
}

const fundMonths = ref([]);
const months = ref([]);
const amountsMonths = ref([]);
const fundYears = ref([]);

const chartDataMonths = ref({});
const chartMonthOptions = ref({});
const chartDataYears = ref({});
const chartYearOptions = ref({});

const fetchDataMonths = async (year) => {
    try {
        const response = await axios.get(`http://localhost:8080/api/v1/contributions/monthly-stats`, {
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
                    pointBackgroundColor: '#42A5F5',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#42A5F5',
                    borderWidth: 3
                }
            ]
        };
    } catch (error) {
        console.error('Error fetching monthly data:', error.response?.data || error.message);
    }
};

const fetchDataYears = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/v1/contributions/yearly-stats', {
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
                    borderWidth: 2,
                    hoverBackgroundColor: 'rgba(139, 92, 246, 0.8)',
                    hoverBorderColor: '#8B5CF6'
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
});

const setChartMonthOptions = () => {
    return {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
            legend: {
                labels: { color: '#4B5563', font: { size: 14, weight: 'bold' } }
            }
        },
        scales: {
            x: {
                ticks: { color: '#4B5563', font: { size: 12 } },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            },
            y: {
                ticks: { color: '#4B5563', font: { size: 12 } },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            }
        }
    };
};

const setChartYearOptions = () => {
    return {
        plugins: {
            legend: {
                labels: { color: '#4B5563', font: { size: 14, weight: 'bold' } }
            }
        },
        scales: {
            x: {
                ticks: { color: '#4B5563', font: { size: 12 } },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#4B5563', font: { size: 12 } },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            }
        }
    };
};

chartMonthOptions.value = setChartMonthOptions();
chartYearOptions.value = setChartYearOptions();
</script>
<style scoped>
.line {
    margin: 20px;
    padding: 48px;
    border-radius: 15px;
    margin-bottom: 20px;
}

.column {
    margin: 20px;
    border-radius: 15px;
    margin-bottom: 20px;
}
</style>
