<template>
  <div class="sidebar">
    <div class="sidebar-content">
    
      
      <!-- Folders section -->
      <div class="section folders-section">
        <div class="section-header">
          <h3>Thư mục</h3>
          <button class="add-folder-btn" @click="$emit('create-root-folder')" title="Tạo thư mục mới">
            <i class="pi pi-plus"></i>
          </button>
        </div>
        
        <div class="folders-tree">
          <div v-if="isLoadingFolders" class="loading-folders">
            <div class="spinner"></div>
            <span>Đang tải thư mục...</span>
          </div>
          
          <div v-else-if="folders.length === 0" class="empty-folders">
            Chưa có thư mục nào
            <button class="create-folder-link" @click="$emit('create-root-folder')">
              <i class="pi pi-folder-plus"></i>
              Tạo thư mục
            </button>
          </div>
          
          <div v-else class="folder-items">
            <folder-tree-item 
              v-for="folder in rootFolders" 
              :key="folder.id"
              :folder="folder"
              :selected-folder-id="selectedFolderId"
              :sub-folders="getSubfolders(folder.id)"
              @select-folder="$emit('select-folder', $event)"
              @rename-folder="$emit('rename-folder', $event)"
              @delete-folder="$emit('delete-folder', $event)"
              @create-subfolder="$emit('create-subfolder', $event)"
            />
          </div>
        </div>
      </div>
        <!-- Favorites section -->
        <div class="section favorites-section">
        <div class="section-header">
          <h3>Yêu thích</h3>
        </div>
        
        <div class="favorites-list">
          <div v-if="favorites.length === 0" class="empty-favorites">
            Chưa có mục yêu thích nào
          </div>
          <div v-else class="favorite-items">
            <div 
              v-for="favorite in favorites" 
              :key="favorite.id" 
              class="favorite-item"
            >
              <div class="favorite-icon">
                <i :class="favorite.type === 'folder' ? 'pi pi-folder' : 'pi pi-file'"></i>
              </div>
              <span class="favorite-name">{{ favorite.name }}</span>
              <div class="favorite-actions">
                <button @click="$emit('edit-favorite', favorite.id)" class="action-btn" title="Chỉnh sửa">
                  <i class="pi pi-pencil"></i>
                </button>
                <button @click="$emit('remove-favorite', favorite.id)" class="action-btn" title="Xóa">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useDriveStore } from '../../stores/drive';
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
  children: DriveFolder[];
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
  emits: [
    'select-folder', 
    'edit-favorite', 
    'remove-favorite', 
    'rename-folder', 
    'delete-folder', 
    'create-root-folder', 
    'create-subfolder'
  ],
  setup(props, { emit }) {
    const driveStore = useDriveStore();
    const isLoadingFolders = ref(false);
    const folders = ref<DriveFolder[]>([]);
    const rootFolders = ref<DriveFolder[]>([]);
    
    // Chuyển đổi danh sách folder phẳng thành cấu trúc cây
    const buildFolderTree = (foldersList: DriveFolder[]) => {
      const folderMap = new Map<number, DriveFolder>();
      const rootFoldersList: DriveFolder[] = [];
      
      // Tạo đối tượng TreeFolder cho mỗi folder
      foldersList.forEach(folder => {
        folderMap.set(folder.id, {
          ...folder,
          children: []
        });
      });
      
      // Xây dựng cấu trúc cây
      foldersList.forEach(folder => {
        const folderNode = folderMap.get(folder.id);
        if (!folderNode) return;
        
        if (folder.parentFolderId === null) {
          rootFoldersList.push(folderNode);
        } else {
          const parentFolder = folderMap.get(folder.parentFolderId);
          if (parentFolder) {
            parentFolder.children.push(folderNode);
          }
        }
      });
      
      return rootFoldersList;
    };
    
    // Lấy danh sách thư mục từ API
    const fetchFolders = async () => {
      isLoadingFolders.value = true;
      try {
        const foldersList = await driveStore.getAllFolders();
        folders.value = foldersList;
        rootFolders.value = buildFolderTree(foldersList);
        
        // Nếu có folders và chưa có folder nào được chọn, tự động chọn folder đầu tiên
        if (rootFolders.value.length > 0 && props.selectedFolderId === 0) {
          emit('select-folder', rootFolders.value[0].id);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thư mục:', error);
      } finally {
        isLoadingFolders.value = false;
      }
    };
    
    // Tìm tất cả subfolder của một folder
    const getSubfolders = (folderId: number) => {
      return folders.value.filter(folder => folder.parentFolderId === folderId);
    };
    
    // Lấy danh sách folder khi component được tạo
    onMounted(() => {
      fetchFolders();
    });
    
    return {
      isLoadingFolders,
      folders,
      rootFolders,
      getSubfolders,
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

.add-folder-btn {
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

.add-folder-btn:hover {
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

.spinner {
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