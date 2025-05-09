<template>
  <div>
    <Dialog :visible="visible" modal :header="isEdit ? 'Cập nhật tài khoản dịch vụ' : 'Thêm tài khoản dịch vụ'"
      :style="{ width: '550px' }" @update:visible="$emit('update:visible', $event)" :blockScroll="true">
      <div class="form-container">
        <div class="form-group">
          <label for="account-name">Tên tài khoản<span class="text-danger">*</span></label>
          <input id="account-name" v-model="form.accountName" type="text" class="form-input"
            placeholder="Nhập tên tài khoản" />
        </div>

        <div class="form-group">
          <label for="application-name">Tên ứng dụng<span class="text-danger">*</span></label>
          <input id="application-name" v-model="form.applicationName" type="text" class="form-input"
            placeholder="Nhập tên ứng dụng" />
        </div>

        <div class="form-group">
          <label for="description">Mô tả (tùy chọn)</label>
          <textarea id="description" v-model="form.description" class="form-input form-textarea"
            placeholder="Mô tả tài khoản dịch vụ này" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label for="credentials-file">File thông tin xác thực</label>
          <input type="file" id="credentials-file" ref="fileInput" class="form-input form-file" accept=".json"
            @change="onFileSelect" :disabled="isEdit" />
          <div v-if="selectedFile" class="selected-file">
            <span>{{ selectedFile.name }}</span>
            <button class="remove-file-btn" @click="removeFile">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <p v-if="isEdit" class="upload-note">
            <i class="pi pi-info-circle"></i>
            Để giữ an toàn, file thông tin xác thực không thể sửa đổi.
            Nếu bạn muốn cập nhật thông tin xác thực, vui lòng xóa và tạo tài khoản mới.
          </p>
        </div>

        <div class="form-group">
          <div class="checkbox-group">
            <input type="checkbox" id="is-default" v-model="form.isDefault" />
            <label for="is-default" class="checkbox-label">
              Đặt làm tài khoản mặc định
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button :label="isEdit ? 'Cập nhật' : 'Thêm'" :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'"
          @click="handleSubmit" :disabled="!isFormValid" />
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';

interface ServiceAccount {
  id: number;
  accountName: string;
  applicationName: string;
  description?: string;
  rootFolderId?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceAccountForm {
  accountName: string;
  applicationName: string;
  description: string;
  rootFolderId: string;
  isDefault: boolean;
}

export default defineComponent({
  name: 'GGDriveAddServiceAccountDialog',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    editAccount: {
      type: Object as () => ServiceAccount | null,
      required: false,
      default: null
    }
  },
  emits: ['update:visible', 'save-account'],
  setup(props, { emit }) {
    const fileInput = ref<HTMLInputElement | null>(null);
    const selectedFile = ref<File | null>(null);

    const isEdit = computed(() => props.editAccount !== null);

    const form = ref<ServiceAccountForm>({
      accountName: '',
      applicationName: '',
      description: '',
      rootFolderId: '',
      isDefault: false
    });

    // Reset form when dialog opens or edit account changes
    watch(() => [props.visible, props.editAccount], () => {
      console.log('Visibility changed:', props.visible, 'Edit account:', props.editAccount);
      if (props.visible) {
        if (props.editAccount) {
          // Fill form with edit account data
          form.value = {
            accountName: props.editAccount.accountName,
            applicationName: props.editAccount.applicationName,
            description: props.editAccount.description || '',
            rootFolderId: props.editAccount.rootFolderId || '',
            isDefault: props.editAccount.isDefault
          };
        } else {
          // Reset form for new account
          form.value = {
            accountName: '',
            applicationName: '',
            description: '',
            rootFolderId: '',
            isDefault: false
          };
          selectedFile.value = null;
        }
      }
    }, { immediate: true });

    onMounted(() => {
      console.log('AddServiceAccountDialog mounted');
    });

    const onFileSelect = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        selectedFile.value = input.files[0];
      }
    };

    const removeFile = () => {
      selectedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

    const isFormValid = computed(() => {
      if (isEdit.value) {
        // For edit, we don't require the file
        return form.value.accountName.trim() !== '' &&
          form.value.applicationName.trim() !== '';
      } else {
        // For new account, we require the file
        return form.value.accountName.trim() !== '' &&
          form.value.applicationName.trim() !== '' &&
          selectedFile.value !== null;
      }
    });

    const handleSubmit = () => {
      console.log('handleSubmit called, form valid:', isFormValid.value);
      if (!isFormValid.value) return;

      const formData = new FormData();
      formData.append('accountName', form.value.accountName);
      formData.append('applicationName', form.value.applicationName);

      if (form.value.description) {
        formData.append('description', form.value.description);
      }

      if (form.value.rootFolderId) {
        formData.append('rootFolderId', form.value.rootFolderId);
      }

      formData.append('isDefault', String(form.value.isDefault));

      if (selectedFile.value) {
        formData.append('credentials', selectedFile.value);
      }

      emit('save-account', {
        accountId: isEdit.value ? props.editAccount?.id : undefined,
        formData
      });

      emit('update:visible', false);
    };

    return {
      form,
      fileInput,
      selectedFile,
      isEdit,
      isFormValid,
      onFileSelect,
      removeFile,
      handleSubmit
    };
  }
});
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-input {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  background-color: var(--secondary-color);
}

.remove-file-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.remove-file-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--danger-color);
}

.upload-note {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>