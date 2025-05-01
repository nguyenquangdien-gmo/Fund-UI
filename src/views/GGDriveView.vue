<template>
  <div class="app-container">

    <div class="main-content">
      <GGDriveSidebar
        :selected-folder-id="selectedFolderId"
        :favorites="favorites"
        @select-folder="selectFolder"
        @edit-favorite="editFavorite"
        @remove-favorite="removeFavorite"
        @rename-folder="showRenameFolderDialog"
        @delete-folder="confirmDeleteFolder"
        @create-root-folder="createRootFolder"
        @create-subfolder="createSubfolder"
        ref="sidebar"
      />

      <GGDriveMainContent
        :folder-contents="folderContents"
        :breadcrumbs="breadcrumbs"
        :is-admin="isAdmin"
        :is-loading="isLoading"
        :favorites="favorites"
        @select-folder="selectFolder"
        @navigate-to-breadcrumb="navigateToBreadcrumb"
        @show-upload-modal="showUploadModal = true"
        @show-create-folder-modal="showCreateFolderModal = true"
        @add-to-favorites="addToFavorites"
        @copy-share-link="copyShareLink"
        @download-file="downloadFile"
        @delete-file="deleteFile"
        @delete-folder="deleteFolder"
        @rename-file="showRenameFileDialog"
        @rename-folder="showRenameFolderDialog"
      />
    </div>

    <GGDriveUploadDialog
      v-model:visible="showUploadModal"
      @upload-files="uploadSelectedFiles"
    />

    <GGDriveEditFavoriteDialog
      v-model:visible="showEditFavoriteModal"
      :favorite="editingFavorite"
      @save-favorite="saveFavorite"
    />

    <GGDriveCreateFolderDialog
      v-model:visible="showCreateFolderModal"
      :parent-folder-id="selectedFolderId"
      :existing-folders="folderContents.subFolders"
      @create-folder="createFolder"
    />

    <GGDriveRenameItemDialog
      v-model:visible="showRenameItemModal"
      :item="itemToRename"
      @rename-item="renameItem"
    />

    <GGDriveConfirmDialog
      v-model:visible="showConfirmDialog"
      title="Xác nhận xóa"
      :message="confirmMessage"
      confirmLabel="Xóa"
      confirmIcon="pi pi-trash"
      @confirm="confirmAction"
    />

    <PToast />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PToast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import GGDriveSidebar from '@/components/GGDrive/Sidebar.vue';
import GGDriveMainContent from '@/components/GGDrive/MainContent.vue';
import GGDriveUploadDialog from '@/components/GGDrive/UploadDialog.vue';
import GGDriveEditFavoriteDialog from '@/components/GGDrive/EditFavoriteDialog.vue';
import GGDriveCreateFolderDialog from '@/components/GGDrive/CreateFolderDialog.vue';
import GGDriveRenameItemDialog from '@/components/GGDrive/RenameItemDialog.vue';
import GGDriveConfirmDialog from '@/components/GGDrive/ConfirmDialog.vue';
import { useDriveStore } from '@/stores/drive';

