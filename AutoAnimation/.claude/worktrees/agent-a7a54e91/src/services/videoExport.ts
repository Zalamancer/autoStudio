/**
 * High-performance browser-based video export service.
 *
 * Two rendering paths:
 * 1. **WebCodecs + mp4-muxer** (Chrome/Safari) — hardware-accelerated H.264
 *    encoding, non-realtime (frames submitted as fast as they render).
 * 2. **MediaRecorder fallback** (Firefox/old browsers) — still uses Canvas2D
 *    renderer (not html2canvas) so per-frame cost is ~2-5ms instead of ~200ms.
 *
 * Both paths use the Canvas2D renderer (canvas2dRenderer.ts) which draws each
 * composition layer directly to an offscreen <canvas> — no DOM capture needed.
 */

import type { VideoCompositionProps } from '@/remotion/types'
import {
  preloadImages,
  preloadLottieAnimations,
  preloadVideoElements,
  preloadThreeScene,
  preloadHTMLTemplates,
  preloadRiggedCharacters,
  preloadMotionGraphics,
  disposeThreeScene,
  disposeHTMLTemplates,
  disposeMotionGraphics,
  renderFrame,
  buildKeyframeIndex,
  resetTimelineCaches,
  type RenderContext,
} from './canvas2dRenderer'
import { PixiExportRenderer, isWebGL2Supported } from './pixiExportRenderer'
import { mixTracks, type AudioTrackSource } from './audioMixer'
import { exportAsGif } from './gifExport'
import type { GifExportSettings } from '@/types/gifExport'

// ── Public types ──────────────────────────────────────────────────────

export interface ExportOptions {
  width: number
  height: number
  fps: number
  durationInFrames: number
  format: 'webm' | 'mp4' | 'gif' | 'webm-alpha' | 'png-sequence'
  quality: number // 0.0 - 1.0
  /** Starting frame for partial export (default: 0) */
  startFrame?: number
  /** Whether to export with alpha/transparency */
  alpha?: boolean
  /** GIF-specific settings */
  gifSettings?: {
    frameSkip?: number
    maxWidth?: number
    dithering?: boolean
    loop?: boolean
  }
}

export interface ExportResult {
  url: string
  /** The actual format used (may differ from requested if MP4 not supported) */
  actualFormat: 'webm' | 'mp4' | 'gif'
  /** True if the requested format was not supported and a fallback was used */
  didFallback: boolean
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error'
  currentFrame: number
  totalFrames: number
  percentage: number
  estimatedTimeRemaining: number // seconds
  error?: string
  outputUrl?: string // blob URL of the final video
  outputSize?: number // bytes
  /** The actual format used for the export */
  actualFormat?: 'webm' | 'mp4' | 'gif'
  /** True if the requested format was not supported and a fallback was used */
  didFallback?: boolean
}

export type ExportProgressCallback = (progress: ExportProgress) => void

// ── Feature detection ─────────────────────────────────────────────────

/** Check if WebCodecs VideoEncoder is available (Chrome 94+, Safari 16.4+) */
export function isWebCodecsSupported(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
}

/** Check if the browser natively supports recording to MP4 via MediaRecorder. */
export function isMp4Supported(): boolean {
  // WebCodecs path always supports MP4 via mp4-muxer
  if (isWebCodecsSupported()) return true
  return (
    typeof MediaRecorder !== 'undefined' &&
    (MediaRecorder.isTypeSupported('video/mp4') ||
      MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ||
      MediaRecorder.isTypeSupported('video/mp4;codecs=h264'))
  )
}

