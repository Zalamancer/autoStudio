/**
 * Client-side AI metadata generation for social media publishing.
 *
 * Uses Gemini (via VITE_GEMINI_API_KEY) to generate platform-optimized
 * title, description, hashtags, and suggested posting time from video content.
 * Falls back to server endpoint if available.
 */

import type { SocialPlatform, MetadataGenerationResult } from '@/types/social'
import { callGeminiProxy } from '@/services/aiProxy'
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_API_URL = GEMINI_MODEL // model name for callGeminiProxy

/**
 * Generate platform-optimized metadata (title, description, hashtags) from
 * a content summary using Gemini on the client side.
 */
export async function generatePublishMetadata(
  contentSummary: string,
  platform?: SocialPlatform,
  tone?: string,
): Promise<MetadataGenerationResult> {
  if (!GEMINI_API_KEY) {
    return fallbackMetadata(contentSummary)
  }

  const platformName = platform || 'social media'
  const toneStr = tone ? ` The tone should be ${tone}.` : ''

  const prompt = `You are a social media expert. Generate optimized metadata for posting a short video to ${platformName}.${toneStr}

Content summary: "${contentSummary}"

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "title": "short catchy title (max 100 chars)",
  "description": "engaging description (max 300 chars for TikTok/Instagram, max 500 for YouTube)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "suggestedPostingTime": "best time to post in 24h format like 14:00"
}`

  try {
    const resp = await callGeminiProxy(GEMINI_API_URL, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      })

    if (!resp.ok) {
      console.warn('[publishMetadata] Gemini API error, using fallback')
      return fallbackMetadata(contentSummary)
    }

    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    const parsed = JSON.parse(jsonMatch[0])
    return {
      title: parsed.title || '',
      description: parsed.description || '',
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      suggestedPostingTime: parsed.suggestedPostingTime,
    }
  } catch (err) {
    console.warn('[publishMetadata] Failed to generate metadata:', err)
    return fallbackMetadata(contentSummary)
  }
}

function fallbackMetadata(contentSummary: string): MetadataGenerationResult {
  const words = contentSummary.split(/\s+/).slice(0, 10).join(' ')
  return {
    title: words.length > 50 ? words.slice(0, 50) + '...' : words,
    description: contentSummary.slice(0, 300),
    hashtags: ['#video', '#content', '#creator'],
  }
}
