<template>
  <PDialog 
    :visible="visible" 
    modal 
    :header="editBookmark ? 'Chỉnh sửa liên kết' : 'Thêm liên kết mới'" 
    :style="{ width: '500px' }" 
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="form-group">
      <label for="bookmark-name">Tên</label>
      <input
        id="bookmark-name"
        v-model="name"
        type="text"
        class="form-input"
        placeholder="Nhập tên liên kết"
        ref="nameInput"
      />
    </div>
    
    <div class="form-group">
      <label for="bookmark-url">Đường dẫn</label>
      <input
        id="bookmark-url"
        v-model="url"
        type="text"
        class="form-input"
        placeholder="Nhập đường dẫn liên kết"
        :disabled="!!editBookmark"
      />
      <small v-if="!!editBookmark" class="note-text">
        Không thể chỉnh sửa đường dẫn của liên kết đã tạo
      </small>
    </div>
    
    <template #footer>
      <PButton label="Hủy" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
      <PButton 
        label="Lưu" 
        icon="pi pi-check" 
        @click="handleSave" 
        :disabled="!isFormValid"
      />
    </template>
  </PDialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import PDialog from 'primevue/dialog';
import PButton from 'primevue/button';

interface ExternalBookmark {
  id: number;
  name: string;
  link: string;
  type: string;
}

export default defineComponent({
  name: 'AddExternalBookmarkDialog',
  components: {
    PDialog,
    PButton
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    editBookmark: {
      type: Object as () => ExternalBookmark | null,
      default: null as unknown as null
    }
  },
  emits: ['update:visible', 'save-bookmark'],
  setup(props, { emit }) {
    const name = ref('');
    const url = ref('');
    const nameInput = ref<HTMLInputElement | null>(null);
    
    // Reset form when dialog visibility changes
    watch(() => props.visible, (isVisible) => {
      if (isVisible) {
        if (props.editBookmark) {
          name.value = props.editBookmark.name;
          url.value = props.editBookmark.link;
        } else {
          name.value = '';
          url.value = '';
        }
        
        // Focus name input when dialog opens
        nextTick(() => {
          if (nameInput.value) {
            nameInput.value.focus();
          }
        });
      }
    }, { immediate: true });
    
    // Watch for changes to the editBookmark prop
    watch(() => props.editBookmark, (newBookmark) => {
      if (newBookmark) {
        name.value = newBookmark.name;
        url.value = newBookmark.link;
      }
    });
    
    // Check if form is valid
    const isFormValid = computed(() => {
      return name.value.trim() !== '' && 
        (props.editBookmark || url.value.trim() !== '');
    });
    
    // Handle save button click
    const handleSave = () => {
      if (isFormValid.value) {
        emit('save-bookmark', {
          id: props.editBookmark?.id,
          name: name.value.trim(),
          url: url.value.trim()
        });
        emit('update:visible', false);
      }
    };
    
    return {
      name,
      url,
      nameInput,
      isFormValid,
      handleSave
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

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.note-text {
  display: block;
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style> 