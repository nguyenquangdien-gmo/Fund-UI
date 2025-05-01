<template>
  <div class="edit-favorite-dialog" v-if="visible">
    <div class="dialog-content">
      <h2>Chỉnh sửa yêu thích</h2>
      
      <div class="form-group">
        <label for="favorite-name">Tên</label>
        <input
          id="favorite-name"
          v-model="favoriteName"
          type="text"
          class="form-input"
          placeholder="Nhập tên yêu thích"
        />
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="$emit('update:visible', false)">
          Hủy
        </button>
        <button 
          class="save-btn" 
          :disabled="!favoriteName"
          @click="handleSave"
        >
          Lưu
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

interface Favorite {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  originalId: string;
}

export default defineComponent({
  name: 'GGDriveEditFavoriteDialog',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    favorite: {
      type: Object as () => Favorite,
      required: true
    }
  },
  emits: ['update:visible', 'save-favorite'],
  setup(props, { emit }) {
    const favoriteName = ref(props.favorite.name);

    watch(() => props.favorite, (newFavorite) => {
      favoriteName.value = newFavorite.name;
    });

    const handleSave = () => {
      emit('save-favorite', {
        ...props.favorite,
        name: favoriteName.value
      });
      emit('update:visible', false);
    };

    return {
      favoriteName,
      handleSave
    };
  }
});
</script>

<style scoped>
.edit-favorite-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1.5rem;
}

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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: white;
  color: var(--text-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: var(--secondary-color);
  border-color: var(--text-secondary);
}

.save-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background-color: var(--primary-color);
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: var(--primary-hover);
}

.save-btn:disabled {
  background-color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.7;
}
</style> 