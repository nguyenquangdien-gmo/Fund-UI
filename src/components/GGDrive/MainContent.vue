<template>
  <main class="content">
    <!-- Current Path and Actions -->
    <div class="content-header">
      <div class="breadcrumb">
        <span v-if="breadcrumbs.length === 0" class="breadcrumb-empty">
          Không có thư mục nào được chọn
        </span>
        <template v-else>
          <!-- Thêm nút Trang chủ/Home ở đầu breadcrumb -->
          <span class="breadcrumb-item home" @click="$emit('navigate-to-breadcrumb', 0)">
            <i class="pi pi-home"></i> Trang chủ
          </span>
          <span class="breadcrumb-separator">/</span>
          
          <!-- Hiển thị breadcrumb -->
          <span v-for="(crumb, index) in breadcrumbs" :key="index">
            <span class="breadcrumb-item" @click="$emit('navigate-to-breadcrumb', crumb.id)">{{ crumb.name }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
          </span>
        </template>
      </div>
      <div class="actions">
        <PButton icon="pi pi-folder-plus" label="Thư mục mới" class="p-button-secondary mr-2" @click="$emit('show-create-folder-modal')" />
        <PButton icon="pi pi-upload" label="Tải lên" @click="$emit('show-upload-modal')" />
      </div>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div>Đang tải...</div>
    </div>

    <!-- Files List -->
    <div v-else class="files-container">
      <div v-if="!hasContent" class="empty-state">
        Không có tập tin trong thư mục này
      </div>
      <div v-else class="files-list">
        <!-- Folders -->
        <div v-for="folder in folderContents.subFolders" :key="'folder-' + folder.id" class="file-item">
          <div class="file-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            </svg>
          </div>
          <div class="file-details" @click="$emit('select-folder', folder.id)">
            <div class="file-name">{{ folder.name }}</div>
            <div class="file-meta">
              <span>{{ formatDate(folder.modifiedTime) }}</span>
            </div>
          </div>
          <div class="file-actions">
            <PButton v-if="isFavorite(folder)" icon="pi pi-star-fill" class="p-button-text favorite-icon" @click="$emit('add-to-favorites', folder)" />
            <PButton v-else icon="pi pi-star" class="p-button-text" @click="$emit('add-to-favorites', folder)" />
            <PButton icon="pi pi-share-alt" class="p-button-text" @click="$emit('copy-share-link', folder)" />
            <PButton icon="pi pi-download" class="p-button-text" @click="$emit('download-folder', folder)" title="Tải xuống ZIP" />
            <PButton icon="pi pi-pencil" class="p-button-text" @click="$emit('rename-folder', folder)" />
            <PButton v-if="isAdmin" icon="pi pi-trash" class="p-button-text p-button-danger" @click="$emit('delete-folder', folder)" />
          </div>
        </div>

        <!-- Files -->
        <div v-for="file in folderContents.files" :key="'file-' + file.id" class="file-item">
          <div class="file-icon" @click="previewFile(file)">
            <svg v-if="file.mimeType.includes('image')" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
            <svg v-else-if="file.mimeType.includes('pdf')" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" x2="8" y1="13" y2="13"></line>
              <line x1="16" x2="8" y1="17" y2="17"></line>
              <line x1="10" x2="8" y1="9" y2="9"></line>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div class="file-details" @click="previewFile(file)">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-meta">
              <span>{{ formatDate(file.modifiedTime) }}</span>
              <span>{{ formatFileSize(file.size) }}</span>
            </div>
          </div>
          <div class="file-actions">
            <PButton v-if="isFavorite(file)" icon="pi pi-star-fill" class="p-button-text favorite-icon" @click="$emit('add-to-favorites', file)" />
            <PButton v-else icon="pi pi-star" class="p-button-text" @click="$emit('add-to-favorites', file)" />
            <PButton icon="pi pi-eye" class="p-button-text" @click="previewFile(file)" title="Xem trước" />
            <PButton icon="pi pi-share-alt" class="p-button-text" @click="$emit('copy-share-link', file)" />
            <PButton icon="pi pi-download" class="p-button-text" @click="$emit('download-file', file)" />
            <PButton icon="pi pi-pencil" class="p-button-text" @click="$emit('rename-file', file)" />
            <PButton v-if="isAdmin" icon="pi pi-trash" class="p-button-text p-button-danger" @click="$emit('delete-file', file)" />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import PButton from 'primevue/button';

interface Breadcrumb {
  id: number;
  name: string;
}

interface DriveFile {
  id: number;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink: string;
  createdTime: string;
  modifiedTime: string;
  folderId: number;
  folderName: string;
  createdByUsername: string;
}

interface Favorite {
  id: number;
  name: string;
  type: string;
  source: string;
  googleId?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  path?: string;
  originalId?: string;
}

export default defineComponent({
  name: 'GGDriveMainContent',
  components: {
    PButton
  },
  props: {
    folderContents: {
      type: Object,
      required: true,
      default: () => ({ files: [], subFolders: [], currentFolder: null })
    },
    breadcrumbs: {
      type: Array as () => Breadcrumb[],
      required: true
    },
    isAdmin: {
      type: Boolean,
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    favorites: {
      type: Array as () => Favorite[],
      required: true
    }
  },
  emits: [
    'select-folder',
    'navigate-to-breadcrumb',
    'show-upload-modal',
    'show-create-folder-modal',
    'add-to-favorites',
    'copy-share-link',
    'download-file',
    'delete-file',
    'delete-folder',
    'rename-file',
    'rename-folder',
    'download-folder',
    'preview-file'
  ],
  setup(props, { emit }) {
    // Kiểm tra xem thư mục có nội dung hay không
    const hasContent = computed(() => {
      return props.folderContents.files.length > 0 || props.folderContents.subFolders.length > 0;
    });

    // Kiểm tra xem một item có phải là favorite hay không
    const isFavorite = (item: {id: number, googleId?: string}) => {
      // Sử dụng googleId từ item thay vì id
      // Fallback đến item.id.toString() nếu không có googleId
      const itemId = item.googleId || item.id.toString();
      
      return props.favorites.some(fav => 
        (fav.googleId === itemId) || (fav.originalId === itemId)
      );
    };
    
    // Xem trước file
    const previewFile = (file: DriveFile) => {
      if (file.webViewLink) {
        // Emit event to parent component
        emit('preview-file', file);
      }
    };

    // Format ngày tháng
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Format kích thước file
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      hasContent,
      isFavorite,
      formatDate,
      formatFileSize,
      previewFile
    };
  }
});
</script>

<style scoped>
.content {
  flex: 1;
  background-color: #fafafa;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  font-size: 1rem;
  max-width: 70%;
  overflow: hidden;
}

.breadcrumb-item {
  cursor: pointer;
  color: #3B82F6;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  transition: color 0.2s;
}

.breadcrumb-item:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.breadcrumb-item.home {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumb-item.home i {
  font-size: 0.9rem;
}

.breadcrumb-separator {
  color: #6c757d;
  margin: 0 0.25rem;
}

.breadcrumb-empty {
  color: #6c757d;
  font-style: italic;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3B82F6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.files-container {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  color: #6c757d;
  text-align: center;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: #f8f9fa;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #e9ecef;
  margin-right: 1rem;
  color: #6c757d;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.file-icon:hover {
  background-color: #dee2e6;
  transform: scale(1.05);
}

.file-details {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.file-details:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.file-meta {
  display: flex;
  gap: 1rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.file-actions {
  display: flex;
  gap: 0.25rem;
}

.favorite-icon {
  color: #f59e0b;
}
</style> 