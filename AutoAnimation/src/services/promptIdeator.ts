// ── Prompt Ideator ───────────────────────────────────────────────────────────
// Turn a single topic / area-of-interest into N distinct short-form clip
// prompts ready to feed into the orchestrator's batch pipeline.
//
// Each generated prompt is shaped so the existing planGenerator can consume
// it directly: a hook-style angle + concrete narrative + duration cue.

import { callGeminiText } from '@/services/aiProxy'
import type { FetchRetryConfig } from '@/utils/fetchWithRetry'

export interface IdeateOptions {
  /** Free-form topic, area of interest, or rough idea. */
  topic: string
  /** How many distinct prompts to generate. Clamped to [1, 50]. */
  count: number
  /** Target clip duration in seconds, used to size the script suggestion. */
  durationSeconds?: number
  /** Aspect ratio hint (e.g. '9:16') so prompts skew toward vertical/short formats. */
  aspectRatio?: string
  /** Optional tone hint, e.g. "informative", "controversial", "funny". */
  tone?: string
}

export interface IdeateResult {
  prompts: string[]
  /** Parallel array of short titles, useful for previewing before commit. */
  titles: string[]
}

// Use the project's standard model — gemini-3-flash-preview.
// (CLAUDE.md AI Model Policy: cheap/fast tier for standard generation.)
const MODEL = 'gemini-3-flash-preview'

const RETRY_CONFIG: FetchRetryConfig = {
  maxRetries: 3,
  timeoutMs: 60_000,
  retryDelayMs: 1_500,
}

/**
 * Brainstorm `count` distinct short-form video prompts from a single topic.
 * Returns prompts the BatchCreatePanel can drop straight into its textarea.
 */
export async function generatePromptsFromTopic(opts: IdeateOptions): Promise<IdeateResult> {
  const topic = opts.topic.trim()
  if (!topic) return { prompts: [], titles: [] }

  const count = Math.max(1, Math.min(50, Math.round(opts.count)))
  const duration = opts.durationSeconds && opts.durationSeconds > 0 ? opts.durationSeconds : 60
  const aspectHint =
    opts.aspectRatio === '9:16' || opts.aspectRatio === '1:1'
      ? 'vertical short-form (TikTok / Reels / Shorts)'
      : 'short-form social video'
  const toneLine = opts.tone ? `\nDesired tone: ${opts.tone}` : ''

  const prompt = `You are a short-form video brainstorming assistant.

Topic / area of interest:
"""${topic}"""

Generate ${count} DISTINCT video ideas around this topic, each suitable for a ${duration}s ${aspectHint} clip.${toneLine}

Each idea must be:
- A unique angle / hook (no two ideas should overlap)
- Concrete and shootable (not vague — "5 specific examples", not "things about X")
- Self-contained (a viewer with no prior context can follow it)
- Optimised for retention (curiosity gap, surprise, payoff in last 5s)

Return ONLY valid JSON, no markdown fences, in this exact shape:
{
  "ideas": [
    { "title": "8-12 word punchy title", "prompt": "1-3 sentence creative brief that names the hook, the visual treatment, and the payoff. End with the duration: '~${duration}s'." }
  ]
}

Make sure ideas[] has exactly ${count} entries.`

  let raw: string
  try {
    raw = await callGeminiText(MODEL, prompt, { temperature: 0.85, topP: 0.95, maxOutputTokens: 4096 }, RETRY_CONFIG)
  } catch (err) {
    throw new Error(humanizeGeminiError(err, MODEL))
  }

  if (!raw || !raw.trim()) {
    throw new Error('Gemini returned an empty response. Try a different topic or fewer ideas.')
  }

  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/gi, '')
    .trim()

  let parsed: { ideas?: { title?: string; prompt?: string }[] }
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    // Salvage: try to find the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error(
        `Failed to parse ideator response. First 200 chars: "${cleaned.slice(0, 200)}". ${err instanceof Error ? err.message : err}`,
      )
    }
    parsed = JSON.parse(match[0])
  }

  const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : []
  const titles: string[] = []
  const prompts: string[] = []
  for (const idea of ideas) {
    const t = (idea?.title || '').toString().trim()
    const p = (idea?.prompt || '').toString().trim()
    if (!p) continue
    titles.push(t || p.split('.')[0].slice(0, 80))
    prompts.push(p)
  }

  if (prompts.length === 0) {
    throw new Error('Gemini returned a response but no usable ideas. Try a more specific topic.')
  }

  return { prompts, titles }
}

/**
 * Translate raw `Gemini API error: 500 - {...}` strings into a sentence the
 * batch panel can show without leaking JSON.
 */
function humanizeGeminiError(err: unknown, model: string): string {
  const raw = err instanceof Error ? err.message : String(err)
  const statusMatch = raw.match(/Gemini API error:\s*(\d+)/i)
  const status = statusMatch ? Number(statusMatch[1]) : null

  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return `Gemini "${model}" is temporarily unavailable (HTTP ${status}). Retrying didn't help.`
  }
  if (status === 429) {
    const quotaMsg = extractQuotaMessage(raw)
    // Billing depletion is NOT a retry-able rate limit — surface it plainly.
    if (quotaMsg && /prepayment credits|billing|depleted|insufficient/i.test(quotaMsg)) {
      return `Gemini "${model}" billing issue: ${quotaMsg}. Top up at https://ai.studio/projects — retrying won't help.`
    }
    // Actual per-minute / per-day quota — extract Gemini's suggested retryDelay when present.
    const retrySecs = extractRetryDelaySeconds(raw)
    const wait = retrySecs ? `about ${retrySecs}s` : 'a minute'
    const detail = quotaMsg ? ` Reason: ${quotaMsg}.` : ''
    return `Gemini "${model}" rate-limited the request. Wait ${wait} and try again.${detail}`
  }
  if (status === 400) {
    // Likely a prompt/safety issue — surface upstream message if present
    const bodyMatch = raw.match(/-\s*(\{[\s\S]*\}|.+)$/)
    return `Gemini "${model}" rejected the request. ${bodyMatch ? bodyMatch[1].slice(0, 200) : ''}`.trim()
  }
  return `Gemini "${model}" call failed: ${raw}`
}

/** Extract "42s" -> 42 from a Gemini RetryInfo detail block in the error body. */
function extractRetryDelaySeconds(raw: string): number | null {
  const match = raw.match(/"retryDelay"\s*:\s*"(\d+)s"/i)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Pull the short human-readable quota reason from the Gemini error message. */
function extractQuotaMessage(raw: string): string | null {
  const match = raw.match(/"message"\s*:\s*"([^"\\]{0,160})/)
  if (!match) return null
  const msg = match[1].trim()
  if (!msg) return null
  return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg
}
