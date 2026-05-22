/**
 * Type declarations for Electron preload API
 * Exposed via contextBridge.exposeInMainWorld('electronAPI', ...)
 */

interface ElectronFileFilter {
  name: string
  extensions: string[]
}

interface ElectronSaveOptions {
  defaultName?: string
  filters?: ElectronFileFilter[]
}

interface ElectronAPI {
  // File dialogs
  openFile: () => Promise<string | null>
  openDirectory: () => Promise<string | null>
  saveFile: (options?: ElectronSaveOptions) => Promise<string | null>

  // File system
  writeFile: (filePath: string, data: ArrayBuffer) => Promise<void>
  readFile: (filePath: string) => Promise<ArrayBuffer>

  // App paths
  getPath: (name: 'userData' | 'temp' | 'downloads' | 'documents' | 'desktop') => Promise<string>

  // Shell
  openExternal: (url: string) => Promise<void>
  showItemInFolder: (path: string) => Promise<void>

  // Window controls
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>

  // Platform info
  platform: NodeJS.Platform
  isElectron: true

  // Event listeners (return unsubscribe function)
  onExportProgress: (callback: (data: { percent: number; stage: string }) => void) => () => void
  onServerReady: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
