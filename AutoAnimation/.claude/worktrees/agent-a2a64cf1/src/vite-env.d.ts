/// <reference types="vite/client" />

// FFmpeg WASM — optional dependency, lazy-loaded at runtime
declare module '@ffmpeg/ffmpeg' {
  export class FFmpeg {
    load(options?: { coreURL?: string; wasmURL?: string }): Promise<void>
    writeFile(name: string, data: Uint8Array): Promise<void>
    exec(args: string[]): Promise<void>
    readFile(name: string): Promise<Uint8Array>
    on(event: string, callback: (...args: unknown[]) => void): void
  }
  export function fetchFile(input: string | File | Blob): Promise<Uint8Array>
}
