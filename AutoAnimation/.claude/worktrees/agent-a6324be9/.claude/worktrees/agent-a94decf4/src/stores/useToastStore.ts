import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  /** Auto-dismiss after this many ms (default 4000). Set 0 for persistent. */
  duration: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, duration?: number) => string
  removeToast: (id: string) => void
}

let nextId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, duration = 4000) => {
    const id = `toast-${++nextId}`
    const toast: Toast = { id, type, message, duration }
    set((s) => ({ toasts: [...s.toasts, toast] }))

    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }

    return id
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

/** Convenience helpers */
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().addToast('success', msg, duration),
  error: (msg: string, duration?: number) => useToastStore.getState().addToast('error', msg, duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().addToast('warning', msg, duration),
  info: (msg: string, duration?: number) => useToastStore.getState().addToast('info', msg, duration),
}
