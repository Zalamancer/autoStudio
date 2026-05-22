/**
 * RemotionRetentionHookLayer — Export-compatible Remotion version of retention hooks.
 *
 * Renders visual engagement widgets frame-accurately using Remotion's
 * useCurrentFrame() for progress calculation.
 */

import { useFrame, useComposition } from '@/engine'
import type { RetentionHookData } from './types'

interface Props {
  hooks: RetentionHookData[]
}

function getColors(hook: RetentionHookData): { primary: string; secondary: string } {
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

function ProgressBarHook({ hook, progress }: { hook: RetentionHookData; progress: number }) {
  const { primary, secondary } = getColors(hook)
  const isGradient = hook.style === 'gradient'
  const isNeon = hook.style === 'neon'

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
          background: isGradient
            ? `linear-gradient(90deg, ${primary}, ${secondary})`
            : primary,
          boxShadow: isNeon ? `0 0 8px ${primary}, 0 0 16px ${primary}` : undefined,
        }}
      />
    </div>
  )
}

function CountdownHook({ hook, secondsLeft }: { hook: RetentionHookData; secondsLeft: number }) {
  const { primary } = getColors(hook)
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

function ChapterMarkerHook({ hook, progress }: { hook: RetentionHookData; progress: number }) {
  const chapters = hook.chapters || []
  if (chapters.length === 0) return null

  const { primary, secondary } = getColors(hook)
  const currentChapter = Math.min(
    chapters.length - 1,
    Math.floor(progress * chapters.length),
  )

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
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {chapters.map((_: string, i: number) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= currentChapter ? primary : secondary,
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: '#fff', fontWeight: 500, opacity: 0.9 }}>
        {chapters[currentChapter]}
      </div>
    </div>
  )
}

function WaitForItHook({ hook, frame, totalFrames }: { hook: RetentionHookData; frame: number; totalFrames: number }) {
  const triggerFrame = hook.triggerFrame ?? Math.round(totalFrames * 0.7)
  if (frame < triggerFrame) return null

  const { primary } = getColors(hook)
  const text = hook.text || 'Wait for it...'
  const elapsed = frame - triggerFrame
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

function StepCounterHook({ hook, frame, totalFrames }: { hook: RetentionHookData; frame: number; totalFrames: number }) {
  const total = hook.totalSteps || 1
  const { primary } = getColors(hook)

  let current: number
  if (hook.stepBoundaries && hook.stepBoundaries.length > 0) {
    current = 1
    for (const boundary of hook.stepBoundaries) {
      if (frame >= boundary) current++
    }
    current = Math.min(current, total)
  } else {
    const progress = totalFrames > 0 ? frame / totalFrames : 0
    current = Math.min(total, Math.floor(progress * total) + 1)
  }

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

export function RemotionRetentionHookLayer({ hooks }: Props) {
  const frame = useFrame()
  const { durationInFrames, fps } = useComposition()

  if (!hooks || hooks.length === 0) return null

  const progress = durationInFrames > 0 ? frame / durationInFrames : 0
  const secondsLeft = durationInFrames > 0 ? (durationInFrames - frame) / fps : 0

  return (
    <>
      {hooks.map((hook, i) => {
        switch (hook.type) {
          case 'progress-bar':
            return <ProgressBarHook key={i} hook={hook} progress={progress} />
          case 'countdown':
            return <CountdownHook key={i} hook={hook} secondsLeft={hook.countdownFrom != null ? hook.countdownFrom * (1 - progress) : secondsLeft} />
          case 'chapter-marker':
            return <ChapterMarkerHook key={i} hook={hook} progress={progress} />
          case 'wait-for-it':
            return <WaitForItHook key={i} hook={hook} frame={frame} totalFrames={durationInFrames} />
          case 'step-counter':
            return <StepCounterHook key={i} hook={hook} frame={frame} totalFrames={durationInFrames} />
          default:
            return null
        }
      })}
    </>
  )
}
