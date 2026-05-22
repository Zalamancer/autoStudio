import { Application, Container } from 'pixi.js'

let app: Application | null = null
let initPromise: Promise<Application> | null = null

/**
 * Creates or returns the singleton PixiJS Application.
 * Must be called after the DOM is ready (inside useEffect or similar).
 * The Application uses WebGL2 with a transparent background so DOM layers
 * underneath (grid, background Lottie) show through.
 */
export async function getPixiApp(width: number, height: number): Promise<Application> {
  if (app) return app

  if (initPromise) return initPromise

  initPromise = (async () => {
    const pixiApp = new Application()
    await pixiApp.init({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      // Prefer WebGL2, fall back to WebGL1
      preference: 'webgl',
      powerPreference: 'high-performance',
    })

    // Disable the default ticker auto-start — we'll drive rendering ourselves
    pixiApp.ticker.autoStart = false
    pixiApp.ticker.maxFPS = 0 // Uncap: run as fast as requestAnimationFrame allows
    pixiApp.ticker.stop()

    app = pixiApp
    initPromise = null
    return pixiApp
  })()

  return initPromise
}

/**
 * Returns the current app instance synchronously (null if not yet initialized).
 */
export function getPixiAppSync(): Application | null {
  return app
}

/**
 * Resizes the PixiJS renderer to match new canvas dimensions.
 */
export function resizePixiApp(width: number, height: number) {
  if (!app) return
  app.renderer.resize(width, height)
}

/**
 * Destroys the singleton app (for cleanup on unmount).
 */
export function destroyPixiApp() {
  if (app) {
    app.destroy(true, { children: true, texture: true })
    app = null
    initPromise = null
  }
}

/**
 * Returns the main stage container. All PixiJS layers add children to this.
 */
export function getPixiStage(): Container | null {
  return app?.stage ?? null
}
