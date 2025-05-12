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
         <div class="d-flex gap-2">
            <SplitButton 
              label="Hành động" 
              icon="pi pi-plus" 
              :model="[
              { label: 'Thêm quán nước', icon: 'pi pi-plus', command: openDialog },
              { label: 'Tạo order', icon: 'pi pi-calendar', command: placeOrder }
              ]" 
            />
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
      <Column field="details.length" header="Số lượng đặt" sortable>
        <template #body="{ data }">
          {{ data.details.length }}
        </template>
      </Column>
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
          {{ new Date(data.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}
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


    <!-- Add restaurant -->
    <Dialog v-model:visible="isDialogVisible" header="Thêm Quán Nước" :style="{ width: '400px' }">
      <form @submit.prevent="addRestaurant" class="flex flex-col space-y-4">
      <div class="d-flex align-items-center justify-content-between p-2">
        <label for="name" class="mb-2">Tên Quán<span class="text-red-500">*</span></label>
        <InputText v-model="restaurant.name" id="name" required />
      </div>
      <div class="d-flex align-items-center justify-content-between p-2">
        <label for="link" class="mb-2">Link Quán<span class="text-red-500">*</span></label>
        <InputText v-model="restaurant.link" id="link" placeholder="Nhập link quán..." required />
      </div>
      <div class="d-flex align-items-center justify-content-between p-2">
        <label for="type" class="mb-2">Loại Quán<span class="text-red-500">*</span></label>
        <Dropdown 
        v-model="restaurant.type" 
        optionLabel="label"
        optionValue="value"
        :options="[
          { label: 'Quán nước', value: RestaurantType.DRINK },
          { label: 'Quán ăn', value: RestaurantType.FOOD },
          { label: 'Cả hai', value: RestaurantType.BOTH }
        ]" 
        id="type" 
        placeholder="Chọn loại quán" 
        required 
        style="width: 60%;"
        />
      </div>
      <div class="d-flex align-items-center justify-content-end space-x-2 p-2">
        <Button label="Hủy" icon="pi pi-times" @click="closeDialog" class="p-button-text" />
        <Button label="Lưu" icon="pi pi-check" type="submit" />
      </div>
      </form>
    </Dialog>


        <!-- Create Order -->
        <Dialog v-model:visible="isOrderDialogVisible" header="Tạo Order" :style="{ width: '480px' }">
      <form @submit.prevent="createOrder" class="flex flex-col space-y-4">
        <div class="p-2">
          <label for="restaurantId" class="mb-2">Lựa chọn</label>
          <div class="d-flex align-items-center justify-content-between p-2">
                <div class="form-check mb-2">
                  <input class="form-check-input" type="radio" id="selectExisting" value="select" v-model="selectMode" />
                  <label class="form-check-label" for="selectExisting">Chọn quán có sẵn</label>
                </div>

                <div class="form-check mb-2">
                  <input class="form-check-input" type="radio" id="inputNew" value="input" v-model="selectMode" />
                  <label class="form-check-label" for="inputNew">Nhập link quán ngoài</label>
                </div>
            </div>
        </div>

            
        <div class="d-flex align-items-center justify-content-between p-2">
            <label for="restaurantId" class="mb-2">Quán<span class="text-red-500">*</span></label>
            <div v-if="selectMode === 'select'" class="d-flex align-items-center justify-content-end gap-2" style="width: 60%;">
              <Dropdown
                v-model="order.restaurantId" 
                optionLabel="label"
                optionValue="value"
                :options="groupedRestaurants" 
                id="restaurantId" 
                placeholder="Chọn quán" 
                required 
                optionGroupLabel="label"
                optionGroupChildren="items"
                style="width: 70%;"
              >
                <template #optiongroup="slotProps">
                  <div class="flex align-items-center">
                    <i :class="slotProps.option.icon" style="margin-right: 0.5rem"></i>
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </Dropdown>
              <Button 
                  icon="pi pi-random" 
                  @click="randomRestaurant" 
                  tooltip="Chọn quán ngẫu nhiên"
                  class="p-button-outlined"
                >
                <i class="pi pi-sync" style="padding: 0.2rem 0;"></i>
              </Button>
            </div>
            <div v-else style="width: 53%;" >
                <InputText 
                  v-model="otherRestaurantLink" 
                  placeholder="Nhập link quán ngoài..." 
                  style="width: 100%;" 
                />
            </div>
        </div>

        <!--  -->
        <div class="d-flex align-items-center justify-content-between p-2">
          <label for="title" class="mb-2">Tiêu đề<span class="text-red-500">*</span></label>
          <InputText v-model="order.title" id="title" placeholder="Nhập tiêu đề..." required style="width: 53%;" />
        </div>
        <div class="d-flex align-items-center justify-content-between p-2">
          <label for="description" class="mb-2">Mô tả</label>
          <InputText v-model="order.description" id="description" placeholder="Nhập mô tả..." style="width: 53%;" />
        </div>
        <div class="d-flex align-items-center justify-content-between p-2">
          <!-- <label for="relatedUserIds" class="mb-2">Người liên quan<span class="text-red-500">*</span></label> -->
          <label for="relatedUserIds" class="mb-2">Người liên quan</label>
          <MultiSelect
            filter
            v-model="order.relatedUserIds"
            :options="user"
            optionLabel="fullName"
            optionValue="id"
            placeholder="Chọn thành viên"
            style="width: 53%;"
          />
        </div>
        <div class="d-flex align-items-center justify-content-between p-2">
          <label for="deadline" class="mb-2">Hạn chót<span class="text-red-500">*</span></label>
            <DatePicker 
              v-model="order.deadline" 
              id="deadline" 
              dateFormat="dd/mm/yy" 
              showTime 
              showIcon 
              required 
              style="width: 53%;" 
              :minDate="new Date()" 
            />
        </div>
        <div class="d-flex align-items-center justify-content-end space-x-2 p-2">
          <Button label="Hủy" icon="pi pi-times" @click="closeOrderDialog" class="p-button-text" />
          <Button label="Lưu" icon="pi pi-check" type="submit" />
        </div>
      </form>
    </Dialog>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'
import axiosInstance from '@/router/Interceptor'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import { SplitButton } from 'primevue'
import { OrderResponseDTO } from '@/types/OrderResponseDTO'
import type { RestaurantRequestDTO } from '@/types/RestaurantRequestDTO'
import type { OrderRequestDTO  } from '@/types/OrderRequestDTO'
import { RestaurantType } from '@/types/RestaurantRequestDTO'
import { RestaurantResponseDTO } from '@/types/RestaurantResponseDTO'
import type { User } from '@/types/User'
import router from '@/router'

const user = ref<User[]>([])
const orders = ref<OrderResponseDTO[]>([])
const restaurants = ref<RestaurantResponseDTO[]>([])
const searchTerm = ref('')
const sortField = ref<string>()
const sortOrder = ref<number>()
const startDate = ref<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const endDate = ref<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
const toast = useToast()
const isDialogVisible = ref(false);
const isOrderDialogVisible = ref(false);
const selectMode = ref<'select' | 'input'>('select');
const otherRestaurantLink = ref('');
const usedRestaurantIds = ref<number[]>([]);
const restaurant = ref<RestaurantRequestDTO>({
  name: '',
  link: '',
  type: RestaurantType.BOTH, // Updated to use RestaurantType enum
});
const order = ref<OrderRequestDTO>({
  title: '',
  description: '',
  deadline: new Date(new Date().setHours(15, 0, 0, 0)),
  restaurantId: null,
  relatedUserIds: [],
});

const fetchOrders = async () => {
  try {
    const response = await axiosInstance.get('/orders', {
      params: {
        startDate: startDate.value ? startDate.value.toISOString() : null,
        endDate: endDate.value ? endDate.value.toISOString() : null,
      },
    });
    const fetchedOrders = response.data;

    // Fetch details for each order
    const detailedOrders = await Promise.all(
      fetchedOrders.map(async (order: OrderResponseDTO) => {
        const detailsResponse = await axiosInstance.get(`/orders/${order.id}/details`);
        return { ...order, details: detailsResponse.data };
      })
    );

    orders.value = detailedOrders;
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
  fetchOrders();
});

const fetchRestaurants = async () => {
  try {
    const response = await axiosInstance.get('/restaurants') // API lấy danh sách team
    restaurants.value = response.data
  } catch (error) {
    console.error('Error fetching restaurants:', error)
  }
}

const fetchUsers = async () => {
  try {
    const response = await axiosInstance.get(`/users`)
    user.value = response.data.map((user: { id: number; fullName: string }) => ({
      id: user.id,
      fullName: `${user.id} - ${user.fullName}`,
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

onMounted(() => {
  fetchOrders();
  fetchUsers();
  fetchRestaurants();
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

const resetUsedRestaurants = () => {
  usedRestaurantIds.value = [];
  toast.add({
    severity: 'warn',
    summary: 'Làm mới',
    detail: 'Danh sách quán đã được làm mới!',
    life: 3000,
  });
};

const randomRestaurant = () => {
  let availableRestaurants = restaurants.value.filter(
    (restaurant) => !usedRestaurantIds.value.includes(restaurant.id)
  );

  if (availableRestaurants.length === 0) {
    resetUsedRestaurants();
    availableRestaurants = restaurants.value;
  }

  const randomIndex = Math.floor(Math.random() * availableRestaurants.length);
  const selectedRestaurant = availableRestaurants[randomIndex];
  order.value.restaurantId = selectedRestaurant.id;
  usedRestaurantIds.value.push(selectedRestaurant.id);

  toast.add({
    severity: 'info',
    summary: 'Ngẫu nhiên',
    detail: `Đã chọn quán: ${selectedRestaurant.name}`,
    life: 3000,
  });
};

const groupedRestaurants = computed(() => {
  const groups: { label: string; icon: string; items: { label: string; value: number }[] }[] = [
    { label: 'Quán nước', icon: 'pi pi-fw pi-inbox', items: [] },
    { label: 'Quán ăn', icon: 'pi pi-fw pi-server', items: [] },
    { label: 'Cả hai', icon: 'pi pi-fw pi-briefcase', items: [] }
  ];

  restaurants.value.forEach(restaurant => {
    const item = { label: restaurant.name, value: restaurant.id };

    if (restaurant.type === 'DRINK') {
      groups[0].items.push(item);
    } else if (restaurant.type === 'FOOD') {
      groups[1].items.push(item);
    } else {
      groups[2].items.push(item);
    }
  });

  return groups.filter(group => group.items.length > 0);
});

 // Mở Dialog
 const openDialog = () => {
  isDialogVisible.value = true;
};

// Đóng Dialog
const closeDialog = () => {
  isDialogVisible.value = false;
  // Reset dữ liệu sau khi đóng dialog
  restaurant.value.name = '';
  restaurant.value.link = '';
};

// Thêm quán nước và gửi API
const addRestaurant = async () => {
  try {
    const response = await axiosInstance.post('restaurants', restaurant.value);
    if (response && response.status === 200) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Quán nước đã được thêm!', life: 3000 });
      closeDialog();
      router.push('/restaurants');
    } else {
      toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không thể thêm quán nước!', life: 3000 });
    }

  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Quán đã tồn tại!', life: 3000 });
    } else {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể thêm quán nước!', life: 3000 });
    }
  }
};

const placeOrder = () => {
  isOrderDialogVisible.value = true;
};

const closeOrderDialog = () => {
  isOrderDialogVisible.value = false;
  // Reset dữ liệu sau khi đóng dialog
  order.value = {
    title: '',
    description: '',
    deadline: new Date(),
    restaurantId: null,
    relatedUserIds: [],
  };
};

const validateFields = () => {
    if (selectMode.value === 'select' && !order.value.restaurantId) return 'Vui lòng chọn quán!';
    if (!order.value.title) return 'Tiêu đề là bắt buộc.';
    if (!order.value.deadline) return 'Hạn chót là bắt buộc.';
    if (selectMode.value === 'input' && !otherRestaurantLink.value) return 'Vui lòng nhập link quán!';
    return null;
};

const createOrder = async () => {
  const error = validateFields();
  if (error) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: error, life: 3000 });
    return;
  }
  try {
    if (selectMode.value === 'input') {
      const slug = otherRestaurantLink.value.split('/').pop()?.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || '';
      const newRestaurant = { name: slug, link: otherRestaurantLink.value, type: RestaurantType.BOTH };
      const restaurantResponse = await axiosInstance.post('restaurants', newRestaurant);
      order.value.restaurantId = restaurantResponse.data.id;
    }

    if (order.value.deadline) {
      const deadline = new Date(order.value.deadline);

      // Cộng thêm 7 giờ (7 * 60 * 60 * 1000 ms)
      deadline.setTime(deadline.getTime() + (7 * 60 * 60 * 1000));

      // Gán lại vào order
      order.value.deadline = deadline;
    }
  
    const response = await axiosInstance.post('/orders', order.value);
    if (response && response.status === 201) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Order đã được tạo!', life: 3000 });
      closeOrderDialog();
      fetchOrders();
    } else {
      throw new Error('Không thể tạo order!');
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo order!', life: 3000 });
  }
};
</script>

<style scoped>
.text-red-500 {
  color: #ef4444; /* Tailwind's red-500 color */
}
</style>