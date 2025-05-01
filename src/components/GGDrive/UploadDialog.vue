<template>
  <PDialog :visible="visible" modal header="Tải lên tập tin" :style="{ width: '500px' }" @update:visible="$emit('update:visible', $event)">
    <div class="upload-area" @dragover.prevent @drop.prevent="onFileDrop" @click="triggerFileInput">
      <input type="file" ref="fileInput" multiple style="display: none" @change="onFileSelect" />
      <i class="pi pi-cloud-upload" style="font-size: 3rem; color: var(--primary-color)"></i>
      <p>Kéo thả tập tin vào đây hoặc nhấp để chọn</p>
    </div>
    <div v-if="uploadFiles.length > 0" class="upload-files-list">
      <div v-for="(file, index) in uploadFiles" :key="index" class="upload-file-item">
        <div class="upload-file-name">{{ file.name }}</div>
        <div class="upload-file-size">{{ formatFileSize(file.size) }}</div>
        <PButton icon="pi pi-times" class="p-button-text p-button-danger" @click="removeUploadFile(index)" />
      </div>
    </div>
    <template #footer>
      <PButton label="Hủy" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
      <PButton label="Tải lên" icon="pi pi-upload" @click="handleUpload" :disabled="uploadFiles.length === 0" />
    </template>
  </PDialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import PDialog from 'primevue/dialog';
import PButton from 'primevue/button';

export default defineComponent({
  name: 'GGDriveUploadDialog',
  components: {
    PDialog,
    PButton
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:visible', 'upload-files'],
  setup(props, { emit }) {
    const fileInput = ref<HTMLInputElement | null>(null);
    const files = ref<File[]>([]);

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const onFileSelect = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        const newFiles = Array.from(input.files);
        files.value = [...files.value, ...newFiles];
      }
    };

    const onFileDrop = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer?.files) {
        const newFiles = Array.from(event.dataTransfer.files);
        files.value = [...files.value, ...newFiles];
      }
    };

    const removeUploadFile = (index: number) => {
      files.value.splice(index, 1);
    };

    const handleUpload = () => {
      emit('upload-files', files.value);
      files.value = [];
      emit('update:visible', false);
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      fileInput,
      uploadFiles: files,
      triggerFileInput,
      onFileSelect,
      onFileDrop,
      removeUploadFile,
      handleUpload,
      formatFileSize
    };
  }
});
</script>

<style scoped>
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
  background-color: var(--secondary-color);
  transition: border-color 0.2s, background-color 0.2s;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background-color: rgba(79, 70, 229, 0.05);
}

.upload-area i {
  margin-bottom: 1rem;
}

.upload-area p {
  color: var(--text-secondary);
  margin: 0;
}

.upload-files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
}

.upload-file-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: white;
  border: 1px solid var(--border-color);
}

.upload-file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-file-size {
  margin: 0 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style> 