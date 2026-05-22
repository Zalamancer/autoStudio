/**
 * Live Avatar Streaming Service
 *
 * Captures the ProAnimate canvas as a real-time video stream for use in
 * video conferencing tools (Zoom, Meet, Teams) or live streaming (OBS, Twitch).
 *
 * Two approaches:
 * 1. Browser-only: canvas.captureStream() -> MediaStream for Screen Share or OBS Browser Source
 * 2. WebRTC: Peer connection for remote streaming
 *
 * The service manages the render loop, stream lifecycle, and performance stats.
 */

import type {
  LiveAvatarSettings,
  LiveStreamStatus,
  LiveStreamStats,
  StreamQualityConfig,
} from '@/types/liveAvatar'
import {
  STREAM_QUALITY_CONFIGS,
  DEFAULT_LIVE_AVATAR_SETTINGS,
} from '@/types/liveAvatar'

type StatusCallback = (status: LiveStreamStatus) => void
type StatsCallback = (stats: LiveStreamStats) => void

class LiveAvatarStreamService {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private stream: MediaStream | null = null
  private rafId: number = 0
  private isRunning = false
  private settings: LiveAvatarSettings = { ...DEFAULT_LIVE_AVATAR_SETTINGS }

  // Performance tracking
  private frameCount = 0
  private droppedFrames = 0
  private startTime = 0
  private frameTimes: number[] = []
  private lastFrameTime = 0

  // Callbacks
  private onStatusChange: StatusCallback | null = null
  private onStatsUpdate: StatsCallback | null = null

  // Source canvas reference (VideoCanvas)
  private sourceCanvas: HTMLCanvasElement | null = null

  // Background image cache
  private bgImage: HTMLImageElement | null = null

  /**
   * Initialize the streaming service.
   *
   * @param sourceCanvas - The main VideoCanvas element to capture from
   * @param settings - Stream settings
   * @param onStatusChange - Status change callback
   * @param onStatsUpdate - Stats update callback (called every second)
   */
  init(
    sourceCanvas: HTMLCanvasElement,
    settings: LiveAvatarSettings,
    onStatusChange: StatusCallback,
    onStatsUpdate: StatsCallback,
  ): void {
    this.sourceCanvas = sourceCanvas
    this.settings = { ...settings }
    this.onStatusChange = onStatusChange
    this.onStatsUpdate = onStatsUpdate

    // Create output canvas at the configured resolution
    const config = this.getQualityConfig()
    this.canvas = document.createElement('canvas')
    this.canvas.width = settings.customDimensions?.width ?? config.width
    this.canvas.height = settings.customDimensions?.height ?? config.height
    this.ctx = this.canvas.getContext('2d', { alpha: true })!

    this.onStatusChange?.('initializing')
  }

  /**
   * Start streaming.
   * Creates a MediaStream from the output canvas.
   */
  start(): MediaStream | null {
    if (!this.canvas || !this.ctx || !this.sourceCanvas) {
      this.onStatusChange?.('error')
      return null
    }

    const config = this.getQualityConfig()

    // Create MediaStream from output canvas
    this.stream = this.canvas.captureStream(config.fps)

    // Reset stats
    this.frameCount = 0
    this.droppedFrames = 0
    this.startTime = performance.now()
    this.frameTimes = []
    this.lastFrameTime = performance.now()

    // Start render loop
    this.isRunning = true
    this.renderLoop()

    // Start stats reporting
    this.startStatsReporting()

    this.onStatusChange?.('streaming')

    return this.stream
  }

  /**
   * Pause the stream (keeps resources allocated).
   */
  pause(): void {
    this.isRunning = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    this.onStatusChange?.('paused')
  }

  /**
   * Resume a paused stream.
   */
  resume(): void {
    if (!this.canvas || !this.ctx) return
    this.isRunning = true
    this.renderLoop()
    this.onStatusChange?.('streaming')
  }

  /**
   * Stop streaming and release all resources.
   */
  stop(): void {
    this.isRunning = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }

