<template>
  <div class="calendar-container bg-white rounded shadow p-4 mx-auto" style="max-width: 100%">
    <!-- Tab Navigation -->
    <div class="tabs-container mb-4">
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'personal' }"
            @click.prevent="activeTab = 'personal'"
            href="#"
          >
            Lịch cá nhân
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'team' }"
            @click.prevent="activeTab = 'team'"
            href="#"
          >
            Thành viên
          </a>
        </li>
      </ul>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Tab 1: Personal Calendar (Original Calendar) -->
      <div v-show="activeTab === 'personal'" class="tab-pane active" style="display: block">
        <!-- Current Calendar Header -->
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
              <span class="fw-medium">{{ user.fullName }}</span> |
              <span class="text-primary"> WFH trong tháng: {{ wfhCount }}</span> |
              <span class="text-danger"> Số ngày nghỉ: {{ leaveCount }}</span> |
              <span class="text-secondary"> Số ngày công: {{ workDays }}</span>
            </div>

            <button @click="showRegisterModal = true" class="btn btn-success">
              Đăng ký WFH/Nghỉ phép
            </button>
          </div>
        </div>

        <!-- Calendar Grid (Original) -->
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
            <div
              v-for="_ in firstDayOfMonth"
              :key="'empty-' + _"
              class="col calendar-day empty"
            ></div>

            <!-- Actual days of the month -->
            <div
              v-for="day in daysInMonth"
              :key="day"
              @click="openDayDetails(day)"
              class="col position-relative rounded p-2 calendar-day border"
              :class="{
                'bg-light': !isDayToday(day),
                'bg-primary bg-opacity-10': isDayToday(day),
                'today-indicator': isDayToday(day),
              }"
            >
              <!-- Day number - positioned at top -->
              <div class="day-number small fw-medium position-absolute" style="top: 5px; left: 5px">
                {{ day }}
              </div>

              <!-- Late Check-in Badge - Keep at top right -->
              <div
                v-if="getLateCheckIn(day)"
                class="position-absolute"
                style="top: 5px; right: 5px"
              >
                <span class="badge rounded-pill bg-warning" title="Đi muộn">
                  <i class="bi bi-clock"></i>
                </span>
              </div>

              <!-- Main content area - centered vertically -->
              <div
                class="flex-grow-1 d-flex flex-column justify-content-center"
                style="margin-top: 20px"
              >
                <!-- Status information -->
                <div v-if="getDayStatus(day)">
                  <div class="d-flex align-items-center">
                    <div
                      :class="{
                        'bg-primary': getDayStatus(day)?.type === 'WFH',
                        'bg-danger': getDayStatus(day)?.type === 'LEAVE',
                      }"
                      class="rounded-circle me-2"
                      style="width: 8px; height: 8px"
                    ></div>
                    <span
                      :class="{
                        'text-primary': getDayStatus(day)?.type === 'WFH',
                        'text-danger': getDayStatus(day)?.type === 'LEAVE',
                      }"
                      class="small fw-medium"
                    >
                      {{ getDayStatus(day)?.type === 'WFH' ? 'WFH' : 'Nghỉ phép' }}
                    </span>
                  </div>
                  <div class="small text-secondary mt-1">
                    {{
                      getDayStatus(day)?.timePeriod === 'FULL'
                        ? 'Cả ngày'
                        : `${getDayStatus(day)?.startTime?.substring(0, 5)} - ${getDayStatus(day)?.endTime?.substring(0, 5)}`
                    }}
                  </div>
                </div>

                <!-- Normal office work with potential late check-in -->
                <div v-else>
                  <!-- Only show "X" for today and past days, not for future days -->
                  <div v-if="!isDayFuture(day)" class="d-flex align-items-center">
                    <div
                      class="rounded-circle bg-secondary me-2"
                      style="width: 8px; height: 8px"
                    ></div>
                    <span class="small fw-medium text-secondary">X</span>
                  </div>

                  <!-- Show normal office hours only for today and past days -->
                  <div v-if="!isDayFuture(day)" class="small text-secondary mt-1">8h-17h</div>

                  <!-- Late check-in information -->
                  <div v-if="getLateCheckIn(day)" class="small text-warning mt-1">
                    Đi muộn: {{ getLateCheckIn(day)?.checkinAt }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Team Members -->
      <div v-show="activeTab === 'team'" class="tab-pane" style="display: block">
        <div class="team-tabs mb-3">
          <ul class="nav nav-pills">
            <li class="nav-item">
              <a
                class="nav-link"
                :class="{ active: activeTeamTab === 'day' }"
                @click.prevent="activeTeamTab = 'day'"
                href="#"
              >
                Theo ngày
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                :class="{ active: activeTeamTab === 'month' }"
                @click.prevent="activeTeamTab = 'month'"
                href="#"
              >
                Theo tháng
              </a>
            </li>
          </ul>
        </div>

        <!-- Team Daily View -->
        <div v-show="activeTeamTab === 'day'" class="team-daily-view">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div></div>
            <div class="date-picker-container">
              <!-- PrimeVue Calendar cho chọn ngày -->
              <Calendar
                v-model="selectedDate"
                :showIcon="true"
                dateFormat="dd/mm/yy"
                :placeholder="formatSelectedDate"
              />
            </div>
          </div>

          <!-- Show message when no real data -->
          <div v-if="!hasTeamDailyData" class="alert alert-info text-center py-4">
            Không có thành viên nghỉ phép hoặc WFH trong ngày này
          </div>

          <!-- Only show table when there is data -->
          <div v-else class="team-members-list">
            <DataTable
              :value="teamDailyData"
              :paginator="true"
              :rows="10"
              :rowsPerPageOptions="[5, 10, 20, 50]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
              :loading="loadingTeamData"
              stripedRows
              class="p-datatable-sm"
            >
              <Column field="fullName" header="Tên thành viên"></Column>
              <Column field="type" header="Loại">
                <template #body="{ data }">
                  <span
                    :class="{
                      'text-primary': data.type === 'WFH',
                      'text-danger': data.type === 'LEAVE',
                    }"
                  >
                    {{ data.type === 'WFH' ? 'Làm việc tại nhà' : 'Nghỉ phép' }}
                  </span>
                </template>
              </Column>
              <Column field="timePeriod" header="Thời gian">
                <template #body="{ data }">
                  <span v-if="data.startTime && data.endTime">
                    {{ data.startTime.substring(0, 5) }} - {{ data.endTime.substring(0, 5) }}
                  </span>
                  <span v-else>
                    {{
                      data.timePeriod === 'FULL'
                        ? 'Cả ngày (8h-17h)'
                        : data.timePeriod === 'AM'
                          ? 'Buổi sáng (8h-12h)'
                          : 'Buổi chiều (13h-17h)'
                    }}
                  </span>
                </template>
              </Column>
              <Column field="reason" header="Lý do"></Column>
            </DataTable>
          </div>
        </div>

        <!-- Team Monthly View -->
        <div v-show="activeTeamTab === 'month'" class="team-monthly-view">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div></div>
            <div class="month-picker-container d-flex align-items-center">
              <span class="me-2">Tháng:</span>
              <Dropdown
                v-model="selectedMonth"
                :options="monthOptions"
                optionLabel="name"
                optionValue="value"
                placeholder="Chọn tháng"
                class="me-2"
              />
              <span class="me-2">Năm:</span>
              <Dropdown v-model="selectedYear" :options="yearOptions" placeholder="Chọn năm" />
            </div>
          </div>

          <!-- Show message when no real data -->
          <div v-if="!hasTeamMonthlyData" class="alert alert-info text-center py-4">
            Không có dữ liệu tổng hợp cho tháng này
          </div>

          <!-- Only show table when there is data -->
          <div v-else class="team-members-summary">
            <DataTable
              :value="teamMonthlyData"
              :paginator="true"
              :rows="10"
              :rowsPerPageOptions="[5, 10, 20, 50]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
              :loading="loadingTeamData"
              stripedRows
              class="p-datatable-sm"
            >
              <Column field="memberName" header="Tên thành viên"></Column>
              <Column field="wfhDays" header="Số ngày WFH"></Column>
              <Column field="leaveDays" header="Số ngày nghỉ"></Column>
              <Column field="standardWorkDays" header="Ngày công Chuẩn">
                <template #body="{}">
                  {{ selectedMonthStandardWorkDays }}
                </template>
              </Column>
              <Column field="totalDays" header="Tổng ngày công">
                <template #body="{ data }">
                  {{ selectedMonthStandardWorkDays - data.leaveDays }}
                </template>
              </Column>
            </DataTable>
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
                  {{ formatTimePeriod(selectedDayStatus) }}
                </div>

                <div v-if="selectedDayStatus.reason" class="small text-secondary mb-3">
                  <span class="fw-medium">Ghi chú:</span> {{ selectedDayStatus.reason }}
                </div>

                <div class="d-flex gap-2 mt-3">
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

                <!-- Add this section for late check-in information -->
                <div
                  v-if="selectedDay && getLateCheckIn(selectedDay)"
                  class="mt-3 p-2 bg-light rounded"
                >
                  <div class="d-flex align-items-center text-warning mb-2">
                    <i class="bi bi-clock me-2"></i>
                    <span class="fw-medium">Đi muộn</span>
                  </div>
                  <div class="small text-secondary">
                    <span class="fw-medium">Giờ check-in:</span>
                    {{ getLateCheckIn(selectedDay)?.checkinAt }}
                  </div>
                  <div v-if="getLateCheckIn(selectedDay)?.note" class="small text-secondary mt-1">
                    <span class="fw-medium">Ghi chú:</span> {{ getLateCheckIn(selectedDay)?.note }}
                  </div>
                </div>
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

              <div class="mb-3" v-if="editMode">
                <label for="date" class="form-label">Ngày <span class="text-danger">*</span></label>
                <input type="date" id="date" v-model="newEntry.date" class="form-control" />
              </div>

              <div v-else>
                <div class="mb-3">
                  <label for="fromDate" class="form-label"
                    >Từ ngày <span class="text-danger">*</span></label
                  >
                  <input
                    type="date"
                    id="fromDate"
                    v-model="newEntry.fromDate"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.fromDate }"
                  />
                  <div v-if="formErrors.fromDate" class="invalid-feedback">
                    {{ formErrors.fromDate }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="startTime" class="form-label"
                    >Giờ bắt đầu <span class="text-danger">*</span></label
                  >
                  <input
                    type="time"
                    id="startTime"
                    v-model="newEntry.startTime"
                    class="form-control time-24h"
                    :class="{ 'is-invalid': formErrors.startTime }"
                  />
                  <div v-if="formErrors.startTime" class="invalid-feedback">
                    {{ formErrors.startTime }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="toDate" class="form-label"
                    >Đến ngày <span class="text-danger">*</span></label
                  >
                  <input
                    type="date"
                    id="toDate"
                    v-model="newEntry.toDate"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.toDate }"
                  />
                  <div v-if="formErrors.toDate" class="invalid-feedback">
                    {{ formErrors.toDate }}
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label for="endTime" class="form-label"
                  >Giờ kết thúc <span class="text-danger">*</span></label
                >
                <input
                  type="time"
                  id="endTime"
                  v-model="newEntry.endTime"
                  class="form-control time-24h"
                  :class="{ 'is-invalid': formErrors.endTime }"
                />
                <div v-if="formErrors.endTime" class="invalid-feedback">
                  {{ formErrors.endTime }}
                </div>
              </div>

              <!-- Form section with reporter and leave type selection -->
              <div class="mb-3" v-if="newEntry.type === 'LEAVE'">
                <label class="form-label">Loại nghỉ phép <span class="text-danger">*</span></label>
                <select
                  v-model="newEntry.attendanceTypeObjId"
                  class="form-select"
                  :class="{ 'is-invalid': formErrors.attendanceType }"
                >
                  <option value="" disabled>Chọn loại nghỉ phép</option>
                  <option
                    v-for="type in leaveRequestStore.leaveTypes"
                    :key="type._id"
                    :value="type._id"
                  >
                    {{ type.attendanceTypeName }}
                  </option>
                </select>
                <div v-if="formErrors.attendanceType" class="invalid-feedback">
                  {{ formErrors.attendanceType }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Người duyệt <span class="text-danger">*</span></label>
                <select
                  v-model="newEntry.reportObjId"
                  class="form-select"
                  :class="{ 'is-invalid': formErrors.reporter }"
                >
                  <option value="" disabled>Chọn người duyệt</option>
                  <option
                    v-for="reporter in leaveRequestStore.reporters"
                    :key="reporter._id"
                    :value="reporter._id"
                  >
                    {{ reporter.name }}
                  </option>
                </select>
                <div v-if="formErrors.reporter" class="invalid-feedback">
                  {{ formErrors.reporter }}
                </div>
              </div>

              <div class="mb-3">
                <label for="entryNotes" class="form-label"
                  >Ghi chú <span class="text-danger">*</span></label
                >
                <textarea
                  id="entryNotes"
                  v-model="newEntry.reason"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.reason }"
                  rows="3"
                ></textarea>
                <div v-if="formErrors.reason" class="invalid-feedback">
                  {{ formErrors.reason }}
                </div>
              </div>

              <!-- Show general validation error if exists -->
              <div v-if="formErrors.general" class="alert alert-danger">
                {{ formErrors.general }}
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
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axiosInstance from '@/router/Interceptor'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import { useUserStore } from '@/pinia/userStore'
import { useLeaveRequestStore } from '@/pinia/useAPICreate'
import Cookies from 'js-cookie'

// Type definitions
interface WorkEntry {
  id: number
  userId: number
  fullName: string
  fromDate?: string // For form
  toDate?: string // For form
  date?: string // From API response
  startTime: string
  endTime: string
  type: 'WFH' | 'LEAVE'
  timePeriod: 'FULL' | 'AM' | 'PM'
  reason: string
  approvedById?: number | null
  approvedByName?: string | null
  createdAt: string
  isCurrentUser?: boolean
  attendanceTypeObjId?: string // Add this for leave type
  reportObjId?: string // Add this for reporter
}

interface TeamMemberDaily {
  fullName: string
  type: 'WFH' | 'LEAVE'
  timePeriod: 'FULL' | 'AM' | 'PM'
  startTime?: string
  endTime?: string
  reason?: string
}

interface TeamMemberMonthly {
  memberName: string
  wfhDays: number
  leaveDays: number
  totalDays: number
}

// Add new interface after other interface definitions
interface LateCheckIn {
  id: number
  user: {
    id: number
    fullName: string
    email: string
    role: string
    phoneNumber: string
    position: string
    team: string
    dob: string
    joinDate: string
  }
  date: string
  checkinAt: string
  note: string
}

// Add these after the interface definitions in the script section
interface MonthOption {
  name: string
  value: number
}

// Component state
const activeTab = ref<'personal' | 'team'>('personal')
const activeTeamTab = ref<'day' | 'month'>('day')

const currentDate = new Date()
const currentMonth = ref<number>(currentDate.getMonth())
const currentYear = ref<number>(currentDate.getFullYear())
const selectedDate = ref<Date>(new Date())
const selectedMonth = ref<number>(currentMonth.value + 1)
const selectedYear = ref<number>(currentYear.value)

// Loading and error states
const loading = ref<boolean>(false)
const loadingTeamData = ref<boolean>(false)
const errorMessage = ref<string>('')
const formErrors = ref<{
  fromDate?: string
  toDate?: string
  startTime?: string
  endTime?: string
  reason?: string
  general?: string
  attendanceType?: string
  reporter?: string
}>({})

// User information
const userStore = useUserStore()
const user = computed(() => userStore.user)

// Work entries and counts
const calendarEntries = ref<WorkEntry[]>([])
const wfhCount = ref<number>(0)
const leaveCount = ref<number>(0)
const workDays = ref<number>(0)

// Team data
const teamDailyData = ref<TeamMemberDaily[]>([])
const teamMonthlyData = ref<TeamMemberMonthly[]>([])

// Modal states
const showDayModal = ref<boolean>(false)
const showRegisterModal = ref<boolean>(false)
const selectedDay = ref<number | null>(null)
const selectedDayStatus = ref<WorkEntry | null>(null)
const editMode = ref<boolean>(false)

// New entry form
const today = new Date().toISOString().split('T')[0]
const newEntry = ref<Omit<WorkEntry, 'id' | 'createdAt' | 'isCurrentUser'>>({
  userId: user.value.id,
  fullName: user.value.name,
  fromDate: today,
  toDate: today,
  startTime: '08:00',
  endTime: '17:00',
  type: 'WFH',
  timePeriod: 'FULL',
  reason: '',
  attendanceTypeObjId: '',
  reportObjId: '',
})

// Days of the week
const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// Computed properties
const daysInMonth = computed((): number => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed((): number => {
  const day = new Date(currentYear.value, currentMonth.value, 1).getDay()
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

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''

  const day = selectedDate.value.getDate().toString().padStart(2, '0')
  const month = (selectedDate.value.getMonth() + 1).toString().padStart(2, '0')
  const year = selectedDate.value.getFullYear()

  return `${day}/${month}/${year}`
})

// Add new reactive property after other state properties
const lateCheckIns = ref<LateCheckIn[]>([])

// Watch for tab changes to load necessary data
watch(activeTab, (newTab) => {
  if (newTab === 'personal') {
    loadMonthData()
  } else if (newTab === 'team') {
    if (activeTeamTab.value === 'day') {
      loadTeamDailyData()
    } else {
      loadTeamMonthlyData()
    }
  }
})

// Watch for team tab changes
watch(activeTeamTab, (newTab) => {
  if (newTab === 'day') {
    loadTeamDailyData()
  } else {
    loadTeamMonthlyData()
  }
})

// Watch for month/year changes to reload personal calendar data
watch([currentMonth, currentYear], () => {
  loadMonthData()
})

// Watch for selected date changes in team daily view
watch(selectedDate, () => {
  if (activeTab.value === 'team' && activeTeamTab.value === 'day') {
    loadTeamDailyData()
  }
})

// Watch for selected month/year changes in team monthly view
watch([selectedMonth, selectedYear], () => {
  if (activeTab.value === 'team' && activeTeamTab.value === 'month') {
    loadTeamMonthlyData()
  }
})

// Load data on component mount
onMounted(() => {
  loadMonthData()

  // Load leave types and reporters for the form
  leaveRequestStore.fetchLeaveTypes()
  leaveRequestStore.fetchReporters()
})

// API methods with type safety
async function loadMonthData(): Promise<void> {
  try {
    loading.value = true
    errorMessage.value = ''

    // Use the new API endpoint that returns entries by day
    const response = await axiosInstance.get<WorkEntry[]>(`works/user/${user.value.id}/details`, {
      params: {
        year: currentYear.value,
        month: currentMonth.value + 1,
      },
    })

    // Set calendar entries directly from the response (no filtering needed as API filters by month)
    calendarEntries.value = response.data.map((entry) => ({
      ...entry,
      isCurrentUser: entry.userId === user.value.id,
    }))

    // Get WFH count for the current month using the new endpoint
    const wfhResponse = await axiosInstance.get(`works/user/${user.value.id}/count`, {
      params: {
        year: currentYear.value,
        month: currentMonth.value + 1,
        type: 'WFH',
      },
    })
    wfhCount.value = wfhResponse.data

    // Get LEAVE count for the current month using the new endpoint
    const leaveResponse = await axiosInstance.get(`works/user/${user.value.id}/count`, {
      params: {
        year: currentYear.value,
        month: currentMonth.value + 1,
        type: 'LEAVE',
      },
    })
    leaveCount.value = leaveResponse.data

    // Calculate working days
    workDays.value = getWorkingDaysInMonth(currentYear.value, currentMonth.value)

    // Load late check-ins
    await loadLateCheckIns()
  } catch (error) {
    console.error('Error loading calendar data:', error)
    errorMessage.value = 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
  } finally {
    loading.value = false
  }
}

async function loadTeamDailyData() {
  try {
    loadingTeamData.value = true

    // Format date for API call
    const formattedDate = formatDateForAPI(selectedDate.value)

    // Call API to get team data for selected date
    const response = await axiosInstance.get<TeamMemberDaily[]>(`/works/${formattedDate}`)

    // Transform API data if needed
    teamDailyData.value = response.data

    // We no longer add placeholder data here - the view handles empty state
    if (teamDailyData.value.length === 0) {
      // Keep the array empty to trigger the empty state display
    }
  } catch (error) {
    console.error('Error loading team daily data:', error)
    errorMessage.value = 'Không thể tải dữ liệu thành viên. Vui lòng thử lại sau.'

    // Set to empty to show the error message
    teamDailyData.value = []
  } finally {
    loadingTeamData.value = false
  }
}

async function loadTeamMonthlyData() {
  try {
    loadingTeamData.value = true

    // Construct query params
    const params = {
      year: selectedYear.value,
      month: selectedMonth.value,
    }

    // Call API to get monthly summary
    const response = await axiosInstance.get<TeamMemberMonthly[]>('/works/work-summary', {
      params,
    })

    // Transform API data
    teamMonthlyData.value = response.data

    // We no longer add placeholder data here - the view handles empty state
    if (teamMonthlyData.value.length === 0) {
      // Keep the array empty to trigger the empty state display
    }
  } catch (error) {
    console.error('Error loading team monthly data:', error)
    errorMessage.value = 'Không thể tải dữ liệu tổng hợp thành viên. Vui lòng thử lại sau.'

    // Set to empty to show the error message
    teamMonthlyData.value = []
  } finally {
    loadingTeamData.value = false
  }
}

// Helper function to get working days in month (Mon-Fri)
function getWorkingDaysInMonth(year: number, month: number): number {
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

// Date formatting helpers with type safety
function formatDateForAPI(date: Date): string {
  // Format date as YYYY-MM-DD for API
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Calendar navigation methods
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

// Update getDayStatus function to work with the date field
function getDayStatus(day: number): WorkEntry | undefined {
  const currentDate = new Date(currentYear.value, currentMonth.value, day)
  const currentDateStr = formatDateForAPI(currentDate)

  return calendarEntries.value.find((entry) => entry.date === currentDateStr)
}

// Update formatTimePeriod function to always show start and end times
function formatTimePeriod(entry: WorkEntry | undefined): string {
  if (!entry) return ''

  const startTime = entry.startTime?.substring(0, 5) || ''
  const endTime = entry.endTime?.substring(0, 5) || ''

  return `${startTime} - ${endTime}`
}

// Add a validateForm function before registerEntry
function validateForm(): boolean {
  // Reset errors
  formErrors.value = {}

  // Get current date at midnight for comparison (without time)
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  const todayStr = formatDateWithoutTimezone(currentDate)

  // Validate required fields
  if (!newEntry.value.startTime) {
    formErrors.value.startTime = 'Vui lòng chọn giờ bắt đầu'
  }

  if (!newEntry.value.endTime) {
    formErrors.value.endTime = 'Vui lòng chọn giờ kết thúc'
  }

  // Validate that end time is after start time
  if (newEntry.value.startTime && newEntry.value.endTime) {
    if (newEntry.value.endTime <= newEntry.value.startTime) {
      formErrors.value.endTime = 'Giờ kết thúc phải sau giờ bắt đầu'
    }
  }

  // Validate reason is required
  if (!newEntry.value.reason || newEntry.value.reason.trim() === '') {
    formErrors.value.reason = 'Vui lòng nhập lý do'
  }

  // Validate reporter selection
  if (!newEntry.value.reportObjId) {
    formErrors.value.reporter = 'Vui lòng chọn người duyệt'
  }

  // Validate leave type selection for LEAVE requests
  if (newEntry.value.type === 'LEAVE' && !newEntry.value.attendanceTypeObjId) {
    formErrors.value.attendanceType = 'Vui lòng chọn loại nghỉ phép'
  }

  // Additional validation for create mode (not edit mode)
  if (!editMode.value) {
    if (!newEntry.value.fromDate) {
      formErrors.value.fromDate = 'Vui lòng chọn ngày bắt đầu'
    } else if (newEntry.value.fromDate < todayStr) {
      formErrors.value.fromDate = 'Ngày bắt đầu không thể là ngày trong quá khứ'
    }

    if (!newEntry.value.toDate) {
      formErrors.value.toDate = 'Vui lòng chọn ngày kết thúc'
    } else if (newEntry.value.toDate < todayStr) {
      formErrors.value.toDate = 'Ngày kết thúc không thể là ngày trong quá khứ'
    }

    // Validate fromDate must not equal toDate
    if (newEntry.value.fromDate && newEntry.value.toDate) {
      if (newEntry.value.fromDate > newEntry.value.toDate) {
        formErrors.value.fromDate = 'Ngày bắt đầu không được sau ngày kết thúc'
      }
    }
  } else {
    // In edit mode, validate date field
    if (!newEntry.value.date) {
      formErrors.value.general = 'Ngày không hợp lệ'
    } else if (newEntry.value.date < todayStr) {
      formErrors.value.general = 'Không thể chỉnh sửa ngày trong quá khứ'
    }
  }

  // Return true if no errors
  return Object.keys(formErrors.value).length === 0
}

// Helper function to format date without timezone issues
function formatDateWithoutTimezone(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Add this helper function to parse user data from cookies
function getUserFromCookies(): {
  userObjId?: string
  name?: string
  staffCode?: number
  positionName?: string
  departmentName?: string
} {
  const userDataStr = Cookies.get('user')
  if (!userDataStr) {
    return {}
  }
  try {
    return JSON.parse(userDataStr)
  } catch (error) {
    console.error('Error parsing user data from cookies:', error)
    return {}
  }
}

// Update the registerEntry function
async function registerEntry() {
  // Validate form before submission
  if (!validateForm()) {
    return
  }

  try {
    loading.value = true

    if (editMode.value && selectedDayStatus.value?.id) {
      // For update - use the date field
      const updateData = {
        userId: user.value.id,
        date: newEntry.value.date || newEntry.value.fromDate, // Use date if available, fall back to fromDate
        startTime: newEntry.value.startTime,
        endTime: newEntry.value.endTime,
        type: newEntry.value.type,
        timePeriod: newEntry.value.timePeriod,
        reason: newEntry.value.reason,
      }
      console.log('Update data:', updateData)

      await axiosInstance.put(`/works/${selectedDayStatus.value.id}`, updateData)
    } else {
      if (newEntry.value.type === 'LEAVE') {
        // Make sure attendanceTypeObjId is selected for leave requests
        if (!newEntry.value.attendanceTypeObjId) {
          formErrors.value.attendanceType = 'Vui lòng chọn loại nghỉ phép'
          loading.value = false
          return
        }

        const result = await leaveRequestStore.createLeaveRequestNew({
          attendanceTypeObjId: newEntry.value.attendanceTypeObjId,
          reportObjId: newEntry.value.reportObjId || '',
          fromDate: newEntry.value.fromDate || '',
          fromTime: newEntry.value.startTime,
          endDate: newEntry.value.toDate || '',
          endTime: newEntry.value.endTime,
          reason: newEntry.value.reason,
        })

        if (!result.success) {
          throw new Error(result.error)
        }
      } else {
        // Get user data from cookies
        const cookieUser = getUserFromCookies()

        // Validate required fields from cookies
        if (
          !cookieUser.name ||
          !cookieUser.staffCode ||
          !cookieUser.positionName ||
          !cookieUser.departmentName ||
          !cookieUser.userObjId ||
          !newEntry.value.reportObjId ||
          !newEntry.value.fromDate
        ) {
          throw new Error('Thiếu thông tin bắt buộc cho đơn WFH')
        }

        // For WFH requests - using data from cookies
        const wfhPayload = {
          applicant_person: cookieUser.name,
          staff_code: Number(cookieUser.staffCode),
          positon: cookieUser.positionName,
          department: cookieUser.departmentName,
          reportObjId: newEntry.value.reportObjId,
          createAt: formatDateForDisplay(new Date()),
          fromDate: newEntry.value.fromDate,
          endDate: newEntry.value.fromDate, // Same as fromDate for WFH
          reason: newEntry.value.reason || '',
          userObjId: cookieUser.userObjId,
        }

        const result = await leaveRequestStore.createWfhRequestNew(wfhPayload)

        if (!result.success) {
          throw new Error(result.error)
        }
      }
    }

    await loadMonthData()
    resetForm()
    showRegisterModal.value = false
  } catch (error: unknown) {
    console.error('Error saving work status:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Không thể lưu dữ liệu. Vui lòng thử lại sau.'
    formErrors.value.general = errorMessage
  } finally {
    loading.value = false
  }
}

// Add this helper function to format date as DD/MM/YYYY
function formatDateForDisplay(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function editSelectedDay() {
  if (!selectedDayStatus.value) return

  newEntry.value = {
    userId: user.value.id,
    fullName: user.value.name,
    // Use the date field from the selected entry for updates
    date: selectedDayStatus.value.date,
    // Keep these for the form display, but they won't be used in the update API call
    fromDate: selectedDayStatus.value.date,
    toDate: selectedDayStatus.value.date,
    startTime: selectedDayStatus.value.startTime || '08:00',
    endTime: selectedDayStatus.value.endTime || '17:00',
    type: selectedDayStatus.value.type,
    timePeriod: selectedDayStatus.value.timePeriod || 'FULL',
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
    fullName: user.value.name,
    fromDate: today,
    toDate: today,
    startTime: '08:00',
    endTime: '17:00',
    type: 'WFH',
    timePeriod: 'FULL',
    reason: '',
    attendanceTypeObjId: '',
    reportObjId: '',
  }
  editMode.value = false
  formErrors.value = {}
}

function openDayDetails(day: number): void {
  selectedDay.value = day
  const status = getDayStatus(day)
  selectedDayStatus.value = status || null
  showDayModal.value = true
}

// Add load function for late check-ins
async function loadLateCheckIns(): Promise<void> {
  try {
    loading.value = true
    errorMessage.value = ''

    // Get first and last day of the month for API params
    const firstDay = new Date(currentYear.value, currentMonth.value, 1)
    const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)

    const fromDate = formatDateForAPI(firstDay)
    const toDate = formatDateForAPI(lastDay)

    // Call the late check-in API
    const response = await axiosInstance.get<LateCheckIn[]>(
      `/late/users/${user.value.id}?fromDate=${fromDate}&toDate=${toDate}`,
    )

    lateCheckIns.value = response.data
  } catch (error) {
    console.error('Error loadin late check-in data:', error)
  } finally {
    loading.value = false
  }
}

// Add helper function to check if a day has a late check-in
function getLateCheckIn(day: number): LateCheckIn | undefined {
  const currentDate = new Date(currentYear.value, currentMonth.value, day)
  const currentDateStr = formatDateForAPI(currentDate)

  return lateCheckIns.value.find((entry) => {
    return entry.date === currentDateStr
  })
}

// Add a helper function to check if a day is today, past, or future
function isDayToday(day: number): boolean {
  const now = new Date()
  return (
    day === now.getDate() &&
    currentMonth.value === now.getMonth() &&
    currentYear.value === now.getFullYear()
  )
}

function isDayFuture(day: number): boolean {
  const today = new Date()
  const checkDate = new Date(currentYear.value, currentMonth.value, day)
  return checkDate > new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

// Add computed properties for checking if there is real data
const hasTeamDailyData = computed(() => {
  return (
    teamDailyData.value.length > 0 &&
    !teamDailyData.value[0].fullName.includes('Không có thành viên') &&
    !teamDailyData.value[0].fullName.includes('Lỗi tải dữ liệu')
  )
})

const hasTeamMonthlyData = computed(() => {
  return (
    teamMonthlyData.value.length > 0 &&
    !teamMonthlyData.value[0].memberName.includes('Không có dữ liệu') &&
    !teamMonthlyData.value[0].memberName.includes('Lỗi tải dữ liệu')
  )
})

// Month options
const monthOptions: MonthOption[] = [
  { name: 'Tháng 1', value: 1 },
  { name: 'Tháng 2', value: 2 },
  { name: 'Tháng 3', value: 3 },
  { name: 'Tháng 4', value: 4 },
  { name: 'Tháng 5', value: 5 },
  { name: 'Tháng 6', value: 6 },
  { name: 'Tháng 7', value: 7 },
  { name: 'Tháng 8', value: 8 },
  { name: 'Tháng 9', value: 9 },
  { name: 'Tháng 10', value: 10 },
  { name: 'Tháng 11', value: 11 },
  { name: 'Tháng 12', value: 12 },
]

// Year options
const yearOptions = ref<number[]>([currentYear.value - 1, currentYear.value, currentYear.value + 1])

// Add a computed property for the standard work days in the selected month and year
const selectedMonthStandardWorkDays = computed(() => {
  return getWorkingDaysInMonth(selectedYear.value, selectedMonth.value - 1)
})

const leaveRequestStore = useLeaveRequestStore()
</script>

<style scoped>
/* Additional style updates */
.calendar-day {
  min-height: 120px !important;
  height: 120px; /* Fixed height */
  overflow-y: auto; /* Allow scrolling for excess content */
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative; /* Ensure positioning context for absolute elements */
  padding-top: 25px; /* Extra padding at top for day number */
}

.calendar-day.empty {
  min-height: 0 !important;
  height: auto !important; /* Override for empty cells before the 1st of the month */
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

/* Tab styling */
.nav-tabs .nav-link {
  cursor: pointer;
}

.nav-pills .nav-link {
  cursor: pointer;
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

/* Team view styling */
.team-daily-view,
.team-monthly-view {
  min-height: 400px;
}

/* PrimeVue adjustments */
:deep(.p-dropdown) {
  min-width: 150px;
}

:deep(.p-calendar) {
  width: 100%;
}

:deep(.p-datatable) {
  font-size: 0.9rem;
}

/* Update media query to adjust height on mobile */
@media (max-width: 768px) {
  .calendar-day {
    min-height: 80px !important;
    height: 80px;
  }

  .tabs-container {
    overflow-x: auto;
    white-space: nowrap;
  }

  .team-tabs {
    overflow-x: auto;
    white-space: nowrap;
  }

  .date-picker-container,
  .month-picker-container {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 10px;
  }

  .month-picker-container > * {
    margin-bottom: 5px;
  }
}

/* Add CSS for today's date indicator */
.today-indicator {
  position: relative;
  border-color: var(--bs-primary) !important;
  border-width: 2px !important;
}

.today-indicator::after {
  content: '';
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--bs-primary);
  z-index: 1;
}
</style>