/** Get the file extension for the actual output format. */
export function getFileExtension(format: 'webm' | 'mp4' | 'gif' | 'webm-alpha' | 'png-sequence'): string {
  if (format === 'mp4') return 'mp4'
  if (format === 'gif') return 'gif'
  if (format === 'png-sequence') return 'zip'
  return 'webm'
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Main export function ──────────────────────────────────────────────

/**
 * Export video using Canvas2D rendering + WebCodecs (or MediaRecorder fallback).
 *
 * @param props - Serialized composition data (from useCompositionProps())
 * @param options - Export settings (resolution, fps, format, quality, etc.)
 * @param onProgress - Callback for progress updates
 * @param signal - AbortSignal for cancellation
 */
export async function exportVideo(
  props: VideoCompositionProps,
  options: ExportOptions,
  onProgress: ExportProgressCallback,
  signal?: AbortSignal,
): Promise<ExportResult> {
  const { width, height, fps, durationInFrames, format, quality } = options
  const startFrame = options.startFrame ?? 0
  const totalFrames = durationInFrames - startFrame

  // ── Preparation phase ──
  onProgress({
    status: 'preparing',
    currentFrame: 0,
    totalFrames,
    percentage: 0,
    estimatedTimeRemaining: 0,
  })

  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

  // Pre-load all assets in parallel
  const [imageCache, lottieInstances, videoElements, threeInstance, templateInstances, rigInstances, mgInstances] =
    await Promise.all([
      preloadImages(props),
      preloadLottieAnimations(props),
      preloadVideoElements(props),
      preloadThreeScene(props),
      preloadHTMLTemplates(props),
      preloadRiggedCharacters(props),
      preloadMotionGraphics(props),
    ])

  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

  // Build pre-indexed keyframe lookup and reset sequential caches
  const keyframeIndex = buildKeyframeIndex(props.keyframeData)
  resetTimelineCaches()

  const renderCtx: RenderContext = {
    imageCache,
    lottieInstances,
    videoElements,
    threeInstance,
    templateInstances,
    rigInstances,
    mgInstances,
    keyframeIndex,
  }

  // Create offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // ── Choose encoding path ──
  try {
    // GIF format uses a dedicated encoder (gifenc) instead of video codecs
    if (format === 'gif') {
      const gifSettings: GifExportSettings = {
        frameSkip: (options.gifSettings?.frameSkip ?? 2) as 1 | 2 | 3,
        maxWidth: options.gifSettings?.maxWidth ?? 480,
        dithering: options.gifSettings?.dithering ?? false,
        loop: options.gifSettings?.loop ?? true,
      }
      const { url } = await exportAsGif(
        canvas,
        ctx,
        props,
        renderCtx,
        { width, height, fps, totalFrames, startFrame, quality, gifSettings },
        onProgress,
        signal,
      )
      return { url, actualFormat: 'gif' as const, didFallback: false }
    }

    if (isWebCodecsSupported()) {
      return await exportWithWebCodecs(
        canvas,
        ctx,
        props,
        renderCtx,
        {
          width,
          height,
          fps,
          totalFrames,
          startFrame,
          format,
          quality,
        },
        onProgress,
        signal,
      )
    } else {
      return await exportWithMediaRecorder(
        canvas,
        ctx,
        props,
        renderCtx,
        {
          width,
          height,
          fps,
          totalFrames,
          startFrame,
          format,
          quality,
        },
        onProgress,
        signal,
      )
    }
  } finally {
    // Clean up Three.js resources
    disposeThreeScene(threeInstance)
    // Clean up HTML template iframes
    disposeHTMLTemplates(templateInstances)
    // Clean up React motion graphic containers
    disposeMotionGraphics(mgInstances)
  }
}

// ── Audio mixing ──────────────────────────────────────────────────────

/**
 * Collect all audio sources from the composition props.
 * Returns typed AudioTrackSource array for the multi-track mixer.
 */
function collectAudioSources(props: VideoCompositionProps, fps: number): AudioTrackSource[] {
  const sources: AudioTrackSource[] = []

  // Single character audio
  if (props.audioUrl && (!props.dialogueCharacters || props.dialogueCharacters.length === 0)) {
    sources.push({ url: props.audioUrl, startTimeSec: 0, type: 'dialogue' })
  }

  // Dialogue character audio (multiple audio files at specific time offsets)
  if (props.dialogueCharacters) {
    for (const dc of props.dialogueCharacters) {
      for (const line of dc.dialogueLines) {
        if (line.audioUrl) {
          sources.push({
            url: line.audioUrl,
            startTimeSec: line.startFrame / fps,
            type: 'dialogue',
          })
        }
      }
    }
  }

  // Background audio (music from useMediaStore)
  if (props.backgroundAudio) {
    for (const bg of props.backgroundAudio) {
      sources.push({
        url: bg.url,
        startTimeSec: bg.startFrame / fps,
        type: 'music',
        volume: bg.volume ?? 0.4,
      })
    }
  }

  return sources
}

/**
 * Mix all audio sources into a single AudioBuffer using the multi-track
 * mixer with per-track volume and auto-ducking of music under dialogue.
 * Returns null if no audio sources or mixing fails.
 */
async function mixAudioBuffer(
  props: VideoCompositionProps,
  fps: number,
  totalDurationSec: number,
): Promise<AudioBuffer | null> {
  const sources = collectAudioSources(props, fps)
  if (sources.length === 0) return null

  try {
    return await mixTracks(sources, totalDurationSec)
  } catch (err) {
    console.warn('[videoExport] Audio mixing failed:', err)
    return null
  }
}

// (Legacy combineVideoAndAudio and mixAudio removed — audio is now encoded
//  directly into the muxer via WebCodecs AudioEncoder, eliminating the
//  real-time re-encoding bottleneck.)

// ── WebCodecs path (fast, hardware-accelerated) ───────────────────────

interface InternalExportOpts {
  width: number
  height: number
  fps: number
  totalFrames: number
  startFrame: number
  format: 'webm' | 'mp4' | 'gif' | 'webm-alpha' | 'png-sequence'
  quality: number
}

async function exportWithWebCodecs(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  renderCtx: RenderContext,
  opts: InternalExportOpts,
  onProgress: ExportProgressCallback,
  signal?: AbortSignal,
): Promise<ExportResult> {
  const { width, height, fps, totalFrames, startFrame, format, quality } = opts

  // Higher bitrate multiplier for better quality output
  // For MP4/H.264: ~0.15 gives crisp results; for WebM/VP8: ~0.12
  const useMP4 = format === 'mp4'
  const bitrateMultiplier = useMP4 ? 0.15 : 0.12
  const bitrate = Math.round(width * height * fps * quality * bitrateMultiplier)

  // ── Mix audio upfront (non-realtime, fast) ──
  const totalDurationSec = totalFrames / fps
  const mixedAudio = await mixAudioBuffer(props, fps, totalDurationSec)
  const hasAudio = !!mixedAudio
  const audioSampleRate = mixedAudio?.sampleRate ?? 48000
  const audioChannels = mixedAudio?.numberOfChannels ?? 2

  // ── Dynamically import the muxer (with audio track if needed) ──
  interface MuxerWrapper {
    addVideoChunk: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void
    addAudioChunk: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => void
    finalize: () => void
    target: { buffer: ArrayBuffer }
  }
  let muxer: MuxerWrapper

  if (useMP4) {
    const { Muxer, ArrayBufferTarget } = await import('mp4-muxer')
    const mp4Muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width, height },
      ...(hasAudio ? { audio: { codec: 'aac', numberOfChannels: audioChannels, sampleRate: audioSampleRate } } : {}),
      fastStart: 'in-memory',
    })
    muxer = {
      addVideoChunk: (chunk, meta) => mp4Muxer.addVideoChunk(chunk, meta),
      addAudioChunk: (chunk, meta) => mp4Muxer.addAudioChunk(chunk, meta),
      finalize: () => mp4Muxer.finalize(),
      get target() {
        return { buffer: (mp4Muxer.target as { buffer: ArrayBuffer }).buffer }
      },
    }
  } else {
    const { Muxer, ArrayBufferTarget } = await import('webm-muxer')
    const webmMuxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'V_VP8', width, height },
      ...(hasAudio ? { audio: { codec: 'A_OPUS', numberOfChannels: audioChannels, sampleRate: audioSampleRate } } : {}),
    })
    muxer = {
      addVideoChunk: (chunk, meta) => webmMuxer.addVideoChunk(chunk, meta),
      addAudioChunk: (chunk, meta) => webmMuxer.addAudioChunk(chunk, meta),
      finalize: () => webmMuxer.finalize(),
      get target() {
        return { buffer: (webmMuxer.target as { buffer: ArrayBuffer }).buffer }
      },
    }
  }

  // ── Configure the video encoder ──
  const codec = useMP4 ? 'avc1.640028' : 'vp8'

  const isEncoderClosed = (enc: VideoEncoder): boolean => (enc.state as string) === 'closed'

  const safeCloseEncoder = (enc: VideoEncoder) => {
    try {
      if (!isEncoderClosed(enc)) enc.close()
    } catch {
      /* Already closed */
    }
  }

  // Track encoder errors so the render loop can abort
  let encoderError: Error | null = null

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      console.error('[videoExport] Video encoder error:', e)
      encoderError = e instanceof Error ? e : new Error(String(e))
    },
  })

  videoEncoder.configure({
    codec,
    width,
    height,
    bitrate,
    bitrateMode: 'variable',
  })

  // ── Encode audio directly into muxer (non-realtime, instant) ──
  if (hasAudio && mixedAudio) {
    const audioCodec = useMP4 ? 'mp4a.40.2' : 'opus'
    const audioBitrate = 128_000

    // Collect all audio chunks, then add to muxer
    const audioChunks: { chunk: EncodedAudioChunk; meta?: EncodedAudioChunkMetadata }[] = []

    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => audioChunks.push({ chunk, meta }),
      error: (e) => console.error('[videoExport] Audio encoder error:', e),
    })

    audioEncoder.configure({
      codec: audioCodec,
      numberOfChannels: audioChannels,
      sampleRate: audioSampleRate,
      bitrate: audioBitrate,
    })

    // Feed the mixed AudioBuffer in chunks (1024 samples per chunk for AAC, 960 for Opus)
    const samplesPerChunk = useMP4 ? 1024 : 960
    const totalSamples = mixedAudio.length
    const channelData: Float32Array[] = []
    for (let ch = 0; ch < audioChannels; ch++) {
      channelData.push(mixedAudio.getChannelData(ch))
    }

    for (let offset = 0; offset < totalSamples; offset += samplesPerChunk) {
      const chunkSamples = Math.min(samplesPerChunk, totalSamples - offset)
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: audioSampleRate,
        numberOfFrames: chunkSamples,
        numberOfChannels: audioChannels,
        timestamp: Math.round((offset / audioSampleRate) * 1_000_000), // microseconds
        data: (() => {
          // Interleave channel data into a single buffer for AudioData
          const buf = new Float32Array(chunkSamples * audioChannels)
          for (let ch = 0; ch < audioChannels; ch++) {
            buf.set(channelData[ch].subarray(offset, offset + chunkSamples), ch * chunkSamples)
          }
          return buf
        })(),
      })
      audioEncoder.encode(audioData)
      audioData.close()
    }

    await audioEncoder.flush()
    audioEncoder.close()

    // Add all encoded audio chunks to the muxer
    for (const { chunk, meta } of audioChunks) {
      muxer.addAudioChunk(chunk, meta)
    }
  }

  // ── Compute scale factor for non-1080p export resolutions ──
  const scaleX = width / props.width
  const scaleY = height / props.height
  const needsScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001

  // ── Initialize GPU renderer if WebGL2 is available ──
  let gpuRenderer: PixiExportRenderer | null = null
  let renderCanvas: HTMLCanvasElement = canvas

  if (isWebGL2Supported()) {
    try {
      gpuRenderer = new PixiExportRenderer(width, height, props.width, props.height)
      await gpuRenderer.init()
      await gpuRenderer.preload(props, renderCtx.imageCache)
      if (renderCtx.keyframeIndex) {
        gpuRenderer.setKeyframeIndex(renderCtx.keyframeIndex)
      }
      renderCanvas = gpuRenderer.canvas
      console.log('[videoExport] Using GPU-accelerated PixiJS renderer')
    } catch (err) {
      console.warn('[videoExport] GPU renderer init failed, falling back to Canvas2D:', err)
      gpuRenderer = null
      renderCanvas = canvas
    }
  }

  // ── Video render loop ──
  onProgress({
    status: 'rendering',
    currentFrame: 0,
    totalFrames,
    percentage: 0,
    estimatedTimeRemaining: totalFrames / fps,
  })

  const renderStart = Date.now()

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')
      if (encoderError) throw encoderError
      if (isEncoderClosed(videoEncoder)) throw new Error('Encoder was closed unexpectedly')

      // Render frame using GPU or Canvas2D
      if (gpuRenderer) {
        await gpuRenderer.renderFrame(
          props,
          startFrame + i,
          renderCtx.lottieInstances,
          renderCtx.videoElements,
          renderCtx.threeInstance,
          renderCtx.templateInstances,
          renderCtx.rigInstances,
        )
      } else {
        if (needsScale) {
          ctx.save()
          ctx.scale(scaleX, scaleY)
        }
        await renderFrame(ctx, props, startFrame + i, renderCtx)
        if (needsScale) {
          ctx.restore()
        }
      }

      if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

      // Create VideoFrame from the render canvas
      const frame = new VideoFrame(renderCanvas, {
        timestamp: (i * 1_000_000) / fps,
        duration: 1_000_000 / fps,
      })

      // Encode (keyframe every 2 seconds)
      const keyFrame = i % (fps * 2) === 0
      videoEncoder.encode(frame, { keyFrame })
      frame.close()

      // Backpressure: wait if encoder queue is full
      if (!isEncoderClosed(videoEncoder) && videoEncoder.encodeQueueSize > 8) {
        await new Promise<void>((resolve) => {
          const check = () => {
            if (signal?.aborted || isEncoderClosed(videoEncoder) || videoEncoder.encodeQueueSize <= 4) {
              resolve()
            } else {
              setTimeout(check, 1)
            }
          }
          check()
        })
      }

      // Update progress every 10 frames
      if (i % 10 === 0 || i === totalFrames - 1) {
        const elapsed = (Date.now() - renderStart) / 1000
        const framesPerSecond = (i + 1) / Math.max(elapsed, 0.01)
        const remaining = (totalFrames - i - 1) / Math.max(framesPerSecond, 0.1)

        onProgress({
          status: 'rendering',
          currentFrame: i + 1,
          totalFrames,
          percentage: Math.round(((i + 1) / totalFrames) * 100),
          estimatedTimeRemaining: Math.round(remaining),
        })
      }

      // Yield to UI thread less frequently
      if (i % 60 === 0) {
        await new Promise((r) => setTimeout(r, 0))
      }
    }

    // ── Finalize ──
    onProgress({
      status: 'encoding',
      currentFrame: totalFrames,
      totalFrames,
      percentage: 99,
      estimatedTimeRemaining: 1,
    })

    if (!isEncoderClosed(videoEncoder)) {
      await videoEncoder.flush()
    }
  } finally {
    safeCloseEncoder(videoEncoder)
    // Dispose GPU renderer
    if (gpuRenderer) {
      gpuRenderer.dispose()
    }
  }

  muxer.finalize()

  const mimeType = useMP4 ? 'video/mp4' : 'video/webm'
  const blob = new Blob([muxer.target.buffer], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const actualFormat = useMP4 ? ('mp4' as const) : ('webm' as const)

  onProgress({
    status: 'complete',
    currentFrame: totalFrames,
    totalFrames,
    percentage: 100,
    estimatedTimeRemaining: 0,
    outputUrl: url,
    outputSize: blob.size,
    actualFormat,
    didFallback: false,
  })

  return { url, actualFormat, didFallback: false }
}

