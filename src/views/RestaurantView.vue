<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold" style="text-align: center; padding: 1rem;">Danh sách quán ăn</h2>
      <div class="p-input-icon-left my-2 d-flex justify-content-between ">
        <!-- <i class="pi pi-search" /> -->
         <div class="d-flex gap-2">
          <InputText v-model="searchTerm" placeholder="Tìm theo tên quán..." />
          <Dropdown 
            v-model="filterType" 
            optionLabel="label"
            optionValue="value"
            :options="[
              { label: 'Tất cả', value: null },
              { label: 'Quán nước', value: RestaurantType.DRINK },
              { label: 'Quán ăn', value: RestaurantType.FOOD },
              { label: 'Cả hai', value: RestaurantType.BOTH }
            ]" 
            placeholder="Loại quán" 
          />
         </div>

        <div class="d-flex gap-2">
            <Button label="Thêm quán nước" icon="pi pi-plus" @click="openDialog" />
            <Button label="Danh sách order" icon="pi pi-list" class="p-ml-2" @click="$router.push('/orders')" />
            <Button label="Tạo order" icon="pi pi-calendar" class="p-ml-2" @click="placeOrder" />
        </div>
      </div>
    </div>

    <div v-if="filteredRestaurants.length === 0" class="text-center text-gray-500">
      Chưa có quán nào để hiển thị. Hãy thêm quán nào.
    </div>

    <DataTable
      v-if="filteredRestaurants.length > 0"
      :value="filteredRestaurants"
      paginator
      :rows="10"
      :sortField="sortField"
      :sortOrder="sortOrder"
      responsiveLayout="scroll"
      class="p-datatable-sm"
    >
    <Column header="ID">
      <template #body="{ index }">
      {{ index + 1 }}
      </template>
    </Column>
      <Column field="name" header="Tên quán" sortable />
      <Column field="type" header="Loại quán" sortable>
        <template #body="{ data }">
          {{ data.type === 'DRINK' ? 'Quán nước' : data.type === 'FOOD' ? 'Quán ăn' : 'Cả hai' }}
        </template>
      </Column>
      <Column field="link" header="Link quán" sortable>
        <template #body="{ data }">
          <a :href="data.link" target="_blank" class="text-blue-500 underline">
            {{ data.link.length > 30 ? data.link.substring(0, 30) + '...' : data.link }}
          </a>
        </template>
      </Column>
      <Column field="totalStars" header="Đánh giá" sortable>
        <template #body="{ data }">
          <div class="d-flex align-items-center">
            <i
              v-for="star in 5"
              :key="star"
              class="pi"
              :class="{
                'pi-star-fill text-warning': star <= Math.floor(Number(getAverageStar(data))),
                'pi-star-half text-warning': star === Math.ceil(Number(getAverageStar(data))) && Number(getAverageStar(data)) % 1 >= 0.5,
              }"
            ></i>
          </div>
        </template>
      </Column>
      <Column field="orderCount" header="Số lần order" sortable />
      <!-- <Column header="Thao tác">
        <template #body="{ data }">
            <div class="flex space-x-2">
                <Button
                  icon="pi pi-thumbs-up"
                  class="p-button-rounded p-button-success"
                  size="small"
                  style="margin-right: 0.5rem;"
                  @click="likeRestaurant(data)"
                />
                <Button
                  icon="pi pi-thumbs-down"
                  class="p-button-rounded p-button-danger"
                  size="small"
                  @click="dislikeRestaurant(data)"
                />
            </div>
        </template>
      </Column> -->
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

        <div class="d-flex align-items-center justify-content-between p-2">
            <label for="restaurantId" class="mb-2">Quán<span class="text-red-500">*</span></label>
            <div class="d-flex align-items-center justify-content-end gap-2" style="width: 60%;">
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
                  <i class="pi pi-spin pi-spinner" style="padding: 0.2rem 0;"></i>
              </Button>
            </div>
        </div>

        <div class="d-flex align-items-center justify-content-between p-2">
          <label for="title" class="mb-2">Tiêu đề<span class="text-red-500">*</span></label>
          <InputText v-model="order.title" id="title" placeholder="Nhập tiêu đề..." required style="width: 53%;" />
        </div>
        <div class="d-flex align-items-center justify-content-between p-2">
          <label for="description" class="mb-2">Mô tả<span class="text-red-500">*</span></label>
          <InputText v-model="order.description" id="description" placeholder="Nhập mô tả..." required style="width: 53%;" />
        </div>
        <div class="d-flex align-items-center justify-content-between p-2">
          <label for="relatedUserIds" class="mb-2">Người liên quan<span class="text-red-500">*</span></label>
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
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import axiosInstance from '@/router/Interceptor'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import { DatePicker } from 'primevue'
import MultiSelect from 'primevue/multiselect'
import { useToast } from 'primevue/usetoast'

