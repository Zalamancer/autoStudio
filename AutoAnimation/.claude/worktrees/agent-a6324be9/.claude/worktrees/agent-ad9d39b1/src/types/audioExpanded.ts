// Audio Expansion + Platform Intelligence types

export interface VoiceModelProfile {
  id: string
  name: string
  provider: 'elevenlabs' | 'google' | 'azure' | 'amazon' | 'openai'
  gender: 'male' | 'female' | 'neutral'
  age: 'young' | 'adult' | 'senior'
  accent: string
  language: string
  style: 'conversational' | 'narration' | 'dramatic' | 'news' | 'gaming' | 'meditation' | 'characters'
  sampleUrl?: string
  tags: string[]
}

export interface LanguagePack {
  code: string
  name: string
  nativeName: string
  region: string
  direction: 'ltr' | 'rtl'
  voiceAvailable: boolean
  captionSupport: boolean
  translationSupport: boolean
}

export interface EQBand {
  frequency: number
  gain: number
  q: number
  type: 'lowshelf' | 'highshelf' | 'peaking' | 'notch' | 'lowpass' | 'highpass' | 'bandpass' | 'allpass'
}

export interface AudioEnhancementConfig {
  autoLeveling: boolean
  targetLUFS: number
  noiseGate: {
    enabled: boolean
    threshold: number
    attack: number
    release: number
  }
  compression: {
    enabled: boolean
    threshold: number
    ratio: number
    attack: number
    release: number
    makeupGain: number
  }
  eq: {
    enabled: boolean
    bands: EQBand[]
  }
  spatialAudio: {
    enabled: boolean
    panPosition: number
    roomSize: number
    reverbMix: number
    distanceAttenuation: number
  }
  ducking: {
    enabled: boolean
    duckAmount: number
    fadeTime: number
    threshold: number
  }
}

export interface EffectBrowserCategory {
  id: string
  label: string
  icon: string
  description: string
  subcategories?: string[]
}
