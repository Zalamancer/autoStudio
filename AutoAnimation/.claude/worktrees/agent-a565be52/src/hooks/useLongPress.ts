import { useRef, useCallback } from 'react'

/**
 * Returns onTouchStart / onTouchEnd handlers that fire `callback`
 * after the user holds their finger for `delay` ms.
 * If the finger moves more than 10px or is lifted early, the press is cancelled.
 */
export function useLongPress(callback: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const firedRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      firedRef.current = false
      const touch = e.touches[0]
      startPos.current = { x: touch.clientX, y: touch.clientY }

      timerRef.current = setTimeout(() => {
        firedRef.current = true
        callback()
      }, delay)
    },
    [callback, delay]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      const dx = touch.clientX - startPos.current.x
      const dy = touch.clientY - startPos.current.y
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        clear()
      }
    },
    [clear]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clear()
      // Prevent click/contextmenu if long press fired
      if (firedRef.current) {
        e.preventDefault()
      }
    },
    [clear]
  )

  return { onTouchStart, onTouchMove, onTouchEnd }
}
