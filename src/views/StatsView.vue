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
            {{ balance.length > 1 ? `${formatCurrency(balance[0].totalAmount)}` : `0 VNĐ` }}
          </p>
          <p class="text-green-500 text-sm">Tiền chung</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-yellow-100 text-yellow-600"><i class="pi pi-credit-card"></i></div>
        <div>
          <h3 class="text-gray">Quỹ ăn vặt</h3>
          <p class="text-2xl font-semibold">
            {{ balance.length > 1 ? `${formatCurrency(balance[1].totalAmount)}` : '0 VNĐ' }}
          </p>
          <p class="text-green-500 text-sm">Tiền ăn vặt</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-teal-100 text-teal-600"><i class="pi pi-wallet"></i></div>
        <div>
          <h3 class="text-gray">Tổng thu</h3>
          <p class="text-2xl font-semibold">
            {{ formatCurrency(amountCharge + amountBillCharge + incomeAmount) }}
          </p>
          <p class="text-green-500 text-sm">Tiền thu</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-purple-100 text-purple-600"><i class="pi pi-cart-plus"></i></div>
        <div>
          <h3 class="text-gray">Tổng chi</h3>
          <p class="text-2xl font-semibold">{{ formatCurrency(expenseAmount) }}</p>
          <p class="text-green-500 text-sm">Tiền chi ra</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon bg-blue-100 text-blue-600"><i class="pi pi-dollar"></i></div>
        <div>
          <h3 class="text-gray">Còn lại</h3>
          <p class="text-2xl font-semibold">
            {{
              balance.length > 1
                ? `${formatCurrency(balance[0].totalAmount + balance[1].totalAmount)}`
                : `0 VNĐ`
            }}
          </p>
          <p class="text-green-500 text-sm">Tổng tiền còn lại</p>
        </div>
      </div>
    </div>

    <!-- Biểu đồ -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 charts" style="margin-bottom: 15px">
      <div class="bg-white shadow-lg rounded-lg p-5 line">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xl font-semibold text-gray-700">Thống kê quỹ hàng tháng</p>
        </div>
        <Chart type="line" :data="combinedMonthlyData" :options="chartMonthOptions" class="h-[20rem]" />
      </div>

      <div class="bg-white shadow-lg rounded-lg p-5 column">
        <p class="text-xl font-semibold text-gray-700 mb-4">
          Thống kê quỹ theo quý năm {{ selectedYear }}
        </p>
        <Chart type="bar" :data="quarterlyData" :options="chartQuarterOptions" class="h-[20rem]" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axiosInstance from '@/router/Interceptor'
import Chart from 'primevue/chart'
import formatCurrency from '@/utils/FormatCurrency'

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const availableYears = ref([])

for (let year = 2020; year <= currentYear; year++) {
  availableYears.value.push(year)
}

// Fund data references
const contributionMonthlyData = ref([])
const penaltyMonthlyData = ref([])
const incomeMonthlyData = ref([])
const expenseMonthlyData = ref([])

const contributionYearlyData = ref([])
const penaltyYearlyData = ref([])
const incomeYearlyData = ref([])
const expenseYearlyData = ref([])

const balance = ref([])
const amountCharge = ref(0)
const amountBillCharge = ref(0)
const incomeAmount = ref(0)
const expenseAmount = ref(0)

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
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += formatCurrency(context.parsed.y)
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
        callback: function (value) {
          return formatCurrency(value)
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
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += formatCurrency(context.parsed.y)
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
        callback: function (value) {
          return formatCurrency(value)
        },
      },
      grid: { color: 'rgba(75, 85, 99, 0.2)' },
    },
  },
})

// API Calls
const fetchContributionMonthlyData = async (year) => {
  try {
    const response = await axiosInstance.get(`/contributions/monthly-stats`, {
      params: { year },
    })
    contributionMonthlyData.value = response.data
  } catch (error) {
    console.error('Error fetching monthly contributions:', error.response?.data || error.message)
  }
}