interface User {
  name: string;
  initials: string;
  isAdmin: boolean;
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

interface Breadcrumb {
  id: number;
  name: string;
}

interface DriveFolder {
  id: number;
  name: string;
}

interface FolderContents {
  files: DriveFile[];
  subFolders: DriveFolder[];
  currentFolder: DriveFolder | null;
}

export default defineComponent({
  name: 'GGDriveView',
  components: {
    GGDriveSidebar,
    GGDriveMainContent,
    GGDriveUploadDialog,
    GGDriveEditFavoriteDialog,
    GGDriveCreateFolderDialog,
    GGDriveRenameItemDialog,
    GGDriveConfirmDialog,
    PToast
  },
  setup() {
    const toast = useToast();
    const driveStore = useDriveStore();
    return { toast, driveStore };
  },
  data() {
    return {
      // User info
      currentUser: {
        name: 'Nguyễn Văn A',
        initials: 'NVA',
        isAdmin: true
      } as User,
      isAdmin: true,

      // Folder details
      selectedFolderId: 0,
      breadcrumbs: [] as Breadcrumb[],
      folderContents: {
        files: [],
        subFolders: [],
        currentFolder: null
      } as FolderContents,
      isLoading: false,

      // Favorites
      favorites: [
        {
          id: 'fav1',
          name: 'Tài liệu quan trọng',
          type: 'folder' as const,
          path: 'Gốc/Tài liệu/Dự án công việc',
          originalId: 'folder1-1'
        }
      ] as Favorite[],
      
      // Upload
      showUploadModal: false,
      
      // Edit favorite
      showEditFavoriteModal: false,
      editingFavorite: {
        id: '',
        name: '',
        type: 'folder' as const,
        path: '',
        originalId: ''
      } as Favorite,
      
      // Create folder
      showCreateFolderModal: false,
      
      // Rename item
      showRenameItemModal: false,
      itemToRename: {
        id: 0,
        name: '',
        type: 'folder' as 'file' | 'folder'
      },
      
      // Confirm dialog
      showConfirmDialog: false,
      confirmMessage: '',
      pendingAction: null as (() => Promise<void>) | null,
    };
  },
  methods: {
    // Folder navigation methods
    async selectFolder(id: number): Promise<void> {
      try {
        this.isLoading = true;
        
        // Cập nhật ID folder được chọn
        this.selectedFolderId = id;
        
        // Xóa nội dung hiện tại để tránh hiển thị dữ liệu cũ
        this.folderContents = {
          files: [],
          subFolders: [],
          currentFolder: null
        };
        
        // If id is 0, it means we're viewing the root or there are no folders
        if (id === 0) {
          // Just clear the folder contents
          this.folderContents = {
            files: [],
            subFolders: [],
            currentFolder: null
          };
          this.breadcrumbs = [];
          this.isLoading = false;
          return;
        }
        
        // Lấy nội dung thư mục từ API với cache buster để đảm bảo dữ liệu mới
        const contents = await this.driveStore.listFolderContents(id);
        
        // Định dạng lại dữ liệu phù hợp với cấu trúc folderContents
        this.folderContents = {
          files: contents.files || [],
          subFolders: contents.folders || [],
          currentFolder: contents.currentFolder || null
        };
        
        // Xây dựng breadcrumb
        this.buildBreadcrumbs(id, contents.currentFolder);
      } catch (error) {
        console.error('Error fetching folder contents:', error);
        this.showToast('Không thể tải nội dung thư mục', 'error');
        
        // Trong trường hợp lỗi, làm sạch dữ liệu hiển thị
        this.folderContents = {
          files: [],
          subFolders: [],
          currentFolder: null
        };
      } finally {
        this.isLoading = false;
      }
    },
    
    // Xây dựng breadcrumb từ dữ liệu thư mục
    buildBreadcrumbs(folderId: number, folder: DriveFolder | null): void {
      // Nếu không có folder, breadcrumbs rỗng
      if (!folder) {
        this.breadcrumbs = [];
        return;
      }
      
      // Tạo breadcrumb chỉ với folder hiện tại
      this.breadcrumbs = [{ id: folder.id, name: folder.name }];
      
      // Nếu có thông tin về parent folder, có thể mở rộng breadcrumb
      // (Cần backend trả về thông tin đầy đủ về đường dẫn)
    },
    
    navigateToBreadcrumb(id: number): void {
      this.selectFolder(id);
    },
    
    // File actions
    copyShareLink(file: DriveFile): void {
      navigator.clipboard.writeText(file.webViewLink).then(() => {
        this.showToast('Đã sao chép liên kết chia sẻ vào clipboard', 'success');
      }).catch((error) => {
        console.error('Error copying to clipboard:', error);
        this.showToast('Không thể sao chép liên kết', 'error');
      });
    },
    
    downloadFile(file: DriveFile): void {
      try {
        window.open(file.webContentLink, '_blank');
        this.showToast(`Đang tải xuống ${file.name}...`, 'info');
      } catch (error) {
        console.error('Error downloading file:', error);
        this.showToast('Không thể tải xuống tập tin', 'error');
      }
    },
    
    // Xóa file 
    async deleteFile(file: DriveFile): Promise<void> {
      if (confirm(`Bạn có chắc chắn muốn xóa "${file.name}"?`)) {
        try {
          await this.driveStore.deleteFile(file.id);
          this.showToast(`Đã xóa ${file.name} thành công`, 'success');
          // Tải lại nội dung thư mục
          await this.selectFolder(this.selectedFolderId);
        } catch (error) {
          console.error('Error deleting file:', error);
          this.showToast('Không thể xóa tập tin', 'error');
        }
      }
    },
    
    // Xóa thư mục
    async deleteFolder(folder: DriveFolder): Promise<void> {
      try {
        // Lưu ID của folder đang xem để kiểm tra sau
        const isCurrentFolder = this.selectedFolderId === folder.id;
        
        // Hiển thị loading để ngăn người dùng tương tác trong khi xử lý
        this.isLoading = true;
        
        // Thực hiện xóa folder
        await this.driveStore.deleteFolder(folder.id);
        
        // 1. Cập nhật danh sách folders trong store trước
        const folders = await this.driveStore.getAllFolders();
        
        // 2. Cập nhật cây thư mục trong sidebar
        await this.refreshFolderTree();
        
        // 3. Xử lý UI hiển thị
        if (isCurrentFolder) {
          // Nếu đang xem folder bị xóa, đặt lại state
          this.folderContents = { files: [], subFolders: [], currentFolder: null };
          this.breadcrumbs = [];
          
          // Nếu còn folder khác, chọn folder đầu tiên
          if (folders.length > 0) {
            this.selectedFolderId = folders[0].id;
            await this.selectFolder(folders[0].id);
          } else {
            // Nếu không còn folder nào, đặt selectedFolderId về 0 để sidebar biết
            this.selectedFolderId = 0;
          }
        } else {
          // Nếu đang xem folder khác, tải lại nội dung folder đó
          // Nhưng trước tiên, xóa dữ liệu hiện tại
          this.folderContents = { files: [], subFolders: [], currentFolder: null };
          
          // Tải lại nội dung folder hiện tại
          await this.selectFolder(this.selectedFolderId);
        }
        
        // 4. Thông báo thành công
        this.showToast(`Đã xóa thư mục ${folder.name} thành công`, 'success');
      } catch (error) {
        console.error('Error deleting folder:', error);
        this.showToast('Không thể xóa thư mục', 'error');
      } finally {
        // Đảm bảo tắt loading dù có lỗi hay không
        this.isLoading = false;
      }
    },
    
    // Hiển thị dialog xác nhận xóa thư mục
    confirmDeleteFolder(folder: DriveFolder): void {
      const foldersCount = this.driveStore.folders.length;
      
      // Nếu đây là folder cuối cùng, hiển thị cảnh báo đặc biệt
      if (foldersCount <= 1) {
        this.confirmMessage = `Đây là thư mục duy nhất. Bạn có chắc chắn muốn xóa thư mục "${folder.name}"?`;
      } else {
        this.confirmMessage = `Bạn có chắc chắn muốn xóa thư mục "${folder.name}"?`;
      }
      
      this.pendingAction = () => this.deleteFolder(folder);
      this.showConfirmDialog = true;
    },
    
    // Xác nhận thao tác
    confirmAction(): void {
      if (this.pendingAction) {
        this.pendingAction();
        this.pendingAction = null;
      }
    },
    
    // Upload methods
    async uploadSelectedFiles(files: File[]): Promise<void> {
      this.showToast(`Đang tải lên ${files.length} tập tin...`, 'info');
      
      try {
        for (const file of files) {
          await this.driveStore.uploadFile(this.selectedFolderId, file);
        }
        this.showToast('Tải lên tập tin thành công', 'success');
        // Tải lại nội dung thư mục
        await this.selectFolder(this.selectedFolderId);
      } catch (error) {
        console.error('Error uploading files:', error);
        this.showToast('Không thể tải lên tập tin', 'error');
      }
    },
    
    // Favorites methods
    addToFavorites(file: DriveFile): void {
      const existingFavorite = this.favorites.find(f => f.originalId === file.id.toString());
      
      if (existingFavorite) {
        this.showToast('Mục này đã có trong yêu thích', 'info');
        return;
      }
      
      const newFavorite: Favorite = {
        id: 'fav' + (this.favorites.length + 1),
        name: file.name,
        type: 'file',
        path: this.breadcrumbs.map(b => b.name).join('/') + '/' + file.name,
        originalId: file.id.toString()
      };
      
      this.favorites.push(newFavorite);
      this.showToast(`Đã thêm ${file.name} vào yêu thích`, 'success');
    },
    
    editFavorite(id: string): void {
      const favorite = this.favorites.find(f => f.id === id);
      if (favorite) {
        this.editingFavorite = { ...favorite };
        this.showEditFavoriteModal = true;
      }
    },
    
    saveFavorite(updatedFavorite: Favorite): void {
      const index = this.favorites.findIndex(f => f.id === updatedFavorite.id);
      if (index !== -1) {
        this.favorites[index] = updatedFavorite;
        this.showToast('Đã cập nhật yêu thích thành công', 'success');
      }
      this.showEditFavoriteModal = false;
    },
    
    removeFavorite(id: string): void {
      this.favorites = this.favorites.filter(f => f.id !== id);
      this.showToast('Đã xóa khỏi yêu thích', 'success');
    },
    
    // Create folder methods
    async createFolder(data: { name: string, parentFolderId: number }): Promise<void> {
      try {
        // If selectedFolderId is 0, it means we're creating at root level
        // and parentFolderId should be null
        const parentId = data.parentFolderId === 0 ? null : data.parentFolderId;
        
        await this.driveStore.createFolder(data.name, parentId);
        this.showToast(`Đã tạo thư mục ${data.name} thành công`, 'success');
        
        // Reload folder contents if we're in a specific folder
        if (this.selectedFolderId !== 0) {
          await this.selectFolder(this.selectedFolderId);
        }
        
        // Reload folder tree in sidebar
        await this.refreshFolderTree();
      } catch (error) {
        console.error('Error creating folder:', error);
        this.showToast('Không thể tạo thư mục', 'error');
      }
    },
    
    // Refresh folder tree
    async refreshFolderTree(): Promise<void> {
      try {
        // Sử dụng type casting cụ thể để tránh lỗi TypeScript
        const sidebarComponent = this.$refs.sidebar as { fetchFolders?: () => Promise<void> } | undefined;
        
        if (sidebarComponent && typeof sidebarComponent.fetchFolders === 'function') {
          await sidebarComponent.fetchFolders();
        } else {
          // Phương án dự phòng nếu không thể gọi trực tiếp
          await this.driveStore.getAllFolders();
        }
      } catch (error) {
        console.error('Error refreshing folder tree:', error);
      }
    },
    
    // Rename methods
    showRenameFileDialog(file: DriveFile): void {
      this.itemToRename = {
        id: file.id,
        name: file.name,
        type: 'file'
      };
      this.showRenameItemModal = true;
    },
    
    showRenameFolderDialog(folder: DriveFolder): void {
      this.itemToRename = {
        id: folder.id,
        name: folder.name,
        type: 'folder'
      };
      this.showRenameItemModal = true;
    },
    
    async renameItem(data: { id: number, type: 'file' | 'folder', newName: string }): Promise<void> {
      try {
        if (data.type === 'file') {
          await this.driveStore.renameFile(data.id, data.newName);
        } else {
          await this.driveStore.renameFolder(data.id, data.newName);
          // Cập nhật cây thư mục khi đổi tên folder
          await this.refreshFolderTree();
        }
        
        this.showToast(`Đã đổi tên thành ${data.newName} thành công`, 'success');
        // Reload folder contents
        await this.selectFolder(this.selectedFolderId);
      } catch (error) {
        console.error('Error renaming item:', error);
        this.showToast('Không thể đổi tên', 'error');
      }
    },
    
    // Toast notification
    showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
      this.toast.add({
        severity: type,
        summary: type === 'success' ? 'Thành công' : 
                 type === 'error' ? 'Lỗi' : 
                 type === 'warning' ? 'Cảnh báo' : 'Thông tin',
        detail: message,
        life: 3000
      });
    },

    // Method to create a root-level folder
    createRootFolder(): void {
      // Set the context for folder creation to root level
      this.selectedFolderId = 0;
      // Show the create folder dialog
      this.showCreateFolderModal = true;
    },

    // Method to create a subfolder within a parent folder
    createSubfolder(parentFolderId: number): void {
      // Set the selected folder ID to the parent ID to prepare for folder creation
      this.selectedFolderId = parentFolderId;
      // Show the create folder dialog
      this.showCreateFolderModal = true;
    },
  },
  async mounted() {
    try {
      // Mặc định không load gì cả, để sidebar tự động chọn folder đầu tiên
      // Sidebar sẽ emit sự kiện select-folder và folder đầu tiên sẽ được load
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showToast('Không thể tải dữ liệu ban đầu', 'error');
    }
  }
});
</script>

<style>
:root {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --secondary-color: #f9fafb;
  --text-color: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text-color);
  line-height: 1.5;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    max-height: 300px;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .actions {
    width: 100%;
  }
  
  .upload-btn {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .file-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .file-icon {
    margin-bottom: 0.5rem;
  }
  
  .file-actions {
    margin-top: 0.5rem;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>