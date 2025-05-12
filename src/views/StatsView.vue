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
          <h3 class="text-gray">Quỹ chung</h3>
          <p class="text-2xl font-semibold">
            {{ balance.length > 1 ? `${formatCurrency(balance[0]?.totalAmount?.toString() || '0')}` : `0 VNĐ` }}
          </p>
          <p class="text-green-500 text-sm">Tiền quỹ chung</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-yellow-100 text-yellow-600"><i class="pi pi-credit-card"></i></div>
        <div>
          <h3 class="text-gray">Quỹ ăn vặt</h3>
          <p class="text-2xl font-semibold">
            {{ balance.length > 1 ? `${formatCurrency(balance[1]?.totalAmount?.toString() || '0')}` : '0 VNĐ' }}
          </p>
          <p class="text-green-500 text-sm">Tiền quỹ ăn vặt</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-teal-100 text-teal-600"><i class="pi pi-wallet"></i></div>
        <div>
          <h3 class="text-gray">Tổng thu</h3>
          <p class="text-2xl font-semibold">
            {{ formatCurrency((amountCharge + amountBillCharge + incomeAmount).toString()) }}
          </p>
          <p class="text-green-500 text-sm">Các khoản thu</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-purple-100 text-purple-600"><i class="pi pi-cart-plus"></i></div>
        <div>
          <h3 class="text-gray">Tổng chi</h3>
          <p class="text-2xl font-semibold">{{ formatCurrency(expenseAmount.toString()) }}</p>
          <p class="text-green-500 text-sm">Các khoản chi</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-blue-100 text-blue-600"><i class="pi pi-dollar"></i></div>
        <div>
          <h3 class="text-gray">Còn lại</h3>
          <p class="text-2xl font-semibold">
            {{
              balance.length > 1
                ? `${formatCurrency(((balance[0]?.totalAmount || 0) + (balance[1]?.totalAmount || 0)).toString())}`
                : `0 VNĐ`
            }}
          </p>
          <p class="text-green-500 text-sm">Tổng tiền còn lại</p>
        </div>
      </div>
    </div>

    <!-- Biểu đồ trên cùng một hàng: Thống kê quỹ hàng tháng và Thống kê đi trễ -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 charts-pie-line">
      <div class="bg-white shadow-lg rounded-lg p-5 line-chart">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xl font-semibold text-gray-700">QUỸ HÀNG THÁNG</p>
        </div>
        <Chart type="line" :data="combinedMonthlyData" :options="chartMonthOptions" class="h-[20rem]" />
      </div>

      <div class="bg-white shadow-lg rounded-lg p-5 pie-chart">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xl font-semibold text-gray-700">ĐI TRỄ</p>
          <div class="flex items-center gap-2">
            <select v-model="selectedMonth" @change="fetchLateUsersData"
              class="p-2 border rounded-md text-gray-700 focus:ring focus:ring-blue-300 select-month">
              <option v-for="month in months" :key="month" :value="months.indexOf(month) + 1">
                {{ month }}
              </option>
            </select>
          </div>
        </div>
        <Chart type="pie" :data="lateCountData" :options="lateChartOptions" class="h-[16rem]" />
      </div>
    </div>

    <!-- Biểu đồ theo quý -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 column-chart">
      <div class="bg-white shadow-lg rounded-lg p-5">
        <p class="text-xl font-semibold text-gray-700 mb-4">
          THỐNG KÊ THEO QUÝ NĂM {{ selectedYear }}
        </p>
        <Chart type="bar" :data="quarterlyData" :options="chartQuarterOptions" class="h-[20rem]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axiosInstance from '@/router/Interceptor';
import formatCurrency from '@/utils/FormatCurrency';
import Chart from 'primevue/chart';
import { computed, onMounted, ref } from 'vue';

// Define interfaces
interface LateUser {
  userId: number;
  fullName: string;
  lateCount: number;
}

interface BalanceItem {
  id?: number;
  totalAmount: number;
  [key: string]: unknown;
}

interface MonthlyData {
  month: number;
  totalAmount: number;
}

interface ChartContext {
  label?: string;
  raw?: number;
  parsed: { y: number | null };
  dataset: {
    label?: string;
  };
  chart: {
    data: {
      datasets: Array<{
        data: number[];
      }>;
    };
  };
}

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1 // Current month (1-12)
const selectedYear = ref<number>(currentYear)
const selectedMonth = ref<number>(currentMonth)
const availableYears = ref<number[]>([])
const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

