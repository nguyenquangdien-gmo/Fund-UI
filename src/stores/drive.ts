import { defineStore } from 'pinia'
import axiosInstance from '@/router/Interceptor'

interface DriveFile {
  id: number
  name: string
  mimeType: string
  size: number
  webViewLink: string
  webContentLink: string
  createdTime: string
  modifiedTime: string
  folderId: number
  folderName: string
  createdByUsername: string
}

interface DriveFolder {
  id: number
  name: string
  webViewLink: string
  createdTime: string
  modifiedTime: string
  parentFolderId: number | null
  parentFolderName: string | null
  createdByUsername: string
}

interface DriveBookmarkResponse {
  id: number;
  name: string;
  url: string;
  googleId: string;
  type: 'FILE' | 'FOLDER' | 'EXTERNAL';
  source: 'DRIVE' | 'EXTERNAL';
  createdAt: string;
  updatedAt: string;
}

interface ExternalBookmark {
  id: number
  name: string
  link: string
  type: string
}

interface GoogleServiceAccount {
  id: number
  accountName: string
  applicationName: string
  description?: string
  rootFolderId?: string
  isDefault: boolean
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface GoogleServiceAccountRequest {
  accountName: string;
  applicationName: string;
  description?: string;
  rootFolderId?: string;
  isDefault?: boolean;
}

export const useDriveStore = defineStore('drive', {
  state: () => ({
    files: [] as DriveFile[],
    folders: [] as DriveFolder[],
    bookmarks: [] as DriveBookmarkResponse[],
    serviceAccounts: [] as GoogleServiceAccount[],
    defaultServiceAccount: null as GoogleServiceAccount | null,
    currentFolder: null as DriveFolder | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    // Service Account operations
    async configureServiceAccount(credentialsFile: File, accountData: GoogleServiceAccountRequest) {
      try {
        const formData = new FormData()
        formData.append('credentials', credentialsFile)
        formData.append('accountName', accountData.accountName)
        formData.append('applicationName', accountData.applicationName)
        
        if (accountData.description) {
          formData.append('description', accountData.description)
        }
        
        if (accountData.rootFolderId) {
          formData.append('rootFolderId', accountData.rootFolderId)
        }
        
        formData.append('isDefault', String(accountData.isDefault || false))
        
        console.log('Configuring service account with', accountData.accountName, credentialsFile.name)
        
        const response = await axiosInstance.post('/drive/service-accounts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } catch (error: any) {
        console.error('Error configuring service account:', error)
        this.error = 'Failed to configure service account'
        throw error
      }
    },

    async addServiceAccount(credentialsFile: File, accountData: GoogleServiceAccountRequest) {
      try {
        const formData = new FormData()
        formData.append('credentials', credentialsFile)
        formData.append('accountName', accountData.accountName)
        formData.append('applicationName', accountData.applicationName)
        
        if (accountData.description) {
          formData.append('description', accountData.description)
        }
        
        if (accountData.rootFolderId) {
          formData.append('rootFolderId', accountData.rootFolderId)
        }
        
        formData.append('isDefault', String(accountData.isDefault || false))
        
        console.log('Adding service account with', accountData.accountName, credentialsFile.name)
        
        const response = await axiosInstance.post('/drive/service-accounts/add', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } catch (error: any) {
        console.error('Error adding service account:', error)
        this.error = 'Failed to add service account'
        throw error
      }
    },

    async updateServiceAccount(accountId: number, accountData: GoogleServiceAccountRequest, credentialsFile?: File) {
      try {
        const formData = new FormData()
        formData.append('accountName', accountData.accountName)
        formData.append('applicationName', accountData.applicationName)
        
        if (accountData.description) {
          formData.append('description', accountData.description)
        }
        
        if (accountData.rootFolderId) {
          formData.append('rootFolderId', accountData.rootFolderId)
        }
        
        formData.append('isDefault', String(accountData.isDefault || false))
        
        if (credentialsFile) {
          formData.append('credentials', credentialsFile)
        }
        
        console.log('Updating service account', accountId, 'with', accountData.accountName)
        
        const response = await axiosInstance.put(`/drive/service-accounts/${accountId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } catch (error: any) {
        console.error('Error updating service account:', error)
        this.error = 'Failed to update service account'
        throw error
      }
    },

    async getUserServiceAccounts() {
      try {
        const response = await axiosInstance.get('/drive/service-accounts')
        this.serviceAccounts = response.data
        return response.data
      } catch (error) {
        this.error = 'Failed to get service accounts'
        throw error
      }
    },

    async getUserServiceAccountById(accountId: number) {
      try {
        const response = await axiosInstance.get(`/drive/service-accounts/${accountId}`)
        return response.data
      } catch (error) {
        this.error = 'Failed to get service account'
        throw error
      }
    },

    async getDefaultServiceAccount() {
      try {
        const response = await axiosInstance.get('/drive/service-accounts/default')
        this.defaultServiceAccount = response.data
        return response.data
      } catch (error) {
        this.error = 'Failed to get default service account'
        throw error
      }
    },

    async setDefaultServiceAccount(accountId: number) {
      try {
        const response = await axiosInstance.put(`/drive/service-accounts/${accountId}/set-default`)
        return response.data
      } catch (error) {
        this.error = 'Failed to set default service account'
        throw error
      }
    },

    async disableServiceAccount(accountId: number) {
      try {
        await axiosInstance.put(`/drive/service-accounts/${accountId}/disable`)
      } catch (error) {
        this.error = 'Failed to disable service account'
        throw error
      }
    },

    async enableServiceAccount(accountId: number) {
      try {
        const response = await axiosInstance.put(`/drive/service-accounts/${accountId}/enable`)
        return response.data
      } catch (error) {
        this.error = 'Failed to enable service account'
        throw error
      }
    },

    async deleteServiceAccount(accountId: number) {
      try {
        await axiosInstance.delete(`/drive/service-accounts/${accountId}`)
      } catch (error) {
        this.error = 'Failed to delete service account'
        throw error
      }
    },

    // File operations
    async uploadFile(folderId: number, file: File, accountId?: number) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        let url = `/drive/folders/${folderId}/upload`
        if (accountId) {
          url += `?accountId=${accountId}`
        }
        
        const response = await axiosInstance.post(url, formData)
        return response.data
      } catch (error: any) {
        if (error.response && error.response.status === 409) {
          this.error = 'File already exists in this folder'
        } else {
          this.error = 'Failed to upload file'
        }
        throw error
      }
    },

    async downloadFile(fileId: number, accountId?: number) {
      try {
        let url = `/drive/files/${fileId}/download`
        if (accountId) {
          url += `?accountId=${accountId}`
        }
        
        // Sử dụng responseType blob để tải về file
        const response = await axiosInstance.get(url, {
          responseType: 'blob'
        })
        
        return response.data
      } catch (error) {
        this.error = 'Failed to download file'
        throw error
      }
    },

    async downloadFolderAsZip(folderId: number, accountId?: number) {
      try {
        let url = `/drive/folders/${folderId}/download`
        if (accountId) {
          url += `?accountId=${accountId}`
        }
        
        // Sử dụng responseType blob để tải về file zip
        const response = await axiosInstance.get(url, {
          responseType: 'blob'
        })
        
        return response.data
      } catch (error) {
        this.error = 'Failed to download folder'
        throw error
      }
    },

    async deleteFile(fileId: number, accountId?: number) {
      try {
        let url = `/drive/files/${fileId}`
        if (accountId) {
          url += `?accountId=${accountId}`
        }
        
        await axiosInstance.delete(url)
      } catch (error) {
        this.error = 'Failed to delete file'
        throw error
      }
    },

    async moveFile(fileId: number, targetFolderId: number) {
      try {
        await axiosInstance.post(`/drive/files/${fileId}/move`, null, {
          params: { targetFolderId }
        })
      } catch (error) {
        this.error = 'Failed to move file'
        throw error
      }
    },

    async renameFile(fileId: number, newName: string) {
      try {
        const response = await axiosInstance.put(`/drive/files/${fileId}/rename`, null, {
          params: { newName }
        })
        return response.data
      } catch (error) {
        this.error = 'Failed to rename file'
        throw error
      }
    },

    // Folder operations
    async listFolderContents(folderId: number, accountId?: number) {
      try {
        // Thêm timestamp để tránh cache
        const timestamp = new Date().getTime();
        let url = `/drive/folders/${folderId}/contents?_=${timestamp}`
        
        if (accountId) {
          url += `&accountId=${accountId}`
        }
        
        const response = await axiosInstance.get(url);
        
        // Cập nhật state local
        if (response.data.files) {
          // Cập nhật danh sách file cho folder này
          // Xóa các file cũ thuộc folder này
          this.files = this.files.filter(file => file.folderId !== folderId);
          // Thêm file mới
          this.files = [...this.files, ...response.data.files];
        }
        
        // Cập nhật folder hiện tại nếu có
        if (response.data.currentFolder) {
          this.currentFolder = response.data.currentFolder;
        }
        
        return response.data;
      } catch (error) {
        this.error = 'Failed to list folder contents';
        throw error;
      }
    },

    async createFolder(name: string, parentFolderId?: number | null, accountId?: number) {
      try {
        // Đảm bảo gửi đúng định dạng như đã test thành công
        console.log(`Creating folder: name=${name}, parentId=${parentFolderId === null ? 'null' : parentFolderId}, accountId=${accountId || 'none'}`);
        
        // Luôn gửi parentFolderId dưới dạng string, null sẽ được chuyển đổi trong backend
        const request = {
          name: name,
          parentFolderId: parentFolderId !== null && parentFolderId !== undefined ? String(parentFolderId) : null
        };
        
        console.log('Request payload:', request);
        
        // Thêm accountId vào URL nếu có
        let url = '/drive/folders';
        if (accountId) {
          url += `?accountId=${accountId}`;
        }
        
        // Thực hiện gọi API và log kết quả
        const response = await axiosInstance.post(url, request);
        console.log('Created folder response:', response.data);
        
        // Đảm bảo trả về dữ liệu đầy đủ của folder mới tạo để có thể active vào nó
        return response.data;
      } catch (error: any) {
        console.error('Error creating folder:', error);
        // Hiển thị chi tiết lỗi từ phản hồi API nếu có
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Status:', error.response.status);
          if (error.response.status === 409) {
            this.error = 'Folder already exists in this location';
          } else {
            this.error = `Failed to create folder: ${error.response.data?.message || error.response.statusText}`;
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          this.error = 'Failed to create folder: No response from server';
        } else {
          console.error('Error message:', error.message);
          this.error = `Failed to create folder: ${error.message}`;
        }
        throw error;
      }
    },

    async getAllFolders() {
      try {
        const response = await axiosInstance.get('/drive/folders')
        this.folders = response.data
        return response.data
      } catch (error) {
        this.error = 'Failed to get folders'
        throw error
      }
    },

    async getFolderById(folderId: number) {
      try {
        const response = await axiosInstance.get(`/drive/folders/${folderId}`)
        this.currentFolder = response.data
        return response.data
      } catch (error) {
        this.error = 'Failed to get folder'
        throw error
      }
    },

    async updateFolder(folderId: number, name: string) {
      try {
        const response = await axiosInstance.put(`/drive/folders/${folderId}`, { name })
        return response.data
      } catch (error) {
        this.error = 'Failed to update folder'
        throw error
      }
    },

    async deleteFolder(folderId: number) {
      try {
        await axiosInstance.delete(`/drive/folders/${folderId}`);
        
        // Cập nhật state nội bộ sau khi xóa
        // 1. Xóa folder khỏi danh sách
        this.folders = this.folders.filter(folder => folder.id !== folderId);
        
        // 2. Xóa tất cả file thuộc về folder này
        this.files = this.files.filter(file => file.folderId !== folderId);
        
        // 3. Xóa folder hiện tại nếu là folder bị xóa
        if (this.currentFolder && this.currentFolder.id === folderId) {
          this.currentFolder = null;
        }
      } catch (error) {
        this.error = 'Failed to delete folder';
        throw error;
      }
    },

    async moveFolder(folderId: number, targetFolderId: number) {
      try {
        await axiosInstance.post(`/drive/folders/${folderId}/move`, null, {
          params: { targetFolderId }
        })
      } catch (error) {
        this.error = 'Failed to move folder'
        throw error
      }
    },

    async renameFolder(folderId: number, newName: string) {
      try {
        const response = await axiosInstance.put(`/drive/folders/${folderId}/rename`, null, {
          params: { newName }
        })
        return response.data
      } catch (error) {
        this.error = 'Failed to rename folder'
        throw error
      }
    },

    // Bookmark operations
    async createBookmark(name: string, googleId: string, type: string, accountId?: number): Promise<DriveBookmarkResponse> {
      try {
        const params = new URLSearchParams();
        params.append('name', name);
        params.append('googleId', googleId);
        params.append('type', type);
        if (accountId) {
          params.append('accountId', accountId.toString());
        }

        const response = await axiosInstance.post('/drive/bookmarks', null, {
          params: {
            name,
            googleId,
            type,
            ...(accountId ? { accountId } : {})
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error creating bookmark:', error);
        this.error = 'Failed to create bookmark';
        throw error;
      }
    },

    async createExternalBookmark(name: string, url: string): Promise<DriveBookmarkResponse> {
      try {
        const response = await axiosInstance.post('/drive/bookmarks/external', null, {
          params: { name, url }
        });
        return response.data;
      } catch (error) {
        console.error('Error creating external bookmark:', error);
        this.error = 'Failed to create external bookmark';
        throw error;
      }
    },

    async getUserBookmarks(): Promise<DriveBookmarkResponse[]> {
      try {
        const response = await axiosInstance.get('/drive/bookmarks');
        this.bookmarks = response.data;
        return response.data;
      } catch (error) {
        console.error('Error getting user bookmarks:', error);
        this.error = 'Failed to get bookmarks';
        throw error;
      }
    },

    async deleteBookmark(bookmarkId: number): Promise<void> {
      try {
        await axiosInstance.delete(`/drive/bookmarks/${bookmarkId}`);
      } catch (error) {
        console.error('Error deleting bookmark:', error);
        this.error = 'Failed to delete bookmark';
        throw error;
      }
    },

    async updateBookmark(bookmarkId: number, name: string): Promise<DriveBookmarkResponse> {
      try {
        const response = await axiosInstance.put(`/drive/bookmarks/${bookmarkId}`, null, {
          params: { name }
        });
        return response.data;
      } catch (error) {
        console.error('Error updating bookmark:', error);
        this.error = 'Failed to update bookmark';
        throw error;
      }
    },

    async getBookmarksBySource(source: string): Promise<DriveBookmarkResponse[]> {
      try {
        const response = await axiosInstance.get(`/drive/bookmarks/source/${source}`);
        return response.data;
      } catch (error) {
        console.error('Error getting bookmarks by source:', error);
        this.error = 'Failed to get bookmarks by source';
        throw error;
      }
    }
  }
}) 