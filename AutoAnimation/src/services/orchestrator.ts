/**
 * AI Director — Orchestration Service
 *
 * Takes a high-level user prompt, calls Gemini to generate a structured ClipPlan,
 * then executes the plan step-by-step across all platform stores.
 */

import type {
  ClipPlan,
  ClipPlanCharacter,
  OrchestratorStep,
  TokenUsage,
  CostEntry,
  OrchestratorSettings,
  StockMediaRole,
} from '@/types/orchestrator'
import type { TextOverlay, FontFamily } from '@/stores/useTextOverlayStore'
import type { DialogueEmotion } from '@/stores/useMultiCharacterStore'
import type { GeneratedVoice, VisemeEvent, WordEvent } from '@/types/voice'
import { sampleAnimations } from '@/data/sampleAnimations'
import { BUILTIN_TEMPLATES, getTemplateContent } from '@/data/builtinTemplates'
import { generateSVGObjects } from '@/services/svgObjectAnimation'
import { parseTemplateConfig } from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import { getAllCachedSummaries, staticParserFallback } from '@/services/templateAnalyzer'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { getElevenLabsService, hasElevenLabsService, generateMusic, generateSoundEffect } from '@/services/elevenlabs'
import { buildMusicPlanFromDialogue } from '@/services/musicAnalyzer'
import { useMediaStore, type MediaAsset } from '@/stores/useMediaStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { saveMediaBlob } from '@/services/mediaDB'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { getPixabayService, hasPixabayService } from '@/services/pixabay'
import { LipSyncProcessor } from '@/services/lipSync'
import { CaptionProcessor } from '@/services/captions'
import { buildEmotionTimeline } from '@/services/emotionTimeline'
import { withCreditGate } from './creditGate'
import { CREDIT_COSTS } from '@/types/credits'
import { callGeminiProxy } from '@/services/aiProxy'

// ── Constants ──

const PROXY_MODEL = 'gemini-3-flash-preview'

// ElevenLabs pricing (Starter plan estimate: ~$0.30 per 1,000 characters)
const ELEVENLABS_COST_PER_CHAR = 0.0003 // $0.30 / 1000 chars

// Gemini 2.5 Pro pricing (USD per 1M tokens) — used for SVG generation cost tracking
const GEMINI_PRO_INPUT_PRICE = 1.25
const GEMINI_PRO_OUTPUT_PRICE = 10.0

const ASPECT_RATIO_DIMENSIONS: Record<string, { w: number; h: number }> = {
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '1:1': { w: 1080, h: 1080 },
  '4:3': { w: 1440, h: 1080 },
  '21:9': { w: 2560, h: 1080 },
}

const TEXT_PRESET_DEFAULTS: Record<string, Partial<TextOverlay>> = {
  title: {
    fontFamily: 'Montserrat',
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    position: 'center',
    shadow: true,
    background: false,
    textCase: 'none',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 36,
    fontWeight: 'normal',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    position: 'bottom',
    shadow: true,
    background: false,
    textCase: 'none',
  },
  'lower-third': {
    fontFamily: 'Roboto',
    fontSize: 28,
    fontWeight: 'medium',
    color: '#ffffff',
    align: 'left',
    verticalAlign: 'bottom',
    position: 'bottom',
    shadow: false,
    background: true,
    backgroundOpacity: 0.7,
    textCase: 'none',
  },
  cta: {
    fontFamily: 'Montserrat',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    position: 'bottom',
    shadow: false,
    background: true,
    backgroundOpacity: 0.9,
    textCase: 'uppercase',
  },
  quote: {
    fontFamily: 'Playfair Display',
    fontSize: 40,
    fontWeight: 'normal',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    position: 'center',
    shadow: true,
    background: false,
    textCase: 'none',
  },
  watermark: {
    fontFamily: 'Space Mono',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#ffffff',
    align: 'right',
    verticalAlign: 'top',
    position: 'top',
    shadow: false,
    background: false,
    textCase: 'none',
    opacity: 0.5,
  },
}

const VALID_FONT_FAMILIES: string[] = ['Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Space Mono']

function safeFontFamily(font: string | undefined, fallback: string = 'Inter'): FontFamily {
  if (font && VALID_FONT_FAMILIES.includes(font)) return font as FontFamily
  if (fallback && VALID_FONT_FAMILIES.includes(fallback)) return fallback as FontFamily
  return 'Inter'
}

// ── Plan Generation ──

/** Build the "USER-SELECTED" constraint section for the Gemini prompt.
 *  When users pick specific animations/templates/etc in the Settings panel,
 *  we tell Gemini it MUST use those items in the plan. */
function buildSelectedItemsSection(selected?: {
  animationNames: string[]
  templateIds: string[]
  audioIds: string[]
  captionIds: string[]
  collageIds: string[]
  aiAnimationIds: string[]
}): string {
  if (!selected) return ''

  const lines: string[] = []

  if (selected.animationNames.length > 0) {
    lines.push(
      `\nUSER-SELECTED ANIMATIONS — You MUST use these specific Lottie animations in the clip (as background or overlay):\n` +
        selected.animationNames.map((n) => `  - "${n}"`).join('\n'),
    )
  }

  if (selected.templateIds.length > 0) {
    lines.push(
      `\nUSER-SELECTED HTML TEMPLATES — You MUST include these templates in "htmlTemplates":\n` +
        selected.templateIds.map((id) => `  - ${id}`).join('\n'),
    )
  }

  if (selected.audioIds.length > 0) {
    lines.push(
      `\nUSER-SELECTED AUDIO — The user chose these specific audio assets to include:\n` +
        selected.audioIds.map((id) => `  - ${id}`).join('\n'),
    )
  }

  if (selected.captionIds.length > 0) {
    lines.push(
      `\nUSER-SELECTED CAPTION STYLES — Use these caption templates:\n` +
        selected.captionIds.map((id) => `  - ${id}`).join('\n'),
    )
  }

  if (selected.collageIds.length > 0) {
    lines.push(
      `\nUSER-SELECTED COLLAGE TEMPLATES — Include these collage templates:\n` +
        selected.collageIds.map((id) => `  - ${id}`).join('\n'),
    )
  }

  if (selected.aiAnimationIds.length > 0) {
    lines.push(
      `\nUSER-SELECTED AI ANIMATIONS — Include these AI animation templates:\n` +
        selected.aiAnimationIds.map((id) => `  - ${id}`).join('\n'),
    )
  }

  return lines.length > 0 ? '\n' + lines.join('\n') + '\n' : ''
}

/**
 * Build content-type-specific context for the Gemini prompt when the source
 * is a URL extraction, article, document, or presentation.
 */
function buildContentTypeContext(settings?: OrchestratorSettings): string {
  if (!settings?.contentType || settings.contentType === 'generic') return ''

  const lines: string[] = []

  // URL-extracted content context
  if (settings.extractedContent) {
    const ec = settings.extractedContent
    lines.push(`CONTENT SOURCE: ${ec.contentType?.toUpperCase() || 'WEB PAGE'} from ${ec.url}`)
    if (ec.title) lines.push(`Title: ${ec.title}`)
    if (ec.summary) lines.push(`Summary: ${ec.summary}`)
    if (ec.keyPoints && ec.keyPoints.length > 0) {
      lines.push(`Key Points:\n${ec.keyPoints.map((p: string) => `  - ${p}`).join('\n')}`)
    }
    if (ec.tone) lines.push(`Tone: ${ec.tone}`)
    if (ec.productPrice) lines.push(`Price: ${ec.productPrice}`)
    if (ec.productFeatures && ec.productFeatures.length > 0) {
      lines.push(`Product Features: ${ec.productFeatures.join(', ')}`)
    }
  }

  // Extracted images context
  if (settings.extractedImages && settings.extractedImages.length > 0) {
    lines.push(
      `\nEXTRACTED IMAGES (${settings.extractedImages.length} available): Use these as stock media overlays/backgrounds instead of searching Pixabay. In stockMedia entries, use query starting with "extracted:" followed by the index (e.g., "extracted:0", "extracted:1").`,
    )
  }

  // Content-type-specific prompt templates
  if (settings.contentType === 'article') {
    lines.push(`\nARTICLE VIDEO TEMPLATE: Structure the video as a multi-scene article summary:
- Scene 1: Article title card with source attribution
- Scene 2-N: One scene per key section, each with narrator text and matching visuals
- Final Scene: Call-to-action ("Read the full article at [source]")
Allocate time per section proportional to importance. Use smooth transitions between sections.`)
  } else if (settings.contentType === 'product') {
    lines.push(`\nPRODUCT SHOWCASE TEMPLATE: Structure the video as a product showcase:
- Scene 1: Hook with the product name and a bold claim
- Scene 2: Price reveal with visual emphasis
- Scene 3-N: Feature highlights with matching visuals
- Final Scene: CTA to purchase/learn more
Use extracted product images as overlays. Emphasize price and key features in text overlays.`)
  } else if (settings.contentType === 'recipe') {
    lines.push(`\nRECIPE VIDEO TEMPLATE: Structure the video as a step-by-step recipe:
- Scene 1: Dish name and appetizing visual
- Scene 2: Ingredients list (animated text reveal)
- Scene 3-N: Step-by-step instructions with visual transitions
- Final Scene: Finished dish showcase`)
  } else if (settings.contentType === 'news') {
    lines.push(`\nNEWS BREAKDOWN TEMPLATE: Structure the video as a news report:
- Scene 1: Breaking news-style headline reveal
- Scene 2: Context and background
- Scene 3-N: Key facts and developments
- Final Scene: Summary and implications
Use news-style templates and maintain neutral, authoritative tone.`)
  } else if (settings.contentType === 'document') {
    lines.push(`\nDOCUMENT VIDEO TEMPLATE: Structure the video to walk through document content:
- Scene 1: Document title and overview
- Scene 2-N: Key pages/sections with page thumbnails and text highlights
- Final Scene: Summary of key takeaways`)
  } else if (settings.contentType === 'presentation') {
    lines.push(`\nPRESENTATION VIDEO TEMPLATE: Convert the slide deck into a narrated video:
- Each slide becomes a scene with matching duration
- Speaker notes become the narration script
- Add smooth transitions between slides`)
  }

  return lines.length > 0 ? '\nCONTENT-TYPE CONTEXT:\n' + lines.join('\n') + '\n' : ''
}

/**
 * Build the full Gemini prompt including available resources (characters, voices, animations)
 * and ask for a structured ClipPlan JSON.
 */
