<template>
  <PDialog :visible="visible" modal header="Đổi tên" :style="{ width: '500px' }" @update:visible="$emit('update:visible', $event)">
    <div class="form-group">
      <label for="item-name">Tên mới</label>
      <input
        id="item-name"
        v-model="newName"
        type="text"
        class="form-input"
        placeholder="Nhập tên mới"
        ref="nameInput"
      />
      <small v-if="isDuplicate" class="error-text">
        {{ item.type === 'folder' 
          ? 'Tên thư mục đã tồn tại hoặc trùng với tên tập tin' 
          : 'Tên tập tin đã tồn tại hoặc trùng với tên thư mục' }}
      </small>
    </div>
    <template #footer>
      <PButton label="Hủy" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
      <PButton label="Lưu" icon="pi pi-check" @click="handleRename" :disabled="!newName.trim() || isDuplicate || newName.trim() === item.name" />
    </template>
  </PDialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick, computed } from 'vue';
import PDialog from 'primevue/dialog';
import PButton from 'primevue/button';

interface RenameItem {
  id: number;
  name: string;
  type: 'file' | 'folder';
}

interface DriveFolder {
  id: number;
  name: string;
}

interface DriveFile {
  id: number;
  name: string;
}

export default defineComponent({
  name: 'GGDriveRenameItemDialog',
  components: {
    PDialog,
    PButton
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object as () => RenameItem,
      required: true
    },
    existingFolders: {
      type: Array as () => DriveFolder[],
      default: () => []
    },
    existingFiles: {
      type: Array as () => DriveFile[],
      default: () => []
    }
  },
  emits: ['update:visible', 'rename-item'],
  setup(props, { emit }) {
    const newName = ref('');
    const nameInput = ref<HTMLInputElement | null>(null);

    // Cập nhật tên ban đầu khi item thay đổi
    watch(() => props.item, (newItem) => {
      if (newItem) {
        newName.value = newItem.name;
      }
    }, { immediate: true });

    // Khi dialog hiển thị, focus vào input và chọn toàn bộ text
    watch(() => props.visible, async (isVisible) => {
      if (isVisible) {
        await nextTick();
        if (nameInput.value) {
          nameInput.value.focus();
          nameInput.value.select();
        }
      }
    });

    // Kiểm tra trùng tên
    const isDuplicate = computed(() => {
      if (!newName.value.trim() || newName.value.trim() === props.item.name) {
        return false;
      }

      const trimmedName = newName.value.trim().toLowerCase();
      
      // Nếu đang đổi tên folder, kiểm tra tên mới có trùng với folder khác hoặc file nào không
      if (props.item.type === 'folder') {
        return props.existingFolders.some(folder => 
          folder.id !== props.item.id && 
          folder.name.toLowerCase() === trimmedName
        ) || props.existingFiles.some(file => 
          file.name.toLowerCase() === trimmedName
        );
      } 
      // Nếu đang đổi tên file, kiểm tra tên mới có trùng với file khác hoặc folder nào không
      else {
        return props.existingFiles.some(file => 
          file.id !== props.item.id && 
          file.name.toLowerCase() === trimmedName
        ) || props.existingFolders.some(folder => 
          folder.name.toLowerCase() === trimmedName
        );
      }
    });

    const handleRename = () => {
      if (newName.value.trim() && newName.value !== props.item.name && !isDuplicate.value) {
        emit('rename-item', {
          id: props.item.id,
          type: props.item.type,
          newName: newName.value.trim()
        });
      }
      emit('update:visible', false);
    };

    return {
      newName,
      nameInput,
      isDuplicate,
      handleRename
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