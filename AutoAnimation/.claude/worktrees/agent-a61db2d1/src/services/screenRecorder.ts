/**
 * Screen Recorder Service — Capture screen/window/tab using getDisplayMedia.
 */

import { logger } from '@/utils/logger'

export type CaptureMode = 'screen' | 'window' | 'tab'

export interface ScreenRecording {
  blob: Blob
  duration: number // seconds
  mimeType: string
  url: string // object URL
}

let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let chunks: Blob[] = []
let startTime = 0

/**
 * Start screen capture. Returns the MediaStream for live preview.
 */
export async function startScreenCapture(mode: CaptureMode = 'screen'): Promise<MediaStream> {
  if (mediaStream) {
    throw new Error('Screen capture already in progress')
  }

  const displayMediaOptions: DisplayMediaStreamOptions = {
    video: {
      displaySurface: mode === 'tab' ? 'browser' : mode === 'window' ? 'window' : 'monitor',
    } as MediaTrackConstraints,
    audio: true,
  }

  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
  } catch {
    throw new Error('Screen capture was cancelled or denied')
  }

  // Handle user clicking "Stop sharing" in browser UI
  mediaStream.getVideoTracks()[0]?.addEventListener('ended', () => {
    stopScreenCapture()
  })

  chunks = []
  startTime = Date.now()

  // Pick best available codec
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm'

  mediaRecorder = new MediaRecorder(mediaStream, { mimeType })

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  mediaRecorder.start(1000) // collect data every second
  logger.info(`[ScreenRecorder] Started capture (${mode}, ${mimeType})`)

  return mediaStream
}

/**
 * Stop screen capture and return the recording.
 */
export function stopScreenCapture(): Promise<ScreenRecording> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || !mediaStream) {
      reject(new Error('No screen capture in progress'))
      return
    }

    mediaRecorder.onstop = () => {
      const duration = (Date.now() - startTime) / 1000
      const mimeType = mediaRecorder?.mimeType || 'video/webm'
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)

      // Stop all tracks
      mediaStream?.getTracks().forEach((t) => t.stop())
      mediaStream = null
      mediaRecorder = null
      chunks = []

      logger.info(`[ScreenRecorder] Stopped — ${duration.toFixed(1)}s, ${(blob.size / 1024 / 1024).toFixed(1)}MB`)
      resolve({ blob, duration, mimeType, url })
    }

    mediaRecorder.stop()
  })
}

/**
 * Check if screen capture is currently active.
 */
export function isCapturing(): boolean {
  return mediaStream !== null && mediaRecorder !== null
}

/**
 * Get the current stream (for preview).
 */
export function getCurrentStream(): MediaStream | null {
  return mediaStream
}
