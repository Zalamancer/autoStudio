/**
 * Custom hook for canvas zoom, pan, orbit, and touch gesture handling.
 * Extracted from VideoCanvas.tsx to reduce component size.
 */
import { useRef, useEffect, useState, useCallback } from 'react'

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.25
const ZOOM_MAX = 3.0

interface CanvasInteractionParams {
  containerRef: React.RefObject<HTMLDivElement | null>
  canvasZoom: number
  canvasPanX: number
  canvasPanY: number
  is3DView: boolean
  orbitRotationX: number
  orbitRotationY: number
  layerSpreadFactor: number
  setCanvasZoom: (zoom: number) => void
  setCanvasPan: (x: number, y: number) => void
  setOrbitRotation: (x: number, y: number) => void
  setLayerSpreadFactor: (factor: number) => void
}

export function useCanvasInteraction({
  containerRef,
  canvasZoom,
  canvasPanX,
  canvasPanY,
  is3DView,
  orbitRotationX,
  orbitRotationY,
  layerSpreadFactor,
  setCanvasZoom,
  setCanvasPan,
  setOrbitRotation,
  setLayerSpreadFactor,
}: CanvasInteractionParams) {
  const [isPanning, setIsPanning] = useState(false)
  const [isOrbiting, setIsOrbiting] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const orbitStartRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 })

  // Store latest values in refs so native event handlers see current state
  const zoomRef = useRef(canvasZoom)
  const panXRef = useRef(canvasPanX)
  const panYRef = useRef(canvasPanY)
  const is3DViewRef = useRef(is3DView)
  const spreadRef = useRef(layerSpreadFactor)
  useEffect(() => { zoomRef.current = canvasZoom }, [canvasZoom])
  useEffect(() => { panXRef.current = canvasPanX }, [canvasPanX])
  useEffect(() => { panYRef.current = canvasPanY }, [canvasPanY])
  useEffect(() => { is3DViewRef.current = is3DView }, [is3DView])
  useEffect(() => { spreadRef.current = layerSpreadFactor }, [layerSpreadFactor])

  // Non-passive wheel listener (React's onWheel is passive and can't preventDefault)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (is3DViewRef.current) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const delta = -e.deltaY * 0.003
          const newSpread = Math.max(0.2, Math.min(3.0, spreadRef.current + delta))
          setLayerSpreadFactor(newSpread)
        } else {
          e.preventDefault()
          const delta = -e.deltaY * 0.002
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current + delta))
          setCanvasZoom(newZoom)
        }
      } else {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const delta = -e.deltaY * 0.002
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current + delta))
          setCanvasZoom(newZoom)
        } else if (e.shiftKey) {
          e.preventDefault()
          setCanvasPan(panXRef.current - e.deltaY, panYRef.current)
        } else {
          if (zoomRef.current > 1) {
            e.preventDefault()
            setCanvasPan(panXRef.current - e.deltaX, panYRef.current - e.deltaY)
          }
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [setCanvasZoom, setCanvasPan, setLayerSpreadFactor])

  // Touch gesture handler: single-finger pan + pinch-to-zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let lastTouches: { x: number; y: number }[] = []
    let lastDist = 0
    let lastZoom = zoomRef.current

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }]
      } else if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        lastDist = Math.sqrt(dx * dx + dy * dy)
        lastZoom = zoomRef.current
        lastTouches = [
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY },
        ]
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && lastTouches.length >= 1) {
        const dx = e.touches[0].clientX - lastTouches[0].x
        const dy = e.touches[0].clientY - lastTouches[0].y
        setCanvasPan(panXRef.current + dx, panYRef.current + dy)
        lastTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }]
      } else if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (lastDist > 0) {
          const scale = dist / lastDist
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, lastZoom * scale))
          setCanvasZoom(newZoom)
        }

        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        if (lastTouches.length === 2) {
          const lastMidX = (lastTouches[0].x + lastTouches[1].x) / 2
          const lastMidY = (lastTouches[0].y + lastTouches[1].y) / 2
          setCanvasPan(panXRef.current + midX - lastMidX, panYRef.current + midY - lastMidY)
        }
        lastTouches = [
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY },
        ]
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
    }
  }, [setCanvasZoom, setCanvasPan])

  // Middle-mouse-button drag for panning / left-click drag for orbiting in 3D
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (is3DView && e.button === 0) {
        e.preventDefault()
        setIsOrbiting(true)
        orbitStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          rotX: orbitRotationX,
          rotY: orbitRotationY,
        }
      } else if (e.button === 1) {
        e.preventDefault()
        setIsPanning(true)
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: canvasPanX,
          panY: canvasPanY,
        }
      }
    },
    [is3DView, orbitRotationX, orbitRotationY, canvasPanX, canvasPanY],
  )

  // Global mouse move/up for pan/orbit
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        setCanvasPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy)
      }
      if (isOrbiting) {
        const dx = e.clientX - orbitStartRef.current.x
        const dy = e.clientY - orbitStartRef.current.y
        setOrbitRotation(
          orbitStartRef.current.rotX + dy * 0.3,
          orbitStartRef.current.rotY + dx * 0.3,
        )
      }
    }

    const handleMouseUp = () => {
      setIsPanning(false)
      setIsOrbiting(false)
    }

    if (isPanning || isOrbiting) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, isOrbiting, setCanvasPan, setOrbitRotation])

  const fitToView = useCallback(() => {
    setCanvasZoom(1)
    setCanvasPan(0, 0)
  }, [setCanvasZoom, setCanvasPan])

  const zoomIn = useCallback(() => setCanvasZoom(Math.min(ZOOM_MAX, canvasZoom + ZOOM_STEP)), [setCanvasZoom, canvasZoom])
  const zoomOut = useCallback(() => setCanvasZoom(Math.max(ZOOM_MIN, canvasZoom - ZOOM_STEP)), [setCanvasZoom, canvasZoom])

  const getCursor = useCallback(() => {
    if (is3DView) return isOrbiting ? 'grabbing' : 'grab'
    if (isPanning) return 'grabbing'
    return undefined
  }, [is3DView, isOrbiting, isPanning])

  return {
    isPanning,
    isOrbiting,
    handleMouseDown,
    fitToView,
    zoomIn,
    zoomOut,
    getCursor,
    ZOOM_MIN,
    ZOOM_MAX,
  }
}
