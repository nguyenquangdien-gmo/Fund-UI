<template>
  <div class="calendar-container bg-white rounded shadow p-4 mx-auto" style="max-width: 100%">
    <!-- Calendar Header -->
    <div
      class="calendar-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-4"
    >
      <div class="d-flex align-items-center mb-3 mb-md-0">
        <button @click="previousMonth" class="btn btn-light rounded-circle p-1">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h2 class="mx-3 mb-0">{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="nextMonth" class="btn btn-light rounded-circle p-1">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <div class="d-flex flex-column flex-md-row align-items-center gap-3">
        <div class="user-info small text-secondary">
          <span class="fw-medium">{{ user.name }}</span> |
          <span class="text-primary"> WFH trong tháng: {{ wfhCount }}</span> |
          <span class="text-danger"> Số ngày nghỉ: {{ leaveCount }}</span> |
          <span class="text-secondary"> Số ngày công: {{ workDays }}</span>
        </div>

        <button @click="showRegisterModal = true" class="btn btn-success">
          Đăng ký WFH/Nghỉ phép
        </button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid" style="gap: 5px">
      <!-- Days of Week Headers -->
      <div class="row mb-2">
        <div
          v-for="day in daysOfWeek"
          :key="day"
          class="col text-center py-2 fw-medium text-secondary small"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar Days -->
      <div class="row gap-2">
        <!-- Empty cells for days before start of month -->
        <div v-for="_ in firstDayOfMonth" :key="'empty-' + _" class="col calendar-day empty"></div>

        <!-- Actual days of the month -->
        <div
          v-for="day in daysInMonth"
          :key="day"
          @click="openDayDetails(day, $event)"
          class="col position-relative bg-light rounded p-2 calendar-day border"
          style="min-height: 80px; cursor: pointer"
        >
          <!-- Day number -->
          <div class="day-number small fw-medium">{{ day }}</div>

          <!-- Status information -->
          <div v-if="getDayStatus(day)" class="mt-2">
            <div class="d-flex align-items-center">
              <div
                :class="{
                  'bg-primary': getDayStatus(day).type === 'WFH',
                  'bg-danger': getDayStatus(day).type === 'LEAVE',
                }"
                class="rounded-circle me-2"
                style="width: 8px; height: 8px"
              ></div>
              <span
                :class="{
                  'text-primary': getDayStatus(day).type === 'WFH',
                  'text-danger': getDayStatus(day).type === 'LEAVE',
                }"
                class="small fw-medium"
              >
                {{ getDayStatus(day).type === 'WFH' ? 'WFH' : 'Nghỉ phép' }}
              </span>
            </div>
            <div class="small text-secondary mt-1">
              {{
                getDayStatus(day).timePeriod === 'FULL'
                  ? '8h-17h'
                  : getDayStatus(day).timePeriod === 'AM'
                    ? '8h-12h'
                    : '13h-17h'
              }}
            </div>
            <div
              v-if="getDayStatus(day).status"
              class="small mt-1"
              :class="{
                'text-success': getDayStatus(day).status === 'APPROVED',
                'text-danger': getDayStatus(day).status === 'REJECTED',
                'text-warning': getDayStatus(day).status === 'PENDING',
              }"
            >
              {{ statusLabels[getDayStatus(day).status] }}
            </div>
          </div>

          <!-- Normal office work -->
          <div v-else class="mt-2">
            <div class="d-flex align-items-center">
              <div class="rounded-circle bg-secondary me-2" style="width: 8px; height: 8px"></div>
              <span class="small fw-medium text-secondary">X</span>
            </div>
            <div class="small text-secondary mt-1">8h-17h</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Details Modal -->
    <div v-if="showDayModal" class="modal-wrapper">
      <div class="modal show d-block" tabindex="-1" @click.self="showDayModal = false">
        <div class="modal-dialog modal-dialog-centered" @click.stop>
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ currentMonthName }} {{ selectedDay }}, {{ currentYear }}
              </h5>
              <button type="button" class="btn-close" @click="showDayModal = false"></button>
            </div>
            <div class="modal-body">
              <div v-if="selectedDayStatus" class="mb-3">
                <div class="d-flex align-items-center mb-2">
                  <div
                    :class="{
                      'bg-primary': selectedDayStatus.type === 'WFH',
                      'bg-danger': selectedDayStatus.type === 'LEAVE',
                    }"
                    class="rounded-circle me-2"
                    style="width: 10px; height: 10px"
                  ></div>
                  <span class="fw-medium">
                    {{ selectedDayStatus.type === 'WFH' ? 'Làm việc tại nhà' : 'Nghỉ phép' }}
                  </span>
                </div>

                <div class="small text-secondary mb-2">
                  <span class="fw-medium">Thời gian:</span>
                  {{
                    selectedDayStatus.timePeriod === 'FULL'
                      ? 'Cả ngày (8h-17h)'
                      : selectedDayStatus.timePeriod === 'AM'
                        ? 'Buổi sáng (8h-12h)'
                        : 'Buổi chiều (13h-17h)'
                  }}
                </div>

                <div v-if="selectedDayStatus.reason" class="small text-secondary mb-3">
                  <span class="fw-medium">Ghi chú:</span> {{ selectedDayStatus.reason }}
                </div>

                <div class="small text-secondary mb-3">
                  <span class="fw-medium">Trạng thái:</span>
                  <span
                    :class="{
                      'text-success': selectedDayStatus.status === 'APPROVED',
                      'text-danger': selectedDayStatus.status === 'REJECTED',
                      'text-warning': selectedDayStatus.status === 'PENDING',
                    }"
                  >
                    {{ statusLabels[selectedDayStatus.status] }}
                  </span>
                </div>

                <div
                  v-if="selectedDayStatus.isCurrentUser && selectedDayStatus.status === 'PENDING'"
                  class="d-flex gap-2 mt-3"
                >
                  <button @click="editSelectedDay" class="btn btn-outline-secondary btn-sm">
                    Chỉnh sửa
                  </button>
                  <button @click="deleteSelectedDay" class="btn btn-outline-danger btn-sm">
                    Xóa
                  </button>
                </div>
              </div>
              <div v-else class="mb-3">
                <p class="text-secondary">Làm việc tại văn phòng (8h-17h)</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showDayModal = false">
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Register Modal -->
    <div v-if="showRegisterModal" class="modal-wrapper">
      <div class="modal show d-block" tabindex="-1" @click.self="showRegisterModal = false">
        <div class="modal-dialog modal-dialog-centered" @click.stop>
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editMode ? 'Chỉnh sửa' : 'Đăng ký' }} WFH/Nghỉ phép</h5>
              <button type="button" class="btn-close" @click="showRegisterModal = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Loại <span class="text-danger">*</span></label>
                <div class="d-flex gap-4">
                  <div class="form-check">
                    <input
                      type="radio"
                      id="wfhType"
                      v-model="newEntry.type"
                      value="WFH"
                      class="form-check-input"
                    />
                    <label for="wfhType" class="form-check-label">Làm việc tại nhà</label>
                  </div>
                  <div class="form-check">
                    <input
                      type="radio"
                      id="leaveType"
                      v-model="newEntry.type"
                      value="LEAVE"
                      class="form-check-input"
                    />
                    <label for="leaveType" class="form-check-label">Nghỉ phép</label>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label for="entryDate" class="form-label"
                  >Ngày<span class="text-danger">*</span></label
                >
                <input type="date" id="entryDate" v-model="newEntry.date" class="form-control" />
              </div>

              <div class="mb-3">
                <label for="entryPeriod" class="form-label"
                  >Thời gian<span class="text-danger">*</span></label
                >
                <select id="entryPeriod" v-model="newEntry.timePeriod" class="form-select">
                  <option value="FULL">Cả ngày (8h-17h)</option>
                  <option value="AM">Buổi sáng (8h-12h)</option>
                  <option value="PM">Buổi chiều (13h-17h)</option>
                </select>
              </div>

              <div class="mb-3">
                <label for="entryNotes" class="form-label">Ghi chú (không bắt buộc)</label>
                <textarea
                  id="entryNotes"
                  v-model="newEntry.reason"
                  class="form-control"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showRegisterModal = false">
                Hủy
              </button>
              <button type="button" class="btn btn-success" @click="registerEntry">
                {{ editMode ? 'Cập nhật' : 'Gửi' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Global Modal Backdrop (shared between modals) -->
    <div v-if="showDayModal || showRegisterModal" class="modal-backdrop show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axiosInstance from '@/router/Interceptor'

// Base API URL
const API_BASE_URL = '/api/v1/works'

// Current date information
const currentDate = new Date()
const currentMonth = ref(currentDate.getMonth())
const currentYear = ref(currentDate.getFullYear())

// Loading and error state
const loading = ref(false)
const errorMessage = ref('')

// User information - in a real app, this would come from auth context
const user = ref({
  id: 1,
  name: 'Nguyễn Văn A',
})

// Status labels for UI display
const statusLabels = {
  PENDING: 'Chờ phê duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
}

// Work entries from API
const calendarEntries = ref([])
const wfhCount = ref(0)
const leaveCount = ref(0)
const workDays = ref(0) // In a real app, this might be calculated based on working days in month

// Modal states
const showDayModal = ref(false)
const showRegisterModal = ref(false)
const selectedDay = ref(null)
const selectedDayStatus = ref(null)
const editMode = ref(false)

// New entry form
const newEntry = ref({
  userId: user.value.id,
  date: '',
  type: 'WFH',
  timePeriod: 'FULL',
  reason: '',
})

// Days of the week
const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// Computed properties for calendar
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
  let day = new Date(currentYear.value, currentMonth.value, 1).getDay()
  // Convert to Monday-based (0 = Monday, 6 = Sunday)
  return day === 0 ? 6 : day - 1
})

