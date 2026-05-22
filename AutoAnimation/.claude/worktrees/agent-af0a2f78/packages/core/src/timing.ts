export interface KineticPhaseResult {
  wordIndex: number
  phase: 'enter' | 'hold' | 'exit'
  enterProgress: number
  holdProgress: number
  exitProgress: number
}

export function computeKineticPhase(
  timeSeconds: number,
  cycleDuration: number,
  totalWords: number,
): KineticPhaseResult | null {
  'worklet'
  if (totalWords === 0) return null

  const totalCycleDuration = cycleDuration * totalWords
  const cycleTime = totalCycleDuration > 0 ? timeSeconds % totalCycleDuration : 0
  const wordIndex = Math.min(Math.floor(cycleTime / cycleDuration), totalWords - 1)
  const wordTime = cycleTime - wordIndex * cycleDuration

  const enterDuration = cycleDuration * 0.2
  const holdDuration = cycleDuration * 0.6

  let phase: 'enter' | 'hold' | 'exit'
  let enterProgress = 0
  let holdProgress = 0
  let exitProgress = 0

  if (wordTime < enterDuration) {
    phase = 'enter'
    enterProgress = enterDuration > 0 ? wordTime / enterDuration : 1
  } else if (wordTime < enterDuration + holdDuration) {
    phase = 'hold'
    enterProgress = 1
    holdProgress = holdDuration > 0 ? (wordTime - enterDuration) / holdDuration : 0
  } else {
    phase = 'exit'
    enterProgress = 1
    holdProgress = 1
    const exitDuration = cycleDuration * 0.2
    exitProgress = exitDuration > 0 ? (wordTime - enterDuration - holdDuration) / exitDuration : 1
  }

  return { wordIndex, phase, enterProgress, holdProgress, exitProgress }
}
