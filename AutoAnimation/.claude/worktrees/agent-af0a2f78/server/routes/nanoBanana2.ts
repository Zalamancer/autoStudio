/**
 * Nano Banana 2 — Character part generation via Gemini 3.1 Flash Image.
 *
 * Single endpoint: POST /generate
 * Uses @google/genai SDK with gemini-3.1-flash-image-preview model.
 * Accepts a partType and up to 3 reference images (style, layout, concept).
 */

import { Router } from 'express'
import { GoogleGenAI } from '@google/genai'
import { validate } from '../middleware/validate'
import { nb2GenerateBody } from '../schemas/index'
import logger from '../lib/logger'

const router = Router()

// Lazy initialization
let _genai: GoogleGenAI | null = null
function getGenAI(): GoogleGenAI {
  if (!_genai) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for NB2 endpoints')
    }
    _genai = new GoogleGenAI({ apiKey })
  }
  return _genai
}

const NB2_MODEL = 'gemini-3.1-flash-image-preview'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Prompt Templates ────────────────────────────────────────────────

type PartType = 'concept' | 'body' | 'head' | 'hair' | 'viseme-sheet' | 'eye-strip' | 'eyebrow-strip' | 'clothing'

function buildPrompt(partType: PartType, userPrompt: string): string {
  const base = userPrompt.trim()

  switch (partType) {
    case 'concept':
      return `Create a full-body character concept illustration based on this description:

${base}

Requirements:
- Full body visible, standing in a neutral pose facing forward
- Clean, professional character design suitable for animation
- Use a solid, uniform CHROMA KEY background — bright green (#00FF00) by default, or bright blue (#0000FF) if the character has green elements. NO gradients, shadows, or floor.
- Clear separation between body parts (head, torso, arms, legs)
- Consistent art style throughout
- High detail on face, hair, and clothing
- The character should look like it could be broken down into separate animated layers (body, head, hair, clothing)`

    case 'body':
      return `Based on the provided character concept, generate ONLY the character's BODY sprite (torso, arms, legs) WITHOUT the head or hair. STUDY THE CONCEPT IMAGE CAREFULLY — the body must look like it belongs to the EXACT SAME character.

CRITICAL: The concept image is your PRIMARY REFERENCE. Match its art style pixel-perfectly: same line weight, same shading technique, same color saturation, same level of detail. The body must look like the concept character with the head and hair erased — NOT a different character in a similar style.

${base}

Requirements:
- Body must face DIRECTLY FORWARD towards the viewer — straight front-facing view, not angled or turned to the side
- T-POSE (arms extended horizontally to the sides)
- PALMS FACING TOWARD THE VIEWER — hands open with palms facing forward/towards us, thumbs pointing upward, fingers spread and visible
- No clothes — only underwear/undergarments
- Bare feet — no socks, no shoes
- No accessories of any kind (no jewelry, watches, glasses, hats, etc.)
- Include the neck as a connection point for the head layer
- Remove the head completely above the neck
- Remove all hair
- MATCH THE CONCEPT EXACTLY: same skin color (exact hex match), same body proportions, same muscle definition, same art style (line weight, shading, color palette)
- The body should look like it was CUT from the concept image — not redrawn from scratch
- Use a solid, uniform CHROMA KEY background — bright green (#00FF00) by default, or bright blue (#0000FF) if the character has green elements. NO gradients, shadows, or floor.
- Clean edges suitable for compositing with separate head/hair layers

STYLE CONSISTENCY: Every generated element must look like it was extracted from the concept. Match line weight, shading technique, color palette, level of detail, and rendering style exactly.`

    case 'head':
      return `Based on the provided character concept, generate ONLY the character's HEAD sprite WITHOUT hair and WITHOUT the body. STUDY THE CONCEPT IMAGE CAREFULLY — the head must be IDENTICAL to the concept character's head.

CRITICAL: The concept image is your PRIMARY REFERENCE. The head shape, face shape, skin color, ear shape, and overall proportions must be an EXACT match to the concept. Think of it as extracting the head from the concept and erasing only the hair and facial features — the underlying head shape stays identical.

${base}

Requirements:
- No facial features — completely blank/featureless face (like a mannequin)
- Head must face DIRECTLY FORWARD towards the viewer
- Remove all hair — show the bare scalp/head shape
- No neck visible — crop at the jawline/chin, neck should not be visible
- No body visible at all
- No accessories or extensions (no earrings, no glasses, no piercings, no hats)
- MATCH THE CONCEPT EXACTLY: same skin color (exact hex match), same head shape, same face shape, same ear position, same art style (line weight, shading, color palette)
- The head proportions (width, height, roundness) must precisely match the concept character
- Use a solid, uniform CHROMA KEY background — bright green (#00FF00) by default, or bright blue (#0000FF) if the character has green elements. NO gradients, shadows, or floor.
- Clean edges for compositing on top of the body layer

STYLE CONSISTENCY: Every generated element must look like it was extracted from the concept. Match line weight, shading technique, color palette, level of detail, and rendering style exactly.`

    case 'hair':
      return `Generate a 6-column × 4-row grid (24 cells) of DIFFERENT HAIRSTYLE options for the character in the concept image. STUDY THE CONCEPT IMAGE to match its EXACT art style and hair rendering technique.

The attached grid reference shows an empty 6×4 grid template. Fill each cell with a UNIQUE hairstyle. The FIRST cell (top-left) must be the EXACT hairstyle from the concept image as-is.

CRITICAL: Output ONLY the hair in each cell. Do NOT draw any head, face, scalp, or skin. Each cell must contain ONLY floating hair — as if the hair is a wig photographed on its own with no mannequin head underneath. Each hairstyle must face DIRECTLY FORWARD towards the viewer (front-facing, not side profile). Cell 1 MUST replicate the concept character's original hairstyle exactly.

${base}

Requirements:
- Cell 1 (top-left) = EXACT copy of the concept character's hairstyle — same shape, same style, same everything
- Cells 2-24 = Different hairstyle variations (short, long, curly, straight, braided, ponytail, bob, pixie, wavy, mohawk, bun, etc.)
- All hairstyles must face straight towards us — front-facing view
- Same hair COLOR as the concept character — match the exact shade/hue
- MATCH THE CONCEPT ART STYLE EXACTLY: same line weight, same hair strand rendering, same shading technique, same level of detail per strand
- ABSOLUTELY NO HEAD, FACE, SCALP, OR SKIN visible — only the hair strands/shape floating on the chroma key background
- Each cell must contain only hair, nothing else
- Clean grid layout matching the attached grid template
- Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image — the grid reference is for layout only, the output must have clean seamless cells
- Use a solid, uniform CHROMA KEY background — bright green (#00FF00) by default, or bright blue (#0000FF) if the character has green elements

BACKGROUND: The entire background must be a single flat chroma key color (green or blue). NO gradients, NO shadows, NO floor.`

    case 'viseme-sheet':
      return `Based on the provided character concept, generate a sprite sheet of MOUTH positions for lip-sync animation. STUDY THE CONCEPT CHARACTER'S MOUTH CAREFULLY — all mouths must look like they belong to THIS specific character.

The attached grid reference shows an empty 3×9 grid template. Fill each cell with ONLY the mouth — no skin, no face, no chin, no nose. Every mouth must match the concept character's lip style exactly.

Create a 3-column × 9-row grid (27 cells total). 3 curvature types (happy, neutral, sad) × 9 mouth shapes:

9 MOUTH SHAPES:
1. Rest: closed relaxed mouth — lips together naturally
2. Aa: wide open mouth (AH sound) — jaw dropped, tongue flat and visible
3. Ee: wide horizontal stretch showing teeth (EE sound) — lips pulled wide to sides
4. Oh: rounded open mouth (OH sound) — lips form medium circle/oval
5. Oo: pursed/tight round lips (OO/W sound) — lips pushed forward, small tight circle
6. FV: lower lip tucked under upper teeth (F/V sound) — upper teeth on lower lip
7. MBP: lips pressed firmly together (M/B/P sound) — sealed, slightly compressed
8. DTL: slightly open, tongue tip behind upper teeth (D/T/N/L/TH sound) — small opening
9. ChR: narrow/pursed opening with slight pucker (CH/SH/S/R sound) — small tight opening

CURVATURE 1 — UPWARD (SMILING/HAPPY/LAUGHING):
ALL mouths MUST look like they are SMILING, HAPPY, GRINNING, BEAMING WITH JOY. Lip corners dramatically curved UPWARD.

CURVATURE 2 — NEUTRAL:
Same 9 mouth shapes but with neutral/straight lip curvature (not smiling, not frowning)

CURVATURE 3 — DOWNWARD (SAD/FROWNING/MISERABLE):
ALL mouths MUST look SAD, MISERABLE, ABOUT TO CRY, FROWNING. Lip corners dramatically drooping DOWNWARD.

CRITICAL: STUDY THE CONCEPT CHARACTER'S MOUTH before generating. Match the EXACT lip color, lip thickness, lip shape, and art style. Each cell must contain ONLY the lips, teeth, tongue, and lip wrinkles — absolutely NO SKIN, NO face, NO chin, NO jaw, NO nose, NO cheeks. Zero surrounding skin area. The mouth should float on a chroma key background with no flesh-colored pixels around it. Each mouth shape must be VISUALLY DISTINCT — the difference between shapes should be obvious at a glance.

IMPORTANT: Do NOT write any text, labels, names, annotations, or captions anywhere on the sheet. No viseme names, no cell labels, no phoneme labels — ONLY the mouth artwork. Follow the grid layout from the reference but do NOT render visible grid lines, borders, or separators in the final image.

${base}

Requirements:
- MATCH THE CONCEPT CHARACTER'S LIPS EXACTLY: same lip color, same lip thickness, same rendering style, same line weight around lips
- If the concept uses thick outlines, mouths must have thick outlines. If painterly, mouths must be painterly. MATCH THE STYLE.
- ZERO SKIN — no skin-colored pixels, no face skin, no chin, no jaw area
- Show ONLY lips, teeth, tongue, and lip wrinkles
- Each mouth shape must be CLEARLY DIFFERENT from the others
- Each cell must be the same size
- Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image
- Do NOT write any text, labels, or annotations on the image
- Use a solid, uniform CHROMA KEY background — bright green (#00FF00) or bright blue (#0000FF) if lips contain green
- Consistent style across all cells — all mouths must look like they belong to the same character
- Clear difference between the 3 curvature types (happy/neutral/sad)

STYLE CONSISTENCY: Every mouth must match the concept character's art style exactly. A style mismatch will be immediately visible when composited.`

    case 'eye-strip':
      return `Generate a 3-column × 2-row grid (6 cells) of EYE expression variants for the character in the concept image. STUDY THE CONCEPT CHARACTER'S EYES — match their EXACT style, color, and shape.

The attached grid reference shows an empty 3×2 grid template. Fill each cell with ONLY a pair of eyes. The Neutral cell must match the concept character's eyes exactly.

Cell layout (left to right, top to bottom):
1. Neutral — relaxed, default open eyes — EXACT COPY of the concept character's eyes
2. Happy — visibly squinted with upward crease — eyelids pushed up by cheek muscles, eye opening 40% smaller than neutral, slight upward curve to lower lid
3. Sad — droopy and downcast — upper eyelids heavy and drooping, inner corners angled upward slightly, gaze directed downward, eye opening 30% smaller
4. Angry — intensely narrowed — upper lids pushed down hard, inner corners sharply angled down, eye opening 50% smaller than neutral, piercing intense gaze
5. Shocked — extremely wide open — eyelids pulled back as far as possible, whites visible ALL AROUND the iris (top, bottom, sides), eye opening 60% LARGER than neutral
6. Suspicious — asymmetric squint — one eye narrowed to 30% open while the other stays 80% open, creating a clear lopsided skeptical look

CRITICAL: Each cell must contain ONLY the two eyeballs with their eyelids — nothing else. Absolutely NO eyebrows, NO nose, NO mouth, NO face outline, NO ears, NO head shape, NO hair, NO skin area. EXAGGERATE each expression — the difference between cells must be DRAMATIC and immediately obvious, not subtle.

${base}

Requirements:
- MATCH THE CONCEPT CHARACTER'S EYES EXACTLY: same iris color, same eye shape, same pupil size, same art style, same line weight
- Cell 1 (Neutral) must be a pixel-perfect match to the concept character's eyes
- NO EYEBROWS in any cell — eyebrows are generated separately
- NO face, head, nose, mouth, ears, hair, or skin
- Only the eyeball shapes with eyelids, iris, and pupil
- EXAGGERATE expressions — each must be DRAMATICALLY different from the others at first glance
- The size of the eye opening must visibly change between expressions (wide for shocked, narrow for angry)
- Clean grid layout matching the attached 3×2 grid template
- Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image
- Use a solid, uniform CHROMA KEY background — bright green (#00FF00) by default, or bright blue (#0000FF) if the character has green elements

BACKGROUND: The entire background must be a single flat chroma key color (green or blue). NO gradients, NO shadows, NO floor.`

    case 'eyebrow-strip':
      return `Generate a 3-column × 2-row grid (6 cells) of EYEBROW expression variants for the character in the concept image. STUDY THE CONCEPT CHARACTER'S EYEBROWS — match their EXACT style, color, thickness, and rendering.

The attached grid reference shows an empty 3×2 grid template. Fill each cell with ONLY a pair of eyebrows. The Neutral cell must match the concept character's eyebrows exactly.

Cell layout (left to right, top to bottom):
1. Neutral — flat, relaxed, natural resting position — EXACT COPY of the concept character's eyebrows
2. Happy — both brows raised 20% higher than neutral and curved gently upward, creating an open and cheerful arch — the outer ends stay level or slightly up
3. Sad — inner ends raised HIGH (45 degrees up from center), outer ends drooping LOW — creating a strong inverted V / tent shape that looks pitiful and distressed
4. Angry — pulled sharply DOWNWARD and INWARD — inner ends nearly touching, angled steeply down toward center creating a harsh V-shape, outer ends angled up. Furrowed and aggressive
5. Shocked — both brows raised EXTREMELY HIGH — 50% higher than neutral position, arched dramatically with maximum curvature, total astonishment
6. Suspicious — STRONGLY asymmetric — one brow raised 40% higher than neutral while the other is pushed DOWN 20% below neutral, creating an obvious lopsided skeptical expression

CRITICAL: Each cell must contain ONLY the two eyebrow arcs — nothing else. Absolutely NO eyes, NO face, NO head, NO nose, NO mouth, NO ears, NO hair, NO skin. Just two floating curved eyebrow shapes on a chroma key background. Each expression MUST look DRAMATICALLY different — the angle, height, and curvature differences must be EXTREME and EXAGGERATED. If all 6 cells look similar, the generation has FAILED.

${base}

Requirements:
- MATCH THE CONCEPT CHARACTER'S EYEBROWS: same color, same thickness, same rendering style, same line weight
- Cell 1 (Neutral) must be a precise match to the concept character's eyebrows
- NO eyes, face, head, nose, mouth, ears, hair, or skin — ONLY the eyebrow arcs
- EXAGGERATE every expression to the maximum — subtle differences are UNACCEPTABLE
- Angry brows must look FURIOUS (steep V-shape down), Sad must look DEVASTATED (inverted V up), Shocked must be SKY-HIGH
- The vertical position of brows must visibly change between cells
- Clean grid layout matching the attached 3×2 grid template
- Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image
- Use a solid, uniform CHROMA KEY background — bright green (#00FF00) by default, or bright blue (#0000FF) if the character has green elements

BACKGROUND: The entire background must be a single flat chroma key color (green or blue). NO gradients, NO shadows, NO floor.`

    case 'clothing':
      return `Generate a 3-column × 3-row grid of CLOTHING ITEMS for the character in the concept image. 3 completely different outfit sets.

The attached grid reference shows an empty 3×3 grid template. Fill each cell with a clothing item.

Grid layout:
- Each COLUMN = one complete outfit (3 different outfits total)
- Row 1 (top ~35%): Upper body garment in T-POSE (arms/sleeves extended straight out horizontally). Vary the type: t-shirt, hoodie, jacket, coat, puffy jacket, jersey, blazer, sweater, tank top, etc.
- Row 2 (middle ~45%): Lower body garment (vary the type: jeans, sweatpants, shorts, skirt, cargo pants, leggings, dress pants, etc.)
- Row 3 (bottom ~20%): Footwear — GROUND-LEVEL front-facing view (camera at ground height looking at the shoes from the front). Vary the type: sneakers, boots, sandals, heels, loafers, slippers, etc.

CRITICAL: Each cell must contain ONLY the garment laid flat — as if photographed on a white table from above. Do NOT draw any human body, mannequin, torso, legs, feet, arms, or skin underneath the clothes. Just the clothing item by itself. Upper body garments MUST be in T-POSE with sleeves extended straight horizontally. Shoes MUST be shown from GROUND-LEVEL front-facing view — camera at ground height looking at the shoes straight on from the front.

${base}

Requirements:
- Keep the same art style as the concept
- Each outfit should have its OWN color scheme — they do NOT need to match each other
- Make 3 DIFFERENT outfit styles (casual, formal, sporty, streetwear, etc.)
- ABSOLUTELY NO human body, skin, or figure — only the flat garment
- Upper body garments MUST be in T-POSE — sleeves extended straight horizontally to the sides
- Shoes MUST be shown from GROUND-LEVEL front-facing view — camera at ground height looking straight on
- Each garment should look like it's laid flat on a table, spread out
- Clean grid layout matching the attached 3×3 grid template
- Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image
- Use a solid, uniform CHROMA KEY background — bright green (#00FF00) by default, or bright blue (#0000FF) if the character has green elements

BACKGROUND: The entire background must be a single flat chroma key color (green or blue). NO gradients, NO shadows, NO floor.`

    default:
      return base
  }
}

