// src/utils/toastUtil.js
import { useToast } from 'primevue/usetoast'

export const useToastMessage = (severity: string, detail: string) => {
  const toast = useToast()
  toast.add({
    severity,
    summary: severity === 'error' ? 'Lỗi' : `Thông báo`,
    detail,
    life: 3000,
  })
}
