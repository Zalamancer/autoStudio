/**
 * RemotionTransitionLayer — Renders clip transitions (in/out) during export.
 *
 * Reads the ClipTransitionExportData[] array and renders full-screen transition
 * overlays (opacity, clip-path, scale, blur, etc.) at each clip's start/end
 * boundaries. Each transition animates over its configured duration in frames.
 *
 * Transition types are mapped from the timeline's TransitionType (fade-in,
 * slide-left, etc.) to the rendering logic in SceneTransition.tsx's approach,
 * plus support for the types defined in src/types/transitions.ts.
 */
import React from 'react'
import { Fill, useFrame, interpolate } from '@/engine'
import type { ClipTransitionExportData } from './types'

interface RemotionTransitionLayerProps {
  clipTransitions: ClipTransitionExportData[]
  width: number
  height: number
}

export function RemotionTransitionLayer({
  clipTransitions,
  width,
  height,
}: RemotionTransitionLayerProps) {
  const frame = useFrame()

  return (
    <>
      {clipTransitions.map((ct) => (
        <ClipTransitionRenderer
          key={ct.clipId}
          data={ct}
          frame={frame}
          width={width}
          height={height}
        />
      ))}
    </>
  )
}

function ClipTransitionRenderer({
  data,
  frame,
  width: _width,
  height: _height,
}: {
  data: ClipTransitionExportData
  frame: number
  width: number
  height: number
}) {
  const elements: React.ReactNode[] = []

  // ── Transition In ──
  if (data.transitionIn && data.transitionIn.durationFrames > 0) {
    const { type, durationFrames } = data.transitionIn
    const transStart = data.startFrame
    const transEnd = transStart + durationFrames

    if (frame >= transStart && frame < transEnd) {
      const progress = interpolate(frame, [transStart, transEnd], [0, 1])
      const style = getTransitionInStyle(type, progress, frame - transStart)

      elements.push(
        <Fill
          key={`${data.clipId}-in`}
          style={{
            zIndex: 9999,
            pointerEvents: 'none',
            ...style,
          }}
        />
      )
    }
  }

  // ── Transition Out ──
  if (data.transitionOut && data.transitionOut.durationFrames > 0) {
    const { type, durationFrames } = data.transitionOut
    const transEnd = data.endFrame
    const transStart = transEnd - durationFrames

    if (frame >= transStart && frame < transEnd) {
      const progress = interpolate(frame, [transStart, transEnd], [0, 1])
      const style = getTransitionOutStyle(type, progress, frame - transStart)

      elements.push(
        <Fill
          key={`${data.clipId}-out`}
          style={{
            zIndex: 9999,
            pointerEvents: 'none',
            ...style,
          }}
        />
      )
    }
  }

  if (elements.length === 0) return null
  return <>{elements}</>
}

// ─── Transition In Styles ──────────────────────────────────────────────────────
// These render a covering overlay that fades/wipes AWAY to reveal the scene.
// At progress=0, the overlay fully obscures; at progress=1 it's gone.

