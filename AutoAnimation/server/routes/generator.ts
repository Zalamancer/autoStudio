/**
 * Vertex AI sprite sheet & emotion head generation routes.
 * Extracted from server/index.ts for maintainability.
 */

import { Router } from 'express'
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai'
import { validate } from '../middleware/validate'
import { spriteGenerationBody } from '../schemas/index'
import logger from '../lib/logger'

const router = Router()

// Lazy Vertex AI initialization
const projectId = process.env.GCP_PROJECT_ID
const location = process.env.GCP_LOCATION || 'us-central1'
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview'

let _vertexAI: VertexAI | null = null
function getVertexAI(): VertexAI {
  if (!_vertexAI) {
    if (!projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required for Vertex AI endpoints')
    }
    _vertexAI = new VertexAI({ project: projectId, location })
  }
  return _vertexAI
}

// Shared safety settings for image generation
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

const generationConfig = {
  temperature: 0.4,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseModalities: ['TEXT', 'IMAGE'] as any,
}

// Shared viseme definitions
const visemeDescriptions: Record<string, string> = {
  Aa: 'wide open mouth (AH/EYE)',
  D: 'tongue behind upper teeth (D/T/N)',
  Ee: 'wide smile showing teeth (EE)',
  F: 'lower lip under teeth (F/V)',
  L: 'tongue tip up behind teeth (L/TH)',
  M: 'lips pressed together (M/B/P)',
  O: 'rounded open mouth (OH)',
  R: 'slightly open, tongue pulled back (R/ER)',
  S: 'teeth together, lips slightly parted (S/Z)',
  U: 'pursed lips (OO/W)',
  W: 'rounded pursed lips (W)',
  Rest: 'closed, relaxed mouth',
}

const visemes = ['Aa', 'D', 'Ee', 'F', 'L', 'M', 'O', 'R', 'S', 'U', 'W', 'Rest']

function buildVisemePrompt(stylePrompt?: string): string {
  const visemeList = visemes.map((v, i) => `${i + 1}. ${v}: ${visemeDescriptions[v]}`).join(', ')
  const styleInstruction = stylePrompt ? `\nStyle: ${stylePrompt}` : ''

  return `Based on this reference character image, generate a sprite sheet showing the character's mouth/lips in different positions.

Create a 12-column × 1-row grid (12 cells total) showing ONLY the mouth area:

${visemeList}

Requirements:
- Keep the EXACT same art style, colors, and character design as the reference
- Show ONLY the mouth/lower face area for each cell
- Each cell must be the same size
- Clean grid layout with visible separation between cells
- White or transparent background
- Maintain consistent lighting and style across all 12 cells${styleInstruction}`
}

/** Find image or text part from Vertex AI response */
function extractParts(candidate: any) {
  const imagePart = candidate?.content?.parts?.find(
    (part: any) => part.inlineData?.mimeType?.startsWith('image/')
  )
  const textPart = candidate?.content?.parts?.find((part: any) => part.text)
  return { imagePart, textPart }
}

// ── Generate full viseme sprite sheet ──

router.post('/generate-full-sheet', validate({ body: spriteGenerationBody }), async (req, res) => {
  try {
    const { referenceImage, stylePrompt } = req.body
    const prompt = buildVisemePrompt(stylePrompt)

    const model = getVertexAI().getGenerativeModel({ model: IMAGE_MODEL, generationConfig, safetySettings })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: referenceImage.replace(/^data:image\/\w+;base64,/, '') } },
          { text: prompt },
        ],
      }],
    })

    const candidate = response.response.candidates?.[0]
    if (!candidate?.content?.parts) {
      logger.error('No content in response')
      return res.status(500).json({ error: 'No content generated', code: 'NO_CONTENT' })
    }

    const { imagePart, textPart } = extractParts(candidate)

    if (imagePart?.inlineData?.data) {
      return res.json({
        image: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        gridSize: { columns: 12, rows: 1 },
        visemeOrder: visemes,
      })
    }

    if (textPart?.text) {
      return res.status(500).json({
        error: 'Model returned text instead of image',
        code: 'TEXT_RESPONSE',
        message: textPart.text.substring(0, 500),
      })
    }

    return res.status(500).json({ error: 'No image generated', code: 'NO_IMAGE' })
  } catch (error) {
    logger.error({ err: error }, 'Full sheet generation error')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: 'Generation failed', code: 'GENERATION_FAILED', message: errorMessage })
  }
})

// ── Generate emotion head sprite sheet (6×4) ──

