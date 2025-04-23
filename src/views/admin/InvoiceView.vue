<template>
  <div class="container">
    <div class="p-4">
      <h2 class="text-center text-xl">THU CHI CỦA NHÓM</h2>
      <div class="mb-3">
        <InputText
          v-if="invoices.length > 0"
          v-model="searchQuery"
          placeholder="Tìm kiếm theo tên chi tiêu..."
          style="width: 20%"
          class="w-full p-inputtext-sm"
        />
        <!-- <Button label="Tạo phiếu chi" class="btn-create" severity="success" raised size="small"
                    @click="openCreateDialog" /> -->
      </div>
      <DataTable
        v-if="invoices.length > 0"
        :value="filteredInvoice"
        paginator
        :rows="15"
        :first="first"
        @page="onPage"
        :rowsPerPageOptions="[10, 50, 100]"
        class="p-datatable-sm"
      >
        <Column header="STT" sortable>
          <template #body="{ index }">
            {{ first + index + 1 }}
          </template>
        </Column>
        <Column field="user.fullName" header="Tên" sortable></Column>
        <Column field="invoiceType" header="Loại" sortable>
          <template #body="{ data }">
            <Tag
              v-if="data.invoiceType !== 'null'"
              :value="getInvoiceTypeLabel(data.invoiceType)"
              :severity="getInvoiceTypeSeverity(data.invoiceType)"
            />
            <!-- <Tag v-else value="chưa duyệt" severity="warn" /> -->
          </template>
        </Column>
        <Column field="description" header="Mô tả" sortable></Column>
        <Column field="amount" header="Số Tiền" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.amount) }}
          </template>
        </Column>
        <!-- <Column field="userId" header="Tạo bởi" sortable></Column> -->
        <Column field="createdAt" header="Ngày Tạo" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <!-- <Column header="Actions">
                    <template #body="{ data }">
                        <Button label="Sửa" icon="pi pi-refresh" severity="info" @click="openUpdateDialog(data)"
                            :hidden="data.status === 'APPROVED'" />
                        <Button label="Delete" icon="pi pi-trash" severity="danger"
                            @click="confirmDeleteInvoice(data)" />
                    </template>
                </Column> -->
      </DataTable>
      <div v-else>
        <p class="text-center">Không tìm thấy phiếu chi nào</p>
      </div>
    </div>
  </div>
  <!-- <Dialog v-model:visible="showConfirmDialog" modal header="Xác nhận xóa" :style="{ width: '25rem' }">
        <div>Bạn có chắc chắn muốn xóa quỹ này?</div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <Button label="Hủy" severity="secondary" @click="showConfirmDialog = false" />
            <Button label="Xóa" severity="danger" @click="deleteInvoice" />
        </div>
    </Dialog> -->

  <!-- <Dialog v-model:visible="showInvoice" modal :header="isUpdate ? 'Update' : 'Create'" @hide="resetErrors"
        :style="{ width: '30rem' }">
        <div class="mb-3">
            <label for="name" class="fw-bold">Tên</label>
            <InputText id="name" v-model="form.name" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.name">{{ errors.name }}</small>
        </div>
        <div class="mb-3">
            <label for="description" class="fw-bold">Mô tả</label>
            <InputText id="description" v-model="form.description" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.description">{{ errors.description }}</small>
        </div>
        <div class="mb-3">
            <label for="amount" class="fw-bold">Số tiền</label>
            <InputText id="amount" type="number" v-model="amount" class="w-100" autocomplete="off" />
            <small class="text-danger" v-if="errors.amount">{{ errors.amount }}</small>
        </div>
        <div class="mb-3">
            <label for="type" class="fw-bold">Loại quỹ</label>
            <Dropdown v-model="selectedType" :options="types" optionLabel="label" optionValue="value"
                placeholder="Chọn loại quỹ" class="w-100 md:w-56" />
            <small class="text-danger" v-if="errors.type">{{ errors.type }}</small>
        </div>
        <div class="d-flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showInvoice = false"></Button>
            <Button type="button" label="Save" severity="primary" @click="saveInvoice"></Button>
        </div>
    </Dialog> -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import axiosInstance from '@/router/Interceptor'
import { useRouter } from 'vue-router'
import formatCurrency from '@/utils/FormatCurrency'
// import { useUserStore } from '@/pinia/userStore'
import type Invoice from '@/types/Invoice'
import InvoiceType from '@/types/InvoiceType'
import Tag from 'primevue/tag'

// const baseURL = "http://localhost:8080/api/v1";
// const showConfirmDialog = ref(false)
// const expeneseToDelete = ref<Invoice | null>(null)
const token = localStorage.getItem('accessToken')
const invoices = ref<Invoice[]>([])
const searchQuery = ref('')
// const showInvoice = ref(false)
// const isUpdate = ref(false)
// const form = ref({ id: 0, name: '', invoiceType: '', description: '', userId: 0, amount: 0 })
// const errors = ref({ name: '', description: '', type: '', amount: '' })
const router = useRouter()
// const userStore = useUserStore()
// const user = computed(() => userStore.user)
// const amount = ref('')

