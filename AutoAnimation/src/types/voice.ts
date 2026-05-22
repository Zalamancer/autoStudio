// Viseme types - extended set covering both 12-viseme and 9-viseme (NanoBanana) systems plus IPA mappings
export type Viseme =
  // 12-viseme system
  | 'Aa'
  | 'D'
  | 'Ee'
  | 'F'
  | 'L'
  | 'M'
  | 'O'
  | 'R'
  | 'S'
  | 'U'
  | 'W'
  | 'Rest'
  // 9-viseme NanoBanana system additions
  | 'Oh'
  | 'Oo'
  | 'FV'
  | 'MBP'
  | 'DTL'
  | 'ChR'
  // IPA phoneme mapping additions
  | 'Mm'
  | 'Kk'
  | 'Ff'
  | 'Th'
  | 'Ss'
  | 'Sh'
  | 'Rr'

export const VISEME_LIST: Viseme[] = ['Aa', 'D', 'Ee', 'F', 'L', 'M', 'O', 'R', 'S', 'U', 'W', 'Rest']

export const VISEME_DESCRIPTIONS: Record<Viseme, string> = {
  Rest: 'Neutral/Closed mouth',
  Aa: 'Wide open (AA, AE, AH, AY, AW)',
  D: 'Tongue behind teeth (D, T, N, DH)',
  Ee: 'Wide smile (EH, EY, IY, IH)',
  F: 'Teeth on lip (F, V)',
  L: 'Tongue tip (L, TH)',
  M: 'Lips pressed (M, B, P)',
  O: 'Rounded medium (AO, OW, OY)',
  R: 'Rounded retracted (R, ER)',
  S: 'Teeth close (S, Z, SH, ZH, CH, JH)',
  U: 'Pursed lips (UH, UW)',
  W: 'Rounded tight (W, Y)',
  // NanoBanana 9-viseme system
  Oh: 'Rounded open (OH)',
  Oo: 'Pursed lips (OO/W)',
  FV: 'Lower lip under teeth (F/V)',
  MBP: 'Lips pressed together (M/B/P)',
  DTL: 'Tongue behind teeth (D/T/L/TH)',
  ChR: 'Teeth close retracted (CH/R/S/Z)',
  // IPA phoneme mapping visemes
  Mm: 'Lips pressed (M nasal)',
  Kk: 'Back of tongue (K/G)',
  Ff: 'Teeth on lip (F)',
  Th: 'Tongue between teeth (TH)',
  Ss: 'Teeth close (S/Z)',
  Sh: 'Teeth close wide (SH/ZH/CH)',
  Rr: 'Rounded retracted (R/ER)',
}

/** Maps old 8-viseme names to new 12-viseme names for backwards compatibility */
export const LEGACY_VISEME_MAP: Record<string, Viseme> = {
  REST: 'Rest',
  AI: 'Aa',
  E: 'Ee',
  O: 'O',
  U: 'U',
  MBP: 'M',
  FV: 'F',
  LTH: 'L',
}

// ElevenLabs alignment data structure
export interface ElevenLabsAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
  phonemes: string[]
  phoneme_start_times_seconds: number[]
  phoneme_end_times_seconds: number[]
}

// Processed timeline events
export interface VisemeEvent {
  viseme: Viseme
  startFrame: number
  endFrame: number
  startTime: number
  endTime: number
}

export interface WordEvent {
  word: string
  startFrame: number
  endFrame: number
  startTime: number
  endTime: number
}

// Caption display styles
// - word-by-word: shows one word at a time
// - sentence: shows full sentence
// - karaoke: shows full sentence with highlighted active word
// - phrase: TikTok-style, shows 2-3 words at a time with highlighted active word
export type CaptionStyle = 'word-by-word' | 'sentence' | 'karaoke' | 'phrase'

/** Supported ElevenLabs TTS model IDs */
export type ElevenLabsModelId = 'eleven_multilingual_v2' | 'eleven_turbo_v2_5' | 'eleven_flash_v2_5' | 'eleven_v3'

// Voice settings for ElevenLabs
export interface VoiceSettings {
  stability: number
  similarityBoost: number
  style?: number
  useSpeakerBoost?: boolean
  /** ElevenLabs model ID. Defaults to 'eleven_v3'. */
  modelId?: ElevenLabsModelId
}

// ElevenLabs voice info
export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
  labels?: Record<string, string>
  preview_url?: string
}

// Singing lip sync configuration
export interface SingingVisemeConfig {
  mode: 'singing'
  bpm?: number
  pitchSensitivity: number
  beatEmphasis: number
  vibratoSpeed: number
}

// Lyric types for time-aligned lyrics
export interface LyricWord {
  text: string
  startTime: number
  endTime: number
}

export interface LyricLine {
  startTime: number
  endTime: number
  text: string
  words?: LyricWord[]
}

// Generated voice data
export interface GeneratedVoice {
  id: string
  script: string
  voiceId: string
  voiceName: string
  audioUrl: string
  audioDuration: number
  alignment: ElevenLabsAlignment
  visemeTimeline: VisemeEvent[]
  wordTimeline: WordEvent[]
  createdAt: number
}
