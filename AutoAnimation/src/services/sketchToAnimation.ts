/**
 * Sketch-to-Animation Service
 *
 * Analyzes hand-drawn sketches using Gemini vision, extracts scene elements
 * (characters, text, motion paths, objects), and generates a ClipPlan
 * that the orchestrator can execute to create a full animation.
 */

import type { SketchAnalysis, SketchToAnimationConfig, SketchPipelineStatus } from '@/types/sketchToAnimation'
import type { ClipPlan } from '@/types/orchestrator'
import { withCreditGate } from './creditGate'
import { callGeminiProxy } from '@/services/aiProxy'

const GEMINI_VISION_URL = 'gemini-3-flash-preview' // model name for callGeminiProxy

const SKETCH_ANALYSIS_PROMPT = `You are an expert at analyzing hand-drawn sketches, whiteboard photos, and storyboards for animation production.

Analyze this sketch image and extract all visual elements. Return ONLY valid JSON (no markdown, no code fences):

{
  "sceneDescription": "Overall description of what the sketch depicts",
  "characters": [
    {
      "name": "Character name or label",
      "description": "Visual description suitable for AI character generation (appearance, clothing, style)",
      "position": { "x": 50, "y": 50 },
      "relativeSize": 0.3,
      "expression": "happy/neutral/sad/angry/surprised",
      "speechText": "Text from speech bubble if present"
    }
  ],
  "textLabels": [
    {
      "text": "Detected text content",
      "position": { "x": 50, "y": 20 },
      "role": "title|subtitle|dialogue|annotation|label",
      "sizeHint": "small|medium|large"
    }
  ],
  "motionPaths": [
    {
      "description": "Description of the motion indicated",
      "from": { "x": 20, "y": 50 },
      "to": { "x": 80, "y": 50 },
      "associatedWith": "Character or object name",
      "type": "linear|arc|zigzag|loop"
    }
  ],
  "backgroundDescription": "Description of the background/scene setting",
  "objects": [
    {
      "name": "Object name",
      "description": "Visual description for SVG generation",
      "position": { "x": 50, "y": 50 },
      "relativeSize": 0.1
    }
  ],
  "suggestedStyle": "cartoon|realistic|minimal|sketch",
  "suggestedMood": "cheerful/serious/dramatic/calm/energetic",
  "isStoryboard": false,
  "panels": []
}

RULES:
- Positions are percentages (0-100) of the image dimensions
- Relative sizes are fractions of the canvas (0.0-1.0)
- Detect ALL text, including handwritten annotations, labels, speech bubbles
- Arrows indicate motion direction/paths
- If the sketch has multiple panels separated by borders, set isStoryboard=true and fill panels array
- For characters, provide detailed descriptions suitable for AI image generation
- If text is illegible, note it as "[illegible]"
- Interpret rough shapes as their intended objects (circle with lines = sun, rectangle = building, etc.)`

/**
 * Analyze a sketch image using Gemini vision.
 */
export async function analyzeSketch(imageDataUrl: string): Promise<SketchAnalysis> {
  return withCreditGate('gemini-script', () => _analyzeSketchImpl(imageDataUrl))
}

