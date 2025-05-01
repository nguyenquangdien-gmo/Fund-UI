<template>
  <PDialog :visible="visible" modal header="Tạo thư mục mới" :style="{ width: '500px' }" @update:visible="$emit('update:visible', $event)">
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
      <small v-if="isDuplicate" class="error-text">Tên thư mục đã tồn tại trong thư mục này</small>
    </div>
    <template #footer>
      <PButton label="Hủy" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
      <PButton label="Tạo" icon="pi pi-plus" @click="handleCreateFolder" :disabled="!folderName.trim() || isDuplicate" />
    </template>
  </PDialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import PDialog from 'primevue/dialog';
import PButton from 'primevue/button';

interface DriveFolder {
  id: number;
  name: string;
}

export default defineComponent({
  name: 'GGDriveCreateFolderDialog',
  components: {
    PDialog,
    PButton
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
    }
  },
  emits: ['update:visible', 'create-folder'],
  setup(props, { emit }) {
    const folderName = ref('');
    const nameInput = ref<HTMLInputElement | null>(null);

    // Reset form when dialog is opened/closed
    watch(() => props.visible, (isVisible) => {
      if (isVisible) {
        folderName.value = '';
        nextTick(() => {
          if (nameInput.value) {
            nameInput.value.focus();
          }
        });
      }
    });

    // Check if folder name already exists
    const isDuplicate = computed(() => {
      if (!folderName.value.trim()) return false;
      return props.existingFolders.some(
        folder => folder.name.toLowerCase() === folderName.value.trim().toLowerCase()
      );
    });

    const handleCreateFolder = () => {
      if (folderName.value.trim() && !isDuplicate.value) {
        emit('create-folder', {
          name: folderName.value.trim(),
          parentFolderId: props.parentFolderId
        });
        folderName.value = '';
        emit('update:visible', false);
      }
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