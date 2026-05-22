/**
 * Lyrics Parser — Parse time-aligned lyrics formats (LRC, SRT).
 *
 * Returns LyricLine[] with startTime, endTime, text, and optional word-level timing.
 */

import type { LyricLine, LyricWord } from '@/types/voice'

/**
 * Parse LRC format lyrics (common karaoke format).
 * Format: [mm:ss.xx] lyrics text
 */
export function parseLRC(text: string): LyricLine[] {
  const lines: LyricLine[] = []
  const rawLines = text.split('\n').filter((l) => l.trim())

  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/

  for (const raw of rawLines) {
    const match = raw.match(timeRegex)
    if (!match) continue

    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)
    const hundredths = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) / 1000 : 0
    const startTime = minutes * 60 + seconds + hundredths

    // Extract text after the timestamp
    const lyricText = raw.replace(timeRegex, '').trim()
    if (!lyricText) continue

    lines.push({
      startTime,
      endTime: startTime, // Will be filled in post-processing
      text: lyricText,
    })
  }

  // Fill in end times from next line's start time
  for (let i = 0; i < lines.length; i++) {
    if (i < lines.length - 1) {
      lines[i].endTime = lines[i + 1].startTime
    } else {
      // Last line: estimate 3 seconds
      lines[i].endTime = lines[i].startTime + 3
    }
  }

  return lines
}

/**
 * Parse SRT format lyrics/subtitles.
 * Format:
 * 1
 * 00:00:01,000 --> 00:00:04,000
 * lyrics text
 */
export function parseSRT(text: string): LyricLine[] {
  const lines: LyricLine[] = []
  const blocks = text.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const blockLines = block.split('\n')
    if (blockLines.length < 3) continue

    // Parse timestamp line
    const timeMatch = blockLines[1].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/,
    )
    if (!timeMatch) continue

    const startTime =
      parseInt(timeMatch[1], 10) * 3600 +
      parseInt(timeMatch[2], 10) * 60 +
      parseInt(timeMatch[3], 10) +
      parseInt(timeMatch[4], 10) / 1000

    const endTime =
      parseInt(timeMatch[5], 10) * 3600 +
      parseInt(timeMatch[6], 10) * 60 +
      parseInt(timeMatch[7], 10) +
      parseInt(timeMatch[8], 10) / 1000

    // Text is everything after the timestamp line
    const lyricText = blockLines.slice(2).join(' ').trim()
    if (!lyricText) continue

    // Split into words with estimated timing
    const wordTexts = lyricText.split(/\s+/).filter(Boolean)
    const wordDuration = (endTime - startTime) / Math.max(wordTexts.length, 1)

    const words: LyricWord[] = wordTexts.map((w, i) => ({
      text: w,
      startTime: startTime + i * wordDuration,
      endTime: startTime + (i + 1) * wordDuration,
    }))

    lines.push({
      startTime,
      endTime,
      text: lyricText,
      words,
    })
  }

  return lines
}

/**
 * Auto-detect format and parse lyrics.
 */
export function parseLyrics(text: string): LyricLine[] {
  // Detect SRT by looking for --> pattern
  if (text.includes('-->')) {
    return parseSRT(text)
  }

  // Default to LRC
  return parseLRC(text)
}
