import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  Trash2,
  BookOpen,
  Check,
  Settings2,
  Minus,
  Plus,
} from 'lucide-react'
import { useEditorStore } from '@/stores'
import { useMarketplaceStore } from '@/stores/useMarketplaceStore'
import { BUILTIN_TEMPLATES, getTemplateContent } from '@/data/builtinTemplates'
import {
  parseTemplateConfig,
  type TemplateConfigProperty,
  type ConfigPropertyType,
} from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import { ColorPicker } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import { getAllMotionGraphics } from '@/motionGraphics'
import type { MotionGraphicRegistration } from '@/types/motionGraphic'

const ASPECT_RATIOS = [
  { label: '16:9', w: 16, h: 9 },
  { label: '9:16', w: 9, h: 16 },
  { label: '1:1', w: 1, h: 1 },
  { label: '4:3', w: 4, h: 3 },
  { label: 'Full', w: 0, h: 0 },
] as const

export function TemplateDevMode() {
  const open = useEditorStore((s) => s.templateDevModeOpen)
  const setOpen = useEditorStore((s) => s.setTemplateDevModeOpen)
  const [devTab, setDevTab] = useState<'html' | 'motion'>('motion')
  const deletedBuiltinIds = useMarketplaceStore((s) => s.deletedBuiltinIds)
  const deleteBuiltinForever = useMarketplaceStore((s) => s.deleteBuiltinForever)
  const togglePublished = useMarketplaceStore((s) => s.togglePublished)
  const items = useMarketplaceStore((s) => s.items)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<string>('Full')
  const [configOpen, setConfigOpen] = useState(false)
  const [configProps, setConfigProps] = useState<TemplateConfigProperty[]>([])
  const [iframeReady, setIframeReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Filter out deleted templates
  const templates = useMemo(() => {
    const deleted = new Set(deletedBuiltinIds ?? [])
    return BUILTIN_TEMPLATES.filter((t) => !deleted.has(t.id))
  }, [deletedBuiltinIds])

  // Clamp index
  useEffect(() => {
    if (currentIndex >= templates.length && templates.length > 0) {
      setCurrentIndex(templates.length - 1)
    }
  }, [templates.length, currentIndex])

  const tpl = templates[currentIndex] ?? null
  const html = tpl ? getTemplateContent(tpl.filename) : null
  const isPublished = tpl ? (items.find((i) => i.id === tpl.id)?.published ?? false) : false

  // Parse config properties when template changes
  useEffect(() => {
    if (!html) {
      setConfigProps([])
      return
    }
    const props = parseTemplateConfig(html).filter((p) => typeof p.value !== 'function' && typeof p.value !== 'symbol')
    setConfigProps(props)
    setIframeReady(false)
  }, [html])

  // Listen for TEMPLATE_READY from bridge
  useEffect(() => {
    if (!open) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'TEMPLATE_READY') {
        setIframeReady(true)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [open])

  // Build iframe srcDoc with bridge injected
  const srcDoc = useMemo(() => {
    if (!html) return ''
    return injectMessageBridge(html)
  }, [html])

  // Ensure a value is safe for postMessage (structuredClone-compatible)
  const safeClone = useCallback((val: unknown): unknown => {
    if (val === null || val === undefined) return val
    const t = typeof val
    if (t === 'string' || t === 'number' || t === 'boolean') return val
    if (t === 'function' || t === 'symbol') return undefined
    if (Array.isArray(val)) return val.map(safeClone)
    if (t === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const sv = safeClone(v)
        if (sv !== undefined) out[k] = sv
      }
      return out
    }
    return undefined
  }, [])

  // Send config update to iframe
  const sendConfigUpdate = useCallback(
    (key: string, value: unknown) => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow) return
      try {
        iframe.contentWindow.postMessage({ type: 'CONFIG_UPDATE', key, value: safeClone(value) }, '*')
      } catch {
        // Skip non-cloneable values
      }
    },
    [safeClone],
  )

  // Handle config property change
  const handleConfigChange = useCallback(
    (key: string, value: unknown) => {
      setConfigProps((prev) => prev.map((p) => (p.key === key ? { ...p, value } : p)))
      sendConfigUpdate(key, value)
    },
    [sendConfigUpdate],
  )

  // Send bulk config when iframe becomes ready
  useEffect(() => {
    if (!iframeReady || configProps.length === 0) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const values: Record<string, unknown> = {}
    for (const p of configProps) {
      const sv = safeClone(p.value)
      if (sv !== undefined) values[p.key] = sv
    }
    try {
      iframe.contentWindow.postMessage({ type: 'CONFIG_BULK_UPDATE', values }, '*')
    } catch {
      // Skip if values still can't be cloned
    }
  }, [iframeReady, configProps, safeClone])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      // Don't navigate when typing in an input
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape') {
        setOpen(false)
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(0, i - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => Math.min(templates.length - 1, i + 1))
      }
    },
    [open, templates.length, setOpen],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Copy HTML
  const handleCopy = useCallback(() => {
    if (!html) return
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [html])

  // Download HTML
  const handleDownload = useCallback(() => {
    if (!html || !tpl) return
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = tpl.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [html, tpl])

  // Delete Forever
  const handleDelete = useCallback(() => {
    if (!tpl) return
    if (!window.confirm(`Permanently delete template "${tpl.id}"? This cannot be undone.`)) return
    deleteBuiltinForever(tpl.id)
  }, [tpl, deleteBuiltinForever])

  // Publish / Unpublish
  const handleTogglePublish = useCallback(() => {
    if (!tpl) return
    togglePublished(tpl.id)
  }, [tpl, togglePublished])

  // Group config properties
  const groupedConfig = useMemo(() => {
    const groups: Record<string, TemplateConfigProperty[]> = {}
    for (const prop of configProps) {
      const g = prop.group || 'Other'
      if (!groups[g]) groups[g] = []
      groups[g].push(prop)
    }
    return groups
  }, [configProps])

  if (!open) return null

  // Motion graphics mode
  if (devTab === 'motion') {
    return createPortal(
      <MotionGraphicsDevViewer onClose={() => setOpen(false)} onSwitchTab={() => setDevTab('html')} />,
      document.body,
    )
  }

  if (templates.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="text-zinc-400 text-lg">No templates remaining.</div>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          <X size={20} />
        </button>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X size={14} />
            Close
          </button>
          <div className="flex items-center bg-zinc-800/60 rounded-lg p-0.5 ml-2">
            <button
              onClick={() => setDevTab('motion')}
              className="px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-500 hover:text-zinc-300"
            >
              Motion ({getAllMotionGraphics().length})
            </button>
            <button className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-zinc-600 text-zinc-100">
              HTML ({templates.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-100">{tpl?.title ?? ''}</span>
          <span className="text-xs text-zinc-500">
            {currentIndex + 1} / {templates.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Config toggle */}
          <button
            onClick={() => setConfigOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              configOpen ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
            title="Toggle config panel"
          >
            <Settings2 size={14} />
            Config
            {configProps.length > 0 && <span className="text-[10px] text-zinc-500 ml-0.5">({configProps.length})</span>}
          </button>

          {/* Aspect ratio selector */}
          <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-0.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.label}
                onClick={() => setAspectRatio(ar.label)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  aspectRatio === ar.label ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>

          {/* Prev / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(templates.length - 1, i + 1))}
              disabled={currentIndex === templates.length - 1}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content: iframe + optional config panel */}
      <div className="flex-1 flex min-h-0">
        {/* Iframe area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
          {aspectRatio === 'Full' ? (
            <iframe
              ref={iframeRef}
              key={tpl?.id}
              srcDoc={srcDoc}
              className="absolute inset-0 w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title={tpl?.title ?? 'Template preview'}
            />
          ) : (
            <div
              className="relative border border-white/10 rounded overflow-hidden"
              style={{
                aspectRatio: `${ASPECT_RATIOS.find((a) => a.label === aspectRatio)!.w} / ${ASPECT_RATIOS.find((a) => a.label === aspectRatio)!.h}`,
                maxWidth: '100%',
                maxHeight: '100%',
                width:
                  ASPECT_RATIOS.find((a) => a.label === aspectRatio)!.w >=
                  ASPECT_RATIOS.find((a) => a.label === aspectRatio)!.h
                    ? '100%'
                    : 'auto',
                height:
                  ASPECT_RATIOS.find((a) => a.label === aspectRatio)!.h >
                  ASPECT_RATIOS.find((a) => a.label === aspectRatio)!.w
                    ? '100%'
                    : 'auto',
              }}
            >
              <iframe
                ref={iframeRef}
                key={`${tpl?.id}-${aspectRatio}`}
                srcDoc={srcDoc}
                className="absolute inset-0 w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title={tpl?.title ?? 'Template preview'}
              />
            </div>
          )}
        </div>

        {/* Config side panel */}
        {configOpen && (
          <div className="w-80 shrink-0 bg-zinc-900/95 border-l border-white/10 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Template Config</span>
              <span className="text-[10px] text-zinc-600">{configProps.length} properties</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {configProps.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-8">No configurable properties found.</p>
              ) : (
                Object.entries(groupedConfig).map(([group, props]) => (
                  <ConfigGroup key={group} group={group} properties={props} onChange={handleConfigChange} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-3 bg-zinc-900/90 border-t border-white/10 shrink-0">
        <div className="flex items-start justify-between gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 leading-relaxed truncate">{tpl?.description}</p>
            <div className="flex items-center gap-2 mt-1">
              {tpl?.tags.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500">
                  {tag}
                </span>
              ))}
              <span className="text-[10px] text-zinc-600 ml-2">{tpl?.category || 'html-templates'}</span>
              {isPublished && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 font-medium">
                  Published
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              {copied ? <Check size={13} className="text-green-400" /> : <Clipboard size={13} />}
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              <Download size={13} />
              Download
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
            >
              <Trash2 size={13} />
              Delete Forever
            </button>
            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                isPublished
                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              <BookOpen size={13} />
              {isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Motion Graphics Dev Viewer ────────────────────────────────────────────

class MotionPreviewBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    if (prevProps.children !== this.props.children) this.setState({ hasError: false })
  }
  render() {
    if (this.state.hasError)
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/50 text-red-400 text-sm font-mono">
          Render error
        </div>
      )
    return this.props.children
  }
}

function MotionPreviewPlayer({
  reg,
  width,
  height,
}: {
  reg: MotionGraphicRegistration
  width: number
  height: number
}) {
  const Component = reg.component as React.ComponentType<any>
  const [frame, setFrame] = useState(0)
  const rafRef = useRef(0)
  const startRef = useRef(0)
  const fps = 30
  const dur = fps * 5

  useEffect(() => {
    startRef.current = performance.now()
    const tick = (now: number) => {
      setFrame(Math.floor(((now - startRef.current) / 1000) * fps) % dur)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [dur])

  return (
    <Component
      config={reg.defaultConfig}
      frame={frame}
      durationInFrames={dur}
      fps={fps}
      width={width}
      height={height}
      progress={frame / dur}
    />
  )
}

// ── Ratings persistence ───────────────────────────────────────────────

type RatingMap = Record<string, 'liked' | 'disliked'>

function saveRatingToServer(id: string, rating: 'liked' | 'disliked' | null) {
  fetch('/api/dev/templates/ratings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, rating }),
  }).catch(() => {
    /* ignore */
  })
}

type ViewFilter = 'all' | 'unrated' | 'liked' | 'disliked'

function MotionGraphicsDevViewer({ onClose, onSwitchTab }: { onClose: () => void; onSwitchTab: () => void }) {
  const allMG = useMemo(() => getAllMotionGraphics(), [])
  const [ratings, setRatings] = useState<RatingMap>({})
  const [filter, setFilter] = useState<ViewFilter>('unrated')
  const [idx, setIdx] = useState(0)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load ratings from server on mount
  useEffect(() => {
    fetch('/api/dev/templates/ratings')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => setRatings(data))
      .catch(() => {})
  }, [])

  // Filtered list based on current view mode
  const filtered = useMemo(() => {
    if (filter === 'all') return allMG
    if (filter === 'unrated') return allMG.filter((t) => !ratings[t.id])
    if (filter === 'liked') return allMG.filter((t) => ratings[t.id] === 'liked')
    return allMG.filter((t) => ratings[t.id] === 'disliked')
  }, [allMG, ratings, filter])

  // Clamp index
  useEffect(() => {
    if (idx >= filtered.length && filtered.length > 0) setIdx(filtered.length - 1)
  }, [filtered.length, idx])

  const reg = filtered[idx] ?? null

  // Counts
  const likedCount = allMG.filter((t) => ratings[t.id] === 'liked').length
  const dislikedCount = allMG.filter((t) => ratings[t.id] === 'disliked').length
  const unratedCount = allMG.length - likedCount - dislikedCount

  // Rate + auto-advance
  const rate = useCallback(
    (rating: 'liked' | 'disliked') => {
      if (!reg) return
      setFlash(rating === 'liked' ? 'up' : 'down')
      setTimeout(() => setFlash(null), 300)
      setRatings((prev) => {
        const next = { ...prev }
        const toggling = next[reg.id] === rating
        if (toggling) {
          delete next[reg.id]
          saveRatingToServer(reg.id, null)
        } else {
          next[reg.id] = rating
          saveRatingToServer(reg.id, rating)
        }
        return next
      })
      // Auto-advance to next in filtered list (if in unrated mode, item disappears so idx stays)
      if (filter !== 'unrated') {
        setIdx((i) => Math.min(filtered.length - 1, i + 1))
      }
    },
    [reg, filter, filtered.length],
  )

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        setIdx((i) => Math.max(0, i - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        setIdx((i) => Math.min(filtered.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        rate('liked')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        rate('disliked')
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [filtered.length, onClose, rate])

  const handleDelete = useCallback(async () => {
    if (!reg) return
    const filename = reg.title.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '')
    if (!window.confirm(`Delete "${reg.title}" (${filename}.tsx) from codebase?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/dev/templates/${filename}`, { method: 'DELETE' })
      if (idx >= filtered.length - 1) setIdx((i) => Math.max(0, i - 1))
    } catch (err) {
      alert(`Delete failed: ${err}`)
    } finally {
      setDeleting(false)
    }
  }, [reg, idx, filtered.length])

  const currentRating = reg ? ratings[reg.id] : undefined

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Flash overlay on rate */}
      {flash && (
        <div
          className={`absolute inset-0 z-[10000] pointer-events-none transition-opacity duration-300 ${
            flash === 'up' ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X size={14} /> Close
          </button>
          <div className="flex items-center bg-zinc-800/60 rounded-lg p-0.5 ml-2">
            <button className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-zinc-600 text-zinc-100">
              Motion ({allMG.length})
            </button>
            <button
              onClick={onSwitchTab}
              className="px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-500 hover:text-zinc-300"
            >
              HTML
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center bg-zinc-800/40 rounded-lg p-0.5 ml-3">
            {[
              { id: 'unrated' as ViewFilter, label: 'Unrated', count: unratedCount, color: 'text-zinc-300' },
              { id: 'liked' as ViewFilter, label: 'Liked', count: likedCount, color: 'text-green-400' },
              { id: 'disliked' as ViewFilter, label: 'Nope', count: dislikedCount, color: 'text-red-400' },
              { id: 'all' as ViewFilter, label: 'All', count: allMG.length, color: 'text-zinc-300' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilter(f.id)
                  setIdx(0)
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  filter === f.id ? `bg-zinc-700 ${f.color}` : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f.label} <span className="opacity-60">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-100">{reg?.title ?? ''}</span>
          <span className="text-xs text-zinc-500">
            {filtered.length > 0 ? `${idx + 1} / ${filtered.length}` : '0 / 0'}
          </span>
          {reg && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                reg.category === 'captions' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
              }`}
            >
              {reg.category === 'captions' ? 'Kinetic' : 'Scene'}
            </span>
          )}
          {/* Current rating indicator */}
          {currentRating && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                currentRating === 'liked' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {currentRating === 'liked' ? 'LIKED' : 'NOPE'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0 || filtered.length === 0}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(filtered.length - 1, i + 1))}
            disabled={idx >= filtered.length - 1}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {reg ? (
          <div className="relative w-full h-full max-w-[1280px] max-h-[720px]" style={{ aspectRatio: '16/9' }}>
            <MotionPreviewBoundary key={reg.id}>
              <MotionPreviewPlayer reg={reg} width={1280} height={720} />
            </MotionPreviewBoundary>
          </div>
        ) : (
          <div className="text-zinc-600 text-sm">
            {filter === 'unrated' ? 'All templates rated! Switch to Liked to review.' : 'No templates in this filter.'}
          </div>
        )}

        {/* Side indicators */}
        {reg && (
          <>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
              <button
                onClick={() => rate('liked')}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                  currentRating === 'liked'
                    ? 'bg-green-500 text-black scale-110'
                    : 'bg-zinc-800/80 text-zinc-400 hover:bg-green-500/20 hover:text-green-400'
                }`}
                title="Like (Up Arrow)"
              >
                <ChevronLeft size={20} className="rotate-90" />
              </button>
              <span className="text-[10px] text-zinc-600 font-mono">UP</span>
              <div className="w-px h-8 bg-zinc-800" />
              <span className="text-[10px] text-zinc-600 font-mono">DOWN</span>
              <button
                onClick={() => rate('disliked')}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                  currentRating === 'disliked'
                    ? 'bg-red-500 text-black scale-110'
                    : 'bg-zinc-800/80 text-zinc-400 hover:bg-red-500/20 hover:text-red-400'
                }`}
                title="Dislike (Down Arrow)"
              >
                <ChevronLeft size={20} className="-rotate-90" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-3 bg-zinc-900/90 border-t border-white/10 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 truncate">{reg?.description}</p>
            <div className="flex items-center gap-2 mt-1">
              {reg?.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500">
                  {tag}
                </span>
              ))}
              <span className="text-[10px] text-zinc-600 ml-2 font-mono">{reg?.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-zinc-600 mr-2">Left/Right = browse · Up = like · Down = nope</span>
            <button
              onClick={handleDelete}
              disabled={deleting || !reg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              {deleting ? 'Deleting...' : 'Delete from Codebase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Config Group ──────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  Text: 'text-emerald-400',
  Colors: 'text-pink-400',
  Animation: 'text-amber-400',
  Numbers: 'text-sky-400',
  Data: 'text-violet-400',
}

function ConfigGroup({
  group,
  properties,
  onChange,
}: {
  group: string
  properties: TemplateConfigProperty[]
  onChange: (key: string, value: unknown) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 bg-zinc-800/50 flex items-center gap-2 hover:bg-zinc-800 transition-colors"
      >
        <span className={`text-xs font-medium ${GROUP_COLORS[group] || 'text-zinc-300'}`}>{group}</span>
        <span className="text-[10px] text-zinc-600 ml-auto">{properties.length}</span>
        <span className="text-zinc-500 text-[10px]">{collapsed ? '\u25B8' : '\u25BE'}</span>
      </button>
      {!collapsed && (
        <div className="p-3 space-y-2.5 bg-zinc-900/30">
          {properties.map((prop) => (
            <ConfigControl key={prop.key} prop={prop} onChange={(value) => onChange(prop.key, value)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Config Control ────────────────────────────────────────────────────────

function ConfigControl({ prop, onChange }: { prop: TemplateConfigProperty; onChange: (value: unknown) => void }) {
  const type: ConfigPropertyType = prop.type

  if (type === 'text') {
    return (
      <div>
        <label className="text-[10px] text-zinc-500 block mb-1">{prop.label}</label>
        <input
          type="text"
          value={String(prop.value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 rounded-md text-xs bg-zinc-800 border border-zinc-700/50 text-zinc-200 focus:outline-none focus:border-blue-500/50"
        />
      </div>
    )
  }

  if (type === 'color') {
    const colorVal = String(prop.value ?? '#000000')
    const hexVal = colorVal.startsWith('#') ? colorVal.slice(0, 7) : '#000000'
    return (
      <div className="flex items-center gap-2">
        <ColorPicker color={hexVal} onChange={(c) => onChange(c)} />
        <span className="text-[10px] text-zinc-500">{prop.label}</span>
      </div>
    )
  }

  if (type === 'number') {
    const numVal = typeof prop.value === 'number' ? prop.value : 0
    const numStep = numVal >= 100 ? 10 : numVal >= 1 ? 1 : 0.1
    const numPrecision = numVal < 1 ? 2 : numVal < 100 ? 1 : 0
    return (
      <PanelSlider
        label={prop.label}
        value={numVal}
        onChange={(v) => onChange(v)}
        min={numVal - 1000}
        max={numVal + 1000}
        step={numStep}
        precision={numPrecision}
        compact
      />
    )
  }

  if (type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!prop.value}
          onChange={() => onChange(!prop.value)}
          className="accent-blue-500 w-3 h-3"
        />
        <span className="text-xs text-zinc-400">{prop.label}</span>
      </label>
    )
  }

  if (type === 'text-array') {
    const arr = Array.isArray(prop.value) ? (prop.value as string[]) : []
    return (
      <div>
        <label className="text-[10px] text-zinc-500 block mb-1">{prop.label}</label>
        <div className="space-y-1">
          {arr.map((item, i) => (
            <div key={i} className="flex gap-1">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newArr = [...arr]
                  newArr[i] = e.target.value
                  onChange(newArr)
                }}
                className="flex-1 px-2 py-1 rounded text-[10px] bg-zinc-800 border border-zinc-700/50 text-zinc-300 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => onChange(arr.filter((_, idx) => idx !== i))}
                className="px-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
                title="Remove"
              >
                <Minus size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange([...arr, ''])}
            className="w-full flex items-center justify-center gap-1 py-1 rounded text-[10px] text-zinc-500 hover:text-blue-400 hover:bg-blue-600/10 transition-colors border border-dashed border-zinc-700/50"
          >
            <Plus size={10} /> Add
          </button>
        </div>
      </div>
    )
  }

  if (type === 'object-array' || type === 'nested-colors') {
    const jsonStr = typeof prop.value === 'string' ? prop.value : JSON.stringify(prop.value, null, 2)
    return (
      <div>
        <label className="text-[10px] text-zinc-500 block mb-1">{prop.label}</label>
        <textarea
          value={jsonStr}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              onChange(parsed)
            } catch {
              // Don't update if invalid JSON
            }
          }}
          rows={Math.min(8, Math.max(3, String(jsonStr).split('\n').length))}
          className="w-full px-2 py-1.5 rounded-md text-[10px] bg-zinc-800 border border-zinc-700/50 text-zinc-300 focus:outline-none focus:border-blue-500/50 font-mono resize-y"
          spellCheck={false}
        />
      </div>
    )
  }

  return null
}
