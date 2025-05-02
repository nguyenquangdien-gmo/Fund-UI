<template>
  <div class="service-account-item">
    <div 
      class="service-account-content"
      :class="{ 'is-selected': isSelected, 'is-disabled': !account.enabled }"
      @click="$emit('select-account', account.id)"
    >
      <div class="service-account-icons">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="account-icon">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M2 10h20"/>
        </svg>
      </div>
      <span class="account-name">{{ account.accountName }}</span>
      <div v-if="account.isDefault" class="default-badge">Mặc định</div>
      
      <div class="account-actions" @click.stop>
        <div class="menu-trigger" @click.stop="toggleMenu">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </div>
        
        <div v-if="showMenu" class="account-menu">
          <div v-if="!account.isDefault" class="menu-item" @click="$emit('set-default', account.id)">
            <i class="pi pi-star"></i>
            <span>Đặt làm mặc định</span>
          </div>
          <div class="menu-item" @click="$emit('edit-account', account.id)">
            <i class="pi pi-pencil"></i>
            <span>Chỉnh sửa</span>
          </div>
          <div v-if="account.enabled" class="menu-item" @click="$emit('disable-account', account.id)">
            <i class="pi pi-power-off"></i>
            <span>Vô hiệu hóa</span>
          </div>
          <div v-else class="menu-item" @click="$emit('enable-account', account.id)">
            <i class="pi pi-check-circle"></i>
            <span>Kích hoạt</span>
          </div>
          <div class="menu-item delete" @click="$emit('delete-account', account.id)">
            <i class="pi pi-trash"></i>
            <span>Xóa</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue';

// Track active menu globally
const activeMenu = ref<string | null>(null);

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
  name: 'GGDriveServiceAccountItem',
  props: {
    account: {
      type: Object as () => ServiceAccount,
      required: true
    },
    selectedAccountId: {
      type: Number,
      required: false,
      default: 0
    }
  },
  emits: [
    'edit-account', 
    'delete-account', 
    'set-default', 
    'enable-account', 
    'disable-account',
    'select-account'
  ],
  setup(props) {
    const menuId = `account-menu-${props.account.id}`;
    
    // Check if menu for this account is currently displayed
    const showMenu = computed(() => activeMenu.value === menuId);

    const toggleMenu = () => {
      if (activeMenu.value === menuId) {
        activeMenu.value = null;
      } else {
        activeMenu.value = menuId;
      }
    };

    // Close menu when clicking outside
    const closeMenuOnClickOutside = () => {
      if (showMenu.value) {
        activeMenu.value = null;
      }
    };

    onMounted(() => {
      document.addEventListener('click', closeMenuOnClickOutside);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', closeMenuOnClickOutside);
    });

    const isSelected = computed(() => props.account.id === props.selectedAccountId);

    return {
      isSelected,
      showMenu,
      toggleMenu
    };
  }
});
</script>

<style scoped>
.service-account-item {
  margin-bottom: 0.5rem;
}

.service-account-content {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.service-account-content:hover {
  background-color: var(--secondary-color);
}

.service-account-content.is-selected {
  background-color: var(--primary-color);
  color: white;
}

.is-disabled {
  opacity: 0.6;
}

.service-account-icons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.account-icon {
  width: 1rem;
  height: 1rem;
}

.service-account-content.is-selected .account-icon {
  color: white;
}

.account-name {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.default-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  background-color: var(--primary-color);
  color: white;
  margin-right: 0.5rem;
}

.service-account-content.is-selected .default-badge {
  background-color: white;
  color: var(--primary-color);
}

.account-actions {
  margin-left: auto;
  position: relative;
}

.menu-trigger {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: background-color 0.2s, color 0.2s;
}

.menu-trigger:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.service-account-content.is-selected .menu-trigger {
  color: white;
}

.service-account-content.is-selected .menu-trigger:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.account-menu {
  position: absolute;
  right: 0;
  top: calc(100% - 5px);
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  width: 180px;
}

/* Reset colors for menu items regardless of selection state */
.service-account-content.is-selected .account-menu,
.account-menu {
  color: var(--text-color);
  background-color: white;
}

.service-account-content.is-selected .account-menu .menu-item,
.service-account-content.is-selected .account-menu .menu-item svg {
  color: var(--text-color);
}

.service-account-content.is-selected .account-menu .menu-item.delete,
.service-account-content.is-selected .account-menu .menu-item.delete svg {
  color: var(--error-color);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 0.5rem;
}

.menu-item svg {
  color: currentColor;
}

.menu-item:hover {
  background-color: var(--secondary-color);
}

.menu-item.delete {
  color: var(--error-color);
}

.menu-item.delete svg {
  color: var(--error-color);
}

.menu-item.delete:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.menu-item i {
  font-size: 0.875rem;
}
</style> 