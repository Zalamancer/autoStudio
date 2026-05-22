/**
 * SceneTransition — Renders transition effects between scenes.
 *
 * Each transition type uses Remotion's `interpolate()` to animate
 * properties (opacity, clip-path, scale, translateY) over the transition
 * duration in frames.
 */
import React from 'react'
import { Fill, useFrame, interpolate } from '@/engine'

export type TransitionType =
  | 'cut'
  | 'crossfade'
  | 'wipe-left'
  | 'wipe-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-up'
  // Cinematic transitions
  | 'morph'
  | 'glitch'
  | 'whip-pan'
  | 'light-leak'
  | 'parallax-slide'
  | 'dramatic-zoom'
  | 'ink-wash'

interface SceneTransitionProps {
  type: TransitionType
  durationFrames: number
  children: React.ReactNode
}

/**
 * Wraps a scene's content and applies an entrance transition.
 * Should be placed inside a Remotion `<Sequence>` that starts at the
 * scene's start frame.
 */
export const SceneTransition: React.FC<SceneTransitionProps> = ({
  type,
  durationFrames,
  children,
}) => {
  const frame = useFrame()

  if (type === 'cut' || durationFrames <= 0) {
    return <Fill>{children}</Fill>
  }

  const progress = interpolate(frame, [0, durationFrames], [0, 1])

  const transitionStyle = getTransitionStyle(type, progress, frame)

  return (
    <Fill style={transitionStyle}>
      {children}
    </Fill>
  )
}

function getTransitionStyle(
  type: TransitionType,
  progress: number,
  frame: number = 0,
): React.CSSProperties {
  switch (type) {
    case 'crossfade':
      return { opacity: progress }

    case 'wipe-left':
      return {
        clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
      }

    case 'wipe-right':
      return {
        clipPath: `inset(0 0 0 ${(1 - progress) * 100}%)`,
      }

    case 'zoom-in': {
      const scale = interpolate(progress, [0, 1], [0.5, 1])
      return {
        opacity: progress,
        transform: `scale(${scale})`,
      }
    }

    case 'zoom-out': {
      const scale = interpolate(progress, [0, 1], [1.5, 1])
      return {
        opacity: progress,
        transform: `scale(${scale})`,
      }
    }

    case 'slide-up': {
      const translateY = interpolate(progress, [0, 1], [100, 0])
      return {
        opacity: progress,
        transform: `translateY(${translateY}%)`,
      }
    }

    // ── Cinematic transitions ──

    case 'morph': {
      const scale = interpolate(progress, [0, 1], [1.05, 1])
      const blur = interpolate(progress, [0, 0.5, 1], [8, 4, 0])
      return {
        opacity: progress,
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
      }
    }

    case 'glitch': {
      // Simulate a digital glitch with clip-path offset and color shift
      // Use a seeded PRNG based on frame for deterministic Remotion rendering
      const seed = frame * 9301 + 49297
      const seededRand1 = ((seed % 233280) / 233280) * 10
      const seededRand2 = (((seed * 7 + 12345) % 233280) / 233280) * 10
      const glitchOffset = interpolate(progress, [0, 0.3, 0.6, 1], [20, -10, 5, 0])
      const glitchOpacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 1])
      return {
        opacity: glitchOpacity,
        transform: `translateX(${glitchOffset}px)`,
        clipPath: progress < 0.5
          ? `inset(${seededRand1}% 0 ${seededRand2}% 0)`
          : 'none',
      }
    }

    case 'whip-pan': {
      const translateX = interpolate(progress, [0, 1], [100, 0])
      const blur = interpolate(progress, [0, 0.5, 1], [30, 15, 0])
      return {
        transform: `translateX(${translateX}%)`,
        filter: `blur(${blur}px)`,
      }
    }

    case 'light-leak': {
      const leakOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0, 0.6, 0])
      const baseOpacity = interpolate(progress, [0, 0.5, 1], [0, 0.8, 1])
      return {
        opacity: baseOpacity,
        boxShadow: `inset 0 0 ${200 * leakOpacity}px ${100 * leakOpacity}px rgba(255, 215, 0, ${leakOpacity})`,
      }
    }

    case 'parallax-slide': {
      const translateX = interpolate(progress, [0, 1], [-50, 0])
      const innerTranslate = interpolate(progress, [0, 1], [25, 0])
      return {
        opacity: progress,
        transform: `translateX(${translateX}%)`,
        // Use perspective for depth illusion
        perspective: '800px',
        transformStyle: 'preserve-3d' as const,
        // The inner content shifts in the opposite direction for parallax
        '--parallax-inner': `translateX(${innerTranslate}%)`,
      } as React.CSSProperties
    }

    case 'dramatic-zoom': {
      const scale = interpolate(progress, [0, 0.5, 1], [2.5, 1.2, 1])
      const blur = interpolate(progress, [0, 0.5, 1], [12, 4, 0])
      return {
        opacity: interpolate(progress, [0, 0.3, 1], [0, 1, 1]),
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
      }
    }

    case 'ink-wash': {
      // Radial clip-path expanding from center simulating ink spread
      const radius = interpolate(progress, [0, 1], [0, 150])
      return {
        clipPath: `circle(${radius}% at 50% 50%)`,
      }
    }

    default:
      return {}
  }
}

/**
 * Renders an exit transition for the outgoing scene during a crossfade overlap.
 * Used when two scenes need to overlap for a crossfade transition.
 */
export const SceneExitTransition: React.FC<{
  type: TransitionType
  durationFrames: number
  totalDuration: number
  children: React.ReactNode
}> = ({ type, durationFrames, totalDuration, children }) => {
  const frame = useFrame()

  if (type === 'cut' || durationFrames <= 0) {
    return <Fill>{children}</Fill>
  }

  const exitStart = totalDuration - durationFrames
  if (frame < exitStart) {
    return <Fill>{children}</Fill>
  }

  const progress = interpolate(frame, [exitStart, totalDuration], [0, 1])

  const exitStyle = getExitStyle(type, progress)

  return (
    <Fill style={exitStyle}>
      {children}
    </Fill>
  )
}

function getExitStyle(
  type: TransitionType,
  progress: number,
): React.CSSProperties {
  switch (type) {
    case 'crossfade':
      return { opacity: 1 - progress }

    case 'wipe-left':
    case 'wipe-right':
    case 'zoom-in':
    case 'zoom-out':
    case 'slide-up':
      // For non-crossfade transitions, the incoming scene covers the outgoing
      // scene, so we just keep the outgoing at full opacity
      return { opacity: 1 }

    default:
      return {}
  }
}