function getTransitionInStyle(
  type: string,
  progress: number,
  localFrame: number,
): React.CSSProperties {
  switch (type) {
    case 'fade-in': {
      // Black overlay fading out
      return {
        backgroundColor: 'black',
        opacity: 1 - progress,
      }
    }

    case 'dissolve':
    case 'crossfade': {
      return {
        backgroundColor: 'black',
        opacity: 1 - progress,
      }
    }

    case 'slide-left': {
      // Black panel sliding off to the left
      const translateX = interpolate(progress, [0, 1], [0, -100])
      return {
        backgroundColor: 'black',
        transform: `translateX(${translateX}%)`,
      }
    }

    case 'slide-right': {
      const translateX = interpolate(progress, [0, 1], [0, 100])
      return {
        backgroundColor: 'black',
        transform: `translateX(${translateX}%)`,
      }
    }

    case 'slide-up': {
      const translateY = interpolate(progress, [0, 1], [0, -100])
      return {
        backgroundColor: 'black',
        transform: `translateY(${translateY}%)`,
      }
    }

    case 'slide-down': {
      const translateY = interpolate(progress, [0, 1], [0, 100])
      return {
        backgroundColor: 'black',
        transform: `translateY(${translateY}%)`,
      }
    }

    case 'zoom-in': {
      const scale = interpolate(progress, [0, 1], [1, 3])
      return {
        backgroundColor: 'black',
        opacity: 1 - progress,
        transform: `scale(${scale})`,
      }
    }

    case 'zoom-out': {
      const scale = interpolate(progress, [0, 1], [1, 0])
      return {
        backgroundColor: 'black',
        opacity: 1 - progress,
        transform: `scale(${scale})`,
      }
    }

    case 'wipe-left': {
      // Black panel wiping off to the left via clip-path
      return {
        backgroundColor: 'black',
        clipPath: `inset(0 0 0 ${progress * 100}%)`,
      }
    }

    case 'wipe-right': {
      return {
        backgroundColor: 'black',
        clipPath: `inset(0 ${progress * 100}% 0 0)`,
      }
    }

    case 'cut': {
      // No visual transition
      return { display: 'none' }
    }

    // ── Cinematic transitions ──

    case 'morph': {
      const blur = interpolate(progress, [0, 0.5, 1], [8, 4, 0])
      return {
        backgroundColor: 'black',
        opacity: 1 - progress,
        filter: `blur(${blur}px)`,
      }
    }

    case 'glitch': {
      const seed = localFrame * 9301 + 49297
      const seededRand1 = ((seed % 233280) / 233280) * 10
      const seededRand2 = (((seed * 7 + 12345) % 233280) / 233280) * 10
      const glitchOpacity = interpolate(progress, [0, 0.2, 0.8, 1], [1, 0.8, 0.2, 0])
      const glitchOffset = interpolate(progress, [0, 0.3, 0.6, 1], [20, -10, 5, 0])
      return {
        backgroundColor: 'black',
        opacity: glitchOpacity,
        transform: `translateX(${glitchOffset}px)`,
        clipPath: progress < 0.5
          ? `inset(${seededRand1}% 0 ${seededRand2}% 0)`
          : 'none',
      }
    }

    case 'whip-pan': {
      const translateX = interpolate(progress, [0, 1], [0, -100])
      const blur = interpolate(progress, [0, 0.5, 1], [0, 30, 0])
      return {
        backgroundColor: 'black',
        transform: `translateX(${translateX}%)`,
        filter: `blur(${blur}px)`,
      }
    }

    case 'light-leak': {
      const leakOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.6, 0.3, 0])
      return {
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        opacity: leakOpacity,
        boxShadow: `inset 0 0 ${200 * leakOpacity}px ${100 * leakOpacity}px rgba(255, 215, 0, ${leakOpacity})`,
      }
    }

    case 'parallax-slide': {
      const translateX = interpolate(progress, [0, 1], [0, -100])
      return {
        backgroundColor: 'black',
        opacity: 1 - progress,
        transform: `translateX(${translateX}%)`,
      }
    }

    case 'dramatic-zoom': {
      const scale = interpolate(progress, [0, 0.5, 1], [1, 1.5, 3])
      const blur = interpolate(progress, [0, 0.5, 1], [0, 6, 12])
      return {
        backgroundColor: 'black',
        opacity: interpolate(progress, [0, 0.3, 1], [1, 0.5, 0]),
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
      }
    }

    case 'ink-wash': {
      // Circle clip-path expanding from center — reveals content underneath
      const radius = interpolate(progress, [0, 1], [0, 150])
      return {
        backgroundColor: 'black',
        clipPath: `circle(${Math.max(0, 100 - radius)}% at 50% 50%)`,
      }
    }

    default:
      return { display: 'none' }
  }
}

// ─── Transition Out Styles ─────────────────────────────────────────────────────
// These render a covering overlay that fades/wipes IN to obscure the scene.
// At progress=0, the overlay is invisible; at progress=1 it fully covers.