function buildPlanPrompt(
  userPrompt: string,
  savedCharacterNames: string[],
  selectedCharacterNames: string[],
  voiceNames: string[],
  animationNames: { name: string; category: string; tags: string[] }[],
  htmlTemplateList: { id: string; title: string; tags: string[]; category?: string }[],
  settings?: OrchestratorSettings,
  selectedItems?: {
    animationNames: string[]
    templateIds: string[]
    audioIds: string[]
    captionIds: string[]
    collageIds: string[]
    aiAnimationIds: string[]
  },
  saved3DCharacterNames: string[] = [],
  selected3DCharacterNames: string[] = [],
  fieldSummaries: Record<string, string> = {},
): string {
  // Build character availability text
  let characterList: string
  if (selectedCharacterNames.length > 0) {
    characterList = `USER-SELECTED characters (you MUST use ALL ${selectedCharacterNames.length} of them — include every one in the "characters" array AND write dialogue lines for each):\n  ${selectedCharacterNames.map((n, i) => `${i + 1}. "${n}"`).join('\n  ')}`
    if (selectedCharacterNames.length > 1) {
      characterList += `\n⚠️ The user selected ${selectedCharacterNames.length} characters — this means they want a MULTI-CHARACTER conversation/debate. Write alternating dialogue lines between all ${selectedCharacterNames.length} characters. Each character must speak at least 2-3 times.`
    }
    // Also mention other available characters
    const others = savedCharacterNames.filter((n) => !selectedCharacterNames.includes(n))
    if (others.length > 0) {
      characterList += `\nOther available saved characters (optional): ${others.join(', ')}`
    }
  } else if (savedCharacterNames.length > 0) {
    characterList = `Available saved characters: ${savedCharacterNames.join(', ')}`
  } else {
    characterList = 'No saved characters available. Set generateNew=true for characters if needed.'
  }

  // Append 3D character information
  if (selected3DCharacterNames.length > 0) {
    characterList += `\n\nUSER-SELECTED 3D characters (you MUST include ALL of them with dimension="3d"):\n  ${selected3DCharacterNames.map((n, i) => `${i + 1}. "${n}" (3D model)`).join('\n  ')}`
    if (selected3DCharacterNames.length > 0 && selectedCharacterNames.length > 0) {
      characterList += `\n⚠️ Mix of 2D and 3D characters selected — use dimension="2d" for 2D sprite characters and dimension="3d" for 3D model characters.`
    }
    const other3D = saved3DCharacterNames.filter((n) => !selected3DCharacterNames.includes(n))
    if (other3D.length > 0) {
      characterList += `\nOther available saved 3D characters (optional): ${other3D.join(', ')}`
    }
  } else if (saved3DCharacterNames.length > 0) {
    characterList += `\nAvailable saved 3D characters (set dimension="3d" to use): ${saved3DCharacterNames.join(', ')}`
  }

  const voiceList =
    voiceNames.length > 0
      ? `Available ElevenLabs voices: ${voiceNames.join(', ')}`
      : 'No voices loaded. Omit voiceName to use the default voice.'

  const bgAnimations = animationNames
    .filter((a) => a.category === 'background')
    .map((a) => `"${a.name}" (tags: ${a.tags.join(', ')})`)
    .join('\n  ')

  const overlayAnimations = animationNames
    .filter((a) => a.category === 'overlay')
    .map((a) => `"${a.name}" (tags: ${a.tags.join(', ')})`)
    .join('\n  ')

  // Build compact template list: "id: Title" per line, grouped by category
  const htmlTemplatesByCategory = new Map<string, typeof htmlTemplateList>()
  for (const t of htmlTemplateList) {
    const cat = t.category || 'html-templates'
    if (!htmlTemplatesByCategory.has(cat)) htmlTemplatesByCategory.set(cat, [])
    htmlTemplatesByCategory.get(cat)!.push(t)
  }
  const htmlTemplateSection = Array.from(htmlTemplatesByCategory.entries())
    .map(([cat, templates]) => {
      const items = templates
        .map((t) => {
          const summary = fieldSummaries[t.id]
          return summary
            ? `${t.id}: ${t.title} [${t.tags.join(', ')}] {${summary}}`
            : `${t.id}: ${t.title} [${t.tags.join(', ')}]`
        })
        .join(', ')
      return `  [${cat}] ${items}`
    })
    .join('\n')

  // Build settings-aware constraints
  const aspectRatioConstraint = settings?.aspectRatio
    ? `IMPORTANT: The user has selected "${settings.aspectRatio}" aspect ratio. You MUST use this exact aspect ratio in the canvas config.`
    : ''

  const durationConstraint =
    settings?.durationSeconds && settings.durationSeconds > 0
      ? `IMPORTANT: The user has set clip duration to ${settings.durationSeconds} seconds. You MUST use this exact duration in the canvas config.`
      : ''

  const fpsConstraint =
    settings?.fps && settings.fps > 0
      ? `IMPORTANT: The user has set FPS to ${settings.fps}. You MUST use this exact FPS in the canvas config.`
      : ''

  const brandImageNote = settings?.brandContext?.brandImageAssetIds?.length
    ? `
- Brand images available as pre-loaded overlays (${settings.brandContext.brandImageAssetIds.length} images). To use them, add stockMedia entries with query starting with "brand:" followed by the role:
   - query: "brand:logo" — company logo overlay
   - query: "brand:hero" — hero/banner image
   - query: "brand:product" — product photo
   These will use the actual brand images instead of searching Pixabay. Use them as overlays to reinforce brand identity.`
    : ''

  const brandContextNote = settings?.brandContext
    ? `BRAND CONTEXT (ensure brand consistency throughout the video):
- Business: ${settings.brandContext.businessName} (${settings.brandContext.industry})
- Tone: ${settings.brandContext.tone} — match this tone in all dialogue and text overlays
- Brand colors: ${settings.brandContext.primaryColors.join(', ')} — use these hex colors in shapes, text overlay colors, and HTML template config overrides
${settings.brandContext.tagline ? `- Tagline: "${settings.brandContext.tagline}"` : ''}${brandImageNote}
Make the video feel like it was produced by ${settings.brandContext.businessName}. Use brand colors for accent shapes, text highlights, and template themes.`
    : ''

  const svgGenerationNote =
    settings?.generateSVGAnimations === false
      ? 'SVG generation is DISABLED. Only use "lottie" for backgrounds, never "svg-generate".'
      : 'You may use "svg-generate" for backgrounds if no suitable Lottie animation exists in the library.'

  const googleSearchDataNote = settings?.useGoogleSearch
    ? `GOOGLE SEARCH IS ENABLED — You have access to real-time web data via Google Search grounding.
For infographic charts, search for ACTUAL current statistics, rankings, and data.
Populate CONFIG.data with REAL numbers from your search results.
Example: If topic is "top programming languages", search for actual Stack Overflow or TIOBE data and use those real percentages.
Always use the most recent data available.`
    : `Google Search is DISABLED — Generate plausible, illustrative data that tells a compelling story.
Make numbers realistic but clearly approximate.
The character should not claim the data is "latest" or "official".`

  const stockMediaNote =
    settings?.useStockMedia && hasPixabayService()
      ? `10. Stock Media (Pixabay): Search for free stock images and videos to complement the clip. Stock media is ONE tool among many — use it when it adds value, not in every plan.

   **Roles** (each item MUST have a "role"):
   - "background": Full-canvas image/video behind everything. Use for establishing shots, scenic backdrops, or atmosphere when no HTML template covers the scene. z-index: 1. Auto-centered, auto-scaled to cover canvas.
   - "cutaway": Full-canvas momentary visual (2-5 seconds) to illustrate what a character is talking about. Think B-roll in a YouTube video. z-index: 4. Auto-centered.
   - "overlay": Small floating image (30-50% of canvas) positioned over other content. Good for product shots, icons, or illustrative images shown while characters talk. z-index: 6. Position via {x, y} percentage.
   - "accent": Tiny element (15-30% of canvas) for decorative touches — a small icon, emoji-like element, or texture. z-index: 7.

   **When to use stock media:**
   - Cutaway images/videos to show what characters are discussing (e.g. a food photo when talking about recipes)
   - Scenic/atmospheric backgrounds when no Lottie animation or HTML template fits
   - Overlay product shots, real-world objects, or photos that animated content can't replicate
   - Short B-roll video clips (3-8 seconds) between dialogue segments

   **When NOT to use stock media:**
   - If an HTML template already provides the visual (e.g. world map, chart, terminal)
   - If a Lottie animation covers the background adequately
   - Don't use stock media INSTEAD of HTML templates — use them ALONGSIDE templates when helpful
   - Don't add stock media just to fill space — only when it enriches the storytelling

   **Transitions** (optional, defaults provided per role):
   - enterTransition / exitTransition: "fade", "zoom-in", "zoom-out", "slide-left", "slide-right", "slide-up", "ken-burns", "none"
   - ken-burns: Slow cinematic zoom over entire duration — great for still images used as backgrounds
   - transitionDuration: seconds (default 0.5). Use 0.3 for quick cuts, 1.0 for slow cinematic fades.

   **Video duration intelligence**: If a stock video is shorter than the planned time range, it will automatically be trimmed. Plan realistic durations — most Pixabay videos are 5-30 seconds.

   **PREFER VIDEOS over images for dynamic content:**
   - Use type:"video" for cutaways, B-roll, and background atmosphere — video is far more engaging than still images
   - Use type:"image" only for static overlays (product shots, icons, logos) or when a specific still photo is needed
   - Most Pixabay videos are 5-30 seconds — plan realistic durations
   - Great video queries: "aerial drone city sunset", "ocean waves close up", "busy office timelapse", "nature forest morning"
   - For a 60s clip, aim for at least 1-2 stock videos as cutaways or backgrounds

   **Search tips**: Use specific English keywords (e.g. "steaming coffee cup wooden table", "aerial drone city sunset", "close up circuit board soldering"). Avoid generic single words.`
      : 'Stock media search is DISABLED. Do NOT include "stockMedia" in your plan.'

  const soundEffectsNote = settings?.useSoundEffects
    ? `11b. Sound Effects: Add short sound effects to enhance key moments.

   **Two sources available** (set "source" field on each):
   - "generate" (default): AI-generated from text prompt via ElevenLabs — best for custom, specific, or abstract sounds
   - "search": Search Freesound library (500K+ Creative Commons sounds) — best for real-world sounds (applause, rain, traffic, birds, crowd noise, machinery)

   **When to use which:**
   - Dramatic whoosh/hit/impact → "generate" (AI creates exactly what you describe)
   - Audience applause, city traffic, ocean waves → "search" (real recordings sound better)
   - Coin drop, cash register, keyboard typing → "search" (real sounds are more authentic)
   - Sci-fi laser, magical shimmer, custom tension riser → "generate"

   **When to use SFX:**
   - Transitions between scenes or topics (whoosh, swoosh)
   - Emphasis on key data points or reveals (ding, impact, dramatic hit)
   - Character actions or reactions (gasp, applause, record scratch)
   - Mood enhancement (tension riser, comedic boing, cash register)

   **Guidelines:**
   - Keep prompts specific and descriptive (e.g. "dramatic orchestral hit", "coin dropping on wooden table", "sci-fi whoosh transition")
   - 2-5 sound effects per clip maximum — don't overuse
   - Don't place SFX over dialogue — use them in pauses, transitions, or at very low volume
   - Duration: 0.5-3 seconds for most SFX. Use durationSeconds to control.
   - Volume: default 0.7. Use lower (0.3-0.5) for subtle background SFX, higher (0.8-1.0) for dramatic hits.`
    : 'Sound effects are DISABLED. Do NOT include "soundEffects" in your plan.'

  return `You are an expert AI Director for ProAnimate, a professional web-based animation studio. You think like a creative director, motion designer, scriptwriter, and animation supervisor combined. Given a user's creative brief, you plan a complete animated clip by choosing from the platform's tools and resources.

You must optimize every clip for maximum viewer retention and engagement. Think about hooks, pacing, emotional arcs, and platform-specific best practices.

${aspectRatioConstraint}
${durationConstraint}
${fpsConstraint}
${brandContextNote}

CREATIVE DIRECTION PRINCIPLES:
1. **Hook (First 3 seconds)**: Start with the most interesting/shocking/relatable statement. NEVER open with "Hey guys", "In this video", or "Welcome to". Start with VALUE — a surprising fact, bold claim, or provocative question.
2. **Emotional arc**: Vary emotions every 2-4 dialogue lines. Use contrasting emotions ([happy] → [worried] → [determined]) for dynamic range. A flat emotional line = boring video.
3. **Pacing**: ~5 words/second speaking rate. Short punchy lines (2-4s each) for viral short-form. Longer (5-8s) for educational content. Never let a single line exceed 10 seconds.
4. **Retention**: End each line on a rising beat — tease what's coming next. Use open loops ("But here's the thing...") to keep viewers watching.
5. **Platform-aware**:
   - TikTok/Reels (9:16): 15-60s, fast pace, karaoke captions, high emotion variance, pattern interrupts
   - YouTube Shorts (9:16): 30-60s, slightly more informational, still punchy
   - YouTube (16:9): 60-180s, measured pacing, sentence captions, deeper content
   - Instagram Feed (1:1): 15-30s, clean look, minimal overlays
6. **Multi-character**: For debates/conversations, give characters contrasting personalities and voices. Alternate every 2-4 seconds. Each character must have a distinct role (narrator, skeptic, expert, devil's advocate).
7. **Visual layering**: Combine tools intelligently — don't default to one style. A great clip uses HTML templates for visual theme + characters for personality + SVG objects for storytelling + stock media for realism.
8. **Format selection**: Choose the most engaging format, not the simplest:
   - If the topic involves countries/geopolitics → world map or maptiler map + characters
   - If the topic involves travel/routes/locations/places/cities → maptiler map + characters
   - If the topic involves global/international overview → maptiler globe + characters
   - If the topic involves data/statistics → infographic charts + narration
   - If authority/trust is needed → talking head with professional template
   - If storytelling is needed → multiple characters with scene-appropriate backgrounds
   - If viral/entertainment → fast cuts, stock media B-roll, high emotion variance

PLATFORM CAPABILITIES:
1. Canvas: aspect ratios 16:9, 9:16, 1:1, 4:3, 21:9. FPS: 24, 30, 60.
2. Backgrounds: The SCENE behind everything. Choose the type that fits:
   - "none" — Solid dark fill. Use when an HTML template covers the FULL clip (0-100%) — the template IS the visual. THIS IS THE DEFAULT when you include a full-coverage HTML template.
   - "image" — A real photograph from Pixabay. Use for real-world scenes: office, park, classroom, city skyline. Set imageQuery to specific keywords. PREFER this for realistic settings.
   - "lottie" — Ambient particle effect. Only as a last resort.
   - "svg-generate" — AI-generated vector scene. ${svgGenerationNote}
3. Characters: Positioned on canvas with lip-synced dialogue, emotion expressions.
4. Dialogue: Multi-character script with [emotion] cues (Joy, Anger, Sadness, Fear, Surprise, Disgust, Neutral).
5. Voices: Text-to-speech via ElevenLabs with automatic lip sync.
6. Text Overlays: title, subtitle, lower-third, cta, quote, watermark presets.
7. Shapes: rectangle, circle, triangle, star decorative elements.
8. Captions: word-by-word, sentence, or karaoke style.
9. **HTML Templates (SPECIALIZED ONLY)**: Full HTML/CSS/JS templates for SPECIFIC visual needs — NOT the default visual layer. Use ONLY when the topic demands it:
   - World Map (tpl-world-map): geopolitics, wars, trade between nations, country comparisons
   - MapTiler Map (tpl-maptiler-map): specific locations, cities, travel, routes, satellite imagery
   - MapTiler Globe (tpl-maptiler-globe): global overview, international, planet-scale
   - Infographic charts: data comparisons, statistics, rankings
   - Social media mockups: Twitter/X, Reddit, news recreations
   - Terminal/code editor: programming/tech demos
   Do NOT use HTML templates as generic backgrounds. For most clips, use a real image background + B-roll text animations instead. See rules #10 and #11.5 for map choreography.
${stockMediaNote}
${soundEffectsNote}

AVAILABLE RESOURCES:
${characterList}

${voiceList}

Background Lottie animations:
  ${bgAnimations || 'None available'}
For "lottieQuery": use the EXACT animation name from the list above (e.g. "Starfield" not "stars"). This ensures reliable matching.

Overlay Lottie animations:
  ${overlayAnimations || 'None available'}

HTML Templates Library (${htmlTemplateList.length} templates — use ONLY for specialized visuals like maps, charts, social mockups):
${htmlTemplateSection || '  None available'}
${buildSelectedItemsSection(selectedItems)}
CRITICAL RULES:
1. **Default clip structure**: Background image (Pixabay) + character(s) + B-roll text animations + captions. HTML templates are OPTIONAL — only add them when the topic specifically needs a map, chart, social mockup, or code editor. Do NOT use HTML templates as generic backgrounds.
2. For characters: if USER-SELECTED characters are listed above, you MUST include **EVERY SINGLE ONE** of them in the "characters" array with their exact savedCharacterName. Do NOT skip any selected character — the user chose them for a reason. Write dialogue lines for ALL selected characters so they each speak. If 3 characters are selected, all 3 must appear and talk. Assign each character a distinct role (e.g., narrator, debater, expert, devil's advocate). Also use savedCharacterName for any other matching saved character. Set generateNew=true only if needed.
   NEVER invent a savedCharacterName that is not in the available characters list above. If you need a character not in the list, set generateNew=true and leave savedCharacterName empty. The savedCharacterName field must EXACTLY match one of the names listed above (case-insensitive).
3. For background: ALWAYS use type "image" with a descriptive imageQuery for a real scene photo from Pixabay (e.g. "dark tech server room neon", "cozy classroom chalkboard", "modern office desk computer"). The background sets the real-world scene. Use "none" ONLY when an HTML template like a world map or chart covers the full clip.
4. Write natural dialogue with [emotion] cues inline, e.g. "[happy] That's amazing!"
5. Use text overlays sparingly — the HTML template already provides visual text.
6. Duration should match the content: ~5 words/second speaking rate.
7. Character positions use PERCENTAGE coordinates (0-100) where x:50 = horizontal center, y:50 = vertical center.
   Character scale is a multiplier of 200px base size. On a 1920×1080 canvas, scale:1.5 = 300px character.
   DEFAULT layout by character count:
   - 1 character: x:50, y:15, scale:1.5
   - 2 characters: x:30, y:15 and x:70, y:15, scale:1.3
   - 3 characters: x:20, y:15 and x:50, y:15 and x:80, y:15, scale:1.1
   - 4+ characters: spread evenly across x-axis at y:15, scale:0.9

   TEMPLATE-AWARE positioning — adjust character y-position based on the chosen HTML template's scene:
   - World map / geography templates: y:12-18 (characters float above the map)
   - Terminal / code editor templates: y:15, x:75-85 (characters beside the code area)
   - Ocean / underwater / sea templates: y:60-75 (characters at water level or submerged)
   - City / skyline / street templates: y:55-70 (characters at street/ground level)
   - Classroom / whiteboard templates: y:15-20 (characters in front of board)
   - Social media / UI mockup templates: y:12-18 (characters above the UI)
   - Charts / business / infographic templates: y:15, x:15-30 (characters beside content)
   - Space / sky / clouds templates: y:30-50 (characters floating in scene)
   - Nature / forest / outdoor templates: y:55-70 (characters on ground)
   - Default / generic templates: y:12-18 (characters at top)
   Position characters WHERE THEY MAKE VISUAL SENSE in the scene. Think about where a person would naturally stand in the scene the template depicts.
8. **Title text overlays** should be short-lived: 3-5 seconds max (startPercent:0, endPercent:0.04 for a 90s clip). Don't let titles linger on screen.
9. **SVG Objects**: Use "svgObjects" array to add individual animated icons/symbols on the canvas (coins, arrows, planes, etc.). Each object is generated individually by AI. Keep prompts SHORT (2-5 words, e.g. "gold coin", "oil barrel", "military jet"). Use keyframes to move objects across the canvas — great for showing trade flows, relationships, or movement between locations. Positions are in % (0-100) of canvas. IMPORTANT: SVG objects should ONLY appear during time ranges when they make visual sense — if an infographic chart covers 40-60%, do NOT show SVG objects during that range. Only show SVG objects when the world map or main visual is visible behind them.

10. **WORLD MAP TEMPLATE (tpl-world-map) — COMPREHENSIVE GUIDE**:
   If the user's topic involves countries, geopolitics, history between nations, wars, trade, diplomacy, geography, or any country-related content — you MUST use tpl-world-map as the primary template (startPercent: 0, endPercent: 1).

   **MANDATORY**: When you use tpl-world-map, you MUST populate config.commands with a rich choreography of zoom, highlight, and connection commands. A world map without commands is USELESS — it's just a static image. The map MUST be alive and reactive to the narration.

   **Available commands** (put these in the template's config.commands array):
   - { frame: N, action: "zoomToCountry", params: { country: "USA", zoomLevel: 4, duration: 1200 } }
   - { frame: N, action: "highlightCountry", params: { country: "China", color: "#ff6b6b" } }
   - { frame: N, action: "clearHighlights", params: {} }
   - { frame: N, action: "resetView", params: { duration: 800 } }
   - { frame: N, action: "drawConnection", params: { from: "USA", to: "Vietnam", color: "#f4d03f" } }
   - { frame: N, action: "clearConnections", params: {} }
   - { frame: N, action: "showLabel", params: { country: "USA" } }
   - { frame: N, action: "hideLabel", params: { country: "USA" } }
   - { frame: N, action: "hideUI", params: { elements: ["legend", "controls"] } }
   - { frame: N, action: "showUI", params: { elements: ["legend", "controls"] } }

   **HOW TO CHOREOGRAPH** (follow this pattern for EVERY world map clip):
   Step 1: First command should ALWAYS be hideUI at frame 0 (clean cinematic look).
   Step 2: When the narrator FIRST mentions a country → zoomToCountry + highlightCountry + showLabel for that country.
   Step 3: When a SECOND country is mentioned → zoomToCountry to it + highlightCountry (different color) + showLabel.
   Step 4: When discussing a RELATIONSHIP between two countries (trade, war, alliance, conflict) → drawConnection between them with a meaningful color (red for conflict, green for trade, gold for money, blue for alliance).
   Step 5: When the topic shifts to a new set of countries → clearHighlights + clearConnections + then zoom/highlight the new countries.
   Step 6: For overview/conclusion moments → resetView to show the full map.
   Step 7: Use zoomLevel 3-4 for large countries (USA, Russia, China), 5-6 for small countries (Vietnam, Israel, Cuba).

   **FRAME CALCULATION**: Use percentage-based estimates. For a 90s clip at 30fps = 2700 total frames.
   - 10% through = frame 270, 25% = frame 675, 50% = frame 1350, 75% = frame 2025, etc.
   - Align commands with dialogue: when a dialogue line mentions "China", the zoomToCountry command should fire at approximately the same frame percentage as that dialogue line's position in the script.
   - Add 10-20 commands minimum for a 60-90s clip. More is better — the map should CONSTANTLY be moving and reacting.

   **SVG OBJECTS WITH WORLD MAP**: When using tpl-world-map, ALWAYS add 3-5 relevant SVG objects to enrich the visual storytelling:
   - War/conflict topics: "military jet", "tank", "explosion", "missile", "red flag"
   - Trade/economics topics: "gold coin", "oil barrel", "dollar bill", "cargo ship", "money stack"
   - Diplomacy topics: "handshake icon", "white flag", "document scroll", "peace dove"
   - Geography/resources: "oil barrel", "diamond", "wheat bundle", "fish"
   - Use keyframes to move SVG objects FROM one country's approximate position TO another (e.g., oil barrel traveling from Saudi Arabia area x:60,y:45 to USA area x:22,y:40).
   - SVG objects should ONLY appear during segments when the world map is the main visible layer (NOT during infographic chart overlays).
   - Add a zoomToCountry command at a zoom level that shows both the origin and destination of the SVG travel path, so the movement is visible.

   **INFOGRAPHIC OVERLAYS**: For data-heavy sections, layer additional templates (tpl-infographic-bar, tpl-infographic-sankey, tpl-infographic-pie) on top of the map during specific time ranges (e.g., 20-40%). The map stays behind. During these overlay periods, do NOT add SVG objects (they'd be hidden behind the chart). Add clearHighlights before the chart appears and resume map commands after.

   **EXAMPLE** — "Why did China invade Vietnam":
   The AI should automatically generate commands like:
   - frame 0: hideUI
   - frame 30: zoomToCountry "China" (zoomLevel 3), highlightCountry "China" (#e74c3c), showLabel "China"
   - frame 120: zoomToCountry "Vietnam" (zoomLevel 5), highlightCountry "Vietnam" (#4fc3f7), showLabel "Vietnam"
   - frame 250: drawConnection "China" to "Vietnam" (#e74c3c) — showing invasion path
   - frame 400: resetView to show regional context
   - frame 500: highlightCountry "Soviet Union" (#ff9800), drawConnection "Soviet Union" to "Vietnam" (#ff9800) — alliance
   - frame 700: highlightCountry "Cambodia" (#9c27b0), drawConnection "Vietnam" to "Cambodia" (#9c27b0)
   - frame 900: clearHighlights, clearConnections, zoomToCountry "China" for conclusion
   Plus SVG objects: "military jet" flying from China (x:72,y:38) to Vietnam (x:70,y:52), "red flag" appearing at Vietnam, "tank" moving along the border.

   **COUNTRY NAME TIPS**: Use common English names. The map recognizes: "USA" or "United States", "UK" or "United Kingdom", "Russia", "China", "North Korea", "South Korea", "Vietnam", "Taiwan", "Iran", "Iraq", "Israel", "Palestine", "Saudi Arabia", "Turkey", etc.

11.5. **MAPTILER MAP TEMPLATES (tpl-maptiler-map / tpl-maptiler-globe) — GUIDE**:
   Use tpl-maptiler-map for topics involving specific locations, travel routes, city tours, road trips, hiking trails, real estate, architecture, natural landmarks, or any content needing satellite/street-level map visuals. Use tpl-maptiler-globe for topics needing a global/space perspective (international relations, global phenomena, "view from space" intros).

   **WHEN TO USE MAPTILER vs WORLD MAP**:
   - World map (tpl-world-map): Country-level geopolitics, wars, trade routes, country comparisons
   - MapTiler map (tpl-maptiler-map): Specific locations, cities, street-level, travel, terrain, routes, satellite imagery
   - MapTiler globe (tpl-maptiler-globe): Global overview, international, "zoom from space", planet-scale

   **Available commands** (config.commands array):
   - { frame: N, action: "flyTo", params: { lng: -73.98, lat: 40.75, zoom: 14, pitch: 60, bearing: 30, duration: 2000 } }
   - { frame: N, action: "addMarker", params: { lng: 2.35, lat: 48.86, color: "#ff4444", label: "Paris", id: "paris" } }
   - { frame: N, action: "removeMarker", params: { id: "paris" } }
   - { frame: N, action: "clearMarkers", params: {} }
   - { frame: N, action: "drawRoute", params: { coordinates: [[-73.98,40.75],[-0.12,51.50]], color: "#4fc3f7", width: 3, id: "route1", animate: true } }
   - { frame: N, action: "clearRoutes", params: {} }
   - { frame: N, action: "setStyle", params: { style: "satellite" } } (options: satellite, streets, topo, ocean, outdoor, dataviz)
   - { frame: N, action: "set3DTerrain", params: { enabled: true, exaggeration: 1.5 } }
   - { frame: N, action: "setPitch", params: { pitch: 60, duration: 1000 } }
   - { frame: N, action: "setBearing", params: { bearing: 180, duration: 1000 } }
   - { frame: N, action: "addPopup", params: { lng: 2.35, lat: 48.86, html: "<b>Eiffel Tower</b>", id: "popup1" } }
   - { frame: N, action: "removePopups", params: {} }
   - { frame: N, action: "fitBounds", params: { bounds: [[-5,42],[10,52]], padding: 50 } }
   - { frame: N, action: "setProjection", params: { type: "globe" } }
   - { frame: N, action: "hideUI", params: {} }
   - { frame: N, action: "showUI", params: {} }

   **HOW TO CHOREOGRAPH**:
   Step 1: hideUI at frame 0.
   Step 2: Set initial style (satellite for nature/travel, streets for cities, topo for hiking).
   Step 3: flyTo each location AS the narrator mentions it. Use pitch 45-60 for dramatic angles.
   Step 4: addMarker at each significant location with a descriptive label.
   Step 5: drawRoute between related locations (travel path, flight path, etc.).
   Step 6: Use set3DTerrain for mountain/valley content.
   Step 7: Vary bearing (rotation) between flyTo commands for cinematic variety.
   Step 8: For conclusions, zoom out or flyTo a wide view.

   **COMMON COORDINATES** (lng, lat):
   New York: -73.98, 40.75 | London: -0.12, 51.50 | Paris: 2.35, 48.86 | Tokyo: 139.69, 35.68
   Dubai: 55.27, 25.20 | Sydney: 151.21, -33.87 | Rome: 12.49, 41.90 | Cairo: 31.23, 30.04
   Mumbai: 72.88, 19.08 | Beijing: 116.40, 39.90 | Moscow: 37.62, 55.75 | LA: -118.24, 34.05
   Grand Canyon: -112.11, 36.10 | Everest: 86.92, 27.99 | Machu Picchu: -72.54, -13.16

   Add 8-15 commands minimum for a 60-90s clip.

11. **INFOGRAPHIC CHARTS WITH DATA** — When the topic involves statistics, comparisons, rankings, trends, financials, distributions, or ANY quantifiable data, include infographic chart templates with populated data:

   **CHART SELECTION GUIDE:**
   - Comparisons/rankings → tpl-infographic-bar (bar chart) or tpl-infographic-lollipop (lollipop)
   - Trends over time → tpl-infographic-line (line chart) or tpl-infographic-area (area chart)
   - Parts of a whole → tpl-infographic-donut (pie/donut chart)
   - Multi-series comparisons → tpl-infographic-stacked (stacked bar)
   - Correlations → tpl-infographic-scatter (scatter plot)
   - 3-variable data → tpl-infographic-bubble (bubble chart)
   - Distributions → tpl-infographic-histogram (histogram)
   - Activity patterns → tpl-infographic-heatmap (heatmap)
   - Hierarchical data → tpl-infographic-treemap (treemap)
   - Flow/transfer data → tpl-infographic-sankey (sankey diagram)
   - Geographic data → tpl-infographic-choropleth (choropleth map)
   - Project timelines → tpl-infographic-gantt (gantt chart)
   - KPIs/targets → tpl-infographic-kpi (KPI dashboard)

   **CONFIG FIELD GUIDE** — When setting "config" for an HTML template, use ONLY the field keys shown in {} braces after each template above.
   Types guide: text→string, color→"#hex", number→numeric, object-array→[{matching schema}], text-array→["strings"], boolean→true/false, select→one of listed options.
   If no {} braces are shown for a template, check its CONFIG object structure and use matching keys.

   **DIALOGUE + CHART TIMING:**
   - Characters MUST start talking about the data BEFORE or AS the chart appears on screen.
   - Characters should REFERENCE specific values and numbers from the chart data in their dialogue.
   - Use [emotion] cues that match the data: positive trends → [happy], negative → [sad], unexpected → [surprised].
   - Example timing for a clip showing a bar chart visible at 30–50%:
     • Dialogue at ~28%: "[curious] Let's look at the numbers..."
     • Chart startPercent: 0.30
     • Dialogue at ~32%: "[happy] As you can see, JavaScript leads with 65%..."
     • Dialogue at ~45%: "[surprised] Python is catching up fast at 58%!"
     • Chart endPercent: 0.50
     • Dialogue at ~51%: "[neutral] Now let's talk about what this means..."

   **MULTIPLE CHARTS:** For data-rich topics, use 2–3 different chart types across the clip timeline (don't overlap them). For example, show a bar chart at 15–45%, then a donut chart at 55–85%. Each chart should have dialogue that narrates it.

   **ALWAYS set config.title** to a descriptive title matching the specific data shown (not the default placeholder).
   **ALWAYS set config.theme** to "dark" (matches most backgrounds).

   ${googleSearchDataNote}

${buildContentTypeContext(settings)}

USER'S CREATIVE BRIEF:
"${userPrompt}"

Respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "canvas": {
    "aspectRatio": "16:9" | "9:16" | "1:1" | "4:3" | "21:9",
    "fps": 30,
    "durationSeconds": number
  },
  "background": {
    "type": "none" | "image" | "lottie" | "svg-generate",
    "imageQuery": "Pixabay search keywords for real scene background (e.g. 'modern office desk', 'sunny park')",
    "lottieQuery": "optional keyword for ambient particles (only if type=lottie)",
    "svgPrompt": "optional prompt for AI-generated SVG background"
  },
  "htmlTemplates": [
    {
      "templateId": "tpl-xxx (REQUIRED — pick from library above)",
      "query": "optional fallback search if templateId not found",
      "startPercent": 0.0,
      "endPercent": 1.0,
      "config": { "optional overrides for template editable properties" }
    }
  ],
  "characters": [
    {
      "name": "Character A",
      "savedCharacterName": "exact name of saved character if selected by user",
      "generateNew": false,
      "referenceDescription": "optional description for generation",
      "position": { "x": 30, "y": 15 },
      "scale": 1.3,
      "voiceName": "optional ElevenLabs voice name",
      "dimension": "2d"
    },
    {
      "name": "Character B (include ALL user-selected characters — one entry per character)",
      "savedCharacterName": "exact name of second saved character",
      "generateNew": false,
      "position": { "x": 70, "y": 15 },
      "scale": 1.3,
      "voiceName": "optional different voice",
      "dimension": "3d or 2d — use 3d for 3D model characters, defaults to 2d"
    }
  ],
  "dialogue": [
    { "characterName": "Character A", "script": "[happy] Hello! I'll start the discussion.", "emotion": "Joy" },
    { "characterName": "Character B", "script": "[curious] That's interesting, tell me more.", "emotion": "Surprise" },
    { "characterName": "Character A", "script": "[serious] Here's what happened next...", "emotion": "Neutral" },
    { "characterName": "Character B", "script": "[shocked] I had no idea about that!", "emotion": "Surprise" }
  ],
  "textOverlays": [
    {
      "preset": "title" | "subtitle" | "lower-third" | "cta" | "quote" | "watermark",
      "content": "Text content",
      "startPercent": 0.0,
      "endPercent": 0.15,
      "fontFamily": "optional font name",
      "color": "optional hex color"
    }
  ],
  "svgObjects": [
    {
      "prompt": "short description (2-5 words): gold coin, oil barrel, fighter jet, dollar bill, etc.",
      "startPercent": 0.3,
      "endPercent": 0.6,
      "width": 120,
      "height": 120,
      "keyframes": [
        { "time": 0, "x": 20, "y": 50, "scale": 0, "opacity": 0 },
        { "time": 0.2, "x": 20, "y": 50, "scale": 1, "opacity": 1 },
        { "time": 0.8, "x": 80, "y": 30, "scale": 1, "opacity": 1, "rotation": 360 },
        { "time": 1, "x": 80, "y": 30, "scale": 0, "opacity": 0 }
      ]
    }
  ],
  "shapes": [],
  "stockMedia": [
    {
      "query": "specific descriptive search keywords",
      "type": "image" | "video",
      "role": "background" | "cutaway" | "overlay" | "accent",
      "position": { "x": 50, "y": 50 },
      "scale": 1.0,
      "startPercent": 0.0,
      "endPercent": 0.3,
      "enterTransition": "fade",
      "exitTransition": "fade",
      "transitionDuration": 0.5,
      "orientation": "horizontal" | "vertical"
    }
  ],
  // stockMedia.role: determines default z-index, scale, and transitions. REQUIRED.
  // stockMedia.position: center point as % of canvas (50,50 = centered). Ignored for background/cutaway (auto-centered).
  // stockMedia.scale: relative to canvas. Omit to use role default (background=1.05, overlay=0.4, accent=0.25).
  // stockMedia.enterTransition/exitTransition: optional. Defaults from role (background=fade, overlay=zoom-in, accent=slide-up).
  // For video type: plan realistic durations. If video is shorter than planned range, it auto-trims.
  "soundEffects": [
    {
      "prompt": "descriptive text for sound effect generation (e.g. 'dramatic orchestral hit', 'coin clinking on glass')",
      "source": "generate",
      "startPercent": 0.15,
      "durationSeconds": 2,
      "volume": 0.7
    }
  ],
  // soundEffects.source: "generate" (AI via ElevenLabs, default) or "search" (Freesound library).
  // soundEffects.startPercent: 0-1 fraction of total clip when SFX plays.
  // soundEffects.durationSeconds: optional, defaults to auto. Keep 0.5-3s for most effects.
  // soundEffects.volume: 0-1, default 0.7. Use lower for subtle, higher for dramatic.
  "captions": {
    "style": "word-by-word" | "sentence" | "karaoke",
    "position": "top" | "center" | "bottom",
    "fontSize": 48,
    "color": "#ffffff"
  }
}`
}

