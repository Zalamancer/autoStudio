import { useEffect, useRef, useState, useCallback } from 'react'
import type { Application } from 'pixi.js'
import { getPixiApp, resizePixiApp } from './PixiApp'

interface UsePixiAppOptions {
  width: number
  height: number
}

/**
 * React hook that initializes the PixiJS Application, mounts its <canvas>
 * into the given container ref, and handles resize/cleanup.
 *
 * Returns:
 * - `containerRef`: attach to a <div> to receive the PixiJS canvas
 * - `app`: the Application instance (null until initialized)
 * - `ready`: true once the app is initialized
 */
export function usePixiApp({ width, height }: UsePixiAppOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [app, setApp] = useState<Application | null>(null)
  const [ready, setReady] = useState(false)
  const mountedRef = useRef(false)

  // Initialize the app and mount its canvas
  useEffect(() => {
    let cancelled = false

    async function init() {
      const pixiApp = await getPixiApp(width, height)
      if (cancelled) return

      setApp(pixiApp)
      setReady(true)

      // Mount the canvas element into the container
      const container = containerRef.current
      if (container && pixiApp.canvas) {
        // Avoid double-mounting
        if (!container.contains(pixiApp.canvas as HTMLCanvasElement)) {
          container.appendChild(pixiApp.canvas as HTMLCanvasElement)
        }
        mountedRef.current = true
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle resize when width/height change
  useEffect(() => {
    if (ready) {
      resizePixiApp(width, height)
    }
  }, [width, height, ready])

  // Cleanup on unmount: remove canvas from DOM but don't destroy the singleton
  // (other components may still need it)
  useEffect(() => {
    return () => {
      if (mountedRef.current && containerRef.current && app?.canvas) {
        const canvas = app.canvas as HTMLCanvasElement
        if (containerRef.current.contains(canvas)) {
          containerRef.current.removeChild(canvas)
        }
        mountedRef.current = false
      }
    }
  }, [app])

  // Manual start/stop for the ticker
  const startTicker = useCallback(() => {
    if (app) {
      app.ticker.start()
    }
  }, [app])

  const stopTicker = useCallback(() => {
    if (app) {
      app.ticker.stop()
    }
  }, [app])

  return { containerRef, app, ready, startTicker, stopTicker }
}