// ── MediaRecorder fallback (Firefox / old browsers) ───────────────────

async function exportWithMediaRecorder(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  renderCtx: RenderContext,
  opts: InternalExportOpts,
  onProgress: ExportProgressCallback,
  signal?: AbortSignal,
): Promise<ExportResult> {
  const { width, height, fps, totalFrames, startFrame, format, quality } = opts

  // Compute scale factor for non-1080p export resolutions
  const scaleX = width / props.width
  const scaleY = height / props.height
  const needsScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001

  // Resolve MediaRecorder MIME type
  const { mimeType, actualFormat, didFallback } = resolveMediaRecorderMime(format)

  const stream = canvas.captureStream(0) // 0 = manual frame capture

  // ── Mix audio and add to the stream (mirrors WebCodecs audio path) ──
  const totalDurationSec = totalFrames / fps
  const mixedAudio = await mixAudioBuffer(props, fps, totalDurationSec)
  let audioCtx: AudioContext | null = null
  let audioSource: AudioBufferSourceNode | null = null

  if (mixedAudio) {
    try {
      audioCtx = new AudioContext({ sampleRate: mixedAudio.sampleRate })
      const dest = audioCtx.createMediaStreamDestination()
      audioSource = audioCtx.createBufferSource()
      audioSource.buffer = mixedAudio
      audioSource.connect(dest)
      // Add audio track(s) to the combined stream
      for (const track of dest.stream.getAudioTracks()) {
        stream.addTrack(track)
      }
      // Start playback — will be synced with the frame render loop
      audioSource.start(0)
    } catch (err) {
      console.warn('[videoExport] MediaRecorder audio setup failed:', err)
      audioCtx = null
      audioSource = null
    }
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: Math.round(width * height * fps * quality * 0.1),
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  return new Promise<ExportResult>((resolve, reject) => {
    const cleanupAudio = () => {
      try {
        audioSource?.stop()
      } catch {
        /* already stopped */
      }
      try {
        audioCtx?.close()
      } catch {
        /* already closed */
      }
    }

    recorder.onstop = () => {
      cleanupAudio()
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)

      onProgress({
        status: 'complete',
        currentFrame: totalFrames,
        totalFrames,
        percentage: 100,
        estimatedTimeRemaining: 0,
        outputUrl: url,
        outputSize: blob.size,
        actualFormat,
        didFallback,
      })

      resolve({ url, actualFormat, didFallback })
    }

    recorder.onerror = () => {
      cleanupAudio()
      onProgress({
        status: 'error',
        currentFrame: 0,
        totalFrames,
        percentage: 0,
        estimatedTimeRemaining: 0,
        error: 'Recording failed',
      })
      reject(new Error('MediaRecorder error'))
    }

    recorder.start()

    onProgress({
      status: 'rendering',
      currentFrame: 0,
      totalFrames,
      percentage: 0,
      estimatedTimeRemaining: totalFrames / fps,
    })

    const renderStart = Date.now()

    const processFrame = async (frameIndex: number) => {
      if (signal?.aborted) {
        recorder.stop()
        reject(new DOMException('Export cancelled', 'AbortError'))
        return
      }

      if (frameIndex >= totalFrames) {
        onProgress({
          status: 'encoding',
          currentFrame: totalFrames,
          totalFrames,
          percentage: 99,
          estimatedTimeRemaining: 1,
        })
        recorder.stop()
        return
      }

      // Render frame to canvas (async for HTML template capture)
      if (needsScale) {
        ctx.save()
        ctx.scale(scaleX, scaleY)
      }
      await renderFrame(ctx, props, startFrame + frameIndex, renderCtx)
      if (needsScale) {
        ctx.restore()
      }

      // Request a frame from the stream
      const videoTrack = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }
      if (videoTrack?.requestFrame) {
        videoTrack.requestFrame()
      }

      // Update progress
      const elapsed = (Date.now() - renderStart) / 1000
      const framesPerSecond = (frameIndex + 1) / Math.max(elapsed, 0.01)
      const remaining = (totalFrames - frameIndex - 1) / Math.max(framesPerSecond, 0.1)

      onProgress({
        status: 'rendering',
        currentFrame: frameIndex + 1,
        totalFrames,
        percentage: Math.round(((frameIndex + 1) / totalFrames) * 100),
        estimatedTimeRemaining: Math.round(remaining),
      })

      // Schedule next frame (yield to UI)
      setTimeout(() => processFrame(frameIndex + 1), 0)
    }

    processFrame(0)
  })
}