const fetchPenaltyMonthlyData = async (year) => {
  try {
    const response = await axiosInstance.get(`/pen-bills/monthly-stats`, {
      params: { year },
    })
    penaltyMonthlyData.value = response.data
  } catch (error) {
    console.error('Error fetching monthly penalties:', error.response?.data || error.message)
  }
}

const fetchIncomeMonthlyData = async (year) => {
  try {
    const response = await axiosInstance.get(`/invoices/monthly-stats`, {
      params: { year, type: 'income' },
    })
    incomeMonthlyData.value = response.data
  } catch (error) {
    console.error('Error fetching monthly income:', error.response?.data || error.message)
  }
}

const fetchExpenseMonthlyData = async (year) => {
  try {
    const response = await axiosInstance.get(`/invoices/monthly-stats`, {
      params: { year, type: 'expense' },
    })
    expenseMonthlyData.value = response.data
  } catch (error) {
    console.error('Error fetching monthly expenses:', error.response?.data || error.message)
  }
}

const fetchContributionYearlyData = async () => {
  try {
    const response = await axiosInstance.get(`/contributions/${selectedYear.value}/stats`)
    contributionYearlyData.value = response.data
  } catch (error) {
    console.error('Error fetching yearly contributions:', error.response?.data || error.message)
  }
}

const fetchPenaltyYearlyData = async () => {
  try {
    const response = await axiosInstance.get(`/pen-bills/${selectedYear.value}/stats`)
    penaltyYearlyData.value = response.data
  } catch (error) {
    console.error('Error fetching yearly penalties:', error.response?.data || error.message)
  }
}

const fetchIncomeYearlyData = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/${selectedYear.value}/stats`, {
      params: { type: 'income' },
    })
    incomeYearlyData.value = response.data
  } catch (error) {
    console.error('Error fetching yearly income:', error.response?.data || error.message)
  }
}

const fetchExpenseYearlyData = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/${selectedYear.value}/stats`, {
      params: { type: 'expense' },
    })
    expenseYearlyData.value = response.data
  } catch (error) {
    console.error('Error fetching yearly expenses:', error.response?.data || error.message)
  }
}

const fetchBalance = async () => {
  try {
    const response = await axiosInstance.get(`/balances`)
    balance.value = response.data
  } catch (error) {
    console.error('Error fetching common funds:', error.response?.data || error.message)
  }
}

const fetchContributionTotal = async () => {
  try {
    const response = await axiosInstance.get(`/contributions/total`, {
      params: { year: selectedYear.value },
    })
    amountCharge.value = response.data
  } catch (error) {
    console.error('Error fetching contribution total:', error.response?.data || error.message)
  }
}

const fetchPenaltyTotal = async () => {
  try {
    const response = await axiosInstance.get(`/pen-bills/total`, {
      params: { year: selectedYear.value },
    })
    amountBillCharge.value = response.data
  } catch (error) {
    console.error('Error fetching penalty total:', error.response?.data || error.message)
  }
}

const fetchIncomeTotal = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/total-year`, {
      params: { year: selectedYear.value, type: 'income' },
    })
    incomeAmount.value = response.data
  } catch (error) {
    console.error('Error fetching income total:', error.response?.data || error.message)
  }
}

const fetchExpenseTotal = async () => {
  try {
    const response = await axiosInstance.get(`/invoices/total-year`, {
      params: { year: selectedYear.value, type: 'expense' },
    })
    expenseAmount.value = response.data
  } catch (error) {
    console.error('Error fetching expense total:', error.response?.data || error.message)
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

.line {
  width: 99%;
  border-radius: 10px;
  margin: 0 5px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.column {
  width: 99%;
  border-radius: 10px;
  margin: 0 5px;
  padding: 0;
}

.text-xl {
  color: #6474a9;
  font-weight: bold;
  font-size: 20px;
}
</style>
