<template>
  <div class="app-container">
    <div class="page-header">
      <h1>Quản lý tài khoản dịch vụ Google Drive</h1>
      <div class="header-actions">
        <router-link to="/drive" class="back-link">
          <PButton icon="pi pi-arrow-left" label="Quay lại Drive" class="p-button-text" />
        </router-link>
        <PButton icon="pi pi-plus" label="Thêm tài khoản" @click="showAddAccountDialog" />
      </div>
    </div>

    <div class="accounts-container">
      <p v-if="isLoading" class="loading-message">
        <i class="pi pi-spin pi-spinner"></i>
        Đang tải danh sách tài khoản...
      </p>

      <div v-else-if="serviceAccounts.length === 0" class="empty-accounts">
        <i class="pi pi-user-plus" style="font-size: 2rem; color: var(--text-secondary);"></i>
        <p>Chưa có tài khoản dịch vụ nào</p>
        <p class="empty-description">Tài khoản dịch vụ giúp ứng dụng kết nối với Google Drive API.</p>
        <PButton icon="pi pi-plus" label="Thêm tài khoản dịch vụ" @click="showAddAccountDialog" />
      </div>

      <div v-else class="accounts-list">
        <div v-for="account in serviceAccounts" :key="account.id" class="account-card">
          <div class="account-header">
            <div class="account-name">
              {{ account.accountName }}
              <span v-if="account.isDefault" class="default-badge">Mặc định</span>
            </div>
            <div class="account-actions">
              <PButton v-if="!account.isDefault" icon="pi pi-star" class="p-button-text p-button-sm"
                @click="handleSetDefaultAccount(account.id)" title="Đặt làm mặc định" />
              <PButton icon="pi pi-pencil" class="p-button-text p-button-sm" @click="handleEditAccount(account.id)"
                title="Chỉnh sửa" />
              <PButton v-if="account.isActive" icon="pi pi-power-off" class="p-button-text p-button-sm"
                @click="handleDisableAccount(account.id)" title="Vô hiệu hóa" />
              <PButton v-else icon="pi pi-check-circle" class="p-button-text p-button-sm"
                @click="handleEnableAccount(account.id)" title="Kích hoạt" />
              <PButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                @click="handleDeleteAccount(account.id)" title="Xóa" />
            </div>
          </div>

          <div class="account-content">
            <div class="account-details">
              <div class="detail-row">
                <span class="detail-label">Tên ứng dụng:</span>
                <span class="detail-value">{{ account.applicationName }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mô tả:</span>
                <span class="detail-value">{{ account.description ? account.description : '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Trạng thái:</span>
                <span class="detail-value" :class="{ 'enabled': account.isActive, 'disabled': !account.isActive }">
                  {{ account.isActive ? 'Đang hoạt động' : 'Vô hiệu hóa' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ngày tạo:</span>
                <span class="detail-value">{{ formatDate(account.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <AddServiceAccountDialog v-model:visible="addAccountDialogVisible" :edit-account="accountToEdit"
      @save-account="handleSaveAccount" />

    <ConfirmDialog v-model:visible="deleteDialogVisible" :title="deleteDialogData.title"
      :message="deleteDialogData.message" :confirm-label="deleteDialogData.confirmLabel"
      :confirm-icon="deleteDialogData.confirmIcon" :confirm-class="deleteDialogData.confirmClass"
      @confirm="deleteDialogData.onConfirm" />

    <PToast />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useDriveStore } from '@/stores/drive';
import { useToast } from 'primevue/usetoast';
import PButton from 'primevue/button';
import PToast from 'primevue/toast';
import AddServiceAccountDialog from '@/components/GGDrive/AddServiceAccountDialog.vue';
import ConfirmDialog from '@/components/GGDrive/ConfirmDialog.vue';

interface GoogleServiceAccount {
  id: number;
  accountName: string;
  applicationName: string;
  description?: string;
  rootFolderId?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default defineComponent({
  name: 'DriveAccountManager',
  components: {
    PButton,
    PToast,
    AddServiceAccountDialog,
    ConfirmDialog
  },
  setup() {
    const driveStore = useDriveStore();
    const toast = useToast();

    const isLoading = ref(false);
    const serviceAccounts = ref<GoogleServiceAccount[]>([]);

    // Dialog states
    const addAccountDialogVisible = ref(false);
    const accountToEdit = ref<GoogleServiceAccount | null>(null);

    const deleteDialogVisible = ref(false);
    const deleteDialogData = ref({
      title: '',
      message: '',
      confirmLabel: '',
      confirmIcon: '',
      confirmClass: '',
      onConfirm: () => { }
    });

    // Load service accounts
    const loadServiceAccounts = async () => {
      isLoading.value = true;
      try {
        const accounts = await driveStore.getUserServiceAccounts();
        serviceAccounts.value = accounts;
        // console.log(serviceAccounts.value);

      } catch (error) {
        console.error('Error loading service accounts:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách tài khoản dịch vụ',
          life: 3000
        });
      } finally {
        isLoading.value = false;
      }
    };

    // Format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Dialog handlers
    const showAddAccountDialog = () => {
      accountToEdit.value = null;
      addAccountDialogVisible.value = true;
    };

    const handleEditAccount = async (accountId: number) => {
      try {
        const account = await driveStore.getUserServiceAccountById(accountId);
        accountToEdit.value = account;
        addAccountDialogVisible.value = true;
      } catch (error) {
        console.error('Error getting account details:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể lấy thông tin tài khoản',
          life: 3000
        });
      }
    };

    const handleDeleteAccount = (accountId: number) => {
      console.log('Showing delete account dialog for:', accountId);
      const account = serviceAccounts.value.find(a => a.id === accountId);
      if (!account) return;

      deleteDialogData.value.title = 'Xóa tài khoản dịch vụ';
      deleteDialogData.value.message = `Bạn có chắc chắn muốn xóa tài khoản dịch vụ "${account.accountName}"?`;
      deleteDialogData.value.confirmLabel = 'Xóa';
      deleteDialogData.value.confirmIcon = 'pi pi-trash';
      deleteDialogData.value.confirmClass = 'p-button-danger';
      deleteDialogData.value.onConfirm = () => deleteAccount(accountId);
      deleteDialogVisible.value = true;
    };

    // Account operations
    const handleSaveAccount = async ({ accountId, formData }: { accountId?: number, formData: FormData }) => {
      try {
        const accountName = formData.get('accountName') as string;
        const applicationName = formData.get('applicationName') as string;
        const description = formData.get('description') as string || undefined;
        const rootFolderId = formData.get('rootFolderId') as string || undefined;
        const isDefault = formData.get('isDefault') === 'true';

        if (!accountId) {
          // Validate duplicate names when creating new account
          const isDuplicate = serviceAccounts.value.some(
            account => account.accountName === accountName || account.applicationName === applicationName
          );

          if (isDuplicate) {
            toast.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Tên tài khoản hoặc tên ứng dụng đã tồn tại',
              life: 3000
            });
            return;
          }

          // Create new account
          const credentials = formData.get('credentials') as File;
          if (!credentials) {
            throw new Error('Thiếu file thông tin xác thực');
          }

          await driveStore.configureServiceAccount(
            credentials,
            { accountName, applicationName, description, rootFolderId, isDefault }
          );

          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Tạo tài khoản dịch vụ mới thành công',
            life: 3000
          });
        } else {
          // Update existing account
          const currentAccount = serviceAccounts.value.find(a => a.id === accountId);
          const isDuplicate = serviceAccounts.value.some(
            account => account.id !== accountId &&
              (account.accountName === accountName || account.applicationName === applicationName)
          );

          if (isDuplicate) {
            toast.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Tên tài khoản hoặc tên ứng dụng đã tồn tại',
              life: 3000
            });
            return;
          }

          const credentials = formData.get('credentials') as File || undefined;

          await driveStore.updateServiceAccount(
            accountId,
            { accountName, applicationName, description, rootFolderId, isDefault },
            credentials
          );

          toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật tài khoản dịch vụ thành công',
            life: 3000
          });
        }
        // Reload the accounts list
        await loadServiceAccounts();
      } catch (error) {
        console.error('Error saving account:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể lưu tài khoản dịch vụ',
          life: 3000
        });
      }
    };

    const deleteAccount = async (accountId: number) => {
      try {
        await driveStore.deleteServiceAccount(accountId);
        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xóa tài khoản dịch vụ thành công',
          life: 3000
        });
        // Reload the accounts list
        await loadServiceAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xóa tài khoản dịch vụ',
          life: 3000
        });
      }
    };

    const handleSetDefaultAccount = async (accountId: number) => {
      try {
        await driveStore.setDefaultServiceAccount(accountId);
        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã đặt tài khoản làm mặc định',
          life: 3000
        });
        // Reload the accounts list
        await loadServiceAccounts();
      } catch (error) {
        console.error('Error setting default account:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể đặt tài khoản làm mặc định',
          life: 3000
        });
      }
    };

    const handleEnableAccount = async (accountId: number) => {
      try {
        await driveStore.enableServiceAccount(accountId);
        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã kích hoạt tài khoản dịch vụ',
          life: 3000
        });
        // Reload the accounts list
        await loadServiceAccounts();
      } catch (error) {
        console.error('Error enabling account:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể kích hoạt tài khoản dịch vụ',
          life: 3000
        });
      }
    };

    const handleDisableAccount = async (accountId: number) => {
      try {
        await driveStore.disableServiceAccount(accountId);
        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã vô hiệu hóa tài khoản dịch vụ',
          life: 3000
        });
        // Reload the accounts list
        await loadServiceAccounts();
      } catch (error) {
        console.error('Error disabling account:', error);
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể vô hiệu hóa tài khoản dịch vụ',
          life: 3000
        });
      }
    };

    // Load accounts on mount
    onMounted(() => {
      loadServiceAccounts();
    });

    return {
      isLoading,
      serviceAccounts,
      addAccountDialogVisible,
      accountToEdit,
      deleteDialogVisible,
      deleteDialogData,
      formatDate,
      showAddAccountDialog,
      handleEditAccount,
      handleDeleteAccount,
      handleSaveAccount,
      handleSetDefaultAccount,
      handleEnableAccount,
      handleDisableAccount
    };
  }
});
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.page-header h1 {
  font-size: 1.5rem;
  color: var(--text-color);
  margin: 0;
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  justify-content: center;
  margin: 2rem 0;
}

.empty-accounts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
  color: var(--text-color);
  background-color: #f9f9f9;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-description {
  color: var(--text-secondary);
  max-width: 400px;
  margin-top: -0.5rem;
}

.accounts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.account-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.account-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border-bottom: 1px solid var(--border-color);
}

.account-name {
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.default-badge {
  background-color: var(--primary-color);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-weight: normal;
}

.account-actions {
  display: flex;
  gap: 0.25rem;
}

.account-content {
  padding: 1rem;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.detail-value {
  font-weight: 500;
  word-break: break-word;
}

.detail-value.enabled {
  color: var(--success-color);
}

.detail-value.disabled {
  color: var(--error-color);
}

/* Responsive */
@media (max-width: 768px) {
  .app-container {
    padding: 1rem;
  }

  .accounts-list {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    align-self: flex-end;
  }
}

.back-link {
  text-decoration: none;
}
</style>