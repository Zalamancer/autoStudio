import { useMemo, memo} from 'react'
import { useVoiceStore, useTimelineStore } from '@/stores'
import type { EmotionEvent } from '@/services/emotionTimeline'
import { getCurvatureFromEmotion } from '@/services/emotionMapping'

interface EmotionTrackProps {
  pixelsPerFrame: number
}

/**
 * Color mapping for emotion categories.
 * Each emotion maps to a background color and text color for the timeline segment.
 */
const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
  // Happy / Joy family (amber/yellow)
  Joy: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Happy: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Satisfaction: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Amusement: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Laughter: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Excited: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Pleased: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Delighted: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Content: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  Cheerful: { bg: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },

  // Sad / Sadness family (blue)
  Sadness: { bg: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  Sad: { bg: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  Dejection: { bg: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  Melancholy: { bg: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  Grief: { bg: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  Disappointed: { bg: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  Hurt: { bg: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },

  // Angry / Anger family (red)
  Anger: { bg: 'rgba(239, 68, 68, 0.35)', text: '#f87171', border: 'rgba(239, 68, 68, 0.6)' },
  Angry: { bg: 'rgba(239, 68, 68, 0.35)', text: '#f87171', border: 'rgba(239, 68, 68, 0.6)' },
  Sternness: { bg: 'rgba(239, 68, 68, 0.35)', text: '#f87171', border: 'rgba(239, 68, 68, 0.6)' },
  Indignation: { bg: 'rgba(239, 68, 68, 0.35)', text: '#f87171', border: 'rgba(239, 68, 68, 0.6)' },
  Rage: { bg: 'rgba(239, 68, 68, 0.35)', text: '#f87171', border: 'rgba(239, 68, 68, 0.6)' },
  Frustrated: { bg: 'rgba(239, 68, 68, 0.35)', text: '#f87171', border: 'rgba(239, 68, 68, 0.6)' },

  // Surprise family (orange)
  Surprise: { bg: 'rgba(249, 115, 22, 0.35)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },
  Surprised: { bg: 'rgba(249, 115, 22, 0.35)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },
  Alertness: { bg: 'rgba(249, 115, 22, 0.35)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },
  Wonder: { bg: 'rgba(249, 115, 22, 0.35)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },
  Shock: { bg: 'rgba(249, 115, 22, 0.35)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },

  // Fear family (purple)
  Fear: { bg: 'rgba(168, 85, 247, 0.35)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' },
  Concern: { bg: 'rgba(168, 85, 247, 0.35)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' },
  Anxiety: { bg: 'rgba(168, 85, 247, 0.35)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' },
  Terror: { bg: 'rgba(168, 85, 247, 0.35)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' },
  Worried: { bg: 'rgba(168, 85, 247, 0.35)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' },

  // Disgust family (green)
  Disgust: { bg: 'rgba(34, 197, 94, 0.35)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.6)' },
  Disdain: { bg: 'rgba(34, 197, 94, 0.35)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.6)' },
  Aversion: { bg: 'rgba(34, 197, 94, 0.35)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.6)' },
  Revulsion: { bg: 'rgba(34, 197, 94, 0.35)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.6)' },

  // Neutral (gray)
  Neutral: { bg: 'rgba(113, 113, 122, 0.3)', text: '#a1a1aa', border: 'rgba(113, 113, 122, 0.5)' },
}

/**
 * Get color scheme for an emotion string.
 * Falls back to curvature-based coloring if no exact match found.
 */
function getEmotionColor(emotion: string): { bg: string; text: string; border: string } {
  // Direct lookup
  if (emotionColors[emotion]) {
    return emotionColors[emotion]
  }

  // Fallback: determine color from mouth curvature category
  const curvature = getCurvatureFromEmotion(emotion)
  switch (curvature) {
    case 'upward':
      return emotionColors.Joy
    case 'downward': {
      // Check if it's more fear-like or sadness-like by looking at the emotion name
      const lower = emotion.toLowerCase()
      if (lower.includes('fear') || lower.includes('terror') || lower.includes('anxiety') || lower.includes('worried') || lower.includes('nervous')) {
        return emotionColors.Fear
      }
      if (lower.includes('disgust') || lower.includes('gross') || lower.includes('revuls')) {
        return emotionColors.Disgust
      }
      return emotionColors.Sadness
    }
    case 'neutral':
    default: {
      const lower = emotion.toLowerCase()
      if (lower.includes('anger') || lower.includes('angry') || lower.includes('rage') || lower.includes('furious')) {
        return emotionColors.Anger
      }
      if (lower.includes('surprise') || lower.includes('shock') || lower.includes('wonder')) {
        return emotionColors.Surprise
      }
      return emotionColors.Neutral
    }
  }
}

/**
 * Parse expression cues from script text without word timing data.
 * Estimates positions by distributing evenly across the total frames.
 * Used as a fallback when no emotion timeline exists but a script has cues.
 */
function parseExpressionCuesFromScript(script: string, totalFrames: number): EmotionEvent[] {
  const EXPRESSION_CUE_REGEX = /\[([\w-]+)\]/g
  const cues: Array<{ emotion: string; charPos: number }> = []

  let match: RegExpExecArray | null
  while ((match = EXPRESSION_CUE_REGEX.exec(script)) !== null) {
    const emotionRaw = match[1]
    const emotion = emotionRaw.charAt(0).toUpperCase() + emotionRaw.slice(1).toLowerCase()
    cues.push({ emotion, charPos: match.index })
  }

  if (cues.length === 0) return []

  // Estimate frame positions based on character position ratio within the script
  const scriptLength = script.length
  const events: EmotionEvent[] = []

  for (let i = 0; i < cues.length; i++) {
    const ratio = cues[i].charPos / scriptLength
    const startFrame = Math.round(ratio * totalFrames)
    const endFrame = i + 1 < cues.length
      ? Math.round((cues[i + 1].charPos / scriptLength) * totalFrames)
      : totalFrames

    if (endFrame > startFrame) {
      events.push({
        emotion: cues[i].emotion,
        startFrame,
        endFrame,
      })
    }
  }

  return events
}

/**
 * EmotionTrack renders a thin, non-interactive row in the timeline that
 * shows colored segments for each emotion event. It reads from the voice
 * store's activeEmotionTimeline. If that is empty but a script with
 * expression cues exists, it falls back to parsing cues and estimating positions.
 */
export const EmotionTrack = memo(function EmotionTrack({ pixelsPerFrame }: EmotionTrackProps) {
  const activeEmotionTimeline = useVoiceStore((s) => s.activeEmotionTimeline)
  const script = useVoiceStore((s) => s.script)
  const activeVoiceId = useVoiceStore((s) => s.activeVoiceId)
  const generatedVoices = useVoiceStore((s) => s.generatedVoices)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  // Determine which emotion timeline to display
  const emotionEvents: EmotionEvent[] = useMemo(() => {
    // Primary: use the store's active emotion timeline
    if (activeEmotionTimeline.length > 0) {
      return activeEmotionTimeline
    }

    // Fallback: check the active voice's raw script for expression cues
    const activeVoice = generatedVoices.find((v) => v.id === activeVoiceId)
    const rawScript = activeVoice?.script || script

    if (rawScript && /\[[\w-]+\]/.test(rawScript)) {
      return parseExpressionCuesFromScript(rawScript, totalFrames)
    }

    return []
  }, [activeEmotionTimeline, activeVoiceId, generatedVoices, script, totalFrames])

  // Don't render anything if there are no emotion events
  if (emotionEvents.length === 0) {
    return null
  }

  return (
    <div className="flex border-b border-zinc-700/50" style={{ height: 24 }}>
      {/* Track Header */}
      <div className="w-40 flex-shrink-0 flex items-center gap-1 px-2 bg-zinc-800 border-r border-zinc-700/50 sticky left-0 z-10">
        {/* Emotion indicator dot */}
        <div className="w-2 h-2 rounded-full bg-amber-500/70 mr-1 flex-shrink-0" />
        <span className="text-[10px] text-zinc-500 truncate select-none">
          Emotions
        </span>
      </div>

      {/* Emotion Segments */}
      <div className="flex-1 relative bg-zinc-900/30">
        {emotionEvents.map((event, index) => {
          const left = event.startFrame * pixelsPerFrame
          const width = (event.endFrame - event.startFrame) * pixelsPerFrame
          const colors = getEmotionColor(event.emotion)

          return (
            <div
              key={`${event.emotion}-${event.startFrame}-${index}`}
              className="absolute top-0.5 bottom-0.5 rounded-sm overflow-hidden pointer-events-none select-none"
              style={{
                left,
                width: Math.max(width, 8),
                backgroundColor: colors.bg,
                borderLeft: `2px solid ${colors.border}`,
              }}
            >
              {/* Emotion label - only show if segment is wide enough */}
              {width > 30 && (
                <span
                  className="absolute inset-0 flex items-center px-1.5 text-[9px] font-medium truncate leading-none"
                  style={{ color: colors.text }}
                >
                  {event.emotion}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
