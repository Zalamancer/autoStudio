/**
 * FFmpeg WASM Lazy Loader.
 *
 * Downloads the ~25MB WASM binary only when ProRes export is first requested.
 * Caches the loaded instance for subsequent exports.
 * Shows download progress via callback.
 */

let cachedFFmpeg: FFmpegInstance | null = null

interface FFmpegInstance {
  exec: (args: string[]) => Promise<void>
  writeFile: (name: string, data: Uint8Array | ArrayBuffer | BufferSource) => Promise<void>
  readFile: (name: string) => Promise<Uint8Array>
  terminate: () => void
}

/**
 * Load FFmpeg WASM, caching the instance for re-use.
 * @param onProgress - Progress callback (0..1) for download progress
 */
export async function loadFFmpeg(
  onProgress?: (progress: number) => void,
): Promise<FFmpegInstance> {
  if (cachedFFmpeg) return cachedFFmpeg

  onProgress?.(0)

  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    // @ts-expect-error -- @ffmpeg/util is a lazy-loaded optional dependency
    const { toBlobURL } = await import('@ffmpeg/util')

    const ffmpeg = new FFmpeg()

    ffmpeg.on('progress', ((...args: unknown[]) => {
      const evt = args[0] as { progress: number }
      onProgress?.(Math.min(evt.progress, 1))
    }) as (...args: unknown[]) => void)

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    onProgress?.(1)

    cachedFFmpeg = {
      exec: (args) => ffmpeg.exec(args),
      writeFile: (name, data) => ffmpeg.writeFile(name, new Uint8Array(data instanceof ArrayBuffer ? data : (data as Uint8Array).buffer)),
      readFile: (name) => ffmpeg.readFile(name) as Promise<Uint8Array>,
      terminate: () => (ffmpeg as any).terminate?.(),
    }

    return cachedFFmpeg
  } catch (err) {
    console.error('[ffmpegLoader] Failed to load FFmpeg WASM:', err)
    throw new Error('FFmpeg WASM failed to load. ProRes export is not available.')
  }
}

/**
 * Check if FFmpeg WASM is already loaded.
 */
export function isFFmpegLoaded(): boolean {
  return cachedFFmpeg !== null
}

/**
 * Terminate the cached FFmpeg instance (free memory).
 */
export function terminateFFmpeg(): void {
  cachedFFmpeg?.terminate()
  cachedFFmpeg = null
}
