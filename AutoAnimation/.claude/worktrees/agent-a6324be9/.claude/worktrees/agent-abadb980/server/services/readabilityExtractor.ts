/**
 * readabilityExtractor.ts
 *
 * Server-side module for clean article extraction using @mozilla/readability + jsdom,
 * structured data extraction from JSON-LD, and high-quality image extraction.
 */

import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import * as cheerio from 'cheerio'

// ── Types ──

export interface ReadabilityResult {
  title: string
  textContent: string
  excerpt: string
  byline: string
  siteName: string
  length: number
}

export interface StructuredDataResult {
  type: 'Product' | 'Recipe' | 'Article' | 'VideoObject' | 'unknown'
  data: Record<string, unknown>
}

// ── Public API ──

/**
 * Extract clean, readable article content using Mozilla Readability.
 * Strips navigation, ads, comments, sidebars etc.
 */
export function extractArticleContent(html: string): ReadabilityResult {
  try {
    const dom = new JSDOM(html, { url: 'https://example.com' })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) {
      return {
        title: '',
        textContent: '',
        excerpt: '',
        byline: '',
        siteName: '',
        length: 0,
      }
    }

    return {
      title: article.title || '',
      textContent: article.textContent || '',
      excerpt: article.excerpt || '',
      byline: article.byline || '',
      siteName: article.siteName || '',
      length: article.length || 0,
    }
  } catch {
    return {
      title: '',
      textContent: '',
      excerpt: '',
      byline: '',
      siteName: '',
      length: 0,
    }
  }
}

/**
 * Extract structured data from JSON-LD and Schema.org markup.
 * Supports Product, Recipe, Article, and VideoObject types.
 */
export function extractStructuredData(html: string): StructuredDataResult[] {
  const results: StructuredDataResult[] = []
  const $ = cheerio.load(html)

  // Extract JSON-LD scripts
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).text().trim()
      if (!text) return

      const data = JSON.parse(text) as Record<string, unknown>
      const items = Array.isArray(data) ? data : [data]

      for (const item of items) {
        const typeStr = (item['@type'] as string) || ''
        const typeNormalized = typeStr.toLowerCase()

        if (typeNormalized === 'product') {
          results.push({ type: 'Product', data: item as Record<string, unknown> })
        } else if (typeNormalized === 'recipe') {
          results.push({ type: 'Recipe', data: item as Record<string, unknown> })
        } else if (typeNormalized === 'article' || typeNormalized === 'newsarticle' || typeNormalized === 'blogposting') {
          results.push({ type: 'Article', data: item as Record<string, unknown> })
        } else if (typeNormalized === 'videoobject') {
          results.push({ type: 'VideoObject', data: item as Record<string, unknown> })
        }

        // Check @graph array
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          for (const graphItem of item['@graph'] as Record<string, unknown>[]) {
            const gType = ((graphItem['@type'] as string) || '').toLowerCase()
            if (gType === 'product') results.push({ type: 'Product', data: graphItem })
            else if (gType === 'recipe') results.push({ type: 'Recipe', data: graphItem })
            else if (gType === 'article' || gType === 'newsarticle' || gType === 'blogposting') results.push({ type: 'Article', data: graphItem })
            else if (gType === 'videoobject') results.push({ type: 'VideoObject', data: graphItem })
          }
        }
      }
    } catch {
      // Skip malformed JSON-LD
    }
  })

  return results
}

/**
 * Extract high-quality images from a page.
 * Prefers: (1) OG image, (2) JSON-LD images, (3) article images > 400px, (4) product images.
 * Filters out icons, tracking pixels, and small images.
 */
export function extractPageImages(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)
  const images: string[] = []
  const seen = new Set<string>()

  function resolveUrl(src: string): string | null {
    if (!src) return null
    try {
      return new URL(src, baseUrl).href
    } catch {
      return null
    }
  }

  function addImage(src: string | null) {
    if (!src) return
    const resolved = resolveUrl(src)
    if (!resolved) return
    if (seen.has(resolved)) return
    // Filter out tracking pixels, icons, small images
    const lower = resolved.toLowerCase()
    if (lower.includes('pixel') || lower.includes('tracking') || lower.includes('favicon')) return
    if (lower.includes('.gif') && !lower.includes('animated')) return
    if (lower.endsWith('.svg') || lower.endsWith('.ico')) return
    seen.add(resolved)
    images.push(resolved)
  }

  // 1. OG image (highest priority)
  const ogImage = $('meta[property="og:image"]').attr('content')
  addImage(ogImage || null)

  // 2. JSON-LD images
  const structuredData = extractStructuredData(html)
  for (const sd of structuredData) {
    if (sd.data.image) {
      const imgData = sd.data.image
      if (typeof imgData === 'string') {
        addImage(imgData)
      } else if (Array.isArray(imgData)) {
        for (const img of imgData) {
          if (typeof img === 'string') addImage(img)
          else if (img && typeof img === 'object' && 'url' in img) addImage(String(img.url))
        }
      } else if (typeof imgData === 'object' && imgData && 'url' in imgData) {
        addImage(String((imgData as Record<string, unknown>).url))
      }
    }
    // Product images
    if (sd.data.offers && typeof sd.data.offers === 'object') {
      const offers = sd.data.offers as Record<string, unknown>
      if (offers.image && typeof offers.image === 'string') addImage(offers.image)
    }
  }

  // 3. Article images with reasonable size
  $('article img, main img, .post-content img, .entry-content img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src')
    const width = parseInt($(el).attr('width') || '0', 10)
    // Only include images that appear substantial (width > 200 or no width specified)
    if (width === 0 || width > 200) {
      addImage(src || null)
    }
  })

  // 4. Product gallery images
  $('[class*="product"] img, [class*="gallery"] img, [data-testid*="image"] img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src')
    addImage(src || null)
  })

  // Limit to 5 best images
  return images.slice(0, 5)
}
