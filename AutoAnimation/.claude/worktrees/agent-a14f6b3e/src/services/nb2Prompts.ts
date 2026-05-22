/**
 * NB2 structured prompt system.
 *
 * Prompts are stored as structured configs (NB2PromptConfig) and compiled
 * to text before sending to the AI. The UI renders configs as editable
 * form fields. Grid dimensions auto-sync from the store's gridSizes.
 */

import type { NB2PartType, NB2GridSize, NB2Gender } from '@/types/nanoBanana2'

// ── Structured Prompt Config ─────────────────────────────────────────

export interface NB2CellDesc {
  label: string
  description: string
}

export interface NB2PromptConfig {
  instruction: string
  gridNote?: string // text after grid reference line (editable)
  cells?: NB2CellDesc[] // named cell descriptions (eye/eyebrow/viseme rows)
  criticalNote?: string // the CRITICAL paragraph content
  requirements: string[]
}

// ── Default Configs per Step ─────────────────────────────────────────

export function getDefaultPromptConfig(partType: NB2PartType): NB2PromptConfig {
  switch (partType) {
    case 'concept':
      return {
        instruction: 'Create a full-body character concept illustration based on this description',
        requirements: [
          'Full body visible, standing in a neutral pose facing forward',
          'Clean, professional character design suitable for animation',
          'Use a solid, uniform WHITE (#FFFFFF) background. The background must be a single flat color with NO gradients, shadows, or floor.',
          'Clear separation between body parts (head, torso, arms, legs)',
          'Consistent art style throughout',
          'High detail on face, hair, and clothing',
          'The character should look like it could be broken down into separate animated layers (body, head, hair, clothing)',
        ],
      }

    case 'body':
      return {
        instruction:
          "Generate ONLY the character's BODY sprite (torso, arms, legs) WITHOUT the head or hair. STUDY THE CONCEPT IMAGE CAREFULLY — the body must look like it belongs to the EXACT SAME character",
        criticalNote:
          'The concept image is your PRIMARY REFERENCE. Match its art style pixel-perfectly: same line weight, same shading technique, same color saturation, same level of detail. The body must look like the concept character with the head and hair erased — NOT a different character in a similar style.',
        requirements: [
          'Body must face DIRECTLY FORWARD towards the viewer — straight front-facing view, not angled or turned to the side',
          'T-POSE (arms extended horizontally to the sides)',
          'PALMS FACING TOWARD THE VIEWER — hands open with palms facing forward/towards us, thumbs pointing upward, fingers spread and visible',
          'No clothes — only underwear/undergarments',
          'Bare feet — no socks, no shoes',
          'No accessories of any kind (no jewelry, watches, glasses, hats, etc.)',
          'Include the neck as a connection point for the head layer',
          'Remove the head completely above the neck',
          'Remove all hair',
          'MATCH THE CONCEPT EXACTLY: same skin color (exact hex match), same body proportions, same muscle definition, same art style (line weight, shading, color palette)',
          'The body should look like it was CUT from the concept image — not redrawn from scratch',
          'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
          'Clean edges suitable for compositing with separate head/hair layers',
        ],
      }

    case 'head':
      return {
        instruction:
          "Generate ONLY the character's HEAD sprite WITHOUT hair and WITHOUT the body. CROP AT THE JAWLINE — absolutely NO NECK. STUDY THE CONCEPT IMAGE CAREFULLY — the head must be IDENTICAL to the concept character's head",
        criticalNote:
          'The concept image is your PRIMARY REFERENCE. The head shape, face shape, skin color, ear shape, and overall proportions must be an EXACT match to the concept. Think of it as extracting the head from the concept and erasing only the hair and facial features — the underlying head shape stays identical. CRITICAL: The image must be CROPPED at the chin/jawline. There must be ZERO neck visible — no throat, no neck column, no skin below the jaw. The bottom edge of the sprite is the chin.',
        requirements: [
          'No facial features — completely blank/featureless face (like a mannequin)',
          'Head must face DIRECTLY FORWARD towards the viewer',
          'Remove all hair — show the bare scalp/head shape',
          'ABSOLUTELY NO NECK — crop the image at the jawline/chin. The bottom of the head sprite is the chin. Zero pixels of neck, throat, or skin below the jaw should be visible. If ANY neck is showing, the generation has FAILED.',
          'No body visible at all — no shoulders, no chest, no collar area',
          'No accessories or extensions (no earrings, no glasses, no piercings, no hats)',
          'MATCH THE CONCEPT EXACTLY: same skin color (exact hex match), same head shape, same face shape, same ear position, same art style (line weight, shading, color palette)',
          'The head proportions (width, height, roundness) must precisely match the concept character',
          'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
          'Clean edges for compositing on top of the body layer',
        ],
      }

    case 'hair':
      return {
        instruction:
          'Generate DIFFERENT HAIRSTYLE options for the character in the concept image. STUDY THE CONCEPT IMAGE to match its EXACT art style and hair rendering technique. OUTPUT ONLY HAIR — NO HEAD, NO FACE, NO SCALP, NO SKIN',
        gridNote:
          'Fill each cell with a UNIQUE hairstyle. The FIRST cell (top-left) must be the EXACT hairstyle from the concept image as-is. Each cell contains ONLY hair — imagine a wig floating in midair with absolutely nothing underneath it.',
        criticalNote:
          "THIS IS THE MOST IMPORTANT RULE: Each cell must contain ONLY hair strands — NO HEAD underneath, NO face, NO scalp, NO skin-colored pixels of any kind. Think of each hairstyle as a WIG photographed alone on a white table — there is NO mannequin, NO head form, NO oval head shape. If you draw ANY head shape, face outline, or skin, the generation has COMPLETELY FAILED. The hair should appear to float in empty space. Cell 1 MUST replicate the concept character's original hairstyle exactly. Each hairstyle must face DIRECTLY FORWARD towards the viewer.",
        requirements: [
          "Cell 1 (top-left) = EXACT copy of the concept character's hairstyle — same shape, same style, same everything",
          'Cells 2+ = Different hairstyle variations (short, long, curly, straight, braided, ponytail, bob, pixie, wavy, mohawk, bun, etc.)',
          'All hairstyles must face straight towards us — front-facing view',
          'Same hair COLOR as the concept character — match the exact shade/hue',
          'MATCH THE CONCEPT ART STYLE EXACTLY: same line weight, same hair strand rendering, same shading technique, same level of detail per strand',
          'ABSOLUTELY ZERO HEAD, FACE, SCALP, EARS, OR SKIN — if there is ANY oval/circular head shape or skin-colored area beneath the hair, the output is WRONG. Only hair strands/fibers should be visible.',
          'Each cell must contain ONLY hair — no head silhouette, no face, no ears, no neck, no shoulders',
          'The bottom edge of each hairstyle should end where hair naturally ends — do NOT draw the head/scalp that the hair would sit on',
          'Clean grid layout matching the attached grid template',
          'Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image',
          'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
        ],
      }

    case 'viseme-sheet':
      return {
        instruction:
          "Generate a sprite sheet of 9 MOUTH positions for lip-sync animation with NEUTRAL (straight) lip curvature. STUDY THE CONCEPT IMAGE'S MOUTH CAREFULLY — all mouths must look like they belong to THIS specific character",
        gridNote:
          "Fill each cell with ONLY the mouth — no skin, no face, no chin, no nose. All mouths must have NEUTRAL lip curvature (not smiling, not frowning). Every mouth must match the concept character's lip style exactly.",
        cells: [
          { label: 'Rest', description: 'Closed, relaxed mouth — neutral resting position. Lips together naturally.' },
          {
            label: 'Aa',
            description: 'Wide open mouth (AH sound) — jaw dropped, mouth open wide, tongue flat and visible',
          },
          {
            label: 'Ee',
            description:
              'Wide horizontal stretch showing teeth (EE sound) — lips pulled wide to the sides, teeth visible',
          },
          { label: 'Oh', description: 'Rounded open mouth (OH sound) — lips form a medium-sized circle/oval' },
          {
            label: 'Oo',
            description:
              'Pursed/tight round lips (OO/W sound) — lips pushed forward into a small tight circle, smaller opening than Oh',
          },
          {
            label: 'FV',
            description: 'Lower lip tucked under upper teeth (F/V sound) — upper teeth resting on lower lip',
          },
          {
            label: 'MBP',
            description: 'Lips pressed firmly together (M/B/P sound) — lips sealed, slightly compressed/puffed',
          },
          {
            label: 'DTL',
            description:
              'Slightly open, tongue tip touching behind upper teeth (D/T/N/L/TH sound) — small opening with tongue visible',
          },
          {
            label: 'ChR',
            description:
              'Narrow/pursed opening with slight pucker (CH/SH/S/R sound) — small tight opening, lips slightly rounded',
          },
        ],
        criticalNote:
          "STUDY THE CONCEPT CHARACTER'S MOUTH before generating. Match the EXACT lip color, lip thickness, lip shape, and art style. Each cell must contain ONLY the lips, teeth, tongue, and lip wrinkles — absolutely NO SKIN, NO face, NO chin, NO jaw, NO nose, NO cheeks. Zero surrounding skin area. The mouth should float on the white background with no flesh-colored pixels around it. Do NOT write any text, labels, names, or annotations anywhere on the sheet. Each mouth shape must be VISUALLY DISTINCT — the difference between shapes should be obvious at a glance.",
        requirements: [
          'All mouths must have NEUTRAL (straight) lip curvature — not smiling, not frowning',
          "MATCH THE CONCEPT CHARACTER'S LIPS EXACTLY: same lip color, same lip thickness, same rendering style, same line weight around lips",
          'If the concept uses thick outlines, mouths must have thick outlines. If the concept is painterly, mouths must be painterly. MATCH THE STYLE.',
          'ZERO SKIN — no skin-colored pixels, no face skin, no chin, no jaw area',
          'Show ONLY lips, teeth, tongue, and lip wrinkles',
          'Each mouth shape must be CLEARLY DIFFERENT from the others — Rest vs MBP, Oh vs Oo, Aa vs DTL must all be visually distinguishable',
          'Each cell must be the same size',
          'Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image',
          'Do NOT write any text, labels, annotations, or captions on the image',
          'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
          'Consistent style across all cells — all mouths must look like they belong to the same character',
        ],
      }

    case 'eye-strip':
      return {
        instruction:
          "Generate EYE expression variants for the character in the concept image. STUDY THE CONCEPT CHARACTER'S EYES — match their EXACT style, color, and shape",
        gridNote:
          "Fill each cell with ONLY a pair of eyes. The Neutral cell must match the concept character's eyes exactly.",
        cells: [
          { label: 'Neutral', description: "relaxed, default open eyes — EXACT COPY of the concept character's eyes" },
          {
            label: 'Happy',
            description:
              'visibly squinted with upward crease — eyelids pushed up by cheek muscles, eye opening 40% smaller than neutral, slight upward curve to lower lid',
          },
          {
            label: 'Sad',
            description:
              'droopy and downcast — upper eyelids heavy and drooping, inner corners angled upward slightly, gaze directed downward, eye opening 30% smaller',
          },
          {
            label: 'Angry',
            description:
              'intensely narrowed — upper lids pushed down hard, inner corners sharply angled down, eye opening 50% smaller than neutral, piercing intense gaze',
          },
          {
            label: 'Shocked',
            description:
              'extremely wide open — eyelids pulled back as far as possible, whites visible ALL AROUND the iris (top, bottom, sides), eye opening 60% LARGER than neutral',
          },
          {
            label: 'Suspicious',
            description:
              'asymmetric squint — one eye narrowed to 30% open while the other stays 80% open, creating a clear lopsided skeptical look',
          },
        ],
        criticalNote:
          'Each cell must contain ONLY the two eyeballs with their eyelids — nothing else. Absolutely NO eyebrows, NO nose, NO mouth, NO face outline, NO ears, NO head shape, NO hair, NO skin area. Think of it as two floating eyes cropped tightly on the white background. The eyebrows are a SEPARATE layer and must NOT appear here. EXAGGERATE each expression — the difference between cells must be DRAMATIC and immediately obvious, not subtle.',
        requirements: [
          "MATCH THE CONCEPT CHARACTER'S EYES EXACTLY: same iris color, same eye shape, same pupil size, same art style, same line weight",
          "Cell 1 (Neutral) must be a pixel-perfect match to the concept character's eyes",
          'NO EYEBROWS in any cell — eyebrows are generated separately',
          'NO face, head, nose, mouth, ears, hair, or skin',
          'Only the eyeball shapes with eyelids, iris, and pupil',
          'EXAGGERATE expressions — each must be DRAMATICALLY different from the others at first glance',
          'The size of the eye opening must visibly change between expressions (wide for shocked, narrow for angry)',
          'Clean grid layout matching the attached grid template',
          'Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image',
          'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
        ],
      }

    case 'eyebrow-strip':
      return {
        instruction:
          "Generate EYEBROW expression variants for the character in the concept image. STUDY THE CONCEPT CHARACTER'S EYEBROWS — match their EXACT style, color, thickness, and rendering",
        gridNote:
          "Fill each cell with ONLY a pair of eyebrows. The Neutral cell must match the concept character's eyebrows exactly.",
        cells: [
          {
            label: 'Neutral',
            description: "flat, relaxed, natural resting position — EXACT COPY of the concept character's eyebrows",
          },
          {
            label: 'Happy',
            description:
              'both brows raised 20% higher than neutral and curved gently upward, creating an open and cheerful arch — the outer ends stay level or slightly up',
          },
          {
            label: 'Sad',
            description:
              'inner ends raised HIGH (45 degrees up from center), outer ends drooping LOW — creating a strong inverted V / tent shape that looks pitiful and distressed',
          },
          {
            label: 'Angry',
            description:
              'pulled sharply DOWNWARD and INWARD — inner ends nearly touching, angled steeply down toward center creating a harsh V-shape, outer ends angled up. The brows should look furrowed and aggressive',
          },
          {
            label: 'Shocked',
            description:
              'both brows raised EXTREMELY HIGH — 50% higher than neutral position, arched dramatically with maximum curvature, creating a look of total astonishment',
          },
          {
            label: 'Suspicious',
            description:
              'STRONGLY asymmetric — one brow raised 40% higher than neutral while the other is pushed DOWN 20% below neutral, creating an obvious lopsided skeptical expression',
          },
        ],
        criticalNote:
          'Each cell must contain ONLY the two eyebrow arcs — nothing else. Absolutely NO eyes, NO face, NO head, NO nose, NO mouth, NO ears, NO hair, NO skin. Just two floating curved eyebrow shapes on the white background. Each expression MUST look DRAMATICALLY different — the angle, height, and curvature differences must be EXTREME and EXAGGERATED. If all 6 cells look similar, the generation has FAILED. Use percentages and angles described in each cell as minimum differences.',
        requirements: [
          "MATCH THE CONCEPT CHARACTER'S EYEBROWS: same color, same thickness, same rendering style, same line weight",
          "Cell 1 (Neutral) must be a precise match to the concept character's eyebrows",
          'NO eyes, face, head, nose, mouth, ears, hair, or skin — ONLY the eyebrow arcs',
          'EXAGGERATE every expression to the maximum — subtle differences are UNACCEPTABLE',
          'Angry brows must look FURIOUS (steep V-shape down), Sad must look DEVASTATED (inverted V up), Shocked must be SKY-HIGH',
          'The vertical position of brows must visibly change between cells (high for shocked, low for angry)',
          'Clean grid layout matching the attached grid template',
          'Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image',
          'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
        ],
      }

    case 'clothing':
      return {
        instruction:
          'Generate CLOTHING ITEMS for the character in the concept image. Completely different outfit sets.',
        gridNote: 'Fill each cell with a clothing item',
        cells: [
          {
            label: 'Row 1 (top ~35%)',
            description:
              'Upper body garment in T-POSE (arms extended straight out horizontally). Vary the type: t-shirt, hoodie, jacket, coat, puffy jacket, jersey, blazer, sweater, tank top, etc.',
          },
          {
            label: 'Row 2 (middle ~45%)',
            description:
              'Lower body garment (vary the type: jeans, sweatpants, shorts, skirt, cargo pants, leggings, dress pants, etc.)',
          },
          {
            label: 'Row 3 (bottom ~20%)',
            description:
              'Footwear — GROUND-LEVEL front-facing view (as if the camera is on the ground looking at the shoes from the front). Vary the type: sneakers, boots, sandals, heels, loafers, slippers, etc.',
          },
        ],
        criticalNote:
          'Each cell must contain ONLY the garment laid flat — as if photographed on a white table from above. Do NOT draw any human body, mannequin, torso, legs, feet, arms, or skin underneath the clothes. Just the clothing item by itself. Upper body garments (shirts/jackets/hoodies) MUST be in T-POSE with sleeves extending straight out to the sides horizontally. Shoes MUST be shown from GROUND-LEVEL front-facing view — camera at ground height looking at the shoes straight on from the front.',
        requirements: [
          'Keep the same art style as the concept',
          'Each outfit should have its OWN color scheme — they do NOT need to match each other',
          'Different outfit styles (casual, formal, sporty, streetwear, etc.)',
          'ABSOLUTELY NO human body, skin, or figure — only the flat garment',
          'Upper body garments MUST be in T-POSE — sleeves/arms extended straight horizontally to the sides (NOT angled down)',
          'Shoes MUST be shown from GROUND-LEVEL front-facing view — camera at ground height looking at the shoes straight on',
          "Each garment should look like it's laid flat on a table, spread out",
          'Clean grid layout matching the attached grid template',
          'Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image',
          'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
        ],
      }

    default:
      return { instruction: '', requirements: [] }
  }
}

