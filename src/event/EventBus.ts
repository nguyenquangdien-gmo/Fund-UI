import mitt from 'mitt'

type Events = {
  showMessage: { severity: 'success' | 'info' | 'warn' | 'error'; summary: string; detail: string }
}

export const eventBus = mitt<Events>()
