// ── Subscription & Credit Types ──

export type SubscriptionPlan = 'free' | 'pro' | 'business' | 'enterprise'

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'

export interface CreditBalance {
  credits_remaining: number
  credits_used_today: number
  plan_credits_total: number
  period_credits_used: number
  last_daily_reset: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export type CreditOperation =
  | 'elevenlabs-tts'
  | 'elevenlabs-music'
  | 'elevenlabs-sfx'
  | 'gemini-script'
  | 'orchestrator-plan'
  | 'svg-object'
  | 'vertex-sprite-sheet'
  | 'vertex-emotion-heads'
  | 'auto-rig-2d'
  | 'meshy-text-to-3d'
  | 'meshy-image-to-3d'
  | 'meshy-auto-rig'
  | 'hunyuan-motion'
  | 'ai-video'
  | 'whisper-transcript'
  | 'recraft-vectorize'
  | 'recraft-bg-remove'
  | 'dubbing'
  | 'photo-to-avatar'
  | 'voice-clone'
  | 'audio-isolation'
  | 'content-split'
  | 'image-to-video'
  | 'music-generation'
  | 'virality-score'
  | 'nb2-generate'
  | 'lottie-generate'
  | 'gemini-rig-animation'
  | 'pixellab-create-character'
  | 'pixellab-animate'
  | 'pixellab-generate-image'
  | 'pixellab-edit-image'
  | 'pixellab-tiles'
  | 'api-render'

/** Display-only cost map. Authoritative costs live server-side. */
export const CREDIT_COSTS: Record<CreditOperation, number> = {
  'elevenlabs-tts': 30,
  'elevenlabs-music': 50,
  'elevenlabs-sfx': 15,
  'gemini-script': 5,
  'orchestrator-plan': 12,
  'svg-object': 8,
  'vertex-sprite-sheet': 35,
  'vertex-emotion-heads': 40,
  'auto-rig-2d': 8,
  'meshy-text-to-3d': 30,
  'meshy-image-to-3d': 40,
  'meshy-auto-rig': 8,
  'hunyuan-motion': 20,
  'ai-video': 40,
  'whisper-transcript': 20,
  'recraft-vectorize': 5,
  'recraft-bg-remove': 5,
  'dubbing': 40,
  'photo-to-avatar': 30,
  'voice-clone': 25,
  'audio-isolation': 15,
  'content-split': 10,
  'image-to-video': 50,
  'music-generation': 30,
  'virality-score': 5,
  'nb2-generate': 10,
  'lottie-generate': 5,
  'gemini-rig-animation': 8,
  'pixellab-create-character': 25,
  'pixellab-animate': 20,
  'pixellab-generate-image': 15,
  'pixellab-edit-image': 10,
  'pixellab-tiles': 15,
  'api-render': 200,
}
