/**
 * Video Slicer Worker — Web Worker that loads FFmpeg WASM and processes slice requests.
 *
 * Communicates with main thread via postMessage.
 * Handles: slice, extract audio, generate thumbnail at timestamp.
 */

interface SliceMessage {
  type: 'slice'
  id: string
  fileData: ArrayBuffer
  startSec: number
  endSec: number
}

interface ExtractAudioMessage {
  type: 'extract-audio'
  id: string
  fileData: ArrayBuffer
}

interface ThumbnailMessage {
  type: 'thumbnail'
  id: string
  fileData: ArrayBuffer
  timestampSec: number
}

type WorkerMessage = SliceMessage | ExtractAudioMessage | ThumbnailMessage

 
const ctx = self as unknown as Worker

let ffmpeg: unknown = null

async function ensureFFmpeg(): Promise<void> {
  if (ffmpeg) return

  // Dynamic import within worker context
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const instance = new FFmpeg()

  await instance.load({
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
  })

  ffmpeg = instance
}

ctx.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data

  try {
    await ensureFFmpeg()

    const ff = ffmpeg as {
      writeFile: (name: string, data: Uint8Array) => Promise<void>
      exec: (args: string[]) => Promise<void>
      readFile: (name: string) => Promise<Uint8Array>
      deleteFile: (name: string) => Promise<void>
    }

    switch (msg.type) {
      case 'slice': {
        await ff.writeFile('input.mp4', new Uint8Array(msg.fileData))
        const duration = msg.endSec - msg.startSec
        await ff.exec([
          '-ss', String(msg.startSec),
          '-i', 'input.mp4',
          '-t', String(duration),
          '-c', 'copy',
          '-movflags', '+faststart',
          'output.mp4',
        ])
        const output = await ff.readFile('output.mp4')
        await ff.deleteFile('input.mp4')
        await ff.deleteFile('output.mp4')
        ctx.postMessage({ id: msg.id, type: 'result', data: output.buffer }, [output.buffer])
        break
      }

      case 'extract-audio': {
        await ff.writeFile('input.mp4', new Uint8Array(msg.fileData))
        await ff.exec([
          '-i', 'input.mp4',
          '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1',
          'output.wav',
        ])
        const output = await ff.readFile('output.wav')
        await ff.deleteFile('input.mp4')
        await ff.deleteFile('output.wav')
        ctx.postMessage({ id: msg.id, type: 'result', data: output.buffer }, [output.buffer])
        break
      }

      case 'thumbnail': {
        await ff.writeFile('input.mp4', new Uint8Array(msg.fileData))
        await ff.exec([
          '-ss', String(msg.timestampSec),
          '-i', 'input.mp4',
          '-frames:v', '1', '-q:v', '5',
          'thumb.jpg',
        ])
        const output = await ff.readFile('thumb.jpg')
        await ff.deleteFile('input.mp4')
        await ff.deleteFile('thumb.jpg')
        ctx.postMessage({ id: msg.id, type: 'result', data: output.buffer }, [output.buffer])
        break
      }
    }
  } catch (err) {
    ctx.postMessage({
      id: msg.id,
      type: 'error',
      error: err instanceof Error ? err.message : 'Worker error',
    })
  }
}
