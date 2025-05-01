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

interface DriveBookmark {
  id: number
  name: string
  url: string
  type: string
  googleId: string
  category: string
  createdAt: string
  updatedAt: string
  folderId: number
  folderName: string
  createdByUsername: string
}

export const useDriveStore = defineStore('drive', {
  state: () => ({
    files: [] as DriveFile[],
    folders: [] as DriveFolder[],
    bookmarks: [] as DriveBookmark[],
    currentFolder: null as DriveFolder | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    // File operations
    async uploadFile(folderId: number, file: File) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await axiosInstance.post(`/drive/folders/${folderId}/upload`, formData)
        return response.data
      } catch (error) {
        this.error = 'Failed to upload file'
        throw error
      }
    },

    async deleteFile(fileId: number) {
      try {
        await axiosInstance.delete(`/drive/files/${fileId}`)
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
    async listFolderContents(folderId: number) {
      try {
        // Thêm timestamp để tránh cache
        const timestamp = new Date().getTime();
        const response = await axiosInstance.get(`/drive/folders/${folderId}/contents?_=${timestamp}`);
        
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

    async createFolder(name: string, parentFolderId?: number | null) {
      try {
        const response = await axiosInstance.post('/drive/folders', {
          name,
          parentFolderId
        })
        return response.data
      } catch (error) {
        this.error = 'Failed to create folder'
        throw error
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
    async createBookmark(name: string, googleId: string, type: string) {
      try {
        const response = await axiosInstance.post('/drive/bookmarks', null, {
          params: { name, googleId, type }
        })
        return response.data
      } catch (error) {
        this.error = 'Failed to create bookmark'
        throw error
      }
    },

    async getUserBookmarks() {
      try {
        const response = await axiosInstance.get('/drive/bookmarks')
        this.bookmarks = response.data
        return response.data
      } catch (error) {
        this.error = 'Failed to get bookmarks'
        throw error
      }
    },

    async deleteBookmark(bookmarkId: number) {
      try {
        await axiosInstance.delete(`/drive/bookmarks/${bookmarkId}`)
      } catch (error) {
        this.error = 'Failed to delete bookmark'
        throw error
      }
    },

    async updateBookmark(bookmarkId: number, name: string, category: string) {
      try {
        const response = await axiosInstance.put(`/drive/bookmarks/${bookmarkId}`, null, {
          params: { name, category }
        })
        return response.data
      } catch (error) {
        this.error = 'Failed to update bookmark'
        throw error
      }
    },

    async getBookmarksByCategory(category: string) {
      try {
        const response = await axiosInstance.get(`/drive/bookmarks/category/${category}`)
        return response.data
      } catch (error) {
        this.error = 'Failed to get bookmarks by category'
        throw error
      }
    }
  }
}) 