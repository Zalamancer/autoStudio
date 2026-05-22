/**
 * Audio Quality Checker
 *
 * Analyzes audio composition for quality issues:
 * - Dialogue audibility (amplitude levels)
 * - Music vs dialogue balance
 * - Awkward silence detection
 * - Audio coverage across clip duration
 * - Clipping detection
 */

import type { QACheckResult, AudioQualityInput, AudioSegment } from '@/types/qualityAssurance'

// ── Dialogue Audibility ──

function checkDialogueAudibility(input: AudioQualityInput): QACheckResult {
  const { dialogueSegments } = input
  if (dialogueSegments.length === 0) {
    return {
      id: 'audio-dialogue-audibility',
      name: 'Dialogue Audibility',
      category: 'audio',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'No dialogue audio to check',
      autoFixable: false,
    }
  }

  // Filter out unmeasured segments (amplitude = -1) — skip rather than fake
  const measuredSegments = dialogueSegments.filter((s) => s.avgAmplitude >= 0 && s.peakAmplitude >= 0)
  if (measuredSegments.length === 0) {
    return {
      id: 'audio-dialogue-audibility',
      name: 'Dialogue Audibility',
      category: 'audio',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'Audio amplitude data not yet available — skipping audibility check',
      autoFixable: false,
    }
  }

  const quietSegments = measuredSegments.filter((s) => s.avgAmplitude < 0.15)
  const clippingSegments = measuredSegments.filter((s) => s.peakAmplitude > 0.95)

  let score = 100
  if (quietSegments.length > 0) {
    score -= quietSegments.length * 15
  }
  if (clippingSegments.length > 0) {
    score -= clippingSegments.length * 10
  }
  score = Math.max(0, score)

  const issues: string[] = []
  if (quietSegments.length > 0) issues.push(`${quietSegments.length} quiet dialogue segment(s)`)
  if (clippingSegments.length > 0) issues.push(`${clippingSegments.length} clipping segment(s)`)

  return {
    id: 'audio-dialogue-audibility',
    name: 'Dialogue Audibility',
    category: 'audio',
    status: issues.length === 0 ? 'pass' : score < 50 ? 'fail' : 'warning',
    severity: score < 50 ? 'critical' : 'warning',
    score: Math.round(score),
    description: issues.length === 0 ? 'All dialogue is at appropriate volume levels' : issues.join('; '),
    suggestion:
      quietSegments.length > 0
        ? 'Increase dialogue volume — some lines may be hard to hear'
        : clippingSegments.length > 0
          ? 'Reduce dialogue volume to prevent audio clipping'
          : undefined,
    autoFixable: false,
    metadata: {
      quietSegments: quietSegments.map((s) => ({ start: s.startTime, end: s.endTime })),
      clippingSegments: clippingSegments.map((s) => ({ start: s.startTime, end: s.endTime })),
    },
  }
}

// ── Music Balance ──

function checkMusicBalance(input: AudioQualityInput): QACheckResult {
  const { music, dialogueSegments } = input
  if (!music) {
    return {
      id: 'audio-music-balance',
      name: 'Music Balance',
      category: 'audio',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'No background music to check',
      autoFixable: false,
    }
  }

  if (dialogueSegments.length === 0) {
    // Music-only clip — just check volume
    const score = music.volume > 0.1 && music.volume < 0.9 ? 100 : 70
    return {
      id: 'audio-music-balance',
      name: 'Music Balance',
      category: 'audio',
      status: score >= 80 ? 'pass' : 'warning',
      severity: 'info',
      score,
      description: 'Music volume is acceptable for a music-only clip',
      autoFixable: false,
    }
  }

  // Music should be significantly quieter than dialogue
  // Recommended: music at 20-40% of dialogue level
  const avgDialogueAmp = dialogueSegments.reduce((s, d) => s + d.avgAmplitude, 0) / dialogueSegments.length
  const musicRelativeVolume = music.volume

  let score = 100
  if (musicRelativeVolume > 0.6) {
    // Music too loud relative to dialogue
    score = 40
  } else if (musicRelativeVolume > 0.4) {
    score = 70
  } else if (musicRelativeVolume < 0.05) {
    // Music too quiet to be useful
    score = 60
  }

  return {
    id: 'audio-music-balance',
    name: 'Music Balance',
    category: 'audio',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    severity: score < 50 ? 'critical' : 'warning',
    score: Math.round(score),
    description:
      score >= 80
        ? 'Music and dialogue are well-balanced'
        : musicRelativeVolume > 0.4
          ? 'Background music may overpower dialogue'
          : 'Background music is barely audible',
    suggestion:
      musicRelativeVolume > 0.4
        ? 'Lower background music volume to 20-30% to keep dialogue clear'
        : musicRelativeVolume < 0.05
          ? 'Increase music volume slightly — it adds emotional depth'
          : undefined,
    autoFixable: musicRelativeVolume > 0.4,
    autoFixAction: 'adjust-music-volume',
    metadata: { musicVolume: musicRelativeVolume, avgDialogueAmplitude: avgDialogueAmp },
  }
}