// ── Grid Step Detection ──────────────────────────────────────────────

const GRID_STEPS = new Set<NB2PartType>(['hair', 'viseme-sheet', 'eye-strip', 'eyebrow-strip', 'clothing'])

export function isGridStep(partType: NB2PartType): boolean {
  return GRID_STEPS.has(partType)
}

// ── Viseme curvature axis helper ─────────────────────────────────────

/**
 * Determine which axis holds curvatures vs visemes.
 * The side with fewer cells gets curvatures (3 types: upward/neutral/downward).
 * Returns 'rows' if rows <= cols (curvatures on rows, visemes on cols),
 * or 'cols' if cols < rows (curvatures on cols, visemes on rows).
 */
export function getVisemeCurvatureAxis(gridSize: NB2GridSize): 'rows' | 'cols' {
  return gridSize.rows <= gridSize.cols ? 'rows' : 'cols'
}

// ── Compile Config → Text Prompt ─────────────────────────────────────

export function compileNB2Prompt(
  partType: NB2PartType,
  config: NB2PromptConfig,
  userPrompt: string,
  gridSize?: NB2GridSize,
  gender?: NB2Gender,
): string {
  const base = userPrompt.trim()
  const lines: string[] = []

  // Instruction
  if (isGridStep(partType) && gridSize) {
    const total = gridSize.cols * gridSize.rows
    lines.push(
      `${config.instruction}. Generate a ${gridSize.cols}-column × ${gridSize.rows}-row grid (${total} cells).`,
    )
  } else if (partType === 'concept') {
    lines.push(`${config.instruction}:`)
  } else {
    lines.push(`Based on the provided character concept, ${config.instruction}.`)
  }

  // Grid reference note
  if (isGridStep(partType) && gridSize) {
    lines.push('')
    lines.push(
      `The attached grid reference shows an empty ${gridSize.cols}×${gridSize.rows} grid template. ${config.gridNote || ''}`.trim(),
    )
  }

  // Gender-specific guidance for hair generation
  if (partType === 'hair' && gender && gender !== 'neutral') {
    lines.push('')
    if (gender === 'female') {
      lines.push(
        'This is a FEMALE character. Generate hairstyles appropriate for women/girls. Include a mix of lengths but ensure ALL hairstyles fit within their individual cell — do NOT let long hair overflow into adjacent cells. Scale each hairstyle to fit neatly inside one cell boundary.',
      )
    } else {
      lines.push(
        'This is a MALE character. Generate hairstyles appropriate for men/boys. ABSOLUTELY NO LONG HAIR — only SHORT to MEDIUM length styles. Examples: crew cut, fade, buzz cut, quiff, pompadour, curly top, undercut, slick back, textured crop, flat top, mohawk, taper fade, etc. Every hairstyle must be above the shoulders — nothing longer.',
      )
    }
  }

  // Cell descriptions
  if (config.cells && config.cells.length > 0) {
    lines.push('')
    if (partType === 'viseme-sheet' && gridSize && config.cells.length <= 3) {
      // Legacy 3-curvature row format (upward/neutral/downward rows)
      const curvatureAxis = getVisemeCurvatureAxis(gridSize)
      const curvatureCount = curvatureAxis === 'rows' ? gridSize.rows : gridSize.cols
      const visemeCount = curvatureAxis === 'rows' ? gridSize.cols : gridSize.rows

      if (curvatureAxis === 'rows') {
        lines.push(`Each ROW represents a different mouth curvature (${curvatureCount} curvatures).`)
        lines.push(`Each COLUMN represents a different mouth shape/viseme (${visemeCount} visemes per row).`)
      } else {
        lines.push(`Each COLUMN represents a different mouth curvature (${curvatureCount} curvatures).`)
        lines.push(`Each ROW represents a different mouth shape/viseme (${visemeCount} visemes per column).`)
      }
      lines.push('')

      for (const cell of config.cells) {
        lines.push(`${cell.label}:`)
        lines.push(cell.description)
        lines.push('')
      }
    } else if (partType === 'viseme-sheet') {
      // Individual viseme cells (neutral-only or curvature variant — 9 cells)
      lines.push(
        'Cell layout — YOU MUST place each mouth in EXACTLY this order (left to right, top to bottom). The grid reference image has labels showing where each viseme goes:',
      )
      config.cells.forEach((cell, i) => {
        lines.push(`Cell ${i + 1}: ${cell.label} — ${cell.description}`)
      })
      lines.push('')
      lines.push(
        'CRITICAL: The order above is MANDATORY. Cell 1 MUST be Rest, cell 2 MUST be Aa, cell 3 MUST be Ee, and so on. Follow the labels on the grid reference image exactly.',
      )
    } else if (partType === 'clothing') {
      // Clothing rows describe what goes in each row
      lines.push('Grid layout:')
      if (gridSize) lines.push(`- Each COLUMN = one complete outfit (${gridSize.cols} different outfits total)`)
      for (const cell of config.cells) {
        lines.push(`- ${cell.label}: ${cell.description}`)
      }
    } else {
      // Eye/eyebrow: numbered cell list
      lines.push('Cell layout (left to right, top to bottom):')
      config.cells.forEach((cell, i) => {
        lines.push(`${i + 1}. ${cell.label} — ${cell.description}`)
      })
    }
  }

  // Critical note
  if (config.criticalNote) {
    lines.push('')
    lines.push(`CRITICAL: ${config.criticalNote}`)
  }

  // User description
  if (base) {
    lines.push('')
    lines.push(base)
  }

  // Requirements
  if (config.requirements.length > 0) {
    lines.push('')
    lines.push('Requirements:')
    for (const req of config.requirements) {
      lines.push(`- ${req}`)
    }
  }

  // Concept-reference emphasis for non-concept steps
  if (partType !== 'concept') {
    lines.push('')
    lines.push(
      "STYLE CONSISTENCY: The provided concept image is your PRIMARY reference. Every generated element must look like it was extracted from or belongs to that exact character. Match the concept's: line weight, shading technique, color palette, level of detail, and rendering style. A mismatch in art style between parts will make the character look broken when composited.",
    )
  }

  // Universal chroma key background rule (disabled — background removal handles this)
  // lines.push('')
  // lines.push('BACKGROUND: Use a solid, uniform CHROMA KEY background color. Choose bright green (#00FF00) if the character/object does NOT contain significant green. Choose bright blue (#0000FF) if the character/object contains green (e.g. Hulk, green clothing, green hair). The entire background must be a single flat color — NO gradients, NO shadows, NO floor, NO environment.')

  // Universal grid step rules — always appended
  if (isGridStep(partType)) {
    lines.push('')
    lines.push(
      'IMPORTANT: Follow the grid layout from the reference image exactly — place each item in the correct cell position. However, do NOT render any visible grid lines, borders, dividers, or separators in the final output image. The cells should flow seamlessly without drawn lines between them.',
    )
  }

  return lines.join('\n')
}

