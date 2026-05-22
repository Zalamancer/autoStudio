/**
 * Gemini API Service for generating animated scripts with expression/viseme cues
 */

import { withCreditGate } from './creditGate'
import { fetchWithRetry } from '@/utils/fetchWithRetry'

const GEMINI_FETCH_CONFIG = { maxRetries: 2, timeoutMs: 60_000, retryDelayMs: 1_000 } as const

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

export interface ScriptCue {
  type: 'expression' | 'viseme' | 'action'
  value: string
  timestamp?: string // e.g., "0:02" or relative like "start", "middle", "end"
}

export interface GeneratedScript {
  text: string // The actual spoken text (clean, no cues)
  cues: ScriptCue[]
  rawScript: string // The full script with inline cues for display
  spriteTimeline?: SpriteTimeline[] // Optional timeline of sprite changes
}

export interface GeminiGenerateOptions {
  topic?: string
  style?: 'casual' | 'professional' | 'energetic' | 'calm' | 'dramatic'
  duration?: 'short' | 'medium' | 'long' // ~10s, ~30s, ~60s
  includeExpressions?: boolean
  includeVisemes?: boolean
  character?: string // Character name/description for context
  spriteNames?: {
    head?: string[]
    viseme?: string[]
    hair?: string[]
    body?: string[]
  }
}

// Timeline event with sprite changes
export interface SpriteTimeline {
  time: string // "0:00", "0:05", etc.
  head?: string // sprite name
  body?: string
  hair?: string
  expression?: string // emotion/expression name
}

// Available expressions that can be suggested
const EXPRESSIONS = [
  'neutral', 'happy', 'sad', 'angry', 'surprised',
  'confused', 'thinking', 'excited', 'worried', 'skeptical'
]

// Available viseme emphasis points
const VISEME_EMPHASIS = [
  'wide-open', 'smile', 'pursed', 'rounded', 'relaxed'
]

