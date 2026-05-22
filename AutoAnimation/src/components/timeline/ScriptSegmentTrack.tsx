import { useMemo, memo} from 'react'
import { useVoiceStore, useTimelineStore } from '@/stores'
import { TrackShell } from './TrackShell'

interface ScriptSegmentTrackProps {
  pixelsPerFrame: number
}

/**
 * A parsed segment from the Gemini script output.
 * Each segment represents an [expression] cue and its following text,
 * or a leading text segment before the first cue.
 */
interface ScriptSegment {
  id: string
  cue: string | null // null for text before the first cue
  text: string // the spoken text for this segment
  startFrame: number
  endFrame: number
}

/**
 * Color palette for script segments. Each segment gets a unique color
 * from this rotating palette so they are visually distinguishable.
 */
const SEGMENT_COLORS = [
  { bg: 'rgba(139, 92, 246, 0.30)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.6)' }, // violet
  { bg: 'rgba(59, 130, 246, 0.30)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' }, // blue
  { bg: 'rgba(16, 185, 129, 0.30)', text: '#34d399', border: 'rgba(16, 185, 129, 0.6)' }, // emerald
  { bg: 'rgba(245, 158, 11, 0.30)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' }, // amber
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' }, // pink
  { bg: 'rgba(249, 115, 22, 0.30)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' }, // orange
  { bg: 'rgba(6, 182, 212, 0.30)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.6)' },   // cyan
  { bg: 'rgba(168, 85, 247, 0.30)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' }, // purple
]

/**
 * Parse the raw script (with [expression] cues) into segments.
 * Each segment = one cue + the spoken text following it.
 * Text before the first cue is a separate segment with cue = null.
 */