// ── Viseme Curvature Configs (for multi-phase generation) ──────────────

const VISEME_CELLS: NB2CellDesc[] = [
  { label: 'Rest', description: 'Closed, relaxed mouth — neutral resting position' },
  { label: 'Aa', description: 'Wide open mouth (AH sound)' },
  { label: 'Ee', description: 'Wide smile showing teeth (EE sound)' },
  { label: 'Oh', description: 'Rounded open mouth (OH sound)' },
  { label: 'Oo', description: 'Pursed/tight round lips (OO/W sound)' },
  { label: 'FV', description: 'Lower lip tucked under upper teeth (F/V sound)' },
  { label: 'MBP', description: 'Lips pressed together (M/B/P sound)' },
  { label: 'DTL', description: 'Slightly open, tongue tip up behind teeth (D/T/N/L/TH sound)' },
  { label: 'ChR', description: 'Narrow/pursed opening (CH/SH/S/R sound)' },
]

export function getVisemeCurvatureConfig(curvature: 'upward' | 'downward'): NB2PromptConfig {
  const isUp = curvature === 'upward'

  const emotionDescription = isUp
    ? 'EVERY SINGLE MOUTH must look like it is SMILING, HAPPY, LAUGHING, GRINNING, BEAMING WITH JOY. The corners of the lips MUST curve dramatically UPWARD. Think of the widest, most joyful smile — that is the curvature you need for EVERY mouth shape. Even closed/pressed lip shapes (like M and Rest) must have visibly upturned corners.'
    : 'EVERY SINGLE MOUTH must look SAD, MISERABLE, ABOUT TO CRY, FROWNING, HEARTBROKEN. The corners of the lips MUST droop dramatically DOWNWARD. Think of the saddest, most devastated frown — that is the curvature you need for EVERY mouth shape. Even open mouth shapes must have visibly downturned lip corners.'

  return {
    instruction: `Generate the SAME 9 mouth shapes as the attached reference, but ${isUp ? 'ALL MOUTHS MUST BE SMILING AND HAPPY' : 'ALL MOUTHS MUST BE SAD AND FROWNING'}. MATCH THE CONCEPT CHARACTER'S LIP STYLE EXACTLY`,
    gridNote: `The attached reference image shows the neutral versions. Reproduce each mouth position in the same cell order. ${emotionDescription}`,
    cells: VISEME_CELLS,
    criticalNote: `${emotionDescription} Match each cell position exactly to the neutral reference image — same mouth SHAPE in each cell, but the lip curvature must be DRAMATICALLY ${isUp ? 'UPWARD/SMILING' : 'DOWNWARD/FROWNING'}. The difference from neutral must be OBVIOUS and EXAGGERATED. Each cell must contain ONLY the lips, teeth, tongue — NO SKIN, NO face, NO chin. Do NOT write any text, labels, or annotations on the sheet. MATCH THE CONCEPT CHARACTER'S ART STYLE: same lip color, same line weight, same rendering technique.`,
    requirements: [
      isUp
        ? 'CRITICAL: Every mouth MUST look happy and smiling — corners of lips dramatically curved UPWARD like a big grin'
        : 'CRITICAL: Every mouth MUST look sad and frowning — corners of lips dramatically drooping DOWNWARD like about to cry',
      'The curvature difference from neutral must be OBVIOUS — do NOT be subtle, EXAGGERATE the curve',
      'Match the same 9 mouth shapes from the neutral reference (same order, same positions)',
      "MATCH THE CONCEPT CHARACTER'S LIPS: same lip color, same lip thickness, same rendering style, same line weight",
      'ZERO SKIN — no skin-colored pixels, no face skin, no chin, no jaw area',
      'Show ONLY lips, teeth, tongue, and lip wrinkles',
      'Each cell must be the same size',
      'Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image',
      'Do NOT write any text, labels, annotations, or captions on the image',
      'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
    ],
  }
}

