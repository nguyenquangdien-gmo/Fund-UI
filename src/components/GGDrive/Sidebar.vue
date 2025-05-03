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
              :expand-folder-ids="expandFolderIds"
              :sub-folders="getSubfolders(folder.id)"
              @select-folder="$emit('select-folder', $event)"
              @rename-folder="$emit('rename-folder', $event)"
              @delete-folder="$emit('delete-folder', $event)"
              @create-subfolder="$emit('create-subfolder', $event)"
              @download-folder="$emit('download-folder', $event)"
              @add-to-favorites="$emit('add-to-favorites', $event)"
            />
          </div>
        </div>
      </div>
      
      <!-- Favorites section (combined Drive Bookmarks and External Links) -->
      <div class="section favorites-section">
        <div class="section-header">
          <h3>Yêu thích</h3>
          <button class="add-folder-btn" @click="$emit('add-external-bookmark')" title="Thêm liên kết ngoài">
            <i class="pi pi-plus"></i>
          </button>
        </div>
        
        <div class="favorites-list">
          <div v-if="isLoadingBookmarks" class="loading-favorites">
            <div class="spinner"></div>
            <span>Đang tải yêu thích...</span>
          </div>
          
          <div v-else-if="allBookmarks.length === 0" class="empty-favorites">
            Chưa có mục yêu thích nào
          </div>
          
          <div v-else class="favorite-items">
            <!-- Drive bookmarks -->
            <div 
              v-for="bookmark in driveBookmarks" 
              :key="`drive-${bookmark.id}`" 
              class="favorite-item"
              @click="handleBookmarkClick(bookmark)"
            >
              <div class="favorite-icon">
                <i :class="bookmark.type === 'FOLDER' ? 'pi pi-folder' : 'pi pi-file'"></i>
              </div>
              <div class="favorite-content">
                <span class="favorite-name">{{ bookmark.name }}</span>
                <span class="favorite-type">{{ bookmark.type === 'FOLDER' ? 'Thư mục' : 'Tập tin' }}</span>
              </div>
              <div class="favorite-actions">
                <button @click.stop="$emit('edit-favorite', bookmark.id)" class="action-btn" title="Chỉnh sửa">
                  <i class="pi pi-pencil"></i>
                </button>
                <button @click.stop="$emit('remove-favorite', bookmark.id)" class="action-btn" title="Xóa">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
            
            <!-- External bookmarks -->
            <div 
              v-for="bookmark in externalBookmarks" 
              :key="`external-${bookmark.id}`" 
              class="favorite-item external-link"
              @click="openExternalLink(bookmark.url)"
            >
              <div class="favorite-icon external">
                <i class="pi pi-external-link"></i>
              </div>
              <div class="favorite-content">
                <span class="favorite-name">{{ bookmark.name }}</span>
                <span class="favorite-type">Liên kết ngoài</span>
              </div>
              <div class="favorite-actions">
                <button @click.stop="$emit('edit-favorite', bookmark.id)" class="action-btn" title="Chỉnh sửa">
                  <i class="pi pi-pencil"></i>
                </button>
                <button @click.stop="$emit('remove-favorite', bookmark.id)" class="action-btn" title="Xóa">
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
import { defineComponent, ref, onMounted, computed, watch } from 'vue';
import { useDriveStore } from '../../stores/drive';
import FolderTreeItem from './FolderTreeItem.vue';

