<template>
  <div class="attendance-calendar card">
    <div class="card-header bg-primary text-white">
      <!-- <h4 class="mb-0"></h4> -->
    </div>

    <div class="card-body">
      <!-- Month/Year Selection Controls -->
      <div class="mb-4 filter-controls">
        <div class="row g-3 align-items-center">
          <div class="col-auto">
            <div class="input-group">
              <span class="input-group-text">Tháng:</span>
              <select v-model="selectedMonth" class="form-select" aria-label="Chọn tháng">
                <option v-for="(month, index) in monthOptions" :key="index" :value="index + 1">
                  {{ month }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-auto">
            <div class="input-group">
              <span class="input-group-text">Năm:</span>
              <select v-model="selectedYear" class="form-select" aria-label="Chọn năm">
                <option v-for="year in yearOptions" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-auto ms-auto">
            <div class="legend d-flex gap-3">
              <div class="d-flex align-items-center">
                <span class="legend-box wfh me-1"></span>
                <span>Làm việc tại nhà (WFH)</span>
              </div>
              <div class="d-flex align-items-center">
                <span class="legend-box off me-1"></span>
                <span>Nghỉ (OFF)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar Table -->
      <div class="table-wrapper" ref="tableWrapperRef">
        <table class="table table-bordered">
          <thead class="bg-light">
            <tr>
              <th class="cell header-cell stt">STT</th>
              <th class="cell header-cell name">Họ Tên</th>
              <th v-for="(date, index) in calendarDates" :key="`day-${index}`" class="cell header-cell"
                :class="{ 'weekend': isWeekend(date) }" :style="{ width: cellWidth + 'px' }">
                {{ date.getDate() }}<br>
                <span class="weekday">{{ getWeekdayName(date) }}</span>
              </th>
              <th class="cell header-cell stats"><span>WFH</span></th>
              <th class="cell header-cell stats"><span>OFF</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(person, pIndex) in people" :key="`row-${pIndex}`" class="person-row">
              <td class="cell stt">{{ pIndex + 1 }}</td>
              <td class="cell name">{{ person.name }}</td>
              <td v-for="(date, dIndex) in calendarDates" :key="`cell-${pIndex}-${dIndex}`" class="cell data-cell"
                :class="{
                  'weekend': isWeekend(date),
                  'wfh': hasStatus(person.id, date, 'WFH'),
                  'off': hasStatus(person.id, date, 'OFF')
                }" :style="{ width: cellWidth + 'px' }"
                v-tooltip="{ value: getStatusWithPeriod(person.id, date), position: 'bottom' }">
                <!-- Cell nội dung trống, chỉ hiển thị màu nền -->
              </td>
              <td class="cell stats">{{ getTotalDays(person.id, 'WFH') }}</td>
              <td class="cell stats">{{ getTotalDays(person.id, 'OFF') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed, onActivated } from 'vue';
import axiosInstance from '@/router/Interceptor';
import Tooltip from 'primevue/tooltip';
import { eventBus } from '@/event/EventBus';
import type { AxiosRequestConfig } from 'axios';

// Define custom config interface with hideLoader option
interface CustomAxiosConfig extends AxiosRequestConfig {
  hideLoader?: boolean;
}

// Define directive
const vTooltip = Tooltip;

interface Person {
  id: number;
  name: string;
}

interface AttendanceRecord {
  personId: number;
  date: string; // YYYY-MM-DD format
  status: string;
  timePeriod: string; // P (Present), V (Absent), Đ (Late), N (Leave)
}

// Month and year options
const currentDate = new Date();
const monthOptions = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const currentYear = currentDate.getFullYear();
const yearOptions = ref([currentYear - 1, currentYear, currentYear + 1]);

// Selected month and year
const selectedMonth = ref(currentDate.getMonth() + 1);
const selectedYear = ref(currentYear);

// Calendar dates array (actual Date objects)
const calendarDates = ref<Date[]>([]);

// Container width and dynamic cell width calculation
const tableWrapperRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const fixedColumnsWidth = 240; // STT + Họ Tên columns width
const statsColumnsWidth = 80; // WFH + OFF columns width

// Dynamically calculate cell width based on available space
const cellWidth = computed(() => {
  if (containerWidth.value <= 0 || calendarDates.value.length === 0) return 30;
  const availableWidth = containerWidth.value - fixedColumnsWidth - statsColumnsWidth;
  const calculatedWidth = Math.floor(availableWidth / calendarDates.value.length);
  return Math.max(calculatedWidth, 25); // Minimum width of 25px
});

// Weekday names in Vietnamese
const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Kết quả API
const attendanceData = ref<AttendanceRecord[]>([]);
const people = ref<Person[]>([]);

// Thực sự gọi API
interface User { id: number; fullName: string }
interface WorkSummary {
  userId: number;
  memberName: string;
  work: {
    fromDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    type: string;
    timePeriod: string;
  }[]
}

async function fetchAttendanceData() {
  try {
    eventBus.emit('loader:show');

    // 1. Lấy danh sách users và viết tắt tên
    const config: CustomAxiosConfig = { hideLoader: true };
    const usersRes = await axiosInstance.get<User[]>('/users', config);
    people.value = usersRes.data.map((u: User) => ({ id: u.id, name: u.fullName }));

    // 2. Lấy tóm tắt công theo từng user
    const summaryConfig: CustomAxiosConfig = {
      params: { month: selectedMonth.value, year: selectedYear.value },
      hideLoader: true
    };
    const summaryRes = await axiosInstance.get<WorkSummary[]>('/works/work-summary', summaryConfig);
    const records: AttendanceRecord[] = [];

    summaryRes.data.forEach((u: WorkSummary) => {
      u.work.forEach((entry) => {
        const start = new Date(entry.fromDate);
        const end = new Date(entry.endDate);
        const curr = new Date(start);
        while (curr <= end) {
          const status = entry.type === 'LEAVE' ? 'OFF' : entry.type;
          records.push({ personId: u.userId, date: formatDate(curr), status, timePeriod: entry.timePeriod });
          curr.setDate(curr.getDate() + 1);
        }
      });
    });

    attendanceData.value = records;
  } catch (e) {
    console.error('Error fetching attendance data:', e);
  } finally {
    eventBus.emit('loader:hide');
  }
}

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get total days for a specific status
function getTotalDays(personId: number, status: string): number {
  return attendanceData.value.filter(
    r => r.personId === personId && r.status === status
  ).length;
}

// Function to generate calendar dates for the selected month/year
function generateCalendarDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month - 1, day));
  }

  return dates;
}

