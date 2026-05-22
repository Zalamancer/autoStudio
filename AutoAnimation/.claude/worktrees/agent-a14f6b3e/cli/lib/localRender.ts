/**
 * Local rendering helper: writes composition props to temp JSON file,
 * spawns `npx remotion render` with correct entry point and props path,
 * streams progress output.
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export interface LocalRenderOptions {
  propsJson: Record<string, unknown>
  outputPath: string
  entryPoint?: string
  compositionId?: string
  format?: 'mp4' | 'webm'
  onProgress?: (line: string) => void
}

/**
 * Render a video locally using Remotion CLI.
 */
export async function renderLocally(options: LocalRenderOptions): Promise<void> {
  const {
    propsJson,
    outputPath,
    entryPoint = 'src/remotion/entry.ts',
    compositionId = 'VideoComposition',
    format = 'mp4',
    onProgress,
  } = options

  // Write props to temp file
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proanimate-'))
  const propsPath = path.join(tempDir, 'props.json')
  fs.writeFileSync(propsPath, JSON.stringify(propsJson, null, 2))

  const codec = format === 'webm' ? 'vp8' : 'h264'

  return new Promise<void>((resolve, reject) => {
    const proc = spawn('npx', [
      'remotion',
      'render',
      entryPoint,
      compositionId,
      outputPath,
      '--props', propsPath,
      '--codec', codec,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    proc.stdout.on('data', (data: Buffer) => {
      const line = data.toString().trim()
      if (line) onProgress?.(line)
    })

    proc.stderr.on('data', (data: Buffer) => {
      const line = data.toString().trim()
      if (line) onProgress?.(line)
    })

    proc.on('close', (code) => {
      // Clean up temp files
      try {
        fs.unlinkSync(propsPath)
        fs.rmdirSync(tempDir)
      } catch {
        // ignore
      }

      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Remotion render failed with exit code ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn Remotion: ${err.message}`))
    })
  })
}
