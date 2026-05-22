import * as vm from 'node:vm'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const FRAME_TIMEOUT_MS = 2000

export interface RenderOptions {
  functionCode: string
  totalFrames: number
  width: number
  height: number
  fps: number
  outputDir: string
  onProgress?: (frame: number, totalFrames: number) => void
}

export async function renderFrames(options: RenderOptions): Promise<string[]> {
  const { functionCode, totalFrames, width, height, fps, outputDir, onProgress } = options

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true })

  // Create sandboxed VM context with safe globals only
  const sandbox = {
    Math,
    Number,
    String,
    Array,
    Object,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Infinity,
    NaN,
    undefined,
    true: true,
    false: false,
    null: null,
    WIDTH: width,
    HEIGHT: height,
    FPS: fps,
  }

  const context = vm.createContext(sandbox)

  // Compile the function in the sandbox
  const script = new vm.Script(`
    ${functionCode}
    // Make the function available
    _generateFrame = typeof generateFrame === 'function' ? generateFrame : null;
  `, { timeout: 5000 })

  script.runInContext(context)

  if (!context._generateFrame) {
    throw new Error('generateFrame function was not defined in the provided code')
  }

  const framePaths: string[] = []

  for (let frame = 0; frame < totalFrames; frame++) {
    const paddedFrame = String(frame).padStart(5, '0')
    const framePath = path.join(outputDir, `frame_${paddedFrame}.png`)

    try {
      // Execute frame generation with timeout
      const frameScript = new vm.Script(`_generateFrame(${frame}, ${totalFrames})`, {
        timeout: FRAME_TIMEOUT_MS,
      })
      const svgString = frameScript.runInContext(context) as string

      // Validate SVG
      if (typeof svgString !== 'string' || !svgString.trim().startsWith('<svg') || !svgString.trim().endsWith('</svg>')) {
        throw new Error(`Frame ${frame}: Invalid SVG output`)
      }

      // Rasterize SVG to PNG
      const resvg = new Resvg(svgString, {
        fitTo: { mode: 'width', value: width },
      })
      const pngData = resvg.render()
      const pngBuffer = pngData.asPng()

      fs.writeFileSync(framePath, pngBuffer)
    } catch (err) {
      // On error, write a black frame so the video isn't broken
      console.warn(`Frame ${frame} failed: ${err instanceof Error ? err.message : err}`)
      const blackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="black"/></svg>`
      const resvg = new Resvg(blackSvg, { fitTo: { mode: 'width', value: width } })
      const pngBuffer = resvg.render().asPng()
      fs.writeFileSync(framePath, pngBuffer)
    }

    framePaths.push(framePath)

    if (onProgress) {
      onProgress(frame + 1, totalFrames)
    }
  }

  return framePaths
}