// Initialize calendar dates
function initCalendarDates() {
  calendarDates.value = generateCalendarDates(selectedYear.value, selectedMonth.value);
}

// Get weekday name for a specific date
function getWeekdayName(date: Date): string {
  return weekdayNames[date.getDay()];
}

// Check if date is a weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

// Function to update container width
function updateContainerWidth() {
  if (tableWrapperRef.value) {
    containerWidth.value = tableWrapperRef.value.clientWidth;
  }
}

// Cập nhật khi đổi tháng hoặc mount
async function updateCalendarData() {
  initCalendarDates();
  await fetchAttendanceData();
  nextTick(() => {
    updateContainerWidth();
  });
}

// Debounce function to prevent multiple rapid updates
function debounce(fn: Function, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Create debounced update function
const debouncedUpdate = debounce(updateCalendarData, 300);

// Watch for month/year changes with debounce
watch([selectedMonth, selectedYear], debouncedUpdate);

onMounted(() => {
  // Initialize calendar dates
  updateCalendarData();

  // Add resize event listener
  window.addEventListener('resize', updateContainerWidth);

  // Add resize observer to keep table alignment when window resizes
  const resizeObserver = new ResizeObserver(() => {
    updateContainerWidth();
  });

  if (tableWrapperRef.value) {
    resizeObserver.observe(tableWrapperRef.value);
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', updateContainerWidth);
  });
});

// Add onActivated hook to reload data when component is activated
onActivated(() => {
  updateCalendarData();
});

// Add new helper functions for more reliable status checking and tooltip display
function hasStatus(personId: number, date: Date, specificStatus?: string): boolean {
  const dateStr = formatDate(date);
  const record = attendanceData.value.find(
    r => r.personId === personId && r.date === dateStr
  );

  if (!record) return false;
  if (specificStatus) return record.status === specificStatus;
  return true;
}

// Function to get full status with time period info for tooltip
function getStatusWithPeriod(personId: number, date: Date): string {
  const dateStr = formatDate(date);
  const record = attendanceData.value.find(
    r => r.personId === personId && r.date === dateStr
  );

  if (!record) return '';
  return `${record.status} (${record.timePeriod})`;
}
</script>

<style scoped>
.attendance-calendar {
  width: 100%;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-body {
  display: flex;
  flex-direction: column;
}

.filter-controls {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.legend {
  display: flex;
  align-items: center;
}

.legend-box {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 5px;
}

.legend-box.wfh {
  background-color: #00aeff;
  /* Light yellow-blue color */
  border: 1px solid #91d5ff;
}

.legend-box.off {
  background-color: #ff405d;
  /* Light red color */
  border: 1px solid #ffcdd2;
}

.table-wrapper {
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  box-sizing: border-box;
  width: 100%;
  overflow-x: auto;
}

/* Common table styles */
.table {
  margin: 0;
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
}

/* No bottom border for header table */
.no-bottom-border tr:last-child th {
  border-bottom: none;
}

/* No top border for content table */
.no-top-border tr:first-child td {
  border-top: none;
}

/* Common cell styles */
.cell {
  padding: 2px;
  text-align: center;
  height: 30px;
  overflow: hidden !important;
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
  box-sizing: border-box;
  vertical-align: middle;
  font-size: 0.75rem;
}

/* Cell status styles */
.data-cell.wfh {
  background-color: #00aeff;
  /* Light yellow-blue color */
  position: relative;
}

.data-cell.off {
  background-color: #ff405d;
  /* Light red color */
  position: relative;
}

/* Weekend styling */
.weekend {
  background-color: #c4c3c3 !important;
  color: #6c757d;
}

/* Cell widths */
.stt {
  width: 30px !important;
  min-width: 30px !important;
  max-width: 30px !important;
}

.name {
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
  text-align: left;
  font-size: 0.85rem;
}

.stats {
  width: 30px !important;
  min-width: 30px !important;
  max-width: 30px !important;
}

.stats span {
  font-weight: 700;
  font-weight: 700;
  font-size: 11px;
}

/* Header styles */
.header-cell {
  font-weight: 600;
  background-color: #f8f9fa;
  font-size: 0.75rem;
}

/* Weekday name style */
.weekday {
  font-size: 0.7rem;
  color: #6c757d;
}

/* Ensure all rows have the same height */
.person-row {
  height: 30px;
}

/* Thêm style cho time-period */
.time-period {
  font-size: 0.65em;
  display: block;
  text-align: center;
  color: #666;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>