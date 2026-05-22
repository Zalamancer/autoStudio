/**
 * SRT/VTT Subtitle Export Service
 *
 * Converts WordEvent[] timing data (from ElevenLabs alignment) into
 * standard subtitle file formats for YouTube, TikTok, and accessibility.
 */

import type { WordEvent } from '@/types/voice'

// ── Types ──

export interface SubtitleLine {
  index: number
  startTime: number // seconds
  endTime: number   // seconds
  text: string
  speaker?: string
}

interface DialogueLineInfo {
  characterName: string
  script: string
  startFrame: number
  endFrame: number
  wordTimeline: WordEvent[]
}

// ── Time Formatting ──

/** Format seconds as SRT timestamp: HH:MM:SS,mmm */
function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad3(ms)}`
}

/** Format seconds as VTT timestamp: HH:MM:SS.mmm */
function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad3(ms)}`
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0')
}

// ── Subtitle Line Building ──

/**
 * Group word events into subtitle lines.
 * Groups by sentence boundaries or max N words per line.
 */
function buildSubtitleLines(
  words: WordEvent[],
  speaker?: string,
  maxWordsPerLine: number = 8,
  globalTimeOffset: number = 0,
): SubtitleLine[] {
  if (words.length === 0) return []

  const lines: SubtitleLine[] = []
  let lineWords: WordEvent[] = []
  let lineIndex = 1

  for (const word of words) {
    lineWords.push(word)

    const isSentenceEnd = /[.!?]$/.test(word.word)
    const isMaxWords = lineWords.length >= maxWordsPerLine

    if (isSentenceEnd || isMaxWords) {
      lines.push({
        index: lineIndex++,
        startTime: lineWords[0].startTime + globalTimeOffset,
        endTime: lineWords[lineWords.length - 1].endTime + globalTimeOffset,
        text: lineWords.map(w => w.word).join(' '),
        speaker,
      })
      lineWords = []
    }
  }

  // Flush remaining words
  if (lineWords.length > 0) {
    lines.push({
      index: lineIndex++,
      startTime: lineWords[0].startTime + globalTimeOffset,
      endTime: lineWords[lineWords.length - 1].endTime + globalTimeOffset,
      text: lineWords.map(w => w.word).join(' '),
      speaker,
    })
  }

  return lines
}

/**
 * Build subtitle lines from multi-character dialogue data.
 * Each dialogue line gets speaker attribution.
 */
export function buildMultiCharacterSubtitleLines(
  dialogueLines: DialogueLineInfo[],
  fps: number,
): SubtitleLine[] {
  const allLines: SubtitleLine[] = []
  let globalIndex = 1

  for (const dl of dialogueLines) {
    const timeOffset = dl.startFrame / fps

    if (dl.wordTimeline.length > 0) {
      const lines = buildSubtitleLines(dl.wordTimeline, dl.characterName, 8, timeOffset)
      for (const line of lines) {
        line.index = globalIndex++
        allLines.push(line)
      }
    } else {
      // No word timeline — use frame timing with full script
      const cleanScript = dl.script.replace(/\[[\w-]+\]/g, '').trim()
      if (cleanScript) {
        allLines.push({
          index: globalIndex++,
          startTime: dl.startFrame / fps,
          endTime: dl.endFrame / fps,
          text: cleanScript,
          speaker: dl.characterName,
        })
      }
    }
  }

  // Sort by start time
  allLines.sort((a, b) => a.startTime - b.startTime)

  // Re-index
  allLines.forEach((line, i) => { line.index = i + 1 })

  return allLines
}

// ── SRT Export ──

/**
 * Generate SRT subtitle content from word events.
 * Single-character mode (no speaker labels).
 */
export function generateSRT(words: WordEvent[]): string {
  const lines = buildSubtitleLines(words)
  return lines.map(line =>
    `${line.index}\n${formatSRTTime(line.startTime)} --> ${formatSRTTime(line.endTime)}\n${line.text}\n`
  ).join('\n')
}

/**
 * Generate SRT with multi-character speaker labels.
 */
export function generateMultiCharacterSRT(
  dialogueLines: DialogueLineInfo[],
  fps: number,
): string {
  const lines = buildMultiCharacterSubtitleLines(dialogueLines, fps)
  const hasMultipleSpeakers = new Set(lines.map(l => l.speaker).filter(Boolean)).size > 1

  return lines.map(line => {
    const speakerPrefix = hasMultipleSpeakers && line.speaker ? `[${line.speaker}] ` : ''
    return `${line.index}\n${formatSRTTime(line.startTime)} --> ${formatSRTTime(line.endTime)}\n${speakerPrefix}${line.text}\n`
  }).join('\n')
}

// ── VTT Export ──

/**
 * Generate WebVTT subtitle content from word events.
 * Single-character mode.
 */
export function generateVTT(words: WordEvent[]): string {
  const lines = buildSubtitleLines(words)
  const header = 'WEBVTT\n\n'
  return header + lines.map(line =>
    `${line.index}\n${formatVTTTime(line.startTime)} --> ${formatVTTTime(line.endTime)}\n${line.text}\n`
  ).join('\n')
}

/**
 * Generate WebVTT with multi-character speaker labels.
 */
export function generateMultiCharacterVTT(
  dialogueLines: DialogueLineInfo[],
  fps: number,
): string {
  const lines = buildMultiCharacterSubtitleLines(dialogueLines, fps)
  const hasMultipleSpeakers = new Set(lines.map(l => l.speaker).filter(Boolean)).size > 1

  const header = 'WEBVTT\n\n'
  return header + lines.map(line => {
    const speakerTag = hasMultipleSpeakers && line.speaker
      ? `<v ${line.speaker}>`
      : ''
    return `${line.index}\n${formatVTTTime(line.startTime)} --> ${formatVTTTime(line.endTime)}\n${speakerTag}${line.text}\n`
  }).join('\n')
}

// ── Download Helpers ──

/** Trigger browser download of a text file */
export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Download SRT file */
export function downloadSRT(content: string, projectName?: string): void {
  const filename = `${projectName || 'subtitles'}.srt`
  downloadTextFile(content, filename, 'text/plain')
}

/** Download VTT file */
export function downloadVTT(content: string, projectName?: string): void {
  const filename = `${projectName || 'subtitles'}.vtt`
  downloadTextFile(content, filename, 'text/vtt')
}
