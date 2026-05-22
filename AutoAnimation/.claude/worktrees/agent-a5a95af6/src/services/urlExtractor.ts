/**
 * URL Extractor Service — Frontend API client for URL-to-Video extraction.
 */

import type { ExtractedContent } from '@/types/urlToVideo'
import type { ArticleExtraction } from '@/types/orchestrator'

const API_BASE = import.meta.env.VITE_API_URL || ''

/** Validate URL format on the client side before sending to server */
export function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Extract content from a URL for video generation.
 * Returns structured content with a suggested orchestrator prompt.
 *
 * Uses raw fetch instead of apiClient because this endpoint
 * does not require authentication.
 */
export async function extractContentFromURL(url: string): Promise<ExtractedContent> {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format. Please enter a valid HTTP or HTTPS URL.')
  }

  const resp = await fetch(`${API_BASE}/api/url-to-video/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (resp.status === 429) {
    throw new Error('Rate limit exceeded. Please wait a minute and try again.')
  }

  if (resp.status === 504) {
    throw new Error('The page took too long to load (15s timeout). Try a different URL.')
  }

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}))
    throw new Error(
      (data as { error?: string }).error || `URL extraction failed (${resp.status})`,
    )
  }

  return resp.json() as Promise<ExtractedContent>
}

/**
 * Extract article content with section-level detail (optimized for long-form articles).
 */
export async function extractArticle(url: string, targetDuration?: number): Promise<ArticleExtraction> {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format. Please enter a valid HTTP or HTTPS URL.')
  }

  const resp = await fetch(`${API_BASE}/api/url-to-video/extract-article`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, targetDuration }),
  })

  if (resp.status === 429) {
    throw new Error('Rate limit exceeded. Please wait a minute and try again.')
  }

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}))
    throw new Error(
      (data as { error?: string }).error || `Article extraction failed (${resp.status})`,
    )
  }

  return resp.json() as Promise<ArticleExtraction>
}
