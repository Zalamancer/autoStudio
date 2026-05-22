import { useRef, useEffect } from 'react'
import Moveable from 'react-moveable'

interface TransformState {
  translate: [number, number]
  width: number
  height: number
  rotate: number
  /** Element's final left position after drag/resize */
  left: number
  /** Element's final top position after drag/resize */
  top: number
}

/** Live values emitted during drag/resize/rotate for real-time UI updates */
export interface LiveTransformValues {
  left: number
  top: number
  width: number
  height: number
  rotation: number
}

interface SelectionTransformBoxProps {
  /** The ref to the target DOM element Moveable should control */
  targetRef: React.RefObject<HTMLDivElement | null>
  /** Called continuously during drag/resize/rotate with delta values */
  onTransform?: (state: TransformState) => void
  /** Called when drag/resize/rotate ends */
  onTransformEnd?: (state: TransformState) => void
  /** Called continuously during any manipulation with live computed values */
  onLiveTransform?: (values: LiveTransformValues) => void
  /** Called when scale ends (for font-size-based resizing) with scale factor */
  onScaleEnd?: (scale: number) => void
  /** Canvas zoom level for correct handle sizing */
  zoom?: number
  /** Whether to keep aspect ratio while resizing */
  keepRatio?: boolean
  /** Color of the control box (applied via CSS) */
  color?: string
  /** Whether to allow resize from edges too (not just corners) */
  edge?: boolean
  /** Whether resizing is enabled (default true) */
  resizable?: boolean
  /** Use scalable instead of resizable (for text font-size resizing) */
  scalable?: boolean
}

