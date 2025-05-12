<template>
  <div class="app-container">
    <div class="header">
      <h1>Google Drive</h1>
      <div v-if="isAdmin" class="header-actions">
        <router-link to="/drive/accounts" class="account-link">
          <PButton icon="pi pi-cog" label="Quản lý tài khoản dịch vụ" class="p-button-text" />
        </router-link>
      </div>
    </div>

    <div class="main-content">
      <GGDriveSidebar :selected-folder-id="selectedFolderId" :favorites="favorites" @select-folder="selectFolder"
        @edit-favorite="editFavorite" @remove-favorite="removeFavorite" @rename-folder="showRenameFolderDialog"
        @delete-folder="confirmDeleteFolder" @create-root-folder="createRootFolder" @create-subfolder="createSubfolder"
        @download-folder="downloadFolder" @add-external-bookmark="showAddExternalBookmarkDialog"
        @add-to-favorites="addToFavorites" @preview-bookmark="previewBookmark" ref="sidebar" />

      <GGDriveMainContent :folder-contents="folderContents" :breadcrumbs="breadcrumbs" :is-admin="isAdmin"
        :is-loading="isLoading" :favorites="favorites" @select-folder="selectFolder"
        @navigate-to-breadcrumb="navigateToBreadcrumb" @show-upload-modal="showUploadModal = true"
        @show-create-folder-modal="handleMainContentCreateFolder" @add-to-favorites="addToFavorites"
        @copy-share-link="copyShareLink" @download-file="downloadFile" @download-folder="downloadFolder"
        @delete-file="deleteFile" @delete-folder="deleteFolder" @rename-file="showRenameFileDialog"
        @rename-folder="showRenameFolderDialog" @preview-file="previewFile" />
    </div>

    <GGDriveUploadDialog v-model:visible="showUploadModal" @upload-files="uploadSelectedFiles" />

    <GGDriveEditFavoriteDialog v-model:visible="showEditFavoriteModal" :favorite="editingFavorite"
      @save-favorite="saveFavorite" />

    <GGDriveCreateFolderDialog v-model:visible="showCreateFolderModal" :parent-folder-id="selectedFolderId"
      :existing-folders="folderContents.subFolders" :existing-files="folderContents.files"
      :error-message="createFolderError" @update:error-message="createFolderError = $event"
      @create-folder="createFolder" />

    <GGDriveRenameItemDialog v-model:visible="showRenameItemModal" :item="itemToRename"
      :existing-folders="folderContents.subFolders" :existing-files="folderContents.files" @rename-item="renameItem" />

    <GGDriveConfirmDialog v-model:visible="showConfirmDialog" title="Xác nhận xóa" :message="confirmMessage"
      confirmLabel="Xóa" confirmIcon="pi pi-trash" @confirm="confirmAction" />

    <AddExternalBookmarkDialog v-model:visible="showExternalBookmarkModal" :edit-bookmark="editingExternalBookmark"
      @save-bookmark="saveExternalBookmark" />

    <PToast />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
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
import AddExternalBookmarkDialog from '../components/GGDrive/AddExternalBookmarkDialog.vue';
import { useDriveStore } from '../stores/drive';

interface User {
  name: string;
  initials: string;
  role: string;
}

interface DriveFile {
  id: number;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink: string;
  googleId?: string;
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
  googleId?: string;
}

interface FolderContents {
  files: DriveFile[];
  subFolders: DriveFolder[];
  currentFolder: DriveFolder | null;
}

interface ExternalBookmark {
  id: number;
  name: string;
  link: string;
  type: string;
}

