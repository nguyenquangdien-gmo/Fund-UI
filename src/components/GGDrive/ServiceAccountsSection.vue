<template>
  <div class="section">
    <div class="section-header">
      <h3>Tài khoản dịch vụ</h3>
      <button class="add-account-btn" @click="$emit('add-account')" title="Thêm tài khoản dịch vụ mới">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
      </button>
    </div>
    
    <div class="service-accounts">
      <div v-if="isLoading" class="loading-accounts">
        <div class="loader"></div>
        <span>Đang tải...</span>
      </div>
      
      <div v-else-if="accounts.length === 0" class="empty-accounts">
        Chưa có tài khoản dịch vụ nào
        <button class="add-account-link" @click="$emit('add-account')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Thêm tài khoản
        </button>
      </div>
      
      <div v-else class="accounts-list">
        <service-account-item
          v-for="account in accounts"
          :key="account.id"
          :account="account"
          :selected-account-id="selectedAccountId"
          @edit-account="$emit('edit-account', $event)"
          @delete-account="$emit('delete-account', $event)"
          @set-default="$emit('set-default', $event)"
          @enable-account="$emit('enable-account', $event)"
          @disable-account="$emit('disable-account', $event)"
          @select-account="$emit('select-account', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ServiceAccountItem from './ServiceAccountItem.vue';

interface ServiceAccount {
  id: number;
  accountName: string;
  applicationName: string;
  description?: string;
  rootFolderId?: string;
  isDefault: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default defineComponent({
  name: 'GGDriveServiceAccountsSection',
  components: {
    ServiceAccountItem
  },
  props: {
    selectedAccountId: {
      type: Number,
      default: 0
    },
    accounts: {
      type: Array as () => ServiceAccount[],
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'add-account',
    'edit-account',
    'delete-account',
    'set-default',
    'enable-account',
    'disable-account',
    'select-account'
  ]
});
</script>

<style scoped>
.section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.add-account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.add-account-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--primary-color);
}

.loading-accounts, .empty-accounts {
  padding: 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
}

.loader {
  border: 2px solid #f3f3f3;
  border-radius: 50%;
  border-top: 2px solid var(--primary-color);
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.add-account-link {
  display: flex;
  align-items: center;
  color: var(--primary-color);
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-top: 0.5rem;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style> 