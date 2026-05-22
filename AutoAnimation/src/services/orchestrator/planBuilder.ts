/**
 * Orchestrator Plan Builder — constructs the Gemini prompt for ClipPlan generation.
 */

import type { OrchestratorSettings, ClipPlan, VariationField } from '@/types/orchestrator'
import { hasPixabayService } from '@/services/pixabay'
import { getTopHooks } from '@/data/hookTemplates'
import { CAPTION_PRESETS } from '@/data/captionPresets'

// ── Plan Generation ──

/** Build the "USER-SELECTED" constraint section for the Gemini prompt.
 *  When users pick specific animations/templates/etc in the Settings panel,
 *  we tell Gemini it MUST use those items in the plan. */
export function buildSelectedItemsSection(selected?: {
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
 * Build the full Gemini prompt including available resources (characters, voices, animations)
 * and ask for a structured ClipPlan JSON.
 */
export function buildPlanPrompt(
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
  rigAnimationsByCharacter: Record<string, string[]> = {},
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

  // Append rig animation info per character
  const rigAnimChars = Object.entries(rigAnimationsByCharacter).filter(([, anims]) => anims.length > 0)
  if (rigAnimChars.length > 0) {
    characterList += `\n\nRIGGED CHARACTER ANIMATIONS (these characters have body animations that play during the clip):`
    for (const [charName, animNames] of rigAnimChars) {
      characterList += `\n  "${charName}" has animations: ${animNames.map((n) => `"${n}"`).join(', ')}`
    }
    characterList += `\n  → Set "defaultAnimation" on the character to choose which animation loops by default.`
    characterList += `\n  → Set "animationName" on individual dialogue lines to switch animations mid-clip (e.g. "idle" during listening, "talking" during speech).`
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

  // Image-heavy "talking over images" mode for short-form narration content.
  // When enabled, the planner must fill the timeline with ~1.2-1.8s image cuts.
  const imageHeavyDirective = settings?.imageHeavyMode
    ? (() => {
        const dur = settings?.durationSeconds && settings.durationSeconds > 0 ? settings.durationSeconds : 60
        const targetCuts = Math.max(20, Math.round(dur / 1.5))
        return `

🎬 IMAGE-HEAVY "TALKING-OVER-IMAGES" MODE — HARD REQUIREMENTS:
This clip is a short-form narration video where stock photographs cut on screen while a narrator talks (TikTok / Shorts / Reels style).
You MUST follow these rules — they OVERRIDE other defaults:
1. Produce ${targetCuts} stockMedia entries (≈ one cut every 1.2-1.8 seconds across the ${dur}s timeline). All MUST have type:"image".
2. Cuts must be CONTIGUOUS and back-to-back: cut N's endPercent ≈ cut N+1's startPercent. No gaps. No overlaps.
3. role:"background" for EVERY cut (full-canvas behind captions). Do NOT use "overlay"/"accent" roles for these cuts.
4. enterTransition: VARY transitions across cuts for visual rhythm. Pick from: "none" (instant/hard cut), "fade", "slide-left", "slide-right", "slide-up", "zoom-in", "zoom-out", "ken-burns". Use transitionDuration 0.2-0.4 for slides/zooms/fade (0 for "none"). Mix it up — don't repeat the same transition more than 2-3 times in a row.
5. Image queries must be CONCRETE, photographable nouns from the dialogue (e.g. "neon city street night", "young woman laughing coffee shop", "stack of dollar bills closeup"). No abstract concepts.
6. Do NOT use htmlTemplates, characters, svgObjects, shapes, or AI image generation for visuals — stock images carry the entire visual layer.
7. background.type MUST be "none" — the stock images ARE the background.
8. Captions MUST be enabled with style "karaoke" or "word-by-word" — captions narrate over the images.
9. Stock VIDEO (type:"video") is forbidden in this mode — stills only.
`
      })()
    : ''

  const stockMediaNote =
    settings?.useStockMedia && hasPixabayService()
      ? `10. Stock Media (Pixabay + Pexels): Search for free stock images and videos to complement the clip. Stock media is ONE tool among many — use it when it adds value, not in every plan.

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
    ? settings?.preferStockAudio
      ? `11b. Sound Effects: Add short stock sound effects to enhance key moments.

   **STOCK-ONLY MODE**: Set "source":"search" on EVERY sound effect — AI-generated SFX are disabled.
   All SFX must come from the Freesound library (500K+ Creative Commons sounds). Favor real-world, recognizable
   sounds (applause, whoosh, cash register, keyboard typing, traffic, crowd noise, ding, impact).`
      : `11b. Sound Effects: Add short sound effects to enhance key moments.

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

  // Build learning context note from performance data
  const learningContextNote = settings?.learningContext
    ? `PERFORMANCE-LEARNED DEFAULTS (apply these insights from the user's top-performing content):
${settings.learningContext.recommendedAspectRatio ? `- Best-performing aspect ratio: ${settings.learningContext.recommendedAspectRatio} — prefer this unless the user specified otherwise` : ''}
${settings.learningContext.recommendedDuration ? `- Optimal duration: ${settings.learningContext.recommendedDuration}s — target this length for best engagement` : ''}
${settings.learningContext.recommendedCaptionStyle ? `- Best caption style: ${settings.learningContext.recommendedCaptionStyle} — use this in the captions config` : ''}
${settings.learningContext.performanceInsights?.length ? `- Insights:\n${settings.learningContext.performanceInsights.map((i) => `  * ${i}`).join('\n')}` : ''}
Use these learned preferences to guide your creative decisions. They are based on the user's actual content performance data.`
    : ''

  // Series episode context
  const seriesContextNote = settings?.seriesContext
    ? `SERIES CONTEXT — This is episode ${settings.seriesContext.episodeNumber}/${settings.seriesContext.totalEpisodes} in the "${settings.seriesContext.seriesTitle}" series.
${settings.seriesContext.previousEpisodeSummaries?.length ? `Previous episodes covered:\n${settings.seriesContext.previousEpisodeSummaries.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}` : ''}
${settings.seriesContext.sharedCharacters?.length ? `Use these consistent characters: ${settings.seriesContext.sharedCharacters.join(', ')}` : ''}
Maintain visual consistency with previous episodes. Add "Part ${settings.seriesContext.episodeNumber}/${settings.seriesContext.totalEpisodes}" as a text overlay.`
    : ''

  return `You are an expert AI Director for ProAnimate, a professional web-based animation studio. You think like a creative director, motion designer, scriptwriter, and animation supervisor combined. Given a user's creative brief, you plan a complete animated clip by choosing from the platform's tools and resources.

You must optimize every clip for maximum viewer retention and engagement. Think about hooks, pacing, emotional arcs, and platform-specific best practices.

${aspectRatioConstraint}
${durationConstraint}
${fpsConstraint}
${brandContextNote}
${learningContextNote}
${seriesContextNote}
${
  settings?.mode === 'faceless'
    ? `
FACELESS VIDEO MODE:
This clip must be a FACELESS video — NO on-screen characters. Voice-only narration.
- Set canvas.mode to "faceless"
- Leave the "characters" array EMPTY
- Use a single narrator voice for all dialogue lines (characterName: "Narrator")
- Focus visual storytelling entirely on: HTML templates, stock media B-roll, text overlays, SVG objects, shapes
- Change the visual every 3-5 seconds to maintain engagement
- Use kinetic typography, infographic charts, listicle templates, and stock footage
- Think like a viral educational TikTok creator — fast cuts, bold text, compelling B-roll
`
    : ''
}

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
   - If the topic involves intelligence/surveillance/military/satellites/space reconnaissance → spy satellite + characters
   - If the topic involves data/statistics → infographic charts + narration
   - If authority/trust is needed → talking head with professional template
   - If storytelling is needed → multiple characters with scene-appropriate backgrounds
   - If viral/entertainment → fast cuts, stock media B-roll, high emotion variance

PLATFORM CAPABILITIES:
1. Canvas: aspect ratios 16:9, 9:16, 1:1, 4:3, 21:9. FPS: 24, 30, 60.
2. Backgrounds: The SCENE behind everything. Choose the type that fits:
   - "none" — Solid dark fill. Use when an HTML template covers the FULL clip (0-100%) — the template IS the visual, no separate background needed. THIS IS THE DEFAULT when you include a full-coverage HTML template.
   - "image" — A real photograph/image searched from Pixabay. Use for real-world scenes: office, park, classroom, city skyline, kitchen, studio, etc. Set imageQuery to specific descriptive English keywords (e.g. "modern office desk computer", "sunny park green trees", "dark classroom chalkboard"). PREFER this for any clip that needs a realistic or relatable setting.
   - "lottie" — Ambient particle effect (subtle floating dots, ripples). Only use as a last resort when no image or template fits. These are abstract decorations, NOT real backgrounds.
   - "svg-generate" — AI-generated vector scene. ${svgGenerationNote}
3. Characters: Positioned on canvas with lip-synced dialogue, emotion expressions.
4. Dialogue: Multi-character script with [emotion] cues (Joy, Anger, Sadness, Fear, Surprise, Disgust, Neutral).
5. Voices: Text-to-speech via ElevenLabs with automatic lip sync.
6. Text Overlays: title, subtitle, lower-third, cta, quote, watermark presets.
7. Shapes: rectangle, circle, triangle, star decorative elements.
8. Captions: word-by-word, sentence, karaoke, animated-pop (spring scale), animated-bounce (bounce up), animated-glow (pulsing glow on active word), animated-wave (wave motion). Animated styles are recommended for TikTok/Reels. Emoji modes: "contextual" (word-matched), "emotion-only" (emotion indicator).
9. **HTML Templates (IMPORTANT)**: Full HTML/CSS/JS motion graphics templates rendered as canvas layers. These are the PRIMARY visual styling tool. Categories: UI styles (glassmorphism, brutalism, noir, retro), kinetic typography/captions, social media mockups (Twitter/X, Instagram, Reddit, news), educational (world map, solar system, DNA), business (stock charts, org charts), tech (terminal, code editor), MapTiler maps (satellite/streets/terrain with flyTo animations), spy satellite simulator (intelligence/surveillance/tactical HUD with orbital tracking), collages, and more. ALWAYS use at least one HTML template as a visual layer when the clip needs a themed look, styled background, or motion graphics overlay. **IMPORTANT**: For ANY topic involving countries, geopolitics, wars, invasions, trade between nations, diplomacy, or geography — use the World Map template (tpl-world-map) for country-level views, or MapTiler Map (tpl-maptiler-map) for location/city/route-level detail with satellite imagery. For global perspectives use MapTiler Globe (tpl-maptiler-globe). For intelligence/surveillance/military topics use Spy Satellite Simulator (tpl-spy-satellite). See rules #10, #11.5, and #11.6 for detailed choreography instructions.
12. **Camera Direction (Optional)**: Add cinematic camera movement to enhance the visual experience. Include a "camera" field in your plan with either a presetId or custom keyframes.

   **Available presets** (use "camera": { "presetId": "..." }):
   - "slow-zoom-in": Gentle zoom from 1x to 1.3x — good for building tension
   - "slow-zoom-out": Pull back from 1.3x to 1x — good for reveals
   - "ken-burns": Slow zoom + subtle pan — cinematic documentary feel
   - "pan-left-to-right": Horizontal pan across the scene
   - "pan-right-to-left": Reverse horizontal pan
   - "dramatic-push": Fast zoom in for emphasis moments
   - "pull-back": Start close, pull back to reveal context
   - "subtle-drift": Gentle organic floating movement — adds life to any clip

   **Custom keyframes** (use "camera": { "keyframes": [...] }):
   Each keyframe: { timePercent (0-1), zoom (0.5-2), panX (-50 to 50), panY (-50 to 50), rotation (degrees), easing }

   **When to use camera:**
   - Dialogue-heavy clips: "ken-burns" or "subtle-drift" to avoid static look
   - Dramatic reveals: "slow-zoom-out" or "pull-back"
   - Emphasis moments: "dramatic-push" at key data points or punchlines
   - Story arcs: custom keyframes that zoom into speaker then pull back

   **When NOT to use camera:**
   - Complex HTML templates with their own animations (world map, charts) — the camera zoom can conflict
   - Very short clips (< 15s) — camera movement needs time to register

${stockMediaNote}
${soundEffectsNote}
${imageHeavyDirective}

AVAILABLE RESOURCES:
${characterList}

${voiceList}

Background Lottie animations:
  ${bgAnimations || 'None available'}

Overlay Lottie animations:
  ${overlayAnimations || 'None available'}

HTML Templates Library (${htmlTemplateList.length} templates — ALWAYS pick at least one as the visual theme):
${htmlTemplateSection || '  None available'}
${buildSelectedItemsSection(selectedItems)}
CRITICAL RULES:
1. ALWAYS include at least 1 HTML template in "htmlTemplates" — this is the main visual layer of the clip. Pick the template whose style best matches the user's brief. Set startPercent: 0, endPercent: 1 for full-duration backgrounds.
2. For characters: if USER-SELECTED characters are listed above, you MUST include **EVERY SINGLE ONE** of them in the "characters" array with their exact savedCharacterName. Do NOT skip any selected character — the user chose them for a reason. Write dialogue lines for ALL selected characters so they each speak. If 3 characters are selected, all 3 must appear and talk. Assign each character a distinct role (e.g., narrator, debater, expert, devil's advocate). Also use savedCharacterName for any other matching saved character. Set generateNew=true only if needed.
   NEVER invent a savedCharacterName that is not in the available characters list above. If you need a character not in the list, set generateNew=true and leave savedCharacterName empty. The savedCharacterName field must EXACTLY match one of the names listed above (case-insensitive).
3. For background: if you use an HTML template that covers the FULL clip (startPercent:0, endPercent:1), set background type to "none" — the template IS the visual, no separate background needed. If NO template covers the full clip, use type "image" with a descriptive imageQuery for a real scene photo from Pixabay (e.g. "modern tech office dark", "cozy classroom chalkboard"). NEVER use "svg-generate" when HTML templates are present. Only use "lottie" if you specifically want abstract floating particles as a decorative layer.
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

11.6. **SPY SATELLITE SIMULATOR (tpl-spy-satellite) — GUIDE**:
   Use for topics involving intelligence agencies, military surveillance, satellite reconnaissance,
   space technology, spy programs, geopolitical intelligence gathering, or any content benefiting
   from a dramatic "classified briefing" visual style.

   **Available commands** (config.commands array):
   - { frame: N, action: "flyTo", params: { lng, lat, zoom, pitch, bearing, duration } }
   - { frame: N, action: "selectSatellite", params: { name: "ISS" } }
   - { frame: N, action: "deselectSatellite", params: {} }
   - { frame: N, action: "setVisualMode", params: { mode: "nvg" } } — options: normal, nvg, flir, crt
   - { frame: N, action: "addTarget", params: { lng, lat, label: "Target Alpha", id: "t1" } }
   - { frame: N, action: "removeTarget", params: { id: "t1" } }
   - { frame: N, action: "clearTargets", params: {} }
   - { frame: N, action: "setClassification", params: { level: "TOP SECRET // SCI" } }
   - { frame: N, action: "setMission", params: { name: "OPERATION OVERWATCH" } }
   - { frame: N, action: "zoomToTarget", params: { id: "t1", zoom: 16, pitch: 60 } }
   - { frame: N, action: "set3DTerrain", params: { enabled: true, exaggeration: 1.5 } }
   - { frame: N, action: "hideUI" / "showUI", params: {} }
   - { frame: N, action: "showAlert", params: { text: "TARGET ACQUIRED", duration: 2000 } }
   - { frame: N, action: "lockTarget", params: { id: "t1", zoom: 14, duration: 3000 } }
   - { frame: N, action: "setTimeSpeed", params: { multiplier: 120 } }

   **Available satellites**: ISS, HUBBLE, LANDSAT-8, NOAA-20, GPS IIF-1, TERRA, AQUA, SENTINEL-2A,
   COSMOS 2542, USA 224, STARLINK-1007, STARLINK-1130, YAOGAN-30D, GPS IIF-12, METEOR-M2, TIANGONG.

   **Satellite selection guide by topic:**
   - CIA/NRO/intelligence topics → USA 224, COSMOS 2542
   - Space station / astronaut content → ISS, TIANGONG
   - Earth observation / climate / environment → LANDSAT-8, SENTINEL-2A, TERRA, AQUA
   - Weather / atmospheric → NOAA-20, METEOR-M2
   - Navigation / GPS → GPS IIF-1, GPS IIF-12
   - Commercial space / Starlink / SpaceX → STARLINK-1007, STARLINK-1130
   - Astronomy / telescopes → HUBBLE
   - Chinese military / Asia-Pacific → YAOGAN-30D

   **HOW TO CHOREOGRAPH**:
   Step 1: Start with wide globe view (zoom 2-3), NVG or CRT mode for dramatic intro.
   Step 2: showAlert with intro text like "SATELLITE FEED ACTIVE" for atmosphere.
   Step 3: selectSatellite to follow a relevant satellite for 1-2 seconds.
   Step 4: deselectSatellite, then flyTo the first location of interest.
   Step 5: addTarget at key locations as narrator mentions them.
   Step 6: lockTarget for dramatic close-ups with multi-phase lock animation.
   Step 7: Switch visual modes between locations (nvg→normal→flir) for variety.
   Step 8: zoomToTarget for close-up on important locations.
   Step 9: Use set3DTerrain for mountainous/terrain-relevant content.
   Step 10: showAlert for status changes ("UPLINK ESTABLISHED", "SCANNING...", "TARGET ACQUIRED").
   Step 11: End with zoom out to globe view or dramatic CRT mode fade.

   Use 10-20 commands minimum for a 60-90s clip. Vary visual modes for cinematic impact.

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
    "imageQuery": "descriptive Pixabay search keywords for real scene background (e.g. 'modern office desk', 'sunny park trees')",
    "lottieQuery": "optional keyword for ambient particle effect (only if type=lottie)",
    "svgPrompt": "optional prompt for AI-generated SVG (only if type=svg-generate)"
  },
  // background.type guide:
  //   "none" — when HTML template covers full clip (startPercent:0, endPercent:1). DEFAULT choice with templates.
  //   "image" — real photo from Pixabay. Use for realistic/relatable settings. Set imageQuery.
  //   "lottie" — abstract particles. Last resort only.
  //   "svg-generate" — AI vector scene. Rarely needed.
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
      "dimension": "2d",
      "defaultAnimation": "optional — name of rig animation to loop by default (from available animations listed above)",
      "motionKeyframes": [
        { "timePercent": 0, "position": { "x": 30, "y": 15 }, "scale": 1.3 },
        { "timePercent": 0.5, "position": { "x": 50, "y": 15 }, "scale": 1.3 },
        { "timePercent": 1, "position": { "x": 70, "y": 15 }, "scale": 1.3 }
      ]
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
  // characters.defaultAnimation: optional — if character has rig animations, this sets the default body animation loop.
  // characters.motionKeyframes: OPTIONAL array of position/scale/rotation changes over time. Use for:
  //   - Walking across screen: timePercent 0 (x:30) → 0.5 (x:50) → 1.0 (x:70)
  //   - Entering scene from off-screen: timePercent 0 (x:-10) → 0.1 (x:25)
  //   - Emphasis bounce: scale 1.0 → 1.2 → 1.0 at emotional peaks
  //   Positions are percentages (0-100). Omit motionKeyframes for static characters (most clips).
  "dialogue": [
    { "characterName": "Character A", "script": "[happy] Hello! I'll start the discussion.", "emotion": "Joy", "animationName": "optional — name of rig animation for this line" },
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
  "camera": {
    "presetId": "optional preset: slow-zoom-in, slow-zoom-out, ken-burns, pan-left-to-right, pan-right-to-left, dramatic-push, pull-back, subtle-drift",
    "keyframes": [
      { "timePercent": 0, "zoom": 1, "panX": 0, "panY": 0, "rotation": 0, "easing": "ease-in-out" },
      { "timePercent": 1, "zoom": 1.3, "panX": 5, "panY": 0, "rotation": 0, "easing": "ease-in-out" }
    ]
  },
  // camera: include EITHER presetId OR keyframes, not both. Omit camera entirely for static shots.
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
  "retentionHooks": [
    {
      "type": "progress-bar" | "countdown" | "chapter-marker" | "wait-for-it" | "step-counter",
      "style": "minimal" | "neon" | "gradient" | "branded",
      "position": "top" | "bottom",
      "color": "#6366f1",
      "countdownFrom": 10,
      "chapters": ["Intro", "Main Point", "Conclusion"],
      "triggerPercent": 0.7,
      "text": "Wait for it...",
      "totalSteps": 5
    }
  ],
  // retentionHooks (OPTIONAL array): Visual engagement widgets that boost viewer retention.
  // Use progress-bar for educational/tutorial content (shows how far along the viewer is).
  // Use countdown for time-sensitive content or countdowns to a reveal.
  // Use chapter-marker for multi-section content (shows named segments with progress dots).
  // Use wait-for-it for surprise reveals — text appears at triggerPercent (0-1) through the clip.
  // Use step-counter for listicle/step-by-step content (e.g. "Step 2/5").
  // Styles: minimal (thin, subtle), neon (glowing), gradient (colorful), branded (uses brand colors).
  // Position: "top" or "bottom" of the screen.
  // Only include 1-2 hooks max per clip. Pick the type that best matches the content format.
  "gestures": [
    { "characterId": "char-1", "type": "head-nod", "startFrame": 0, "endFrame": 30, "intensity": 0.7 }
  ],
  // gestures (OPTIONAL array): Speech-driven body motion keyframes generated from dialogue prosody.
  // Each entry: { characterId (optional), type: string, startFrame, endFrame, intensity: 0-1 }.
  // Types: "head-nod", "head-tilt", "lean-in", "lean-back", "shrug", "point", "wave".
  // Generates head nods on emphasis, tilts on questions, lean-ins on key points.
  "captions": {
    "style": "word-by-word" | "sentence" | "karaoke" | "animated-pop" | "animated-bounce" | "animated-glow" | "animated-wave",
    "position": "top" | "center" | "bottom",
    "fontSize": 48,
    "color": "#ffffff",
    "emojiMode": "none" | "contextual" | "emotion-only",
    "animationSpeed": 1,
    "presetId": "optional caption style preset: ${CAPTION_PRESETS.map((p) => `'${p.id}' (${p.name})`).join(', ')}"
  },
  "scenes": [
    {
      "id": "scene-1",
      "durationPercent": 0.4,
      "background": { "type": "lottie", "lottieQuery": "optional override per-scene" },
      "characters": [{ "name": "...", "position": { "x": 50, "y": 50 }, "scale": 1 }],
      "dialogue": [{ "characterName": "...", "script": "..." }],
      "textOverlays": [{ "preset": "title", "content": "...", "startPercent": 0, "endPercent": 0.3 }],
      "stockMedia": [],
      "transition": { "type": "cut", "durationMs": 0 }
    },
    {
      "id": "scene-2",
      "durationPercent": 0.6,
      "transition": { "type": "crossfade", "durationMs": 500 }
    }
  ]
  // scenes: OPTIONAL multi-scene storyboard. Use when duration > 15s or content has distinct segments (hook/content/CTA).
  // When scenes[] is present, dialogue/textOverlays/stockMedia/etc at the TOP LEVEL are still used as the GLOBAL flat plan.
  // scenes[] provides ALTERNATIVE per-scene layer breakdown. Each scene's startPercent/endPercent are relative to THAT SCENE's time range.
  // transition.type: "cut" (instant), "crossfade" (opacity blend), "wipe-left", "wipe-right", "zoom-in", "zoom-out", "slide-up".
  // transition.durationMs: transition duration (300-800ms typical). First scene should use "cut".
  // durationPercent: fraction of total clip. All scenes must sum to 1.0.
  // Guidelines: 3-7 seconds per scene. Scene purposes: hook (grab attention), content (deliver value), CTA (call to action).
  // ONLY use scenes for clips > 15 seconds with clearly distinct segments. Short clips should use flat structure.
}

PROVEN HOOK PATTERNS — Use these for the first dialogue line to maximize viewer retention:
${getTopHooks(10)
  .map((h) => `- "${h.pattern}" (${h.category}, viral score: ${h.viralScore})`)
  .join('\n')}
The first dialogue line SHOULD use one of these hook patterns adapted to the topic.`
}

// ── Plan Mutation (A/B Testing) ──

/**
 * Create a mutated copy of a ClipPlan by changing a single variable field.
 * Used by the A/B variation engine to produce controlled variants.
 */
export function mutateClipPlan(basePlan: ClipPlan, variable: VariationField, newValue: string): ClipPlan {
  // Deep clone
  const plan = JSON.parse(JSON.stringify(basePlan)) as ClipPlan

  switch (variable) {
    case 'voice':
      // Change the voice name for all characters
      for (const char of plan.characters) {
        char.voiceName = newValue
      }
      break

    case 'musicMood':
      // Change music mood in the plan's sound effects
      if (plan.soundEffects && plan.soundEffects.length > 0) {
        ;(plan.soundEffects[0] as unknown as Record<string, unknown>).mood = newValue
      }
      break

    case 'textStyle':
      // Change font family for all text overlays
      if (plan.textOverlays) {
        for (const overlay of plan.textOverlays) {
          ;(overlay as unknown as Record<string, unknown>).fontFamily = newValue
        }
      }
      break

    case 'characterPosition':
      // Shift character positions
      for (const char of plan.characters) {
        if (newValue === 'left') {
          char.position = { x: 25, y: 50 }
        } else if (newValue === 'right') {
          char.position = { x: 75, y: 50 }
        } else if (newValue === 'center') {
          char.position = { x: 50, y: 50 }
        }
      }
      break

    case 'template':
      // Swap HTML template IDs
      if (plan.htmlTemplates && plan.htmlTemplates.length > 0) {
        plan.htmlTemplates[0].templateId = newValue
      }
      break

    case 'aspectRatio':
      plan.canvas.aspectRatio = newValue as ClipPlan['canvas']['aspectRatio']
      break

    case 'captionStyle':
      if (plan.captions) {
        ;(plan.captions as unknown as Record<string, unknown>).style = newValue
      }
      break

    case 'pacing':
      // Adjust dialogue duration (approximate by modifying canvas duration)
      {
        const multiplier = newValue === 'fast' ? 0.75 : newValue === 'slow' ? 1.5 : 1.0
        plan.canvas.durationSeconds = Math.round(plan.canvas.durationSeconds * multiplier)
      }
      break

    default:
      break
  }

  return plan
}
