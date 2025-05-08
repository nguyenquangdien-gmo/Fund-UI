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
         <div>
          <Button label="Tạo nhắc nhở" icon="pi pi-plus" class="p-button-success" @click="createReminder()" />
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
      <Column field="notifyHour" header="Giờ nhắc" sortable style="width: 100px;">
        <template #body="{ data }">
          {{ new Date(`1970-01-01T${data.notifyHour}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }}
        </template>
      </Column>
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
      <Column field="repeatCount" header="Số lần lặp lại" sortable />
      <Column field="repeatIntervalDays" header="Khoảng cách lặp (ngày)" sortable style="width: 5%;"/>
      <Column field="createdAt" header="Ngày tạo" sortable>
        <template #body="{ data }">
          {{ new Date(data.createdAt).toLocaleDateString() }}
        </template>
      </Column>
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
      <Column header="Hành động">
        <template #body="{ data }">
          <div class="d-flex gap-2">
            <Button 
              label="Sửa" 
              icon="pi pi-pencil" 
              class="p-button-info" 
              @click="editReminder(data)" 
            />
            <Button 
              label="Hủy" 
              icon="pi pi-trash" 
              class="p-button-danger" 
              @click="deleteReminder(data.id)" 
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="isDialogVisible" header="Tạo nhắc nhở" :modal="true" :closable="true">
      <div class="p-fluid">
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="title">Tiêu đề<span class="text-red-500">*</span></label>
          <InputText id="title" v-model="newReminder.title" placeholder="Nhập tiêu đề" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.title" >{{ errors.title }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="message">Nội dung<span class="text-red-500">*</span></label>
          <InputText id="message" v-model="newReminder.message" placeholder="Nhập nội dung" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.message" >{{ errors.message }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="startTime">Thời gian bắt đầu<span class="text-red-500">*</span></label>
            <DatePicker id="startTime" v-model="newReminder.startTime" type="datetime" placeholder="Chọn thời gian bắt đầu" dateFormat="dd/mm/yy" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.startTime" >{{ errors.startTime }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="endTime">Thời gian kết thúc<span class="text-red-500">*</span></label>
          <DatePicker id="endTime" v-model="newReminder.endTime" type="datetime" placeholder="Chọn thời gian kết thúc" dateFormat="dd/mm/yy"/>
        </div>
        <div class="text-red-500 text-end" v-if="errors.endTime" >{{ errors.endTime }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="notifyHour">Giờ nhắc<span class="text-red-500">*</span></label>
            <DatePicker id="notifyHour" v-model="newReminder.notifyHour" type="time" placeholder="Chọn giờ nhắc" timeOnly hourFormat="24" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.notifyHour" >{{ errors.notifyHour }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="repeatCount">Số lần lặp lại<span class="text-red-500">*</span></label>
          <InputText id="repeatCount" v-model="newReminder.repeatCount" type="number" placeholder="Nhập số lần lặp lại" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.repeatCount" >{{ errors.repeatCount }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="repeatIntervalDays">Khoảng cách lặp (ngày)<span class="text-red-500">*</span></label>
          <InputText id="repeatIntervalDays" v-model="newReminder.repeatIntervalDays" type="number" placeholder="Nhập khoảng cách lặp (ngày)" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.repeatIntervalDays" >{{ errors.repeatIntervalDays }}</div>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" class="p-button-text" @click="isDialogVisible = false" />
        <Button label="Lưu" icon="pi pi-check" class="p-button-primary" @click="saveReminder" />
      </template>
    </Dialog>

    <Dialog v-model:visible="isEditDialogVisible" header="Chỉnh sửa nhắc nhở" :modal="true" :closable="true">
      <div class="p-fluid">
        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editTitle">Tiêu đề<span class="text-red-500">*</span></label>
          <InputText id="editTitle" v-model="editReminderData.title" placeholder="Nhập tiêu đề" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.title">{{ errors.title }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editMessage">Nội dung<span class="text-red-500">*</span></label>
          <InputText id="editMessage" v-model="editReminderData.message" placeholder="Nhập nội dung" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.message">{{ errors.message }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editStartTime">Thời gian bắt đầu<span class="text-red-500">*</span></label>
          <DatePicker id="editStartTime" v-model="editReminderData.startTime" type="datetime" placeholder="Chọn thời gian bắt đầu" dateFormat="dd/mm/yy" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.startTime">{{ errors.startTime }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editEndTime">Thời gian kết thúc<span class="text-red-500">*</span></label>
          <DatePicker id="editEndTime" v-model="editReminderData.endTime" type="datetime" placeholder="Chọn thời gian kết thúc" dateFormat="dd/mm/yy" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.endTime">{{ errors.endTime }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editNotifyHour">Giờ nhắc<span class="text-red-500">*</span></label>
          <DatePicker id="editNotifyHour" v-model="editReminderData.notifyHour" type="time" placeholder="Chọn giờ nhắc" timeOnly hourFormat="24" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.notifyHour">{{ errors.notifyHour }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editRepeatCount">Số lần lặp lại<span class="text-red-500">*</span></label>
          <InputText id="editRepeatCount" v-model="editReminderData.repeatCount" type="number" placeholder="Nhập số lần lặp lại" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.repeatCount">{{ errors.repeatCount }}</div>

        <div class="field d-flex align-items-center justify-content-between p-2">
          <label for="editRepeatIntervalDays">Khoảng cách lặp (ngày)<span class="text-red-500">*</span></label>
          <InputText id="editRepeatIntervalDays" v-model="editReminderData.repeatIntervalDays" type="number" placeholder="Nhập khoảng cách lặp (ngày)" />
        </div>
        <div class="text-red-500 text-end" v-if="errors.repeatIntervalDays">{{ errors.repeatIntervalDays }}</div>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" class="p-button-text" @click="isEditDialogVisible = false" />
        <Button label="Lưu" icon="pi pi-check" class="p-button-primary" @click="updateReminder" />
      </template>
    </Dialog>
    
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'
import axiosInstance from '@/router/Interceptor'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'

import { SelfReminderResponseDTO } from '@/types/SelfReminderResponseDTO'
import { SelfReminderRequestDTO } from '@/types/SelfReminderRequestDTO'

const newReminder = ref<SelfReminderRequestDTO>({
  title: '',
  message: '',
  startTime: new Date(),
  endTime: new Date(),
  notifyHour: new Date(new Date().setHours(8, 0, 0, 0)),
  repeatCount: "0",
  repeatIntervalDays: "0",
});

const editReminderData = ref<SelfReminderRequestDTO>({
  title: '',
  message: '',
  startTime: new Date(),
  endTime: new Date(),
  notifyHour: new Date(new Date().setHours(8, 0, 0, 0)),
  repeatCount: "0",
  repeatIntervalDays: "0",
});

const isEditDialogVisible = ref(false);

const editReminder = (reminder: SelfReminderResponseDTO) => {
  editReminderData.value = {
    title: reminder.title,
    message: reminder.message,
    startTime: new Date(reminder.startTime),
    endTime: new Date(reminder.endTime),
    notifyHour: new Date(`1970-01-01T${reminder.notifyHour}`),
    repeatCount: reminder.repeatCount.toString(),
    repeatIntervalDays: reminder.repeatIntervalDays.toString(),
  };
  isEditDialogVisible.value = true;
};

const updateReminder = async () => {
  if (!validateEditForm()) return;

  try {
    const reminderPayload = {
      title: editReminderData.value.title,
      message: editReminderData.value.message,
      startTime: new Date(editReminderData.value.startTime.getTime() - editReminderData.value.startTime.getTimezoneOffset() * 60000).toISOString(),
      endTime: new Date(editReminderData.value.endTime.getTime() - editReminderData.value.endTime.getTimezoneOffset() * 60000).toISOString(),
      notifyHour: editReminderData.value.notifyHour.toTimeString().split(' ')[0],
      repeatCount: editReminderData.value.repeatCount,
      repeatIntervalDays: editReminderData.value.repeatIntervalDays,
    };

    await axiosInstance.put(`/self-reminders/${editReminderData.value.id}`, reminderPayload);

    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Nhắc nhở đã được cập nhật thành công',
      life: 3000,
    });

    isEditDialogVisible.value = false;
    fetchSelfReminders();
  } catch (error) {
    console.error('Error updating reminder:', error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể cập nhật nhắc nhở. Vui lòng thử lại sau',
      life: 3000,
    });
  }
};

function validateEditForm() {
  let isValid = true;

  errors.title = editReminderData.value.title.trim() ? '' : 'Tiêu đề không được để trống';
  errors.message = editReminderData.value.message.trim() ? '' : 'Nội dung không được để trống';
  errors.startTime = editReminderData.value.startTime ? '' : 'Vui lòng chọn thời gian bắt đầu';
  errors.endTime = editReminderData.value.endTime ? '' : 'Vui lòng chọn thời gian kết thúc';
  errors.repeatCount = Number(editReminderData.value.repeatCount) > 0 ? '' : 'Số lần lặp lại phải lớn hơn 0';
  errors.repeatIntervalDays = Number(editReminderData.value.repeatIntervalDays) > 0 ? '' : 'Khoảng cách lặp phải lớn hơn 0';

  if (errors.title || errors.message || errors.startTime || errors.endTime || errors.notifyHour) {
    isValid = false;
  }

  return isValid;
}

const errors = reactive({
  title: '',
  message: '',
  startTime: '',
  endTime: '',
  notifyHour: '',
  repeatCount: "",
  repeatIntervalDays: "",
});

const selfReminders = ref<SelfReminderResponseDTO[]>([])

const isDialogVisible = ref(false)
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

const createReminder = () => {
  isDialogVisible.value = true
}

const saveReminder = async () => {
  if (!validateForm()) return;

  try {
    // Send request to save the reminder
    const reminderPayload = {
      title: newReminder.value.title,
      message: newReminder.value.message,
      startTime: new Date(newReminder.value.startTime.getTime() - newReminder.value.startTime.getTimezoneOffset() * 60000).toISOString(),
      endTime: new Date(newReminder.value.endTime.getTime() - newReminder.value.endTime.getTimezoneOffset() * 60000).toISOString(),
      notifyHour: newReminder.value.notifyHour.toTimeString().split(' ')[0], // Extract time in HH:mm:ss format
      repeatCount: newReminder.value.repeatCount,
      repeatIntervalDays: newReminder.value.repeatIntervalDays,
    };

    await axiosInstance.post('/self-reminders', reminderPayload);

    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Nhắc nhở đã được tạo thành công',
      life: 3000,
    });

    // Reset form and close dialog
    Object.assign(newReminder, {
      title: '',
      message: '',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      notifyHour: '00:00',
      repeatCount: 0,
      repeatIntervalDays: 0,
    });
    isDialogVisible.value = false;

    // Refresh the reminders list
    fetchSelfReminders();
  } catch (error) {
    console.error('Error saving reminder:', error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể tạo nhắc nhở. Vui lòng thử lại sau',
      life: 3000,
    });
  }
};

function validateForm() {
  let isValid = true;

  errors.title = newReminder.value.title.trim() ? '' : 'Tiêu đề không được để trống';
  errors.message = newReminder.value.message.trim() ? '' : 'Nội dung không được để trống';
  errors.startTime = newReminder.value.startTime ? '' : 'Vui lòng chọn thời gian bắt đầu';
  errors.endTime = newReminder.value.endTime ? '' : 'Vui lòng chọn thời gian kết thúc';
  errors.repeatCount = Number(newReminder.value.repeatCount) > 0 ? '' : 'Số lần lặp lại phải lớn hơn 0';
  errors.repeatIntervalDays = Number(newReminder.value.repeatIntervalDays) > 0 ? '' : 'Khoảng cách lặp phải lớn hơn 0';

  if (errors.title || errors.message || errors.startTime || errors.endTime || errors.notifyHour) {
    isValid = false;
  }

  return isValid;
}

</script>

<style scoped>
.text-red-500 {
  color: #ef4444; /* Tailwind's red-500 color */
}
</style>