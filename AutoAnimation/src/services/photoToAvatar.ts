/**
 * Photo-to-Avatar Service — Analyze a photo using Gemini Vision,
 * extract a structured character description, then generate a sprite sheet
 * via the existing Vertex AI pipeline.
 */

import { withCreditGate } from './creditGate'
import { callGeminiProxy } from '@/services/aiProxy'

const GEMINI_API_URL = 'gemini-3-flash-preview' // model name for callGeminiProxy

export interface AvatarDescription {
  hairColor: string
  hairStyle: string
  skinTone: string
  eyeColor: string
  clothing: string
  accessories: string
  age: string
  gender: string
  expression: string
  bodyType: string
  /** Full prompt string for Vertex AI sprite generation */
  generationPrompt: string
}

export type AvatarStyle = 'cartoon' | 'anime' | 'semi-realistic' | 'chibi' | 'pixel-art'

const STYLE_MODIFIERS: Record<AvatarStyle, string> = {
  cartoon: 'in a modern cartoon style, clean bold lines, vibrant colors, slightly exaggerated proportions',
  anime: 'in anime art style, large expressive eyes, detailed hair, Japanese animation aesthetic',
  'semi-realistic': 'in a semi-realistic digital art style, detailed shading, natural proportions, painterly rendering',
  chibi: 'in chibi style, super deformed proportions, large head, small body, cute and simple',
  'pixel-art': 'in pixel art style, retro 16-bit aesthetic, clean pixel edges, limited color palette',
}

/**
 * Analyze a photo and extract a structured description.
 */
export async function analyzePhotoForAvatar(
  imageDataUrl: string,
  style: AvatarStyle = 'cartoon',
): Promise<AvatarDescription> {
  return withCreditGate('photo-to-avatar', () => _analyzePhotoImpl(imageDataUrl, style))
}

async function _analyzePhotoImpl(imageDataUrl: string, style: AvatarStyle): Promise<AvatarDescription> {
  // Extract base64 data and mime type
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) throw new Error('Invalid image data URL')
  const mimeType = match[1]
  const base64Data = match[2]

  const prompt = `Analyze this photo of a person and extract a detailed character description for generating an animated avatar sprite.

Output valid JSON:
{
  "hairColor": "dark brown",
  "hairStyle": "short wavy",
  "skinTone": "medium warm",
  "eyeColor": "brown",
  "clothing": "blue button-up shirt",
  "accessories": "glasses, watch",
  "age": "young adult",
  "gender": "male",
  "expression": "friendly smile",
  "bodyType": "average build",
  "generationPrompt": "A full character portrait of a young adult male with short wavy dark brown hair, medium warm skin, brown eyes, wearing a blue button-up shirt and glasses, friendly smile, ${STYLE_MODIFIERS[style]}, white background, full body visible, centered composition"
}

Make the generationPrompt detailed and suitable for AI image generation. Include the art style: ${STYLE_MODIFIERS[style]}`

  const response = await callGeminiProxy(GEMINI_API_URL, {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  })

  if (!response.ok) {
    throw new Error(`Gemini Vision API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return JSON.parse(text) as AvatarDescription
}
