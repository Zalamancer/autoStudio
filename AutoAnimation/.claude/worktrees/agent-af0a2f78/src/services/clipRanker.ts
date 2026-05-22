/**
 * Clip Ranker — Combines multiple signals to produce composite clip rankings.
 *
 * Signals: virality score, visual interest, audio energy, hook potential.
 */

import type { ExtractedClip } from '@/services/clipExtractor'

export interface ClipRank {
  clipId: string
  compositeScore: number
  breakdown: {
    viralityScore: number
    visualInterestScore: number
    audioEnergyScore: number
    hookPotentialScore: number
  }
}

/**
 * Rank extracted clips by combining multiple quality signals.
 */
export function rankClips(clips: ExtractedClip[]): ClipRank[] {
  const ranks: ClipRank[] = clips.map((clip) => {
    // Virality score from Gemini analysis (0-100)
    const viralityScore = clip.viralityScore ?? 50

    // Visual interest based on scene transitions (more transitions = more dynamic)
    const sceneTransitions = clip.sceneTransitions?.length ?? 0
    const visualInterestScore = Math.min(100, sceneTransitions * 25 + 40)

    // Audio energy based on emotional arc (rising/climax arcs score higher)
    let audioEnergyScore = 50
    if (clip.emotionalArc === 'rising') audioEnergyScore = 75
    else if (clip.emotionalArc === 'climax') audioEnergyScore = 90
    else if (clip.emotionalArc === 'falling') audioEnergyScore = 40
    else if (clip.emotionalArc === 'flat') audioEnergyScore = 30

    // Hook potential from first segment (is the opening attention-grabbing?)
    const hookPotentialScore = clip.hookRewrite ? 80 : 50

    // Weighted composite
    const compositeScore =
      viralityScore * 0.35 +
      visualInterestScore * 0.2 +
      audioEnergyScore * 0.25 +
      hookPotentialScore * 0.2

    return {
      clipId: clip.id,
      compositeScore: Math.round(compositeScore),
      breakdown: {
        viralityScore,
        visualInterestScore,
        audioEnergyScore,
        hookPotentialScore,
      },
    }
  })

  return ranks.sort((a, b) => b.compositeScore - a.compositeScore)
}
