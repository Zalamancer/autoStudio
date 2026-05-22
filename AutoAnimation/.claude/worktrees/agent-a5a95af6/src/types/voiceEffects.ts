/**
 * Voice Effects — Audio post-processing types
 */

export type VoiceEffectType =
  | 'reverb'
  | 'echo'
  | 'pitch-up'
  | 'pitch-down'
  | 'radio'
  | 'megaphone'
  | 'whisper'
  | 'deep'
  | 'robot'
  | 'chipmunk'
  | 'cave'
  | 'telephone'

export interface VoiceEffectParams {
  /** Pitch shift in semitones (-12 to +12) */
  pitchShift?: number
  /** Reverb wet/dry mix 0-1 */
  reverbMix?: number
  /** Reverb decay time in seconds */
  reverbDecay?: number
  /** Echo delay in seconds */
  echoDelay?: number
  /** Echo feedback 0-1 (how many repeats) */
  echoFeedback?: number
  /** High-pass filter cutoff in Hz */
  highPassCutoff?: number
  /** Low-pass filter cutoff in Hz */
  lowPassCutoff?: number
  /** Distortion amount 0-1 */
  distortion?: number
  /** Output gain multiplier */
  gain?: number
}

export interface VoiceEffectPreset {
  id: VoiceEffectType
  label: string
  description: string
  icon: string
  params: VoiceEffectParams
}
