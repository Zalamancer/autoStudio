export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'x' | 'youtube'

export interface FacebookPublishOptions {
  pageId: string
  description: string
  privacy: 'public' | 'friends' | 'only_me'
  scheduledTime?: string
}

export interface InstagramPublishOptions {
  caption: string
  hashtags: string
  coverImageTimestamp?: number
  postType: 'reels' | 'feed'
}

export interface TikTokPublishOptions {
  description: string
  hashtags: string
  privacy: 'public' | 'friends' | 'private'
  allowComments: boolean
  allowDuets: boolean
  allowStitches: boolean
  postMode?: 'direct' | 'draft'
  brandContentToggle?: boolean
  brandOrganicToggle?: boolean
}

export interface TikTokProfile {
  openId: string
  displayName: string
  avatarUrl: string
  avatarUrl100?: string
  bioDescription?: string
  profileDeepLink?: string
  isVerified?: boolean
  followerCount?: number
  followingCount?: number
  videoCount?: number
  likesCount?: number
}

export interface TikTokVideo {
  id: string
  title: string
  coverImageUrl: string
  videoDescription: string
  duration: number
  createTime: number
  shareUrl: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  shareCount?: number
}

export interface TikTokVideoListResponse {
  videos: TikTokVideo[]
  cursor: number
  hasMore: boolean
}

export interface XPublishOptions {
  tweetText: string
  mediaAltText: string
  threadContinuation: boolean
}

export interface YouTubePublishOptions {
  title: string
  description: string
  tags: string
  privacy: 'public' | 'unlisted' | 'private'
  madeForKids: boolean
  uploadType: 'short' | 'long'
}

export type PlatformPublishOptions =
  | { platform: 'facebook'; options: FacebookPublishOptions }
  | { platform: 'instagram'; options: InstagramPublishOptions }
  | { platform: 'tiktok'; options: TikTokPublishOptions }
  | { platform: 'x'; options: XPublishOptions }
  | { platform: 'youtube'; options: YouTubePublishOptions }

export interface SocialAccount {
  platform: SocialPlatform
  connected: boolean
  username?: string
  avatarUrl?: string
  pageId?: string
  pageName?: string
  pages?: Array<{ id: string; name: string }>
}

export interface PublishResult {
  success: boolean
  postUrl?: string
  postId?: string
  error?: string
}

// ── Phase 7: Scheduling & AI Metadata ────────────────────────────────────

export type ScheduledPostStatus = 'pending' | 'publishing' | 'published' | 'failed'

export interface ScheduledPost {
  id: string
  platform: SocialPlatform
  scheduledAt: string // ISO 8601
  status: ScheduledPostStatus
  options: Record<string, unknown>
  videoUrl: string
  recordingId: string
  createdAt: string
  result?: PublishResult
  error?: string
}

export interface MetadataGenerationRequest {
  contentSummary: string
  platform?: SocialPlatform
  tone?: string
}

export interface MetadataGenerationResult {
  title: string
  description: string
  hashtags: string[]
  suggestedPostingTime?: string
}

export type PublishJobStatus = 'uploading' | 'processing' | 'published' | 'failed'

export interface PublishJob {
  jobId: string
  platform: SocialPlatform
  status: PublishJobStatus
  postUrl?: string
  error?: string
  startedAt: string
}
