<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold" style="text-align: center; padding: 1rem;">Danh sách quán ăn</h2>
      <div class="p-input-icon-left my-2 d-flex justify-content-between ">
        <!-- <i class="pi pi-search" /> -->
        <InputText v-model="searchTerm" placeholder="Tìm theo tên quán..." />
        <div>
            <Button label="Thêm quán nước" icon="pi pi-plus" @click="openDialog" />
            <!-- <Button label="Tạo order" icon="pi pi-calendar" class="p-ml-2" @click="placeOrder" /> -->
        </div>
      </div>
    </div>

    <DataTable
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
      <Column field="link" header="Link quán" sortable>
        <template #body="{ data }">
          <a :href="data.link" target="_blank" class="text-blue-500 underline">
            {{ data.link.length > 30 ? data.link.substring(0, 30) + '...' : data.link }}
          </a>
        </template>
      </Column>
      <Column field="orderCount" header="Số lần order" sortable />
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
      <Column header="Thao tác">
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
      </Column>
    </DataTable>


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
        <div class="d-flex align-items-center justify-content-end space-x-2 p-2">
          <Button label="Hủy" icon="pi pi-times" @click="closeDialog" class="p-button-text" />
          <Button label="Lưu" icon="pi pi-check" type="submit" />
        </div>
      </form>
    </Dialog>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/router/Interceptor'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'

import { RestaurantResponseDTO } from '@/types/RestaurantResponseDTO'
import type { RestaurantRequestDTO } from '@/types/RestaurantRequestDTO'
import { RestaurantFeedbackRequestDto } from '@/types/RestaurantFeedbackRequestDto'

const restaurants = ref<RestaurantResponseDTO[]>([])
const isDialogVisible = ref(false);
const searchTerm = ref('')
const sortField = ref<string>()
const sortOrder = ref<number>()
const toast = useToast()

const restaurant = ref<RestaurantRequestDTO>({
  name: '',
  link: '',
});

const fetchRestaurants = async () => {
  try {
    const response = await axiosInstance.get('/restaurants') // API lấy danh sách team
    restaurants.value = response.data
  } catch (error) {
    console.error('Error fetching restaurants:', error)
  }
}

onMounted(fetchRestaurants)

const filteredRestaurants = computed(() =>
  restaurants.value.filter(r =>
    r.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
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
    if (response && response.status === 200) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Quán nước đã được thêm!', life: 3000 });
      closeDialog();
      fetchRestaurants();
    } else {
      toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không thể thêm quán nước!', life: 3000 });
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể thêm quán nước!', life: 3000 });
  }
};

const likeRestaurant = async (restaurant: RestaurantResponseDTO) => {
  try {
    const feedbackData = new RestaurantFeedbackRequestDto(restaurant.id, 1); // 1 = like
    const response = await axiosInstance.post('/feedback', feedbackData);
    if (response && response.status === 200) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Bạn đã thích quán nước này!', life: 3000 });
      fetchRestaurants(); // Refresh the list
    } else {
      toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không thể thích quán nước này!', life: 3000 });
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể thích quán nước này!', life: 3000 });
  }
};

const dislikeRestaurant = async (restaurant: RestaurantResponseDTO) => {
  try {
    const feedbackData = new RestaurantFeedbackRequestDto(restaurant.id, -1); // -1 = dislike
    const response = await axiosInstance.post('/feedback', feedbackData);
    if (response && response.status === 200) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Bạn đã không thích quán nước này!', life: 3000 });
      fetchRestaurants(); // Refresh the list
    } else {
      toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không thể không thích quán nước này!', life: 3000 });
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể không thích quán nước này!', life: 3000 });
  }
};

</script>

<style scoped>
.text-red-500 {
  color: #ef4444; /* Tailwind's red-500 color */
}
</style>