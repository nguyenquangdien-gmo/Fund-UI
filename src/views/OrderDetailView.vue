<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <div class="p-4 border rounded shadow-md bg-white">
        <h3 class="h4 mb-4 font-weight-bold">Thông tin đơn</h3>
        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <span class="font-weight-bold">Người tạo: </span>
              <span>{{ order.createdBy?.fullName || 'N/A' }}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <span class="font-weight-bold">Ngày tạo: </span>
              <span>{{ order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A' }}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <span class="font-weight-bold">Link đặt: </span>
              <a :href="order.restaurantLink" target="_blank" rel="noopener noreferrer">
                {{ order.restaurantName || 'N/A' }}
              </a>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <span class="font-weight-bold">Hạn chót: </span>
              <span>
                {{ 
                  order.deadline 
                  ? new Date(order.deadline).toLocaleDateString() === new Date(order.createdAt).toLocaleDateString() 
                  ? new Date(order.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : new Date(order.deadline).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) 
                  : 'N/A' 
                }}
                </span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <span class="font-weight-bold">Trạng thái: </span>
              <span>{{ order.status || 'N/A' }}</span>
            </div>
          </div>
          <div class="col-md-12">
            <div class="mb-3">
              <span class="font-weight-bold">Mô tả: </span>
              <span>{{ order.description || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
      <h2 class="text-2xl font-semibold" style="text-align: center; padding: 1rem;">Chi tiết đặt đồ</h2>
      <div class="p-input-icon-left my-2 d-flex justify-content-between ">
        <!-- <i class="pi pi-search" /> -->
         <div class="d-flex flex-row gap-2">
          <InputText v-model="searchTerm" placeholder="Tìm theo tên người đặt..." />
         </div>
         <Button 
          v-if="!isDeadline"
          label="Đặt đồ" 
          class="p-button-sm p-button-success" 
          icon="pi pi-plus" 
          iconPos="left" 
          @click="openOrderDialog" 
          />
      </div>
    </div>

    <div v-if="filteredOrderItems.length === 0" class="text-center text-gray-500">
      Chưa có đơn hàng nào để hiển thị.
    </div>

    <DataTable
      v-if="numberedOrderItems.length > 0"     
      :value="numberedOrderItems"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      :sortField="sortField"
      :sortOrder="sortOrder"
      responsiveLayout="scroll"
      :rowClass="rowClass"
      class="p-datatable-sm"
    >
      <!-- Cột STT -->
      <Column header="STT">
        <template #body="{ index }">
          {{ index + 1 }}
        </template>
      </Column>

      <!-- Các cột còn lại giữ nguyên như bạn cũ -->
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

      <!-- Cột Hành động (nếu user chính mình thì cho sửa) -->
      <Column header="Hành động">
        <template #body="{ data }">
            <template v-if="isDeadline && data.user.id === users?.id">
              <div class="d-flex flex-row gap-2">
                <Button 
                label="Đánh giá" 
                class="p-button-sm p-button-info" 
                icon="pi pi-star" 
                iconPos="left" 
                @click="rateOrder(data.id)" 
              />
              <Button 
                label="Like" 
                class="p-button-sm p-button-success" 
                icon="pi pi-thumbs-up" 
                iconPos="left" 
                @click="likeOrder(data.id)" 
              />
              <Button 
                label="Dislike" 
                class="p-button-sm p-button-danger" 
                icon="pi pi-thumbs-down" 
                iconPos="left" 
                @click="dislikeOrder(data.id)" 
              />
              </div>
            </template>
            <template v-else>
              <Button 
                v-if="data.user.id === users?.id" 
                label="Sửa" 
                class="p-button-sm p-button-warning" 
                icon="pi pi-pencil" 
                iconPos="left" 
                @click="openEditDialog(data.id)" 
              />
            </template>
        </template>
      </Column>
    </DataTable>



    <Dialog 
      header="Tạo đơn hàng mới" 
      v-model:visible="isDialogVisible" 
      :modal="true" 
      :closable="true" 
      :style="{ width: '400px' }"
    >
      <div class="p-fluid">
        <div class="field d-flex align-items-center justify-content-between p-2">
            <label for="name">Tên món<span class="text-red-500">*</span></label>
            <InputText id="name" v-model="newOrder.itemName" placeholder="Nhập tên món" required />
          </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="size">Kích cỡ</label>
            <Dropdown 
            id="size" 
            v-model="newOrder.size" 
            :options="['S', 'M', 'L']" 
            placeholder="Chọn kích cỡ"
            style="width: 61%;"
            />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="sugar">Đường</label>
            <Dropdown 
            id="sugar" 
            v-model="newOrder.sugar" 
            :options="['Không đường', '30%', '50%', '70%', '100%']" 
            placeholder="Chọn lượng đường" 
            style="width: 61%;"
            />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="ice">Đá</label>
            <Dropdown 
            id="ice" 
            v-model="newOrder.ice" 
            :options="['Không đá', '30%', '50%', '70%', '100%', 'Đá riêng']" 
            placeholder="Chọn lượng đá" 
            style="width: 61%;"
            />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="topping">Topping</label>
          <InputText id="topping" v-model="newOrder.topping" placeholder="Nhập topping" />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="note">Ghi chú</label>
          <InputText id="note" v-model="newOrder.note" placeholder="Nhập ghi chú" />
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" class="p-button-text" @click="isDialogVisible = false" />
        <Button label="Lưu" class="p-button-success" @click="saveOrder" />
      </template>
    </Dialog>


    <Dialog 
      header="Chỉnh sửa đơn hàng" 
      v-model:visible="isEditDialogVisible" 
      :modal="true" 
      :closable="true" 
      :style="{ width: '400px' }"
    >
      <div class="p-fluid">
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editName">Tên món<span class="text-red-500">*</span></label>
          <InputText id="editName" v-model="editOrder.itemName" placeholder="Nhập tên món" required />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editSize">Kích cỡ</label>
          <Dropdown 
            id="editSize" 
            v-model="editOrder.size" 
            :options="['S', 'M', 'L']" 
            placeholder="Chọn kích cỡ"
            style="width: 61%;"
          />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editSugar">Đường</label>
          <Dropdown 
            id="editSugar" 
            v-model="editOrder.sugar" 
            :options="['Không đường', '30%', '50%', '70%', '100%']" 
            placeholder="Chọn lượng đường" 
            style="width: 61%;"
          />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editIce">Đá</label>
          <Dropdown 
            id="editIce" 
            v-model="editOrder.ice" 
            :options="['Không đá', '30%', '50%', '70%', '100%', 'Đá riêng']" 
            placeholder="Chọn lượng đá" 
            style="width: 61%;"
          />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editTopping">Topping</label>
          <InputText id="editTopping" v-model="editOrder.topping" placeholder="Nhập topping" />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editNote">Ghi chú</label>
          <InputText id="editNote" v-model="editOrder.note" placeholder="Nhập ghi chú" />
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" class="p-button-text" @click="isEditDialogVisible = false" />
        <Button label="Cập nhật" class="p-button-success" @click="updateOrder" />
      </template>
    </Dialog>

    <Dialog 
      header="Đánh giá đơn hàng" 
      v-model:visible="isRatingDialogVisible" 
      :modal="true" 
      :closable="true" 
      :style="{ width: '400px' }"
    >
      <div class="p-fluid">
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="rating">Đánh giá<span class="text-red-500">*</span></label>
          <Dropdown 
            id="rating" 
            v-model="ratingRequest.rating" 
            :options="[1, 2, 3, 4, 5]" 
            placeholder="Chọn số sao" 
            style="width: 61%;"
          />
        </div>
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="ratingNote">Ghi chú</label>
          <InputText id="ratingNote" v-model="ratingRequest.note" placeholder="Nhập ghi chú (tùy chọn)" />
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" class="p-button-text" @click="isRatingDialogVisible = false" />
        <Button label="Gửi" class="p-button-success" @click="submitRating" />
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted} from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/router/Interceptor'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import { useToast } from 'primevue'

import type { OrderItemResponseDTO } from '@/types/OrderItemResponseDTO'
import type { OrderItemRequestDTO } from '@/types/OrderItemRequestDTO'
import type { OrderResponseDTO } from '@/types/OrderResponseDTO'
import { OrderItemFeedbackRequestDTO } from '@/types/OrderItemFeedbackRequestDTO'
import { OrderItemVoteRequestDTO } from '@/types/OrderItemVoteRequestDTO'
import { useUserStore } from '@/pinia/userStore'


const orderItems = ref<OrderItemResponseDTO[]>([])
const order = ref<OrderResponseDTO>({})
const searchTerm = ref('')
const sortField = ref<string>()
const sortOrder = ref<number>()
const route = useRoute();
const isDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const isRatingDialogVisible = ref(false)
const usersStore = useUserStore();
const toast = useToast()

const isDeadline = computed(() => {
  const deadlineDate = new Date(order.value.deadline);
  const currentDate = new Date();
  return deadlineDate < currentDate;
});

const users = computed(() => usersStore.user);


const newOrder = ref<OrderItemRequestDTO>({
  orderId: Array.isArray(route.params.id) ? route.params.id[0] : route.params.id, // Ensure orderId is a string
  itemName: '',
  size: '',
  sugar: '',
  ice: '',
  topping: '',
  note: ''
})

const editOrder = ref<OrderItemRequestDTO>({
  orderId: '',
  itemName: '',
  size: '',
  sugar: '',
  ice: '',
  topping: '',
  note: ''
})

const ratingRequest = ref<OrderItemVoteRequestDTO>({
  orderItemId: '',
  rating: 5,
  note: ''
})

const fetchOrders = async () => {
  try {
    const orderId = route.params.id; // Get the order ID from the route parameters
    const response = await axiosInstance.get(`/orders/${orderId}/details`);
    orderItems.value = response.data
  } catch (error) {
    console.error('Error fetching order items:', error)
  }
}

const fetchOrder = async () => {
  try {
    const orderId = route.params.id;
    const response = await axiosInstance.get(`/orders/${orderId}`);
    order.value = response.data;
  } catch (error) {
    console.error('Error fetching order:', error);
  }
};


onMounted(() => {
  fetchOrders();
  fetchOrder();

})

const filteredOrderItems = computed(() =>
  [...orderItems.value]
    .filter(r => {
      const matchesSearchTerm = r.user.fullName.toLowerCase().includes(searchTerm.value.toLowerCase());
      return matchesSearchTerm;
    })
    .sort((a, b) => a.itemName.localeCompare(b.itemName))
);

const splitOrderItems = (items: OrderItemResponseDTO[]) => {
  const groups: OrderItemResponseDTO[][] = [];
  const temp = [...items];

  while (temp.length > 0) {
    const groupSize = temp.length <= 7 ? temp.length : Math.min(7, Math.ceil(temp.length / Math.ceil(temp.length / 7)));
    groups.push(temp.splice(0, groupSize));
  }

  return groups;
};

// 3. Gán số thứ tự và nhóm đơn
const numberedOrderItems = computed(() => {
  const groups = splitOrderItems(filteredOrderItems.value);
  const result: OrderItemResponseDTO[] = [];
  groups.forEach((group, groupIndex) => {
    group.forEach((item) => {
      result.push({
        ...item,
        orderNumber: groupIndex + 1, // Đơn số mấy
      });
    });
  });
  return result;
});

const rowClass = (data: OrderItemResponseDTO) => {
  const colors = ['bg-white', 'bg-gray-100', 'bg-yellow-50', 'bg-green-50', 'bg-blue-50', 'bg-pink-50'];
  return colors[((data.orderNumber ?? 1) - 1) % colors.length] || 'bg-white';
};



const openOrderDialog = () => {
  isDialogVisible.value = true;
};

const saveOrder = async () => {
  try {
    const orderId = route.params.id; // Get the order ID from the route parameters
    await axiosInstance.post(`/orders/${orderId}`, newOrder.value);
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đơn hàng đã được tạo!', life: 3000 });
    isDialogVisible.value = false;
    newOrder.value = {
      orderId: Array.isArray(route.params.id) ? route.params.id[0] : route.params.id,
      itemName: '',
      size: '',
      sugar: '',
      ice: '',
      topping: '',
      note: ''
    };
    await fetchOrders();
  } catch (error) {
    console.error('Error saving order:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo đơn hàng!', life: 3000 });
  }
};

const openEditDialog = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/order-items/${id}`);
    editOrder.value = response.data;
    isEditDialogVisible.value = true;
  } catch (error) {
    console.error('Error fetching order item:', error);
  }
};

const rateOrder = (id: string) => {
  ratingRequest.value.orderItemId = id;
  ratingRequest.value.rating = 5;
  ratingRequest.value.note = '';
  isRatingDialogVisible.value = true;
};

const submitRating = async () => {
  try {
    await axiosInstance.post(`/order-item-vote`, ratingRequest.value);
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đánh giá của bạn đã được gửi!', life: 3000 });
    isRatingDialogVisible.value = false;
    fetchOrders();
  } catch (error) {
    console.error('Error submitting rating:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể gửi đánh giá!', life: 3000 });
  }
};


const updateOrder = async () => {
  try {
    await axiosInstance.put(`/order-items/${editOrder.value.id}`, editOrder.value);
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đơn hàng đã được cập nhật!', life: 3000 });
    isEditDialogVisible.value = false;
    fetchOrders();
  } catch (error) {
    console.error('Error updating order:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể cập nhật đơn hàng!', life: 3000 });
  }
};

const likeOrder = async (id: string) => {
  try {
    const feedback = new OrderItemFeedbackRequestDTO(Number(id), 1); // 1 = like
    await axiosInstance.post(`/order-item-feedback`, feedback);
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Bạn đã thích đơn hàng này!', life: 3000 });
    fetchOrders();
  } catch (error) {
    console.error('Error liking order:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể thích đơn hàng!', life: 3000 });
  }
};

const dislikeOrder = async (id: string) => {
  try {
    const feedback = new OrderItemFeedbackRequestDTO(Number(id), -1); // -1 = dislike
    await axiosInstance.post(`/order-item-feedback`, feedback);
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Bạn đã không thích đơn hàng này!', life: 3000 });
    fetchOrders();
  } catch (error) {
    console.error('Error disliking order:', error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể không thích đơn hàng!', life: 3000 });
  }
};

</script>

<style scoped>
.text-red-500 {
  color: #ef4444;
}
:deep(.bg-white) {
  background-color: #ffffff !important;
}

:deep(.bg-gray-100) {
  background-color: #f3f4f6 !important;
}

:deep(.bg-yellow-50) {
  background-color: #fef3c7 !important;
}

:deep(.bg-green-50) {
  background-color: #d1fae5 !important;
}

:deep(.bg-blue-50) {
  background-color: #dbeafe !important;
}

:deep(.bg-pink-50) {
  background-color: #fde2e2 !important;
}
</style>