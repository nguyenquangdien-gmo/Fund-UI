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
        <!-- Góc trên bên trái (cố định) -->
        <div class="fixed-corner">
          <table class="table table-bordered mb-0">
            <thead class="bg-light">
              <tr>
                <th class="cell header-cell stt" rowspan="2"></th>
                <th class="cell header-cell name" rowspan="2">Ngày</th>
              </tr>
            </thead>
            <thead class="bg-light">
              <tr>
                <th class="cell header-cell stt" rowspan="2">STT</th>
                <th class="cell header-cell name" rowspan="2">Họ Tên</th>
              </tr>
            </thead>
          </table>
        </div>

        <!-- Header cố định (phần trên, không có scroll ngang) -->
        <div class="fixed-header" ref="headerRef">
          <table class="table table-bordered mb-0 no-bottom-border" style="width: 100%">
            <thead>
              <tr class="day-row">
                <th v-for="(date, index) in calendarDates" :key="`day-${index}`" class="cell header-cell"
                  :class="{ 'weekend': isWeekend(date) }" :style="{ width: cellWidth + 'px' }">
                  {{ date.getDate() }}
                </th>
                <th class="cell header-cell stats" rowspan="2"><span>WFH</span></th>
                <th class="cell header-cell stats" rowspan="2"><span>OFF</span></th>
              </tr>
              <tr class="weekday-row">
                <th v-for="(date, index) in calendarDates" :key="`weekday-${index}`" class="cell header-cell weekday"
                  :class="{ 'weekend': isWeekend(date) }" :style="{ width: cellWidth + 'px' }">
                  {{ getWeekdayName(date) }}
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <!-- Cột cố định (bên trái, có thể scroll dọc) -->
        <div class="fixed-column" ref="columnRef">
          <table class="table table-bordered mb-0">
            <tbody>
              <tr v-for="(person, index) in people" :key="person.id" class="person-row">
                <td class="cell stt">{{ index + 1 }}</td>
                <td class="cell name">{{ person.name }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Phần nội dung chính (chỉ scroll dọc) -->
        <div class="scrollable-content" @scroll="handleScroll" ref="contentRef">
          <table class="table table-bordered mb-0 no-top-border" style="width: 100%">
            <tbody>
              <tr v-for="(person, pIndex) in people" :key="`row-${pIndex}`" class="person-row">
                <td v-for="(date, dIndex) in calendarDates" :key="`cell-${pIndex}-${dIndex}`" class="cell data-cell"
                  :class="{
                    'weekend': isWeekend(date),
                    'wfh': getAttendanceStatus(person.id, date).startsWith('WFH'),
                    'off': getAttendanceStatus(person.id, date).startsWith('OFF')
                  }" :style="{ width: cellWidth + 'px' }">
                  <div v-html="getAttendanceStatus(person.id, date)"></div>
                </td>
                <td class="cell stats">{{ getTotalDays(person.id, 'WFH') }}</td>
                <td class="cell stats">{{ getTotalDays(person.id, 'OFF') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import axiosInstance from '@/router/Interceptor';

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

// Refs cho các phần của bảng
const headerRef = ref<HTMLElement | null>(null);
const columnRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const tableWrapperRef = ref<HTMLElement | null>(null);

// Kết quả API
const attendanceData = ref<AttendanceRecord[]>([]);
const people = ref<Person[]>([]);

// Helper to abbreviate full name: e.g. 'Bùi Quang Huy' → 'B.Q Huy'
function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  const last = parts.pop()!;
  const initials = parts.map(p => p[0]).join('.');
  return `${initials}. ${last}`;
}

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
    // 1. Lấy danh sách users và viết tắt tên
    const usersRes = await axiosInstance.get<User[]>('/users');
    people.value = usersRes.data.map(u => ({ id: u.id, name: u.fullName }));

    // 2. Lấy tóm tắt công theo từng user
    const summaryRes = await axiosInstance.get<WorkSummary[]>('/works/work-summary', {
      params: { month: selectedMonth.value, year: selectedYear.value }
    });
    const records: AttendanceRecord[] = [];
    summaryRes.data.forEach(u => u.work.forEach(entry => {
      const start = new Date(entry.fromDate);
      const end = new Date(entry.endDate);
      const curr = new Date(start);
      while (curr <= end) {
        const status = entry.type === 'LEAVE' ? 'OFF' : entry.type;
        records.push({ personId: u.userId, date: formatDate(curr), status, timePeriod: entry.timePeriod });
        curr.setDate(curr.getDate() + 1);
      }
    }));
    attendanceData.value = records;
  } catch (e) {
    console.error('Error fetching attendance data:', e);
  }
}

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get attendance status for a specific person and date
function getAttendanceStatus(personId: number, date: Date): string {
  const dateStr = formatDate(date);
  const record = attendanceData.value.find(
    r => r.personId === personId && r.date === dateStr
  );
  if (!record) return '';

  return `${record.status}<br><small class="time-period">(${record.timePeriod})</small>`;
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

watch([selectedMonth, selectedYear], updateCalendarData);
onMounted(updateCalendarData);

// Improved scroll handler with requestAnimationFrame for performance
let isScrolling = false;
function handleScroll(event: Event) {
  if (!isScrolling) {
    isScrolling = true;

    window.requestAnimationFrame(() => {
      const target = event.target as HTMLElement;

      if (headerRef.value) {
        const headerContainer = headerRef.value.querySelector('.header-container') as HTMLElement | null;
        if (headerContainer) {
          headerContainer.style.transform = `translateX(-${target.scrollLeft}px)`;
        }
      }

      if (columnRef.value) {
        columnRef.value.scrollTop = target.scrollTop;
      }

      isScrolling = false;
    });
  }
}

onMounted(() => {
  // Initialize calendar dates
  initCalendarDates();

  // Initialize attendance data
  fetchAttendanceData();

  // Update container width
  updateContainerWidth();

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
</script>

<style scoped>
.attendance-calendar {
  width: 100%;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.filter-controls {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
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
  background-color: #e6f7ff;
  /* Light yellow-blue color */
  border: 1px solid #91d5ff;
}

.legend-box.off {
  background-color: #ffebee;
  /* Light red color */
  border: 1px solid #ffcdd2;
}

.table-wrapper {
  position: relative;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  height: 600px;
  overflow: hidden;
  box-sizing: border-box;
}

/* Common table styles */
.table {
  margin: 0;
  border-collapse: collapse;
  table-layout: fixed;
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
  background-color: #e6f7ff;
  /* Light yellow-blue color */
  color: #0050b3;
  font-weight: 700;
  font-size: 8px;
}

.data-cell.off {
  background-color: #ffebee;
  /* Light red color */
  color: #c62828;
  font-weight: 700;
  font-size: 8px;
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
  font-size: 11px;
}

/* Fixed elements */
.fixed-corner {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  background-color: white;
  width: 240px !important;
  /* Tổng chiều rộng của cột STT và Họ Tên */
  border-right: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
}

.fixed-corner table,
.fixed-column table {
  width: 240px !important;
}

.fixed-header {
  position: absolute;
  top: 0;
  left: 240px !important;
  /* Chiều rộng của fixed-corner */
  right: 0;
  z-index: 2;
  background-color: white;
  height: 60px;
  /* Set explicit height for header (2 rows of 30px) */
  overflow: hidden;
  /* Prevents scrollbar from appearing */
}

.header-container {
  position: relative;
  will-change: transform;
  /* Optimization for transforms */
}

.fixed-header table {
  width: 100%;
}

.fixed-column {
  position: absolute;
  top: 60px;
  /* Chiều cao của header */
  left: 0;
  bottom: 0;
  width: 240px !important;
  /* Tổng chiều rộng của cột STT và Họ Tên */
  overflow-x: hidden !important;
  overflow-y: auto !important;
  z-index: 1;
  background-color: white;
  border-right: 1px solid #dee2e6;
}

.scrollable-content {
  position: absolute;
  top: 60px;
  /* Chiều cao của header */
  left: 240px !important;
  /* Chiều rộng của fixed-column */
  right: 0;
  bottom: 0;
  overflow-x: hidden !important;
  /* hide horizontal scroll */
  overflow-y: auto !important;
  /* allow vertical scroll */
}

.scrollable-content table {
  width: 100%;
  border-left: none !important;
}

/* Add shadow to indicate scrollable areas */
.fixed-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), transparent);
  pointer-events: none;
}

.fixed-column::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.1), transparent);
  pointer-events: none;
}

/* Ensure all rows have the same height */
.person-row {
  height: 30px;
}

/* Header styles */
.header-cell {
  font-weight: 600;
  background-color: #f8f9fa;
  font-size: 0.75rem;
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