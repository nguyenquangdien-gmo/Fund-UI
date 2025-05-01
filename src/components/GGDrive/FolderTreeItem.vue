<template>
  <div class="folder-tree-item">
    <div 
      class="folder-content"
      :class="{ 'is-selected': isSelected }"
      @click="handleFolderClick"
    >
      <div class="folder-icons">
        <svg v-if="folder.children.length > 0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon">
          <path v-if="isExpanded" d="m6 9 6 6 6-6"/>
          <path v-else d="m9 18 6-6-6-6"/>
        </svg>
        <div v-else class="empty-space"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="folder-icon">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
        </svg>
      </div>
      <span class="folder-name">{{ folder.name }}</span>
      
      <div class="folder-actions" @click.stop>
        <div class="menu-trigger" @click.stop="toggleMenu">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </div>
        
        <div v-if="showMenu" class="folder-menu">
          <div class="menu-item" @click="handleCreateSubfolder">
            <i class="pi pi-folder-plus" style="font-size: 1rem"></i>
            <span>Thư mục mới</span>
          </div>
          <div class="menu-item" @click="handleRename">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
            <span>Đổi tên</span>
          </div>
          <div class="menu-item delete" @click="handleDelete">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            <span>Xóa</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isExpanded" class="subfolders">
      <folder-tree-item
        v-for="subfolder in folder.children"
        :key="subfolder.id"
        :folder="subfolder"
        :selected-folder-id="selectedFolderId"
        @select-folder="$emit('select-folder', $event)"
        @rename-folder="$emit('rename-folder', $event)"
        @delete-folder="$emit('delete-folder', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue';

// Tạo biến toàn cục để theo dõi menu đang mở
const activeMenu = ref<string | null>(null);

interface Folder {
  id: number;
  name: string;
  children: Folder[];
}

export default defineComponent({
  name: 'GGDriveFolderTreeItem',
  props: {
    folder: {
      type: Object as () => Folder,
      required: true
    },
    selectedFolderId: {
      type: Number,
      required: true
    }
  },
  emits: ['select-folder', 'rename-folder', 'delete-folder', 'create-subfolder'],
  setup(props, { emit }) {
    const isExpanded = ref(false);
    const menuId = `folder-menu-${props.folder.id}`;
    
    // Tính toán xem menu của folder này có đang hiển thị không
    const showMenu = computed(() => activeMenu.value === menuId);

    const handleFolderClick = () => {
      if (props.folder.children.length > 0) {
        isExpanded.value = !isExpanded.value;
      }
      if (props.folder.id !== props.selectedFolderId) {
        emit('select-folder', props.folder.id);
      }
    };

    const toggleMenu = () => {
      if (activeMenu.value === menuId) {
        activeMenu.value = null;
      } else {
        activeMenu.value = menuId;
      }
    };

    const handleCreateSubfolder = () => {
      emit('create-subfolder', props.folder.id);
      activeMenu.value = null;
    };

    const handleRename = () => {
      emit('rename-folder', props.folder);
      activeMenu.value = null;
    };

    const handleDelete = () => {
      emit('delete-folder', props.folder);
      activeMenu.value = null;
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

    const isSelected = computed(() => props.folder.id === props.selectedFolderId);

    return {
      isExpanded,
      isSelected,
      showMenu,
      handleFolderClick,
      toggleMenu,
      handleCreateSubfolder,
      handleRename,
      handleDelete
    };
  }
});
</script>

<style scoped>
.folder-tree-item {
  margin-left: 1rem;
}

.folder-content {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.folder-content:hover {
  background-color: var(--secondary-color);
}

.folder-content.is-selected {
  background-color: var(--primary-color);
  color: white;
}

.folder-content.is-selected .folder-icons,
.folder-content.is-selected i.pi,
.folder-content.is-selected .menu-trigger,
.folder-content.is-selected .menu-trigger svg {
  color: white;
}

.folder-icons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.toggle-icon {
  width: 1rem;
  height: 1rem;
  color: var(--text-secondary);
  transition: transform 0.2s;
}

.folder-content.is-selected .toggle-icon {
  color: white;
}

.empty-space {
  width: 1rem;
  height: 1rem;
}

.folder-icon {
  width: 1rem;
  height: 1rem;
}

.folder-content.is-selected .folder-icon {
  color: white;
}

.folder-name {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subfolders {
  margin-left: 1rem;
}

.folder-actions {
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

.folder-item.is-selected .menu-trigger {
  color: white;
}

.folder-item.is-selected .menu-trigger:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.folder-content.is-selected .menu-trigger {
  color: white;
}

.folder-content.is-selected .menu-trigger:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.folder-menu {
  position: absolute;
  right: 0;
  top: calc(100% - 5px);
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 130px;
  z-index: 100;
  overflow: hidden;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  width: 144px;
}

/* Reset colors for menu items regardless of folder selection state */
.folder-content.is-selected .folder-menu,
.folder-menu {
  color: var(--text-color);
  background-color: white;
}

.folder-content.is-selected .folder-menu .menu-item,
.folder-content.is-selected .folder-menu .menu-item i.pi,
.folder-content.is-selected .folder-menu .menu-item svg {
  color: var(--text-color);
}

.folder-content.is-selected .folder-menu .menu-item.delete,
.folder-content.is-selected .folder-menu .menu-item.delete svg,
.folder-content.is-selected .folder-menu .menu-item.delete i.pi {
  color: var(--error-color);
}

.folder-item.is-selected .folder-menu {
  color: var(--text-color);
  background-color: white;
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

.folder-item.is-selected .menu-item svg {
  color: var(--text-color);
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
</style> 