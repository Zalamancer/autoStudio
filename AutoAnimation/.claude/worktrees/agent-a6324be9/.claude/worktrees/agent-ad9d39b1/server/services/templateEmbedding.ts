/**
 * Template Embedding Service — Gemini Embedding 2
 *
 * Generates embeddings for kinetic typography templates to compute
 * novelty scores (cosine distance to nearest existing template).
 *
 * Uses Gemini Embedding 2 (3072-dim, Matryoshka support for 768/1536/3072).
 * We use 768-dim for storage efficiency — sufficient for novelty detection.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const EMBED_MODEL = 'gemini-embedding-exp-03-07' // Gemini Embedding 2
const EMBED_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`
const EMBED_DIM = 768 // Matryoshka: use 768 for efficiency

// ── Types ────────────────────────────────────────────────────────────

export interface TemplateEmbedding {
  id: string
  vector: number[]
  metadata: {
    title: string
    description: string
    category: string
    lineCount: number
    techniques: string[]
  }
}

interface EmbedResponse {
  embedding: {
    values: number[]
  }
}

// ── Core functions ───────────────────────────────────────────────────

/**
 * Generate embedding for a template description + code summary.
 * We embed the semantic description, not raw code — the description
 * captures the visual effect which is what we compare for novelty.
 */
export async function embedTemplate(
  id: string,
  title: string,
  description: string,
  tags: string[],
  codeSummary: string,
): Promise<number[]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set')

  // Combine semantic signals into one embedding input
  const text = [
    `Template: ${title}`,
    `Effect: ${description}`,
    `Tags: ${tags.join(', ')}`,
    `Animation: ${codeSummary}`,
  ].join('\n')

  const res = await fetch(`${EMBED_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: EMBED_DIM,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini Embed 2 error: ${res.status} ${err}`)
  }

  const data = (await res.json()) as EmbedResponse
  return data.embedding.values
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Compute novelty score for a template against existing embeddings.
 * Returns 0-1 where 1 = completely novel, 0 = identical to existing.
 */
export function noveltyScore(embedding: number[], existingEmbeddings: number[][]): number {
  if (existingEmbeddings.length === 0) return 1

  let maxSimilarity = -1
  for (const existing of existingEmbeddings) {
    const sim = cosineSimilarity(embedding, existing)
    if (sim > maxSimilarity) maxSimilarity = sim
  }

  // Convert similarity to novelty (1 - max_similarity)
  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, 1 - maxSimilarity))
}

/**
 * Batch embed multiple templates.
 * Gemini Embed 2 supports batch requests but we'll do sequential with rate limiting.
 */
export async function batchEmbedTemplates(
  templates: { id: string; title: string; description: string; tags: string[]; codeSummary: string }[],
): Promise<Map<string, number[]>> {
  const results = new Map<string, number[]>()

  for (const tpl of templates) {
    try {
      const vector = await embedTemplate(tpl.id, tpl.title, tpl.description, tpl.tags, tpl.codeSummary)
      results.set(tpl.id, vector)
      // Rate limit: 100ms between requests
      await new Promise((r) => setTimeout(r, 100))
    } catch (err) {
      console.error(`Failed to embed ${tpl.id}:`, err)
    }
  }

  return results
}

/**
 * Extract animation technique summary from template code.
 * Used as part of the embedding input to capture code-level patterns.
 */
export function extractCodeSummary(code: string): string {
  const techniques: string[] = []

  if (/rotateY|rotateX/.test(code)) techniques.push('3D rotation')
  if (/clipPath|clip-path/.test(code)) techniques.push('clip-path reveal')
  if (/\.split\(['"]/.test(code)) techniques.push('per-character animation')
  if (/Math\.sin|Math\.cos/.test(code)) techniques.push('trigonometric oscillation')
  if (/Math\.random/.test(code)) techniques.push('randomized elements')
  if (/perspective/.test(code)) techniques.push('3D perspective')
  if (/easeOut|easeIn/.test(code)) techniques.push('custom easing')
  if (/blur\(/.test(code)) techniques.push('blur filter')
  if (/textShadow|text-shadow/.test(code)) techniques.push('text shadow layers')
  if (/translateX|translateY/.test(code)) techniques.push('translation')
  if (/scaleX|scaleY|scale\(/.test(code)) techniques.push('scale transform')
  if (/mixBlendMode|mix-blend-mode/.test(code)) techniques.push('blend modes')
  if (/SVG|svg|<path|<circle|<line/.test(code)) techniques.push('SVG elements')
  if (/gradient/.test(code)) techniques.push('gradients')

  const lineCount = code.split('\n').length
  techniques.push(`${lineCount} lines`)

  return techniques.join(', ')
}
