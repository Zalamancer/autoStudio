/**
 * Zod validation schemas for server route requests.
 */

import { z } from 'zod'

// ── Shared ──────────────────────────────────────────────────────────────────

const platformEnum = z.enum([
  'instagram', 'facebook', 'tiktok', 'x', 'twitter', 'youtube',
]).describe('Social media platform')

// ── AI Animation ────────────────────────────────────────────────────────────

export const aiAnimationGenerateBody = z.object({
  prompt: z.string().min(1).max(5000),
  fps: z.number().int().min(1).max(120).default(30),
  durationSeconds: z.number().min(1).max(60).default(10),
  width: z.number().int().min(100).max(3840).default(1920),
  height: z.number().int().min(100).max(2160).default(1080),
  sourceImageBase64: z.string().optional(),
  motionStyle: z.enum(['subtle', 'dynamic', 'cinematic']).default('dynamic').optional(),
})

// ── Learning ────────────────────────────────────────────────────────────────

export const learningSnapshotBody = z.object({
  recordingId: z.string().min(1).max(200),
  projectId: z.string().max(200).optional(),
  publishedPostId: z.string().max(200).optional(),
  platform: platformEnum,
  snapshot: z.object({
    aspectRatio: z.string().max(20).optional(),
    fps: z.number().int().min(1).max(120).optional(),
    durationSeconds: z.number().min(0).max(600).optional(),
    canvasWidth: z.number().int().min(0).max(7680).optional(),
    canvasHeight: z.number().int().min(0).max(4320).optional(),
    characterCount: z.number().int().min(0).optional(),
    dialogueLineCount: z.number().int().min(0).optional(),
    totalScriptWordCount: z.number().int().min(0).optional(),
    voiceCount: z.number().int().min(0).optional(),
    animationCount: z.number().int().min(0).optional(),
    textOverlayCount: z.number().int().min(0).optional(),
    hasTitle: z.boolean().optional(),
    hasCTA: z.boolean().optional(),
    hasLottieBackground: z.boolean().optional(),
    hasSVGAnimations: z.boolean().optional(),
    hasHTMLTemplates: z.boolean().optional(),
  }).passthrough(), // allow additional fields for extensibility
})

export const learningUpdateMetricsBody = z.object({
  snapshotId: z.string().min(1).max(200),
  metrics: z.object({
    views: z.number().int().min(0).optional(),
    likes: z.number().int().min(0).optional(),
    comments: z.number().int().min(0).optional(),
    shares: z.number().int().min(0).optional(),
    saves: z.number().int().min(0).optional(),
    engagementRate: z.number().min(0).max(1).optional(),
    avgWatchTimeSec: z.number().min(0).optional(),
    reach: z.number().int().min(0).optional(),
    impressions: z.number().int().min(0).optional(),
    fullVideoViewsPercent: z.number().min(0).max(100).optional(),
  }).passthrough(),
})

export const learningScoreQuery = z.object({
  platform: platformEnum,
  featureVector: z.string().min(1).max(10000),
})

export const learningAnalyzeBody = z.object({
  platform: platformEnum,
  recordingId: z.string().max(200).optional(),
  currentFeatures: z.record(z.unknown()).optional(),
})

export const learningRecommendationStatusBody = z.object({
  status: z.enum(['applied', 'dismissed', 'expired']),
})

// ── Marketplace ─────────────────────────────────────────────────────────────

