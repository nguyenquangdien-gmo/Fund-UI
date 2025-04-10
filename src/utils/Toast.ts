// src/utils/Toast.ts
import { eventBus } from '@/event/EventBus'

let hasShownToast = false

export function showToastOnce(payload: {
  severity: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail: string
}) {
  if (hasShownToast) return
  hasShownToast = true

  eventBus.emit('showMessage', payload)

  setTimeout(() => {
    hasShownToast = false
  }, 5000)
}