export class GeminiService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Generate a script with expression and viseme cues
   */
  async generateScript(options: GeminiGenerateOptions = {}): Promise<GeneratedScript> {
    return withCreditGate('gemini-script', async () => this._generateScriptImpl(options))
  }

  private async _generateScriptImpl(options: GeminiGenerateOptions = {}): Promise<GeneratedScript> {
    const {
      topic = 'introducing yourself',
      style = 'casual',
      duration = 'medium',
      includeExpressions = true,
      includeVisemes = false,
      character = 'a friendly animated character',
      spriteNames
    } = options

    const durationGuide = {
      short: '1-2 sentences, about 10 seconds when spoken',
      medium: '3-5 sentences, about 30 seconds when spoken',
      long: '6-10 sentences, about 60 seconds when spoken'
    }

    // Build sprite info for the prompt
    let spriteInfo = ''
    if (spriteNames) {
      const parts: string[] = []
      if (spriteNames.head?.length) parts.push(`Head sprites: ${spriteNames.head.join(', ')}`)
      if (spriteNames.body?.length) parts.push(`Body sprites: ${spriteNames.body.join(', ')}`)
      if (spriteNames.hair?.length) parts.push(`Hair sprites: ${spriteNames.hair.join(', ')}`)
      if (parts.length > 0) {
        spriteInfo = `\n\nAvailable character sprites (use these names in timeline):
${parts.join('\n')}`
      }
    }

    const timelineInstructions = spriteNames ? `
- Generate a "spriteTimeline" array that specifies which sprite to show at each moment
- Each entry has "time" (in "M:SS" format), and optionally "head", "body", "hair", "expression"
- Match sprite changes to emotional moments in the script` : ''

    const timelineSchema = spriteNames ? `
  "spriteTimeline": [
    {"time": "0:00", "head": "neutral", "expression": "neutral"},
    {"time": "0:05", "head": "happy", "expression": "happy"}
  ]` : ''

    const prompt = `You are a script writer for animated characters. Generate a ${style} script for ${character} about: "${topic}".

Requirements:
- Length: ${durationGuide[duration]}
- The script should sound natural when spoken aloud
${includeExpressions ? `- Include expression cues in brackets like [happy], [surprised], [thinking]
- Available expressions: ${EXPRESSIONS.join(', ')}` : ''}
${includeVisemes ? `- Include mouth emphasis cues in brackets like [wide-open], [smile]
- Available mouth cues: ${VISEME_EMPHASIS.join(', ')}` : ''}${spriteInfo}${timelineInstructions}

Format your response as JSON with this structure:
{
  "rawScript": "The full script with [expression] cues inline",
  "cleanText": "Just the spoken text without any cues",
  "cues": [
    {"type": "expression", "value": "happy", "position": "start"},
    {"type": "expression", "value": "thinking", "position": "middle"}
  ]${timelineSchema ? ',' + timelineSchema : ''}
}

Only respond with valid JSON, no other text.`

    const response = await fetchWithRetry(
      `${GEMINI_API_URL}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      },
      GEMINI_FETCH_CONFIG,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()

    // Extract the text content from Gemini response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse the JSON response
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedContent = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleanedContent)

      return {
        text: parsed.cleanText || parsed.rawScript?.replace(/\[.*?\]/g, '').trim() || '',
        rawScript: parsed.rawScript || parsed.cleanText || '',
        cues: (parsed.cues || []).map((cue: any) => ({
          type: cue.type || 'expression',
          value: cue.value,
          timestamp: cue.position || cue.timestamp
        })),
        spriteTimeline: parsed.spriteTimeline || undefined
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract text manually
      console.warn('Failed to parse Gemini response as JSON, extracting text:', parseError)

      // Extract any bracketed expressions
      const cues: ScriptCue[] = []
      const expressionMatches = textContent.matchAll(/\[(\w+)\]/g)
      for (const match of expressionMatches) {
        if (EXPRESSIONS.includes(match[1].toLowerCase())) {
          cues.push({ type: 'expression', value: match[1].toLowerCase() })
        }
      }

      return {
        text: textContent.replace(/\[.*?\]/g, '').trim(),
        rawScript: textContent,
        cues
      }
    }
  }

  /**
   * Enhance existing script with expression cues
   */
  async enhanceScript(script: string): Promise<GeneratedScript> {
    const prompt = `Analyze this script and add appropriate expression cues for an animated character:

Script: "${script}"

Add expression cues in brackets at appropriate moments. Available expressions: ${EXPRESSIONS.join(', ')}

Format your response as JSON:
{
  "rawScript": "The script with [expression] cues added inline",
  "cleanText": "${script}",
  "cues": [
    {"type": "expression", "value": "happy", "position": "start"}
  ]
}

Only respond with valid JSON, no other text.`

    const response = await fetchWithRetry(
      `${GEMINI_API_URL}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      },
      GEMINI_FETCH_CONFIG,
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    try {
      const cleanedContent = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleanedContent)

      return {
        text: script,
        rawScript: parsed.rawScript || script,
        cues: parsed.cues || []
      }
    } catch {
      return {
        text: script,
        rawScript: script,
        cues: []
      }
    }
  }

  /**
   * Send a raw text prompt to Gemini and return the text response.
   * Used by translationService, documentParser, setupStockMedia, translationDubbing, etc.
   */
  async generateContent(prompt: string): Promise<string> {
    const response = await fetchWithRetry(
      `${GEMINI_API_URL}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        }),
      },
      GEMINI_FETCH_CONFIG,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  /**
   * Validate API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetchWithRetry(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Hi' }]
            }],
            generationConfig: {
              maxOutputTokens: 5,
            }
          }),
        },
        { maxRetries: 0, timeoutMs: 15_000 },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Gemini validation failed:', errorData)
        // Check for specific API key errors
        if (response.status === 400 || response.status === 403) {
          return false
        }
      }

      // If we got a response (even with errors), the key format is valid
      // Some errors like rate limits don't mean invalid key
      return response.ok || response.status === 429
    } catch (err) {
      console.error('Gemini validation error:', err)
      return false
    }
  }
}

// Singleton instance
let serviceInstance: GeminiService | null = null

export function getGeminiService(): GeminiService {
  if (!serviceInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (apiKey) {
      serviceInstance = new GeminiService(apiKey)
    } else {
      throw new Error('Gemini API key not configured. Please enter your API key.')
    }
  }
  return serviceInstance
}

export function initGeminiService(apiKey: string): GeminiService {
  serviceInstance = new GeminiService(apiKey)
  return serviceInstance
}

export function hasGeminiService(): boolean {
  return serviceInstance !== null || !!import.meta.env.VITE_GEMINI_API_KEY
}