//pagenation
const first = ref<number>(0)

const onPage = (event: { first: number }) => {
  first.value = event.first
}
//check role
const admin = ref(false)
const checkAdmin = async () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return false
  try {
    const response = await axiosInstance.get('/tokens/is-admin', {
      params: { token },
    })
    return response.data // Trả về true nếu là admin
  } catch (error) {
    // consol e.error('Lỗi khi kiểm tra quyền admin:', error)
    return false
  }
}

const selectedType = ref<InvoiceType | null>(null)
// const types = ref([
//     { label: "Quỹ thu", value: InvoiceType.INCOME },
//     { label: "Quỹ chi", value: InvoiceType.EXPENSE }
// ]);

const getInvoiceTypeLabel = (type: string) => {
  return type === 'EXPENSE' ? 'Chi' : 'Thu'
}

const getInvoiceTypeSeverity = (type: string) => {
  return type === 'EXPENSE' ? 'warn' : 'info'
}

const fetchInvoice = async () => {
  try {
    const response = await axiosInstance.get(`/invoices`)
    invoices.value = response.data
    console.log('invoice', invoices.value)
  } catch (error) {
    console.error('Error fetching invoices:', error)
  }
}

const filteredInvoice = computed(() => {
  if (!searchQuery.value) return invoices.value
  return invoices.value.filter((invoice) =>
    invoice.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// const openCreateDialog = () => {
//     form.value = { id: 0, name: "", userId: 0, description: "", invoiceType: "", amount: 0 };
//     isUpdate.value = false;
//     showInvoice.value = true;
// };

// const openUpdateDialog = (invoice: Invoice) => {
//     form.value = {
//         id: invoice.id,
//         name: invoice.name,
//         userId: user.value.id,
//         description: invoice.description,
//         invoiceType: invoice.type,
//         amount: invoice.amount
//     };
//     amount.value = invoice.amount.toString();

//     // Just use this line - set selectedType to the enum value directly
//     selectedType.value = invoice.type === InvoiceType.INCOME ? InvoiceType.INCOME : InvoiceType.EXPENSE;

//     isUpdate.value = true;
//     showInvoice.value = true;

//     console.log(form.value);

// };
// const validateForm = () => {
//     errors.value = { name: "", description: "", type: "", amount: "" };
//     if (!form.value.name) errors.value.name = "Vui lòng nhập tên phí!";
//     if (!form.value.description) errors.value.name = "Vui lòng nhập mô tả phí!";
//     if (!selectedType.value) errors.value.type = "Vui lòng chọn loại phí!";
//     if (!amount.value || Number(amount.value) < 0)
//         errors.value.amount = "Số tiền cần phải lớn hơn 0!";
//     return Object.values(errors.value).every(err => err === "");
// };

// const saveInvoice = async () => {
//     if (!validateForm()) return;
//     try {
//         // if (isUpdate.value) {
//         //     if (selectedType.value) {
//         //         form.value.invoiceType = selectedType.value.toString();
//         //     }
//         //     form.value.amount = Number(amount.value);
//         //     console.log(form.value);

//         //     await axiosInstance.put(`/invoices/${form.value.id}/update`, form.value);
//         //     // console.log(form.value);

//         // } else {
//         if (selectedType.value) {
//             form.value.invoiceType = selectedType.value;
//             form.value.userId = user.value.id;
//             form.value.amount = Number(amount.value);
//             // console.log(form.value);

//             // console.log(form.value);
//             await axiosInstance.post(`/invoices`, form.value);
//             resetForm();
//         }

//         // }
//         showInvoice.value = false;
//         fetchInvoice();
//     } catch (error) {
//         console.error('Error saving fund:', error);
//     }
// }; const resetErrors = () => {
//     errors.value = { name: "", description: "", type: "", amount: "" };
// };

// const resetForm = () => {
//     form.value = { id: 0, name: "", userId: 0, description: "", invoiceType: "", amount: 0 };
//     amount.value = '';
//     selectedType.value = null;
// }

// const deleteInvoice = async () => {
//     if (!expeneseToDelete.value) return;
//     try {
//         await axiosInstance.delete(`/invoices/${expeneseToDelete.value.id}`, {
//             headers: { Authorization: `Bearer ${token}` }
//         });
//         fetchInvoice();
//     } catch (error) {
//         console.error('Error deleting fund:', error);
//     } finally {
//         showConfirmDialog.value = false;
//         expeneseToDelete.value = null;
//     }
// };

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

onMounted(async () => {
  if (!token) {
    router.push('/')
  } else {
    admin.value = await checkAdmin()
    fetchInvoice()
  }
})
</script>

<style scoped>
.p-datatable-sm {
  font-size: 14px;
}

.btn-create {
  margin-left: 10px;
}
</style>
