// ── Portfolio Platform Types ──

export interface PortfolioProject {
  id: string
  /** User who published this */
  userId: string
  /** Title of the published work */
  title: string
  /** Description / caption */
  description: string
  /** URL to the video file (Supabase storage) */
  videoUrl: string
  /** URL to the thumbnail image */
  thumbnailUrl: string
  /** Video duration in seconds */
  duration: number
  /** Aspect ratio of the video */
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9'
  /** Tags for discovery */
  tags: string[]
  /** Category */
  category: PortfolioCategory
  /** Number of views */
  viewCount: number
  /** Number of likes */
  likeCount: number
  /** Whether the current user has liked this */
  isLiked?: boolean
  /** Publication status */
  status: 'draft' | 'published' | 'unlisted'
  /** Embeddable player URL */
  embedUrl: string
  /** Created timestamp */
  createdAt: string
  /** Updated timestamp */
  updatedAt: string
}

export type PortfolioCategory =
  | 'animation'
  | 'explainer'
  | 'tutorial'
  | 'promo'
  | 'social-media'
  | 'entertainment'
  | 'education'
  | 'other'

export const PORTFOLIO_CATEGORIES: { value: PortfolioCategory; label: string }[] = [
  { value: 'animation', label: 'Animation' },
  { value: 'explainer', label: 'Explainer' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'promo', label: 'Promotional' },
  { value: 'social-media', label: 'Social Media' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
]

export interface PortfolioProfile {
  /** User ID */
  userId: string
  /** Public username (URL slug) */
  username: string
  /** Display name */
  displayName: string
  /** Profile bio */
  bio: string
  /** Avatar URL */
  avatarUrl: string | null
  /** Social links */
  socialLinks: {
    website?: string
    twitter?: string
    youtube?: string
    instagram?: string
    tiktok?: string
  }
  /** Published projects count */
  projectCount: number
  /** Total views across all projects */
  totalViews: number
  /** Number of followers */
  followerCount: number
  /** Number of following */
  followingCount: number
  /** Whether current user follows this profile */
  isFollowing?: boolean
  /** Portfolio theme */
  theme: PortfolioTheme
  /** Created timestamp */
  createdAt: string
}

export type PortfolioTheme = 'dark' | 'light' | 'gradient' | 'minimal'

export interface PortfolioDiscoveryFilters {
  category?: PortfolioCategory
  sortBy: 'trending' | 'newest' | 'most-viewed' | 'most-liked'
  timeRange: 'all' | 'week' | 'month' | 'year'
  searchQuery: string
  tags: string[]
}

export const DEFAULT_DISCOVERY_FILTERS: PortfolioDiscoveryFilters = {
  sortBy: 'trending',
  timeRange: 'all',
  searchQuery: '',
  tags: [],
}

export interface EmbedConfig {
  /** Width of the embed iframe */
  width: number
  /** Height of the embed iframe */
  height: number
  /** Whether to autoplay */
  autoplay: boolean
  /** Whether to loop */
  loop: boolean
  /** Whether to show controls */
  controls: boolean
}

export const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  width: 560,
  height: 315,
  autoplay: false,
  loop: false,
  controls: true,
}

/**
 * Generate an embed code snippet for a portfolio project.
 */
export function generateEmbedCode(projectId: string, config: EmbedConfig = DEFAULT_EMBED_CONFIG): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://proanimate.com'
  const params = new URLSearchParams()
  if (config.autoplay) params.set('autoplay', '1')
  if (config.loop) params.set('loop', '1')
  if (!config.controls) params.set('controls', '0')
  const queryStr = params.toString() ? `?${params.toString()}` : ''

  return `<iframe src="${baseUrl}/embed/${projectId}${queryStr}" width="${config.width}" height="${config.height}" frameborder="0" allowfullscreen></iframe>`
}