function resolveMediaRecorderMime(format: 'webm' | 'mp4' | 'gif' | 'webm-alpha' | 'png-sequence'): {
  mimeType: string
  actualFormat: 'webm' | 'mp4' | 'gif'
  didFallback: boolean
} {
  if (format === 'mp4') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      return { mimeType: 'video/mp4;codecs=avc1', actualFormat: 'mp4', didFallback: false }
    }
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
      return { mimeType: 'video/mp4;codecs=h264', actualFormat: 'mp4', didFallback: false }
    }
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      return { mimeType: 'video/mp4', actualFormat: 'mp4', didFallback: false }
    }
  }

  // Prefer VP8 over VP9 for WebM — VP9 can look lossy at moderate bitrates
  const webmMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

  return {
    mimeType: webmMime,
    actualFormat: 'webm',
    didFallback: format === 'mp4',
  }
}

// ── Batch export ──────────────────────────────────────────────────────

export interface BatchExportProgress {
  rowIndex: number
  totalRows: number
  status: 'exporting' | 'complete' | 'error'
  error?: string
}

export type BatchExportProgressCallback = (progress: BatchExportProgress) => void

/**
 * Export multiple compositions as video blobs, one per row.
 * Returns an array of Blob results (null for failed rows).
 */
export async function exportBatch(
  compositions: VideoCompositionProps[],
  options: ExportOptions,
  onProgress?: BatchExportProgressCallback,
): Promise<(Blob | null)[]> {
  const results: (Blob | null)[] = []

  for (let i = 0; i < compositions.length; i++) {
    onProgress?.({
      rowIndex: i,
      totalRows: compositions.length,
      status: 'exporting',
    })

    try {
      const result = await exportVideo(compositions[i], options, () => {})
      if (result.url) {
        const response = await fetch(result.url)
        const blob = await response.blob()
        results.push(blob)
        URL.revokeObjectURL(result.url)
      } else {
        results.push(null)
      }

      onProgress?.({
        rowIndex: i,
        totalRows: compositions.length,
        status: 'complete',
      })
    } catch (err) {
      results.push(null)
      onProgress?.({
        rowIndex: i,
        totalRows: compositions.length,
        status: 'error',
        error: err instanceof Error ? err.message : 'Export failed',
      })
    }
  }

  return results
}

// ── Silence Remap ──

export interface SilenceRegion {
  startSec: number
  endSec: number
  removedSec: number
}

/**
 * Remap event times after silence regions have been compressed.
 * Events before any silence are untouched. Events after a silence shift
 * earlier by `removedSec`. Events inside a silence are clamped.
 */
export function remapTimeline<T extends { time: number }>(events: T[], silenceMap: SilenceRegion[]): T[] {
  if (silenceMap.length === 0) return events

  return events.map((ev) => {
    let offset = 0
    for (const s of silenceMap) {
      if (ev.time <= s.startSec) break
      if (ev.time >= s.endSec) {
        offset += s.removedSec
      } else {
        // Inside silence — clamp to compressed boundary
        const keepSec = s.endSec - s.startSec - s.removedSec
        const into = ev.time - s.startSec
        offset += Math.max(0, into - keepSec)
        break
      }
    }
    return { ...ev, time: Math.max(0, ev.time - offset) }
  })
}