const emotionDescriptions: Record<string, { name: string; intensities: string[] }> = {
  Joy: {
    name: 'Joy',
    intensities: [
      'Satisfaction - subtle, content smile, relaxed eyes',
      'Amusement - moderate smile, slightly raised cheeks',
      'Joy - broad smile, bright eyes, raised eyebrows',
      'Laughter - wide open mouth laugh, squinted eyes, raised cheeks',
    ],
  },
  Anger: {
    name: 'Anger',
    intensities: [
      'Sternness - slightly furrowed brows, firm expression',
      'Indignation - furrowed brows, tightened jaw, narrowed eyes',
      'Anger - deeply furrowed brows, flared nostrils, intense stare',
      'Rage - extreme brow furrow, bared teeth, wide fierce eyes',
    ],
  },
  Disgust: {
    name: 'Disgust',
    intensities: [
      'Disdain - slight nose wrinkle, one raised eyebrow',
      'Aversion - wrinkled nose, pulled back upper lip',
      'Disgust - deeply wrinkled nose, exposed teeth, squinted eyes',
      'Revulsion - extreme nose wrinkle, tongue out, eyes nearly closed',
    ],
  },
  Fear: {
    name: 'Fear',
    intensities: [
      'Concern - slightly raised eyebrows, tense forehead',
      'Anxiety - raised eyebrows, wide eyes, tense mouth',
      'Fear - very wide eyes, raised eyebrows, open mouth',
      'Terror - extremely wide eyes, mouth agape, pale face, pulled back',
    ],
  },
  Sadness: {
    name: 'Sadness',
    intensities: [
      'Dejection - slightly downturned mouth, droopy eyes',
      'Melancholy - downturned mouth, half-closed eyes, slight frown',
      'Sadness - deeply downturned mouth, watery eyes, furrowed inner brows',
      'Grief - crying, tears streaming, scrunched face, deeply pained',
    ],
  },
  Surprise: {
    name: 'Surprise',
    intensities: [
      'Alertness - slightly raised eyebrows, attentive eyes',
      'Wonder - raised eyebrows, wide curious eyes, slightly open mouth',
      'Surprise - very raised eyebrows, wide open eyes, open mouth',
      'Shock - extremely wide eyes, dropped jaw, raised forehead',
    ],
  },
}

const emotionOrder = ['Joy', 'Anger', 'Disgust', 'Fear', 'Sadness', 'Surprise']

router.post('/generate-emotion-heads', validate({ body: spriteGenerationBody }), async (req, res) => {
  try {
    const { referenceImage, stylePrompt } = req.body

    const rowDescriptions = emotionOrder.map((emotion, rowIdx) => {
      const desc = emotionDescriptions[emotion]
      const cols = desc.intensities.map((intensity, colIdx) => `  Column ${colIdx + 1}: ${intensity}`).join('\n')
      return `ROW ${rowIdx + 1} - ${emotion.toUpperCase()}:\n${cols}`
    }).join('\n\n')

    const styleInstruction = stylePrompt ? `\nStyle: ${stylePrompt}` : ''

    const prompt = `Based on this reference character image, generate a sprite sheet showing the character's HEAD/FACE with different emotions and intensities.

Create a 4-column × 6-row grid (24 cells total) showing the character's HEAD with different emotional expressions:

${rowDescriptions}

Requirements:
- Keep the EXACT same art style, colors, and character design as the reference
- Show the FULL HEAD (face, hair, features) for each cell - not just the mouth
- Each cell must be the same size
- Clean grid layout with visible separation between cells
- White or transparent background
- Each row represents a different emotion category
- Each column represents increasing intensity (1=mild, 2=moderate, 3=strong, 4=extreme)
- The facial expression should clearly change between intensity levels
- Maintain consistent head size, angle, and style across all 24 cells
- Focus on the eyes, eyebrows, mouth shape, and overall facial tension to convey each emotion${styleInstruction}`

    const model = getVertexAI().getGenerativeModel({ model: IMAGE_MODEL, generationConfig, safetySettings })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: referenceImage.replace(/^data:image\/\w+;base64,/, '') } },
          { text: prompt },
        ],
      }],
    })

    const candidate = response.response.candidates?.[0]
    if (!candidate?.content?.parts) {
      logger.error('No content in emotion head response')
      return res.status(500).json({ error: 'No content generated', code: 'NO_CONTENT' })
    }

    const { imagePart, textPart } = extractParts(candidate)

    if (imagePart?.inlineData?.data) {
      return res.json({
        emotionSheet: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        gridSize: { columns: 4, rows: 6 },
        emotionOrder,
        intensityLevels: ['mild', 'moderate', 'strong', 'extreme'],
      })
    }

    if (textPart?.text) {
      return res.status(500).json({
        error: 'Model returned text instead of image',
        code: 'TEXT_RESPONSE',
        message: textPart.text.substring(0, 500),
      })
    }

    return res.status(500).json({ error: 'No emotion head image generated', code: 'NO_IMAGE' })
  } catch (error) {
    logger.error({ err: error }, 'Emotion head generation error')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: 'Emotion head generation failed', code: 'GENERATION_FAILED', message: errorMessage })
  }
})

// ── Legacy endpoint ──

router.post('/generate-all-sheets', async (req, res) => {
  const { referenceImage, stylePrompt } = req.body

  if (!referenceImage) {
    return res.status(400).json({ error: 'Missing required field: referenceImage', code: 'VALIDATION_ERROR' })
  }

  try {
    const prompt = buildVisemePrompt(stylePrompt)
    const model = getVertexAI().getGenerativeModel({ model: IMAGE_MODEL, generationConfig, safetySettings })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: referenceImage.replace(/^data:image\/\w+;base64,/, '') } },
          { text: prompt },
        ],
      }],
    })

    const candidate = response.response.candidates?.[0]
    const { imagePart, textPart } = extractParts(candidate)

    if (imagePart?.inlineData?.data) {
      return res.json({
        fullSheet: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        gridSize: { columns: 12, rows: 1 },
        visemeOrder: visemes,
      })
    }

    return res.status(500).json({
      error: 'No image generated',
      code: 'NO_IMAGE',
      message: textPart?.text?.substring(0, 500) || 'Unknown error',
    })
  } catch (error) {
    logger.error({ err: error }, 'Legacy generation error')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: 'Generation failed', code: 'GENERATION_FAILED', message: errorMessage })
  }
})

export { getVertexAI, IMAGE_MODEL }
export default router