for (let year = 2020; year <= currentYear; year++) {
  availableYears.value.push(year)
}

// Late count data
const lateUsers = ref<LateUser[]>([])
const lateCountData = computed(() => {
  // If no data, provide empty dataset that still renders
  if (!lateUsers.value.length) {
    return {
      labels: ['Không có dữ liệu'],
      datasets: [
        {
          data: [1],
          backgroundColor: ['#e5e7eb'],
          hoverBackgroundColor: ['#d1d5db']
        }
      ]
    }
  }

  // Extract names and counts
  const labels = lateUsers.value.map(user => user.fullName) // Get last name
  const counts = lateUsers.value.map(user => user.lateCount)

  // Generate random colors
  const backgroundColors = lateUsers.value.map(() => {
    const r = Math.floor(Math.random() * 200) + 55
    const g = Math.floor(Math.random() * 200) + 55
    const b = Math.floor(Math.random() * 200) + 55
    return `rgba(${r}, ${g}, ${b}, 0.7)`
  })

  return {
    labels: labels,
    datasets: [
      {
        data: counts,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: backgroundColors.map(color => color.replace('0.7', '0.9'))
      }
    ]
  }
})

// Late chart options
const lateChartOptions = ref({
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#4B5563',
        font: { size: 12 }, // Reduced font size
        boxWidth: 12 // Reduced box width
      }
    },
    tooltip: {
      callbacks: {
        label: function (context: ChartContext) {
          const label = context.label || '';
          const value = context.raw || 0;

          // Special case for no data
          if (label === 'Không có dữ liệu') {
            return 'Không có dữ liệu';
          }

          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((value * 100) / total);
          return `${label}: ${value} lần (${percentage}%)`;
        }
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
})

// Fund data references
const contributionMonthlyData = ref<MonthlyData[]>([])
const penaltyMonthlyData = ref<MonthlyData[]>([])
const incomeMonthlyData = ref<MonthlyData[]>([])
const expenseMonthlyData = ref<MonthlyData[]>([])

const contributionYearlyData = ref<MonthlyData[]>([])
const penaltyYearlyData = ref<MonthlyData[]>([])
const incomeYearlyData = ref<MonthlyData[]>([])
const expenseYearlyData = ref<MonthlyData[]>([])

const balance = ref<BalanceItem[]>([])
const amountCharge = ref<number>(0)
const amountBillCharge = ref<number>(0)
const incomeAmount = ref<number>(0)
const expenseAmount = ref<number>(0)

// Computed combined chart data
const combinedMonthlyData = computed(() => {
  const months = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)

  // Prepare empty data arrays with 12 months
  const contributionData = new Array(12).fill(0)
  const penaltyData = new Array(12).fill(0)
  const incomeData = new Array(12).fill(0)
  const expenseData = new Array(12).fill(0)

  // Fill contribution data
  contributionMonthlyData.value.forEach((item) => {
    contributionData[item.month - 1] = item.totalAmount
  })

  // Fill penalty data
  penaltyMonthlyData.value.forEach((item) => {
    penaltyData[item.month - 1] = item.totalAmount
  })

  // Fill income data
  incomeMonthlyData.value.forEach((item) => {
    incomeData[item.month - 1] = item.totalAmount
  })

  // Fill expense data
  expenseMonthlyData.value.forEach((item) => {
    expenseData[item.month - 1] = item.totalAmount
  })

  return {
    labels: months,
    datasets: [
      {
        label: 'Chung + Ăn vặt',
        data: contributionData,
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66, 165, 245, 0.2)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      },
      {
        label: 'Tổng phạt',
        data: penaltyData,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: 'Tổng thu',
        data: incomeData,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        tension: 0.4,
        borderDash: [5, 5],
        borderWidth: 2,
      },
      {
        label: 'Tổng chi',
        data: expenseData,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        tension: 0.4,
        borderDash: [5, 5],
        borderWidth: 2,
      },
    ],
  }
})

