<template>
  <div>
    <Dialog 
      :visible="visible" 
      modal 
      header="Tạo thư mục mới" 
      :style="{ width: '500px' }" 
      @update:visible="$emit('update:visible', $event)"
      :blockScroll="true"
    >
      <div class="form-group">
        <label for="folder-name">Tên thư mục</label>
        <input
          id="folder-name"
          v-model="folderName"
          type="text"
          class="form-input"
          placeholder="Nhập tên thư mục mới"
          ref="nameInput"
          @keyup.enter="handleCreateFolder"
        />
        <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>
        <div v-if="isDuplicate" class="error-text">Tên thư mục đã tồn tại</div>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button label="Tạo" icon="pi pi-plus" @click="handleCreateFolder" :disabled="!folderName.trim() || isDuplicate" />
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick, computed } from 'vue';
// Import được bỏ qua vì chúng ta sẽ sử dụng global component

interface DriveFolder {
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

export default defineComponent({
  name: 'GGDriveCreateFolderDialog',
  components: {
    // Không cần khai báo components vì đã đăng ký global
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    parentFolderId: {
      type: Number,
      required: true
    },
    existingFolders: {
      type: Array as () => DriveFolder[],
      required: true
    },
    existingFiles: {
      type: Array as () => DriveFile[],
      default: () => []
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible', 'create-folder', 'update:error-message'],
  setup(props, { emit }) {
    const folderName = ref('');
    const nameInput = ref<HTMLInputElement | null>(null);

    // Reset form when dialog is opened/closed
    watch(() => props.visible, (isVisible) => {
      if (isVisible) {
        folderName.value = '';
        emit('update:error-message', ''); // Reset error message
        nextTick(() => {
          if (nameInput.value) {
            nameInput.value.focus();
          }
        });
        
        console.log(`CreateFolderDialog opened with parentFolderId: ${props.parentFolderId}`);
        console.log(`Existing folders:`, props.existingFolders);
      }
    });
    
    // Kiểm tra trùng lặp tên
    const isDuplicate = computed(() => {
      if (!folderName.value.trim()) return false;
      
      const trimmedName = folderName.value.trim().toLowerCase();
      
      // Kiểm tra trùng tên với các thư mục hiện có
      const folderNameExists = props.existingFolders.some(
        folder => folder.name.toLowerCase() === trimmedName
      );
      
      // Kiểm tra trùng tên với các file hiện có
      const fileNameExists = props.existingFiles.some(
        file => file.name.toLowerCase() === trimmedName
      );
      
      return folderNameExists || fileNameExists;
    });

    const handleCreateFolder = () => {
      const trimmedName = folderName.value.trim();
      
      if (!trimmedName) {
        return;
      }
      
      if (isDuplicate.value) {
        emit('update:error-message', 'Tên thư mục đã tồn tại');
        return;
      }
      
      console.log(`Creating folder with name: "${trimmedName}", parentId: ${props.parentFolderId}`);
      emit('create-folder', {
        name: trimmedName,
        parentFolderId: props.parentFolderId
      });
    };

    return {
      folderName,
      nameInput,
      isDuplicate,
      handleCreateFolder
    };
  }
});
</script>

<style scoped>
.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-color);
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

.error-text {
  display: block;
  color: var(--error-color);
  font-size: 0.75rem;
  margin-top: 0.5rem;
}
</style> 