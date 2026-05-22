/**
 * Hook to check if running in Electron and access the API
 */
export function useElectron() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI
  return {
    isElectron,
    electron: window.electronAPI ?? null,
    platform: window.electronAPI?.platform ?? 'web',
  }
}
