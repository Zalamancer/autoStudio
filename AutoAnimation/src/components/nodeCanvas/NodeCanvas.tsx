import { useCallback, useRef, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'
import { NodeCard, CARD_W, CARD_H } from './NodeCard'
import { NodeConnectionLayer } from './NodeConnectionLayer'
import { Spotlight } from './Spotlight'

export function NodeCanvas() {
  const nodes = useNodeCanvasStore((s) => s.nodes)
  const pan = useNodeCanvasStore((s) => s.pan)
  const zoom = useNodeCanvasStore((s) => s.zoom)
  const setPan = useNodeCanvasStore((s) => s.setPan)
  const setZoom = useNodeCanvasStore((s) => s.setZoom)
  const openSpotlight = useNodeCanvasStore((s) => s.openSpotlight)
  const closeSpotlight = useNodeCanvasStore((s) => s.closeSpotlight)
  const selectNode = useNodeCanvasStore((s) => s.selectNode)
  const moveNode = useNodeCanvasStore((s) => s.moveNode)
  const addConnection = useNodeCanvasStore((s) => s.addConnection)
  const spotlightOpen = useNodeCanvasStore((s) => s.spotlightOpen)

  const containerRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const dragNodeRef = useRef<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null)
  const spaceDownRef = useRef(false)

  // Dragging connection state
  const [draggingConnection, setDraggingConnection] = useState<{
    fromNodeId: string
    currentPos: { x: number; y: number }
  } | null>(null)

  // --- Wheel: pinch/ctrl → zoom, two-finger swipe → pan ---
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom on trackpad (or Ctrl+scroll)
        const delta = -e.deltaY * 0.001
        setZoom(Math.max(0.25, Math.min(3, zoom + delta)))
      } else {
        // Two-finger swipe → pan
        setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY })
      }
    },
    [zoom, pan, setZoom, setPan],
  )

  // --- Right-click → spotlight ---
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      openSpotlight({ x: e.clientX, y: e.clientY })
    },
    [openSpotlight],
  )

  // --- Left-click+drag on empty space → pan, middle-click → pan ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      console.log('[NodeCanvas] mouseDown', {
        button: e.button,
        target: (e.target as HTMLElement).tagName,
        dataset: (e.target as HTMLElement).dataset,
        isContainer: e.target === containerRef.current,
      })
      // Left click on empty canvas background or middle click → start pan
      if (e.button === 0) {
        const target = e.target as HTMLElement
        if (target === containerRef.current || target.dataset.canvasBg === 'true') {
          selectNode(null)
          if (spotlightOpen) closeSpotlight()
          e.preventDefault()
          isPanningRef.current = true
          panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
          console.log('[NodeCanvas] pan START', panStartRef.current)
          return
        }
        console.log('[NodeCanvas] left click missed bg check')
      }

      if (e.button === 1) {
        e.preventDefault()
        isPanningRef.current = true
        panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      }
    },
    [pan, selectNode, closeSpotlight, spotlightOpen],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        console.log('[NodeCanvas] panning', { dx, dy })
        setPan({
          x: panStartRef.current.panX + dx,
          y: panStartRef.current.panY + dy,
        })
        return
      }

      if (dragNodeRef.current) {
        const dx = (e.clientX - dragNodeRef.current.startX) / zoom
        const dy = (e.clientY - dragNodeRef.current.startY) / zoom
        moveNode(dragNodeRef.current.id, {
          x: dragNodeRef.current.nodeX + dx,
          y: dragNodeRef.current.nodeY + dy,
        })
        return
      }

      if (draggingConnection) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          setDraggingConnection((prev) =>
            prev
              ? {
                  ...prev,
                  currentPos: {
                    x: (e.clientX - rect.left - pan.x) / zoom,
                    y: (e.clientY - rect.top - pan.y) / zoom,
                  },
                }
              : null,
          )
        }
      }
    },
    [zoom, setPan, moveNode, pan, draggingConnection],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      isPanningRef.current = false
      dragNodeRef.current = null

      if (draggingConnection) {
        // Check if dropped on a node
        const rect = containerRef.current?.getBoundingClientRect()
        let hitNode = false
        if (rect) {
          const canvasX = (e.clientX - rect.left - pan.x) / zoom
          const canvasY = (e.clientY - rect.top - pan.y) / zoom
          const scale = 1 / zoom
          const cardW = CARD_W * scale
          const cardH = CARD_H * scale

          for (const node of nodes) {
            if (
              node.id !== draggingConnection.fromNodeId &&
              canvasX >= node.position.x &&
              canvasX <= node.position.x + cardW &&
              canvasY >= node.position.y &&
              canvasY <= node.position.y + cardH
            ) {
              addConnection(draggingConnection.fromNodeId, node.id)
              hitNode = true
              break
            }
          }
        }

        // Dropped on empty space → open Spotlight to create+connect
        if (!hitNode) {
          openSpotlight({ x: e.clientX, y: e.clientY }, draggingConnection.fromNodeId)
        }

        setDraggingConnection(null)
      }
    },
    [draggingConnection, pan, zoom, nodes, addConnection, openSpotlight],
  )

  // Space key for pan mode
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceDownRef.current = true
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDownRef.current = false
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // Touch pan + pinch-zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let lastTouches: { x: number; y: number }[] = []
    let lastDist = 0

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault() // suppress synthesized mouse events (spotlight open, etc.)
      lastTouches = Array.from(e.touches).map((t) => ({ x: t.clientX, y: t.clientY }))
      if (lastTouches.length === 2) {
        const dx = lastTouches[1].x - lastTouches[0].x
        const dy = lastTouches[1].y - lastTouches[0].y
        lastDist = Math.sqrt(dx * dx + dy * dy)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touches = Array.from(e.touches).map((t) => ({ x: t.clientX, y: t.clientY }))
      const s = useNodeCanvasStore.getState()

      if (touches.length === 1 && lastTouches.length >= 1) {
        const dx = touches[0].x - lastTouches[0].x
        const dy = touches[0].y - lastTouches[0].y
        s.setPan({ x: s.pan.x + dx, y: s.pan.y + dy })
      } else if (touches.length === 2 && lastTouches.length >= 2) {
        // Pinch zoom
        const dx = touches[1].x - touches[0].x
        const dy = touches[1].y - touches[0].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (lastDist > 0) {
          s.setZoom(Math.max(0.25, Math.min(3, s.zoom * (dist / lastDist))))
        }
        lastDist = dist

        // Two-finger pan via midpoint
        const midX = (touches[0].x + touches[1].x) / 2
        const midY = (touches[0].y + touches[1].y) / 2
        const prevMidX = (lastTouches[0].x + lastTouches[1].x) / 2
        const prevMidY = (lastTouches[0].y + lastTouches[1].y) / 2
        s.setPan({ x: s.pan.x + (midX - prevMidX), y: s.pan.y + (midY - prevMidY) })
      }

      lastTouches = touches
    }

    const onTouchEnd = () => {
      lastTouches = []
      lastDist = 0
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // Keyboard shortcut: Cmd+Shift+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
        e.preventDefault()
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          openSpotlight({
            x: rect.left + rect.width / 2 - 140,
            y: rect.top + rect.height / 3,
          })
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSpotlight])

  const handleStartDrag = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return
      dragNodeRef.current = {
        id: nodeId,
        startX: e.clientX,
        startY: e.clientY,
        nodeX: node.position.x,
        nodeY: node.position.y,
      }
    },
    [nodes],
  )

  const handleStartConnection = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setDraggingConnection({
        fromNodeId: nodeId,
        currentPos: {
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom,
        },
      })
    },
    [pan, zoom],
  )

  const isEmpty = nodes.length === 0

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden rounded-xl bg-zinc-950/50 border border-white/[0.04]"
      style={{
        cursor: spaceDownRef.current ? 'grab' : 'default',
        touchAction: 'none',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        data-canvas-bg="true"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Clickable background layer */}
      <div className="absolute inset-0" data-canvas-bg="true" />

      {/* Transform layer */}
      <div
        className="absolute"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connection layer */}
        <NodeConnectionLayer draggingConnection={draggingConnection} />

        {/* Node cards */}
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            zoom={zoom}
            onStartDrag={handleStartDrag}
            onStartConnection={handleStartConnection}
          />
        ))}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-sm text-zinc-600 mb-3">Click anywhere to add tools</p>
          <button
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800/60 border border-white/[0.08] text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
            onClick={() => {
              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                openSpotlight({
                  x: rect.left + rect.width / 2 - 140,
                  y: rect.top + rect.height / 3,
                })
              }
            }}
          >
            <Plus size={14} />
            Add Tool
          </button>
        </div>
      )}

      {/* Spotlight overlay */}
      <Spotlight />

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600 select-none">{Math.round(zoom * 100)}%</div>
    </div>
  )
}
