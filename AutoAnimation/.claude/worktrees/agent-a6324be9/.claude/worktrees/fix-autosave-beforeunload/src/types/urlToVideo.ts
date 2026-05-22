/**
 * URL-to-Video Types
 */

export type URLContentType = 'article' | 'product' | 'social-post' | 'recipe' | 'news' | 'generic'

export interface ExtractedContent {
  /** Original URL */
  url: string
  /** Detected content type */
  contentType: URLContentType
  /** Page title */
  title: string
  /** Summary of the page content */
  summary: string
  /** Key bullet points extracted */
  keyPoints: string[]
  /** Detected tone/style */
  tone: string
  /** Suggested video duration in seconds */
  suggestedDuration: number
  /** Suggested aspect ratio */
  suggestedAspectRatio: '16:9' | '9:16' | '1:1'
  /** Auto-generated orchestrator prompt */
  suggestedPrompt: string
  /** Primary image URL from the page (og:image or first large image) */
  primaryImageUrl?: string
  /** High-quality images extracted from the page (up to 5) */
  extractedImages?: string[]
  /** For products: price */
  productPrice?: string
  /** For products: feature list */
  productFeatures?: string[]
  /** Site name / author */
  siteName?: string
}

export interface URLExtractionError {
  error: string
  code: 'INVALID_URL' | 'PRIVATE_URL' | 'FETCH_FAILED' | 'PARSE_FAILED' | 'TIMEOUT'
}