// Grid sizes for each part type
const GRID_SIZES: Record<PartType, { columns: number; rows: number } | undefined> = {
  concept: undefined,
  body: undefined,
  head: undefined,
  hair: { columns: 6, rows: 4 },
  'viseme-sheet': { columns: 3, rows: 9 },
  'eye-strip': { columns: 3, rows: 2 },
  'eyebrow-strip': { columns: 3, rows: 2 },
  clothing: { columns: 3, rows: 3 },
}

// ── Route ───────────────────────────────────────────────────────────

router.post('/generate', validate({ body: nb2GenerateBody }), async (req, res) => {
  try {
    const { partType, prompt, styleReference, layoutReference, conceptImage, gridReference, resolution, aspectRatio, customPrompt } = req.body as {
      partType: PartType
      prompt: string
      styleReference?: string
      layoutReference?: string
      conceptImage?: string
      gridReference?: string
      resolution?: '512' | '1024' | '2048' | '4096'
      aspectRatio?: '1:1' | '3:2' | '2:3' | '3:4' | '4:3' | '9:16' | '16:9'
      customPrompt?: string
    }

    logger.info({ partType }, 'NB2 generate request')

    const genai = getGenAI()
    const fullPrompt = customPrompt?.trim() || buildPrompt(partType, prompt)

    // Build content parts: reference images + prompt text
    const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = []

    // Add style reference image if provided
    if (styleReference) {
      const data = styleReference.replace(/^data:image\/\w+;base64,/, '')
      parts.push({ inlineData: { mimeType: 'image/png', data } })
    }

    // Add layout reference image if provided
    if (layoutReference) {
      const data = layoutReference.replace(/^data:image\/\w+;base64,/, '')
      parts.push({ inlineData: { mimeType: 'image/png', data } })
    }

    // Add concept image if provided (for subsequent steps)
    if (conceptImage) {
      const data = conceptImage.replace(/^data:image\/\w+;base64,/, '')
      parts.push({ inlineData: { mimeType: 'image/png', data } })
    }

    // Add grid reference image if provided (tiled head for spatial context)
    if (gridReference) {
      const data = gridReference.replace(/^data:image\/\w+;base64,/, '')
      parts.push({ inlineData: { mimeType: 'image/png', data } })
    }

    // Add prompt text
    parts.push({ text: fullPrompt })

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await genai.models.generateContent({
          model: NB2_MODEL,
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            temperature: 0.4,
            topP: 0.95,
            topK: 40,
            ...((resolution || aspectRatio) ? {
              imageConfig: {
                ...(resolution ? { imageSize: resolution } : {}),
                ...(aspectRatio ? { aspectRatio } : {}),
              },
            } : {}),
          },
        })

        // Extract image from response
        const candidate = response.candidates?.[0]
        if (!candidate?.content?.parts) {
          logger.warn({ partType, attempt }, 'NB2: No content in response, retrying...')
          lastError = new Error('No content generated')
          if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS * attempt); continue }
          return res.status(500).json({ error: 'No content generated', code: 'NO_CONTENT' })
        }

        const imagePart = candidate.content.parts.find(
          (part: any) => part.inlineData?.mimeType?.startsWith('image/')
        )

        if (imagePart?.inlineData?.data) {
          if (attempt > 1) logger.info({ partType, attempt }, 'NB2 generation succeeded after retry')
          else logger.info({ partType }, 'NB2 generation successful')
          return res.json({
            image: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
            partType,
            gridSize: GRID_SIZES[partType],
            prompt: fullPrompt,
          })
        }

        const textPart = candidate.content.parts.find((part: any) => part.text)
        if (textPart?.text) {
          logger.warn({ partType, text: textPart.text.substring(0, 200), attempt }, 'NB2: Model returned text instead of image')
          lastError = new Error(textPart.text.substring(0, 500))
          if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS * attempt); continue }
          return res.status(500).json({
            error: 'Model returned text instead of image',
            code: 'TEXT_RESPONSE',
            message: textPart.text.substring(0, 500),
          })
        }

        lastError = new Error('No image generated')
        if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS * attempt); continue }
        return res.status(500).json({ error: 'No image generated', code: 'NO_IMAGE' })

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        logger.warn({ err: lastError, partType, attempt }, `NB2 generation attempt ${attempt}/${MAX_RETRIES} failed`)
        if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS * attempt); continue }
      }
    }

    // All retries exhausted
    const errorMessage = lastError?.message || 'Unknown error'
    logger.error({ partType, message: errorMessage }, 'NB2 generation failed after all retries')
    res.status(500).json({ error: 'Generation failed', code: 'GENERATION_FAILED', message: errorMessage })
  } catch (error) {
    logger.error({ err: error }, 'NB2 generation error')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: 'Generation failed', code: 'GENERATION_FAILED', message: errorMessage })
  }
})

export default router
