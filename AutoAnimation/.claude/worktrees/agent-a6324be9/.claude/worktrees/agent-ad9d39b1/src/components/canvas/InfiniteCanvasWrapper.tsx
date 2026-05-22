/**
 * InfiniteCanvasWrapper — Wraps the canvas content in a pannable/zoomable
 * world-space viewport. When infinite canvas mode is enabled, the canvas
 * content is rendered inside a transformed container that responds to
 * mouse wheel (zoom) and middle-click drag (pan) events.
 *
 * Each artboard is rendered as a distinct region in world space with its
 * own dimensions, outline, and label.
 */

import React, { useRef, useCallback, useEffect, useState, memo } from 'react'
import { useArtboardStore } from '@/stores/useArtboardStore'
import type { Artboard } from '@/types/artboard'

const ZOOM_SENSITIVITY = 0.001

interface InfiniteCanvasWrapperProps {
  children: React.ReactNode
  /** Viewport container width */
  viewportWidth: number
  /** Viewport container height */
  viewportHeight: number
}

export const InfiniteCanvasWrapper = memo(function InfiniteCanvasWrapper({
  children,
  viewportWidth,
  viewportHeight,
}: InfiniteCanvasWrapperProps) {
  const enabled = useArtboardStore((s) => s.infiniteCanvasEnabled)
  const worldTransform = useArtboardStore((s) => s.worldTransform)
  const artboards = useArtboardStore((s) => s.artboards)
  const activeArtboardId = useArtboardStore((s) => s.activeArtboardId)
  const showArtboardOutlines = useArtboardStore((s) => s.showArtboardOutlines)
  const setActiveArtboard = useArtboardStore((s) => s.setActiveArtboard)
  const zoomWorldAt = useArtboardStore((s) => s.zoomWorldAt)

  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  // ── Wheel zoom ──
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enabled) return
      e.preventDefault()
      e.stopPropagation()

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const centerX = e.clientX - rect.left
      const centerY = e.clientY - rect.top

      const delta = -e.deltaY * ZOOM_SENSITIVITY
      zoomWorldAt(centerX, centerY, delta)
    },
    [enabled, zoomWorldAt]
  )

  // ── Middle-click pan / Space+click pan ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return

      // Middle button or Space+Left
      const isMiddle = e.button === 1
      const isSpacePan = e.button === 0 && e.altKey

      if (isMiddle || isSpacePan) {
        e.preventDefault()
        setIsPanning(true)
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: worldTransform.panX,
          panY: worldTransform.panY,
        }
      }
    },
    [enabled, worldTransform.panX, worldTransform.panY]
  )

  useEffect(() => {
    if (!isPanning) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      const store = useArtboardStore.getState()
      store.setWorldPan(
        panStartRef.current.panX + dx,
        panStartRef.current.panY + dy
      )
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning])

  if (!enabled) {
    return <>{children}</>
  }

  const { panX, panY, zoom } = worldTransform

  return (
    <div
      ref={containerRef}
      className="infinite-canvas-viewport"
      style={{
        position: 'relative',
        width: viewportWidth,
        height: viewportHeight,
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'default',
        backgroundColor: 'var(--color-surface-subtle, #111)',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Grid pattern background */}
      <InfiniteCanvasGrid panX={panX} panY={panY} zoom={zoom} />

      {/* World-space transform container */}
      <div
        className="infinite-canvas-world"
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {/* Artboard outlines & labels */}
        {artboards.map((artboard) => (
          <ArtboardFrame
            key={artboard.id}
            artboard={artboard}
            isActive={artboard.id === activeArtboardId}
            showOutline={showArtboardOutlines}
            onActivate={() => setActiveArtboard(artboard.id)}
            zoom={zoom}
          />
        ))}

        {/* Canvas content rendered at world origin (for single-artboard mode,
            or positioned within active artboard) */}
        {children}
      </div>

      {/* Zoom indicator */}
      <div
        className="absolute bottom-3 right-3 px-2 py-1 rounded text-xs font-mono select-none pointer-events-none"
        style={{
          backgroundColor: 'var(--color-overlay-heavy, rgba(0,0,0,0.7))',
          color: 'var(--color-text-secondary, #aaa)',
          zIndex: 50,
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
})

// ── Artboard Frame ──

function ArtboardFrame({
  artboard,
  isActive,
  showOutline,
  onActivate,
  zoom,
}: {
  artboard: Artboard
  isActive: boolean
  showOutline: boolean
  onActivate: () => void
  zoom: number
}) {
  const borderColor = isActive ? '#3b82f6' : showOutline ? '#555' : 'transparent'
  const labelSize = Math.max(10, 12 / zoom)

  return (
    <div
      style={{
        position: 'absolute',
        left: artboard.position.x,
        top: artboard.position.y,
        width: artboard.width,
        height: artboard.height,
        pointerEvents: 'none',
      }}
    >
      {/* Artboard label */}
      <div
        style={{
          position: 'absolute',
          top: -labelSize - 8 / zoom,
          left: 0,
          fontSize: `${labelSize}px`,
          color: isActive ? '#3b82f6' : '#888',
          whiteSpace: 'nowrap',
          pointerEvents: 'auto',
          cursor: 'pointer',
          userSelect: 'none',
          fontWeight: isActive ? 600 : 400,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onActivate()
        }}
      >
        {artboard.name}
        <span style={{ marginLeft: 6 / zoom, opacity: 0.5, fontSize: `${labelSize * 0.8}px` }}>
          {artboard.width} x {artboard.height}
        </span>
      </div>

      {/* Border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `${Math.max(1, 1 / zoom)}px solid ${borderColor}`,
          borderRadius: 2 / zoom,
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.stopPropagation()
          onActivate()
        }}
      />
    </div>
  )
}

// ── Grid Pattern ──

function InfiniteCanvasGrid({
  panX,
  panY,
  zoom,
}: {
  panX: number
  panY: number
  zoom: number
}) {
  // Adaptive grid spacing based on zoom level
  const baseSpacing = 100
  let spacing = baseSpacing
  while (spacing * zoom < 20) spacing *= 5
  while (spacing * zoom > 200) spacing /= 5

  const opacity = Math.min(0.3, 0.1 + (zoom - 0.1) * 0.05)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,${opacity}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: `${spacing * zoom}px ${spacing * zoom}px`,
        backgroundPosition: `${panX % (spacing * zoom)}px ${panY % (spacing * zoom)}px`,
      }}
    />
  )
}
