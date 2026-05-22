import { type ReactNode, useState, useEffect, useRef, useCallback } from 'react'
import { X, RotateCw, Copy, Download } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CanvasOverlayProps {
  title: string
  icon?: LucideIcon
  onClose: () => void
  onRetry?: () => void
  retryDisabled?: boolean
  /** Custom actions rendered in the header bar, before the close button */
  headerRight?: ReactNode
  children: ReactNode
}

interface ImageContextMenu {
  x: number
  y: number
  src: string
  alt: string
}

function ImageContextMenuPopup({ x, y, src, alt, onClose }: ImageContextMenu & { onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    })
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Keep menu within viewport
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    if (rect.right > window.innerWidth) menuRef.current.style.left = `${x - rect.width}px`
    if (rect.bottom > window.innerHeight) menuRef.current.style.top = `${y - rect.height}px`
  }, [x, y])

  const handleCopy = async () => {
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    } catch {
      // Fallback: copy src URL
      navigator.clipboard.writeText(src)
    }
    onClose()
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = src
    a.download = alt || 'image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    onClose()
  }

  const items = [
    { label: 'Copy Image', icon: Copy, action: handleCopy },
    { label: 'Download Image', icon: Download, action: handleDownload },
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] py-1 rounded-lg shadow-2xl border border-zinc-700/60 overflow-hidden"
      style={{
        left: x,
        top: y,
        backgroundColor: 'var(--color-surface-low)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[12px] text-zinc-200 hover:bg-zinc-700/50 transition-colors"
            onClick={item.action}
          >
            <Icon size={14} className="text-zinc-400" />
            <span className="flex-1">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function CanvasOverlay({
  title,
  icon: Icon,
  onClose,
  onRetry,
  retryDisabled,
  headerRight,
  children,
}: CanvasOverlayProps) {
  const [imageMenu, setImageMenu] = useState<ImageContextMenu | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    // Walk up from target to find an <img> element
    let el = e.target as HTMLElement | null
    while (el) {
      if (el.tagName === 'IMG') {
        e.preventDefault()
        const img = el as HTMLImageElement
        setImageMenu({ x: e.clientX, y: e.clientY, src: img.src, alt: img.alt || '' })
        return
      }
      el = el.parentElement
    }
    // Not on an image — let native menu show (don't preventDefault)
  }, [])

  return (
    <div
      className="fixed inset-0 md:absolute md:inset-3 z-50 bg-zinc-800 md:border border-zinc-700/50 md:rounded-xl shadow-2xl flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={handleContextMenu}
    >
      {/* Title bar */}
      <div className="shrink-0 relative flex items-center gap-2 px-4 py-3 border-b border-white/5">
        {Icon && <Icon size={16} className="text-green-400" />}
        <span className="text-sm font-medium text-zinc-200">{title}</span>
        <div className="flex-1" />
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={retryDisabled}
            className="flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Retry"
          >
            <RotateCw size={14} />
          </button>
        )}
        {headerRight}
        <button
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">{children}</div>

      {/* Image context menu */}
      {imageMenu && <ImageContextMenuPopup {...imageMenu} onClose={() => setImageMenu(null)} />}
    </div>
  )
}