import { RestaurantResponseDTO } from '@/types/RestaurantResponseDTO'
import type { RestaurantRequestDTO } from '@/types/RestaurantRequestDTO'
import type { OrderRequestDTO  } from '@/types/OrderRequestDTO'
import { RestaurantType } from '@/types/RestaurantRequestDTO'
import type { User } from '@/types/User'

const user = ref<User[]>([])

const restaurants = ref<RestaurantResponseDTO[]>([])
const isDialogVisible = ref(false);
const searchTerm = ref('')
const filterType = ref(null)
const sortField = ref<string>()
const sortOrder = ref<number>()
const toast = useToast()
const order = ref<OrderRequestDTO>({
  title: '',
  description: '',
  deadline: new Date(new Date().setHours(15, 0, 0, 0)),
  restaurantId: null,
  relatedUserIds: [],
});

const restaurant = ref<RestaurantRequestDTO>({
  name: '',
  link: '',
  type: RestaurantType.BOTH, // Updated to use RestaurantType enum
});

const isOrderDialogVisible = ref(false);

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
  fetchRestaurants();
  fetchUsers();
})

const filteredRestaurants = computed(() =>
  restaurants.value.filter(r => {
    const matchesSearchTerm = r.name.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchesFilterType = filterType.value === null || r.type === filterType.value;
    return matchesSearchTerm && matchesFilterType;
  })
)

const getAverageStar = (restaurant: RestaurantResponseDTO) => {
  return restaurant.totalVotes > 0
    ? restaurant.totalStars / restaurant.totalVotes
    : 0;  // Nếu không có bình chọn, trả về 0
}

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
    console.log('response', response);

    if (response && response.status === 200) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Quán nước đã được thêm!', life: 3000 });
      closeDialog();
      fetchRestaurants();
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


const createOrder = async () => {
  try {
    console.log("order", order.value);
    const response = await axiosInstance.post('/orders', order.value);
    if (response && response.status === 201) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Order đã được tạo!', life: 3000 });
      closeOrderDialog();
    } else {
      toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không thể tạo order!', life: 3000 });
    }
  } catch (error: unknown) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo order!', life: 3000 });
  }
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

const usedRestaurantIds = ref<number[]>([]);

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

const resetUsedRestaurants = () => {
  usedRestaurantIds.value = [];
  toast.add({
    severity: 'warn',
    summary: 'Làm mới',
    detail: 'Danh sách quán đã được làm mới!',
    life: 3000,
  });
};


// const likeRestaurant = async (restaurant: RestaurantResponseDTO) => {
//   try {
//     const feedbackData = new RestaurantFeedbackRequestDto(restaurant.id, 1); // 1 = like
//     const response = await axiosInstance.post('/feedback', feedbackData);
//     if (response && response.status === 200) {
//       toast.add({ severity: 'success', summary: 'Thành công', detail: 'Bạn đã thích quán nước này!', life: 3000 });
//       fetchRestaurants(); // Refresh the list
//     } else {
//       toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không thể thích quán nước này!', life: 3000 });
//     }
//   } catch {
//     toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể thích quán nước này!', life: 3000 });
//   }
// };

// const dislikeRestaurant = async (restaurant: RestaurantResponseDTO) => {
//   try {
//     const feedbackData = new RestaurantFeedbackRequestDto(restaurant.id, -1); // -1 = dislike
//     const response = await axiosInstance.post('/feedback', feedbackData);
//     if (response && response.status === 200) {
//       toast.add({ severity: 'success', summary: 'Thành công', detail: 'Bạn đã không thích quán nước này!', life: 3000 });
//       fetchRestaurants(); // Refresh the list
//     } else {
//       toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không thể không thích quán nước này!', life: 3000 });
//     }
//   } catch {
//     toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể không thích quán nước này!', life: 3000 });
//   }
// };

</script>

<style scoped>
.text-red-500 {
  color: #ef4444; /* Tailwind's red-500 color */
}
</style>