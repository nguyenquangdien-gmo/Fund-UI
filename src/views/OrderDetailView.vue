<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold" style="text-align: center; padding: 1rem;">Chi tiết đặt đồ</h2>
      <div class="p-input-icon-left my-2 d-flex justify-content-between ">
        <!-- <i class="pi pi-search" /> -->
         <div class="d-flex flex-row gap-2">
          <InputText v-model="searchTerm" placeholder="Tìm theo tên người đặt..." />
         </div>
      </div>
    </div>

    <div v-if="filteredOrderItems.length === 0" class="text-center text-gray-500">
      Chưa có đơn hàng nào để hiển thị.
    </div>

    <DataTable
      v-if="filteredOrderItems.length > 0"
      :value="filteredOrderItems"
      paginator
      :rows="10"
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
      <Column field="itemName" header="Tên món" sortable />
      <Column field="size" header="Kích cỡ" sortable />
      <Column field="sugar" header="Đường" sortable />
      <Column field="ice" header="Đá" sortable />
      <Column field="topping" header="Topping" sortable>
        <template #body="{ data }">
          {{ data.topping || 'Không có' }}
        </template>
      </Column>
      <Column field="note" header="Ghi chú" sortable>
        <template #body="{ data }">
          {{ data.note.length > 30 ? data.note.substring(0, 30) + '...' : data.note }}
        </template>
      </Column>
      <Column field="user.fullName" header="Người đặt" sortable />
      <Column field="createdAt" header="Ngày tạo" sortable>
        <template #body="{ data }">
          {{ new Date(data.createdAt).toLocaleDateString() }}
        </template>
      </Column>
      <Column header="Hành động">
        <template #body="{ data }">
          <Button 
        label="Chi tiết" 
        class="p-button-sm p-button-primary" 
        @click="$router.push(`/orders/${data.orderId}`)" 
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted} from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/router/Interceptor'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'


import type { OrderItemResponseDTO } from '@/types/OrderItemResponseDTO'


const orderItems = ref<OrderItemResponseDTO[]>([])
const searchTerm = ref('')
const sortField = ref<string>()
const sortOrder = ref<number>()
const route = useRoute();

const fetchOrders = async () => {
  try {
    const orderId = route.params.id; // Get the order ID from the route parameters
    const response = await axiosInstance.get(`/orders/${orderId}`);
    orderItems.value = response.data
  } catch (error) {
    console.error('Error fetching order items:', error)
  }
}


onMounted(() => {
  fetchOrders();
})

const filteredOrderItems = computed(() =>
  orderItems.value.filter(r => {
    const matchesSearchTerm = r.user.fullName.toLowerCase().includes(searchTerm.value.toLowerCase());
    return matchesSearchTerm;
  })
)
</script>

<style scoped>
.text-red-500 {
  color: #ef4444;
}
</style>