<template>
  <main class="content">
    <!-- Current Path and Actions -->
    <div class="content-header">
      <div class="breadcrumb">
        <span v-if="breadcrumbs.length === 0" class="breadcrumb-empty">
          Không có thư mục nào được chọn
        </span>
        <span v-else v-for="(crumb, index) in breadcrumbs" :key="index">
          <span class="breadcrumb-item" @click="$emit('navigate-to-breadcrumb', crumb.id)">{{ crumb.name }}</span>
          <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
        </span>
      </div>
      <div class="actions">
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
            <PButton icon="pi pi-pencil" class="p-button-text" @click="$emit('rename-folder', folder)" />
            <PButton v-if="isAdmin" icon="pi pi-trash" class="p-button-text p-button-danger" @click="$emit('delete-folder', folder)" />
          </div>
        </div>

        <!-- Files -->
        <div v-for="file in folderContents.files" :key="'file-' + file.id" class="file-item">
          <div class="file-icon">
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
          <div class="file-details">
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
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  originalId: string;
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
    'add-to-favorites',
    'copy-share-link',
    'download-file',
    'delete-file',
    'delete-folder',
    'rename-file',
    'rename-folder'
  ],
  setup(props) {
    // Kiểm tra xem thư mục có nội dung hay không
    const hasContent = computed(() => {
      return props.folderContents.files.length > 0 || props.folderContents.subFolders.length > 0;
    });

    // Kiểm tra xem một item có phải là favorite hay không
    const isFavorite = (item: {id: number}) => {
      return props.favorites.some(fav => fav.originalId === item.id.toString());
    };
    
    // Xem trước file
    const previewFile = (file: DriveFile) => {
      if (file.webViewLink) {
        window.open(file.webViewLink, '_blank');
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb-item {
  cursor: pointer;
  color: var(--text-secondary);
}

.breadcrumb-item:hover {
  color: var(--primary-color);
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary-color);
  width: 40px;
  height: 40px;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.files-container {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
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
  border-radius: 0.5rem;
  background-color: white;
  border: 1px solid var(--border-color);
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: var(--secondary-color);
}

.file-icon {
  margin-right: 1rem;
  color: var(--text-secondary);
}

.file-details {
  flex: 1;
  cursor: pointer;
}

.file-name {
  font-weight: 500;
}

.file-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.breadcrumb-empty {
  color: var(--text-secondary);
  font-style: italic;
}

.favorite-icon {
  color: #f59e0b !important; /* Use warning color for filled star */
}
</style> 