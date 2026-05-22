/**
 * Video Slicer — FFmpeg WASM wrapper for client-side video slicing.
 *
 * Lazy-loads the ~30MB FFmpeg WASM binary on first use.
 * Falls back gracefully if FFmpeg is unavailable.
 */

import { logger } from '@/utils/logger'

export interface SliceResult {
  blob: Blob
  durationSec: number
}

let ffmpegInstance: unknown = null
let ffmpegLoading = false

/**
 * Lazy-load FFmpeg WASM. Caches the instance after first load.
 */
export async function initFFmpeg(): Promise<boolean> {
  if (ffmpegInstance) return true
  if (ffmpegLoading) {
    // Wait for existing load
    while (ffmpegLoading) {
      await new Promise((r) => setTimeout(r, 100))
    }
    return !!ffmpegInstance
  }

  ffmpegLoading = true
  try {
    // Dynamic import to avoid bundling if unused
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const ffmpeg = new FFmpeg()

    // Load core WASM from CDN
    await ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
    })

    ffmpegInstance = ffmpeg
    ffmpegLoading = false
    logger.info('[VideoSlicer] FFmpeg WASM loaded successfully')
    return true
  } catch (err) {
    ffmpegLoading = false
    logger.error('[VideoSlicer] Failed to load FFmpeg WASM:', err)
    return false
  }
}

/**
 * Slice a video file between start and end seconds.
 * Returns a Blob of the sliced segment.
 */
export async function sliceVideo(
  videoFile: File,
  startSec: number,
  endSec: number,
  _outputFormat: string = 'mp4',
): Promise<SliceResult> {
  const loaded = await initFFmpeg()
  if (!loaded || !ffmpegInstance) {
    throw new Error('FFmpeg WASM not available')
  }

  const ffmpeg = ffmpegInstance as {
    writeFile: (name: string, data: Uint8Array) => Promise<void>
    exec: (args: string[]) => Promise<void>
    readFile: (name: string) => Promise<Uint8Array>
    deleteFile: (name: string) => Promise<void>
  }

  const inputName = 'input.mp4'
  const outputName = 'output.mp4'

  // Write input file
  const inputData = new Uint8Array(await videoFile.arrayBuffer())
  await ffmpeg.writeFile(inputName, inputData)

  // Run FFmpeg slice
  const duration = endSec - startSec
  await ffmpeg.exec([
    '-ss', String(startSec),
    '-i', inputName,
    '-t', String(duration),
    '-c', 'copy',
    '-movflags', '+faststart',
    outputName,
  ])

  // Read output
  const outputData = await ffmpeg.readFile(outputName)
  const blob = new Blob([outputData], { type: 'video/mp4' })

  // Cleanup
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  return { blob, durationSec: duration }
}

/**
 * Extract audio track from a video file as WAV.
 */
export async function extractAudioTrack(videoFile: File): Promise<Blob> {
  const loaded = await initFFmpeg()
  if (!loaded || !ffmpegInstance) {
    throw new Error('FFmpeg WASM not available')
  }

  const ffmpeg = ffmpegInstance as {
    writeFile: (name: string, data: Uint8Array) => Promise<void>
    exec: (args: string[]) => Promise<void>
    readFile: (name: string) => Promise<Uint8Array>
    deleteFile: (name: string) => Promise<void>
  }

  const inputName = 'input_audio.mp4'
  const outputName = 'output.wav'

  const inputData = new Uint8Array(await videoFile.arrayBuffer())
  await ffmpeg.writeFile(inputName, inputData)

  await ffmpeg.exec([
    '-i', inputName,
    '-vn',
    '-acodec', 'pcm_s16le',
    '-ar', '16000',
    '-ac', '1',
    outputName,
  ])

  const outputData = await ffmpeg.readFile(outputName)
  const blob = new Blob([outputData], { type: 'audio/wav' })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  return blob
}

/**
 * Generate a thumbnail image at a specific timestamp.
 */
export async function generateThumbnail(videoFile: File, timestampSec: number): Promise<Blob> {
  const loaded = await initFFmpeg()
  if (!loaded || !ffmpegInstance) {
    throw new Error('FFmpeg WASM not available')
  }

  const ffmpeg = ffmpegInstance as {
    writeFile: (name: string, data: Uint8Array) => Promise<void>
    exec: (args: string[]) => Promise<void>
    readFile: (name: string) => Promise<Uint8Array>
    deleteFile: (name: string) => Promise<void>
  }

  const inputName = 'input_thumb.mp4'
  const outputName = 'thumb.jpg'

  const inputData = new Uint8Array(await videoFile.arrayBuffer())
  await ffmpeg.writeFile(inputName, inputData)

  await ffmpeg.exec([
    '-ss', String(timestampSec),
    '-i', inputName,
    '-frames:v', '1',
    '-q:v', '5',
    outputName,
  ])

  const outputData = await ffmpeg.readFile(outputName)
  const blob = new Blob([outputData], { type: 'image/jpeg' })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  return blob
}
