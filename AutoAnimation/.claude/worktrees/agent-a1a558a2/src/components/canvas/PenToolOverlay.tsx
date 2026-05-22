/**
 * PenToolOverlay — Interactive overlay for the pen tool.
 *
 * Handles mouse events for placing anchor points, dragging control
 * handles, and closing paths. Sits on top of the canvas and captures
 * all pen tool interactions.
 */

import React, { useCallback, useRef, useEffect } from 'react'
import { usePenToolStore } from '@/stores/usePenToolStore'

interface PenToolOverlayProps {
  canvasWidth: number
  canvasHeight: number
  /** Current canvas zoom for coordinate conversion */
  zoom: number
}

export function PenToolOverlay({ canvasWidth, canvasHeight, zoom }: PenToolOverlayProps) {
  const isActive = usePenToolStore((s) => s.isActive)
  const mode = usePenToolStore((s) => s.mode)
  const drawingPathId = usePenToolStore((s) => s.drawingPathId)
  const startNewPath = usePenToolStore((s) => s.startNewPath)
  const addAnchorToPath = usePenToolStore((s) => s.addAnchorToPath)
  const closePath = usePenToolStore((s) => s.closePath)
  const finishDrawing = usePenToolStore((s) => s.finishDrawing)
  const setPreviewPoint = usePenToolStore((s) => s.setPreviewPoint)
  const setHandleOut = usePenToolStore((s) => s.setHandleOut)

  const overlayRef = useRef<HTMLDivElement>(null)
  const isDraggingHandle = useRef(false)
  const dragStartRef = useRef<{ anchorId: string; startX: number; startY: number } | null>(null)

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      const rect = overlayRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      }
    },
    [zoom]
  )

  // ── Click to place points ──
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive) return
      if (isDraggingHandle.current) {
        isDraggingHandle.current = false
        return
      }

      const { x, y } = getCanvasCoords(e)

      if (mode === 'drawing' && drawingPathId) {
        // Check if clicking near the first point to close path
        const path = usePenToolStore.getState().paths.find((p) => p.id === drawingPathId)
        if (path && path.anchors.length >= 3) {
          const first = path.anchors[0]
          const dist = Math.hypot(x - first.x, y - first.y)
          if (dist < 15 / zoom) {
            closePath(drawingPathId)
            return
          }
        }

        addAnchorToPath(drawingPathId, x, y)
      } else if (mode === 'idle' || mode === 'selecting') {
        startNewPath(x, y)
      }
    },
    [isActive, mode, drawingPathId, getCanvasCoords, zoom, addAnchorToPath, closePath, startNewPath]
  )

  // ── Mouse move for preview line ──
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive || mode !== 'drawing') return
      const { x, y } = getCanvasCoords(e)
      setPreviewPoint({ x, y })
    },
    [isActive, mode, getCanvasCoords, setPreviewPoint]
  )

  // ── Mouse down for handle dragging ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive || mode !== 'drawing' || !drawingPathId) return
      if (e.button !== 0) return

      const { x, y } = getCanvasCoords(e)
      const path = usePenToolStore.getState().paths.find((p) => p.id === drawingPathId)
      if (!path) return

      const lastAnchor = path.anchors[path.anchors.length - 1]
      if (!lastAnchor) return

      // If clicking near the last anchor, start handle drag
      const dist = Math.hypot(x - lastAnchor.x, y - lastAnchor.y)
      if (dist < 10 / zoom) {
        isDraggingHandle.current = true
        dragStartRef.current = {
          anchorId: lastAnchor.id,
          startX: lastAnchor.x,
          startY: lastAnchor.y,
        }
      }
    },
    [isActive, mode, drawingPathId, getCanvasCoords, zoom]
  )

  // ── Handle drag (window-level for smooth dragging) ──
  useEffect(() => {
    if (!isActive) return

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDraggingHandle.current || !dragStartRef.current || !drawingPathId) return

      const rect = overlayRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom

      const dx = x - dragStartRef.current.startX
      const dy = y - dragStartRef.current.startY

      setHandleOut(drawingPathId, dragStartRef.current.anchorId, dx, dy)
    }

    const handleWindowMouseUp = () => {
      if (isDraggingHandle.current) {
        // Keep isDraggingHandle true briefly to prevent click from firing
        setTimeout(() => {
          isDraggingHandle.current = false
        }, 50)
        dragStartRef.current = null
      }
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [isActive, drawingPathId, zoom, setHandleOut])

  // ── Escape / Enter to finish ──
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        finishDrawing()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, finishDrawing])

  if (!isActive) return null

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        cursor: mode === 'drawing' ? 'crosshair' : 'default',
        zIndex: 100,
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
    />
  )
}
