declare module 'gifenc' {
  interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: number[][]
        delay?: number
        repeat?: number
        dispose?: number
        transparent?: boolean
        transparentIndex?: number
        first?: boolean
      },
    ): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    reset(): void
    readonly buffer: ArrayBuffer
    readonly stream: unknown
  }

  export function GIFEncoder(options?: { initialCapacity?: number; auto?: boolean }): GIFEncoderInstance

  export function quantize(
    data: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: {
      format?: 'rgb565' | 'rgb444' | 'rgba4444'
      clearAlpha?: boolean
      clearAlphaColor?: number
      clearAlphaThreshold?: number
      oneBitAlpha?: boolean | number
      useSqrt?: boolean
    },
  ): number[][]

  export function applyPalette(
    data: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: 'rgb565' | 'rgb444' | 'rgba4444',
  ): Uint8Array

  export function prequantize(
    data: Uint8Array | Uint8ClampedArray,
    options?: {
      roundRGB?: number
      roundAlpha?: number
      oneBitAlpha?: boolean | number
    },
  ): void

  export function nearestColorIndex(
    palette: number[][],
    color: number[],
    distanceFn?: (a: number[], b: number[]) => number,
  ): number

  export function nearestColor(
    palette: number[][],
    color: number[],
    distanceFn?: (a: number[], b: number[]) => number,
  ): number[]

  export function snapColorsToPalette(
    palette: number[][],
    targetPalette: number[][],
    threshold?: number,
  ): void

  export default GIFEncoder
}
