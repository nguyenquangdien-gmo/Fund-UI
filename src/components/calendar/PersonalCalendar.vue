<template>
  <!-- Wrap everything in a main div -->
  <div>
    <!-- PrimeVue Toast Component -->
    <Toast position="top-right" />

    <!-- Login Form with improved styling -->
    <div v-if="!isLoggedIn" class="login-container d-flex justify-content-center align-items-center mt-5">
      <Card class="login-card">
        <template #header>
          <div class="text-center p-3">
            <i class="pi pi-user" style="font-size: 3rem; color: var(--primary-color)"></i>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="handleLogin" class="p-fluid">
            <div class="field mb-4">
              <label for="username" class="font-medium mb-2">Tên đăng nhập Admin Create</label>
              <div class="p-input-icon-left w-full">
                <InputText id="username" v-model="loginUsername" required placeholder="Nhập tên đăng nhập Admin Create"
                  style="width: 100%;" />
              </div>
            </div>
            <div class="field mb-4">
              <label for="password" class="font-medium mb-2">Mật khẩu</label>
              <span class="p-input-icon-left w-full">
                <Password id="password" v-model="loginPassword" :feedback="false" toggleMask placeholder="Nhập mật khẩu"
                  inputClass="w-full" required />
              </span>
            </div>
            <Message v-if="loginError" severity="error" :closable="false" class="mb-3 w-full">
              {{ loginError }}
            </Message>
            <div style="display: flex;justify-content: space-between;">
              <Button type="submit" label="Đăng nhập Admin Create" icon="pi pi-sign-in" iconPos="right"
                :loading="loginLoading" class="w-full mt-3" style="margin-right: 5px;" />
              <Button label="Bỏ qua" severity="secondary" iconPos="right" @click="skipLogin" class="w-full mt-3"
                style="" />
            </div>
          </form>
        </template>
      </Card>
    </div>

    <!-- Calendar Content (shown if logged in) -->
    <div v-else class="calendar-container bg-white rounded shadow p-4 mx-auto" style="max-width: 100%">

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Tab 1: Personal Calendar (Original Calendar) -->

        <!-- Current Calendar Header -->
        <div class="calendar-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
          <div class="d-flex align-items-center mb-3 mb-md-0">
            <button @click="previousMonth" class="btn btn-light rounded-circle p-1">
              <i class="bi bi-chevron-left"></i>
            </button>
            <h2 class="mx-3 mb-0">{{ currentMonthName }} {{ currentYear }}</h2>
            <button @click="nextMonth" class="btn btn-light rounded-circle p-1">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>

          <div class="d-flex flex-column flex-md-row align-items-center gap-2">
            <div class="user-info small text-secondary">
              <span class="fw-medium">{{ user.fullName }}</span> |
              <span class="text-primary"> WFH trong tháng: {{ wfhCount }}</span> |
              <span class="text-danger"> Số ngày nghỉ: {{ leaveCount }}</span>
            </div>

            <button @click="showRegisterForm()" class="btn btn-success">
              Đăng ký WFH/Nghỉ phép
            </button>
            <button @click="syncData" class="btn btn-primary ms-2">
              Đồng bộ
            </button>
          </div>
        </div>

        <!-- Calendar Grid (Original) -->
        <div class="calendar-grid" style="gap: 5px">
          <!-- Days of Week Headers -->
          <div class="row mb-2">
            <div v-for="day in daysOfWeek" :key="day" class="col text-center py-2 fw-medium text-secondary small">
              {{ day }}
            </div>
          </div>

          <!-- Calendar Days -->
          <div class="row gap-2">
            <!-- Empty cells for days before start of month -->
            <div v-for="_ in firstDayOfMonth" :key="'empty-' + _" class="col calendar-day empty"></div>

            <!-- Actual days of the month -->
            <div v-for="day in daysInMonth" :key="day" @click="openDayDetails(day)"
              class="col position-relative rounded p-3 calendar-day border" :class="{
                'bg-light': !isDayToday(day),
                'bg-primary bg-opacity-10': isDayToday(day),
                'today-indicator': isDayToday(day),
              }">
              <!-- Day number - positioned at top with larger size -->
              <div class="day-number fw-bold position-absolute">
                {{ day }}
              </div>

              <!-- Late Check-in Badge - Keep at top right -->
              <div v-if="getLateCheckIn(day)" class="position-absolute" style="top: 10px; right: 10px">
                <span class="badge rounded-pill bg-warning" title="Đi muộn">
                  <i class="bi bi-clock"></i>
                </span>
              </div>

              <!-- Main content area - better vertical spacing -->
              <div class="flex-grow-1 d-flex flex-column justify-content-center" style="margin-top: 30px">
                <!-- Status information with improved styling -->
                <div v-if="getDayStatus(day)" class="day-status-container">
                  <div class="d-flex align-items-center">
                    <div :class="{
                      'bg-primary': getDayStatus(day)?.type === 'WFH',
                      'bg-danger': getDayStatus(day)?.type === 'LEAVE',
                    }" class="rounded-circle me-2" style="width: 10px; height: 10px"></div>
                    <span :class="{
                      'text-primary': getDayStatus(day)?.type === 'WFH',
                      'text-danger': getDayStatus(day)?.type === 'LEAVE',
                    }" class="fw-medium">
                      {{ getDayStatus(day)?.type === 'WFH' ? 'WFH' : 'Nghỉ phép' }}
                      <span v-if="getDayStatus(day)?.type === 'WFH'" class="time-period">
                        ({{ getDayStatus(day)?.timePeriod }})
                      </span>
                      <span v-if="getDayStatus(day)?.type === 'LEAVE'" class="time-period">
                        ({{ getDayStatus(day)?.timePeriod }})
                      </span>
                    </span>
                  </div>
                  <!-- <div class="text-secondary mt-2">
                    {{
                      getDayStatus(day)?.timePeriod === 'FULL'
                        ? 'Cả ngày'
                        : `${getDayStatus(day)?.startTime?.substring(0, 5)} - ${getDayStatus(day)?.endTime?.substring(0,
                          5)}`
                    }}
                  </div> -->

                </div>

                <!-- Normal office work with potential late check-in -->
                <div v-else>
                  <!-- Only show "X" for today and past days, not for future days -->
                  <div v-if="!isDayFuture(day)" class="d-flex align-items-center">
                    <div class="rounded-circle bg-secondary me-2" style="width: 10px; height: 10px"></div>
                    <span class="fw-medium text-secondary">Full</span>
                  </div>

                  <!-- Show normal office hours only for today and past days -->
                  <!-- <div v-if="!isDayFuture(day)" class="text-secondary mt-2">8h-17h</div> -->

                  <!-- Late check-in information -->
                  <div v-if="getLateCheckIn(day)" class="late-checkin text-warning mt-2">
                    <i class="bi bi-clock-fill"></i>
                    {{ getLateCheckIn(day)?.checkinAt }}
                  </div>
                </div>
              </div>
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
                    <div :class="{
                      'bg-primary': selectedDayStatus.type === 'WFH',
                      'bg-danger': selectedDayStatus.type === 'LEAVE',
                    }" class="rounded-circle me-2" style="width: 10px; height: 10px"></div>
                    <span class="fw-medium">
                      {{ selectedDayStatus.type === 'WFH' ? 'Làm việc tại nhà' : 'Nghỉ phép' }}
                    </span>
                  </div>

                  <!-- Add date range information -->
                  <div v-if="isMultiDayEntry(selectedDayStatus)" class="small text-secondary mb-2">
                    <span class="fw-medium">Từ ngày: {{ formatDateDisplay(selectedDayStatus.fromDate) }} - Đến ngày: {{
                      formatDateDisplay(selectedDayStatus.endDate) }}</span>
                  </div>

                  <div class="small text-secondary mb-2">
                    <span class="fw-medium">Thời gian:</span>
                    {{ formatTimePeriod(selectedDayStatus) }}
                  </div>

                  <div v-if="selectedDayStatus.reason" class="small text-secondary mb-3">
                    <span class="fw-medium">Ghi chú:</span> {{ selectedDayStatus.reason }}
                  </div>

                  <div class="d-flex gap-2 mt-3">
                    <!-- Edit button removed as per your previous edits -->
                  </div>

                </div>
                <div v-else class="mb-3">
                  <p class="text-secondary">Làm việc tại văn phòng (8h-17h)</p>

                  <!-- Add this section for late check-in information -->
                  <div v-if="selectedDay && getLateCheckIn(selectedDay)" class="mt-3 p-2 bg-light rounded">
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
                <button v-if="selectedDayStatus" class="btn btn-danger" @click="deleteSelectedDay">
                  Xóa
                </button>
                <button type="button" class="btn btn-secondary" @click="showDayModal = false">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Register Modal with improved styling -->
      <Dialog v-model:visible="showRegisterModal" :modal="true" :closable="true" :style="{ width: '500px' }"
        :header="editMode ? 'Chỉnh sửa' : 'Đăng ký WFH/Nghỉ phép'">
        <div class="p-fluid custom-dialog-content">
          <!-- Type selection with better spacing and visuals -->
          <div class="field mb-4">
            <label class="font-medium mb-2">Loại <span class="text-danger">*</span></label>
            <div class="type-selection p-3 border-1 surface-border border-round">
              <div class="field-radiobutton type-option radio-left" :class="{ 'selected': newEntry.type === 'WFH' }">
                <RadioButton class="ml-3" v-model="newEntry.type" inputId="wfhType" value="WFH" />
                <label for="wfhType" class="left-10">
                  Làm việc tại nhà
                </label>
              </div>
              <div class="field-radiobutton type-option" :class="{ 'selected': newEntry.type === 'LEAVE' }">
                <RadioButton v-model="newEntry.type" inputId="leaveType" value="LEAVE" />
                <label for="leaveType" class="left-10">
                  Nghỉ phép
                </label>
              </div>
            </div>
          </div>

          <div class="field mb-4" v-if="editMode">
            <label for="date" class="font-medium mb-2">Ngày <span class="text-danger">*</span></label>
            <Calendar id="date" v-model="editDateValue" dateFormat="dd-mm-yy"
              @update:modelValue="newEntry.date = formatCalendarDate($event)" showIcon placeholder="Chọn ngày" />
          </div>

          <div v-else class="p-grid form-grid">
            <div class="field p-col-12 p-md-6 mb-4">
              <label for="fromDate" class="font-medium mb-2">Từ ngày <span class="text-danger">*</span></label>
              <Calendar id="fromDate" v-model="fromDateValue" dateFormat="dd-mm-yy"
                @update:modelValue="newEntry.fromDate = formatCalendarDate($event)"
                :class="{ 'p-invalid': formErrors.fromDate }" showIcon placeholder="Chọn ngày bắt đầu" />
              <small v-if="formErrors.fromDate" class="text-danger">{{ formErrors.fromDate }}</small>
            </div>

            <div class="field p-col-12 p-md-6 mb-4">
              <label for="endDate" class="font-medium mb-2">Đến ngày <span class="text-danger">*</span></label>
              <Calendar id="endDate" v-model="endDateValue" dateFormat="dd-mm-yy"
                @update:modelValue="newEntry.endDate = formatCalendarDate($event)"
                :class="{ 'p-invalid': formErrors.endDate }" showIcon placeholder="Chọn ngày kết thúc" />
              <small v-if="formErrors.endDate" class="text-danger">{{ formErrors.endDate }}</small>
            </div>

            <div class="field p-col-12 p-md-6 mb-4" v-if="newEntry.type !== 'WFH'">
              <label for="startTime" class="font-medium mb-2">Giờ bắt đầu <span class="text-danger">*</span></label>
              <Calendar id="startTime" v-model="startTimeValue" timeOnly hourFormat="24"
                @update:modelValue="newEntry.startTime = formatTimeValue($event)"
                :class="{ 'p-invalid': formErrors.startTime }" showIcon placeholder="Chọn giờ bắt đầu" />
              <small v-if="formErrors.startTime" class="text-danger">{{ formErrors.startTime }}</small>
            </div>

            <div class="field p-col-12 p-md-6 mb-4" v-if="newEntry.type !== 'WFH'">
              <label for="endTime" class="font-medium mb-2">Giờ kết thúc <span class="text-danger">*</span></label>
              <Calendar id="endTime" v-model="endTimeValue" timeOnly hourFormat="24"
                @update:modelValue="newEntry.endTime = formatTimeValue($event)"
                :class="{ 'p-invalid': formErrors.endTime }" showIcon placeholder="Chọn giờ kết thúc" />
              <small v-if="formErrors.endTime" class="text-danger">{{ formErrors.endTime }}</small>
            </div>


            <!-- Thêm trường chọn buổi sáng/chiều cho WFH -->
            <div class="field p-col-12 mb-4" v-if="newEntry.type === 'WFH'">
              <label class="font-medium mb-2">Buổi làm việc <span class="text-danger">*</span></label>
              <Dropdown v-model="newEntry.timePeriod" :options="timePeriodOptions" optionLabel="name" optionValue="code"
                placeholder="Chọn buổi làm việc" class="box-container fixed-width-dropdown" />
            </div>

            <div class="field mb-4" v-if="newEntry.type === 'LEAVE'">
              <label class="font-medium mb-2">Loại nghỉ phép <span class="text-danger">*</span></label>
              <div>
                <Dropdown v-model="newEntry.attendanceTypeObjId" :options="leaveRequestStore.leaveTypes"
                  optionLabel="attendanceTypeName" optionValue="_id" placeholder="Chọn loại nghỉ phép"
                  class="fixed-width-dropdown" :class="{ 'p-invalid': formErrors.attendanceType }" />
              </div>
              <small v-if="formErrors.attendanceType" class="text-danger">{{ formErrors.attendanceType }}</small>
            </div>

            <div class="field mb-4">
              <label class="font-medium mb-2">Người duyệt <span class="text-danger">*</span></label>
              <div>
                <Dropdown v-model="newEntry.reportObjId" :options="leaveRequestStore.reporters" optionLabel="name"
                  optionValue="_id" placeholder="Chọn người duyệt" class="box-container fixed-width-dropdown"
                  :class="{ 'p-invalid': formErrors.reporter }" />
              </div>
              <small v-if="formErrors.reporter" class="text-danger">{{ formErrors.reporter }}</small>
            </div>

            <div class="field mb-4">
              <label for="entryNotes" class="font-medium mb-2">Ghi chú <span class="text-danger">*</span></label>
              <div class="box-container"><Textarea id="entryNotes" v-model="newEntry.reason" rows="3"
                  placeholder="Nhập lý do xin nghỉ/WFH" :class="{ 'p-invalid': formErrors.reason }"
                  class="box-container" autoResize /></div>
              <small v-if="formErrors.reason" class="text-danger">{{ formErrors.reason }}</small>
            </div>

            <Message v-if="formErrors.general" severity="error" :closable="false" class="mb-3">
              {{ formErrors.general }}
            </Message>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-content-end gap-2">
            <Button label="Gửi" icon="pi pi-check" @click="registerEntry" :loading="loading"
              style="margin-right: 5px;" />
            <Button label="Hủy" icon="pi pi-times" @click="showRegisterModal = false" class="p-button-outlined"
              severity="secondary" />
          </div>
        </template>
      </Dialog>

      <!-- Global Modal Backdrop (shared between modals) -->
      <div v-if="showDayModal || showRegisterModal || showDeleteConfirmModal" class="modal-backdrop show"></div>

      <!-- First, add a new modal confirmation dialog in the template section, after the other modals -->
      <!-- Delete Confirmation Modal -->
      <Dialog v-model:visible="showDeleteConfirmModal" :modal="true" :closable="false" :style="{ width: '400px' }"
        header="Xác nhận xóa">
        <div class="p-fluid custom-dialog-content">
          <Message severity="warn" :closable="false" class="mb-3">
            Bạn có chắc chắn muốn xóa đăng ký này không?
          </Message>
        </div>
        <template #footer>
          <div class="flex justify-content-end gap-2">
            <Button label="Xóa" icon="pi pi-trash" class="p-button-danger" @click="confirmDelete"
              style="margin-right: 5px;" :loading="deleteLoading" />
            <Button label="Hủy" icon="pi pi-times" @click="cancelDelete" class="p-button-outlined" />
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch, onActivated } from 'vue'
import axiosInstance from '@/router/Interceptor'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import { useUserStore } from '@/pinia/userStore'
import { useLeaveRequestStore } from '@/pinia/useAPICreate'
import { useWorkStore } from '@/pinia/workStore'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Cookies from 'js-cookie'
import Card from 'primevue/card'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'