// ── Awkward Silence Detection ──

function checkAwkwardSilences(input: AudioQualityInput): QACheckResult {
  const { durationSeconds, dialogueSegments, music, soundEffects } = input

  if (dialogueSegments.length === 0 && !music) {
    return {
      id: 'audio-silences',
      name: 'Silence Detection',
      category: 'audio',
      status: 'warning',
      severity: 'warning',
      score: 30,
      description: 'No audio content — clip will be completely silent',
      suggestion: 'Add dialogue, music, or sound effects',
      autoFixable: false,
    }
  }

  // Merge all audio segments and sort by start time
  const allSegments: AudioSegment[] = [...dialogueSegments, ...soundEffects].sort((a, b) => a.startTime - b.startTime)

  // Find gaps > 2 seconds (awkward silence threshold)
  const silences: { start: number; end: number; duration: number }[] = []
  let currentEnd = 0

  for (const seg of allSegments) {
    if (seg.startTime - currentEnd > 2) {
      silences.push({
        start: currentEnd,
        end: seg.startTime,
        duration: seg.startTime - currentEnd,
      })
    }
    currentEnd = Math.max(currentEnd, seg.endTime)
  }

  // Check tail silence
  if (durationSeconds - currentEnd > 2 && allSegments.length > 0) {
    silences.push({
      start: currentEnd,
      end: durationSeconds,
      duration: durationSeconds - currentEnd,
    })
  }

  // If we have music, silences in dialogue are less problematic
  const effectiveSilences = music ? silences.filter((s) => s.duration > 4) : silences
  const score = Math.max(0, 100 - effectiveSilences.length * 20)

  return {
    id: 'audio-silences',
    name: 'Silence Detection',
    category: 'audio',
    status: effectiveSilences.length === 0 ? 'pass' : 'warning',
    severity: effectiveSilences.length > 2 ? 'warning' : 'info',
    score: Math.round(score),
    description:
      effectiveSilences.length === 0
        ? 'No awkward silences detected'
        : `${effectiveSilences.length} gap(s) over ${music ? '4' : '2'} seconds found`,
    suggestion:
      effectiveSilences.length > 0
        ? music
          ? 'Consider filling long dialogue gaps with sound effects or tighter editing'
          : 'Add background music or sound effects to fill silent gaps'
        : undefined,
    autoFixable: false,
    metadata: { silences: effectiveSilences },
  }
}

// ── Audio Coverage ──

function checkAudioCoverage(input: AudioQualityInput): QACheckResult {
  const { durationSeconds, dialogueSegments, music } = input
  if (durationSeconds === 0) {
    return {
      id: 'audio-coverage',
      name: 'Audio Coverage',
      category: 'audio',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'Cannot compute audio coverage',
      autoFixable: false,
    }
  }

  // Compute total dialogue time
  const dialogueTime = dialogueSegments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0)
  const dialogueCoverage = dialogueTime / durationSeconds
  const hasMusicCoverage = music && music.duration >= durationSeconds * 0.8

  let score = 50
  if (dialogueCoverage >= 0.4) score += 25
  if (dialogueCoverage >= 0.6) score += 15
  if (hasMusicCoverage) score += 10

  return {
    id: 'audio-coverage',
    name: 'Audio Coverage',
    category: 'audio',
    status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    severity: score < 50 ? 'warning' : 'info',
    score: Math.round(Math.min(100, score)),
    description: `${Math.round(dialogueCoverage * 100)}% dialogue coverage${hasMusicCoverage ? ' + background music' : ''}`,
    suggestion: dialogueCoverage < 0.4 ? 'Add more dialogue or voiceover to maintain viewer attention' : undefined,
    autoFixable: false,
    metadata: { dialogueCoverage, hasMusicCoverage },
  }
}

// ── Main Audio Quality Scorer ──

export function scoreAudioQuality(input: AudioQualityInput): QACheckResult[] {
  return [
    checkDialogueAudibility(input),
    checkMusicBalance(input),
    checkAwkwardSilences(input),
    checkAudioCoverage(input),
  ]
}
