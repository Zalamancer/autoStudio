/**
 * articleParser.ts
 *
 * Server-side article processing: splits articles into sections by heading hierarchy,
 * and uses Gemini for section-aware video summarization.
 */

import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

// ── Types ──

export interface ArticleSection {
  heading: string
  text: string
  images: string[]
  wordCount: number
  level: number
}

export interface VideoScript {
  sectionHeading: string
  narrationText: string
  visualDescription: string
  durationSec: number
  transitionType: 'fade' | 'slide' | 'zoom' | 'cut'
}

// ── Public API ──

/**
 * Parse article HTML into structured sections using Readability + heading detection.
 * Falls back to paragraph-based splitting when headings are absent.
 */
export function parseArticleSections(html: string, baseUrl?: string): ArticleSection[] {
  // First use Readability to get clean article HTML
  const dom = new JSDOM(html, { url: baseUrl || 'https://example.com' })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  if (!article || !article.content) {
    // Fallback: extract text from body
    const fallbackDom = new JSDOM(html)
    const body = fallbackDom.window.document.body
    if (!body) return []
    return splitByParagraphs(body.textContent || '')
  }

  // Parse the clean article HTML into sections
  const contentDom = new JSDOM(`<html><body>${article.content}</body></html>`)
  const contentBody = contentDom.window.document.body

  const sections: ArticleSection[] = []
  let currentSection: ArticleSection = {
    heading: article.title || 'Introduction',
    text: '',
    images: [],
    wordCount: 0,
    level: 1,
  }

  const children = Array.from(contentBody.childNodes)

  for (const node of children) {
    if (node.nodeType === 1) {
      const el = node as Element
      const tagName = el.tagName?.toLowerCase()

      // Detect headings
      if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
        // Save the current section if it has content
        if (currentSection.text.trim()) {
          currentSection.wordCount = countWords(currentSection.text)
          sections.push({ ...currentSection })
        }

        // Start a new section
        const level = parseInt(tagName.charAt(1), 10)
        currentSection = {
          heading: el.textContent?.trim() || 'Untitled Section',
          text: '',
          images: [],
          wordCount: 0,
          level,
        }
      } else if (tagName === 'img') {
        const src = el.getAttribute('src')
        if (src) {
          try {
            const resolvedUrl = baseUrl ? new URL(src, baseUrl).href : src
            currentSection.images.push(resolvedUrl)
          } catch {
            currentSection.images.push(src)
          }
        }
      } else if (tagName === 'figure') {
        // Extract image from figure
        const img = el.querySelector('img')
        if (img) {
          const src = img.getAttribute('src')
          if (src) {
            try {
              const resolvedUrl = baseUrl ? new URL(src, baseUrl).href : src
              currentSection.images.push(resolvedUrl)
            } catch {
              currentSection.images.push(src)
            }
          }
        }
        // Also extract any text from figcaption
        const caption = el.querySelector('figcaption')
        if (caption) {
          currentSection.text += ' ' + (caption.textContent || '')
        }
      } else {
        // Accumulate text from paragraphs, lists, blockquotes etc.
        const text = el.textContent?.trim()
        if (text) {
          currentSection.text += (currentSection.text ? '\n\n' : '') + text
        }

        // Extract images nested in the element
        const nestedImgs = el.querySelectorAll('img')
        for (const img of nestedImgs) {
          const src = img.getAttribute('src')
          if (src) {
            try {
              const resolvedUrl = baseUrl ? new URL(src, baseUrl).href : src
              currentSection.images.push(resolvedUrl)
            } catch {
              currentSection.images.push(src)
            }
          }
        }
      }
    } else if (node.nodeType === 3) {
      // Text node
      const text = node.textContent?.trim()
      if (text) {
        currentSection.text += (currentSection.text ? ' ' : '') + text
      }
    }
  }

  // Push the last section
  if (currentSection.text.trim()) {
    currentSection.wordCount = countWords(currentSection.text)
    sections.push(currentSection)
  }

  // If no sections were created from headings, fall back to paragraph splitting
  if (sections.length === 0) {
    return splitByParagraphs(article.textContent || '')
  }

  return sections
}

/**
 * Given sections and a target duration, allocate time proportionally to word count.
 */
export function allocateSectionDurations(
  sections: ArticleSection[],
  targetDurationSec: number,
): VideoScript[] {
  const enabledSections = sections.filter((s) => s.wordCount > 0)
  const totalWords = enabledSections.reduce((sum, s) => sum + s.wordCount, 0)

  if (totalWords === 0 || enabledSections.length === 0) return []

  const MIN_SECTION_DURATION = 3
  const scripts: VideoScript[] = []

  for (const section of enabledSections) {
    const proportion = section.wordCount / totalWords
    const rawDuration = proportion * targetDurationSec
    const duration = Math.max(MIN_SECTION_DURATION, Math.round(rawDuration))

    // Condense section text to ~20 words for narration
    const narration = condenseSectionText(section.text, 30)

    scripts.push({
      sectionHeading: section.heading,
      narrationText: narration,
      visualDescription: `Visual for section about: ${section.heading}`,
      durationSec: duration,
      transitionType: 'fade',
    })
  }

  // Normalize durations to match target
  const totalAllocated = scripts.reduce((sum, s) => sum + s.durationSec, 0)
  if (totalAllocated > 0 && Math.abs(totalAllocated - targetDurationSec) > 2) {
    const scale = targetDurationSec / totalAllocated
    for (const script of scripts) {
      script.durationSec = Math.max(MIN_SECTION_DURATION, Math.round(script.durationSec * scale))
    }
  }

  return scripts
}

// ── Helpers ──

function countWords(text: string): number {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 0).length
}

function condenseSectionText(text: string, maxWords: number): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  if (words.length <= maxWords) return words.join(' ')
  // Take the first and last few words
  const firstPart = words.slice(0, Math.floor(maxWords * 0.7))
  return firstPart.join(' ') + '...'
}

function splitByParagraphs(text: string): ArticleSection[] {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 50)

  if (paragraphs.length === 0) {
    return [
      {
        heading: 'Content',
        text: text.slice(0, 5000),
        images: [],
        wordCount: countWords(text.slice(0, 5000)),
        level: 1,
      },
    ]
  }

  // Group paragraphs into sections (about 3-5 paragraphs per section)
  const PARAGRAPHS_PER_SECTION = 3
  const sections: ArticleSection[] = []
  for (let i = 0; i < paragraphs.length; i += PARAGRAPHS_PER_SECTION) {
    const chunk = paragraphs.slice(i, i + PARAGRAPHS_PER_SECTION)
    const sectionText = chunk.join('\n\n')
    sections.push({
      heading: `Section ${sections.length + 1}`,
      text: sectionText,
      images: [],
      wordCount: countWords(sectionText),
      level: 2,
    })
  }

  return sections
}