// Add missing type definitions
interface WorkResponseDTO {
  id: number
  userId: number
  fullName: string
  fromDate: string
  endDate: string
  startTime: string
  endTime: string
  type: 'WFH' | 'LEAVE'
  timePeriod: 'FULL' | 'AM' | 'PM'
  reason: string
  approvedById?: number | null
  approvedByName?: string | null
  createdAt: string
  idCreate: string
}

// Update WorkEntry interface to include all required properties
interface WorkEntry {
  id: number
  userId: number
  fullName: string
  fromDate: string
  endDate: string
  date?: string
  startTime: string
  endTime: string
  type: 'WFH' | 'LEAVE'
  timePeriod: 'FULL' | 'AM' | 'PM'
  reason: string
  approvedById?: number | null
  approvedByName?: string | null
  createdAt: string
  isCurrentUser?: boolean
  idCreate?: string
  attendanceTypeObjId?: string
  reportObjId?: string
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

// Component state
// --- Login State ---
const isLoggedIn = ref<boolean>(true) // Changed to true by default to hide login form
const hasSkippedLogin = ref<boolean>(false) // New state to track if user has skipped login
const loginUsername = ref<string>('')
const loginPassword = ref<string>('')
const loginError = ref<string | null>(null)
const loginLoading = ref<boolean>(false)
// --- End Login State ---

// --- Toast Service ---
const toast = useToast();
// --- End Toast Service ---

const currentDate = new Date()
const currentMonth = ref<number>(currentDate.getMonth())
const currentYear = ref<number>(currentDate.getFullYear())
const selectedMonth = ref<number>(currentMonth.value + 1)
const selectedYear = ref<number>(currentYear.value)

// Loading and error states
const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const formErrors = ref<{
  fromDate?: string
  endDate?: string
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

// Add a watcher to reset username when login form is shown
watch(() => isLoggedIn.value, (newValue) => {
  if (!newValue && user.value?.email) {
    loginUsername.value = user.value.email;
  }
});

// Work entries and counts
const calendarEntries = ref<WorkEntry[]>([])
const wfhCount = ref<number>(0)
const leaveCount = ref<number>(0)
const workDays = ref<number>(0)

// Modal states
const showDayModal = ref<boolean>(false)
const showRegisterModal = ref<boolean>(false)
const selectedDay = ref<number | null>(null)
const selectedDayStatus = ref<WorkEntry | null>(null)
const editMode = ref<boolean>(false)

// Update the today initialization
const currentDateObj = new Date();
const today = formatDateWithoutTimezone(currentDateObj);

// New entry form
const newEntry = ref<Omit<WorkEntry, 'id' | 'createdAt' | 'isCurrentUser'>>({
  userId: user.value.id,
  fullName: user.value.name,
  fromDate: today,
  endDate: today,
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

// Add new reactive property after other state properties
const lateCheckIns = ref<LateCheckIn[]>([])


// Watch for month/year changes to reload personal calendar data
watch([currentMonth, currentYear], () => {
  loadMonthData()
})


// Watch for selected month/year changes in team monthly view
watch([selectedMonth, selectedYear], () => {
  // Only load team data if needed
})

// Watch for type changes to set default times for WFH
watch(() => newEntry.value.type, (newType) => {
  if (newType === 'WFH') {
    // Mặc định cho WFH là cả ngày
    newEntry.value.timePeriod = 'FULL';
    newEntry.value.startTime = '08:00';
    newEntry.value.endTime = '17:00';

    // Update time picker values
    const date = new Date();

    // Set 8:00 for start time
    date.setHours(8, 0, 0);
    startTimeValue.value = new Date(date);

    // Set 17:00 for end time
    date.setHours(17, 0, 0);
    endTimeValue.value = new Date(date);
  }
})

// Thêm watch cho timePeriod để cập nhật startTime và endTime
watch(() => newEntry.value.timePeriod, (newPeriod) => {
  if (newEntry.value.type !== 'WFH') return;

  const date = new Date();

  if (newPeriod === 'AM') {
    newEntry.value.startTime = '08:00';
    newEntry.value.endTime = '12:00';

    date.setHours(8, 0, 0);
    startTimeValue.value = new Date(date);

    date.setHours(12, 0, 0);
    endTimeValue.value = new Date(date);
  } else if (newPeriod === 'PM') {
    newEntry.value.startTime = '13:00';
    newEntry.value.endTime = '17:00';

    date.setHours(13, 0, 0);
    startTimeValue.value = new Date(date);

    date.setHours(17, 0, 0);
    endTimeValue.value = new Date(date);
  } else if (newPeriod === 'FULL') {
    newEntry.value.startTime = '08:00';
    newEntry.value.endTime = '17:00';

    date.setHours(8, 0, 0);
    startTimeValue.value = new Date(date);

    date.setHours(17, 0, 0);
    endTimeValue.value = new Date(date);
  }
})

// Load data on component mount
onMounted(async () => {
  // Check if the user has skipped login before using localStorage
  const skippedLogin = localStorage.getItem('calendar_skipped_login')

  // Set initial login state based on stored preference or admin authentication
  if (skippedLogin === 'true') {
    isLoggedIn.value = true
    hasSkippedLogin.value = true
  } else if (leaveRequestStore.isAuthenticated) {
    isLoggedIn.value = true
    try {
      // If already logged in, load leave types and reporters
      await Promise.all([
        leaveRequestStore.fetchLeaveTypes(),
        leaveRequestStore.fetchReporters()
      ]);
    } catch (error) {
      console.error('Error loading additional data:', error);
    }
  } else {
    // Default to showing login form if not skipped before and not authenticated
    isLoggedIn.value = false
  }

  // Set default login username from user email if available
  if (user.value?.email) {
    loginUsername.value = user.value.email;
  }

  // Load data when component is mounted
  if (isLoggedIn.value) {
    loadMonthData();
  }
})

// Add a watcher to reload data when component becomes visible
onActivated(() => {
  if (isLoggedIn.value) {
    loadMonthData();
  }
});

// API methods with type safety
async function loadMonthData(showLoader: boolean = true): Promise<void> {
  try {
    if (showLoader) loading.value = true;
    errorMessage.value = '';

    const [response, wfhResponse, leaveResponse] = await Promise.all([
      // Main work entries
      axiosInstance.get<WorkResponseDTO[]>(`/works/user/${user.value.id}/details`, {
        params: {
          year: currentYear.value,
          month: currentMonth.value + 1,
        },
      }),

      // WFH count
      axiosInstance.get(`/works/user/${user.value.id}/count`, {
        params: {
          year: currentYear.value,
          month: currentMonth.value + 1,
          type: 'WFH',
        },
      }),

      // LEAVE count
      axiosInstance.get(`/works/user/${user.value.id}/count`, {
        params: {
          year: currentYear.value,
          month: currentMonth.value + 1,
          type: 'LEAVE',
        },
      })
    ]);

    // Process work entries
    const expandedEntries: WorkEntry[] = [];

    response.data.forEach(entry => {
      // Ensure fromDate and endDate are properly formatted
      const fromDate = new Date(entry.fromDate);
      const endDate = new Date(entry.endDate);

      // Create a new entry for each day in the range
      const currentDate = new Date(fromDate);
      while (currentDate <= endDate) {
        expandedEntries.push({
          ...entry,
          isCurrentUser: entry.userId === user.value.id,
          // Use current date in the range for the date field
          date: formatDateWithoutTimezone(currentDate),
          // Ensure idCreate is preserved for deletion
          idCreate: entry.idCreate
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Set the expanded entries
    calendarEntries.value = expandedEntries;

    // Set WFH and LEAVE counts
    wfhCount.value = wfhResponse.data;
    leaveCount.value = leaveResponse.data;

    // Calculate working days
    workDays.value = getWorkingDaysInMonth(currentYear.value, currentMonth.value);

    // Load late check-ins without showing loader again
    await loadLateCheckIns(false);
  } catch (error) {
    console.error('Error loading calendar data:', error);
    errorMessage.value = 'Không thể tải dữ liệu. Vui lòng thử lại sau.';
  } finally {
    if (showLoader) {
      loading.value = false;
    }
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
  // Format date as YYYY-MM-DD for API using local date components to avoid timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
  const currentDate = new Date(currentYear.value, currentMonth.value, day);
  const currentDateStr = formatDateWithoutTimezone(currentDate);

  return calendarEntries.value.find((entry) => entry.date === currentDateStr);
}

// Update formatTimePeriod function to always show start and end times
function formatTimePeriod(entry: WorkEntry | undefined): string {
  if (!entry) return ''

  const startTime = entry.startTime?.substring(0, 5) || ''
  const endTime = entry.endTime?.substring(0, 5) || ''

  return `${startTime} - ${endTime}`
}

// Update the validateForm function
function validateForm(): boolean {
  formErrors.value = {};

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const todayStr = formatDateWithoutTimezone(currentDate);

  // Kiểm tra thời gian cho leave requests
  if (newEntry.value.type !== 'WFH') {
    if (!newEntry.value.startTime) formErrors.value.startTime = 'Vui lòng chọn giờ bắt đầu';
    if (!newEntry.value.endTime) formErrors.value.endTime = 'Vui lòng chọn giờ kết thúc';

    if (newEntry.value.startTime && newEntry.value.endTime &&
      newEntry.value.endTime <= newEntry.value.startTime) {
      formErrors.value.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
    }
  } else {
    // Mặc định cho WFH
    newEntry.value.startTime = '08:00';
    newEntry.value.endTime = '17:00';
  }

  // Kiểm tra lý do
  if (!newEntry.value.reason?.trim()) formErrors.value.reason = 'Vui lòng nhập lý do';

  // Kiểm tra người duyệt
  if (!newEntry.value.reportObjId) formErrors.value.reporter = 'Vui lòng chọn người duyệt';

  // Kiểm tra loại nghỉ phép
  if (newEntry.value.type === 'LEAVE' && !newEntry.value.attendanceTypeObjId) {
    formErrors.value.attendanceType = 'Vui lòng chọn loại nghỉ phép';
  }

  // Kiểm tra ngày cho create mode
  if (!editMode.value) {
    if (!newEntry.value.fromDate) {
      formErrors.value.fromDate = 'Vui lòng chọn ngày bắt đầu';
    } else {
      // Kiểm tra xem ngày bắt đầu có thuộc tháng hiện tại không
      const fromDateObj = new Date(newEntry.value.fromDate);
      const currentDateObj = new Date();
      if (fromDateObj.getMonth() !== currentDateObj.getMonth() ||
        fromDateObj.getFullYear() !== currentDateObj.getFullYear()) {
        // Chỉ báo lỗi nếu không thuộc tháng hiện tại
        if (fromDateObj < currentDateObj) {
          formErrors.value.fromDate = 'Không thể tạo đơn cho tháng trước';
        }
      }
    }

    if (!newEntry.value.endDate) {
      formErrors.value.endDate = 'Vui lòng chọn ngày kết thúc';
    } else {
      // Kiểm tra xem ngày kết thúc có thuộc tháng hiện tại không
      const endDateObj = new Date(newEntry.value.endDate);
      const currentDateObj = new Date();
      if (endDateObj.getMonth() !== currentDateObj.getMonth() ||
        endDateObj.getFullYear() !== currentDateObj.getFullYear()) {
        // Chỉ báo lỗi nếu không thuộc tháng hiện tại
        if (endDateObj < currentDateObj) {
          formErrors.value.endDate = 'Không thể tạo đơn cho tháng trước';
        }
      }
    }

    if (newEntry.value.fromDate && newEntry.value.endDate &&
      newEntry.value.fromDate > newEntry.value.endDate) {
      formErrors.value.fromDate = 'Ngày bắt đầu không được sau ngày kết thúc';
    }
  } else if (!newEntry.value.date) {
    formErrors.value.general = 'Ngày không hợp lệ';
  } else if (newEntry.value.date < todayStr) {
    formErrors.value.general = 'Không thể chỉnh sửa ngày trong quá khứ';
  }

  return Object.keys(formErrors.value).length === 0;
}

// Helper function to format date without timezone issues
function formatDateWithoutTimezone(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Add this helper function to parse user data from cookies
function getUserFromCookies() {
  try {
    // First try to get user info from the store
    const userInfo = leaveRequestStore.getUserInfo;
    if (userInfo && userInfo.userObjId) {
      return {
        userObjId: userInfo.userObjId,
        name: userInfo.name,
        staffCode: userInfo.staffCode,
        userPositionCode: userInfo.userPositionCode,
        departmentCode: userInfo.departmentCode,
      };
    }

    // Fallback to cookie if store doesn't have the info
    const userDataStr = Cookies.get('user');
    return userDataStr ? JSON.parse(userDataStr) : {};
  } catch (e) {
    console.error('Error getting user data:', e);
    return {};
  }
}

// Get stores
const leaveRequestStore = useLeaveRequestStore()
const workStore = useWorkStore()

// Update the registerEntry function
async function registerEntry() {
  if (!validateForm()) return;

  formErrors.value.general = undefined;
  loading.value = true;

  try {
    // Chuyển đổi ngày để đảm bảo so sánh chính xác
    const fromDateObj = new Date(newEntry.value.fromDate);
    const endDateObj = new Date(newEntry.value.endDate);
    fromDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(0, 0, 0, 0);

    // Kiểm tra xem có ngày nào trong khoảng thời gian mới đã tồn tại trong calendar không
    const overlappingDates = [];

    // Tạo mảng các ngày trong khoảng thời gian đăng ký mới
    const newEntryDates = [];
    const currentDate = new Date(fromDateObj);
    while (currentDate <= endDateObj) {
      newEntryDates.push(formatDateWithoutTimezone(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Kiểm tra từng ngày có trùng với bất kỳ mục nào trong calendar không
    for (const dateStr of newEntryDates) {
      const conflictingEntry = calendarEntries.value.find(entry => entry.date === dateStr);
      if (conflictingEntry) {
        overlappingDates.push({
          date: dateStr,
          type: conflictingEntry.type
        });
      }
    }

    if (overlappingDates.length > 0) {
      // Hiển thị thông báo lỗi với chi tiết ngày trùng lặp
      let errorDetail = 'Các ngày sau đã được đăng ký: ';
      errorDetail += overlappingDates.map(item =>
        `${formatDateDisplay(item.date)} (${item.type === 'WFH' ? 'Làm việc tại nhà' : 'Nghỉ phép'})`
      ).join(', ');

      toast.add({
        severity: 'error',
        summary: 'Không thể đăng ký',
        detail: errorDetail,
        life: 5000
      });
      loading.value = false;
      return;
    }

    let creationSuccess = false;
    let requestData;

    // Xử lý tạo đơn dựa vào loại (LEAVE hoặc WFH)
    if (newEntry.value.type === 'LEAVE') {
      if (!newEntry.value.attendanceTypeObjId) {
        formErrors.value.attendanceType = 'Vui lòng chọn loại nghỉ phép';
        loading.value = false;
        return;
      }

      const leavePayload = {
        attendanceTypeObjId: newEntry.value.attendanceTypeObjId,
        reportObjId: newEntry.value.reportObjId || '',
        fromDate: newEntry.value.fromDate || '',
        fromTime: newEntry.value.startTime,
        endDate: newEntry.value.endDate || '',
        endTime: newEntry.value.endTime,
        reason: newEntry.value.reason,
      };

      // console.log('leavePayload', leavePayload);

      const result = await leaveRequestStore.createLeaveRequestNew(leavePayload);

      if (result && result.success) {
        requestData = {
          userId: user.value.id,
          type: 'LEAVE',
          fromDate: newEntry.value.fromDate || '',
          endDate: newEntry.value.endDate || '',
          startTime: newEntry.value.startTime,
          endTime: newEntry.value.endTime,
          reason: newEntry.value.reason,
          idCreate: result.data?._id
        };

        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đăng ký nghỉ phép thành công.', life: 3000 });
        creationSuccess = true;
      } else {
        const detailMessage = result && result.error ? result.error : 'Đăng ký nghỉ phép thất bại. Vui lòng thử lại.';
        toast.add({ severity: 'error', summary: 'Thất bại', detail: detailMessage, life: 4000 });
      }
    } else {
      // WFH Request
      const cookieUser = getUserFromCookies();

      if (!cookieUser.name || !cookieUser.staffCode || !cookieUser.userPositionCode ||
        !cookieUser.departmentCode || !cookieUser.userObjId || !newEntry.value.reportObjId ||
        !newEntry.value.fromDate) {
        toast.add({
          severity: 'error',
          summary: 'Lỗi thông tin',
          detail: 'Thiếu thông tin người dùng để tạo đơn WFH.',
          life: 4000
        });
        loading.value = false;
        return;
      }

      const wfhPayload = {
        applicant_person: cookieUser.name,
        staff_code: Number(cookieUser.staffCode),
        positon: cookieUser.userPositionCode,
        department: cookieUser.departmentCode,
        reportObjId: newEntry.value.reportObjId,
        createAt: formatDateDisplay(new Date().toISOString()),
        fromDate: newEntry.value.fromDate,
        endDate: newEntry.value.endDate || newEntry.value.fromDate,
        reason: newEntry.value.reason || '',
        userObjId: cookieUser.userObjId,
      };
      // console.log('wfhPayload', wfhPayload);

      const result = await leaveRequestStore.createWfhRequestNew(wfhPayload);

      if (result && result.success) {
        // Thiết lập startTime và endTime dựa trên timePeriod cho WFH
        let workStartTime = '08:00';
        let workEndTime = '17:00';

        if (newEntry.value.timePeriod === 'AM') {
          workStartTime = '08:00';
          workEndTime = '12:00';
        } else if (newEntry.value.timePeriod === 'PM') {
          workStartTime = '13:00';
          workEndTime = '17:00';
        }

        requestData = {
          userId: user.value.id,
          type: 'WFH',
          fromDate: newEntry.value.fromDate,
          endDate: newEntry.value.endDate || newEntry.value.fromDate,
          startTime: workStartTime,
          endTime: workEndTime,
          reason: newEntry.value.reason || '',
          idCreate: result.data?._id
        };

        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đăng ký WFH thành công.', life: 3000 });
        creationSuccess = true;
      } else {
        const detailMessage = result && result.error ? result.error : 'Đăng ký WFH thất bại. Vui lòng thử lại.';
        toast.add({ severity: 'error', summary: 'Thất bại', detail: detailMessage, life: 4000 });
      }
    }

    if (creationSuccess && requestData) {
      try {
        const workResult = await workStore.createWorkFromRequest(requestData);
        if (!workResult) {
          console.error('Failed to create work entry: Unknown error');
          toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Đăng ký thành công nhưng không thể tạo bản ghi công việc.',
            life: 4000
          });
        }
      } catch (workError) {
        console.error('Error creating work entry:', workError);
      }

      await loadMonthData();
      resetForm();
      showRegisterModal.value = false;
    }
  } catch (error) {
    console.error('Error processing request:', error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau.',
      life: 4000
    });
  } finally {
    loading.value = false;
  }
}

// Thêm hàm openDayDetails để khắc phục lỗi trong template
function openDayDetails(day: number): void {
  selectedDay.value = day;
  const status = getDayStatus(day);
  selectedDayStatus.value = status || null;
  showDayModal.value = true;
}

// Thêm hàm deleteSelectedDay để khắc phục lỗi trong template
function deleteSelectedDay() {
  if (!selectedDayStatus.value?.id) return;

  // Show the confirmation modal instead of using alert
  showDeleteConfirmModal.value = true;
}

// Thêm hàm cancelDelete
function cancelDelete() {
  showDeleteConfirmModal.value = false;
}

// Thêm biến showDeleteConfirmModal
const showDeleteConfirmModal = ref<boolean>(false);
const deleteLoading = ref<boolean>(false);

// Khởi tạo các biến và hàm cần thiết để phù hợp với template
// Biến lưu trữ cho Calendar component
const fromDateValue = ref<Date | null>(new Date(newEntry.value.fromDate));
const endDateValue = ref<Date | null>(new Date(newEntry.value.endDate));
const startTimeValue = ref<Date | null>(null);
const endTimeValue = ref<Date | null>(null);
const editDateValue = ref<Date | null>(null);

// Options cho dropdown thời gian làm việc
const timePeriodOptions = [
  { name: 'Buổi sáng (8h-12h)', code: 'AM' },
  { name: 'Buổi chiều (13h-17h)', code: 'PM' },
  { name: 'Cả ngày (8h-17h)', code: 'FULL' }
];

// Khai báo hàm handleLogin
async function handleLogin() {
  loginLoading.value = true;
  loginError.value = null;

  try {
    // Validate that the entered username matches the user's email
    if (user.value?.email && loginUsername.value !== user.value.email) {
      loginError.value = 'Vui lòng nhập email của bạn';
      loginLoading.value = false;
      return;
    }

    const result = await leaveRequestStore.signIn(loginUsername.value, loginPassword.value);

    if (result.success && result.data) {
      // Mark as logged in and clear skipped state
      isLoggedIn.value = true;
      hasSkippedLogin.value = false;
      localStorage.removeItem('calendar_skipped_login');

      // Keep username but clear the password
      loginPassword.value = '';

      // Load necessary data
      loading.value = true;
      await Promise.all([
        loadMonthData(false),
        leaveRequestStore.fetchLeaveTypes(),
        leaveRequestStore.fetchReporters()
      ]);
      loading.value = false;

      // Show login success notification
      toast.add({
        severity: 'success',
        summary: 'Đăng nhập thành công',
        detail: 'Bạn đã đăng nhập thành công vào Admin Create.',
        life: 3000
      });
    } else {
      loginError.value = result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
    }
  } catch (error: unknown) {
    console.error('Login error:', error);
    loginError.value = error instanceof Error ? error.message : 'Đã xảy ra lỗi trong quá trình đăng nhập.';
  } finally {
    loginLoading.value = false;
  }
}

// Thêm hàm skipLogin sau hàm handleLogin
function skipLogin() {
  isLoggedIn.value = true
  hasSkippedLogin.value = true
  // loginUsername value no longer cleared
  loginPassword.value = ''

  // Save preference to localStorage
  localStorage.setItem('calendar_skipped_login', 'true')

  // Load data
  loading.value = true
  loadMonthData(false).finally(() => {
    loading.value = false

    // Show notification that user is viewing in limited mode
    toast.add({
      severity: 'info',
      summary: 'Chế độ xem giới hạn',
      detail: 'Bạn đang xem lịch làm việc ở chế độ giới hạn. Để đăng ký WFH/Nghỉ phép hoặc đồng bộ dữ liệu, vui lòng đăng nhập.',
      life: 5000
    });
  });
}

// Định nghĩa hàm loadLateCheckIns
async function loadLateCheckIns(showLoader: boolean = true): Promise<void> {
  try {
    if (showLoader) loading.value = true;
    errorMessage.value = '';

    // Get first and last day of the month for API params
    const firstDay = new Date(currentYear.value, currentMonth.value, 1);
    const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);

    const fromDate = formatDateForAPI(firstDay);
    const endDate = formatDateForAPI(lastDay);

    // Call the late check-in API
    const response = await axiosInstance.get<LateCheckIn[]>(
      `/late/users/${user.value.id}?fromDate=${fromDate}&toDate=${endDate}`,
    );

    lateCheckIns.value = response.data;
  } catch (error) {
    console.error('Error loading late check-in data:', error);
  } finally {
    if (showLoader) {
      loading.value = false;
    }
  }
}

// Định nghĩa các hàm helper còn thiếu
function getLateCheckIn(day: number): LateCheckIn | undefined {
  const currentDate = new Date(currentYear.value, currentMonth.value, day);
  const currentDateStr = formatDateForAPI(currentDate);

  return lateCheckIns.value.find(entry => entry.date === currentDateStr);
}

function isDayToday(day: number): boolean {
  const now = new Date();
  return (
    day === now.getDate() &&
    currentMonth.value === now.getMonth() &&
    currentYear.value === now.getFullYear()
  );
}

function isDayFuture(day: number): boolean {
  const today = new Date();
  const checkDate = new Date(currentYear.value, currentMonth.value, day);
  return checkDate > new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

// Thêm hàm formatCalendarDate và formatTimeValue
function formatCalendarDate(date: Date | Date[] | (Date | null)[] | null | undefined): string {
  if (!date) return '';
  const dateObj = Array.isArray(date) ? date[0] : date;
  return dateObj ? formatDateWithoutTimezone(dateObj) : '';
}

function formatTimeValue(date: Date | Date[] | (Date | null)[] | null | undefined): string {
  if (!date) return '';
  const dateObj = Array.isArray(date) ? date[0] : date;
  return dateObj ? dateObj.toTimeString().substring(0, 5) : '';
}

function isMultiDayEntry(entry: WorkEntry | undefined): boolean {
  if (!entry || !entry.fromDate || !entry.endDate) return false;
  return entry.fromDate !== entry.endDate;
}

// Thêm hàm confirmDelete đang bị thiếu
async function confirmDelete() {
  if (!selectedDayStatus.value?.id) return;

  try {
    deleteLoading.value = true;

    // Xóa đơn nguồn (Leave hoặc WFH)
    if (selectedDayStatus.value.type === 'LEAVE' && selectedDayStatus.value.idCreate) {
      await leaveRequestStore.deleteLeaveRequest(selectedDayStatus.value.idCreate);
    } else if (selectedDayStatus.value.type === 'WFH' && selectedDayStatus.value.idCreate) {
      await leaveRequestStore.deleteWfhRequest(selectedDayStatus.value.idCreate);
    }

    // Xóa bản ghi công việc
    await axiosInstance.delete(`/works/${selectedDayStatus.value.id}`);

    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã xóa đăng ký thành công.',
      life: 3000
    });

    await loadMonthData();
    showDayModal.value = false;
    showDeleteConfirmModal.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể xóa đăng ký. Vui lòng thử lại sau.',
      life: 4000
    });
  } finally {
    deleteLoading.value = false;
  }
}

// Thêm hàm formatDateDisplay đang bị thiếu
function formatDateDisplay(dateStr: string | undefined): string {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}-${month}-${date.getFullYear()}`;
  } catch (error) {
    return dateStr; // Return original string if parsing fails
  }
}

// Thêm hàm resetForm đang bị thiếu
function resetForm() {
  newEntry.value = {
    userId: user.value.id,
    fullName: user.value.name,
    fromDate: today,
    endDate: today,
    startTime: '08:00',
    endTime: '17:00',
    type: 'WFH',
    timePeriod: 'FULL',
    reason: '',
    attendanceTypeObjId: '',
    reportObjId: '',
  };

  editMode.value = false;
  formErrors.value = {};

  // Reset các giá trị lịch
  fromDateValue.value = new Date(today);
  endDateValue.value = new Date(today);

  // Thiết lập giá trị mặc định cho time picker
  const date = new Date();
  date.setHours(8, 0, 0);
  startTimeValue.value = new Date(date);
  date.setHours(17, 0, 0);
  endTimeValue.value = new Date(date);
}

// Thêm watch để khôi phục chức năng thiếu
// When editing, convert date string to Date object
watch(() => newEntry.value.date, (newDate) => {
  if (newDate) {
    editDateValue.value = new Date(newDate);
  }
});

// Initialize time values when component mounts
onMounted(() => {
  // Parse initial time values
  if (newEntry.value.startTime) {
    const [hours, minutes] = newEntry.value.startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    startTimeValue.value = date;
  }

  if (newEntry.value.endTime) {
    const [hours, minutes] = newEntry.value.endTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    endTimeValue.value = date;
  }
});

// Add sync function after resetForm function
async function syncData() {
  if (!leaveRequestStore.isAuthenticated) {
    // If not logged in, show notification requiring login
    toast.add({
      severity: 'info',
      summary: 'Yêu cầu đăng nhập',
      detail: 'Vui lòng đăng nhập Admin Create để đồng bộ dữ liệu.',
      life: 3000
    });

    // Show login form and reset skipped state
    isLoggedIn.value = false;
    localStorage.removeItem('calendar_skipped_login');
    hasSkippedLogin.value = false;
    return;
  }

  try {
    loading.value = true;
    const cookieUser = getUserFromCookies();

    // Check if we have a valid user object from cookies
    if (!cookieUser || !cookieUser.userObjId) {
      throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
    }

    const startDateString = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-01`;
    const endDateString = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${daysInMonth.value}`;
    const startTimestamp = new Date(startDateString).getTime();
    const endTimestamp = new Date(endDateString).getTime();

    // Get all existing works from local DB
    const allWorksResponse = await workStore.getAllWorks();
    if (!allWorksResponse.success) {
      throw new Error(allWorksResponse.error || 'Failed to get works data from local DB');
    }

    const allWorks = Array.isArray(allWorksResponse.data)
      ? allWorksResponse.data
      : (allWorksResponse.data ? [allWorksResponse.data] : []);

    // Create a map for faster lookup
    const existingWorkMap = new Map();
    allWorks.forEach(work => {
      if (work.idCreate) {
        existingWorkMap.set(work.idCreate, work);
      }
    });

    // Get data from API
    // Get personal staff attendance (LEAVE)
    const attendanceResponse = await leaveRequestStore.fetchPersonalStaffAttendance({
      startDate: startDateString,
      endDate: endDateString,
      fromDate: startTimestamp,
      toDate: endTimestamp,
      page: 1,
      userObjId: cookieUser.userObjId
    });

    // Get personal staff WFH
    const wfhResponse = await leaveRequestStore.fetchPersonalStaffWfh({
      endDate: endDateString,
      fromDate: startDateString,
      toDate: endTimestamp,
      page: 1,
      userObjId: cookieUser.userObjId
    });

    // Create a map of all API data IDs for faster lookup
    const apiDataMap = new Map();

    // Add LEAVE records to API data map
    const attendanceData = (attendanceResponse.success && Array.isArray(attendanceResponse.data))
      ? attendanceResponse.data
      : [];

    attendanceData.forEach(item => {
      if (item._id) {
        apiDataMap.set(item._id, { ...item, type: 'LEAVE' });
      }
    });

    // Add WFH records to API data map
    const wfhData = (wfhResponse.success && Array.isArray(wfhResponse.data))
      ? wfhResponse.data
      : [];

    wfhData.forEach(item => {
      if (item._id) {
        apiDataMap.set(item._id, { ...item, type: 'WFH' });
      }
    });

    let addedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    let failedCount = 0;

    // Helper function to parse date and extract time
    function parseDateTime(dateTimeStr: string | number) {
      // Handle different date formats
      let dateObj;
      let date;
      let time = "00:00";

      if (typeof dateTimeStr === 'string') {
        // If it's just a date in YYYY-MM-DD format with no time component
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeStr)) {
          // Return the date as is without any timezone conversion
          return {
            date: dateTimeStr,
            time: time
          };
        }

        // If it includes time
        if (dateTimeStr.includes(':')) {
          dateObj = new Date(dateTimeStr);

          // Extract time part directly from the string
          const timePart = dateTimeStr.split('T')[1]?.split('.')[0] || '';
          if (timePart) {
            const timeComponents = timePart.split(':');
            if (timeComponents.length >= 2) {
              time = `${timeComponents[0]}:${timeComponents[1]}`;
            }
          }
        } else {
          // It's a date without time
          dateObj = new Date(`${dateTimeStr}T00:00:00`);
        }
      } else {
        // It's a timestamp
        dateObj = new Date(dateTimeStr);
      }

      // For dates with time components, we need to preserve the exact date
      // Get UTC components to avoid timezone shifts
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`;

      // If there's no explicit time in the string but we created a date object,
      // Extract hours and minutes from the date object
      if (time === "00:00" && typeof dateTimeStr !== 'string') {
        const hours = String(dateObj.getUTCHours()).padStart(2, '0');
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
        time = `${hours}:${minutes}`;
      }

      return {
        date,
        time
      };
    }

    // 1. Process items that exist in API
    for (const [apiId, apiItem] of apiDataMap.entries()) {
      try {
        const fromDateTime = parseDateTime(apiItem.fromDate);
        const endDateTime = parseDateTime(apiItem.endDate);

        // Create work data object
        const workData = {
          userId: user.value.id,
          fromDate: fromDateTime.date,
          endDate: endDateTime.date,
          startTime: apiItem.type === 'WFH' ? "08:00" : fromDateTime.time,
          endTime: apiItem.type === 'WFH' ? "17:00" : endDateTime.time,
          type: apiItem.type,
          reason: apiItem.reason || '',
          idCreate: apiId
        };

        // Case 1: Exists in both API and local DB - update by deleting and inserting
        if (existingWorkMap.has(apiId)) {
          const existingWork = existingWorkMap.get(apiId);

          // Delete the existing work entry
          await workStore.deleteWork(existingWork.id);

          // Create new work entry with updated data
          const workResult = await workStore.createWorkDirect(workData);

          if (workResult.success) {
            updatedCount++;
          } else {
            failedCount++;
          }
        }
        // Case 3: Exists in API but not in local DB - insert new
        else {
          const workResult = await workStore.createWorkDirect(workData);

          if (workResult.success) {
            addedCount++;
          } else {
            failedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing API item ${apiId}:`, error);
        failedCount++;
      }
    }

    for (const [localId, localWork] of existingWorkMap.entries()) {
      if (!apiDataMap.has(localId)) {
        try {
          // Case 2: Exists in local DB but not in API - delete
          await workStore.deleteWork(localWork.id);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting local work ${localId}:`, error);
          failedCount++;
        }
      }
    }

    console.log(`Sync results: Added: ${addedCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}, Failed: ${failedCount}`);

    await loadMonthData();

    let summaryMessage = '';
    if (addedCount > 0) summaryMessage += `${addedCount} bản ghi mới, `;
    if (updatedCount > 0) summaryMessage += `${updatedCount} bản ghi cập nhật, `;
    if (deletedCount > 0) summaryMessage += `${deletedCount} bản ghi đã xóa, `;
    if (failedCount > 0) summaryMessage += `${failedCount} bản ghi lỗi, `;

    // Remove trailing comma and space
    summaryMessage = summaryMessage.replace(/, $/, '');

    if (addedCount > 0 || updatedCount > 0 || deletedCount > 0) {
      toast.add({
        severity: 'success',
        summary: 'Đồng bộ thành công',
        detail: `Đã đồng bộ: ${summaryMessage}.`,
        life: 4000
      });
    } else if (failedCount > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Đồng bộ có lỗi',
        detail: `Có ${failedCount} bản ghi không thể đồng bộ.`,
        life: 4000
      });
    } else {
      toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Không có dữ liệu mới để đồng bộ hoặc đã đồng bộ trước đó.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi đồng bộ',
      detail: error instanceof Error ? error.message : 'Không thể đồng bộ dữ liệu. Vui lòng thử lại sau.',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

// Cập nhật hàm showRegisterForm để kiểm tra đăng nhập trước
function showRegisterForm() {
  if (!leaveRequestStore.isAuthenticated) {
    // If not logged in, show notification requiring login
    toast.add({
      severity: 'info',
      summary: 'Yêu cầu đăng nhập',
      detail: 'Vui lòng đăng nhập Admin Create để đăng ký WFH/Nghỉ phép.',
      life: 3000
    });

    // Show login form and reset skipped state
    isLoggedIn.value = false;
    localStorage.removeItem('calendar_skipped_login');
    hasSkippedLogin.value = false;
  } else {
    // If already logged in, show registration form
    showRegisterModal.value = true;
  }
}

// Add a watch to update end date when start date changes
watch(() => fromDateValue.value, (newDate) => {
  if (newDate) {
    // Set end date equal to start date by default
    endDateValue.value = new Date(newDate);
    newEntry.value.endDate = formatCalendarDate(newDate);
  }
});
</script>

<style scoped>
/* Styles for Login Container */
.login-container {
  background-color: #f8f9fa;
  /* Light background */
}

/* Additional style updates */
.calendar-day {
  min-height: 150px !important;
  height: 150px;
  /* Increased height from 120px */
  overflow: hidden;
  /* Changed from overflow-y: auto to prevent scrolling */
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  /* Ensure positioning context for absolute elements */
  padding-top: 30px;
  /* Increased padding for more space */
  border-radius: 10px !important;
  /* Added more rounded corners */
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.calendar-day:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #bbbbbb !important;
}

.calendar-day.empty {
  min-height: 0 !important;
  height: auto !important;
  /* Override for empty cells before the 1st of the month */
  border: none !important;
  background-color: transparent !important;
  box-shadow: none;
}

.calendar-day.empty:hover {
  transform: none;
  box-shadow: none;
}

.calendar-container {
  margin-top: 10px;
}

/* Fix for the Bootstrap grid in calendar */
.calendar-grid .row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  /* Increased gap between days */
  margin-bottom: 12px;
  /* Increased margin */
}

.calendar-grid .col {
  max-width: 100%;
  flex: 0 0 auto;
}

/* Day number styling - made larger */
.day-number {
  font-size: 1.2rem !important;
  /* Increased font size */
  top: 10px !important;
  left: 10px !important;
  color: #495057;
}

/* Day status container styling */
.day-status-container {
  padding: 6px 0;
}

/* Style for the reason text with ellipsis for overflow */
.reason-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* Limit to 2 lines */
  -webkit-box-orient: vertical;
  font-size: 0.85rem;
  margin-top: 5px !important;
  word-break: break-word;
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
    min-height: 100px !important;
    height: 100px;
  }

  .day-number {
    font-size: 1rem !important;
  }

  .reason-text {
    -webkit-line-clamp: 1;
    /* Limit to 1 line on mobile */
  }

  .tabs-container {
    overflow-x: auto;
    white-space: nowrap;
  }

  .date-picker-container,
  .month-picker-container {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 10px;
  }

  .month-picker-container>* {
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
  top: 8px;
  right: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--bs-primary);
  z-index: 1;
}

/* PrimeVue specific styles */
.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.custom-dialog-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 5px;
}

.custom-dialog-content::-webkit-scrollbar {
  width: 6px;
}

.custom-dialog-content::-webkit-scrollbar-thumb {
  background-color: #d0d0d0;
  border-radius: 10px;
}

/* Type selection styling */
.type-selection {
  display: flex;
  gap: 6%;
  justify-content: flex-start;
  background-color: var(--surface-50);
  padding-left: 0 !important;
}

.type-option {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.radio-left {
  padding-left: 0px;
}

.left-10 {
  padding-left: 5px;
}

.type-option.selected {
  background-color: var(--primary-color-50);
  font-weight: 600;
}

.form-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -0.5rem;
}

.form-grid>div {
  padding: 0 0.5rem;
  flex: 0 0 50%;
}

@media (max-width: 768px) {
  .form-grid>div {
    flex: 0 0 100%;
  }

  .type-selection {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Better input field styling */
:deep(.p-inputtext) {
  padding: 0.75rem 1rem;
}

:deep(.p-button) {
  padding: 0.75rem 1.25rem;
}

:deep(.p-password-input) {
  width: 100%;
}

:deep(.p-dropdown-label) {
  padding: 0.75rem;
}

:deep(.p-calendar) .p-inputtext {
  padding-right: 2.5rem;
}

/* Override to make password input full width */
:deep(.p-password) {
  width: 100%;
  display: block;
}

.box-container {
  width: 144%;
}

/* Styling for late check-in information */
.text-warning {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.late-checkin {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(255, 193, 7, 0.1);
  padding: 3px 6px;
  border-radius: 4px;
  width: fit-content;
}

.fixed-width-dropdown {
  width: 100%;
  max-width: 218px;
  min-width: 218px;
}

.time-period {
  font-size: 0.8em;
  display: block;
  text-align: center;
  color: #666;
}
</style>