/**
 * Call Gemini to generate a ClipPlan from the user prompt.
 */
export async function generateClipPlan(
  userPrompt: string,
  context: {
    savedCharacterNames: string[]
    selectedCharacterNames?: string[]
    saved3DCharacterNames?: string[]
    selected3DCharacterNames?: string[]
    voiceNames: string[]
    settings?: OrchestratorSettings
  },
): Promise<{ plan: ClipPlan; tokenUsage: TokenUsage | null }> {
  return withCreditGate('orchestrator-plan', async () => _generateClipPlanImpl(userPrompt, context))
}

async function _generateClipPlanImpl(
  userPrompt: string,
  context: {
    savedCharacterNames: string[]
    selectedCharacterNames?: string[]
    saved3DCharacterNames?: string[]
    selected3DCharacterNames?: string[]
    voiceNames: string[]
    settings?: OrchestratorSettings
  },
): Promise<{ plan: ClipPlan; tokenUsage: TokenUsage | null }> {
  const animationList = sampleAnimations.map((a) => ({
    name: a.name,
    category: a.category,
    tags: a.tags,
  }))

  const htmlTemplateList = BUILTIN_TEMPLATES.map((t) => ({
    id: t.id,
    title: t.title,
    tags: t.tags,
    category: t.category,
  }))

  // Build user-selected item constraints from settings
  const settings = context.settings
  const selectedItems = {
    animationNames: settings?.selectedAnimationIds?.length
      ? sampleAnimations.filter((a) => settings.selectedAnimationIds.includes(a.id)).map((a) => a.name)
      : [],
    templateIds: settings?.selectedHTMLTemplateIds || [],
    audioIds: settings?.selectedAudioIds || [],
    captionIds: settings?.selectedCaptionIds || [],
    collageIds: settings?.selectedCollageIds || [],
    aiAnimationIds: settings?.selectedAIAnimationIds || [],
  }

  // Start with cached summaries, then fill gaps via static parser for un-analyzed templates.
  // This ensures ALL templates have their CONFIG fields listed in the Gemini prompt
  // so the AI can generate correct config overrides (not empty `{}`).
  const fieldSummaries = getAllCachedSummaries()
  for (const t of BUILTIN_TEMPLATES) {
    if (!fieldSummaries[t.id]) {
      const html = getTemplateContent(t.filename)
      if (html) {
        const analysis = staticParserFallback(t.id, html)
        if (analysis.compactSummary) {
          fieldSummaries[t.id] = analysis.compactSummary
        }
      }
    }
  }

  // Build motion graphics (B-roll text animation) list with star ratings.
  // Selection strategy: relevance to topic (via tags) + quality rating (via stars).
  let motionGraphicsSection = ''
  try {
    const { getAllMotionGraphics } = await import('@/motionGraphics')
    const allMG = getAllMotionGraphics()

    // Load ratings and convert to star system (1-5)
    type RatingEntry = {
      verdict: string
      scores?: { impact: number; finish: number; flow: number; versatility: number; appeal: number } | null
    }
    const ratingsMap = new Map<string, number>() // id → stars (1-5)
    try {
      const ratingsResp = await fetch('/api/template-ratings')
      if (ratingsResp.ok) {
        const ratings = (await ratingsResp.json()) as Record<string, RatingEntry>
        for (const [id, entry] of Object.entries(ratings)) {
          if (entry.scores) {
            // Has 5-metric scores (1-4 scale) → average and map to 1-5 stars
            const avg =
              (entry.scores.impact +
                entry.scores.finish +
                entry.scores.flow +
                entry.scores.versatility +
                entry.scores.appeal) /
              5
            ratingsMap.set(id, Math.round((avg / 4) * 5 * 10) / 10) // e.g. 3.2
          } else if (entry.verdict === 'liked') {
            ratingsMap.set(id, 4)
          } else {
            ratingsMap.set(id, 2)
          }
        }
      }
    } catch {
      /* ratings unavailable */
    }

    // Score and sort: star rating (higher = better), minimum 2.5 stars to include
    const scored = allMG
      .map((mg) => ({
        mg,
        stars: ratingsMap.get(mg.id) ?? 3, // unrated = 3 stars (neutral)
      }))
      .filter((s) => s.stars >= 2.5)
      .sort((a, b) => b.stars - a.stars)

    // Cap at top 100 to keep prompt reasonable
    const topMG = scored.slice(0, 100)

    if (topMG.length > 0) {
      const mgEntries = topMG
        .map((s) => `${s.mg.id} (${s.stars}★): ${s.mg.title} [${s.mg.tags.slice(0, 3).join(', ')}]`)
        .join('\n  ')

      motionGraphicsSection = `

KINETIC TYPOGRAPHY / B-ROLL TEXT ANIMATIONS (${topMG.length} templates, sorted by quality rating):
React-rendered motion graphics for animated text. Use for dynamic word/phrase reveals, topic titles, and text-based B-roll.
Include in "motionGraphics" array: { "templateId": "tpl-kinetic-xxx", "role": "b-roll-text", "startPercent": 0.1, "endPercent": 0.3, "content": "KEY PHRASE" }

HOW TO CHOOSE: Pick by RELEVANCE to topic first, then prefer HIGHER RATED (★) templates.
  - Match tags to the clip's mood/style (e.g. tech topic → "glitch", "matrix", "sci-fi"; fun → "comic", "bounce", "pop")
  - Higher ★ = better visual quality. Prefer 4-5★ over 3★.
  - Use 1-3 per clip for key emphasis moments, NOT for all text.

Available (sorted by rating):
  ${mgEntries}
`
    }
  } catch (err) {
    console.warn('[Orchestrator] Failed to load motion graphics list:', err)
  }

  const prompt =
    buildPlanPrompt(
      userPrompt,
      context.savedCharacterNames,
      context.selectedCharacterNames || [],
      context.voiceNames,
      animationList,
      htmlTemplateList,
      context.settings,
      selectedItems,
      context.saved3DCharacterNames || [],
      context.selected3DCharacterNames || [],
      fieldSummaries,
    ) + motionGraphicsSection

  // Build request body — optionally include Google Search grounding tool
  const requestBody: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  }

  if (context.settings?.useGoogleSearch) {
    requestBody.tools = [{ google_search: {} }]
    console.log('[Orchestrator:plan] Google Search grounding enabled')
  }

  const response = await callGeminiProxy(PROXY_MODEL, requestBody)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extract token usage from Gemini response
  const usageMeta = data.usageMetadata
  const tokenUsage: TokenUsage | null = usageMeta
    ? {
        promptTokenCount: usageMeta.promptTokenCount ?? 0,
        candidatesTokenCount: usageMeta.candidatesTokenCount ?? 0,
        totalTokenCount: usageMeta.totalTokenCount ?? 0,
      }
    : null

  if (tokenUsage) {
    console.log('[Orchestrator:plan] Token usage:', tokenUsage)
  }

  // Parse JSON — strip markdown code fences if present
  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const plan: ClipPlan = JSON.parse(cleaned)

  console.log('[Orchestrator:plan] Raw plan from Gemini:', JSON.stringify(plan, null, 2))

  // Basic validation
  if (!plan.canvas || !plan.dialogue || !Array.isArray(plan.dialogue)) {
    throw new Error('Invalid plan structure from Gemini')
  }

  // Apply defaults — enforce settings values if provided, otherwise use Gemini's choices or fallbacks
  const settingsFps = context.settings?.fps && context.settings.fps > 0 ? context.settings.fps : 0
  const settingsDuration =
    context.settings?.durationSeconds && context.settings.durationSeconds > 0 ? context.settings.durationSeconds : 0
  if (settingsFps > 0) {
    plan.canvas.fps = settingsFps
  } else if (!plan.canvas.fps || plan.canvas.fps <= 0) {
    const timelineFps = useTimelineStore.getState().fps
    plan.canvas.fps = timelineFps || 30
  }
  plan.canvas.durationSeconds = settingsDuration || plan.canvas.durationSeconds || 15
  plan.canvas.aspectRatio = context.settings?.aspectRatio || plan.canvas.aspectRatio || '16:9'
  plan.characters = plan.characters || []
  plan.textOverlays = plan.textOverlays || []
  plan.shapes = plan.shapes || []
  plan.htmlTemplates = plan.htmlTemplates || []
  plan.svgObjects = plan.svgObjects || []
  plan.stockMedia = (plan.stockMedia || []).map((sm) => ({
    ...sm,
    // Backward compat: default role to 'overlay' if missing
    role: sm.role || ('overlay' as StockMediaRole),
  }))
  plan.captions = plan.captions || { style: 'word-by-word', position: 'bottom' }

  // ── Post-generation enrichment ──
  // Auto-correct common gaps Gemini misses. Runs deterministically after every plan.
  const WORDS_PER_SECOND = 5

  // 0. Background: always use a real image from Pixabay unless an HTML template
  // specifically covers the full clip (world map, chart, etc.)
  const hasFullCoverageHTMLTemplate = (plan.htmlTemplates || []).some(
    (t) => (t.startPercent ?? 0) <= 0.05 && (t.endPercent ?? 1) >= 0.95,
  )
  if (plan.background.type !== 'image' && !hasFullCoverageHTMLTemplate) {
    const topicHint =
      plan.dialogue.length > 0
        ? plan.dialogue[0].script
            .replace(/\[[\w-]+\]/g, '')
            .trim()
            .split(/\s+/)
            .slice(0, 6)
            .join(' ')
        : ''
    const imageQuery = topicHint ? `dark cinematic ${topicHint} background` : 'dark abstract technology background'
    console.log(`[Orchestrator:enrich] Background corrected: ${plan.background.type} → image ("${imageQuery}")`)
    plan.background = { type: 'image', imageQuery }
  }

  // 1. Camera direction for dialogue-heavy clips
  if (
    !plan.camera?.presetId &&
    !(plan.camera?.keyframes && plan.camera.keyframes.length > 0) &&
    !(plan.cameraDirectives && plan.cameraDirectives.length > 0) &&
    plan.dialogue.length >= 3
  ) {
    plan.camera = { presetId: 'subtle-drift' }
    console.log('[Orchestrator:enrich] Added camera preset: subtle-drift')
  }

  // 2. Title overlay clamping (3-5s max)
  const duration = plan.canvas.durationSeconds || 30
  for (const overlay of plan.textOverlays) {
    if (overlay.preset === 'title') {
      const maxEndPercent = Math.min(0.2, 5 / duration)
      if (overlay.endPercent > maxEndPercent) {
        overlay.endPercent = maxEndPercent
      }
    }
  }

  // 3. Retention hooks for clips with 5+ dialogue lines
  if (plan.dialogue.length >= 5 && (!plan.retentionHooks || plan.retentionHooks.length === 0)) {
    plan.retentionHooks = [
      {
        type: 'progress-bar' as const,
        style: 'minimal' as const,
        position: 'top' as const,
        color: '#6366f1',
      },
    ]
    console.log('[Orchestrator:enrich] Added progress-bar retention hook')
  }

  // 4. Dialogue duration warning
  const totalWords = plan.dialogue.reduce((sum, line) => {
    const clean = line.script.replace(/\[[\w-]+\]/g, '').trim()
    return sum + clean.split(/\s+/).length
  }, 0)
  const estimatedDialogueSeconds = totalWords / WORDS_PER_SECOND
  if (estimatedDialogueSeconds / duration < 0.6 && duration >= 20) {
    console.warn(
      `[Orchestrator:enrich] Dialogue thin: ~${Math.round(estimatedDialogueSeconds)}s of speech for ${duration}s clip`,
    )
  }

  // 5. Karaoke captions for vertical short-form
  if (plan.canvas.aspectRatio === '9:16' && plan.captions.style === 'word-by-word') {
    plan.captions.style = 'karaoke'
  }

  console.log(
    '[Orchestrator:plan] htmlTemplates count:',
    plan.htmlTemplates.length,
    plan.htmlTemplates.length > 0 ? plan.htmlTemplates.map((t) => t.templateId) : '(none)',
  )
  console.log('[Orchestrator:plan] Final background:', JSON.stringify(plan.background))

  return { plan, tokenUsage }
}

