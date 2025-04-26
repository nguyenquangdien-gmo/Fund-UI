<template>
  <div class="container-fluid calendar-wrapper">
    <div class="p-3">
      <h2 class="text-center mb-4 text-xl">LỊCH LÀM VIỆC</h2>

      <!-- Tab Selection -->
      <div class="d-flex justify-content-center mb-4">
        <div class="btn-group" role="group" aria-label="Calendar Tabs">
          <button class="btn" :class="activeTab === 'personal' ? 'btn-primary' : 'btn-outline-primary'"
            @click="activeTab = 'personal'">
            Lịch Cá Nhân
          </button>
          <button class="btn" :class="activeTab === 'team' ? 'btn-primary' : 'btn-outline-primary'"
            @click="activeTab = 'team'">
            Lịch Nhóm
          </button>
        </div>
      </div>

      <!-- Calendar Components -->
      <div class="calendar-container">
        <PersonalCalendar v-if="activeTab === 'personal'" />
        <TeamCalendar v-if="activeTab === 'team'" />
      </div>
    </div>
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
import { useWorkStore } from '@/pinia/workStore'
import { removeAuthToken } from '@/router/CreateApiInstance'
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

// Type definitions
interface WorkEntry {
  id: number
  userId: number
  fullName: string
  fromDate: string
  endDate: string
  date?: string // For backward compatibility with calendar logic
  startTime: string
  endTime: string
  type: 'WFH' | 'LEAVE'
  timePeriod: 'FULL' | 'AM' | 'PM'
  reason: string
  approvedById?: number | null
  approvedByName?: string | null
  createdAt: string
  isCurrentUser?: boolean
  idCreate?: string  // ID of the original Leave or WFH request
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
// --- Login State ---
const isLoggedIn = ref<boolean>(false) // Initially false, will be checked on mount
const loginUsername = ref<string>('')
const loginPassword = ref<string>('')
const loginError = ref<string | null>(null)
const loginLoading = ref<boolean>(false)
// --- End Login State ---

// --- Toast Service ---
const toast = useToast();
// --- End Toast Service ---

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

// Update formatSelectedDate computed property
const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return '';

  const day = selectedDate.value.getDate().toString().padStart(2, '0');
  const month = (selectedDate.value.getMonth() + 1).toString().padStart(2, '0');
  const year = selectedDate.value.getFullYear();

  return `${day}-${month}-${year}`;
})

// Add new reactive property after other state properties
const lateCheckIns = ref<LateCheckIn[]>([])

// Watch for tab changes to load necessary data
watch(activeTab, (newTab) => {
  // Only load if logged in
  if (!isLoggedIn.value) return
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
  // Only load if logged in
  if (!isLoggedIn.value) return

  if (activeTab.value === 'team' && activeTeamTab.value === 'month') {
    loadTeamMonthlyData()
  }
})

// Watch for type changes to set default times for WFH
watch(() => newEntry.value.type, (newType) => {
  if (newType === 'WFH') {
    // Set default times for WFH
    newEntry.value.startTime = '08:00'
    newEntry.value.endTime = '17:00'
    
    // Update time picker values
    const date = new Date()
    
    // Set 8:00 for start time
    date.setHours(8, 0, 0)
    startTimeValue.value = new Date(date)
    
    // Set 17:00 for end time
    date.setHours(17, 0, 0)
    endTimeValue.value = new Date(date)
  }
})

// Load data on component mount
onMounted(async () => {
  // Check if user is already authenticated via cookies
  await checkAuthentication()
  
  // Only load data if the user is logged in after the cookie check
  if (!isLoggedIn.value) return
  
  // Since checkAuthentication already handles loading state and data loading when logged in,
  // we only need to load team data based on active tab
  
  // Load team data based on active tab without showing loader again
  if (activeTab.value === 'team-daily') {
    await loadTeamDailyData(false)
  } else if (activeTab.value === 'team-monthly') {
    await loadTeamMonthlyData(false)
  }
})

// Function to check authentication via cookies
// async function checkCookieAuth() {
//   try {
//     const tokenExists = Cookies.get('AUTHTOKEN')
//     const userDataExists = Cookies.get('user')
    
//     // If no tokens or user data, user needs to log in
//     if (!tokenExists || !userDataExists) {
//       isLoggedIn.value = false
//       return
//     }
    
//     // Try to parse user data
//     try {
//       const userData = JSON.parse(userDataExists)
      
