<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold" style="text-align: center; padding: 1rem;">DANH SÁCH NHẮC NHỞ</h2>
      <div class="p-input-icon-left my-2 d-flex justify-content-between ">
        <!-- <i class="pi pi-search" /> -->
         <div class="d-flex flex-row gap-2">
          <InputText v-model="searchTerm" placeholder="Tìm theo tiêu đề..." />
          <div class="d-flex flex-row gap-2 align-items-center">
            <div class="d-flex flex-row gap-2 align-items-center">
              <span>Từ ngày:</span>
                <DatePicker showIcon v-model="startDate" type="date" placeholder="Từ ngày" dateFormat="dd/mm/yy" />
            </div>
            <div class="d-flex flex-row gap-2 align-items-center">
              <span>Đến ngày:</span>
                <DatePicker showIcon v-model="endDate" type="date" placeholder="Đến ngày" dateFormat="dd/mm/yy" />
            </div>
          </div>
         </div>
      </div>
    </div>

    <div v-if="filteredSelfReminders.length === 0" class="text-center text-gray-500">
      Chưa có nhắc nhở nào để hiển thị.
    </div>

    <DataTable
      v-if="filteredSelfReminders.length > 0"
      :value="filteredSelfReminders"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      :sortField="sortField"
      :sortOrder="sortOrder"
      responsiveLayout="scroll"
      class="p-datatable-sm"
    >
      <Column header="STT">
      <template #body="{ index }">
        {{ index + 1 }}
      </template>
      </Column>
      <Column field="title" header="Tiêu đề" sortable />
      <Column field="message" header="Nội dung" sortable />
      <Column field="startTime" header="Thời gian bắt đầu" sortable>
      <template #body="{ data }">
        {{ new Date(data.startTime).toLocaleDateString() }}
      </template>
      </Column>
      <Column field="endTime" header="Thời gian kết thúc" sortable>
      <template #body="{ data }">
        {{ new Date(data.endTime).toLocaleDateString() }}
      </template>
      </Column>
      <Column field="notifyHour" header="Giờ nhắc" sortable>
        <template #body="{ data }">
          {{ new Date(`1970-01-01T${data.notifyHour}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }}
        </template>
      </Column>
      <Column field="repeatCount" header="Số lần lặp lại" sortable />
      <Column field="repeatIntervalDays" header="Khoảng cách lặp (ngày)" sortable />
      <Column field="status" header="Trạng thái" sortable>
      <template #body="{ data }">
        <Tag 
        :value="data.status" 
        :severity="data.status === 'COMPLETED' ? 'success' : 
             data.status === 'ACTIVE' ? 'info' : 
             data.status === 'DISABLED' ? 'secondary' : 
             data.status === 'EXPIRED' ? 'danger' : 'warn'" 
        />
      </template>
      </Column>
      <Column field="createdAt" header="Ngày tạo" sortable>
      <template #body="{ data }">
        {{ new Date(data.createdAt).toLocaleDateString() }}
      </template>
      </Column>
    </DataTable>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import axiosInstance from '@/router/Interceptor'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'

import { SelfReminderResponseDTO } from '@/types/SelfReminderResponseDTO'


const selfReminders = ref<SelfReminderResponseDTO[]>([])
const searchTerm = ref('')
const sortField = ref<string>()
const sortOrder = ref<number>()
const startDate = ref<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const endDate = ref<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
const toast = useToast()

const fetchSelfReminders = async () => {
  try {
    const response = await axiosInstance.get('/self-reminders',
      {
        params: {
          startDate: startDate.value ? new Date(startDate.value.getTime() - startDate.value.getTimezoneOffset() * 60000).toISOString() : null,
          endDate: endDate.value ? new Date(endDate.value.getTime() - endDate.value.getTimezoneOffset() * 60000).toISOString() : null,
        },
      }
    );
  
    selfReminders.value = response.data.map((item: SelfReminderResponseDTO) => ({
      ...item,
      startTime: new Date(item.startTime),
      endTime: new Date(item.endTime),
      createdAt: new Date(item.createdAt),
    }));

  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

watch([startDate, endDate], () => {
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    // Show toast notification
    startDate.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Ngày bắt đầu không được lớn hơn ngày kết thúc',
      life: 3000,
    });
    return;
  }
  fetchSelfReminders();
});

onMounted(() => {
  fetchSelfReminders();
})

const filteredSelfReminders = computed(() =>
  selfReminders.value
    .filter(r => {
      const matchesSearchTerm = r.title.toLowerCase().includes(searchTerm.value.toLowerCase());
      return matchesSearchTerm;
    })
    .sort((a, b) => {
      const createdAtComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (createdAtComparison !== 0) {
      return createdAtComparison;
      }
      return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
    })
)


</script>

<style scoped>
.text-red-500 {
  color: #ef4444; /* Tailwind's red-500 color */
}
</style>