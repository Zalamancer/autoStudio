import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '../src/stores/useAuthStore'

export default function RootLayout() {
  const { user, loading, initialize } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    const inProtectedTab = segments[1] === 'projects' || segments[1] === 'settings'

    if (!user && !inAuthGroup && inProtectedTab) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/showcase')
    }
  }, [user, loading, segments])

  if (loading) return null

  return <Slot />
}