// Re-export from the modular step builder (single source of truth).
// NOTE: The original copy of this function lived here but diverged from
// orchestrator/stepBuilder.ts (which adds Image Story steps).  To avoid
// duplicates, we now delegate to the canonical version.
export { buildStepsFromPlan } from './orchestrator/stepBuilder'

// ── Plan Execution ──

export type StepRunner = (plan: ClipPlan, context: ExecutionContext) => Promise<void>

export interface ExecutionContext {
  /** Map characterName → dialogue character ID in store */
  characterIdMap: Map<string, string>
  /** Map characterName → matched saved character ID */
  savedCharacterIdMap: Map<string, string>
  /** Map characterName → voice ID (ElevenLabs) */
  voiceIdMap: Map<string, string>
  /** Generated voice data per dialogue line index */
  generatedVoices: GeneratedVoice[]
  /** Total frames for the clip */
  totalFrames: number
  /** FPS */
  fps: number
  /** Callback to report cost entries from execution steps */
  addCostEntry?: (entry: CostEntry) => void
  /** Marketplace listing IDs used during execution (for royalty distribution) */
  usedMarketplaceListingIds: string[]
  /** Orchestrator settings (for brand context, etc.) */
  settings?: OrchestratorSettings
  /** Map characterName -> available rig animations (name, index, duration) */
  rigAnimationMap: Map<string, { name: string; index: number; duration: number }[]>
}

