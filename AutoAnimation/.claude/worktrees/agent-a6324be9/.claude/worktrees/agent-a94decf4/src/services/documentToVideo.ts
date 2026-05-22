/**
 * documentToVideo.ts
 *
 * Builds orchestrator prompts from document extractions,
 * mapping page types to appropriate visual treatments.
 */

import type { DocumentExtraction } from '@/types/document'

export interface DocumentVideoSettings {
  pagesPerScene: number
  targetDuration: number
  includePageImages: boolean
  narrationStyle: 'formal' | 'conversational' | 'educational'
  transitionStyle: 'fade' | 'slide' | 'zoom' | 'none'
}

/**
 * Build an orchestrator prompt from a document extraction.
 * Maps each page/scene to appropriate visual treatments based on page type.
 */
export function buildDocumentPrompt(
  extraction: DocumentExtraction,
  settings: DocumentVideoSettings,
): string {
  const enabledPages = extraction.pages.filter((p) => p.enabled)

  if (enabledPages.length === 0) {
    return `Create a video about: ${extraction.title}`
  }

  // Group pages into scenes
  const scenes: Array<{ pages: typeof enabledPages; heading: string }> = []
  for (let i = 0; i < enabledPages.length; i += settings.pagesPerScene) {
    const group = enabledPages.slice(i, i + settings.pagesPerScene)
    const heading = group[0].headings[0] || `Page ${group[0].pageNumber}`
    scenes.push({ pages: group, heading })
  }

  // Allocate time per scene
  const timePerScene = Math.max(3, Math.round(settings.targetDuration / scenes.length))

  // Build scene descriptions
  const sceneDescriptions = scenes.map((scene, i) => {
    const pageNumbers = scene.pages.map((p) => p.pageNumber).join(', ')
    const pageTypes = [...new Set(scene.pages.map((p) => p.pageType))]
    const keyText = scene.pages
      .map((p) => p.text.slice(0, 100))
      .join(' ')
      .slice(0, 200)

    let visualDirection = ''
    if (pageTypes.includes('title')) {
      visualDirection = 'Use a cinematic title card template with large text reveal.'
    } else if (pageTypes.includes('table')) {
      visualDirection = 'Use an animated data table or chart template to display the data.'
    } else if (pageTypes.includes('chart')) {
      visualDirection = 'Use an animated chart template to visualize the data.'
    } else if (pageTypes.includes('image-heavy')) {
      visualDirection = 'Use Ken Burns pan over the page image as a background.'
    } else {
      visualDirection = 'Show key text as animated text overlays with relevant stock imagery.'
    }

    return `Scene ${i + 1} (${timePerScene}s, pages ${pageNumbers}): "${scene.heading}" — ${visualDirection} Key content: "${keyText.slice(0, 150)}..."`
  }).join('\n')

  const narrationTone = settings.narrationStyle === 'formal' ? 'professional and authoritative'
    : settings.narrationStyle === 'conversational' ? 'friendly and conversational'
    : 'clear and educational'

  const prompt = `Create a ${settings.targetDuration}-second document walkthrough video for "${extraction.title}"${extraction.author ? ` by ${extraction.author}` : ''}.

This is a ${extraction.pageCount}-page document. Use a narrator character with a ${narrationTone} tone.

SCENES:
${sceneDescriptions}

The video should:
- Start with the document title as an intro (3 seconds)
- Walk through each section with appropriate visuals
- Use ${settings.transitionStyle} transitions between scenes
- End with a summary/conclusion scene
- Include text overlays for key headings and important quotes

Total duration: ${settings.targetDuration} seconds. Aspect ratio: 16:9 (landscape, best for document content).`

  return prompt
}