interface Favorite {
  id: number;
  name: string;
  type: string;
  source: string;
  googleId?: string;
  url?: string;
  originalId?: string;
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
    'create-subfolder',
    'download-folder',
    'add-drive-bookmark',
    'add-external-bookmark',
    'add-to-favorites',
    'preview-bookmark'
  ],
  setup(props, { emit }) {
    const driveStore = useDriveStore();
    const isLoadingFolders = ref(false);
    const isLoadingBookmarks = ref(false);
    const folders = ref<DriveFolder[]>([]);
    const rootFolders = ref<DriveFolder[]>([]);
    const expandFolderIds = ref<number[]>([]);
    
    // Theo dõi sự thay đổi của selectedFolderId
    watch(() => props.selectedFolderId, (newFolderId) => {
      console.log('Sidebar nhận thấy selectedFolderId thay đổi:', newFolderId);
      
      // Nếu có selectedFolderId mới, mở rộng folder cha của nó (nếu cần)
      if (newFolderId && newFolderId !== 0) {
        // Tìm đường dẫn thư mục để biết cần mở rộng thư mục cha nào
        expandFolderParents(newFolderId);
      }
    });
    
    // Filter bookmarks by source
    const driveBookmarks = computed(() => 
      props.favorites.filter(bookmark => bookmark.source === 'DRIVE')
    );
    
    const externalBookmarks = computed(() => 
      props.favorites.filter(bookmark => bookmark.source === 'EXTERNAL')
    );
    
    const allBookmarks = computed(() => props.favorites);
    
    // Handle bookmark click based on type
    const handleBookmarkClick = (bookmark: Favorite) => {
      if (bookmark.source === 'DRIVE') {
        // Lấy ID từ bookmark
        const bookmarkId = bookmark.googleId ? bookmark.googleId : bookmark.originalId;
        
        if (!bookmarkId) return;
        
        // Phân biệt xử lý dựa vào loại (FILE hoặc FOLDER)
        if (bookmark.type === 'FOLDER') {
          // Nếu là folder, chuyển đến folder đó
          const folderId = parseInt(bookmarkId);
          if (!isNaN(folderId)) {
            emit('select-folder', folderId);
          }
        } else if (bookmark.type === 'FILE') {
          // Nếu là file, emit sự kiện để mở file với webViewLink
          emit('preview-bookmark', bookmark);
        }
      } else if (bookmark.source === 'EXTERNAL' && bookmark.url) {
        window.open(bookmark.url, '_blank');
      }
    };
    
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
    
    // Tìm và mở rộng tất cả các thư mục cha của một thư mục cụ thể
    const expandFolderParents = (folderId: number) => {
      // Tìm folder hiện tại
      const currentFolder = folders.value.find(f => f.id === folderId);
      
      if (currentFolder && currentFolder.parentFolderId) {
        // Tìm đường dẫn đến thư mục hiện tại để biết cần mở rộng thư mục nào
        const findFolderPath = (folders: DriveFolder[], targetId: number, currentPath: DriveFolder[] = []): DriveFolder[] | null => {
          for (const folder of folders) {
            // Kiểm tra folder hiện tại
            if (folder.id === targetId) {
              return [...currentPath, folder];
            }

            // Kiểm tra trong các folder con
            if (folder.children && folder.children.length > 0) {
              const path = findFolderPath(folder.children, targetId, [...currentPath, folder]);
              if (path) return path;
            }
          }
          return null;
        };

        const folderPath = findFolderPath(rootFolders.value, folderId);
        
        if (folderPath && folderPath.length > 0) {
          // Lấy các ID của thư mục cha cần mở rộng (tất cả trừ folder hiện tại)
          console.log('Mở rộng các thư mục cha để hiển thị:', folderPath.map(f => f.name).join(' > '));
          // Cập nhật danh sách các folder cần mở rộng (chỉ các thư mục cha, không bao gồm folder hiện tại)
          expandFolderIds.value = folderPath.slice(0, -1).map(f => f.id);
        }
      }
    };
    
    // Hàm giúp mở rộng một thư mục theo ID và tất cả các thư mục cha của nó
    const expandFolder = (folderId: number) => {
      expandFolderParents(folderId);
    };
    
    // Tìm tất cả subfolder của một folder
    const getSubfolders = (folderId: number) => {
      return folders.value.filter(folder => folder.parentFolderId === folderId);
    };
    
    // Mở liên kết ngoài trong tab mới
    const openExternalLink = (url: string | undefined) => {
      if (url) {
        window.open(url, '_blank');
      }
    };
    
    // Lấy danh sách folder khi component được tạo
    onMounted(() => {
      fetchFolders();
    });
    
    return {
      isLoadingFolders,
      isLoadingBookmarks,
      folders,
      rootFolders,
      expandFolderIds,
      driveBookmarks,
      externalBookmarks,
      allBookmarks,
      getSubfolders,
      fetchFolders,
      openExternalLink,
      expandFolder,
      expandFolderParents,
      handleBookmarkClick
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
  padding: 0.75rem;
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
  margin-bottom: 1rem;
}

.section h3 {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.add-folder-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
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

.loading-folders, .loading-favorites, .empty-folders, .empty-favorites {
  padding: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
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
  gap: 0.6rem;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.7rem;
  border-radius: 0.5rem;
  background-color: white;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.favorite-item:hover {
  background-color: var(--secondary-color);
  transform: translateY(-1px);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.08);
}

.favorite-item.external-link {
  cursor: pointer;
}

.favorite-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 8px;
  margin-right: 0.8rem;
  background-color: rgba(79, 70, 229, 0.1);
  color: var(--primary-color);
}

.favorite-icon.external {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.favorite-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.favorite-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-type {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.1rem;
}

.favorite-actions {
  display: flex;
  gap: 0.3rem;
  margin-left: 0.5rem;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.favorite-item:hover .favorite-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
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

.external-links-section .favorite-icon {
  color: var(--primary-color);
}
</style> 