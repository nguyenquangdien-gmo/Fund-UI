<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold" style="text-align: center; padding: 1rem;">Danh sách đặt đồ</h2>
      <div class="p-input-icon-left my-2 d-flex justify-content-between ">
        <!-- <i class="pi pi-search" /> -->
         <div class="d-flex flex-row gap-2">
          <InputText v-model="searchTerm" placeholder="Tìm theo tên quán..." />
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

    <div v-if="filteredOrders.length === 0" class="text-center text-gray-500">
      Chưa có đơn hàng nào để hiển thị.
    </div>

    <DataTable
      v-if="filteredOrders.length > 0"
      :value="filteredOrders"
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
      <!-- <Column field="description" header="Mô tả" sortable>
      <template #body="{ data }">
        {{ data.description.length > 30 ? data.description.substring(0, 30) + '...' : data.description }}
      </template>
      </Column> -->
      <Column field="restaurantName" header="Tên quán" sortable />
      <Column field="createdBy.fullName" header="Người tạo" sortable />
      <Column field="deadline" header="Hạn chót" sortable>
        <template #body="{ data }">
          {{ 
            new Date(data.deadline).toLocaleDateString() === new Date(data.createdAt).toLocaleDateString() 
            ? new Date(data.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : new Date(data.deadline).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) 
          }}
        </template>
      </Column>
      <Column field="createdAt" header="Ngày tạo" sortable>
        <template #body="{ data }">
          {{ new Date(data.createdAt).toLocaleDateString() }}
        </template>
      </Column>
      <Column field="status" header="Trạng thái" sortable>
        <template #body="{ data }">
          <Tag 
            :value="data.status" 
            :severity="data.status === 'COMPLETED' ? 'success' : 'warn'" 
          />
        </template>
      </Column>
      <Column header="Hành động">
        <template #body="{ data }">
          <Button 
            label="Chi tiết" 
            class="p-button-sm p-button-primary" 
            @click="$router.push(`/orders/${data.id}`)" 
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import axiosInstance from '@/router/Interceptor'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'

import { OrderResponseDTO } from '@/types/OrderResponseDTO'


const orders = ref<OrderResponseDTO[]>([])
const searchTerm = ref('')
const sortField = ref<string>()
const sortOrder = ref<number>()
const startDate = ref<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const endDate = ref<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
const toast = useToast()

const fetchOrders = async () => {
  try {
    const response = await axiosInstance.get('/orders', {
      params: {
      startDate: startDate.value ? startDate.value.toISOString() : null,
      endDate: endDate.value ? endDate.value.toISOString() : null,
      },
    })
    orders.value = response.data
  } catch (error) {
    console.error('Error fetching orders:', error)
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
  fetchOrders();
});

onMounted(() => {
  fetchOrders();
})

const filteredOrders = computed(() =>
  orders.value
    .filter(r => {
      const matchesSearchTerm = r.restaurantName.toLowerCase().includes(searchTerm.value.toLowerCase());
      return matchesSearchTerm;
    })
    .sort((a, b) => {
      const createdAtComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (createdAtComparison !== 0) {
      return createdAtComparison;
      }
      return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    })
)


</script>

<style scoped>
.text-red-500 {
  color: #ef4444; /* Tailwind's red-500 color */
}
</style>