<template>
  <div class="app-container">
    <div class="header">
      <h1>Google Drive</h1>
      <div class="header-actions">
        <router-link to="/drive/accounts" class="account-link">
          <PButton icon="pi pi-cog" label="Quản lý tài khoản dịch vụ" class="p-button-text" />
        </router-link>
      </div>
    </div>

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
        @show-create-folder-modal="handleMainContentCreateFolder"
        @add-to-favorites="addToFavorites"
        @copy-share-link="copyShareLink"
        @download-file="downloadFile"
        @download-folder="downloadFolder"
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
      :existing-files="folderContents.files"
      :error-message="createFolderError"
      @update:error-message="createFolderError = $event"
      @create-folder="createFolder"
    />

    <GGDriveRenameItemDialog
      v-model:visible="showRenameItemModal"
      :item="itemToRename"
      :existing-folders="folderContents.subFolders"
      :existing-files="folderContents.files"
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
import PButton from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import GGDriveSidebar from '../components/GGDrive/Sidebar.vue';
import GGDriveMainContent from '../components/GGDrive/MainContent.vue';
import GGDriveUploadDialog from '../components/GGDrive/UploadDialog.vue';
import GGDriveEditFavoriteDialog from '../components/GGDrive/EditFavoriteDialog.vue';
import GGDriveCreateFolderDialog from '../components/GGDrive/CreateFolderDialog.vue';
import GGDriveRenameItemDialog from '../components/GGDrive/RenameItemDialog.vue';
import GGDriveConfirmDialog from '../components/GGDrive/ConfirmDialog.vue';
import { useDriveStore } from '../stores/drive';

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
  parentFolderId?: number | null;
  parentFolderName?: string | null;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  createdByUsername?: string;
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
    PToast,
    PButton
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
      createFolderError: '',
      
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
        await this.buildBreadcrumbs(id, contents.currentFolder);
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
    async buildBreadcrumbs(folderId: number, folder: DriveFolder | null): Promise<void> {
      // Nếu không có folder, breadcrumbs rỗng
      if (!folder) {
        this.breadcrumbs = [];
        return;
      }
      
      // Khởi tạo mảng breadcrumb với thư mục hiện tại
      const breadcrumbList: Breadcrumb[] = [{ id: folder.id, name: folder.name }];
      
      // Lấy thông tin về path đầy đủ
      try {
        const currentFolder = folder;
        let parentId = currentFolder.parentFolderId;
        
        // Duyệt ngược lên cây thư mục
        while (parentId !== null) {
          const parentFolder = await this.driveStore.getFolderById(parentId);
          if (!parentFolder) break;
          
          // Thêm folder cha vào đầu mảng breadcrumb
          breadcrumbList.unshift({ id: parentFolder.id, name: parentFolder.name });
          
          // Cập nhật cho lần lặp tiếp theo
          parentId = parentFolder.parentFolderId;
        }
        
        // Thêm breadcrumb gốc nếu có thư mục cha
        if (breadcrumbList.length > 1) {
          this.breadcrumbs = breadcrumbList;
        } else {
          // Nếu chỉ có thư mục hiện tại (không có cha)
          this.breadcrumbs = [{ id: folder.id, name: folder.name }];
        }
      } catch (error) {
        console.error('Error building breadcrumbs:', error);
        // Trong trường hợp lỗi, chỉ hiển thị thư mục hiện tại
        this.breadcrumbs = [{ id: folder.id, name: folder.name }];
      }
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
    
    async downloadFile(file: DriveFile): Promise<void> {
      try {
        this.showToast(`Đang tải xuống ${file.name}...`, 'info');
        
        // Lấy nội dung file từ API
        const blobData = await this.driveStore.downloadFile(file.id);
        
        // Tạo URL tạm thời cho blob
        const blobUrl = window.URL.createObjectURL(blobData);
        
        // Tạo một thẻ a ẩn để tải xuống
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = file.name;
        document.body.appendChild(downloadLink);
        
        // Kích hoạt tải xuống
        downloadLink.click();
        
        // Dọn dẹp
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(downloadLink);
        
        this.showToast(`Đã tải xuống ${file.name} thành công`, 'success');
      } catch (error) {
        console.error('Error downloading file:', error);
        this.showToast('Không thể tải xuống tập tin', 'error');
      }
    },
    
    async downloadFolder(folder: DriveFolder): Promise<void> {
      try {
        this.showToast(`Đang tải xuống thư mục ${folder.name}...`, 'info');
        
        // Lấy nội dung folder dưới dạng zip từ API
        const blobData = await this.driveStore.downloadFolderAsZip(folder.id);
        
        // Tạo URL tạm thời cho blob
        const blobUrl = window.URL.createObjectURL(blobData);
        
        // Tạo một thẻ a ẩn để tải xuống
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = `${folder.name}.zip`;
        document.body.appendChild(downloadLink);
        
        // Kích hoạt tải xuống
        downloadLink.click();
        
        // Dọn dẹp
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(downloadLink);
        
        this.showToast(`Đã tải xuống thư mục ${folder.name} thành công`, 'success');
      } catch (error) {
        console.error('Error downloading folder:', error);
        this.showToast('Không thể tải xuống thư mục', 'error');
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
        console.log('Creating folder with data:', data);
        
        // If selectedFolderId is 0, it means we're creating at root level
        // and parentFolderId should be null
        const parentId = data.parentFolderId === 0 ? null : data.parentFolderId;
        
        console.log(`Sending create folder request: name=${data.name}, parentId=${parentId}`);
        await this.driveStore.createFolder(data.name, parentId);
        this.showToast(`Đã tạo thư mục ${data.name} thành công`, 'success');
        
        // Đóng dialog sau khi tạo thành công
        this.showCreateFolderModal = false;
        
        // Reload folder contents if we're in a specific folder
        if (this.selectedFolderId !== 0) {
          console.log(`Reloading folder contents for folder: ${this.selectedFolderId}`);
          await this.selectFolder(this.selectedFolderId);
        }
        
        // Reload folder tree in sidebar
        await this.refreshFolderTree();
      } catch (error: unknown) {
        console.error('Error creating folder:', error);
        
        // Kiểm tra nếu lỗi là 409 Conflict
        if (error && typeof error === 'object' && 'response' in error && 
            error.response && typeof error.response === 'object' && 
            'status' in error.response && error.response.status === 409) {
          this.createFolderError = 'Tên thư mục đã tồn tại trong thư mục này';
        } else {
          this.showToast('Không thể tạo thư mục', 'error');
          this.showCreateFolderModal = false;
        }
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

    // Handler cho nút "Thư mục mới" từ MainContent
    handleMainContentCreateFolder(): void {
      console.log(`MainContent requested to create folder in current folder ID: ${this.selectedFolderId}`);
      // Đảm bảo đang có thư mục được chọn
      if (this.selectedFolderId === 0) {
        this.showToast('Vui lòng chọn thư mục trước khi tạo thư mục con', 'warning');
        return;
      }
      // Hiển thị dialog tạo thư mục với ID thư mục cha là thư mục hiện tại
      this.showCreateFolderModal = true;
    },

    // Method to create a root-level folder
    createRootFolder(): void {
      console.log('Creating root folder');
      // Set the context for folder creation to root level
      this.selectedFolderId = 0;
      // Show the create folder dialog
      this.showCreateFolderModal = true;
    },

    // Method to create a subfolder within a parent folder
    createSubfolder(parentFolderId: number): void {
      console.log(`Creating subfolder in parent ID: ${parentFolderId}`);
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 1.25rem;
  color: var(--primary-color);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.account-link {
  text-decoration: none;
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