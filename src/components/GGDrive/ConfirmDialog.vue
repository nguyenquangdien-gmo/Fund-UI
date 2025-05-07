<template>
  <PDialog
    :visible="visible"
    modal
    :header="title"
    :style="{ width: '400px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="confirm-content">
      <p>{{ message }}</p>
    </div>
    <template #footer>
      <PButton label="Hủy" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
      <PButton
        :label="confirmLabel || 'Xác nhận'"
        :icon="confirmIcon || 'pi pi-check'"
        :class="confirmClass || 'p-button-danger'"
        @click="handleConfirm"
      />
    </template>
  </PDialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PDialog from 'primevue/dialog';
import PButton from 'primevue/button';

export default defineComponent({
  name: 'GGDriveConfirmDialog',
  components: {
    PDialog,
    PButton
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: 'Xác nhận'
    },
    message: {
      type: String,
      required: true
    },
    confirmLabel: {
      type: String,
      default: ''
    },
    confirmIcon: {
      type: String,
      default: ''
    },
    confirmClass: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible', 'confirm'],
  setup(props, { emit }) {
    const handleConfirm = () => {
      emit('confirm');
      emit('update:visible', false);
    };

    return {
      handleConfirm
    };
  }
});
</script>

<style scoped>
.confirm-content {
  padding: 1rem 0;
}
</style> 