const currentMonthName = computed(() => {
  // Translate month names to Vietnamese
  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ]
  return monthNames[currentMonth.value]
})

const currentYearMonth = computed(() => {
  // Format as YYYY-MM for API calls
  const month = (currentMonth.value + 1).toString().padStart(2, '0')
  return `${currentYear.value}-${month}`
})

// Watch for month/year changes to reload data
watch([currentMonth, currentYear], () => {
  loadMonthData()
})

// Load data on component mount
onMounted(() => {
  loadMonthData()
})

// API methods
async function loadMonthData() {
  try {
    loading.value = true
    errorMessage.value = ''

    // Load work entries for the current month and user
    const response = await axiosInstance.get(
      `works/user/${user.value.id}/month/${currentYearMonth.value}`,
    )

    // Transform API data to match our component's format
    calendarEntries.value = response.data.map((entry) => ({
      ...entry,
      date: new Date(entry.date),
    }))

    // Get WFH count for the current month
    const wfhResponse = await axiosInstance.get(
      `works/user/${user.value.id}/wfh-count/${currentYearMonth.value}/type/WFH`,
    )
    wfhCount.value = wfhResponse.data

    // Get LEAVE count for the current month
    const leaveResponse = await axios.get(
      `works/user/${user.value.id}/wfh-count/${currentYearMonth.value}/type/LEAVE`,
    )
    leaveCount.value = leaveResponse.data

    // Calculate working days (simplified - in a real app this might be more complex)
    // This is a simple estimation based on weekdays in the month
    workDays.value = getWorkingDaysInMonth(currentYear.value, currentMonth.value)
  } catch (error) {
    console.error('Error loading calendar data:', error)
    errorMessage.value = 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
  } finally {
    loading.value = false
  }
}