async function _analyzeSketchImpl(imageDataUrl: string): Promise<SketchAnalysis> {
  // Extract base64 data and MIME type
  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid image data URL')
  const mimeType = match[1]
  const base64Data = match[2]

  const response = await callGeminiProxy(GEMINI_VISION_URL, {
    contents: [
      {
        parts: [
          { text: SKETCH_ANALYSIS_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return JSON.parse(text) as SketchAnalysis
}

/**
 * Convert a sketch analysis into a ClipPlan for the orchestrator.
 */
export function sketchToClipPlan(analysis: SketchAnalysis, config: SketchToAnimationConfig): ClipPlan {
  const duration = config.targetDuration || 15
  const style = config.styleOverride || analysis.suggestedStyle

  // Build characters from detected figures
  const characters = analysis.characters.map((char, idx) => ({
    name: char.name || `Character ${idx + 1}`,
    generateNew: config.generateCharacters,
    referenceDescription: char.description,
    position: char.position,
    scale: Math.max(0.5, Math.min(2, char.relativeSize * 4)),
    voiceName: undefined,
  }))

  // Build dialogue from speech bubbles and text labels
  const dialogue = analysis.characters
    .filter((char) => char.speechText)
    .map((char) => ({
      characterName: char.name,
      script: char.speechText || '',
      emotion: char.expression,
    }))

  // Build text overlays from detected labels
  const textOverlays = analysis.textLabels
    .filter((label) => label.role !== 'dialogue')
    .map((label, idx) => {
      const presetMap: Record<string, 'title' | 'subtitle' | 'lower-third' | 'cta' | 'quote' | 'watermark'> = {
        title: 'title',
        subtitle: 'subtitle',
        annotation: 'lower-third',
        label: 'lower-third',
      }
      return {
        preset: presetMap[label.role] || ('subtitle' as const),
        content: label.text,
        startPercent: idx / Math.max(analysis.textLabels.length, 1),
        endPercent: (idx + 1) / Math.max(analysis.textLabels.length, 1),
      }
    })

  // Build SVG objects from detected objects
  const svgObjects = analysis.objects.map((obj) => ({
    prompt: obj.description,
    startPercent: 0,
    endPercent: 1,
    keyframes: [
      { time: 0, x: obj.position.x, y: obj.position.y, scale: 1, opacity: 0 },
      { time: 0.1, x: obj.position.x, y: obj.position.y, scale: 1, opacity: 1 },
      { time: 0.9, x: obj.position.x, y: obj.position.y, scale: 1, opacity: 1 },
      { time: 1, x: obj.position.x, y: obj.position.y, scale: 1, opacity: 0 },
    ],
    width: Math.round(obj.relativeSize * 200),
    height: Math.round(obj.relativeSize * 200),
  }))

  // Build shapes from motion paths (as visual indicators)
  const shapes = analysis.motionPaths.map((path) => ({
    type: 'rectangle' as const,
    position: { x: (path.from.x + path.to.x) / 2, y: (path.from.y + path.to.y) / 2 },
    width: 4,
    height: Math.sqrt(Math.pow(path.to.x - path.from.x, 2) + Math.pow(path.to.y - path.from.y, 2)),
    fill: '#ffffff',
    opacity: 0.3,
    startPercent: 0,
    endPercent: 1,
  }))

  const plan: ClipPlan = {
    canvas: {
      aspectRatio: '16:9',
      fps: 30,
      durationSeconds: duration,
    },
    background: config.generateBackground
      ? {
          type: 'svg-generate' as const,
          svgPrompt: `${analysis.backgroundDescription}. Style: ${style}. Mood: ${analysis.suggestedMood}`,
        }
      : {
          type: 'lottie' as const,
          lottieQuery: 'abstract background',
        },
    characters,
    dialogue,
    textOverlays,
    shapes,
    svgObjects: svgObjects.length > 0 ? svgObjects : undefined,
    captions: {
      style: 'word-by-word',
      position: 'bottom',
    },
  }

  return plan
}

/**
 * Vectorize a sketch image to clean SVG using Gemini vision.
 * Returns an SVG string.
 */
export async function vectorizeSketch(imageDataUrl: string): Promise<string> {
  return withCreditGate('gemini-script', () => _vectorizeSketchImpl(imageDataUrl))
}

async function _vectorizeSketchImpl(imageDataUrl: string): Promise<string> {
  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid image data URL')
  const mimeType = match[1]
  const base64Data = match[2]

  const response = await callGeminiProxy(GEMINI_VISION_URL, {
    contents: [
      {
        parts: [
          {
            text: `Convert this hand-drawn sketch into a clean SVG illustration.

Rules:
- Output ONLY the SVG markup (no markdown fences, no explanation)
- Use clean geometric shapes and smooth bezier paths
- Preserve the layout and proportions of the original sketch
- Use a simple color palette (2-4 colors)
- Set viewBox to "0 0 1920 1080"
- Make lines clean and consistent width
- Convert rough shapes to proper geometric equivalents`,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 8192,
    },
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  let svgText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Clean up the response - extract SVG if wrapped in code fences
  const svgMatch = svgText.match(/<svg[\s\S]*<\/svg>/i)
  if (svgMatch) {
    svgText = svgMatch[0]
  }

  return svgText
}

/** Status callback type */
export type SketchStatusCallback = (status: SketchPipelineStatus, detail?: string) => void

/**
 * Full sketch-to-animation pipeline.
 * Analyzes the sketch, generates a ClipPlan, and returns it for orchestrator execution.
 */
export async function processSketchToAnimation(
  imageDataUrl: string,
  config: SketchToAnimationConfig,
  onStatus?: SketchStatusCallback,
): Promise<{ analysis: SketchAnalysis; plan: ClipPlan; vectorSvg?: string }> {
  // Step 1: Analyze the sketch
  onStatus?.('analyzing', 'Analyzing sketch with AI vision...')
  const analysis = await analyzeSketch(imageDataUrl)

  // Step 2: Optionally vectorize
  let vectorSvg: string | undefined
  if (config.vectorize) {
    onStatus?.('vectorizing', 'Converting sketch to clean SVG...')
    vectorSvg = await vectorizeSketch(imageDataUrl)
  }

  // Step 3: Generate ClipPlan
  onStatus?.('generating-plan', 'Building animation plan...')
  const plan = sketchToClipPlan(analysis, config)

  onStatus?.('complete', 'Sketch analysis complete')

  return { analysis, plan, vectorSvg }
}
