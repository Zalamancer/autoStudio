import { useState, useEffect, useRef, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

interface ModalShellProps {
  open: boolean
  onClose: () => void
  title: string
  icon: LucideIcon
  iconColor?: string // tailwind text color class
  gradientFrom?: string // tailwind gradient class
  /** "full" = inset-4/8/12  |  "compact" = centered max-w card */
  size?: 'full' | 'compact'
  children: ReactNode
}

export function ModalShell({
  open,
  onClose,
  title,
  icon: Icon,
  iconColor = 'text-blue-400',
  gradientFrom = 'from-blue-900/20',
  size = 'full',
  children,
}: ModalShellProps) {
  const [isVisible, setIsVisible] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // Animate in + save/restore focus
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
      previousFocusRef.current?.focus()
    }
  }, [open])

  // Auto-focus modal on open
  useEffect(() => {
    if (!open || !isVisible) return
    const el = modalRef.current
    if (!el) return
    const first = el.querySelector<HTMLElement>(FOCUSABLE)
    if (first) first.focus()
    else el.focus()
  }, [open, isVisible])

  // Escape to close + focus trap
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const el = modalRef.current
      if (!el) return
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
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
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity duration-200',
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'fixed z-50 bg-zinc-900/95 backdrop-blur-3xl shadow-glass flex flex-col overflow-hidden transition-all duration-200',
          size === 'full'
            ? 'inset-0 md:inset-8 lg:inset-12 md:rounded-3xl md:border md:border-white/10'
            : 'inset-0 m-auto w-full max-w-2xl max-h-[80vh] rounded-3xl border border-white/10',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-gradient-to-r to-transparent shrink-0',
            gradientFrom,
          )}
        >
          <div className={cn('p-1.5 rounded-lg', iconColor.replace('text-', 'bg-').replace('400', '500/20'))}>
            <Icon size={18} className={iconColor} />
          </div>
          <h2 id={titleId} className="text-base font-semibold text-white flex-1">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>,
    document.body,
  )
}