// Helper function to get working days in month (Mon-Fri)
function getWorkingDaysInMonth(year, month) {
  let count = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    // Count Monday (1) through Friday (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++
    }
  }

  return count
}

// Methods
function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function getDayStatus(day) {
  const entry = calendarEntries.value.find((entry) => {
    return (
      entry.date.getDate() === day &&
      entry.date.getMonth() === currentMonth.value &&
      entry.date.getFullYear() === currentYear.value
    )
  })

  return entry
}

function openDayDetails(day, event) {
  // Prevent click event propagation
  if (event) {
    event.stopPropagation()
  }

  // Ensure register modal is closed if open
  showRegisterModal.value = false

  selectedDay.value = day
  selectedDayStatus.value = getDayStatus(day)

  // Add isCurrentUser flag if the entry belongs to the current user
  if (selectedDayStatus.value) {
    selectedDayStatus.value.isCurrentUser = selectedDayStatus.value.userId === user.value.id
  }

  showDayModal.value = true
}

function formatDateForAPI(date) {
  // Format date as YYYY-MM-DD for API
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function registerEntry() {
  try {
    loading.value = true

    // Prepare data for API
    const apiData = {
      userId: user.value.id,
      date: newEntry.value.date, // Should be in YYYY-MM-DD format from input
      type: newEntry.value.type,
      timePeriod: newEntry.value.timePeriod,
      reason: newEntry.value.reason,
    }

    if (editMode.value && selectedDayStatus.value?.id) {
      // Update existing entry
      await axiosInstance.put(`/works/${selectedDayStatus.value.id}`, apiData)
    } else {
      // Create new entry
      await axiosInstance.post(`/works`, apiData)
    }

    // Reload data after successful operation
    await loadMonthData()

    // Reset form and close modal
    resetForm()
    showRegisterModal.value = false
  } catch (error) {
    console.error('Error saving work status:', error)
    errorMessage.value = 'Không thể lưu dữ liệu. Vui lòng thử lại sau.'
  } finally {
    loading.value = false
  }
}

function editSelectedDay() {
  if (!selectedDayStatus.value) return

  // Set up form for editing
  newEntry.value = {
    userId: user.value.id,
    date: formatDateForAPI(selectedDayStatus.value.date),
    type: selectedDayStatus.value.type,
    timePeriod: selectedDayStatus.value.timePeriod,
    reason: selectedDayStatus.value.reason || '',
  }

  editMode.value = true
  showDayModal.value = false
  showRegisterModal.value = true
}

async function deleteSelectedDay() {
  if (!selectedDayStatus.value?.id) return

  if (!confirm('Bạn có chắc chắn muốn xóa đăng ký này không?')) {
    return
  }

  try {
    loading.value = true
    await axiosInstance.delete(`works/${selectedDayStatus.value.id}`)

    // Reload data and close modal
    await loadMonthData()
    showDayModal.value = false
  } catch (error) {
    console.error('Error deleting work status:', error)
    errorMessage.value = 'Không thể xóa dữ liệu. Vui lòng thử lại sau.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  newEntry.value = {
    userId: user.value.id,
    date: '',
    type: 'WFH',
    timePeriod: 'FULL',
    reason: '',
  }
  editMode.value = false
}
</script>

<style scoped>
.calendar-day.empty {
  min-height: 0 !important;
  border: none !important;
  background-color: transparent !important;
}
.calendar-container {
  margin-top: 10px;
}
/* Fix for the Bootstrap grid in calendar */
.calendar-grid .row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-grid .col {
  max-width: 100%;
  flex: 0 0 auto;
}

/* Modal styling fixes */
.modal-wrapper {
  position: relative;
  z-index: 1055;
}

.modal-backdrop {
  z-index: 1050;
}

.modal {
  z-index: 1055;
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 60px !important;
  }
}
</style>
