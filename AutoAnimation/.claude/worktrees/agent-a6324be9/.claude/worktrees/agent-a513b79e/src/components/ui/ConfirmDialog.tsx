import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirmDialogStore } from '@/stores/useConfirmDialogStore'

/**
 * Global confirmation dialog -- mount once in App.
 * Replaces browser-native window.confirm() with an accessible modal.
 *
 * Cancel is the default-focused button so that pressing Enter
 * does NOT accidentally trigger the destructive action.
 */
export function ConfirmDialog() {
  const { open, options, accept, cancel } = useConfirmDialogStore()
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { title, description, confirmLabel = 'Delete', cancelLabel = 'Cancel' } = options

  // Manage mount/unmount with transition delay
  useEffect(() => {
    if (open) {
      // Cancel any pending unmount
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      setMounted(true)
      requestAnimationFrame(() => {
        setVisible(true)
        cancelRef.current?.focus()
      })
    } else {
      // Fade out first, then unmount after transition completes
      setVisible(false)
      closeTimerRef.current = setTimeout(() => {
        setMounted(false)
        closeTimerRef.current = null
      }, 150)
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [open])

  // Keyboard: Escape = cancel, focus-trap
  useEffect(() => {
    if (!mounted) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        cancel()
        return
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [mounted, cancel])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity duration-150',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={cancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className={cn(
          'fixed z-[100] inset-0 m-auto w-full max-w-sm h-fit',
          'bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl',
          'flex flex-col overflow-hidden transition-all duration-150',
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        )}
      >
        {/* Header / Icon */}
        <div className="flex items-start gap-3 p-5 pb-2">
          <div className="shrink-0 p-2 rounded-xl bg-red-500/10">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="confirm-dialog-title" className="text-sm font-semibold text-white leading-snug">
              {title}
            </h2>
            <p id="confirm-dialog-desc" className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <button
            ref={cancelRef}
            onClick={cancel}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            {cancelLabel}
          </button>
          <button
            onClick={accept}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