/**
 * Create a fresh execution context.
 */
export function createExecutionContext(plan: ClipPlan): ExecutionContext {
  return {
    characterIdMap: new Map(),
    savedCharacterIdMap: new Map(),
    voiceIdMap: new Map(),
    generatedVoices: [],
    totalFrames: plan.canvas.fps * plan.canvas.durationSeconds,
    fps: plan.canvas.fps,
    usedMarketplaceListingIds: [],
    rigAnimationMap: new Map(),
  }
}

// ── Individual Step Executors ──
// Each function receives the plan and context. Stores are imported at top
// level (static imports). The store's getState() is used to call actions
// synchronously from outside React.

export async function executeSetupCanvas(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']
  useCanvasStore.getState().setCanvasDimensions(dims.w, dims.h)
  // Sync editor aspect ratio selector so UI stays consistent
  useEditorStore.getState().setAspectRatio(plan.canvas.aspectRatio)
  useTimelineStore.getState().setFps(plan.canvas.fps)

  ctx.totalFrames = plan.canvas.fps * plan.canvas.durationSeconds
  ctx.fps = plan.canvas.fps

  useTimelineStore.getState().setTotalFrames(ctx.totalFrames)
}

export async function executeSetupBackground(plan: ClipPlan, _ctx: ExecutionContext): Promise<void> {
  if (plan.background.type === 'lottie') {
    const store = useAnimationStore.getState()

    // Ensure library is loaded
    if (store.library.length === 0) {
      store.initLibrary(sampleAnimations)
    }

    // Prioritize user-selected animations from orchestrator settings
    const settings = useOrchestratorStore.getState().settings
    if (settings?.selectedAnimationIds?.length) {
      const selected = sampleAnimations.find(
        (a) => settings.selectedAnimationIds.includes(a.id) && a.category === 'background',
      )
      if (selected) {
        store.addToCanvas(selected.id)
        return
      }
    }

    // Find best match by query — 3-tier strategy
    const query = (plan.background.lottieQuery || '').toLowerCase()

    // 1. Exact name match (case-insensitive)
    let match = sampleAnimations.find((a) => a.category === 'background' && a.name.toLowerCase() === query)

    // 2. Substring match on name/tags
    if (!match) {
      match = sampleAnimations.find(
        (a) =>
          a.category === 'background' &&
          (a.name.toLowerCase().includes(query) || a.tags.some((t) => t.toLowerCase().includes(query))),
      )
    }

    if (match) {
      store.addToCanvas(match.id)
    } else if (sampleAnimations.some((a) => a.category === 'background')) {
      // 3. Fallback: add first background animation
      const fallback = sampleAnimations.find((a) => a.category === 'background')!
      store.addToCanvas(fallback.id)
    }
  } else if (plan.background.type === 'svg-generate' && plan.background.svgPrompt) {
    // Skip SVG background if HTML templates cover the full clip — the SVG layer
    // renders on top and blocks the templates.
    const hasFullCoverageTemplate = (plan.htmlTemplates || []).some(
      (t) => (t.startPercent ?? 0) <= 0.01 && (t.endPercent ?? 1) >= 0.95,
    )
    if (hasFullCoverageTemplate) {
      console.log('[Orchestrator:background] Skipping SVG background — HTML template covers full clip')
      // Fall back to a subtle lottie instead
      const store = useAnimationStore.getState()
      if (store.library.length === 0) store.initLibrary(sampleAnimations)
      const fallback = sampleAnimations.find((a) => a.category === 'background')
      if (fallback) store.addToCanvas(fallback.id)
      return
    }

    const { totalFrames } = useTimelineStore.getState()
    const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

    let response: Awaited<ReturnType<typeof generateSVGObjects>>
    try {
      response = await generateSVGObjects({
        prompt: plan.background.svgPrompt,
        width: dims.w,
        height: dims.h,
      })
    } catch (err) {
      // SVG generation requires the backend server — fall back to Lottie if server is down
      console.warn('[Orchestrator] SVG generation failed, falling back to Lottie background:', err)
      const store = useAnimationStore.getState()
      if (store.library.length === 0) store.initLibrary(sampleAnimations)
      const fallback = sampleAnimations.find((a) => a.category === 'background')
      if (fallback) store.addToCanvas(fallback.id)
      return
    }

    const composition = {
      id: `svg-comp-${Date.now()}`,
      prompt: plan.background.svgPrompt,
      background: response.background,
      width: response.width,
      height: response.height,
      objects: (response.objects || []).map((obj, i) => ({
        id: `svg-obj-${Date.now()}-${i}`,
        name: obj.name,
        zIndex: obj.zIndex,
        visible: true,
        colors: { ...obj.defaultColors },
        defaultColors: obj.defaultColors,
        svgMarkup: obj.svgMarkup,
        keyframes: obj.keyframes || [{ time: 0 }],
        startFrame: 0,
        endFrame: totalFrames,
        opacity: 1,
      })),
    }

    useSVGObjectStore.getState().setComposition(composition)

    // Track SVG background generation cost (Gemini 2.5 Pro)
    if (_ctx.addCostEntry) {
      const inputCost = response.tokenUsage
        ? (response.tokenUsage.promptTokenCount / 1_000_000) * GEMINI_PRO_INPUT_PRICE
        : 0
      const outputCost = response.tokenUsage
        ? (response.tokenUsage.candidatesTokenCount / 1_000_000) * GEMINI_PRO_OUTPUT_PRICE
        : 0
      _ctx.addCostEntry({
        source: 'gemini',
        label: 'SVG Background',
        cost: inputCost + outputCost,
        credits: CREDIT_COSTS['svg-object'],
        tokenUsage: response.tokenUsage,
      })
    }
  }
}