/**
 * Build a compiled prompt for a viseme curvature variant (upward/downward).
 * Used by the multi-phase viseme flow after neutral is confirmed.
 */
export function buildVisemeCurvaturePrompt(
  curvature: 'upward' | 'downward',
  userPrompt: string,
  gridSize?: NB2GridSize,
): string {
  const config = getVisemeCurvatureConfig(curvature)
  return compileNB2Prompt('viseme-sheet', config, userPrompt, gridSize)
}

// ── All-at-once viseme config (36 visemes in one sheet) ────────────────

/**
 * Build a prompt config for generating all 36 visemes (3 curvatures × 12 visemes)
 * in a single grid sheet. The curvature axis (rows or cols) is auto-detected.
 */
export function getVisemeAllAtOnceConfig(gridSize: NB2GridSize): NB2PromptConfig {
  const curvatureAxis = getVisemeCurvatureAxis(gridSize)

  const curvatureDesc =
    curvatureAxis === 'rows'
      ? 'Each ROW represents a different mouth curvature. Row 1: NEUTRAL (straight lips). Row 2: UPWARD (happy/smiling lips). Row 3: DOWNWARD (sad/frowning lips).'
      : 'Each COLUMN represents a different mouth curvature. Col 1: NEUTRAL (straight lips). Col 2: UPWARD (happy/smiling lips). Col 3: DOWNWARD (sad/frowning lips).'

  const visemeAxis = curvatureAxis === 'rows' ? 'COLUMN' : 'ROW'

  return {
    instruction:
      'Generate a sprite sheet of MOUTH positions for lip-sync animation with ALL THREE curvatures (neutral, upward/happy, downward/sad)',
    gridNote: `${curvatureDesc} Each ${visemeAxis} represents a different mouth shape/viseme. All mouths must match the character's art style.`,
    cells: [
      { label: 'Row/Col structure', description: curvatureDesc },
      { label: 'Curvature 1 — Neutral', description: 'Straight lip curvature (not smiling, not frowning)' },
      { label: 'Curvature 2 — Upward', description: 'Corners of lips curved UPWARD (happy/smiling shape)' },
      { label: 'Curvature 3 — Downward', description: 'Corners of lips curved DOWNWARD (sad/frowning shape)' },
    ],
    criticalNote: `Each cell must contain ONLY the lips, teeth, tongue, and lip wrinkles — absolutely NO SKIN, NO face, NO chin, NO jaw, NO nose, NO cheeks. The 3 curvatures must be clearly different from each other while each ${visemeAxis} shows the same mouth shape with different curvature. Do NOT write any text, labels, names, or annotations anywhere on the sheet.`,
    requirements: [
      'Generate ALL THREE curvatures in one grid: neutral (straight), upward (happy), downward (sad)',
      'Each mouth shape must appear 3 times — once per curvature',
      'Keep the EXACT same art style and lip color as the concept',
      'ZERO SKIN — no skin-colored pixels, no face skin, no chin, no jaw area',
      'Show ONLY lips, teeth, tongue, and lip wrinkles',
      'Each cell must be the same size',
      'Follow the grid layout from the reference but do NOT render visible grid lines, borders, dividers, or separators in the final image',
      'Do NOT write any text, labels, annotations, or captions on the image',
      'Use a solid, uniform WHITE (#FFFFFF) background — NO gradients, NO shadows, NO floor',
      'Consistent style across all cells',
    ],
  }
}

/**
 * Build a compiled prompt for all-at-once viseme generation.
 */
export function buildVisemeAllAtOncePrompt(userPrompt: string, gridSize: NB2GridSize): string {
  const config = getVisemeAllAtOnceConfig(gridSize)
  return compileNB2Prompt('viseme-sheet', config, userPrompt, gridSize)
}

// ── Legacy wrapper (for backward compat) ─────────────────────────────

export function buildNB2Prompt(
  partType: NB2PartType,
  userPrompt: string,
  gridSize?: NB2GridSize,
  gender?: NB2Gender,
): string {
  const config = getDefaultPromptConfig(partType)
  return compileNB2Prompt(partType, config, userPrompt, gridSize, gender)
}
