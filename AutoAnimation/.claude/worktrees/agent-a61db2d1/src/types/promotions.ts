// ── Promotion Request & Marketplace Types ──

export type PromotionRequestStatus = 'draft' | 'open' | 'reviewing' | 'completed' | 'canceled'
export type SubmissionStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn'
export type NotificationType =
  | 'promo_request_match'
  | 'submission_received'
  | 'submission_approved'
  | 'submission_rejected'
  | 'escrow_refunded'
  | 'request_completed'
  | 'request_canceled'

export interface ReferenceMedia {
  url: string
  type: 'image' | 'video'
  caption?: string
}

export interface PromotionRequest {
  id: string
  enterprise_id: string
  title: string
  description: string
  budget_credits: number
  escrowed_credits: number
  spent_credits: number
  niche_tags: string[]
  deadline: string | null
  reference_media: ReferenceMedia[]
  max_submissions: number
  status: PromotionRequestStatus
  submission_count?: number
  created_at: string
  updated_at: string
}

export interface PromotionSubmission {
  id: string
  request_id: string
  creator_id: string
  project_id: string | null
  title: string
  description: string | null
  asset_url: string
  thumbnail_url: string | null
  status: SubmissionStatus
  feedback: string | null
  reward_credits: number | null
  created_at: string
  updated_at: string
  // Joined fields
  creator_display_name?: string
  creator_total_approvals?: number
  request_title?: string
}

export interface CreatorProfile {
  id: string
  user_id: string
  opted_in: boolean
  display_name: string | null
  bio: string | null
  niche_tags: string[]
  ai_suggested_tags: string[]
  total_submissions: number
  total_approvals: number
  created_at: string
  updated_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  metadata: Record<string, unknown>
  read: boolean
  created_at: string
}

export const NICHE_TAG_OPTIONS = [
  'gaming', 'food', 'tech', 'fashion', 'education',
  'fitness', 'travel', 'beauty', 'music', 'finance',
  'health', 'entertainment', 'science', 'art', 'comedy',
  'news', 'sports', 'lifestyle', 'pets', 'DIY',
] as const

export type NicheTag = typeof NICHE_TAG_OPTIONS[number]