const isAdmin = ref(false);

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
    AddExternalBookmarkDialog,
    PToast,
    PButton
  },
  setup() {
    const toast = useToast();
    const driveStore = useDriveStore();

    const checkIsAdmin = async () => {
      const userData = sessionStorage.getItem('user');

      if (!userData) return false;
      try {
        const user = JSON.parse(userData);
        isAdmin.value = user.role === 'ADMIN';
      } catch (error) {
        console.error('Error parsing user data from sessionStorage:', error);
        isAdmin.value = false;
      }
    };

    // Call checkIsAdmin when component is created
    checkIsAdmin();

    return { toast, driveStore, isAdmin };
  },
  data() {
    return {
      // Folder details
      selectedFolderId: 0,
      breadcrumbs: [] as Breadcrumb[],
      folderContents: {
        files: [],
        subFolders: [],
        currentFolder: null
      } as FolderContents,
      isLoading: false,

      // Favorites/Bookmarks (combined drive and external bookmarks)
      favorites: [] as Favorite[],

      // Upload
      showUploadModal: false,

      // Edit favorite
      showEditFavoriteModal: false,
      editingFavorite: {
        id: 0,
        name: '',
        type: '',
        source: '',
        googleId: '',
        createdAt: '',
        updatedAt: ''
      } as Favorite,

      // External bookmark dialog
      showExternalBookmarkModal: false,
      editingExternalBookmark: null as ExternalBookmark | null,

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

      // New for createSubfolder and createFolder
      parentFolderIdForCreation: null as number | null,
    };
  },
  methods: {
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

        // Đảm bảo folder được chọn trong sidebar
        if (this.$refs.sidebar) {
          const sidebarComponent = this.$refs.sidebar as { expandFolder?: (folderId: number) => void };
          if (typeof sidebarComponent.expandFolder === 'function') {
            sidebarComponent.expandFolder(id);
          }
        }
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
        while (parentId !== null && parentId !== undefined) {
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

    // Favorites/Bookmarks methods
    async loadFavorites(): Promise<void> {
      try {
        const bookmarks = await this.driveStore.getUserBookmarks();
        // Phải chuyển đổi từ kiểu API sang kiểu nội bộ để tránh lỗi type
        this.favorites = bookmarks.map(bookmark => ({
          id: bookmark.id,
          name: bookmark.name,
          type: bookmark.type,
          source: bookmark.source,
          googleId: bookmark.googleId,
          url: bookmark.url,
          createdAt: bookmark.createdAt,
          updatedAt: bookmark.updatedAt,
          // Các trường cũ cho tương thích
          path: '',
          originalId: bookmark.googleId
        } as Favorite));
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        this.showToast('Không thể tải danh sách yêu thích', 'error');
      }
    },

    // Show dialog to add a new external bookmark
    showAddExternalBookmarkDialog(): void {
      this.editingExternalBookmark = null;
      this.showExternalBookmarkModal = true;
    },

    // Show dialog to edit an external bookmark
    showEditExternalBookmarkDialog(bookmark: Favorite): void {
      if (bookmark.url) {
        this.editingExternalBookmark = {
          id: bookmark.id,
          name: bookmark.name,
          link: bookmark.url,
          type: 'external'
        };
        this.showExternalBookmarkModal = true;
      }
    },

    // Save (create or update) an external bookmark
    async saveExternalBookmark(data: { id?: number; name: string; url: string }): Promise<void> {
      try {
        if (data.id) {
          // For existing bookmark, use update method
          await this.driveStore.updateBookmark(data.id, data.name);
        } else {
          // For new bookmark, create external bookmark
          await this.driveStore.createExternalBookmark(data.name, data.url);
        }

        this.showToast(data.id ? 'Liên kết đã được cập nhật' : 'Đã thêm liên kết mới', 'success');

        // Reload favorites
        await this.loadFavorites();
      } catch (error) {
        console.error('Error saving external bookmark:', error);
        this.showToast('Không thể lưu liên kết', 'error');
      }
    },

    async addToFavorites(item: DriveFile | DriveFolder): Promise<void> {
      try {
        // Determine if it's a file or folder
        const type = 'size' in item ? 'FILE' : 'FOLDER';

        // Sử dụng googleId từ item thay vì id
        // Folder và File trong Google Drive có thuộc tính googleId riêng
        // Trong trường hợp không có, sử dụng fallback là item.id.toString()
        const googleId = item.googleId || item.id.toString();

        // Check if item is already a favorite
        const existingFavorite = this.favorites.find(f =>
          (f.googleId === googleId) || (f.originalId === googleId)
        ) as Favorite | undefined;

        if (existingFavorite) {
          // If already a favorite, remove it
          await this.driveStore.deleteBookmark(existingFavorite.id);
          this.showToast(`Đã xóa ${item.name} khỏi yêu thích`, 'success');
        } else {
          // If not a favorite, add it
          await this.driveStore.createBookmark(
            item.name,
            googleId,
            type
          );
          this.showToast(`Đã thêm ${item.name} vào yêu thích`, 'success');
        }

        // Reload favorites
        await this.loadFavorites();
      } catch (error) {
        console.error('Error toggling favorite status:', error);
        this.showToast('Không thể thay đổi trạng thái yêu thích', 'error');
      }
    },

    editFavorite(id: number): void {
      const favorite = this.favorites.find(f => f.id === id);
      if (favorite) {
        if (favorite.source === 'EXTERNAL') {
          this.showEditExternalBookmarkDialog(favorite);
        } else {
          this.editingFavorite = { ...favorite };
          this.showEditFavoriteModal = true;
        }
      }
    },

    async saveFavorite(updatedFavorite: Favorite): Promise<void> {
      try {
        // Update bookmark using API
        await this.driveStore.updateBookmark(
          updatedFavorite.id,
          updatedFavorite.name
        );

        this.showToast('Đã cập nhật yêu thích thành công', 'success');
        // Reload favorites
        await this.loadFavorites();

        this.showEditFavoriteModal = false;
      } catch (error) {
        console.error('Error updating favorite:', error);
        this.showToast('Không thể cập nhật yêu thích', 'error');
      }
    },

    async removeFavorite(id: number): Promise<void> {
      try {
        // Delete bookmark using API
        await this.driveStore.deleteBookmark(id);

        this.showToast('Đã xóa khỏi yêu thích', 'success');
        // Reload favorites
        await this.loadFavorites();
      } catch (error) {
        console.error('Error removing favorite:', error);
        this.showToast('Không thể xóa khỏi yêu thích', 'error');
      }
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
      this.confirmMessage = `Bạn có chắc chắn muốn xóa "${file.name}"?`;
      this.pendingAction = async () => {
        try {
          await this.driveStore.deleteFile(file.id);
          this.showToast(`Đã xóa ${file.name} thành công`, 'success');
          // Tải lại nội dung thư mục
          await this.selectFolder(this.selectedFolderId);
        } catch (error) {
          console.error('Error deleting file:', error);
          this.showToast('Không thể xóa tập tin', 'error');
        }
      };
      this.showConfirmDialog = true;
    },

    // Xóa thư mục
    async deleteFolder(folder: DriveFolder): Promise<void> {
      try {
        console.log('Starting folder deletion process...');
        console.log('Folder to delete:', folder);

        // Lưu ID của folder đang xem để kiểm tra sau
        const isCurrentFolder = this.selectedFolderId === folder.id;
        console.log('Is current folder:', isCurrentFolder);

        // Hiển thị loading để ngăn người dùng tương tác trong khi xử lý
        this.isLoading = true;

        // Thực hiện xóa folder
        console.log('Calling driveStore.deleteFolder...');
        await this.driveStore.deleteFolder(folder.id);
        console.log(`Folder ${folder.name} (ID: ${folder.id}) deleted successfully`);

        // 1. Lấy lại danh sách folders từ API để đảm bảo cập nhật chính xác
        console.log('Fetching updated folders list...');
        const folders = await this.driveStore.getAllFolders();
        console.log(`Fetched updated folders list. Total: ${folders.length} folders`);

        // 2. Đảm bảo refreshFolderTree được gọi và chờ hoàn thành
        console.log('Refreshing folder tree...');
        await this.refreshFolderTree();

        // 3. Xử lý UI hiển thị
        if (isCurrentFolder) {
          console.log(`Deleted the currently viewed folder (ID: ${folder.id}). Updating view...`);
          // Nếu đang xem folder bị xóa, đặt lại state
          this.folderContents = { files: [], subFolders: [], currentFolder: null };
          this.breadcrumbs = [];

          // Nếu còn folder khác, chọn folder đầu tiên
          if (folders.length > 0) {
            console.log(`Selecting first available folder: ${folders[0].name} (ID: ${folders[0].id})`);
            this.selectedFolderId = folders[0].id;

            // Đợi một chút để đảm bảo sidebar đã cập nhật
            setTimeout(async () => {
              console.log('Selecting new folder after deletion...');
              await this.selectFolder(folders[0].id);
            }, 100);
          } else {
            console.log('No folders left. Setting selectedFolderId to 0');
            // Nếu không còn folder nào, đặt selectedFolderId về 0 để sidebar biết
            this.selectedFolderId = 0;
          }
        } else {
          console.log(`Deleted folder (ID: ${folder.id}) is not the current view. Refreshing current folder...`);
          // Nếu đang xem folder khác, tải lại nội dung folder đó
          // Nhưng trước tiên, xóa dữ liệu hiện tại
          this.folderContents = { files: [], subFolders: [], currentFolder: null };

          // Tải lại nội dung folder hiện tại
          // Đợi một chút để đảm bảo sidebar đã cập nhật
          setTimeout(async () => {
            console.log('Refreshing current folder after deletion...');
            await this.selectFolder(this.selectedFolderId);
          }, 100);
        }

        // 4. Thông báo thành công
        this.showToast(`Đã xóa thư mục ${folder.name} thành công`, 'success');
        console.log('Folder deletion process completed successfully');
      } catch (error) {
        console.error('Error deleting folder:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        }
        this.showToast('Không thể xóa thư mục', 'error');
      } finally {
        // Đảm bảo tắt loading dù có lỗi hay không
        this.isLoading = false;
        console.log('Folder deletion process finished');
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

      // Store the parent folder ID for creation
      this.parentFolderIdForCreation = this.selectedFolderId;
      console.log(`Setting parentFolderIdForCreation to: ${this.parentFolderIdForCreation}`);

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
      // Store the parent folder ID separately so we can refer back to it when needed
      this.parentFolderIdForCreation = parentFolderId;
      // Show the create folder dialog
      this.showCreateFolderModal = true;
    },

    // Create folder method
    async createFolder(data: { name: string, parentFolderId: number }): Promise<void> {
      try {
        console.log('Creating folder with data:', data);

        // Use parentFolderIdForCreation if available, otherwise use the data parameter
        let effectiveParentId = data.parentFolderId;

        // If we're creating a subfolder from context menu, use parentFolderIdForCreation
        if (this.parentFolderIdForCreation !== null) {
          effectiveParentId = this.parentFolderIdForCreation;
          console.log(`Using parentFolderIdForCreation: ${effectiveParentId}`);
        }

        // If parent ID is 0, it means we're creating at root level
        const parentId = effectiveParentId === 0 ? null : effectiveParentId;

        console.log(`Sending create folder request: name=${data.name}, parentId=${parentId}`);
        // Get the newly created folder data from the API response
        const newFolder = await this.driveStore.createFolder(data.name, parentId);
        this.showToast(`Đã tạo thư mục ${data.name} thành công`, 'success');

        // Đóng dialog sau khi tạo thành công
        this.showCreateFolderModal = false;

        // Reset parentFolderIdForCreation immediately after successful creation
        this.parentFolderIdForCreation = null;

        // Reload folder tree in sidebar
        await this.refreshFolderTree();

        if (newFolder && newFolder.id) {
          console.log(`Folder mới đã được tạo với ID: ${newFolder.id}, tên: ${newFolder.name}`);

          // Đợi một chút để folder tree có thời gian cập nhật
          setTimeout(async () => {
            // Nếu đây là thư mục con, trước tiên phải đảm bảo thư mục cha được mở rộng
            if (parentId && this.$refs.sidebar) {
              const sidebarComponent = this.$refs.sidebar as { expandFolder?: (folderId: number) => void };
              if (typeof sidebarComponent.expandFolder === 'function') {
                sidebarComponent.expandFolder(parentId);
              }
            }

            // Cập nhật selectedFolderId và load nội dung của folder mới
            this.selectedFolderId = newFolder.id;
            await this.selectFolder(newFolder.id);
          }, 800); // Increase timeout to ensure folder tree has updated
        } else {
          console.warn('Không thể lấy được ID của folder mới từ response');
          // Nếu không thể lấy được ID của folder mới, load lại nội dung folder hiện tại
          if (this.parentFolderIdForCreation) {
            await this.selectFolder(this.parentFolderIdForCreation);
          } else if (this.selectedFolderId !== 0) {
            await this.selectFolder(this.selectedFolderId);
          }
        }
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
      console.log('Refreshing folder tree...');
      try {
        // Sử dụng type casting cụ thể để tránh lỗi TypeScript
        const sidebarComponent = this.$refs.sidebar as { fetchFolders?: () => Promise<void> } | undefined;

        if (sidebarComponent && typeof sidebarComponent.fetchFolders === 'function') {
          console.log('Calling sidebar.fetchFolders() to refresh tree');
          await sidebarComponent.fetchFolders();
        } else {
          // Phương án dự phòng nếu không thể gọi trực tiếp
          console.log('Sidebar component not found or fetchFolders not available. Calling store.getAllFolders() directly');
          const folders = await this.driveStore.getAllFolders();
          console.log(`Folders refreshed from store, count: ${folders.length}`);
        }
        console.log('Folder tree refresh completed');
      } catch (error) {
        console.error('Error refreshing folder tree:', error);
        // Không hiển thị toast vì có thể gây confusing cho user
        // trong trường hợp operation chính đã thành công
      }
    },

    // New method for preview-file event
    previewFile(file: DriveFile): void {
      if (file.webViewLink) {
        this.showToast(`Đang mở ${file.name}`, 'info');
        window.open(file.webViewLink, '_blank');
      } else {
        this.showToast('Không thể mở tập tin này', 'error');
      }
    },

    // Xử lý mở file khi click vào bookmark trong sidebar
    async previewBookmark(bookmark: Favorite): Promise<void> {
      try {
        // Nếu bookmark có webViewLink, mở trực tiếp
        if (bookmark.url) {
          this.showToast(`Đang mở ${bookmark.name}`, 'info');
          window.open(bookmark.url, '_blank');
          return;
        }

        // Lấy googleId từ bookmark
        const googleId = bookmark.googleId || bookmark.originalId;
        if (!googleId) {
          this.showToast('Không thể mở tập tin này: ID không hợp lệ', 'error');
          return;
        }

        // Nếu là file từ bookmark, cần lấy webViewLink từ server
        this.showToast(`Đang mở ${bookmark.name}...`, 'info');

        // Nếu bookmark không có url, thử lấy file từ API rồi mở webViewLink
        const fileId = parseInt(googleId);
        if (isNaN(fileId)) {
          this.showToast(`Không thể mở tập tin: ID không phải là số hợp lệ`, 'error');
          return;
        }

        // Lấy nội dung file từ API
        this.isLoading = true;
        try {
          // Cố gắng lấy nội dung thư mục để tìm file
          // (API không có endpoint trực tiếp để lấy file theo ID)
          const folders = await this.driveStore.getAllFolders();

          // Tìm file trong các thư mục
          let fileFound = false;
          for (const folder of folders) {
            try {
              const contents = await this.driveStore.listFolderContents(folder.id);
              const file = contents.files.find((f: DriveFile) => f.id === fileId);
              if (file && file.webViewLink) {
                this.showToast(`Đang mở ${file.name}`, 'info');
                window.open(file.webViewLink, '_blank');
                fileFound = true;
                break;
              }
            } catch (error) {
              console.error(`Error checking folder ${folder.id}:`, error);
              // Tiếp tục kiểm tra các thư mục khác
            }
          }

          if (!fileFound) {
            this.showToast('Không thể tìm thấy tập tin để mở', 'error');
          }
        } finally {
          this.isLoading = false;
        }
      } catch (error) {
        console.error('Error opening file from bookmark:', error);
        this.showToast('Không thể mở tập tin', 'error');
        this.isLoading = false;
      }
    },
  },
  async mounted() {
    try {
      // Load bookmarks
      await this.loadFavorites();

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