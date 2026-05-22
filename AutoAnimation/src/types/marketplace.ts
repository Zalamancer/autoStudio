// ── Marketplace Types ──

export type MarketplaceListingCategory =
  | 'characters'
  | 'animations'
  | 'audio'
  | 'text'
  | 'transitions'
  | 'ai-animations'
  | 'html-templates'
  | 'captions'
  | 'collages'
  | 'projects'
  | '3d-characters'
  | '3d-animations'
  | 'stock-objects'

export interface MarketplaceListing {
  id: string
  creator_id: string
  title: string
  description: string
  category: MarketplaceListingCategory
  asset_url: string
  thumbnail_url: string | null
  metadata: Record<string, unknown>
  use_count: number
  created_at: string
  updated_at: string
  /** Joined from auth.users when available */
  creator_email?: string
}

export interface RoyaltyDistribution {
  creator_id: string
  listing_id: string
  credits_granted: number
}

export interface RoyaltyDistributionResult {
  success: boolean
  royalty_pool: number
  creator_count: number
  distributions: RoyaltyDistribution[]
  message?: string
}

export interface CreatorEarnings {
  total_credits_earned: number
  royalty_count: number
  recent_royalties: Array<{
    credits_granted: number
    created_at: string
    listing_id: string
  }>
}