    // Stop all tracks on the stream
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }

    this.canvas = null
    this.ctx = null
    this.sourceCanvas = null
    this.bgImage = null
    this.onStatusChange?.('idle')
    this.onStatusChange = null
    this.onStatsUpdate = null
  }

  /**
   * Update stream settings (can be called while streaming).
   */
  updateSettings(partial: Partial<LiveAvatarSettings>): void {
    Object.assign(this.settings, partial)

    // If quality changed, resize the output canvas
    if (partial.quality || partial.customDimensions) {
      const config = this.getQualityConfig()
      if (this.canvas) {
        this.canvas.width = this.settings.customDimensions?.width ?? config.width
        this.canvas.height = this.settings.customDimensions?.height ?? config.height
      }
    }

    // Pre-load background image if needed
    if (partial.background && partial.background.type === 'image') {
      const img = new Image()
      img.onload = () => { this.bgImage = img }
      img.src = partial.background.src
    }
  }

  /**
   * Get the current MediaStream.
   */
  getStream(): MediaStream | null {
    return this.stream
  }

  /**
   * Get the output canvas element (for rendering in preview).
   */
  getOutputCanvas(): HTMLCanvasElement | null {
    return this.canvas
  }

  /**
   * Get a snapshot of current stats.
   */
  getStats(): LiveStreamStats {
    const uptime = (performance.now() - this.startTime) / 1000
    const avgRenderTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0

    // Estimate FPS from recent frame times
    const recentFrames = this.frameTimes.slice(-30)
    const fps = recentFrames.length > 1
      ? 1000 / (recentFrames.reduce((a, b) => a + b, 0) / recentFrames.length)
      : 0

    return {
      fps: Math.round(fps * 10) / 10,
      uptime: Math.round(uptime),
      droppedFrames: this.droppedFrames,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      bitrate: this.getQualityConfig().bitrate,
    }
  }

  // ── Private ──────────────────────────────────────────────────────────

  private getQualityConfig(): StreamQualityConfig {
    return STREAM_QUALITY_CONFIGS[this.settings.quality]
  }

  private renderLoop = (): void => {
    if (!this.isRunning) return

    const now = performance.now()
    const config = this.getQualityConfig()
    const targetInterval = 1000 / config.fps

    // Frame rate limiting
    const elapsed = now - this.lastFrameTime
    if (elapsed < targetInterval * 0.8) {
      this.rafId = requestAnimationFrame(this.renderLoop)
      return
    }

    const renderStart = performance.now()

    try {
      this.renderFrame()
      this.frameCount++
    } catch {
      this.droppedFrames++
    }

    const renderTime = performance.now() - renderStart
    this.frameTimes.push(renderTime)

    // Keep only last 60 frame times
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift()
    }

    // Check if frame was dropped (took too long)
    if (renderTime > targetInterval) {
      this.droppedFrames++
    }

    this.lastFrameTime = now
    this.rafId = requestAnimationFrame(this.renderLoop)
  }

  private renderFrame(): void {
    if (!this.ctx || !this.canvas || !this.sourceCanvas) return

    const w = this.canvas.width
    const h = this.canvas.height

    // Clear canvas
    this.ctx.clearRect(0, 0, w, h)

    // Draw background
    this.drawBackground(w, h)

    // Draw source canvas (the ProAnimate VideoCanvas) scaled to output
    if (this.settings.mirrorOutput) {
      this.ctx.save()
      this.ctx.scale(-1, 1)
      this.ctx.drawImage(this.sourceCanvas, -w, 0, w, h)
      this.ctx.restore()
    } else {
      this.ctx.drawImage(this.sourceCanvas, 0, 0, w, h)
    }
  }

  private drawBackground(w: number, h: number): void {
    if (!this.ctx) return

    const bg = this.settings.background
    switch (bg.type) {
      case 'solid':
        this.ctx.fillStyle = bg.color
        this.ctx.fillRect(0, 0, w, h)
        break
      case 'image':
        if (this.bgImage) {
          this.ctx.drawImage(this.bgImage, 0, 0, w, h)
        }
        break
      case 'transparent':
        // Leave transparent (for compositing in OBS etc.)
        break
      case 'blur':
        // Blur background: draw source canvas with filter
        if (this.sourceCanvas) {
          this.ctx.save()
          this.ctx.filter = `blur(${bg.strength}px)`
          this.ctx.drawImage(this.sourceCanvas, 0, 0, w, h)
          this.ctx.restore()
        }
        break
      case 'scene':
        // Use the full scene as background (no special handling needed)
        break
    }
  }

  private startStatsReporting(): void {
    const reportInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(reportInterval)
        return
      }
      this.onStatsUpdate?.(this.getStats())
    }, 1000)
  }
}

// Singleton instance
export const liveAvatarStream = new LiveAvatarStreamService()