export const marketplaceListingBody = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  asset_url: z.string().url().max(2000),
  description: z.string().max(2000).optional(),
  thumbnail_url: z.string().url().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const marketplaceListingsQuery = z.object({
  category: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const marketplaceUsageBody = z.object({
  projectId: z.string().min(1).max(200),
  listingIds: z.array(z.string().max(200)).min(1).max(50),
})

export const marketplaceRoyaltiesBody = z.object({
  projectId: z.string().min(1).max(200),
  totalCreditsSpent: z.number().positive().max(100000),
})

// ── Credits ─────────────────────────────────────────────────────────────────

export const creditsOperationBody = z.object({
  operation: z.string().min(1).max(100),
})

// ── Stripe ──────────────────────────────────────────────────────────────────

export const stripeCheckoutBody = z.object({
  priceId: z.string().min(1).max(200),
})

// ── Meshy 3D Generation ─────────────────────────────────────────────────────

export const meshyTextTo3DBody = z.object({
  prompt: z.string().min(1).max(5000),
  style: z.string().max(100).optional(),
}).passthrough()

export const meshyImageTo3DBody = z.object({
  imageBase64: z.string().min(1), // base64 data, very large
}).passthrough()

export const meshyAutoRigBody = z.object({
  modelUrl: z.string().min(1).max(2000),
}).passthrough()

export const meshyRemeshBody = z.object({
  modelUrl: z.string().min(1).max(2000),
  targetPolycount: z.number().int().min(100).max(300000).default(30000),
}).passthrough()

// ── Auto-Rig (Vertex AI) ───────────────────────────────────────────────────

export const autoRigBody = z.object({
  referenceImage: z.string().min(1), // base64 data URL or raw base64
  imageWidth: z.number().int().min(1).max(10000).optional(),
  imageHeight: z.number().int().min(1).max(10000).optional(),
}).passthrough()

// ── AI Animation — generate-objects ─────────────────────────────────────────

export const aiAnimationGenerateObjectsBody = z.object({
  prompt: z.string().min(1).max(5000),
  width: z.number().int().min(100).max(3840).default(1920),
  height: z.number().int().min(100).max(2160).default(1080),
}).passthrough()

// ── HunyuanMotion ──────────────────────────────────────────────────────────

export const hunyuanMotionGenerateBody = z.object({
  prompt: z.string().min(1).max(5000),
  duration: z.number().min(1).max(30).default(3),
  fps: z.number().int().min(1).max(120).default(30),
}).passthrough()

// ── Sprite Generation (index.ts inline routes) ─────────────────────────────

export const spriteGenerationBody = z.object({
  referenceImage: z.string().min(1), // base64 data, very large
  stylePrompt: z.string().max(1000).optional(),
})

// ── Recraft ─────────────────────────────────────────────────────────────────

export const recraftImageBody = z.object({
  image: z.string().min(1), // base64 data URL
})

// ── Brand Director ──────────────────────────────────────────────────────────

export const brandDirectorAnalyzeUrlBody = z.object({
  url: z.string().url().max(2000),
})

export const brandDirectorAnalyzeViralityBody = z.object({
  trendItems: z.array(z.object({
    title: z.string().max(500),
    url: z.string().max(2000).optional(),
    thumbnailUrl: z.string().max(2000).optional(),
    platform: z.string().max(50),
    viewCount: z.number().int().min(0).optional(),
    likeCount: z.number().int().min(0).optional(),
    commentCount: z.number().int().min(0).optional(),
    shareCount: z.number().int().min(0).optional(),
    engagementRate: z.number().min(0).optional(),
    publishedAt: z.string().max(100).optional(),
    hashtags: z.array(z.string().max(200)).max(50).optional(),
    authorUsername: z.string().max(200).optional(),
    authorDisplayName: z.string().max(200).optional(),
    authorFollowerCount: z.number().int().min(0).optional(),
    duration: z.number().min(0).optional(),
    description: z.string().max(2000).optional(),
    category: z.string().max(100).optional(),
  })).min(1).max(30),
  industry: z.string().max(200),
  niche: z.string().max(200),
})

export const brandDirectorTrendsBody = z.object({
  keywords: z.array(z.string().max(200)).max(20).optional(),
  industry: z.string().max(200).optional(),
  niche: z.string().max(200).optional(),
  sources: z.array(z.string().max(50)).max(10).optional(),
})

export const brandDirectorSocialPresenceBody = z.object({
  brandName: z.string().min(1).max(500),
  url: z.string().url().max(2000),
})

export const brandDirectorMentionsBody = z.object({
  brandName: z.string().min(1).max(500),
  keywords: z.array(z.string().max(200)).min(1).max(20),
  industry: z.string().max(200).optional(),
})

export const brandDirectorCompetitorsBody = z.object({
  brandName: z.string().min(1).max(500),
  industry: z.string().min(1).max(200),
  niche: z.string().min(1).max(200),
  products: z.array(z.string().max(200)).max(20),
})

export const brandDirectorAnalyzeCompetitorBody = z.object({
  url: z.string().url().max(2000),
})

export const brandDirectorCompetitiveAnalysisBody = z.object({
  brandProfile: z.object({
    businessName: z.string(),
    industry: z.string(),
    niche: z.string(),
    targetAudience: z.array(z.string()),
    products: z.array(z.string()),
    brandValues: z.array(z.string()),
    tone: z.string(),
    description: z.string(),
  }).passthrough(),
  competitorProfiles: z.array(z.object({
    businessName: z.string(),
    industry: z.string(),
    niche: z.string(),
    targetAudience: z.array(z.string()),
    products: z.array(z.string()),
    tone: z.string(),
    description: z.string(),
  }).passthrough()).min(1).max(10),
})

// ── Social Publishing ───────────────────────────────────────────────────────

export const socialPublishInstagramBody = z.object({
  videoUrl: z.string().url().max(2000),
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string().max(100)).max(30).optional(),
  postType: z.enum(['reel', 'story', 'post']).default('reel'),
  coverImageTimestamp: z.number().min(0).optional(),
})

export const socialPublishFacebookBody = z.object({
  videoUrl: z.string().url().max(2000),
  description: z.string().max(5000).optional(),
  privacy: z.string().max(50).optional(),
  scheduledTime: z.string().max(50).optional(),
})

export const socialPublishTiktokBody = z.object({
  videoUrl: z.string().url().max(2000),
  description: z.string().max(2200).optional(),
  hashtags: z.array(z.string().max(100)).max(30).optional(),
  privacy: z.string().max(50).optional(),
  allowComments: z.boolean().optional(),
  allowDuets: z.boolean().optional(),
  allowStitches: z.boolean().optional(),
})

export const socialPublishXBody = z.object({
  videoUrl: z.string().url().max(2000),
  tweetText: z.string().min(1).max(280),
  mediaAltText: z.string().max(1000).optional(),
})

export const socialPublishYoutubeBody = z.object({
  videoUrl: z.string().url().max(2000),
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  privacy: z.enum(['public', 'unlisted', 'private']).default('public'),
  madeForKids: z.boolean().default(false),
  uploadType: z.enum(['video', 'short']).default('short'),
})

// ── Nano Banana 2 ──────────────────────────────────────────────────

export const nb2GenerateBody = z.object({
  partType: z.enum(['concept', 'body', 'head', 'hair', 'viseme-sheet', 'eye-strip', 'eyebrow-strip', 'clothing']),
  prompt: z.string().min(1).max(5000),
  styleReference: z.string().optional(),
  layoutReference: z.string().optional(),
  conceptImage: z.string().optional(),
  gridReference: z.string().optional(),
  resolution: z.enum(['512', '1024', '2048', '4096']).optional(),
  aspectRatio: z.enum(['1:1', '3:2', '2:3', '3:4', '4:3', '9:16', '16:9']).optional(),
  customPrompt: z.string().max(10000).optional(),
})

// ── Auto-Publish ────────────────────────────────────────────────────────────

export const autoPublishCreateBody = z.object({
  topicPrompt: z.string().min(1).max(5000),
  platforms: z.array(z.string().max(50)).min(1).max(10),
  frequency: z.enum(['daily', 'every-2-days', 'every-3-days', 'weekly']),
  cronExpression: z.string().max(100),
  timezone: z.string().max(100).default('UTC'),
  orchestratorSettings: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
})

export const autoPublishUpdateBody = z.object({
  topicPrompt: z.string().min(1).max(5000).optional(),
  platforms: z.array(z.string().max(50)).min(1).max(10).optional(),
  frequency: z.enum(['daily', 'every-2-days', 'every-3-days', 'weekly']).optional(),
  cronExpression: z.string().max(100).optional(),
  timezone: z.string().max(100).optional(),
  orchestratorSettings: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
}).passthrough()

export const autoPublishCompleteBody = z.object({
  creditsUsed: z.number().int().min(0),
  publishedPostIds: z.array(z.string().max(500)).default([]),
})

export const autoPublishFailBody = z.object({
  error: z.string().max(2000),
})

// ── Viral Scraper ─────────────────────────────────────────────────────────────

export const viralDiscoverBody = z.object({
  keywords: z.array(z.string().max(200)).min(1).max(20),
  platforms: z.array(z.enum(['youtube', 'tiktok', 'instagram'])).max(3).optional(),
  industry: z.string().max(200).optional(),
  niche: z.string().max(200).optional(),
  maxResults: z.number().int().min(1).max(50).default(15).optional(),
})

export const viralVideoInfoQuery = z.object({
  url: z.string().min(1).max(2000),
})

export const viralBatchVideoInfoBody = z.object({
  urls: z.array(z.string().url().max(2000)).min(1).max(20),
})

export const viralCommentsQuery = z.object({
  url: z.string().min(1).max(2000),
  max: z.coerce.number().int().min(1).max(500).default(100).optional(),
})

export const viralDownloadBody = z.object({
  url: z.string().url().max(2000),
  platform: z.string().max(50).optional(),
})
