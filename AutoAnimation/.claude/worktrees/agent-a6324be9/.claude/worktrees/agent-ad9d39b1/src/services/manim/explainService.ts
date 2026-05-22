// ─── Pause-and-Explain AI Service ───────────────────────────────────────────
// When the viewer pauses the Manim video to ask a question, this service
// sends the question along with the current explanation context and knowledge
// graph to the server for an AI-powered answer. If the response indicates a
// supplementary visualization would help, it also triggers visual generation.

import type {
  ExplanationContext,
  ConceptNode,
  ExplainResponse,
} from '@/services/manim/types'

interface ExplainApiResponse {
  text: string
  shouldGenerateVisual: boolean
}

interface ExplainVisualApiResponse {
  videoUrl: string
}

/**
 * Ask an explain question about the current video context.
 *
 * Sends the question, current explanation context (what's on screen, active concepts,
 * surrounding narration), and the full knowledge graph to the server.
 *
 * If the server indicates a supplementary visualization would help, a second
 * request is fired to generate that visual. The returned ExplainResponse will
 * have `isGeneratingVisual: true` while the visual is in flight; callers
 * should poll or update the response once the visual resolves.
 */
export async function askExplainQuestion(
  question: string,
  context: ExplanationContext,
  knowledgeGraph: ConceptNode[],
): Promise<ExplainResponse> {
  const res = await fetch('/api/manim/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context, knowledgeGraph }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Explain API error (${res.status}): ${errorBody}`)
  }

  const data = (await res.json()) as ExplainApiResponse

  const response: ExplainResponse = {
    text: data.text,
    isGeneratingVisual: data.shouldGenerateVisual,
  }

  // If the AI determines a supplementary visualization would help,
  // trigger visual generation in the background
  if (data.shouldGenerateVisual) {
    generateSupplementaryVisual(question, context, knowledgeGraph)
      .then((visualResult) => {
        response.supplementaryVideoUrl = visualResult.videoUrl
        response.isGeneratingVisual = false
      })
      .catch(() => {
        // Visual generation is optional; don't fail the entire response
        response.isGeneratingVisual = false
      })
  }

  return response
}

/**
 * Generate a supplementary Manim visualization to help explain a concept.
 * This is called automatically when the explain AI determines a visual aid would help.
 */
async function generateSupplementaryVisual(
  question: string,
  context: ExplanationContext,
  knowledgeGraph: ConceptNode[],
): Promise<ExplainVisualApiResponse> {
  const res = await fetch('/api/manim/explain-visual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context, knowledgeGraph }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Explain visual API error (${res.status}): ${errorBody}`)
  }

  return (await res.json()) as ExplainVisualApiResponse
}