function parseScriptSegments(script: string): Array<{ cue: string | null; text: string }> {
  if (!script) return []

  const CUE_REGEX = /\[([\w-]+)\]/g
  const segments: Array<{ cue: string | null; text: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  CUE_REGEX.lastIndex = 0
  while ((match = CUE_REGEX.exec(script)) !== null) {
    // Text before this cue (or between previous cue and this one)
    const textBefore = script.slice(lastIndex, match.index).trim()
    if (textBefore && segments.length === 0) {
      // Leading text before any cue
      segments.push({ cue: null, text: textBefore })
    }

    lastIndex = match.index + match[0].length

    // Capture the cue name
    const cueName = match[1]

    // Find text after this cue until the next cue or end of string
    const nextMatch = CUE_REGEX.exec(script)
    let textAfter: string
    if (nextMatch) {
      textAfter = script.slice(lastIndex, nextMatch.index).trim()
      // Reset regex to re-process this next match in the next iteration
      CUE_REGEX.lastIndex = nextMatch.index
    } else {
      textAfter = script.slice(lastIndex).trim()
    }

    if (cueName || textAfter) {
      segments.push({ cue: cueName, text: textAfter })
    }
  }

  // If no cues found at all, treat the whole script as one segment
  if (segments.length === 0 && script.trim()) {
    segments.push({ cue: null, text: script.trim() })
  }

  return segments
}

/**
 * ScriptSegmentTrack renders one bar per script segment in the timeline.
 * Each segment corresponds to an [expression] cue and its following text
 * from the Gemini prompt output.
 *
 * When word timing is available (after voice generation), segments are
 * positioned using actual frame data. Otherwise, they are estimated by
 * distributing evenly based on character count ratios.
 */
export const ScriptSegmentTrack = memo(function ScriptSegmentTrack({ pixelsPerFrame }: ScriptSegmentTrackProps) {
  const script = useVoiceStore((s) => s.script)
  const activeWordTimeline = useVoiceStore((s) => s.activeWordTimeline)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const segments: ScriptSegment[] = useMemo(() => {
    if (!script.trim()) return []

    const parsed = parseScriptSegments(script)
    if (parsed.length <= 1 && !parsed[0]?.cue) return [] // Single segment with no cue, not interesting

    const hasWordTiming = activeWordTimeline.length > 0

    if (hasWordTiming) {
      // Map segments to frames using word timing
      return mapSegmentsToFrames(script, parsed, activeWordTimeline, totalFrames)
    } else {
      // Estimate frames from character positions
      return estimateSegmentFrames(parsed, totalFrames)
    }
  }, [script, activeWordTimeline, totalFrames])

  if (segments.length === 0) return null

  return (
    <>
      {segments.map((segment, index) => {
        const colors = SEGMENT_COLORS[index % SEGMENT_COLORS.length]
        const left = segment.startFrame * pixelsPerFrame
        const width = (segment.endFrame - segment.startFrame) * pixelsPerFrame
        const label = segment.cue
          ? `[${segment.cue}] ${segment.text}`
          : segment.text

        return (
          <TrackShell
            key={segment.id}
            color={colors.text}
            label={segment.cue ? `[${segment.cue}]` : `Seg ${index + 1}`}
          >
            <div
              className="absolute top-1 bottom-1 rounded overflow-hidden pointer-events-none select-none flex items-center px-2"
              style={{
                left,
                width: Math.max(width, 20),
                backgroundColor: colors.bg,
              }}
            >
              <span className="text-xs text-white/90 truncate font-medium">
                {label.length > 40 ? label.slice(0, 40) + '...' : label}
              </span>
            </div>
          </TrackShell>
        )
      })}
    </>
  )
})

/**
 * Map parsed segments to frame ranges using the word timing data.
 * Each segment's spoken text maps to a series of words in the word timeline.
 */
function mapSegmentsToFrames(
  _rawScript: string,
  parsed: Array<{ cue: string | null; text: string }>,
  wordTimeline: Array<{ word: string; startFrame: number; endFrame: number }>,
  totalFrames: number
): ScriptSegment[] {
  if (wordTimeline.length === 0 || parsed.length === 0) return []

  const lastFrame = Math.max(...wordTimeline.map((w) => w.endFrame), totalFrames)

  // Strategy: count the number of clean words in each segment,
  // then map consecutive word-timeline entries to each segment.
  const segmentWordCounts = parsed.map((seg) => {
    const words = seg.text.split(/\s+/).filter((w) => w.length > 0)
    return words.length
  })

  const segments: ScriptSegment[] = []
  let wordIndex = 0

  for (let i = 0; i < parsed.length; i++) {
    const seg = parsed[i]
    const wordCount = segmentWordCounts[i]

    if (wordCount === 0) {
      // Empty text segment (cue only, no spoken words)
      const startFrame = wordIndex < wordTimeline.length
        ? wordTimeline[wordIndex].startFrame
        : (segments.length > 0 ? segments[segments.length - 1].endFrame : 0)

      segments.push({
        id: `seg-${i}`,
        cue: seg.cue,
        text: seg.text,
        startFrame,
        endFrame: startFrame, // zero-width, will be merged or skipped
      })
      continue
    }

    const startWordIdx = Math.min(wordIndex, wordTimeline.length - 1)
    const endWordIdx = Math.min(wordIndex + wordCount - 1, wordTimeline.length - 1)

    const startFrame = wordTimeline[startWordIdx].startFrame
    const endFrame = i === parsed.length - 1
      ? lastFrame // Last segment extends to the end
      : wordTimeline[endWordIdx].endFrame

    segments.push({
      id: `seg-${i}`,
      cue: seg.cue,
      text: seg.text,
      startFrame,
      endFrame,
    })

    wordIndex += wordCount
  }

  // Filter out zero-width segments
  return segments.filter((s) => s.endFrame > s.startFrame)
}

/**
 * Estimate frame positions when no word timing is available.
 * Distributes segments proportionally based on their text length.
 */
function estimateSegmentFrames(
  parsed: Array<{ cue: string | null; text: string }>,
  totalFrames: number
): ScriptSegment[] {
  const totalChars = parsed.reduce((sum, seg) => sum + Math.max(seg.text.length, 1), 0)
  const segments: ScriptSegment[] = []
  let currentFrame = 0

  for (let i = 0; i < parsed.length; i++) {
    const seg = parsed[i]
    const charRatio = Math.max(seg.text.length, 1) / totalChars
    const durationFrames = Math.round(charRatio * totalFrames)
    const endFrame = i === parsed.length - 1 ? totalFrames : currentFrame + durationFrames

    segments.push({
      id: `seg-${i}`,
      cue: seg.cue,
      text: seg.text,
      startFrame: currentFrame,
      endFrame,
    })

    currentFrame = endFrame
  }

  return segments.filter((s) => s.endFrame > s.startFrame)
}