// Tạo dữ liệu theo quý cho năm đã chọn thay vì nhiều năm
const quarterlyData = computed(() => {
  // Tạo mảng quý cho năm được chọn
  const quarters = [`Quý 1`, `Quý 2`, `Quý 3`, `Quý 4`]

  // Tính toán dữ liệu theo quý từ dữ liệu hàng tháng
  const contributionQuarterlyData = [0, 0, 0, 0]
  const penaltyQuarterlyData = [0, 0, 0, 0]
  const incomeQuarterlyData = [0, 0, 0, 0]
  const expenseQuarterlyData = [0, 0, 0, 0]

  // Tính tổng cho quý từ dữ liệu hàng tháng
  contributionMonthlyData.value.forEach((item) => {
    const quarterIndex = Math.floor((item.month - 1) / 3)
    contributionQuarterlyData[quarterIndex] += item.totalAmount
  })

  penaltyMonthlyData.value.forEach((item) => {
    const quarterIndex = Math.floor((item.month - 1) / 3)
    penaltyQuarterlyData[quarterIndex] += item.totalAmount
  })

  incomeMonthlyData.value.forEach((item) => {
    const quarterIndex = Math.floor((item.month - 1) / 3)
    incomeQuarterlyData[quarterIndex] += item.totalAmount
  })

  expenseMonthlyData.value.forEach((item) => {
    const quarterIndex = Math.floor((item.month - 1) / 3)
    expenseQuarterlyData[quarterIndex] += item.totalAmount
  })

  return {
    labels: quarters,
    datasets: [
      {
        type: 'bar',
        label: 'Quỹ Chung + ăn vặt',
        data: contributionQuarterlyData,
        backgroundColor: 'rgba(66, 165, 245, 0.7)',
        borderColor: '#42A5F5',
        borderWidth: 1,
      },
      {
        type: 'bar',
        label: 'Tổng phạt',
        data: penaltyQuarterlyData,
        backgroundColor: 'rgba(255, 152, 0, 0.7)',
        borderColor: '#FF9800',
        borderWidth: 1,
      },
      {
        type: 'bar',
        label: 'Tổng thu',
        data: incomeQuarterlyData,
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: '#4CAF50',
        borderWidth: 1,
      },
      {
        type: 'bar',
        label: 'Tổng chi',
        data: expenseQuarterlyData,
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
        borderColor: '#F44336',
        borderWidth: 1,
      },
    ],
  }
})

// Chart options
const chartMonthOptions = ref({
  maintainAspectRatio: false,
  aspectRatio: 0.6,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#4B5563', font: { size: 14 } },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function (context: ChartContext) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += formatCurrency(context.parsed.y.toString())
          }
          return label
        },
      },
    },
  },
  interaction: {
    mode: 'nearest',
    intersect: true,
  },
  scales: {
    x: {
      ticks: { color: '#4B5563' },
      grid: { color: 'rgba(75, 85, 99, 0.2)' },
    },
    y: {
      ticks: {
        color: '#4B5563',
        callback: function (value: number) {
          return formatCurrency(value.toString())
        },
      },
      grid: { color: 'rgba(75, 85, 99, 0.2)' },
      beginAtZero: true,
    },
  },
})

const chartQuarterOptions = ref({
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#4B5563', font: { size: 14 } },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function (context: ChartContext) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += formatCurrency(context.parsed.y.toString())
          }
          return label
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#4B5563' },
      grid: { color: 'rgba(75, 85, 99, 0.2)' },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#4B5563',
        callback: function (value: number) {
          return formatCurrency(value.toString())
        },
      },
      grid: { color: 'rgba(75, 85, 99, 0.2)' },
    },
  },
})

// API Calls
const fetchContributionMonthlyData = async (year: number) => {
  try {
    const response = await axiosInstance.get(`/contributions/monthly-stats`, {
      params: { year },
    })
    contributionMonthlyData.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching monthly contributions:', err.response?.data || err.message)
  }
}

const fetchPenaltyMonthlyData = async (year: number) => {
  try {
    const response = await axiosInstance.get(`/pen-bills/monthly-stats`, {
      params: { year },
    })
    penaltyMonthlyData.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching monthly penalties:', err.response?.data || err.message)
  }
}

const fetchIncomeMonthlyData = async (year: number) => {
  try {
    const response = await axiosInstance.get(`/invoices/monthly-stats`, {
      params: { year, type: 'income' },
    })
    incomeMonthlyData.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching monthly income:', err.response?.data || err.message)
  }
}

const fetchExpenseMonthlyData = async (year: number) => {
  try {
    const response = await axiosInstance.get(`/invoices/monthly-stats`, {
      params: { year, type: 'expense' },
    })
    expenseMonthlyData.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching monthly expenses:', err.response?.data || err.message)
  }
}

const fetchContributionYearlyData = async () => {
  try {
    const response = await axiosInstance.get(`/contributions/${selectedYear.value}/stats`)
    contributionYearlyData.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching yearly contributions:', err.response?.data || err.message)
  }
}

