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
    </div>
    <template #footer>
      <PButton label="Hủy" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
      <PButton label="Lưu" icon="pi pi-check" @click="handleRename" :disabled="!newName.trim()" />
    </template>
  </PDialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick } from 'vue';
import PDialog from 'primevue/dialog';
import PButton from 'primevue/button';

interface RenameItem {
  id: number;
  name: string;
  type: 'file' | 'folder';
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

    const handleRename = () => {
      if (newName.value.trim() && newName.value !== props.item.name) {
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
</style> 