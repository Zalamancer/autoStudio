import React from 'react'
import type { MotionGraphicProps } from '@/types/motionGraphic'

export interface KineticBaseConfig {
  words: string[]
  colors: string[]
  bgColor: string
  cycleDuration: number // seconds per full word cycle
}

export interface WordRenderProps {
  word: string
  color: string
  enterProgress: number // 0..1
  holdProgress: number // 0..1
  exitProgress: number // 0..1
  phase: 'enter' | 'hold' | 'exit'
  index: number
  width: number
  height: number
  frame?: number
  /** Extra optional props that some templates use when rendered outside KineticBase */
  fps?: number
  config?: Record<string, unknown>
  frameNumber?: number
  _holdProgress?: number
  _index?: number
}

export interface BackgroundRenderProps {
  width: number
  height: number
  frame: number
  fps: number
  bgColor: string
  progress: number
  /** Extra optional progress props for backgrounds that need word-phase info */
  enterProgress?: number
  holdProgress?: number
  exitProgress?: number
  /** Extra optional config prop for backgrounds that need template-specific config */
  config?: Record<string, unknown>
}

export interface KineticAnimation {
  renderWord: (props: WordRenderProps) => React.ReactNode
  renderBackground?: (props: BackgroundRenderProps) => React.ReactNode
}

/**
 * Shared base for all kinetic typography templates.
 * Handles word cycling, timing, and phase calculations.
 * Each template provides its unique rendering logic via KineticAnimation.
 */
export function KineticBase<TConfig extends KineticBaseConfig>({
  config,
  frame,
  fps,
  width,
  height,
  progress,
  animation,
}: MotionGraphicProps<TConfig> & { animation: KineticAnimation }) {
  const { words, colors, bgColor, cycleDuration } = config
  if (!words || !Array.isArray(words) || words.length === 0) return null
  if (!colors || !Array.isArray(colors) || colors.length === 0) return null
  const totalWords = words.length

  // Calculate which word is active and its phase
  const timeSeconds = frame / fps
  const totalCycleDuration = cycleDuration * totalWords
  const cycleTime = totalCycleDuration > 0 ? timeSeconds % totalCycleDuration : 0
  const wordIndex = Math.min(Math.floor(cycleTime / cycleDuration), totalWords - 1)
  const wordTime = cycleTime - wordIndex * cycleDuration

  // Phase timing: 20% enter, 60% hold, 20% exit
  const enterDuration = cycleDuration * 0.2
  const holdDuration = cycleDuration * 0.6
  const exitDuration = cycleDuration * 0.2

  let phase: 'enter' | 'hold' | 'exit'
  let enterProgress = 0
  let holdProgress = 0
  let exitProgress = 0

  if (wordTime < enterDuration) {
    phase = 'enter'
    enterProgress = wordTime / enterDuration
  } else if (wordTime < enterDuration + holdDuration) {
    phase = 'hold'
    enterProgress = 1
    holdProgress = (wordTime - enterDuration) / holdDuration
  } else {
    phase = 'exit'
    enterProgress = 1
    holdProgress = 1
    exitProgress = (wordTime - enterDuration - holdDuration) / exitDuration
  }

  const word = words[wordIndex] ?? ''
  const color = colors[wordIndex % colors.length] ?? '#ffffff'

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      {animation.renderBackground?.({
        width,
        height,
        frame,
        fps,
        bgColor,
        progress,
      })}
      <div style={{ position: 'absolute', inset: 0 }}>
        {animation.renderWord({
          word,
          color,
          enterProgress,
          holdProgress,
          exitProgress,
          phase,
          index: wordIndex,
          width,
          height,
        })}
      </div>
    </div>
  )
}
