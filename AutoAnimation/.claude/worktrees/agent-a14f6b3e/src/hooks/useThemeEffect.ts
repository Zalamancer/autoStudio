import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function useThemeEffect() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    // Clean up any stale theme classes (including legacy 'sepia')
    root.classList.remove('light', 'sepia')
    if (theme === 'light') {
      root.classList.add('light')
    }
  }, [theme])
}