export function SelectionTransformBox({
  targetRef,
  onTransform,
  onTransformEnd,
  onLiveTransform,
  onScaleEnd,
  zoom = 1,
  keepRatio = false,
  color: _color,
  edge = false,
  resizable: resizableEnabled = true,
  scalable: scalableEnabled = false,
}: SelectionTransformBoxProps) {
  const moveableRef = useRef<Moveable>(null)
  const lastScaleRef = useRef<[number, number]>([1, 1])

  // Keep Moveable in sync when the target moves/resizes externally (e.g. panel inputs)
  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    let rafId: number
    const sync = () => {
      rafId = requestAnimationFrame(() => moveableRef.current?.updateRect())
    }

    // Watch style attribute changes (left/top/width/height/transform)
    const mo = new MutationObserver(sync)
    mo.observe(el, { attributes: true, attributeFilter: ['style'] })

    // Watch size changes
    const ro = new ResizeObserver(sync)
    ro.observe(el)

    // Initial sync
    sync()

    return () => {
      cancelAnimationFrame(rafId)
      mo.disconnect()
      ro.disconnect()
    }
  }, [targetRef])

  // Proximity-scale: enlarge handles as cursor approaches them.
  // Modifies width/height directly — Moveable's translate(-50%,-50%) is percentage-based
  // so changing dimensions keeps handles centered on their anchor point.
  useEffect(() => {
    const PROXIMITY = 60
    const MAX_SCALE = 1.8
    let rafPending = false
    let lastX = 0
    let lastY = 0

    const applyProximity = () => {
      rafPending = false
      const controls = document.querySelectorAll<HTMLElement>(
        '.moveable-control-box .moveable-control, .moveable-control-box .moveable-rotation-control'
      )
      for (const ctrl of controls) {
        if (!ctrl.dataset.baseW) {
          ctrl.dataset.baseW = String(ctrl.offsetWidth)
          ctrl.dataset.baseH = String(ctrl.offsetHeight)
        }
        const baseW = parseInt(ctrl.dataset.baseW!)
        const baseH = parseInt(ctrl.dataset.baseH!)

        const rect = ctrl.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.hypot(lastX - cx, lastY - cy)

        let s = 1
        if (dist < PROXIMITY) {
          const t = 1 - dist / PROXIMITY
          s = 1 + t * (MAX_SCALE - 1)
        }

        const newW = Math.round(baseW * s)
        const newH = Math.round(baseH * s)
        ctrl.style.width = `${newW}px`
        ctrl.style.height = `${newH}px`
        ctrl.style.marginLeft = `${-newW / 2}px`
        ctrl.style.marginTop = `${-newH / 2}px`
        ctrl.style.transition = 'width 0.1s ease-out, height 0.1s ease-out, margin 0.1s ease-out'
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      if (!rafPending) {
        rafPending = true
        requestAnimationFrame(applyProximity)
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [])

  const getState = () => {
    const el = targetRef.current
    if (!el) return { translate: [0, 0] as [number, number], width: 0, height: 0, rotate: 0, left: 0, top: 0 }
    const rect = moveableRef.current?.getRect()
    return {
      translate: [0, 0] as [number, number],
      width: rect?.offsetWidth ?? el.offsetWidth,
      height: rect?.offsetHeight ?? el.offsetHeight,
      rotate: rect?.rotation ?? 0,
      left: parseFloat(el.style.left) || 0,
      top: parseFloat(el.style.top) || 0,
    }
  }

  return (
    <Moveable
      ref={moveableRef}
      target={targetRef}
      container={null}
      zoom={1 / zoom}
      origin={false}
      padding={{ left: 0, top: 0, right: 0, bottom: 0 }}

      /* ── Drag ── */
      draggable={true}
      throttleDrag={1}
      onDrag={({ target, left, top }) => {
        const el = target! as HTMLElement
        el.style.left = `${left}px`
        el.style.top = `${top}px`
        onLiveTransform?.({
          left,
          top,
          width: (el as HTMLElement).offsetWidth ?? 0,
          height: (el as HTMLElement).offsetHeight ?? 0,
          rotation: moveableRef.current?.getRect()?.rotation ?? 0,
        })
      }}
      onDragEnd={() => {
        onTransformEnd?.(getState())
      }}

      /* ── Resize (for non-text elements) ── */
      resizable={resizableEnabled && !scalableEnabled}
      keepRatio={keepRatio}
      throttleResize={1}
      edge={edge}
      renderDirections={scalableEnabled ? ['nw', 'ne', 'sw', 'se'] : ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
      onResize={({ target, width, height, drag }) => {
        target!.style.width = `${width}px`
        target!.style.height = `${height}px`
        target!.style.left = `${drag.left}px`
        target!.style.top = `${drag.top}px`
        const rotation = moveableRef.current?.getRect()?.rotation ?? 0
        onTransform?.({
          translate: [0, 0],
          width,
          height,
          rotate: rotation,
          left: drag.left,
          top: drag.top,
        })
        onLiveTransform?.({
          left: drag.left,
          top: drag.top,
          width,
          height,
          rotation,
        })
      }}
      onResizeEnd={() => {
        onTransformEnd?.(getState())
      }}

      /* ── Scale (for text font-size resizing — scale from center) ── */
      scalable={scalableEnabled}
      throttleScale={1}
      onScale={({ target, scale }) => {
        const s = scale as [number, number]
        lastScaleRef.current = s
        const uniformScale = (s[0] + s[1]) / 2
        const currentRotation = moveableRef.current?.getRect()?.rotation ?? 0
        // Scale from center — ignore drag.transform (which scales from corner)
        const el = target! as HTMLElement
        el.style.transformOrigin = 'center center'
        el.style.transform = currentRotation !== 0
          ? `rotate(${currentRotation}deg) scale(${uniformScale})`
          : `scale(${uniformScale})`
      }}
      onScaleEnd={({ target }) => {
        const s = lastScaleRef.current
        const uniformScale = (s[0] + s[1]) / 2

        if (uniformScale === 1) {
          onTransformEnd?.(getState())
          return
        }

        lastScaleRef.current = [1, 1]

        // Commit the new fontSize first (React state update)
        onScaleEnd?.(uniformScale)

        // Keep the CSS scale visible until React re-renders with new fontSize,
        // then strip it — prevents flicker between old fontSize + no scale
        requestAnimationFrame(() => {
          const currentRotation = moveableRef.current?.getRect()?.rotation ?? 0
          const el = target! as HTMLElement
          el.style.transform = currentRotation !== 0
            ? `rotate(${currentRotation}deg)`
            : ''
          requestAnimationFrame(() => {
            moveableRef.current?.updateRect()
          })
        })
      }}

      /* ── Rotate ── */
      rotatable={true}
      throttleRotate={1}
      onRotate={({ target, drag, rotation }) => {
        target!.style.transform = drag.transform
        const el = target! as HTMLElement
        onLiveTransform?.({
          left: parseFloat(el.style.left) || 0,
          top: parseFloat(el.style.top) || 0,
          width: el.offsetWidth,
          height: el.offsetHeight,
          rotation,
        })
      }}
      onRotateEnd={() => {
        onTransformEnd?.(getState())
      }}

      /* ── Style ── */
      className="moveable-control-box"
    />
  )
}
