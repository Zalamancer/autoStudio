/**
 * RetentionHookLayer — Canvas preview for retention hooks.
 *
 * Renders visual engagement widgets (progress bar, countdown, chapter markers,
 * wait-for-it text, step counter) on the canvas during live preview.
 */

import { useRef, useEffect, useState, memo } from 'react'
import { useRetentionHookStore, type RetentionHook } from '@/stores/useRetentionHookStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
// useCanvasStore available for future canvas-aware positioning
import { useBrandKitStore } from '@/stores/useBrandKitStore'

function getHookColors(hook: RetentionHook): { primary: string; secondary: string } {
  const brandKit = useBrandKitStore.getState().getActiveBrandKit()

  if (hook.style === 'branded' && brandKit) {
    return { primary: brandKit.primaryColor, secondary: brandKit.accentColor }
  }

  const base = hook.color || '#6366f1'
  switch (hook.style) {
    case 'neon':
      return { primary: base, secondary: `${base}88` }
    case 'gradient':
      return { primary: '#f43f5e', secondary: '#8b5cf6' }
    default:
      return { primary: base, secondary: `${base}66` }
  }
}

function ProgressBar({ hook, progress }: { hook: RetentionHook; progress: number }) {
  const { primary, secondary } = getHookColors(hook)
  const isNeon = hook.style === 'neon'
  const isGradient = hook.style === 'gradient'

  return (
    <div
      style={{
        position: 'absolute',
        [hook.position]: 0,
        left: 0,
        right: 0,
        height: hook.style === 'minimal' ? 3 : 5,
        backgroundColor: secondary,
        zIndex: 50,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: isGradient ? `linear-gradient(90deg, ${primary}, ${secondary})` : primary,
          boxShadow: isNeon ? `0 0 8px ${primary}, 0 0 16px ${primary}` : undefined,
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  )
}

function Countdown({ hook, secondsLeft }: { hook: RetentionHook; secondsLeft: number }) {
  const { primary } = getHookColors(hook)
  const isNeon = hook.style === 'neon'

  return (
    <div
      style={{
        position: 'absolute',
        [hook.position]: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: `${primary}33`,
        border: `2px solid ${primary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        boxShadow: isNeon ? `0 0 12px ${primary}` : undefined,
      }}
    >
      <span style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' }}>
        {Math.max(0, Math.ceil(secondsLeft))}
      </span>
    </div>
  )
}

function ChapterMarker({ hook, progress }: { hook: RetentionHook; progress: number }) {
  const chapters = hook.chapters || []
  if (chapters.length === 0) return null

  const { primary, secondary } = getHookColors(hook)
  const currentChapter = Math.min(chapters.length - 1, Math.floor(progress * chapters.length))

  return (
    <div
      style={{
        position: 'absolute',
        [hook.position]: 8,
        left: 16,
        right: 16,
        zIndex: 50,
      }}
    >
      {/* Dots */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {chapters.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= currentChapter ? primary : secondary,
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </div>
      {/* Label */}
      <div style={{ marginTop: 4, fontSize: 11, color: '#fff', fontWeight: 500, opacity: 0.9 }}>
        {chapters[currentChapter]}
      </div>
    </div>
  )
}

function WaitForIt({
  hook,
  currentFrame,
  totalFrames,
}: {
  hook: RetentionHook
  currentFrame: number
  totalFrames: number
}) {
  const triggerFrame = Math.round((hook.triggerPercent ?? 0.7) * totalFrames)
  if (currentFrame < triggerFrame) return null

  const { primary } = getHookColors(hook)
  const text = hook.text || 'Wait for it...'
  // Pulse animation via opacity
  const elapsed = currentFrame - triggerFrame
  const pulse = 0.7 + 0.3 * Math.sin(elapsed * 0.15)

  return (
    <div
      style={{
        position: 'absolute',
        [hook.position]: 40,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 50,
        opacity: pulse,
      }}
    >
      <span
        style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          textShadow: `0 0 12px ${primary}, 0 2px 4px rgba(0,0,0,0.5)`,
          letterSpacing: 1,
        }}
      >
        {text}
      </span>
    </div>
  )
}

function StepCounter({ hook, progress }: { hook: RetentionHook; progress: number }) {
  const total = hook.totalSteps || 1
  const current = Math.min(total, Math.floor(progress * total) + 1)
  const { primary } = getHookColors(hook)

  return (
    <div
      style={{
        position: 'absolute',
        [hook.position]: 12,
        left: 12,
        backgroundColor: `${primary}cc`,
        borderRadius: 16,
        padding: '4px 12px',
        zIndex: 50,
      }}
    >
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>
        Step {current}/{total}
      </span>
    </div>
  )
}

/** Playback-derived values updated imperatively via RAF */
interface PlaybackSnapshot {
  currentTime: number
  fps: number
  duration: number
}

export const RetentionHookLayer = memo(function RetentionHookLayer() {
  const hooks = useRetentionHookStore((s) => s.hooks)

  // Throttled playback subscription — UI widgets don't need 60fps updates.
  // Subscribes to the store but only triggers a re-render at ~15fps.
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>(() => {
    const s = usePlaybackStore.getState()
    return { currentTime: s.currentTime, fps: s.fps, duration: s.duration }
  })
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    const THROTTLE_MS = 66 // ~15fps

    const unsub = usePlaybackStore.subscribe((s) => {
      const now = performance.now()
      // Always update immediately when not playing (seeks, pauses, etc.)
      if (!s.isPlaying || now - lastUpdateRef.current >= THROTTLE_MS) {
        lastUpdateRef.current = now
        setSnapshot({ currentTime: s.currentTime, fps: s.fps, duration: s.duration })
      }
    })
    return unsub
  }, [])

  const { currentTime, fps, duration } = snapshot

  if (hooks.length === 0) return null

  const totalFrames = Math.round(duration * fps)
  const currentFrame = Math.round(currentTime * fps)
  const progress = duration > 0 ? currentTime / duration : 0
  const secondsLeft = Math.max(0, duration - currentTime)

  return (
    <>
      {hooks.map((hook) => {
        switch (hook.type) {
          case 'progress-bar':
            return <ProgressBar key={hook.id} hook={hook} progress={progress} />
          case 'countdown':
            return (
              <Countdown
                key={hook.id}
                hook={hook}
                secondsLeft={hook.countdownFrom != null ? hook.countdownFrom * (1 - progress) : secondsLeft}
              />
            )
          case 'chapter-marker':
            return <ChapterMarker key={hook.id} hook={hook} progress={progress} />
          case 'wait-for-it':
            return <WaitForIt key={hook.id} hook={hook} currentFrame={currentFrame} totalFrames={totalFrames} />
          case 'step-counter':
            return <StepCounter key={hook.id} hook={hook} progress={progress} />
          default:
            return null
        }
      })}
    </>
  )
})