//       // Verify the user data contains required fields
//       if (!userData.userObjId || !userData.name) {
//         isLoggedIn.value = false
//         return
//       }
      
//       // User has valid cookies, set as logged in
//       isLoggedIn.value = true
      
//       // Load required data for the authenticated user
//       await Promise.all([
//         leaveRequestStore.fetchLeaveTypes(),
//         leaveRequestStore.fetchReporters()
//       ])
      
//     } catch (e) {
//       console.error('Error parsing user cookie:', e)
//       isLoggedIn.value = false
//       return
//     }
//   } catch (error) {
//     console.error('Error checking authentication cookies:', error)
//     isLoggedIn.value = false
//   }
// }

// API methods with type safety
async function loadMonthData(showLoader: boolean = true): Promise<void> {
  // Ensure user is logged in before fetching data
  if (!isLoggedIn.value) return;

  try {
    if (showLoader) {
      loading.value = true;
    }
    errorMessage.value = '';

    // Use Promise.all to load data in parallel
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

async function loadTeamDailyData() {
  try {
    loadingTeamData.value = true

    // Format date for API call
    const formattedDate = formatDateForAPI(selectedDate.value)

    // Call API to get team data for selected date
    const response = await axiosInstance.get<UserWorkResponse[]>(`/works/${formattedDate}`)

    // Transform API data
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
    const response = await axiosInstance.get<WorkSummaryResponse[]>('/works/work-summary', {
      params,
    })

    // Transform API data to match the UI expectations
    teamMonthlyData.value = response.data.map(item => ({
      memberName: item.memberName,
      wfhDays: item.wfhDays,
      leaveDays: item.leaveDays,
      // For backwards compatibility - calculated fields
      standardWorkDays: getWorkingDaysInMonth(selectedYear.value, selectedMonth.value - 1),
      totalDays: getWorkingDaysInMonth(selectedYear.value, selectedMonth.value - 1) - item.leaveDays
    }))

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
  // Reset errors
  formErrors.value = {}

  // Get current date at midnight for comparison (without time)
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  const todayStr = formatDateWithoutTimezone(currentDate)

  // Validate required fields
  // Only validate start and end times for non-WFH entries
  if (newEntry.value.type !== 'WFH') {
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
  } else {
    // For WFH, set default times
    newEntry.value.startTime = '08:00'
    newEntry.value.endTime = '17:00'
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

    if (!newEntry.value.endDate) {
      formErrors.value.endDate = 'Vui lòng chọn ngày kết thúc'
    } else if (newEntry.value.endDate < todayStr) {
      formErrors.value.endDate = 'Ngày kết thúc không thể là ngày trong quá khứ'
    }

    // Validate fromDate must not equal endDate
    if (newEntry.value.fromDate && newEntry.value.endDate) {
      if (newEntry.value.fromDate > newEntry.value.endDate) {
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Add this helper function to parse user data from cookies
function getUserFromCookies(): {
  userObjId?: string
  name?: string
  staffCode?: number
  userPositionCode?: string
  departmentCode?: string
} {
  const userDataStr = Cookies.get('user')
  if (!userDataStr) {
    return {}
  }
  try {
    return JSON.parse(userDataStr)
  } catch (e) {
    console.error('Error parsing user cookie:', e)
    return {}
  }
}

// Get stores
const leaveRequestStore = useLeaveRequestStore()
const workStore = useWorkStore()

// Update the registerEntry function
async function registerEntry() {
  // Validate form before submission
  if (!validateForm()) {
    return
  }

  // Clear previous general errors before attempting submission
  formErrors.value.general = undefined;
  loading.value = true

  // Log values to verify correct date formatting
  console.log('Form values:', {
    fromDate: newEntry.value.fromDate,
    endDate: newEntry.value.endDate,
    formattedFromDate: typeof fromDateValue.value === 'object' ? formatCalendarDate(fromDateValue.value) : null,
    formattedEndDate: typeof endDateValue.value === 'object' ? formatCalendarDate(endDateValue.value) : null
  });

  // --- Create Logic ---
  let creationSuccess = false; // Flag to track successful creation
  let requestData; // Store request data for work creation

  // Improved validation to check for any entries in the date range
  const fromDateObj = new Date(newEntry.value.fromDate);
  const endDateObj = new Date(newEntry.value.endDate);
  
  // Reset time components for proper date comparison
  fromDateObj.setHours(0, 0, 0, 0);
  endDateObj.setHours(0, 0, 0, 0);
  
  // Check if there are any existing entries in the specified date range
  const hasExistingEntries = calendarEntries.value.some(entry => {
    // Get entry date (either from date field or fromDate)
    let entryDateObj;
    if (entry.date) {
      entryDateObj = new Date(entry.date);
    } else if (entry.fromDate) {
      entryDateObj = new Date(entry.fromDate);
    } else {
      return false; // Skip if no valid date
    }
    
    // Reset time components for proper comparison
    entryDateObj.setHours(0, 0, 0, 0);
    
    // Check if entry is of the same type and falls within the requested range
    return entry.type === newEntry.value.type && 
           entryDateObj >= fromDateObj && 
           entryDateObj <= endDateObj;
  });
  
  if (hasExistingEntries) {
    toast.add({ 
      severity: 'error', 
      summary: 'Không thể đăng ký', 
      detail: `Bạn đã có đăng ký ${newEntry.value.type === 'WFH' ? 'WFH' : 'nghỉ phép'} trong khoảng thời gian này.`, 
      life: 4000 
    });
    loading.value = false;
    return;
  }

  if (newEntry.value.type === 'LEAVE') {
    // Create Leave Request
    if (!newEntry.value.attendanceTypeObjId) {
      formErrors.value.attendanceType = 'Vui lòng chọn loại nghỉ phép'
      loading.value = false // Stop loading before returning
      return
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

    const result = await leaveRequestStore.createLeaveRequestNew(leavePayload);
    
    // Check for specific success
    if (result.success) {
      // Store data for work creation
      requestData = {
        userId: user.value.id,
        type: 'LEAVE',
        fromDate: newEntry.value.fromDate || '',
        endDate: newEntry.value.endDate || '',
        startTime: newEntry.value.startTime,
        endTime: newEntry.value.endTime,
        reason: newEntry.value.reason,
        idCreate: result.data?._id // Use the created leave request ID if available
      };
      
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đăng ký nghỉ phép thành công.', life: 3000 });
      creationSuccess = true;
    } else {
      // Show error toast with message from API or a default one
      const detailMessage = result.error || 'Đăng ký nghỉ phép thất bại. Vui lòng thử lại.';
      toast.add({ severity: 'error', summary: 'Thất bại', detail: detailMessage, life: 4000 });
    }

  } else {
    // Create WFH Request
    const cookieUser = getUserFromCookies()
    if (
      !cookieUser.name ||
      !cookieUser.staffCode ||
      !cookieUser.userPositionCode ||
      !cookieUser.departmentCode ||
      !cookieUser.userObjId ||
      !newEntry.value.reportObjId ||
      !newEntry.value.fromDate
    ) {
      // Use toast for this error instead of formErrors.general
       toast.add({ severity: 'error', summary: 'Lỗi thông tin', detail: 'Thiếu thông tin người dùng để tạo đơn WFH.', life: 4000 });
       loading.value = false; // Stop loading
       return; // Exit early
    }

    const wfhPayload = {
      applicant_person: cookieUser.name,
      staff_code: Number(cookieUser.staffCode),
      positon: cookieUser.userPositionCode,
      department: cookieUser.departmentCode,
      reportObjId: newEntry.value.reportObjId,
      createAt: formatDateForDisplay(new Date()),
      fromDate: newEntry.value.fromDate,
      endDate: newEntry.value.endDate || newEntry.value.fromDate, // Use endDate if available, otherwise same as fromDate
      reason: newEntry.value.reason || '',
      userObjId: cookieUser.userObjId,
    }

    const result = await leaveRequestStore.createWfhRequestNew(wfhPayload)
    
    // Check for specific success
    if (result.success) {
      // Store data for work creation
      requestData = {
        userId: user.value.id,
        type: 'WFH',
        fromDate: newEntry.value.fromDate,
        endDate: newEntry.value.endDate || newEntry.value.fromDate,
        startTime: '08:00', // Always use 8:00 for WFH
        endTime: '17:00',   // Always use 17:00 for WFH
        reason: newEntry.value.reason || '',
        idCreate: result.data?._id // Use the created WFH request ID if available
      };
      
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đăng ký WFH thành công.', life: 3000 });
      creationSuccess = true;
    } else {
      // Show error toast with message from API or a default one
      const detailMessage = result.error || 'Đăng ký WFH thất bại. Vui lòng thử lại.';
      toast.add({ severity: 'error', summary: 'Thất bại', detail: detailMessage, life: 4000 });
    }
  }

  // Only proceed if creation was successful
  if (creationSuccess && requestData) {
    // Create work entry after successful leave/WFH request
    try {
      console.log('Request data:', requestData)
      const workResult = await workStore.createWorkFromRequest(requestData);
      if (!workResult.status===400) {
        console.error('Failed to create work entry:', workResult.error);
        // Optionally show a warning toast that work entry creation failed
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
    
    // Continue with normal flow
    await loadMonthData();
    resetForm()
    showRegisterModal.value = false
  }
  // --- End Create Logic ---
}

async function deleteSelectedDay() {
  if (!selectedDayStatus.value?.id) return;
  
  // Show the confirmation modal instead of using alert
  showDeleteConfirmModal.value = true;
}

// Add new function to handle confirm deletion
async function confirmDelete() {
  if (!selectedDayStatus.value?.id) return;
  
  try {
    deleteLoading.value = true;
    
    // First, delete the source request (Leave or WFH) using idCreate
    if (selectedDayStatus.value.type === 'LEAVE' && selectedDayStatus.value.idCreate) {
      console.log('Deleting Leave request with ID:', selectedDayStatus.value.idCreate);
      const leaveResult = await leaveRequestStore.deleteLeaveRequest(selectedDayStatus.value.idCreate);
      if (!leaveResult.success) {
        console.error('Error deleting leave request:', leaveResult.error);
      }
    } else if (selectedDayStatus.value.type === 'WFH' && selectedDayStatus.value.idCreate) {
      console.log('Deleting WFH request with ID:', selectedDayStatus.value.idCreate);
      const wfhResult = await leaveRequestStore.deleteWfhRequest(selectedDayStatus.value.idCreate);
      if (!wfhResult.success) {
        console.error('Error deleting WFH request:', wfhResult.error);
      }
    }
    
    // Then delete the work entry
    await axiosInstance.delete(`/works/${selectedDayStatus.value.id}`);

    // Display success message
    toast.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: 'Đã xóa đăng ký thành công.', 
      life: 3000 
    });

    // Reload data and close modals
    await loadMonthData();
    showDayModal.value = false;
    showDeleteConfirmModal.value = false;
  } catch (error) {
    console.error('Error deleting work status:', error);
    
    // Display error message
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

// Add function to cancel deletion
function cancelDelete() {
  showDeleteConfirmModal.value = false;
}

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
  }
  editMode.value = false
  formErrors.value = {}
  
  // Reset calendar values
  fromDateValue.value = new Date(today)
  endDateValue.value = new Date(today)
  
  // For time pickers, set up the display values
  const date = new Date()
  
  // Set hours and minutes for start time (8:00)
  date.setHours(8, 0, 0)
  startTimeValue.value = new Date(date)
  
  // Set hours and minutes for end time (17:00) 
  date.setHours(17, 0, 0)
  endTimeValue.value = new Date(date)
}

function openDayDetails(day: number): void {
  selectedDay.value = day
  const status = getDayStatus(day)
  selectedDayStatus.value = status || null
  showDayModal.value = true
}

// Add load function for late check-ins
async function loadLateCheckIns(showLoader: boolean = true): Promise<void> {
  // Ensure user is logged in
  if (!isLoggedIn.value) return;

  try {
    if (showLoader) {
      loading.value = true;
    }
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
  // Ensure user is logged in before calculating
  if (!isLoggedIn.value) return 0;
  return getWorkingDaysInMonth(selectedYear.value, selectedMonth.value - 1)
})

// --- Login Handler ---
async function handleLogin() {
  loginLoading.value = true;
  loginError.value = null;
  
  try {
    const result = await leaveRequestStore.signIn(loginUsername.value, loginPassword.value);
    
    if (result.success && result.data) {
      isLoggedIn.value = true;
      
      // Reset login form
      loginUsername.value = '';
      loginPassword.value = '';
      
      // Single loading indicator for all data loading
      loading.value = true;
      
      // Load all required data in parallel
      await Promise.all([
        loadMonthData(false),
        leaveRequestStore.fetchLeaveTypes(),
        leaveRequestStore.fetchReporters()
      ]);
      
      loading.value = false;
    } else {
      loginError.value = result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
    }
  } catch (error: unknown) {
    console.error('Login error:', error);
    // Type check for error message
    if (error instanceof Error) {
      loginError.value = error.message;
    } else {
      loginError.value = 'Đã xảy ra lỗi trong quá trình đăng nhập.';
    }
  } finally {
    loginLoading.value = false;
  }
}
// --- End Login Handler ---

// --- Authentication Check Function ---
async function checkAuthentication() {
  // Use loading value directly for the entire authentication process
  loading.value = true;
  try {
    const tokenExists = Cookies.get('AUTHTOKEN');
    const userDataExists = Cookies.get('user');

    // If no token OR no user data in cookies, show login form
    if (!tokenExists || !userDataExists) {
      isLoggedIn.value = false;
      
      if (tokenExists && !userDataExists) {
        // If token exists but no user data, remove the token
        removeAuthToken();
        toast.add({ 
          severity: 'warn', 
          summary: 'Thông tin đăng nhập thiếu', 
          detail: 'Vui lòng đăng nhập lại.', 
          life: 4000 
        });
      }
      return;
    }

    // Validate user data
    const userData = JSON.parse(Cookies.get('user') || '{}');
    if (!userData.userObjId || !userData.name) {
      // Invalid user data
      isLoggedIn.value = false;
      removeAuthToken();
      Cookies.remove('user');
      toast.add({ 
        severity: 'warn', 
        summary: 'Thông tin người dùng không đầy đủ', 
        detail: 'Vui lòng đăng nhập lại.', 
        life: 4000 
      });
      return;
    }

    // If we have valid token and user data, set isLoggedIn to true
    isLoggedIn.value = true;
    
    // Start a single loading process for all data loading
    loading.value = true;
    
    // Load all data in parallel
    await Promise.all([
      loadMonthData(false), // Pass false to prevent showing loader again inside the function
      leaveRequestStore.fetchLeaveTypes(),
      leaveRequestStore.fetchReporters()
    ]);
    
  } catch (error) {
    console.error('Error validating user data:', error);
    isLoggedIn.value = false;
    removeAuthToken();
    Cookies.remove('user');
    
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi xác thực', 
      detail: 'Không thể xác thực phiên đăng nhập. Vui lòng đăng nhập lại.', 
      life: 4000 
    });
  } finally {
    loading.value = false;
  }
}
// --- End Authentication Check Function ---

// Add these helper variables for date/time conversion with Calendar
const fromDateValue = ref<Date | null>(new Date(newEntry.value.fromDate))
const endDateValue = ref<Date | null>(new Date(newEntry.value.endDate))
const startTimeValue = ref<Date | null>(null)
const endTimeValue = ref<Date | null>(null)
const editDateValue = ref<Date | null>(null)

// Add helper functions for date and time formatting
function formatCalendarDate(date: Date | null): string {
  if (!date) return '';
  
  // Use the local date to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Always return YYYY-MM-DD for API
  return `${year}-${month}-${day}`;
}

function formatTimeValue(date: Date | null): string {
  if (!date) return ''
  return date.toTimeString().substring(0, 5)
}

// When editing, convert date string to Date object
watch(() => newEntry.value.date, (newDate) => {
  if (newDate) {
    editDateValue.value = new Date(newDate)
  }
})

// Initialize time values when component mounts
onMounted(() => {
  // Parse initial time values
  if (newEntry.value.startTime) {
    const [hours, minutes] = newEntry.value.startTime.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0)
    startTimeValue.value = date
  }
  
  if (newEntry.value.endTime) {
    const [hours, minutes] = newEntry.value.endTime.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0)
    endTimeValue.value = date
  }
})

// Add a helper function to check if a day has multiple days of work
function isMultiDayEntry(entry: WorkEntry | undefined): boolean {
  if (!entry || !entry.fromDate || !entry.endDate) return false;
  return entry.fromDate !== entry.endDate;
}

// Add a helper function to format date display
function formatDateDisplay(dateStr: string | undefined): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}-${month}-${date.getFullYear()}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr; // Return original string if parsing fails
  }
}

// Add these variables to the script section
const showDeleteConfirmModal = ref<boolean>(false);
const deleteLoading = ref<boolean>(false);

// Add this variable to the script section
const isDevelopment = ref<boolean>(import.meta.env.DEV || false);

// Function to load all user data
// async function loadUserData(): Promise<void> {
//   try {
//     await loadMonthData(false)
//     await leaveRequestStore.fetchLeaveTypes()
//     await leaveRequestStore.fetchReporters()
//   } catch (error) {
//     console.error('Error loading user data:', error)
//   }
// }
</script>

<style scoped></style>
