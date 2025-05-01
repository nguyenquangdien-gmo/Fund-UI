<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Google Drive</h2>
    </div>
    
    <div class="section">
      <div class="section-header">
        <h3>Thư mục</h3>
        <button class="add-root-folder-btn" @click="$emit('create-root-folder')" title="Tạo thư mục mới ở Root">
          <i class="pi pi-folder-plus" style="font-size: 1rem"></i>
        </button>
      </div>
      <div class="folder-tree">
        <div v-if="isLoading" class="loading-folders">
          <div class="loader"></div>
          <span>Đang tải...</span>
        </div>
        
        <div v-else-if="folderTree.length === 0" class="empty-folders">
          Không có thư mục nào
          <button class="create-folder-link" @click="$emit('create-root-folder')">
            <i class="pi pi-folder-plus" style="font-size: 0.875rem; margin-right: 0.25rem;"></i>
            Tạo thư mục
          </button>
        </div>
        
        <div v-else class="folders-container">
          <folder-tree-item
            v-for="folder in folderTree"
            :key="folder.id"
            :folder="folder"
            :selected-folder-id="selectedFolderId"
            @select-folder="handleSelectFolder"
            @rename-folder="handleRenameFolder"
            @delete-folder="handleDeleteFolder"
            @create-subfolder="handleCreateSubfolder"
          />
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3>Yêu thích</h3>
      <div v-if="favorites.length === 0" class="empty-favorites">
        Chưa có mục yêu thích nào
      </div>
      <div v-else class="favorites-list">
        <div v-for="favorite in favorites" :key="favorite.id" class="favorite-item">
          <div class="favorite-icon">
            <svg v-if="favorite.type === 'folder'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="favorite-details">
            <span class="favorite-name">{{ favorite.name }}</span>
            <span class="favorite-path">{{ favorite.path }}</span>
          </div>
          <div class="favorite-actions">
            <button class="action-btn" @click="$emit('edit-favorite', favorite.id)" title="Chỉnh sửa">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
            <button class="action-btn" @click="$emit('remove-favorite', favorite.id)" title="Xóa">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { useDriveStore } from '@/stores/drive';
import FolderTreeItem from './FolderTreeItem.vue';

interface Favorite {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  originalId: string;
}

interface DriveFolder {
  id: number;
  name: string;
  webViewLink: string;
  createdTime: string;
  modifiedTime: string;
  parentFolderId: number | null;
  parentFolderName: string | null;
  createdByUsername: string;
}

interface TreeFolder {
  id: number;
  name: string;
  children: TreeFolder[];
}

export default defineComponent({
  name: 'GGDriveSidebar',
  components: {
    FolderTreeItem
  },
  props: {
    selectedFolderId: {
      type: Number,
      required: true
    },
    favorites: {
      type: Array as () => Favorite[],
      required: true
    }
  },
  emits: ['select-folder', 'edit-favorite', 'remove-favorite', 'rename-folder', 'delete-folder', 'create-root-folder', 'create-subfolder'],
  setup(props, { emit }) {
    const driveStore = useDriveStore();
    const isLoading = ref(false);
    const folderTree = ref<TreeFolder[]>([]);
    
    // Chuyển đổi danh sách folder phẳng thành cấu trúc cây
    const buildFolderTree = (folders: DriveFolder[]) => {
      const folderMap = new Map<number, TreeFolder>();
      const rootFolders: TreeFolder[] = [];
      
      // Tạo đối tượng TreeFolder cho mỗi folder
      folders.forEach(folder => {
        folderMap.set(folder.id, {
          id: folder.id,
          name: folder.name,
          children: []
        });
      });
      
      // Xây dựng cấu trúc cây
      folders.forEach(folder => {
        const folderNode = folderMap.get(folder.id);
        if (!folderNode) return;
        
        if (folder.parentFolderId === null) {
          rootFolders.push(folderNode);
        } else {
          const parentFolder = folderMap.get(folder.parentFolderId);
          if (parentFolder) {
            parentFolder.children.push(folderNode);
          }
        }
      });
      
      return rootFolders;
    };
    
    // Lấy danh sách thư mục từ API
    const fetchFolders = async () => {
      isLoading.value = true;
      try {
        const folders = await driveStore.getAllFolders();
        folderTree.value = buildFolderTree(folders);
        
        // Nếu có folders và chưa có folder nào được chọn, tự động chọn folder đầu tiên
        if (folderTree.value.length > 0 && props.selectedFolderId === 0) {
          emit('select-folder', folderTree.value[0].id);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thư mục:', error);
      } finally {
        isLoading.value = false;
      }
    };
    
    // Theo dõi thay đổi trong store để cập nhật cây thư mục
    watch(() => driveStore.folders, () => {
      folderTree.value = buildFolderTree(driveStore.folders);
    });
    
    // Chọn folder
    const handleSelectFolder = (folderId: number) => {
      emit('select-folder', folderId);
    };
    
    // Xử lý đổi tên folder
    const handleRenameFolder = (folder: TreeFolder) => {
      emit('rename-folder', folder);
    };
    
    // Xử lý xóa folder
    const handleDeleteFolder = (folder: TreeFolder) => {
      emit('delete-folder', folder);
    };
    
    // Xử lý tạo thư mục con
    const handleCreateSubfolder = (folderId: number) => {
      emit('create-subfolder', folderId);
    };
    
    // Lấy danh sách folder khi component được tạo
    onMounted(() => {
      fetchFolders();
    });
    
    return {
      isLoading,
      folderTree,
      handleSelectFolder,
      handleRenameFolder,
      handleDeleteFolder,
      handleCreateSubfolder,
      fetchFolders
    };
  }
});
</script>

<style scoped>
.sidebar {
  width: 280px;
  background-color: white;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow-y: auto;
}

.sidebar-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.section {
  margin-bottom: 1.5rem;
}

.section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.add-root-folder-btn {
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

.add-root-folder-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--primary-color);
}

.folder-tree {
  display: flex;
  flex-direction: column;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.folder-item:hover {
  background-color: var(--secondary-color);
}

.folder-item.is-selected {
  background-color: var(--primary-color);
  color: white;
}

.folder-item.is-selected .folder-icon {
  color: white;
}

.folder-icon {
  margin-right: 0.5rem;
  color: var(--text-secondary);
}

.loading-folders, .empty-folders, .empty-favorites {
  padding: 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background-color: white;
  border: 1px solid var(--border-color);
  transition: background-color 0.2s;
}

.favorite-item:hover {
  background-color: var(--secondary-color);
}

.favorite-icon {
  margin-right: 0.5rem;
  color: var(--text-secondary);
}

.favorite-details {
  flex: 1;
  overflow: hidden;
}

.favorite-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-path {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
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

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

.create-folder-link {
  color: var(--primary-color);
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}
</style> 