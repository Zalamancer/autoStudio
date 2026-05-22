import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react' // eslint-disable-line
import { getAllMotionGraphics } from '@/motionGraphics'
import type { MotionGraphicRegistration } from '@/types/motionGraphic'

// ── Error boundary ─────────────────────────────────────────────────────

class PreviewBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: string }> {
  state: { hasError: boolean; error?: string } = { hasError: false }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            background: '#1a0505',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            fontSize: 11,
            color: '#f87171',
            fontFamily: 'monospace',
            padding: 8,
            textAlign: 'center',
          }}
        >
          {this.state.error?.slice(0, 60) ?? 'Render error'}
        </div>
      )
    }
    return this.props.children
  }
}

// ── Live preview ───────────────────────────────────────────────────────

function LivePreview({ reg }: { reg: MotionGraphicRegistration }) {
  const Component = reg.component as React.ComponentType<any>
  const [frame, setFrame] = useState(0)
  const rafRef = useRef(0)
  const startRef = useRef(0)
  const fps = 30
  const dur = fps * 5

  useEffect(() => {
    startRef.current = performance.now()
    const tick = (now: number) => {
      const f = Math.floor(((now - startRef.current) / 1000) * fps) % dur
      setFrame(f)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [dur])

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        background: '#0a0a0a',
      }}
    >
      <Component
        config={reg.defaultConfig}
        frame={frame}
        durationInFrames={dur}
        fps={fps}
        width={384}
        height={216}
        progress={frame / dur}
      />
    </div>
  )
}

// ── Template card ──────────────────────────────────────────────────────

function TemplateCard({
  reg,
  onSelect,
  isSelected,
}: {
  reg: MotionGraphicRegistration
  onSelect: (id: string) => void
  isSelected: boolean
}) {
  const [hovering, setHovering] = useState(false)
  const safeFilename = reg.title.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '')

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => onSelect(reg.id)}
      style={{
        borderRadius: 12,
        border: isSelected ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
        background: isSelected ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {/* Preview — only render on hover */}
      {hovering ? (
        <PreviewBoundary>
          <LivePreview reg={reg} />
        </PreviewBoundary>
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            background: 'linear-gradient(135deg, #111 0%, #1a1a2e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            fontSize: 11,
            color: '#444',
            fontFamily: 'monospace',
          }}
        >
          hover to preview
        </div>
      )}

      {/* Info */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#e5e5e5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {reg.title}
          </span>
          <span
            style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 99,
              background: reg.category === 'captions' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
              color: reg.category === 'captions' ? '#f59e0b' : '#3b82f6',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {reg.category === 'captions' ? 'Kinetic' : 'Scene'}
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#666',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {reg.description}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {reg.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.05)',
                color: '#555',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 9, color: '#444', marginTop: 4, fontFamily: 'monospace' }}>{safeFilename}.tsx</div>
      </div>
    </div>
  )
}

// ── Main gallery page ──────────────────────────────────────────────────

export function DevTemplateGallery() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [deletedCount, setDeletedCount] = useState(0)

  const allTemplates = useMemo(() => getAllMotionGraphics(), [])

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of allTemplates) map.set(t.category, (map.get(t.category) ?? 0) + 1)
    return [
      { id: 'all', label: 'All', count: allTemplates.length },
      ...Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => ({ id, label: id, count })),
    ]
  }, [allTemplates])

  const filtered = useMemo(() => {
    let results = category === 'all' ? allTemplates : allTemplates.filter((t) => t.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.id.toLowerCase().includes(q),
      )
    }
    return results
  }, [allTemplates, category, search])

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(filtered.map((t) => t.id)))
  }, [filtered])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const handleDelete = useCallback(async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} templates permanently from the codebase?`)) return

    setDeleting(true)
    // Map template IDs to filenames
    const filenames: string[] = []
    for (const id of selected) {
      const reg = allTemplates.find((t) => t.id === id)
      if (!reg) continue
      // Derive filename from title (matches how files are named)
      const filename = reg.title.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '')
      filenames.push(filename)
    }

    try {
      const resp = await fetch('/api/dev/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames }),
      })
      const result = await resp.json()
      setDeletedCount((c) => c + (result.deleted?.length ?? 0))
      setSelected(new Set())
      // Reload to pick up the removed imports
      setTimeout(() => window.location.reload(), 500)
    } catch (err) {
      alert(`Delete failed: ${err}`)
    } finally {
      setDeleting(false)
    }
  }, [selected, allTemplates])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#0a0a0aee',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            maxWidth: 1600,
            margin: '0 auto',
          }}
        >
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Template Gallery
              <span style={{ fontSize: 13, fontWeight: 400, color: '#666', marginLeft: 8 }}>
                {allTemplates.length} total · {filtered.length} shown
                {deletedCount > 0 && <span style={{ color: '#ef4444' }}> · {deletedCount} deleted this session</span>}
              </span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              style={{
                width: 260,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e5e5e5',
                fontSize: 13,
                outline: 'none',
              }}
            />

            {/* Category filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#1a1a1a',
                color: '#e5e5e5',
                fontSize: 13,
                outline: 'none',
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selection toolbar */}
        {selected.size > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 8,
              maxWidth: 1600,
              margin: '8px auto 0',
            }}
          >
            <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{selected.size} selected</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: deleting ? 'wait' : 'pointer',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              {deleting ? 'Deleting...' : `Delete ${selected.size} Templates`}
            </button>
            <button
              onClick={selectAll}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#999',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Select All Visible ({filtered.length})
            </button>
            <button
              onClick={clearSelection}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#999',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '16px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {filtered.map((reg) => (
            <TemplateCard key={reg.id} reg={reg} onSelect={toggleSelect} isSelected={selected.has(reg.id)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#444', fontSize: 14 }}>
            No templates match your search
          </div>
        )}
      </div>
    </div>
  )
}
