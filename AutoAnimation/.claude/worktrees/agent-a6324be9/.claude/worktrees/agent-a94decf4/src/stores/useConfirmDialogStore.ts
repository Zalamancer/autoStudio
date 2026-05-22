import { create } from 'zustand'

export interface ConfirmDialogOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmDialogState {
  open: boolean
  options: ConfirmDialogOptions
  resolve: ((value: boolean) => void) | null

  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
  accept: () => void
  cancel: () => void
}

export const useConfirmDialogStore = create<ConfirmDialogState>((set, get) => ({
  open: false,
  options: { title: '', description: '' },
  resolve: null,

  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      const current = get()
      if (current.resolve) current.resolve(false) // auto-cancel previous
      set({ open: true, options, resolve })
    }),

  accept: () => {
    const { resolve } = get()
    resolve?.(true)
    set({ open: false, resolve: null })
  },

  cancel: () => {
    const { resolve } = get()
    resolve?.(false)
    set({ open: false, resolve: null })
  },
}))

/** Convenience hook -- returns just the `confirm` action */
export function useConfirmDialog() {
  return useConfirmDialogStore((s) => s.confirm)
}