function getTransitionOutStyle(
  type: string,
  progress: number,
  localFrame: number,
): React.CSSProperties {
  switch (type) {
    case 'fade-out': {
      return {
        backgroundColor: 'black',
        opacity: progress,
      }
    }

    case 'dissolve':
    case 'crossfade': {
      return {
        backgroundColor: 'black',
        opacity: progress,
      }
    }

    case 'slide-left': {
      const translateX = interpolate(progress, [0, 1], [100, 0])
      return {
        backgroundColor: 'black',
        transform: `translateX(${translateX}%)`,
      }
    }

    case 'slide-right': {
      const translateX = interpolate(progress, [0, 1], [-100, 0])
      return {
        backgroundColor: 'black',
        transform: `translateX(${translateX}%)`,
      }
    }

    case 'slide-up': {
      const translateY = interpolate(progress, [0, 1], [-100, 0])
      return {
        backgroundColor: 'black',
        transform: `translateY(${translateY}%)`,
      }
    }

    case 'slide-down': {
      const translateY = interpolate(progress, [0, 1], [100, 0])
      return {
        backgroundColor: 'black',
        transform: `translateY(${translateY}%)`,
      }
    }

    case 'zoom-in': {
      const scale = interpolate(progress, [0, 1], [3, 1])
      return {
        backgroundColor: 'black',
        opacity: progress,
        transform: `scale(${scale})`,
      }
    }

    case 'zoom-out': {
      const scale = interpolate(progress, [0, 1], [0, 1])
      return {
        backgroundColor: 'black',
        opacity: progress,
        transform: `scale(${scale})`,
      }
    }

    case 'wipe-left': {
      return {
        backgroundColor: 'black',
        clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
      }
    }

    case 'wipe-right': {
      return {
        backgroundColor: 'black',
        clipPath: `inset(0 0 0 ${(1 - progress) * 100}%)`,
      }
    }

    case 'cut': {
      return { display: 'none' }
    }

    // ── Cinematic transitions ──

    case 'morph': {
      const blur = interpolate(progress, [0, 0.5, 1], [0, 4, 8])
      return {
        backgroundColor: 'black',
        opacity: progress,
        filter: `blur(${blur}px)`,
      }
    }

    case 'glitch': {
      const seed = localFrame * 9301 + 49297
      const seededRand1 = ((seed % 233280) / 233280) * 10
      const seededRand2 = (((seed * 7 + 12345) % 233280) / 233280) * 10
      const glitchOpacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 0.2, 0.8, 1])
      const glitchOffset = interpolate(progress, [0, 0.3, 0.6, 1], [0, 5, -10, 20])
      return {
        backgroundColor: 'black',
        opacity: glitchOpacity,
        transform: `translateX(${glitchOffset}px)`,
        clipPath: progress > 0.5
          ? `inset(${seededRand1}% 0 ${seededRand2}% 0)`
          : 'none',
      }
    }

    case 'whip-pan': {
      const translateX = interpolate(progress, [0, 1], [100, 0])
      const blur = interpolate(progress, [0, 0.5, 1], [0, 30, 0])
      return {
        backgroundColor: 'black',
        transform: `translateX(${translateX}%)`,
        filter: `blur(${blur}px)`,
      }
    }

    case 'light-leak': {
      const leakOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.3, 0.6, 0])
      const fadeOpacity = interpolate(progress, [0, 0.5, 1], [0, 0.2, 1])
      return {
        backgroundColor: `rgba(255, 215, 0, ${leakOpacity * 0.5})`,
        opacity: Math.max(leakOpacity, fadeOpacity),
        boxShadow: `inset 0 0 ${200 * leakOpacity}px ${100 * leakOpacity}px rgba(255, 215, 0, ${leakOpacity})`,
      }
    }

    case 'parallax-slide': {
      const translateX = interpolate(progress, [0, 1], [100, 0])
      return {
        backgroundColor: 'black',
        opacity: progress,
        transform: `translateX(${translateX}%)`,
      }
    }

    case 'dramatic-zoom': {
      const scale = interpolate(progress, [0, 0.5, 1], [3, 1.5, 1])
      const blur = interpolate(progress, [0, 0.5, 1], [12, 6, 0])
      return {
        backgroundColor: 'black',
        opacity: interpolate(progress, [0, 0.7, 1], [0, 0.5, 1]),
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
      }
    }

    case 'ink-wash': {
      const radius = interpolate(progress, [0, 1], [150, 0])
      return {
        backgroundColor: 'black',
        clipPath: `circle(${Math.max(0, radius)}% at 50% 50%)`,
      }
    }

    default:
      return { display: 'none' }
  }
}