const fetchPenaltyYearlyData = async () => {
  try {
    const response = await axiosInstance.get(`/pen-bills/${selectedYear.value}/stats`)
    penaltyYearlyData.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching yearly penalties:', err.response?.data || err.message)
  }
}

const fetchIncomeYearlyData = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/${selectedYear.value}/stats`, {
      params: { type: 'income' },
    })
    incomeYearlyData.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching yearly income:', err.response?.data || err.message)
  }
}

const fetchExpenseYearlyData = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/${selectedYear.value}/stats`, {
      params: { type: 'expense' },
    })
    expenseYearlyData.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching yearly expenses:', err.response?.data || err.message)
  }
}

const fetchBalance = async () => {
  try {
    const response = await axiosInstance.get(`/balances`)
    balance.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching common funds:', err.response?.data || err.message)
  }
}

const fetchContributionTotal = async () => {
  try {
    const response = await axiosInstance.get(`/contributions/total`, {
      params: { year: selectedYear.value },
    })
    amountCharge.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching contribution total:', err.response?.data || err.message)
  }
}

const fetchPenaltyTotal = async () => {
  try {
    const response = await axiosInstance.get(`/pen-bills/total`, {
      params: { year: selectedYear.value },
    })
    amountBillCharge.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching penalty total:', err.response?.data || err.message)
  }
}

const fetchIncomeTotal = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/total-year`, {
      params: { year: selectedYear.value, type: 'income' },
    })
    incomeAmount.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching income total:', err.response?.data || err.message)
  }
}

const fetchExpenseTotal = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/total-year`, {
      params: { year: selectedYear.value, type: 'expense' },
    })
    expenseAmount.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching expense total:', err.response?.data || err.message)
  }
}

const fetchAllData = () => {
  fetchContributionMonthlyData(selectedYear.value)
  fetchPenaltyMonthlyData(selectedYear.value)
  fetchIncomeMonthlyData(selectedYear.value)
  fetchExpenseMonthlyData(selectedYear.value)

  fetchContributionYearlyData()
  fetchPenaltyYearlyData()
  fetchIncomeYearlyData()
  fetchExpenseYearlyData()

  fetchBalance()

  fetchContributionTotal()
  fetchPenaltyTotal()
  fetchIncomeTotal()
  fetchExpenseTotal()

  // Fetch late users data
  fetchLateUsersData()
}

onMounted(() => {
  fetchAllData()
})

const onYearChange = () => {
  fetchContributionMonthlyData(selectedYear.value)
  fetchPenaltyMonthlyData(selectedYear.value)
  fetchIncomeMonthlyData(selectedYear.value)
  fetchExpenseMonthlyData(selectedYear.value)

  fetchContributionTotal()
  fetchPenaltyTotal()
  fetchIncomeTotal()
  fetchExpenseTotal()

  // Đảm bảo chúng ta cũng cập nhật dữ liệu hàng năm khi thay đổi năm
  fetchContributionYearlyData()
  fetchPenaltyYearlyData()
  fetchIncomeYearlyData()
  fetchExpenseYearlyData()
  fetchLateUsersData()
}

// API call for late users data
const fetchLateUsersData = async () => {
  try {
    const response = await axiosInstance.get('/late/users/late-count', {
      params: {
        month: selectedMonth.value,
        year: selectedYear.value
      }
    })
    lateUsers.value = response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string }
    console.error('Error fetching late users data:', err.response?.data || err.message)
    // Reset to empty array to show empty state
    lateUsers.value = []
  }
}
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  width: 52%;
  gap: 5px;
  background: white;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgb(207 250 254);
  color: rgb(6 182 212);
  margin-bottom: 10px;
}

.sumary-stats {
  display: flex;
  justify-content: space-between;
}

.stat-card {
  width: 19%;
  margin: 10px 5px 10px;
}

.select-year {
  margin: 20px 0 0 5px;
  border-radius: 10px;
}

.text-gray {
  color: #6474a9;
}

.text-2xl {
  color: #10b981;
}

.text-xl {
  color: #6474a9;
  font-weight: bold;
  font-size: 20px;
}

.charts-pie-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.line-chart {
  width: 49%;
  margin-left: 5px;
  border-radius: 10px;
}

.pie-chart {
  width: 49%;
  margin-right: 5px;
  border-radius: 10px;
}

.column-chart {
  margin: 5px;
  border-radius: 10px;
}
</style>