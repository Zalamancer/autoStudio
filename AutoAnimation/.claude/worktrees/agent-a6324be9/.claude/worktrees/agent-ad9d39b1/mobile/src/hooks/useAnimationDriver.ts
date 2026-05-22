// mobile/src/hooks/useAnimationDriver.ts
import { useEffect, useCallback } from 'react'
import {
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'

interface AnimationDriverOptions {
  durationMs: number
  loop?: boolean
  autoPlay?: boolean
}

export function useAnimationDriver({
  durationMs,
  loop = true,
  autoPlay = true,
}: AnimationDriverOptions) {
  const progress = useSharedValue(0)
  const isPlaying = useSharedValue(autoPlay ? 1 : 0)

  const play = useCallback(() => {
    isPlaying.value = 1
    progress.value = 0
    progress.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      loop ? -1 : 1,
      false,
    )
  }, [durationMs, loop])

  const pause = useCallback(() => {
    isPlaying.value = 0
    cancelAnimation(progress)
  }, [])

  const restart = useCallback(() => {
    cancelAnimation(progress)
    progress.value = 0
    play()
  }, [play])

  useEffect(() => {
    if (autoPlay) play()
    return () => cancelAnimation(progress)
  }, [autoPlay, play])

  return { progress, isPlaying, play, pause, restart }
}
