import ffmpeg from 'fluent-ffmpeg'
import * as path from 'node:path'
import * as fs from 'node:fs'

export interface EncodeOptions {
  inputDir: string
  fps: number
  outputPath?: string // defaults to inputDir/output.mp4
  onProgress?: (percent: number) => void
}

export function encodeVideo(options: EncodeOptions): Promise<string> {
  const { inputDir, fps, onProgress } = options
  const outputPath = options.outputPath || path.join(inputDir, 'output.mp4')
  const inputPattern = path.join(inputDir, 'frame_%05d.png')

  return new Promise((resolve, reject) => {
    const command = ffmpeg()
      .input(inputPattern)
      .inputFPS(fps)
      .videoCodec('libx264')
      .outputOptions([
        '-pix_fmt', 'yuv420p',
        '-crf', '18',
        '-preset', 'fast',
        '-movflags', '+faststart',
      ])
      .output(outputPath)

    command.on('progress', (info) => {
      if (onProgress && info.percent) {
        onProgress(Math.min(100, Math.round(info.percent)))
      }
    })

    command.on('end', () => {
      resolve(outputPath)
    })

    command.on('error', (err) => {
      reject(new Error(`FFmpeg encoding failed: ${err.message}`))
    })

    command.run()
  })
}

export function cleanupTempDir(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    console.warn(`Failed to clean up temp directory: ${dir}`)
  }
}

export function isFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      resolve(!err)
    })
  })
}
