import { useEffect, useRef, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCreditsStore } from '@/stores/useCreditsStore'
import { useRecordingsStore } from '@/stores/useRecordingsStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'
import { useTemplateRatingStore } from '@/stores/useTemplateRatingStore'

interface AuthGuardProps {
  children: ReactNode
}

/**
 * AuthGuard initializes auth state on mount but never blocks the editor.
 * Auth is optional — users can use the editor without signing in.
 * Cloud features (project save/load) will prompt for auth when needed.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const fetchBalance = useCreditsStore((s) => s.fetchBalance)
  const cloudSyncDone = useRef(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  // Once authenticated, sync cloud data (all character types + recordings)
  useEffect(() => {
    if (!user || cloudSyncDone.current) return
    cloudSyncDone.current = true

    const sync = async () => {
      // Ensure character images are loaded from IndexedDB before pushing to cloud
      await Promise.allSettled([
        useSavedCharactersStore.getState().hydrateAll(),
        useSavedPixelArtCharactersStore.getState().hydrateAllBlobUrls(),
        useSaved3DCharactersStore.getState().hydrateAllBlobUrls(),
        useSavedAvatarCharactersStore.getState().hydrateAllBlobUrls(),
      ])
      console.log('[AuthGuard] Hydration complete, starting cloud sync...')

      await Promise.allSettled([
        useRecordingsStore.getState().syncFromCloud(),
        useSavedCharactersStore.getState().syncFromCloud(),
        useSavedPixelArtCharactersStore.getState().syncFromCloud(),
        useSaved3DCharactersStore.getState().syncFromCloud(),
        useSavedAvatarCharactersStore.getState().syncFromCloud(),
        useTemplateRatingStore.getState().hydrateFromSupabase(),
      ])
      console.log('[AuthGuard] Cloud sync complete')
    }

    sync().catch((err) => {
      console.warn('[AuthGuard] Cloud sync failed:', err)
    })
  }, [user])

  // Fetch credit balance once authenticated
  useEffect(() => {
    if (user) fetchBalance()
  }, [user, fetchBalance])

  return <>{children}</>
}