export async function executeSetupCharacters(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  const savedChars = useSavedCharactersStore.getState().characters
  const saved3DChars = useSaved3DCharactersStore.getState().characters
  const multiStore = useMultiCharacterStore.getState()
  const char3DStore = use3DCharacterStore.getState()

  // Canvas dimensions for converting Gemini's percentage positions (0-100) to absolute pixels
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  for (const planChar of plan.characters) {
    const is3D = planChar.dimension === '3d'

    if (is3D) {
      // ── 3D Character Setup ──
      let saved3DCharId: string | null = null
      if (planChar.savedCharacterName) {
        const match = saved3DChars.find((sc) => sc.name.toLowerCase() === planChar.savedCharacterName!.toLowerCase())
        if (match) {
          saved3DCharId = match.id
          ctx.savedCharacterIdMap.set(planChar.name, match.id)
        }
      }

      // Fuzzy match if exact match failed
      if (!saved3DCharId) {
        const fuzzyMatch = saved3DChars.find(
          (sc) =>
            sc.name.toLowerCase().includes(planChar.name.toLowerCase()) ||
            planChar.name.toLowerCase().includes(sc.name.toLowerCase()),
        )
        if (fuzzyMatch) {
          saved3DCharId = fuzzyMatch.id
          ctx.savedCharacterIdMap.set(planChar.name, fuzzyMatch.id)
        }
      }

      const pixelX = Math.round((planChar.position.x / 100) * dims.w)
      const pixelY = Math.round((planChar.position.y / 100) * dims.h)

      const charId = char3DStore.add3DCharacter({
        name: planChar.name,
        saved3DCharacterId: saved3DCharId,
        position: { x: pixelX, y: pixelY, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: planChar.scale || 1,
        zIndex: 7,
        visible: true,
        locked: false,
        activeAnimationId: null,
        animationSpeed: 1,
        voiceId: null,
        color: '',
      })

      ctx.characterIdMap.set(planChar.name, charId)
    } else {
      // ── 2D Character Setup (existing behavior) ──
      let savedCharId: string | null = null
      if (planChar.savedCharacterName) {
        const match = savedChars.find((sc) => sc.name.toLowerCase() === planChar.savedCharacterName!.toLowerCase())
        if (match) {
          savedCharId = match.id
          ctx.savedCharacterIdMap.set(planChar.name, match.id)
        }
      }

      // Fuzzy match if exact match failed
      if (!savedCharId) {
        const fuzzyMatch = savedChars.find(
          (sc) =>
            sc.name.toLowerCase().includes(planChar.name.toLowerCase()) ||
            planChar.name.toLowerCase().includes(sc.name.toLowerCase()),
        )
        if (fuzzyMatch) {
          savedCharId = fuzzyMatch.id
          ctx.savedCharacterIdMap.set(planChar.name, fuzzyMatch.id)
        }
      }

      const pixelX = Math.round((planChar.position.x / 100) * dims.w)
      const pixelY = Math.round((planChar.position.y / 100) * dims.h)

      const charId = multiStore.addDialogueCharacter({
        name: planChar.name,
        savedCharacterId: savedCharId,
        position: { x: pixelX, y: pixelY },
        scale: planChar.scale || 1,
        zIndex: 7,
        visible: true,
        locked: false,
        voiceId: null,
        color: '',
      })

      ctx.characterIdMap.set(planChar.name, charId)
    }
  }

  // Match voices to characters (works for both 2D and 3D)
  await matchVoicesToCharacters(plan.characters, ctx)
}

async function matchVoicesToCharacters(characters: ClipPlanCharacter[], ctx: ExecutionContext): Promise<void> {
  const voiceState = useVoiceStore.getState()

  // Ensure voices are loaded — non-fatal if ElevenLabs isn't configured
  if (voiceState.availableVoices.length === 0) {
    try {
      await voiceState.fetchVoices()
    } catch {
      // ElevenLabs API key may not be configured — voice matching will be skipped
      console.warn('[Orchestrator] Could not fetch voices — ElevenLabs may not be configured')
    }
  }

  const voices = useVoiceStore.getState().availableVoices
  if (voices.length === 0) {
    // No voices available — skip matching entirely, voice generation step will handle this
    console.warn('[Orchestrator] No voices available — skipping voice-to-character matching')
    return
  }

  for (const planChar of characters) {
    const charId = ctx.characterIdMap.get(planChar.name)
    if (!charId) continue

    let matchedVoiceId: string | null = null

    // Try to match by preferred voice name
    if (planChar.voiceName) {
      const voiceMatch = voices.find((v) => v.name.toLowerCase().includes(planChar.voiceName!.toLowerCase()))
      if (voiceMatch) {
        matchedVoiceId = voiceMatch.voice_id
      }
    }

    // Fallback: auto-assign from available voices
    if (!matchedVoiceId && voices.length > 0) {
      // Assign different voices to different characters
      const charIndex = [...ctx.characterIdMap.keys()].indexOf(planChar.name)
      matchedVoiceId = voices[charIndex % voices.length].voice_id
    }

    if (matchedVoiceId) {
      ctx.voiceIdMap.set(planChar.name, matchedVoiceId)
      if (planChar.dimension === '3d') {
        use3DCharacterStore.getState().update3DCharacter(charId, {
          voiceId: matchedVoiceId,
        })
      } else {
        useMultiCharacterStore.getState().updateDialogueCharacter(charId, {
          voiceId: matchedVoiceId,
        })
      }
    }
  }
}

export async function executeGenerateVoices(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  console.log('[Orchestrator:voices] Starting voice generation for', plan.dialogue.length, 'lines')

  // ── Check if ElevenLabs is available ──
  if (!hasElevenLabsService()) {
    console.warn('[Orchestrator:voices] ElevenLabs not configured — skipping. Dialogue will be text-only.')
    return
  }

  let service: ReturnType<typeof getElevenLabsService>
  try {
    service = getElevenLabsService()
  } catch {
    console.warn('[Orchestrator:voices] ElevenLabs service unavailable — skipping.')
    return
  }

  // Ensure voice list is available for voice name lookups
  let voices = useVoiceStore.getState().availableVoices
  if (voices.length === 0) {
    try {
      await useVoiceStore.getState().fetchVoices()
      voices = useVoiceStore.getState().availableVoices
    } catch {
      console.warn('[Orchestrator:voices] Could not fetch voices — will use voice IDs from context')
    }
  }

  if (voices.length === 0 && ctx.voiceIdMap.size === 0) {
    console.warn('[Orchestrator:voices] No voices available — skipping. Dialogue will be text-only.')
    return
  }

  console.log('[Orchestrator:voices] Found', voices.length, 'voices. Generating directly (bypassing store)...')

  // ── Generate each line directly via ElevenLabs service (no store updates during generation) ──
  const lipSyncProcessor = new LipSyncProcessor(ctx.fps)
  const captionProcessor = new CaptionProcessor(ctx.fps)
  const collectedVoices: (GeneratedVoice | null)[] = []
  let successCount = 0

  for (let i = 0; i < plan.dialogue.length; i++) {
    const line = plan.dialogue[i]
    const cleanScript = line.script
      .replace(/\[[\w-]+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanScript) {
      console.warn(`[Orchestrator:voices] Line ${i + 1} — empty script after cleaning, skipping`)
      collectedVoices.push(null)
      continue
    }

    // Resolve voice ID for this line
    let voiceId = ctx.voiceIdMap.get(line.characterName)
    if (!voiceId && voices.length > 0) {
      // Fallback: round-robin assignment
      const charIndex = [...ctx.characterIdMap.keys()].indexOf(line.characterName)
      voiceId = voices[Math.max(0, charIndex) % voices.length].voice_id
    }
    if (!voiceId) {
      console.warn(`[Orchestrator:voices] Line ${i + 1} — no voice ID available, skipping`)
      collectedVoices.push(null)
      continue
    }

    const voiceName = voices.find((v) => v.voice_id === voiceId)?.name || 'Unknown'

    console.log(
      `[Orchestrator:voices] Line ${i + 1}/${plan.dialogue.length}: "${cleanScript.slice(0, 40)}..." (voice: ${voiceName})`,
    )

    try {
      // Call ElevenLabs directly — no store involvement, no re-renders
      const VOICE_TIMEOUT_MS = 30_000
      const apiResult = await Promise.race([
        service.generateWithAlignment(cleanScript, voiceId),
        new Promise<null>((resolve) =>
          setTimeout(() => {
            console.warn(`[Orchestrator:voices] Line ${i + 1} — timed out after ${VOICE_TIMEOUT_MS / 1000}s`)
            resolve(null)
          }, VOICE_TIMEOUT_MS),
        ),
      ])

      if (!apiResult) {
        console.warn(`[Orchestrator:voices] Line ${i + 1} — timed out or returned null`)
        collectedVoices.push(null)
        continue
      }

      // Process alignment data locally (no store)
      const visemeTimeline = lipSyncProcessor.processAlignment(apiResult.alignment)
      const wordTimeline = captionProcessor.extractWords(cleanScript, apiResult.alignment)

      const generatedVoice: GeneratedVoice = {
        id: `voice_${Date.now()}_${i}`,
        script: line.script,
        voiceId: voiceId,
        voiceName,
        audioUrl: apiResult.audioUrl,
        audioDuration: apiResult.duration,
        alignment: apiResult.alignment,
        visemeTimeline,
        wordTimeline,
        createdAt: Date.now(),
      }

      collectedVoices.push(generatedVoice)
      successCount++

      // Track ElevenLabs cost for this voice line
      if (ctx.addCostEntry) {
        const charCount = cleanScript.length
        ctx.addCostEntry({
          source: 'elevenlabs',
          label: `Voice: ${line.characterName} (#${i + 1})`,
          cost: charCount * ELEVENLABS_COST_PER_CHAR,
          credits: CREDIT_COSTS['elevenlabs-tts'],
          characters: charCount,
        })
      }

      console.log(
        `[Orchestrator:voices] Line ${i + 1} — OK (${apiResult.duration.toFixed(1)}s, ${visemeTimeline.length} visemes, ${wordTimeline.length} words)`,
      )
    } catch (err) {
      console.warn(`[Orchestrator:voices] Line ${i + 1} — error:`, err)
      collectedVoices.push(null)
    }

    // Yield to browser between API calls
    await new Promise((r) => setTimeout(r, 50))
  }

  // ── Batch-push all generated voices to context ──
  for (const voice of collectedVoices) {
    ctx.generatedVoices.push(voice as GeneratedVoice)
  }

  // ── Single batch update to the voice store (ONE set() call = ONE re-render) ──
  if (successCount > 0) {
    const validVoices = collectedVoices.filter((v): v is GeneratedVoice => v !== null)
    const lastVoice = validVoices[validVoices.length - 1]

    try {
      // Build emotion timeline for the last voice (for active display)
      const emotionTimeline = buildEmotionTimeline(lastVoice.script, lastVoice.wordTimeline)
      const sentenceTimeline = captionProcessor.groupIntoSentences(
        lastVoice.script
          .replace(/\[[\w-]+\]/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
        lastVoice.wordTimeline,
      )

      // Use plain object merge — safe regardless of immer middleware
      const existingVoices = useVoiceStore.getState().generatedVoices
      useVoiceStore.setState({
        generatedVoices: [...existingVoices, ...validVoices],
        activeVoiceId: lastVoice.id,
        activeVisemeTimeline: lastVoice.visemeTimeline,
        activeWordTimeline: lastVoice.wordTimeline,
        activeSentenceTimeline: sentenceTimeline,
        activeEmotionTimeline: emotionTimeline,
        isLoading: false,
        error: null,
      })
      console.log(`[Orchestrator:voices] Batch-pushed ${validVoices.length} voices to store`)
    } catch (err) {
      console.warn('[Orchestrator:voices] Failed to batch-push to store:', err)
    }
  }

  if (successCount === 0) {
    console.warn('[Orchestrator:voices] No voices generated — dialogue will be text-only')
  } else {
    console.log(`[Orchestrator:voices] Done: ${successCount}/${plan.dialogue.length} voices generated`)
  }
}

export async function executeSetupDialogue(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  console.log('[Orchestrator:dialogue] Setting up', plan.dialogue.length, 'dialogue lines')

  const multiStore = useMultiCharacterStore.getState()

  // Small gap between lines (in frames)
  const GAP_FRAMES = Math.round(ctx.fps * 0.3) // 300ms gap

  // Estimated speaking rate: ~5 words per second (used when no voice data)
  const WORDS_PER_SECOND = 5

  let currentFrame = 0

  for (let i = 0; i < plan.dialogue.length; i++) {
    const line = plan.dialogue[i]
    const voice = ctx.generatedVoices[i]

    const charId = ctx.characterIdMap.get(line.characterName)
    if (!charId) {
      console.warn(`[Orchestrator:dialogue] Line ${i + 1}: no character ID for "${line.characterName}" — skipping`)
      continue
    }

    let durationFrames: number
    let voiceId: string | null = null
    let visemeTimeline: VisemeEvent[] = []
    let wordTimeline: WordEvent[] = []

    if (voice) {
      // Use actual voice data
      durationFrames = Math.round(voice.audioDuration * ctx.fps)
      voiceId = voice.id
      visemeTimeline = voice.visemeTimeline as VisemeEvent[]
      wordTimeline = voice.wordTimeline as WordEvent[]
    } else {
      // Estimate duration from word count (~5 words/sec)
      const cleanScript = line.script.replace(/\[[\w-]+\]/g, '').trim()
      const wordCount = cleanScript.split(/\s+/).length
      const estimatedSeconds = Math.max(1, wordCount / WORDS_PER_SECOND)
      durationFrames = Math.round(estimatedSeconds * ctx.fps)
    }

    const endFrame = currentFrame + durationFrames

    console.log(
      `[Orchestrator:dialogue] Line ${i + 1}: ${line.characterName}, frames ${currentFrame}-${endFrame}, voice=${!!voice}`,
    )

    try {
      multiStore.addDialogueLine({
        characterId: charId,
        script: line.script,
        generatedVoiceId: voiceId,
        startFrame: currentFrame,
        endFrame,
        order: i,
        visemeTimeline,
        wordTimeline,
        emotion: (line.emotion as DialogueEmotion) || 'Auto',
      })
    } catch (err) {
      console.error(`[Orchestrator:dialogue] addDialogueLine threw for line ${i + 1}:`, err)
    }

    currentFrame = endFrame + GAP_FRAMES

    // Yield to browser between dialogue lines to prevent UI freeze
    await new Promise((r) => setTimeout(r, 10))
  }

  // Update totalFrames to match actual dialogue duration
  ctx.totalFrames = Math.max(ctx.totalFrames, currentFrame)

  // Immediately push to timeline store so subsequent steps and playback use the correct duration
  useTimelineStore.getState().setTotalFrames(ctx.totalFrames)

  // ── Build combined timelines with global frame offsets for voice store ──
  // The voice store's activeVisemeTimeline/activeWordTimeline need to use global
  // frame positions so that CharacterComposite (single-char) and CaptionOverlay
  // can look up data at the global currentFrame.
  const allDialogueLines = useMultiCharacterStore.getState().dialogueLines
  if (allDialogueLines.length > 0) {
    const combinedVisemes: VisemeEvent[] = []
    const combinedWords: WordEvent[] = []

    for (const dl of allDialogueLines) {
      const offset = dl.startFrame
      const timeOffset = offset / ctx.fps

      // Offset each viseme event to global timeline position
      for (const v of dl.visemeTimeline) {
        combinedVisemes.push({
          viseme: v.viseme,
          startFrame: v.startFrame + offset,
          endFrame: v.endFrame + offset,
          startTime: v.startTime + timeOffset,
          endTime: v.endTime + timeOffset,
        })
      }

      // Offset each word event to global timeline position
      for (const w of dl.wordTimeline) {
        combinedWords.push({
          word: w.word,
          startFrame: w.startFrame + offset,
          endFrame: w.endFrame + offset,
          startTime: w.startTime + timeOffset,
          endTime: w.endTime + timeOffset,
        })
      }
    }

    // Sort by startFrame for correct lookup order
    combinedVisemes.sort((a, b) => a.startFrame - b.startFrame)
    combinedWords.sort((a, b) => a.startFrame - b.startFrame)

    // Build combined sentence + emotion timelines from the offset word events
    const combinedCleanScript = allDialogueLines
      .map((dl) =>
        dl.script
          .replace(/\[[\w-]+\]/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .join('. ')
    const captionProcessor = new CaptionProcessor(ctx.fps)
    const combinedSentences = captionProcessor.groupIntoSentences(combinedCleanScript, combinedWords)

    // Build emotion timeline: concatenate from each line's script + offset word timelines
    const combinedRawScript = allDialogueLines.map((dl) => dl.script).join(' ')
    const combinedEmotionTimeline = buildEmotionTimeline(combinedRawScript, combinedWords)

    // Push combined timelines to voice store so CaptionOverlay and CharacterComposite work
    const existingActiveVoiceId = useVoiceStore.getState().activeVoiceId
    if (existingActiveVoiceId) {
      useVoiceStore.setState({
        activeVisemeTimeline: combinedVisemes,
        activeWordTimeline: combinedWords,
        activeSentenceTimeline: combinedSentences,
        activeEmotionTimeline: combinedEmotionTimeline,
      })
      console.log(
        `[Orchestrator:dialogue] Built combined timelines: ${combinedVisemes.length} visemes, ${combinedWords.length} words, ${combinedSentences.length} sentences`,
      )
    }
  }

  console.log(
    '[Orchestrator:dialogue] Done. ctx.totalFrames =',
    ctx.totalFrames,
    '| store.totalFrames =',
    useTimelineStore.getState().totalFrames,
  )
}

/**
 * Generate background music using ElevenLabs Music API.
 * If dialogue exists, builds a composition plan that matches mood/pacing.
 * Otherwise generates ambient cinematic background music.
 */
export async function executeGenerateMusic(_plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  console.log('[Orchestrator:music] Generating background music...')

  const dialogueLines = useMultiCharacterStore.getState().dialogueLines

  let audioBlob: Blob
  let musicName: string

  if (dialogueLines.length > 0) {
    // Build a mood-aware composition plan from dialogue
    console.log('[Orchestrator:music] Building composition plan from', dialogueLines.length, 'dialogue lines')
    const compositionPlan = buildMusicPlanFromDialogue(dialogueLines, ctx.fps)
    console.log('[Orchestrator:music] Composition plan:', JSON.stringify(compositionPlan))

    const result = await generateMusic({
      compositionPlan,
      forceInstrumental: true,
    })
    audioBlob = result.audioBlob
    musicName = `AI Background Music (${dialogueLines.length} lines)`
    console.log('[Orchestrator:music] Got audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type)
  } else {
    // No dialogue — use a text prompt based on the overall plan
    const durationMs = (ctx.totalFrames / ctx.fps) * 1000
    const clampedDuration = Math.round(Math.max(3000, Math.min(600_000, durationMs)))

    console.log(
      '[Orchestrator:music] No dialogue, generating ambient music for',
      Math.round(clampedDuration / 1000),
      's',
    )
    const result = await generateMusic({
      prompt: 'Cinematic instrumental background music, ambient, gentle, suitable for a short-form video. No vocals.',
      durationMs: clampedDuration,
      forceInstrumental: true,
    })
    audioBlob = result.audioBlob
    musicName = `AI Ambient Music (${Math.round(clampedDuration / 1000)}s)`
    console.log('[Orchestrator:music] Got audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type)
  }

  // Store in useMediaStore so AudioLayer plays it during timeline playback
  const mediaStore = useMediaStore.getState()
  const assetId = `media-music-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const blobUrl = URL.createObjectURL(audioBlob)

  // Get duration from the blob
  let duration = 0
  try {
    const audio = new Audio()
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000)
      audio.addEventListener(
        'loadedmetadata',
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
      audio.addEventListener(
        'canplaythrough',
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
      audio.addEventListener(
        'error',
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
      audio.src = blobUrl
      audio.load()
    })
    duration = audio.duration || 0
  } catch {
    // Duration will default to 0; AudioLayer still plays fine
  }

  const mediaAsset: MediaAsset = {
    id: assetId,
    name: musicName,
    type: audioBlob.type || 'audio/mpeg',
    size: audioBlob.size,
    category: 'audio',
    url: blobUrl,
    duration,
    addedAt: Date.now(),
  }

  // Persist to IndexedDB first (await it instead of fire-and-forget)
  const { saveMediaBlob } = await import('@/services/mediaDB')
  await saveMediaBlob(assetId, audioBlob)
  console.log('[Orchestrator:music] Blob saved to IndexedDB:', assetId)

  mediaStore.addAsset(mediaAsset, audioBlob)
  mediaStore.addToCanvas(assetId)

  // Verify it was actually added
  const verifyAssets = useMediaStore.getState().assets
  const verifyCanvas = useMediaStore.getState().canvasItems
  console.log(
    '[Orchestrator:music] Media store now has',
    verifyAssets.length,
    'assets,',
    verifyCanvas.length,
    'canvas items',
  )
  console.log('[Orchestrator:music] Background music added to canvas:', musicName, `(${Math.round(duration)}s)`)

  // Track cost (ElevenLabs music API pricing — estimate based on duration)
  ctx.addCostEntry?.({
    source: 'elevenlabs',
    label: 'Background Music Generation',
    cost: 0,
    credits: CREDIT_COSTS['elevenlabs-music'],
  })
}

export async function executeSetupTextOverlays(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  console.log('[Orchestrator:text] Adding', plan.textOverlays.length, 'text overlays')

  for (let i = 0; i < plan.textOverlays.length; i++) {
    const overlay = plan.textOverlays[i]
    try {
      const defaults = TEXT_PRESET_DEFAULTS[overlay.preset] || TEXT_PRESET_DEFAULTS.title
      const startFrame = Math.round((overlay.startPercent ?? 0) * ctx.totalFrames)
      const endFrame = Math.round((overlay.endPercent ?? 1) * ctx.totalFrames)

      // Validate presetType — Gemini may return an unexpected value
      const validPresets = ['title', 'subtitle', 'lower-third', 'cta', 'quote', 'watermark']
      const safePreset = validPresets.includes(overlay.preset) ? overlay.preset : 'title'

      const textOverlay: TextOverlay = {
        id: `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        presetType: safePreset as TextOverlay['presetType'],
        content: overlay.content || '',
        fontFamily: safeFontFamily(overlay.fontFamily, defaults.fontFamily as string),
        fontSize: defaults.fontSize || 36,
        fontWeight: (defaults.fontWeight || 'normal') as TextOverlay['fontWeight'],
        color: overlay.color || defaults.color || '#ffffff',
        align: (defaults.align || 'center') as TextOverlay['align'],
        verticalAlign: (defaults.verticalAlign || 'middle') as TextOverlay['verticalAlign'],
        position: (defaults.position || 'center') as TextOverlay['position'],
        freeX: 50,
        freeY: 50,
        lineHeight: 1.4,
        letterSpacing: 0,
        textCase: (defaults.textCase || 'none') as TextOverlay['textCase'],
        shadow: defaults.shadow ?? true,
        background: defaults.background ?? false,
        backgroundOpacity: defaults.backgroundOpacity ?? 0.7,
        visible: true,
        opacity: defaults.opacity ?? 1,
        zIndex: 8,
        rotation: 0,
        width: null,
        height: null,
        startFrame,
        endFrame,
      }

      useTextOverlayStore.getState().addOverlay(textOverlay)
      console.log(`[Orchestrator:text] Overlay ${i + 1}: [${safePreset}] "${overlay.content?.slice(0, 30)}"`)
    } catch (err) {
      console.error(`[Orchestrator:text] Failed to add overlay ${i + 1}:`, err)
    }
  }
}

export async function executeSetupShapes(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  console.log('[Orchestrator:shapes] Adding', plan.shapes.length, 'shapes')

  for (let i = 0; i < plan.shapes.length; i++) {
    const shape = plan.shapes[i]
    try {
      // Validate shape type
      const validTypes = ['rectangle', 'circle', 'triangle', 'star']
      if (!validTypes.includes(shape.type)) {
        console.warn(`[Orchestrator:shapes] Invalid shape type "${shape.type}" — skipping`)
        continue
      }

      // Snapshot shape count before adding
      const beforeCount = useShapeStore.getState().shapes.length

      // addShape auto-creates with defaults, then we update
      useShapeStore.getState().addShape(shape.type as 'rectangle' | 'circle' | 'triangle' | 'star')

      // Find the newly added shape by comparing before/after
      const afterShapes = useShapeStore.getState().shapes
      const added = afterShapes.length > beforeCount ? afterShapes[afterShapes.length - 1] : null
      if (!added) continue

      const startFrame = Math.round((shape.startPercent ?? 0) * ctx.totalFrames)
      const endFrame = Math.round((shape.endPercent ?? 1) * ctx.totalFrames)

      useShapeStore.getState().updateShape(added.id, {
        position: shape.position || { x: 100, y: 100 },
        width: shape.width || 200,
        height: shape.height || 200,
        fill: shape.fill || '#3b82f6',
        opacity: shape.opacity ?? 1,
        startFrame,
        endFrame,
      })

      console.log(`[Orchestrator:shapes] Shape ${i + 1}: ${shape.type}`)
    } catch (err) {
      console.error(`[Orchestrator:shapes] Failed to add shape ${i + 1}:`, err)
    }
  }
}

export async function executeSetupCaptions(plan: ClipPlan, _ctx: ExecutionContext): Promise<void> {
  console.log('[Orchestrator:captions] Setting up captions')

  try {
    const store = useVoiceStore.getState()
    const captions = plan.captions || { style: 'word-by-word', position: 'bottom' }

    // Validate caption style
    const validStyles = ['word-by-word', 'sentence', 'karaoke'] as const
    const style = validStyles.includes(captions.style as (typeof validStyles)[number]) ? captions.style : 'word-by-word'

    // Validate position
    const validPositions = ['top', 'center', 'bottom'] as const
    const position = validPositions.includes(captions.position as (typeof validPositions)[number])
      ? captions.position
      : 'bottom'

    store.setCaptionStyle(style)
    store.setCaptionPosition(position)
    if (captions.fontSize && typeof captions.fontSize === 'number') {
      store.setCaptionFontSize(captions.fontSize)
    }
    if (captions.color && typeof captions.color === 'string') {
      store.setCaptionColor(captions.color)
    }

    console.log(`[Orchestrator:captions] Style: ${style}, position: ${position}`)
  } catch (err) {
    console.error('[Orchestrator:captions] Failed:', err)
  }
}

export async function executeFinalizeTimeline(_plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  console.log('[Orchestrator:finalize] Setting totalFrames =', ctx.totalFrames)

  try {
    // Ensure totalFrames covers all content
    useTimelineStore.getState().setTotalFrames(ctx.totalFrames)
    useTimelineStore.getState().seekToFrame(0)
    console.log('[Orchestrator:finalize] totalFrames now =', useTimelineStore.getState().totalFrames)
  } catch (err) {
    console.error('[Orchestrator:finalize] Failed:', err)
  }
}

// ── HTML Template Executor ──

/**
 * Find a built-in template by ID, or fuzzy-match by query against title and tags.
 */
function findBuiltinTemplate(templateId?: string, query?: string): (typeof BUILTIN_TEMPLATES)[number] | null {
  // Exact ID match first
  if (templateId) {
    const exact = BUILTIN_TEMPLATES.find((t) => t.id === templateId)
    if (exact) return exact
  }

  // Fuzzy match by query against title and tags
  const searchTerm = query || templateId || ''
  if (!searchTerm) return null

  const lower = searchTerm.toLowerCase()
  const words = lower.split(/\s+/)

  // Score each template
  let bestMatch: (typeof BUILTIN_TEMPLATES)[number] | null = null
  let bestScore = 0

  for (const tpl of BUILTIN_TEMPLATES) {
    let score = 0
    const titleLower = tpl.title.toLowerCase()
    const tagsLower = tpl.tags.map((t) => t.toLowerCase())

    for (const word of words) {
      if (titleLower.includes(word)) score += 3
      if (tagsLower.some((tag) => tag.includes(word))) score += 2
      if (tpl.description.toLowerCase().includes(word)) score += 1
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = tpl
    }
  }

  return bestScore > 0 ? bestMatch : null
}

export async function executeSetupHTMLTemplates(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  if (!plan.htmlTemplates || plan.htmlTemplates.length === 0) return

  console.log('[Orchestrator:html-templates] Adding', plan.htmlTemplates.length, 'templates')

  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  for (let i = 0; i < plan.htmlTemplates.length; i++) {
    const tplSpec = plan.htmlTemplates[i]

    try {
      // Check if this template has a React motion graphic implementation
      const { resolveTemplateType } = await import('@/motionGraphics/resolver')
      if (tplSpec.templateId && resolveTemplateType(tplSpec.templateId) === 'react') {
        const { getMotionGraphic } = await import('@/motionGraphics/registry')
        const { useMotionGraphicStore } = await import('@/stores/useMotionGraphicStore')
        const reg = getMotionGraphic(tplSpec.templateId)
        if (reg) {
          const startFrame = Math.round((tplSpec.startPercent ?? 0) * ctx.totalFrames)
          const endFrame = Math.round((tplSpec.endPercent ?? 1) * ctx.totalFrames)
          const mergedConfig = { ...reg.defaultConfig, ...(tplSpec.config || {}) }
          useMotionGraphicStore.getState().addInstance({
            id: `orch-mg-${Date.now()}-${i}`,
            templateId: tplSpec.templateId,
            config: mergedConfig,
            position: tplSpec.position || { x: 0, y: 0 },
            scale: tplSpec.scale || 1,
            opacity: 1,
            zIndex: 1,
            rotation: 0,
            visible: true,
            startFrame,
            endFrame,
          })
          console.log(
            `[Orchestrator:html-templates] Using React motion graphic for "${tplSpec.templateId}" [frame ${startFrame}-${endFrame}]`,
          )
          continue
        }
      }

      // Resolve the template from the library
      const builtinTpl = findBuiltinTemplate(tplSpec.templateId, tplSpec.query)
      if (!builtinTpl) {
        console.warn(
          `[Orchestrator:html-templates] Template "${tplSpec.templateId || tplSpec.query}" not found, skipping`,
        )
        continue
      }

      // Load the raw HTML content
      const rawHtml = getTemplateContent(builtinTpl.filename)
      if (!rawHtml) {
        console.warn(`[Orchestrator:html-templates] File not found: ${builtinTpl.filename}, skipping`)
        continue
      }

      // Parse editable config from the template
      const customConfig = parseTemplateConfig(rawHtml)

      // Apply config overrides from the plan — update existing AND add new keys
      if (tplSpec.config) {
        for (const [key, planValue] of Object.entries(tplSpec.config)) {
          const existing = customConfig.find((p) => p.key === key)
          if (existing) {
            existing.value = planValue
          } else {
            // New property from plan that wasn't in the template's CONFIG — add it
            // so it gets sent via CONFIG_BULK_UPDATE to the iframe
            const valType = Array.isArray(planValue)
              ? planValue.length > 0 && typeof planValue[0] === 'object'
                ? 'object-array'
                : 'text-array'
              : typeof planValue === 'number'
                ? 'number'
                : typeof planValue === 'boolean'
                  ? 'boolean'
                  : 'text'
            customConfig.push({
              key,
              label: key,
              type: valType,
              value: planValue,
              group: 'Data',
            })
          }
        }
      }

      // For frame-synced templates (e.g. leetcode-explainer), inject timing
      // data derived from the dialogue timeline so the template's animation
      // phases (card, typing, complexity) align with the narration.
      const isFrameSynced =
        builtinTpl.id === 'tpl-leetcode-explainer' ||
        builtinTpl.id === 'tpl-world-map' ||
        builtinTpl.id === 'tpl-maptiler-map' ||
        builtinTpl.id === 'tpl-maptiler-globe'

      if (isFrameSynced) {
        const dialogueLines = useMultiCharacterStore.getState().dialogueLines

        if (dialogueLines.length > 0) {
          // Sort by order to ensure correct sequencing
          const sorted = [...dialogueLines].sort((a, b) => a.order - b.order)

          let timingOverrides: Record<string, number> = {}

          if (
            builtinTpl.id === 'tpl-world-map' ||
            builtinTpl.id === 'tpl-maptiler-map' ||
            builtinTpl.id === 'tpl-maptiler-globe'
          ) {
            // Map templates: inject frameSyncEnabled so the template knows it's frame-synced
            // The commands come from the plan's config.commands if present
            // and are applied via CONFIG_BULK_UPDATE.
            timingOverrides = {
              frameSyncEnabled: 1,
            }
          } else {
            // LeetCode explainer timing
            const firstLine = sorted[0]
            const cardStartFrame = firstLine.startFrame
            const cardEndFrame = firstLine.endFrame

            const typingStartFrame = sorted.length > 1 ? sorted[1].startFrame : cardEndFrame + Math.round(ctx.fps * 0.5)

            const typingEndFrame =
              sorted.length > 2
                ? sorted[sorted.length - 2].endFrame
                : sorted[sorted.length - 1].endFrame - Math.round(ctx.fps * 2)

            const complexityStartFrame =
              sorted.length > 2 ? sorted[sorted.length - 1].startFrame : typingEndFrame + Math.round(ctx.fps * 1)

            timingOverrides = {
              cardStartFrame,
              cardEndFrame,
              typingStartFrame,
              typingEndFrame,
              complexityStartFrame,
            }
          }

          for (const [key, val] of Object.entries(timingOverrides)) {
            const existing = customConfig.find((p) => p.key === key)
            if (existing) {
              existing.value = val
            } else {
              customConfig.push({
                key,
                label: key,
                type: 'number',
                value: val,
                group: 'Animation',
              })
            }
          }

          console.log(`[Orchestrator:html-templates] Injected frame timing for "${builtinTpl.id}":`, timingOverrides)
        }
      }

      // Inject the postMessage bridge for live updates
      const bridgedHtml = injectMessageBridge(rawHtml)

      // Calculate frame range
      const startFrame = Math.round((tplSpec.startPercent ?? 0) * ctx.totalFrames)
      const endFrame = Math.round((tplSpec.endPercent ?? 1) * ctx.totalFrames)

      // Add to the HTML template layer store
      const templateId = `orch-tpl-${Date.now()}-${i}`
      useHTMLTemplateLayerStore.getState().addTemplate({
        id: templateId,
        htmlContent: bridgedHtml,
        name: builtinTpl.title,
        position: tplSpec.position || { x: 0, y: 0 },
        scale: tplSpec.scale || 1,
        opacity: 1,
        zIndex: 1, // Behind characters
        rotation: 0,
        visible: true,
        width: dims.w,
        height: dims.h,
        startFrame,
        endFrame,
        customConfig,
        frameSync: isFrameSynced,
        templateAspectRatio: tplSpec.templateAspectRatio,
      })

      console.log(
        `[Orchestrator:html-templates] Added "${builtinTpl.title}" (${builtinTpl.id}) [frame ${startFrame}-${endFrame}]`,
      )
    } catch (err) {
      console.error(`[Orchestrator:html-templates] Failed to add template ${i + 1}:`, err)
    }
  }
}

// ── SVG Object Generation ──

export async function executeGenerateSVGObjects(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  if (!plan.svgObjects || plan.svgObjects.length === 0) return

  console.log('[Orchestrator:svg-objects] Generating', plan.svgObjects.length, 'SVG objects')

  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  // Generate each SVG object individually for token efficiency
  for (let i = 0; i < plan.svgObjects.length; i++) {
    const objSpec = plan.svgObjects[i]

    try {
      // Generate SVG at the canvas dimensions so it uses the full coordinate space.
      // SVGs are vector — there's no quality cost to generating at larger sizes.
      const objWidth = objSpec.width || dims.w
      const objHeight = objSpec.height || dims.h

      const response = await generateSVGObjects({
        prompt: `A single ${objSpec.prompt} icon/symbol. Simple, flat design, centered in frame. No background, just the object itself.`,
        width: objWidth,
        height: objHeight,
      })

      if (!response.objects || response.objects.length === 0) {
        console.warn(`[Orchestrator:svg-objects] No objects returned for "${objSpec.prompt}", skipping`)
        continue
      }

      // Calculate frame range
      const startFrame = Math.round((objSpec.startPercent ?? 0) * ctx.totalFrames)
      const endFrame = Math.round((objSpec.endPercent ?? 1) * ctx.totalFrames)

      // Convert plan keyframes (% positions) to pixel-based keyframes
      const convertedKeyframes = (objSpec.keyframes || [{ time: 0 }]).map((kf) => ({
        time: kf.time,
        x: kf.x !== undefined ? (kf.x / 100) * dims.w : undefined,
        y: kf.y !== undefined ? (kf.y / 100) * dims.h : undefined,
        scaleX: kf.scale,
        scaleY: kf.scale,
        opacity: kf.opacity,
        rotation: kf.rotation,
        easing: 'ease-in-out' as const,
      }))

      // Get or create the SVG object composition
      const store = useSVGObjectStore.getState()
      const existing = store.composition

      const newObj = {
        id: `svg-obj-${Date.now()}-${i}`,
        name: objSpec.prompt,
        zIndex: 10 + i, // Above background, below characters
        visible: true,
        colors: { ...response.objects[0].defaultColors },
        defaultColors: response.objects[0].defaultColors,
        svgMarkup: response.objects[0].svgMarkup,
        keyframes: convertedKeyframes.length > 0 ? convertedKeyframes : [{ time: 0 }],
        startFrame,
        endFrame,
        opacity: 1,
      }

      if (existing) {
        // Add to existing composition
        store.setComposition({
          ...existing,
          objects: [...existing.objects, newObj],
        })
      } else {
        // Create new composition
        store.setComposition({
          id: `svg-comp-${Date.now()}`,
          prompt: 'Orchestrated SVG objects',
          background: 'transparent',
          width: dims.w,
          height: dims.h,
          objects: [newObj],
        })
      }

      // Track SVG object generation cost (Gemini 2.5 Pro)
      if (ctx.addCostEntry) {
        const inputCost = response.tokenUsage
          ? (response.tokenUsage.promptTokenCount / 1_000_000) * GEMINI_PRO_INPUT_PRICE
          : 0
        const outputCost = response.tokenUsage
          ? (response.tokenUsage.candidatesTokenCount / 1_000_000) * GEMINI_PRO_OUTPUT_PRICE
          : 0
        ctx.addCostEntry({
          source: 'gemini',
          label: `SVG: ${objSpec.prompt.slice(0, 30)}`,
          cost: inputCost + outputCost,
          credits: CREDIT_COSTS['svg-object'],
          tokenUsage: response.tokenUsage,
        })
      }

      console.log(`[Orchestrator:svg-objects] Added "${objSpec.prompt}" [frame ${startFrame}-${endFrame}]`)
    } catch (err) {
      console.error(`[Orchestrator:svg-objects] Failed to generate "${objSpec.prompt}":`, err)
    }
  }
}

// ── Stock Media (Pixabay) ──

/** Default z-index by role — lower = further back */
const ROLE_ZINDEX: Record<string, number> = {
  background: 1,
  cutaway: 4,
  overlay: 6,
  accent: 7,
}

/** Default scale by role — relative to canvas fit */
const ROLE_DEFAULT_SCALE: Record<string, number> = {
  background: 1.05, // slight bleed to avoid edges
  cutaway: 1.0, // full canvas
  overlay: 0.4, // small overlay in corner
  accent: 0.25, // small accent element
}

/** Default transition by role */
const ROLE_DEFAULT_ENTER: Record<string, string> = {
  background: 'fade',
  cutaway: 'fade',
  overlay: 'zoom-in',
  accent: 'slide-up',
}
const ROLE_DEFAULT_EXIT: Record<string, string> = {
  background: 'fade',
  cutaway: 'fade',
  overlay: 'zoom-out',
  accent: 'fade',
}

/** @deprecated migrated to orchestrator/steps/setupStockMedia.ts */
export async function _executeSetupStockMedia(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  if (!plan.stockMedia || plan.stockMedia.length === 0) return
  if (!hasPixabayService()) {
    console.warn('[Orchestrator:stock-media] Pixabay not configured, skipping stock media')
    return
  }

  const service = getPixabayService()
  const mediaStore = useMediaStore.getState()
  const totalFrames = ctx.totalFrames
  const fps = ctx.fps || 30
  const clipDuration = plan.canvas.durationSeconds || 15
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  for (const item of plan.stockMedia) {
    try {
      // Check if this is a brand image reference
      if (item.query.startsWith('brand:') && ctx.settings?.brandContext?.brandImageAssetIds) {
        const targetRole = item.query.replace('brand:', '').trim()
        const { brandImageAssetIds, brandImageRoles } = ctx.settings.brandContext
        const assetId = brandImageAssetIds.find((id) => brandImageRoles?.[id] === targetRole)
        if (assetId) {
          const asset = useMediaStore.getState().assets.find((a) => a.id === assetId)
          if (asset) {
            // Brand image already in media store — just add to canvas
            const role = item.role || 'overlay'
            mediaStore.addToCanvas(asset.id)
            const canvasItem = useMediaStore.getState().canvasItems.find((ci) => ci.assetId === asset.id)
            if (canvasItem) {
              const startFrame = Math.round(item.startPercent * totalFrames)
              const endFrame = Math.round(item.endPercent * totalFrames)
              const finalScale = item.scale ?? ROLE_DEFAULT_SCALE[role] ?? 1
              const containerW = dims.w * finalScale
              const containerH = dims.h * finalScale
              let posX: number
              let posY: number
              if (role === 'background' || role === 'cutaway') {
                posX = (dims.w - containerW) / 2
                posY = (dims.h - containerH) / 2
              } else {
                posX = (item.position.x / 100) * dims.w - containerW / 2
                posY = (item.position.y / 100) * dims.h - containerH / 2
              }
              const enterTransition = item.enterTransition || ROLE_DEFAULT_ENTER[role] || 'fade'
              const exitTransition = item.exitTransition || ROLE_DEFAULT_EXIT[role] || 'fade'
              const transitionDurationSecs = item.transitionDuration ?? 0.5
              const transitionFrames = Math.round(transitionDurationSecs * fps)
              const zIndex = item.zIndex ?? ROLE_ZINDEX[role] ?? 5
              mediaStore.updateCanvasItem(canvasItem.id, {
                position: { x: posX, y: posY },
                scale: finalScale,
                startFrame,
                endFrame,
                zIndex,
                enterTransition: enterTransition as import('@/stores/useMediaStore').MediaTransitionType,
                exitTransition: exitTransition as import('@/stores/useMediaStore').MediaTransitionType,
                transitionFrames,
              })
            }
            console.log(`[Orchestrator:stock-media] Used brand image "${targetRole}" (asset ${assetId})`)
            continue
          }
        }
        // Brand image not found — fall through to Pixabay search with cleaned query
        console.warn(`[Orchestrator:stock-media] Brand image "${targetRole}" not found, skipping`)
        continue
      }

      const role = item.role || 'overlay'
      let downloadUrl: string | undefined
      let width = 0
      let height = 0
      let duration: number | undefined

      if (item.type === 'image') {
        // Infer orientation from role: backgrounds match canvas, accents can be any
        const defaultOrientation =
          role === 'background' || role === 'cutaway' ? (dims.w >= dims.h ? 'horizontal' : 'vertical') : 'all'
        const results = await service.searchImages({
          q: item.query,
          per_page: 5,
          image_type: 'photo',
          orientation: (item.orientation as 'all' | 'horizontal' | 'vertical') || defaultOrientation,
        })
        if (results.hits.length === 0) {
          console.warn(`[Orchestrator:stock-media] No image results for "${item.query}"`)
          continue
        }
        const hit = results.hits[0]
        downloadUrl = hit.largeImageURL
        width = hit.imageWidth
        height = hit.imageHeight
      } else {
        const results = await service.searchVideos({
          q: item.query,
          per_page: 5,
        })
        if (results.hits.length === 0) {
          console.warn(`[Orchestrator:stock-media] No video results for "${item.query}"`)
          continue
        }
        const hit = results.hits[0]
        const videoFile = hit.videos.medium
        downloadUrl = videoFile.url
        width = videoFile.width
        height = videoFile.height
        duration = hit.duration
      }

      if (!downloadUrl) {
        console.warn(`[Orchestrator:stock-media] No download URL for "${item.query}"`)
        continue
      }

      // ── Smart video duration ──
      // For videos, constrain endPercent so we don't show a frozen last frame
      // if the plan duration is longer than the actual video
      const effectiveStartPercent = item.startPercent
      let effectiveEndPercent = item.endPercent
      if (item.type === 'video' && duration && duration > 0) {
        const plannedDuration = (item.endPercent - item.startPercent) * clipDuration
        if (plannedDuration > duration) {
          // Clamp to actual video duration
          effectiveEndPercent = item.startPercent + duration / clipDuration
          console.log(
            `[Orchestrator:stock-media] Video "${item.query}" is ${duration}s, clamped to ${effectiveStartPercent.toFixed(2)}-${effectiveEndPercent.toFixed(2)}`,
          )
        }
      }

      console.log(`[Orchestrator:stock-media] Downloading ${item.type} (${role}) for "${item.query}"`)
      const blob = await service.downloadAsBlob(downloadUrl)
      const url = URL.createObjectURL(blob)

      const asset: MediaAsset = {
        id: `stock_${item.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: item.query,
        type: item.type === 'image' ? 'image/jpeg' : 'video/mp4',
        size: blob.size,
        category: item.type === 'image' ? 'images' : 'video',
        url,
        width,
        height,
        duration,
        addedAt: Date.now(),
      }

      mediaStore.addAsset(asset, blob)
      mediaStore.addToCanvas(asset.id)

      // Find the newly created canvas item and adjust timing, position, scale, transitions
      const canvasItem = useMediaStore.getState().canvasItems.find((ci) => ci.assetId === asset.id)
      if (canvasItem) {
        const startFrame = Math.round(effectiveStartPercent * totalFrames)
        const endFrame = Math.round(effectiveEndPercent * totalFrames)

        // ── Role-aware scale ──
        // The renderer now uses canvas-relative sizing: scale=1 means the container
        // is canvasWidth × canvasHeight, with the image using object-fit:contain inside.
        // So we just pass the plan's scale directly (role default if not specified).
        const finalScale = item.scale ?? ROLE_DEFAULT_SCALE[role] ?? 1

        // ── Position ──
        // Container size = canvas * scale
        const containerW = dims.w * finalScale
        const containerH = dims.h * finalScale

        let posX: number
        let posY: number
        if (role === 'background' || role === 'cutaway') {
          // Always center backgrounds and cutaways
          posX = (dims.w - containerW) / 2
          posY = (dims.h - containerH) / 2
        } else {
          // Position from percentage (center point of the media)
          posX = (item.position.x / 100) * dims.w - containerW / 2
          posY = (item.position.y / 100) * dims.h - containerH / 2
        }

        // ── Transitions ──
        const enterTransition = item.enterTransition || ROLE_DEFAULT_ENTER[role] || 'fade'
        const exitTransition = item.exitTransition || ROLE_DEFAULT_EXIT[role] || 'fade'
        const transitionDurationSecs = item.transitionDuration ?? 0.5
        const transitionFrames = Math.round(transitionDurationSecs * fps)

        // ── z-index ──
        const zIndex = item.zIndex ?? ROLE_ZINDEX[role] ?? 5

        mediaStore.updateCanvasItem(canvasItem.id, {
          position: { x: posX, y: posY },
          scale: finalScale,
          startFrame,
          endFrame,
          zIndex,
          enterTransition: enterTransition as import('@/stores/useMediaStore').MediaTransitionType,
          exitTransition: exitTransition as import('@/stores/useMediaStore').MediaTransitionType,
          transitionFrames,
        })
      }

      console.log(`[Orchestrator:stock-media] Added "${item.query}" (${item.type}, role=${role}) to canvas`)
    } catch (err) {
      console.warn(`[Orchestrator:stock-media] Failed to fetch "${item.query}":`, err)
      // Non-fatal — skip this asset and continue with others
    }
  }
}

// ── Sound Effects Executor ──

/** @deprecated migrated to orchestrator/steps/setupSoundEffects.ts */
export async function _executeSetupSoundEffects(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  if (!plan.soundEffects || plan.soundEffects.length === 0) return

  const mediaStore = useMediaStore.getState()
  const totalFrames = ctx.totalFrames
  const fps = ctx.fps || 30

  for (const sfx of plan.soundEffects) {
    try {
      const source = sfx.source || 'generate'
      let audioBlob: Blob
      let name: string

      if (source === 'generate' && hasElevenLabsService()) {
        // Generate via ElevenLabs
        console.log(`[Orchestrator:sound-effects] Generating SFX: "${sfx.prompt}"`)
        const result = await generateSoundEffect({
          text: sfx.prompt,
          durationSeconds: sfx.durationSeconds,
          promptInfluence: 0.3,
        })
        audioBlob = result.audioBlob
        name = `SFX: ${sfx.prompt}`

        // Track cost
        ctx.addCostEntry?.({
          source: 'elevenlabs',
          label: `SFX: ${sfx.prompt.slice(0, 30)}`,
          cost: 0,
          credits: CREDIT_COSTS['elevenlabs-sfx'],
          characters: sfx.prompt.length,
        })
      } else {
        // Fallback: try Freesound search
        console.log(`[Orchestrator:sound-effects] Searching Freesound for: "${sfx.prompt}"`)
        const { getFreesoundService, hasFreesoundService } = await import('@/services/freesound')
        if (!hasFreesoundService()) {
          console.warn('[Orchestrator:sound-effects] No SFX source available, skipping')
          continue
        }
        const service = getFreesoundService()
        const durationFilter = sfx.durationSeconds
          ? `duration:[0 TO ${Math.ceil(sfx.durationSeconds)}]`
          : 'duration:[0 TO 10]'
        const results = await service.search({
          query: sfx.prompt,
          pageSize: 3,
          filter: durationFilter,
        })
        if (results.results.length === 0) {
          console.warn(`[Orchestrator:sound-effects] No results for "${sfx.prompt}"`)
          continue
        }
        const hit = results.results[0]
        audioBlob = await service.downloadAsBlob(hit.previews['preview-hq-mp3'])
        name = `SFX: ${hit.name}`
      }

      // Create media asset
      const assetId = `sfx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const url = URL.createObjectURL(audioBlob)
      const asset: MediaAsset = {
        id: assetId,
        name,
        type: 'audio/mpeg',
        size: audioBlob.size,
        category: 'audio',
        url,
        addedAt: Date.now(),
      }

      // Persist to IndexedDB and add to store
      await saveMediaBlob(assetId, audioBlob)
      mediaStore.addAsset(asset, audioBlob)

      // Add to canvas with timing
      mediaStore.addToCanvas(assetId)
      const canvasItem = useMediaStore.getState().canvasItems.find((ci) => ci.assetId === assetId)
      if (canvasItem) {
        const startFrame = Math.round(sfx.startPercent * totalFrames)
        const durationFrames = sfx.durationSeconds ? Math.round(sfx.durationSeconds * fps) : Math.round(2 * fps) // default 2 seconds
        const endFrame = Math.min(startFrame + durationFrames, totalFrames)

        mediaStore.updateCanvasItem(canvasItem.id, {
          startFrame,
          endFrame,
        })
      }

      console.log(`[Orchestrator:sound-effects] Added "${sfx.prompt}" to canvas`)
    } catch (err) {
      console.warn(`[Orchestrator:sound-effects] Failed to add "${sfx.prompt}":`, err)
      // Non-fatal — skip this SFX and continue with others
    }
  }
}

// Step executor routing is handled by the modular stepExecutors.ts
export { getStepExecutor } from './orchestrator/stepExecutors'
