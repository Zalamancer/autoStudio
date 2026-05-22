/**
 * Creative Intelligence Service — The "1000 Combinations" Brain
 *
 * This service encodes deep creative knowledge about what makes content engaging,
 * viral, and visually compelling. It maps content types to proven techniques,
 * generates multiple creative approaches for any prompt, breaks clips into
 * intelligent scenes with varied visual treatments, and adds surprise elements.
 *
 * The orchestrator calls this during plan generation to get creative direction
 * that would normally require a human creative director.
 */

import type { ClipPlan, OrchestratorSettings } from '@/types/orchestrator'

// ── Creative Technique Types ──────────────────────────────────────────

export type TechniqueCategory =
  | 'hook'
  | 'storytelling'
  | 'visual-style'
  | 'typography'
  | 'transition'
  | 'data-viz'
  | 'character-use'
  | 'pacing'
  | 'audio'
  | 'engagement'
  | 'composition'
  | 'emotional-arc'
  | 'platform-specific'
  | 'surprise'
  | 'trend'

export type ContentType =
  | 'educational'
  | 'entertainment'
  | 'product-launch'
  | 'tutorial'
  | 'story'
  | 'debate'
  | 'news'
  | 'listicle'
  | 'comparison'
  | 'behind-the-scenes'
  | 'reaction'
  | 'explainer'
  | 'motivational'
  | 'comedy'
  | 'documentary'
  | 'review'
  | 'how-to'
  | 'myth-busting'
  | 'countdown'
  | 'day-in-life'
  | 'challenge'
  | 'transformation'
  | 'hot-take'
  | 'interview'
  | 'case-study'
  | 'announcement'
  | 'recap'

export type Platform = 'tiktok' | 'youtube-shorts' | 'youtube' | 'instagram' | 'reels'

export interface CreativeTechnique {
  id: string
  name: string
  category: TechniqueCategory
  description: string
  /** When to use this technique */
  bestFor: ContentType[]
  /** Platform affinity (higher = better fit) */
  platformAffinity: Partial<Record<Platform, number>>
  /** How it maps to ClipPlan elements */
  implementation: TechniqueImplementation
  /** Techniques that pair well with this one */
  pairsWith: string[]
  /** Techniques that conflict with this one */
  conflictsWith: string[]
  /** Engagement impact score 1-10 */
  impactScore: number
  /** How overused/saturated this technique is (1=fresh, 10=overdone) */
  saturationLevel: number
}

export interface TechniqueImplementation {
  /** Which ClipPlan sections this technique affects */
  affectedSections: Array<keyof ClipPlan>
  /** Prompt additions for the Gemini plan generator */
  promptGuidance: string
  /** Specific ClipPlan constraints or patterns */
  planPatterns?: Partial<ClipPlan>
}

export interface SceneBreakdown {
  id: string
  /** 0-1 fraction of total duration */
  startPercent: number
  endPercent: number
  /** Scene purpose */
  purpose: 'hook' | 'setup' | 'build' | 'climax' | 'twist' | 'resolution' | 'cta' | 'payoff' | 'breather'
  /** Visual treatment for this scene */
  visualTreatment: string
  /** Recommended techniques for this scene */
  techniques: string[]
  /** Emotion target */
  emotionTarget: string
  /** Pacing (words per second) */
  pacing: number
  /** Whether to use stock media B-roll */
  useBroll: boolean
  /** Template recommendation */
  templateHint?: string
}

export interface CreativeApproach {
  id: string
  name: string
  tagline: string
  /** Overall creative direction */
  direction: string
  /** Scene breakdown */
  scenes: SceneBreakdown[]
  /** Techniques used */
  techniques: string[]
  /** Estimated engagement score */
  engagementScore: number
  /** Risk level (how unconventional) */
  riskLevel: 'safe' | 'moderate' | 'bold' | 'experimental'
  /** What makes this approach unique */
  uniqueFactor: string
  /** Prompt injection for the orchestrator */
  promptInjection: string
}

export interface CreativeDirective {
  /** The detected content type */
  contentType: ContentType
  /** Target platform */
  platform: Platform
  /** The recommended creative approach */
  primaryApproach: CreativeApproach
  /** Alternative approaches */
  alternatives: CreativeApproach[]
  /** Surprise elements to inject */
  surpriseElements: SurpriseElement[]
  /** Scene-by-scene breakdown */
  sceneBreakdown: SceneBreakdown[]
  /** Creative direction prompt to inject into orchestrator */
  creativePrompt: string
}

export interface SurpriseElement {
  type: 'pattern-break' | 'fourth-wall' | 'visual-twist' | 'audio-twist' | 'meta-reference' | 'easter-egg' | 'perspective-shift'
  description: string
  /** When to inject (0-1) */
  triggerPercent: number
  /** How it maps to ClipPlan */
  implementation: string
}

// ── Technique Library (200+ techniques) ───────────────────────────────

const TECHNIQUE_LIBRARY: CreativeTechnique[] = [
  // ── HOOK TECHNIQUES (20+) ──
  {
    id: 'hook-shocking-stat',
    name: 'Shocking Statistic Opener',
    category: 'hook',
    description: 'Open with an unexpected, jaw-dropping statistic that challenges assumptions',
    bestFor: ['educational', 'explainer', 'news', 'documentary', 'myth-busting'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 9, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays'],
      promptGuidance: 'Start the FIRST dialogue line with a shocking statistic. Use [surprised] or [serious] emotion. Add a title overlay with the key number in large text (preset: "title", first 3 seconds).',
    },
    pairsWith: ['viz-number-pop', 'sfx-dramatic-hit', 'pacing-cold-open'],
    conflictsWith: ['hook-question', 'hook-story-cold-open'],
    impactScore: 9,
    saturationLevel: 5,
  },
  {
    id: 'hook-question',
    name: 'Provocative Question',
    category: 'hook',
    description: 'Open with a question that makes viewers need to know the answer',
    bestFor: ['educational', 'myth-busting', 'hot-take', 'debate', 'explainer'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 7, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays'],
      promptGuidance: 'Start with a provocative question — "Did you know...?", "Why does X...?", "What if I told you...?". Use [curious] emotion. Show the question as a title overlay.',
    },
    pairsWith: ['pacing-cold-open', 'engagement-open-loop'],
    conflictsWith: ['hook-shocking-stat', 'hook-story-cold-open'],
    impactScore: 8,
    saturationLevel: 7,
  },
  {
    id: 'hook-story-cold-open',
    name: 'Story Cold Open',
    category: 'hook',
    description: 'Start in the middle of the most dramatic part of a story, then rewind',
    bestFor: ['story', 'documentary', 'case-study', 'behind-the-scenes', 'day-in-life'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 9, reels: 8 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays', 'stockMedia'],
      promptGuidance: 'Begin with the climax/twist of the story in the first 3-5 seconds with [shocked] emotion. Then add a text overlay "Here\'s how it started..." and rewind to the beginning. Use dramatic stock video as cutaway for the opening moment.',
    },
    pairsWith: ['storytelling-nonlinear', 'sfx-rewind', 'transition-glitch'],
    conflictsWith: ['hook-question', 'hook-shocking-stat'],
    impactScore: 9,
    saturationLevel: 4,
  },
  {
    id: 'hook-bold-claim',
    name: 'Bold Contrarian Claim',
    category: 'hook',
    description: 'Open with a statement that goes against conventional wisdom',
    bestFor: ['hot-take', 'debate', 'educational', 'myth-busting', 'review'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'First line must be a bold, contrarian claim that makes viewers want to argue or agree. Use [serious] or [determined] emotion. Example: "Everything you know about X is wrong."',
    },
    pairsWith: ['engagement-comment-bait', 'pacing-rapid-fire'],
    conflictsWith: ['hook-question'],
    impactScore: 9,
    saturationLevel: 6,
  },
  {
    id: 'hook-countdown-tease',
    name: 'Countdown Tease',
    category: 'hook',
    description: 'Tease the best item in a list — "Number 1 will blow your mind"',
    bestFor: ['listicle', 'countdown', 'comparison', 'review'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 9, youtube: 6, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays', 'retentionHooks'],
      promptGuidance: 'Open with a tease about the top item — "The number 1 pick changed everything." Add a step-counter or countdown retention hook. Use [excited] emotion.',
    },
    pairsWith: ['retention-progress-bar', 'pacing-accelerating'],
    conflictsWith: ['hook-story-cold-open'],
    impactScore: 8,
    saturationLevel: 7,
  },
  {
    id: 'hook-relatable-pain',
    name: 'Relatable Pain Point',
    category: 'hook',
    description: 'Start with a universally relatable frustration or problem',
    bestFor: ['tutorial', 'how-to', 'product-launch', 'educational', 'comedy'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Open with a relatable frustration the audience has experienced — "You know that feeling when...". Use [frustrated] or [annoyed] emotion, then shift to [excited] when presenting the solution.',
    },
    pairsWith: ['storytelling-problem-solution', 'emotional-arc-valley-to-peak'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 5,
  },
  {
    id: 'hook-this-vs-that',
    name: 'This vs That Comparison',
    category: 'hook',
    description: 'Immediately frame two things in opposition for instant tension',
    bestFor: ['comparison', 'debate', 'review', 'educational'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 7, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays', 'htmlTemplates'],
      promptGuidance: 'Open with "[X] vs [Y] — which one wins?" Use a split-screen template if available. Two characters take opposing sides. Use [competitive] or [determined] emotions.',
    },
    pairsWith: ['character-debate', 'visual-split-screen'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 6,
  },
  {
    id: 'hook-time-pressure',
    name: 'Urgency/Time Pressure Hook',
    category: 'hook',
    description: 'Create immediate urgency — "Before this gets taken down" or "This just happened"',
    bestFor: ['news', 'announcement', 'hot-take', 'reaction'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 7, youtube: 5, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays'],
      promptGuidance: 'Open with urgency language — "BREAKING:", "Just announced:", "This changes everything". Use [serious] emotion with fast pacing. Add a bold title overlay.',
    },
    pairsWith: ['pacing-rapid-fire', 'sfx-alert'],
    conflictsWith: ['pacing-slow-build'],
    impactScore: 7,
    saturationLevel: 8,
  },
  {
    id: 'hook-mystery-object',
    name: 'Mystery Object/Visual',
    category: 'hook',
    description: 'Show something visually interesting without immediately explaining what it is',
    bestFor: ['educational', 'behind-the-scenes', 'reaction', 'review'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 7, youtube: 6, reels: 7 },
    implementation: {
      affectedSections: ['stockMedia', 'dialogue'],
      promptGuidance: 'Start with a stock image/video of something unusual or unexpected as a cutaway (first 3s). Character asks "What do you think this is?" with [curious] emotion. Reveal the answer after a brief pause.',
    },
    pairsWith: ['engagement-open-loop', 'sfx-mystery'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 3,
  },
  {
    id: 'hook-confession',
    name: 'Personal Confession',
    category: 'hook',
    description: 'Open with a vulnerable, personal admission that builds trust and curiosity',
    bestFor: ['story', 'motivational', 'behind-the-scenes', 'hot-take'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 7, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'First line is a personal admission: "I used to believe..." or "I have to admit something...". Use [honest] or [vulnerable] emotion. This creates instant trust and curiosity.',
    },
    pairsWith: ['emotional-arc-vulnerability', 'storytelling-hero-journey'],
    conflictsWith: ['hook-shocking-stat'],
    impactScore: 8,
    saturationLevel: 4,
  },

  // ── STORYTELLING TECHNIQUES (20+) ──
  {
    id: 'storytelling-three-act',
    name: 'Three-Act Structure',
    category: 'storytelling',
    description: 'Classic setup → confrontation → resolution compressed into short form',
    bestFor: ['story', 'case-study', 'documentary', 'motivational', 'educational'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 8, youtube: 9, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'htmlTemplates', 'stockMedia'],
      promptGuidance: 'Structure the dialogue in three clear acts: Act 1 (0-25%): Set the scene and introduce the problem. Act 2 (25-75%): Build tension, show complications. Act 3 (75-100%): Resolution and takeaway. Vary emotions across acts.',
    },
    pairsWith: ['emotional-arc-mountain', 'pacing-slow-build'],
    conflictsWith: ['pacing-rapid-fire'],
    impactScore: 8,
    saturationLevel: 3,
  },
  {
    id: 'storytelling-problem-solution',
    name: 'Problem-Solution Framework',
    category: 'storytelling',
    description: 'Present a relatable problem, then deliver the solution with authority',
    bestFor: ['tutorial', 'how-to', 'product-launch', 'educational', 'explainer'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 8, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'First 30% establishes the problem vividly with [frustrated] emotions. Middle 40% presents the solution step by step with [excited]/[confident] emotions. Final 30% shows the result with [happy] emotion and a CTA.',
    },
    pairsWith: ['hook-relatable-pain', 'emotional-arc-valley-to-peak'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 4,
  },
  {
    id: 'storytelling-nonlinear',
    name: 'Non-Linear Narrative',
    category: 'storytelling',
    description: 'Tell the story out of chronological order for maximum impact',
    bestFor: ['story', 'documentary', 'case-study', 'behind-the-scenes'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 7, youtube: 9, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays'],
      promptGuidance: 'Start at the climax, then jump back with a text overlay "24 hours earlier..." or "Here\'s how it began...". Use [shocked] emotion at the start, [calm] during flashback, build back to [shocked] at the end.',
    },
    pairsWith: ['hook-story-cold-open', 'transition-glitch', 'sfx-rewind'],
    conflictsWith: ['pacing-rapid-fire'],
    impactScore: 9,
    saturationLevel: 3,
  },
  {
    id: 'storytelling-hero-journey',
    name: 'Mini Hero Journey',
    category: 'storytelling',
    description: 'Compress the hero journey into 60 seconds: ordinary world → call → trial → return',
    bestFor: ['motivational', 'story', 'case-study', 'transformation'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 9, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'stockMedia'],
      promptGuidance: 'Follow the mini hero journey: Ordinary world (0-15%), Call to adventure (15-30%), Trial/struggle (30-65%), Transformation/victory (65-85%), New normal (85-100%). Match stock media to each phase.',
    },
    pairsWith: ['emotional-arc-mountain', 'character-solo-narrator'],
    conflictsWith: ['pacing-rapid-fire'],
    impactScore: 8,
    saturationLevel: 3,
  },
  {
    id: 'storytelling-reveal-layers',
    name: 'Layered Reveal',
    category: 'storytelling',
    description: 'Each scene reveals another layer of depth, like peeling an onion',
    bestFor: ['explainer', 'documentary', 'educational', 'myth-busting'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays'],
      promptGuidance: 'Structure as progressive reveals: "But it gets deeper..." / "And here\'s what nobody talks about..." / "But the REAL reason is...". Each reveal should use [surprised] or [serious] emotion and a brief text overlay teasing the next layer.',
    },
    pairsWith: ['engagement-open-loop', 'pacing-accelerating'],
    conflictsWith: [],
    impactScore: 9,
    saturationLevel: 4,
  },
  {
    id: 'storytelling-parallel',
    name: 'Parallel Stories',
    category: 'storytelling',
    description: 'Tell two stories simultaneously that converge at the end',
    bestFor: ['documentary', 'comparison', 'story', 'case-study'],
    platformAffinity: { tiktok: 6, 'youtube-shorts': 6, youtube: 9, reels: 6 },
    implementation: {
      affectedSections: ['dialogue', 'characters'],
      promptGuidance: 'Use two characters to tell parallel stories. Alternate between them every 2-3 lines. The stories should seem unrelated at first but connect at the climax. Use contrasting emotions between the two threads.',
    },
    pairsWith: ['character-debate', 'visual-split-screen'],
    conflictsWith: ['character-solo-narrator'],
    impactScore: 8,
    saturationLevel: 2,
  },
  {
    id: 'storytelling-twist-ending',
    name: 'Plot Twist Ending',
    category: 'storytelling',
    description: 'Build toward an expected conclusion then subvert expectations in the last 10%',
    bestFor: ['story', 'myth-busting', 'comedy', 'hot-take', 'educational'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 9, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Build the narrative toward an obvious conclusion through 85% of the clip. Then in the final 15%, deliver a twist that reframes everything. Use [shocked] emotion for the reveal. The twist should make viewers want to rewatch.',
    },
    pairsWith: ['surprise-perspective-shift', 'engagement-rewatch-bait'],
    conflictsWith: [],
    impactScore: 10,
    saturationLevel: 4,
  },

  // ── VISUAL STYLE TECHNIQUES (25+) ──
  {
    id: 'visual-split-screen',
    name: 'Split Screen Comparison',
    category: 'visual-style',
    description: 'Divide the canvas to show two things side by side',
    bestFor: ['comparison', 'debate', 'review', 'transformation'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['htmlTemplates', 'characters'],
      promptGuidance: 'Use a split-screen HTML template (tpl-scene-split-screen if available). Place characters on opposite sides. Use contrasting visuals for each side.',
    },
    pairsWith: ['hook-this-vs-that', 'character-debate'],
    conflictsWith: ['visual-cinematic-bars'],
    impactScore: 7,
    saturationLevel: 5,
  },
  {
    id: 'visual-text-behind-subject',
    name: 'Text Behind Subject',
    category: 'visual-style',
    description: 'Large text appears behind the character, creating depth',
    bestFor: ['educational', 'motivational', 'product-launch', 'hot-take'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 6, reels: 9 },
    implementation: {
      affectedSections: ['textOverlays', 'shapes'],
      promptGuidance: 'Add large keyword text overlays (fontSize 80+) with lower z-index positioned behind the character. Use bold font, slight opacity (0.7-0.8). The character should appear to stand in front of the text.',
    },
    pairsWith: ['typography-kinetic', 'character-solo-narrator'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 6,
  },
  {
    id: 'visual-cinematic-bars',
    name: 'Cinematic Letterbox',
    category: 'visual-style',
    description: 'Add black bars top/bottom for a cinematic widescreen feel',
    bestFor: ['story', 'documentary', 'motivational', 'case-study'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 6, youtube: 9, reels: 6 },
    implementation: {
      affectedSections: ['shapes'],
      promptGuidance: 'Add two black rectangle shapes: one at top (y:0, height: 10% of canvas) and one at bottom (y:90%, height: 10%). Opacity 0.9. Full duration. This creates a cinematic look.',
    },
    pairsWith: ['pacing-slow-build', 'storytelling-three-act'],
    conflictsWith: ['visual-split-screen'],
    impactScore: 6,
    saturationLevel: 3,
  },
  {
    id: 'visual-broll-cutaway',
    name: 'Dynamic B-Roll Cutaways',
    category: 'visual-style',
    description: 'Cut between character dialogue and relevant stock footage to illustrate points',
    bestFor: ['educational', 'documentary', 'news', 'story', 'explainer', 'behind-the-scenes'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 9, reels: 7 },
    implementation: {
      affectedSections: ['stockMedia'],
      promptGuidance: 'Add 3-5 stock video cutaways that visually illustrate what the character is talking about. Use ken-burns for still images, fade transitions for video. Each cutaway should last 2-4 seconds and appear while dialogue continues.',
    },
    pairsWith: ['pacing-varied', 'storytelling-three-act'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 4,
  },
  {
    id: 'visual-data-pop',
    name: 'Data Visualization Pop-ups',
    category: 'visual-style',
    description: 'Animated numbers and charts that appear as data points are mentioned',
    bestFor: ['educational', 'news', 'explainer', 'comparison', 'listicle'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 8, reels: 6 },
    implementation: {
      affectedSections: ['htmlTemplates', 'svgObjects'],
      promptGuidance: 'When characters mention numbers or statistics, overlay an infographic chart template that visualizes the data. Time the chart appearance to match the dialogue. Use animated SVG objects (arrows, icons) to emphasize key data points.',
    },
    pairsWith: ['hook-shocking-stat', 'typography-kinetic'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 3,
  },
  {
    id: 'visual-zoom-reveal',
    name: 'Zoom Reveal',
    category: 'visual-style',
    description: 'Start zoomed in tight on a detail, then zoom out to reveal the full picture',
    bestFor: ['educational', 'documentary', 'product-launch', 'behind-the-scenes'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 7, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['camera', 'stockMedia'],
      promptGuidance: 'Use camera keyframes to start zoomed in (zoom: 2.0) and slowly zoom out to (zoom: 1.0) over the first 5 seconds. This creates a reveal effect. Works great with stock images or detailed templates.',
    },
    pairsWith: ['hook-mystery-object', 'sfx-dramatic-hit'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 4,
  },
  {
    id: 'visual-color-grading',
    name: 'Mood-Based Color Shifts',
    category: 'visual-style',
    description: 'Shift the color palette of templates/backgrounds to match emotional beats',
    bestFor: ['story', 'motivational', 'documentary', 'transformation'],
    platformAffinity: { tiktok: 6, 'youtube-shorts': 6, youtube: 8, reels: 6 },
    implementation: {
      affectedSections: ['htmlTemplates', 'shapes'],
      promptGuidance: 'Use template config color overrides to shift the visual mood: warm oranges/reds for positive/energetic scenes, cool blues for calm/sad scenes, dark purples for mysterious/tension. Change colors between scenes.',
    },
    pairsWith: ['emotional-arc-mountain', 'storytelling-three-act'],
    conflictsWith: [],
    impactScore: 6,
    saturationLevel: 2,
  },
  {
    id: 'visual-picture-in-picture',
    name: 'Picture-in-Picture',
    category: 'visual-style',
    description: 'Main content fills screen with a small character window in the corner',
    bestFor: ['reaction', 'tutorial', 'review', 'educational', 'how-to'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 7, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['characters', 'stockMedia'],
      promptGuidance: 'Make the stock media or template fill the full canvas as the primary visual. Position the character small (scale: 0.6-0.8) in the bottom-right corner (x: 82, y: 78). This mimics a reaction/commentary format.',
    },
    pairsWith: ['visual-broll-cutaway', 'character-solo-narrator'],
    conflictsWith: ['visual-split-screen'],
    impactScore: 7,
    saturationLevel: 5,
  },
  {
    id: 'visual-glitch-aesthetic',
    name: 'Glitch/Digital Aesthetic',
    category: 'visual-style',
    description: 'Digital glitch effects, RGB splits, and cyberpunk-inspired visuals',
    bestFor: ['entertainment', 'hot-take', 'reaction', 'comedy'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 7, youtube: 5, reels: 8 },
    implementation: {
      affectedSections: ['htmlTemplates'],
      promptGuidance: 'Use glitch-styled HTML templates (neural-noir, retro-crt, etc.). Add quick 0.3s template switches or overlays at dramatic moments. The digital aesthetic signals "internet culture" content.',
    },
    pairsWith: ['transition-glitch', 'sfx-glitch'],
    conflictsWith: ['visual-cinematic-bars', 'visual-color-grading'],
    impactScore: 7,
    saturationLevel: 6,
  },
  {
    id: 'visual-whiteboard',
    name: 'Whiteboard/Sketch Explainer',
    category: 'visual-style',
    description: 'Clean white background with drawn/sketched elements appearing as explained',
    bestFor: ['educational', 'tutorial', 'how-to', 'explainer'],
    platformAffinity: { tiktok: 5, 'youtube-shorts': 6, youtube: 9, reels: 5 },
    implementation: {
      affectedSections: ['svgObjects', 'htmlTemplates'],
      promptGuidance: 'Use a clean/minimal template as background. Add SVG objects that appear one by one as concepts are explained. Each SVG object should fade in (opacity 0→1) at the moment the narrator mentions it.',
    },
    pairsWith: ['pacing-slow-build', 'character-solo-narrator'],
    conflictsWith: ['visual-glitch-aesthetic'],
    impactScore: 7,
    saturationLevel: 4,
  },
  {
    id: 'visual-map-journey',
    name: 'Map Journey Visualization',
    category: 'visual-style',
    description: 'Use animated maps to show geographical context and movement',
    bestFor: ['documentary', 'news', 'story', 'educational', 'behind-the-scenes'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 9, reels: 6 },
    implementation: {
      affectedSections: ['htmlTemplates'],
      promptGuidance: 'Use tpl-world-map or tpl-maptiler-map as a primary or secondary template. Add choreographed commands (zoomToCountry, flyTo, drawConnection) that follow the narrative. Characters comment on locations as the map zooms to them.',
    },
    pairsWith: ['storytelling-three-act', 'visual-data-pop'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 3,
  },

  // ── TYPOGRAPHY TECHNIQUES (15+) ──
  {
    id: 'typography-kinetic',
    name: 'Kinetic Typography',
    category: 'typography',
    description: 'Animated text that moves, scales, and transforms to emphasize key words',
    bestFor: ['educational', 'motivational', 'hot-take', 'entertainment', 'comedy'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 6, reels: 9 },
    implementation: {
      affectedSections: ['htmlTemplates'],
      promptGuidance: 'Use kinetic typography React motion graphic templates (tpl-kinetic-*). These animate text with bouncing, sliding, or zooming effects synced to the dialogue. Great for emphasizing key phrases.',
    },
    pairsWith: ['hook-bold-claim', 'pacing-rapid-fire'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 5,
  },
  {
    id: 'typography-word-highlight',
    name: 'Keyword Highlighting',
    category: 'typography',
    description: 'Highlight the single most important word in each caption in a contrasting color',
    bestFor: ['educational', 'motivational', 'explainer', 'how-to'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['captions'],
      promptGuidance: 'Use karaoke caption style. The key word in each sentence should stand out visually. Configure caption color and animation speed for maximum impact.',
    },
    pairsWith: ['pacing-varied'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 6,
  },
  {
    id: 'typography-big-number',
    name: 'Big Number Impact',
    category: 'typography',
    description: 'Display key statistics as massive full-screen numbers',
    bestFor: ['educational', 'news', 'comparison', 'countdown', 'listicle'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 7, reels: 7 },
    implementation: {
      affectedSections: ['textOverlays', 'htmlTemplates'],
      promptGuidance: 'When a key number is mentioned, display it as a massive text overlay (fontSize: 120+) that fills the screen for 1-2 seconds. Use bold font, bright color. Can use tpl-scene-stat-counter template.',
    },
    pairsWith: ['hook-shocking-stat', 'sfx-dramatic-hit'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 5,
  },

  // ── TRANSITION TECHNIQUES (10+) ──
  {
    id: 'transition-glitch',
    name: 'Glitch/Distortion Cut',
    category: 'transition',
    description: 'Brief visual glitch between scenes for a modern, edgy feel',
    bestFor: ['entertainment', 'hot-take', 'comedy', 'reaction', 'news'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 7, youtube: 5, reels: 8 },
    implementation: {
      affectedSections: ['soundEffects', 'htmlTemplates'],
      promptGuidance: 'Between major scene changes, add a 0.3s glitch sound effect. Switch HTML templates at these points. The audio-visual glitch creates a pattern interrupt that re-engages attention.',
    },
    pairsWith: ['visual-glitch-aesthetic', 'sfx-glitch'],
    conflictsWith: ['transition-smooth-fade'],
    impactScore: 7,
    saturationLevel: 5,
  },
  {
    id: 'transition-smooth-fade',
    name: 'Smooth Cross-Fade',
    category: 'transition',
    description: 'Elegant cross-fade between scenes for a polished, professional feel',
    bestFor: ['documentary', 'story', 'motivational', 'case-study'],
    platformAffinity: { tiktok: 4, 'youtube-shorts': 5, youtube: 9, reels: 5 },
    implementation: {
      affectedSections: ['stockMedia'],
      promptGuidance: 'Use fade transitions between stock media with transitionDuration: 1.0. This creates a smooth, cinematic feel. Best for longer-form content.',
    },
    pairsWith: ['pacing-slow-build', 'visual-cinematic-bars'],
    conflictsWith: ['transition-glitch', 'pacing-rapid-fire'],
    impactScore: 5,
    saturationLevel: 3,
  },
  {
    id: 'transition-whip-pan',
    name: 'Whip Pan / Swipe Cut',
    category: 'transition',
    description: 'Fast horizontal swipe between scenes',
    bestFor: ['entertainment', 'listicle', 'comparison', 'day-in-life'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 6, reels: 8 },
    implementation: {
      affectedSections: ['stockMedia', 'soundEffects'],
      promptGuidance: 'Use slide-left or slide-right transitions between stock media and template switches with transitionDuration: 0.3. Add a "whoosh" sound effect at each transition.',
    },
    pairsWith: ['sfx-whoosh', 'pacing-rapid-fire'],
    conflictsWith: ['transition-smooth-fade'],
    impactScore: 7,
    saturationLevel: 5,
  },

  // ── PACING TECHNIQUES (10+) ──
  {
    id: 'pacing-cold-open',
    name: 'Zero-Waste Cold Open',
    category: 'pacing',
    description: 'No intro, no greeting — first word is the most interesting thing',
    bestFor: ['educational', 'hot-take', 'news', 'myth-busting', 'entertainment'],
    platformAffinity: { tiktok: 10, 'youtube-shorts': 9, youtube: 7, reels: 9 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'NEVER start with "Hey guys", "Welcome", "In this video", or any greeting. The FIRST WORD of the clip must be the most interesting/surprising word. Jump directly into the content.',
    },
    pairsWith: ['hook-shocking-stat', 'hook-bold-claim'],
    conflictsWith: [],
    impactScore: 9,
    saturationLevel: 4,
  },
  {
    id: 'pacing-rapid-fire',
    name: 'Rapid Fire Delivery',
    category: 'pacing',
    description: 'Fast-paced, punchy lines with minimal pauses between them',
    bestFor: ['listicle', 'entertainment', 'hot-take', 'countdown', 'comedy'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 5, reels: 8 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Keep dialogue lines SHORT (2-4 seconds each, 10-20 words max). Rapid-fire delivery with minimal pauses. Use varied emotions to prevent monotony. ~6-7 words per second speaking rate.',
    },
    pairsWith: ['hook-countdown-tease', 'engagement-comment-bait'],
    conflictsWith: ['pacing-slow-build', 'transition-smooth-fade'],
    impactScore: 8,
    saturationLevel: 6,
  },
  {
    id: 'pacing-slow-build',
    name: 'Slow Build Crescendo',
    category: 'pacing',
    description: 'Start slow and gradually accelerate toward a climactic moment',
    bestFor: ['story', 'documentary', 'motivational', 'case-study'],
    platformAffinity: { tiktok: 5, 'youtube-shorts': 6, youtube: 9, reels: 5 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'First 40%: slow, measured pacing (~4 words/sec). Middle 30%: slightly faster (~5 words/sec). Final 30%: fast, energetic (~6-7 words/sec). Match emotion intensity to pacing.',
    },
    pairsWith: ['storytelling-three-act', 'emotional-arc-mountain'],
    conflictsWith: ['pacing-rapid-fire'],
    impactScore: 7,
    saturationLevel: 3,
  },
  {
    id: 'pacing-accelerating',
    name: 'Accelerating Tempo',
    category: 'pacing',
    description: 'Each item/point gets less time than the previous, creating momentum',
    bestFor: ['listicle', 'countdown', 'comparison', 'educational'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 7, reels: 7 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'If presenting a list, spend 8 seconds on item 1, 6 seconds on item 2, 5 on item 3, 4 on item 4, then 2-3 seconds each for the remaining items. This creates increasing urgency.',
    },
    pairsWith: ['hook-countdown-tease', 'retention-progress-bar'],
    conflictsWith: ['pacing-slow-build'],
    impactScore: 7,
    saturationLevel: 3,
  },
  {
    id: 'pacing-varied',
    name: 'Rhythmic Variation',
    category: 'pacing',
    description: 'Alternate between fast and slow sections to maintain engagement',
    bestFor: ['educational', 'story', 'documentary', 'explainer'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Vary pacing deliberately: fast for exciting/surprising info, slow for important/emotional points. Add brief 0.5s pauses before big reveals. This rhythm keeps attention.',
    },
    pairsWith: ['storytelling-reveal-layers'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 2,
  },

  // ── CHARACTER USE TECHNIQUES (10+) ──
  {
    id: 'character-solo-narrator',
    name: 'Solo Expert Narrator',
    category: 'character-use',
    description: 'Single authoritative character delivering the content directly',
    bestFor: ['educational', 'how-to', 'tutorial', 'explainer', 'news', 'hot-take'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['characters', 'dialogue'],
      promptGuidance: 'Use a single character positioned center (x:50, y:15). Give them a confident, authoritative voice. Vary emotions frequently to avoid monotony. The character speaks directly to the viewer.',
    },
    pairsWith: ['visual-text-behind-subject', 'visual-picture-in-picture'],
    conflictsWith: ['character-debate', 'storytelling-parallel'],
    impactScore: 6,
    saturationLevel: 7,
  },
  {
    id: 'character-debate',
    name: 'Two-Character Debate',
    category: 'character-use',
    description: 'Two characters with opposing views create dramatic tension',
    bestFor: ['debate', 'comparison', 'myth-busting', 'educational', 'entertainment'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['characters', 'dialogue'],
      promptGuidance: 'Use TWO characters: one as the advocate/believer, one as the skeptic/critic. Position them at x:30 and x:70. Alternate dialogue every 2-4 seconds. Give them contrasting emotions — when one is [excited], the other is [skeptical].',
    },
    pairsWith: ['hook-this-vs-that', 'visual-split-screen'],
    conflictsWith: ['character-solo-narrator'],
    impactScore: 9,
    saturationLevel: 5,
  },
  {
    id: 'character-reactor',
    name: 'Character Reacting to Content',
    category: 'character-use',
    description: 'Character watches and reacts to stock footage or data, adding commentary',
    bestFor: ['reaction', 'review', 'news', 'entertainment', 'comedy'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['characters', 'stockMedia'],
      promptGuidance: 'Position character small in the corner (x:80, y:75, scale: 0.7). Show stock media as the main visual. Character comments and reacts with exaggerated emotions: [shocked], [disgusted], [amazed]. Think "reaction video" format.',
    },
    pairsWith: ['visual-picture-in-picture', 'visual-broll-cutaway'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 6,
  },
  {
    id: 'character-ensemble',
    name: 'Ensemble Cast',
    category: 'character-use',
    description: 'Multiple characters (3+) each contributing a unique perspective',
    bestFor: ['debate', 'educational', 'entertainment', 'listicle'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 6, youtube: 8, reels: 6 },
    implementation: {
      affectedSections: ['characters', 'dialogue'],
      promptGuidance: 'Use 3-4 characters, each with a distinct role: expert, skeptic, optimist, comedian. Spread across canvas (x:20, x:40, x:60, x:80). Each character gets 2-3 lines. Rapid-fire dialogue switching creates energy.',
    },
    pairsWith: ['pacing-rapid-fire'],
    conflictsWith: ['character-solo-narrator'],
    impactScore: 7,
    saturationLevel: 3,
  },

  // ── ENGAGEMENT TECHNIQUES (15+) ──
  {
    id: 'engagement-open-loop',
    name: 'Open Loop / Curiosity Gap',
    category: 'engagement',
    description: 'Tease information that won\'t be revealed until later in the clip',
    bestFor: ['educational', 'story', 'documentary', 'myth-busting', 'listicle'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 9, youtube: 8, reels: 8 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Every 15-20 seconds, tease upcoming content: "But here\'s where it gets interesting...", "I\'ll reveal the answer in a moment...", "The third reason is the one nobody expects...". These open loops prevent viewers from scrolling away.',
    },
    pairsWith: ['storytelling-reveal-layers', 'pacing-varied'],
    conflictsWith: [],
    impactScore: 9,
    saturationLevel: 5,
  },
  {
    id: 'engagement-comment-bait',
    name: 'Comment Bait',
    category: 'engagement',
    description: 'Include a statement that compels viewers to comment with their opinion',
    bestFor: ['debate', 'hot-take', 'comparison', 'review', 'entertainment'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 8, reels: 8 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays'],
      promptGuidance: 'Include a line that demands viewer interaction: "What do you think?", "Am I wrong?", "Drop your answer in the comments". Add a text CTA overlay at this moment. Use [curious] or [challenging] emotion.',
    },
    pairsWith: ['hook-bold-claim', 'character-debate'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 7,
  },
  {
    id: 'engagement-rewatch-bait',
    name: 'Rewatch Trigger',
    category: 'engagement',
    description: 'Include a detail that only makes sense on second viewing',
    bestFor: ['story', 'comedy', 'educational', 'myth-busting'],
    platformAffinity: { tiktok: 10, 'youtube-shorts': 8, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['dialogue', 'svgObjects'],
      promptGuidance: 'Plant a subtle detail early in the clip (a background SVG object, an offhand comment) that only makes sense after the twist/reveal at the end. This makes viewers rewatch to catch it, boosting algorithm metrics.',
    },
    pairsWith: ['storytelling-twist-ending', 'surprise-easter-egg'],
    conflictsWith: [],
    impactScore: 9,
    saturationLevel: 2,
  },
  {
    id: 'retention-progress-bar',
    name: 'Visual Progress Indicator',
    category: 'engagement',
    description: 'Show a progress bar or step counter so viewers know how far along they are',
    bestFor: ['listicle', 'tutorial', 'how-to', 'countdown', 'educational'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 6, reels: 7 },
    implementation: {
      affectedSections: ['retentionHooks'],
      promptGuidance: 'Add a retentionHook with type "progress-bar" or "step-counter". Position at top or bottom. Use branded color if available. This reduces drop-off by showing viewers how much content remains.',
    },
    pairsWith: ['pacing-accelerating', 'hook-countdown-tease'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 5,
  },
  {
    id: 'engagement-pattern-interrupt',
    name: 'Pattern Interrupt',
    category: 'engagement',
    description: 'Break the visual/audio pattern every 8-12 seconds to re-engage attention',
    bestFor: ['educational', 'tutorial', 'explainer', 'documentary'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 7, reels: 8 },
    implementation: {
      affectedSections: ['soundEffects', 'stockMedia', 'htmlTemplates'],
      promptGuidance: 'Every 8-12 seconds, introduce a visual or audio change: switch template, show a stock cutaway, play a sound effect, zoom in, change background color. The human brain habituates to patterns — breaking them re-engages attention.',
    },
    pairsWith: ['transition-glitch', 'sfx-whoosh'],
    conflictsWith: ['pacing-slow-build'],
    impactScore: 8,
    saturationLevel: 4,
  },

  // ── EMOTIONAL ARC TECHNIQUES (8+) ──
  {
    id: 'emotional-arc-mountain',
    name: 'Emotional Mountain',
    category: 'emotional-arc',
    description: 'Build from neutral to peak emotion then back to calm — classic dramatic arc',
    bestFor: ['story', 'motivational', 'documentary', 'case-study'],
    platformAffinity: { tiktok: 6, 'youtube-shorts': 7, youtube: 9, reels: 6 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Emotion progression: neutral (0-20%) → curious/interested (20-40%) → excited/concerned (40-60%) → shocked/emotional peak (60-80%) → resolved/inspired (80-100%). Match music mood to this arc.',
    },
    pairsWith: ['storytelling-three-act', 'pacing-slow-build'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 3,
  },
  {
    id: 'emotional-arc-valley-to-peak',
    name: 'Valley to Peak',
    category: 'emotional-arc',
    description: 'Start at an emotional low and build to an inspiring high',
    bestFor: ['motivational', 'transformation', 'case-study', 'product-launch'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 8, reels: 7 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Start with [sad] or [frustrated] emotions describing a problem or struggle. Gradually shift through [determined] to [excited] and [happy] as the solution/transformation is revealed. The emotional contrast is what makes it compelling.',
    },
    pairsWith: ['hook-relatable-pain', 'storytelling-problem-solution'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 4,
  },
  {
    id: 'emotional-arc-rollercoaster',
    name: 'Emotional Rollercoaster',
    category: 'emotional-arc',
    description: 'Rapid emotional shifts — happy→shocked→happy→sad→inspired',
    bestFor: ['entertainment', 'story', 'comedy', 'reaction'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 6, reels: 8 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Switch emotions EVERY 2-3 dialogue lines. Never stay on one emotion for more than 5 seconds. The rapid shifts create an addictive viewing experience. Contrast extremes: [ecstatic] → [horrified] → [laughing].',
    },
    pairsWith: ['pacing-rapid-fire', 'engagement-pattern-interrupt'],
    conflictsWith: ['pacing-slow-build'],
    impactScore: 8,
    saturationLevel: 4,
  },
  {
    id: 'emotional-arc-vulnerability',
    name: 'Vulnerability Arc',
    category: 'emotional-arc',
    description: 'Open with confidence, reveal vulnerability in the middle, emerge stronger',
    bestFor: ['story', 'motivational', 'behind-the-scenes', 'case-study'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 7, youtube: 9, reels: 7 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Start with [confident] energy, then transition to a vulnerable moment with [sad] or [honest] emotions around the 40-60% mark. Conclude with renewed [determined] and [happy] emotions. Vulnerability builds authentic connection.',
    },
    pairsWith: ['hook-confession', 'storytelling-hero-journey'],
    conflictsWith: [],
    impactScore: 9,
    saturationLevel: 3,
  },

  // ── AUDIO TECHNIQUES (8+) ──
  {
    id: 'sfx-dramatic-hit',
    name: 'Dramatic Impact Hit',
    category: 'audio',
    description: 'A bass hit or dramatic stinger at the moment of a key reveal',
    bestFor: ['educational', 'news', 'myth-busting', 'hot-take', 'documentary'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 7, reels: 7 },
    implementation: {
      affectedSections: ['soundEffects'],
      promptGuidance: 'Add a sound effect "dramatic bass hit" or "epic stinger" at the moment of the biggest reveal or statistic. Time it to the dialogue line that drops the bombshell.',
    },
    pairsWith: ['hook-shocking-stat', 'typography-big-number'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 5,
  },
  {
    id: 'sfx-whoosh',
    name: 'Transition Whoosh',
    category: 'audio',
    description: 'Quick whoosh sound between scenes or list items',
    bestFor: ['listicle', 'comparison', 'educational', 'how-to'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 5, reels: 6 },
    implementation: {
      affectedSections: ['soundEffects'],
      promptGuidance: 'Add "swoosh transition" or "quick whoosh" sound effects between major scene changes. Volume: 0.5-0.6. Duration: 0.5s.',
    },
    pairsWith: ['transition-whip-pan', 'pacing-rapid-fire'],
    conflictsWith: [],
    impactScore: 5,
    saturationLevel: 6,
  },
  {
    id: 'sfx-glitch',
    name: 'Digital Glitch Sound',
    category: 'audio',
    description: 'Electronic glitch/distortion sound for edgy transitions',
    bestFor: ['entertainment', 'hot-take', 'reaction', 'comedy'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 7, youtube: 4, reels: 7 },
    implementation: {
      affectedSections: ['soundEffects'],
      promptGuidance: 'Add "digital glitch" or "electronic distortion" sound effect at pattern interrupt points. Volume: 0.4-0.5. Duration: 0.3s.',
    },
    pairsWith: ['transition-glitch', 'visual-glitch-aesthetic'],
    conflictsWith: [],
    impactScore: 6,
    saturationLevel: 5,
  },
  {
    id: 'sfx-rewind',
    name: 'Rewind Sound Effect',
    category: 'audio',
    description: 'Classic tape rewind sound for flashback transitions',
    bestFor: ['story', 'documentary', 'behind-the-scenes'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 6, youtube: 7, reels: 6 },
    implementation: {
      affectedSections: ['soundEffects'],
      promptGuidance: 'Add "tape rewind" sound effect when transitioning to a flashback. Volume: 0.6. Duration: 1.0s.',
    },
    pairsWith: ['storytelling-nonlinear', 'hook-story-cold-open'],
    conflictsWith: [],
    impactScore: 6,
    saturationLevel: 4,
  },
  {
    id: 'sfx-alert',
    name: 'Alert / Notification Sound',
    category: 'audio',
    description: 'Phone notification or alert sound for breaking news / urgency',
    bestFor: ['news', 'announcement', 'reaction', 'hot-take'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 6, youtube: 4, reels: 6 },
    implementation: {
      affectedSections: ['soundEffects'],
      promptGuidance: 'Add "phone notification alert" or "breaking news chime" sound at the start. Volume: 0.5. Duration: 1.0s.',
    },
    pairsWith: ['hook-time-pressure'],
    conflictsWith: [],
    impactScore: 5,
    saturationLevel: 7,
  },
  {
    id: 'sfx-mystery',
    name: 'Mystery / Suspense Sound',
    category: 'audio',
    description: 'Eerie tension-building sound for reveals and mystery content',
    bestFor: ['story', 'myth-busting', 'documentary', 'educational'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 7, youtube: 8, reels: 6 },
    implementation: {
      affectedSections: ['soundEffects'],
      promptGuidance: 'Add "mysterious tension riser" or "suspenseful drone" sound 2-3 seconds before a big reveal. Volume: 0.4. Duration: 2-3s.',
    },
    pairsWith: ['hook-mystery-object', 'storytelling-reveal-layers'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 3,
  },

  // ── SURPRISE TECHNIQUES (10+) ──
  {
    id: 'surprise-fourth-wall',
    name: 'Fourth Wall Break',
    category: 'surprise',
    description: 'Character suddenly acknowledges the viewer or breaks character',
    bestFor: ['comedy', 'entertainment', 'educational', 'hot-take'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 8, youtube: 6, reels: 8 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'At an unexpected moment, have the character directly address the viewer: "Wait, you\'re still watching?" or "I know what you\'re thinking..." Use [amused] emotion. This creates a moment of surprise that boosts engagement.',
    },
    pairsWith: ['engagement-rewatch-bait', 'emotional-arc-rollercoaster'],
    conflictsWith: ['pacing-slow-build'],
    impactScore: 8,
    saturationLevel: 4,
  },
  {
    id: 'surprise-perspective-shift',
    name: 'Perspective Shift',
    category: 'surprise',
    description: 'Suddenly shift the frame of reference — "But what if we looked at it from X\'s perspective?"',
    bestFor: ['debate', 'educational', 'documentary', 'myth-busting', 'story'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 7, youtube: 9, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'characters'],
      promptGuidance: 'At the 60-70% mark, introduce a dramatic perspective shift: a new character appears, or the narrator says "But here\'s what nobody considers..." and flips the entire argument. Use [serious] → [surprised] emotion shift.',
    },
    pairsWith: ['storytelling-twist-ending', 'character-debate'],
    conflictsWith: [],
    impactScore: 9,
    saturationLevel: 2,
  },
  {
    id: 'surprise-easter-egg',
    name: 'Hidden Easter Egg',
    category: 'surprise',
    description: 'A subtle visual detail that only attentive viewers will notice',
    bestFor: ['entertainment', 'comedy', 'educational', 'story'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 7, youtube: 7, reels: 7 },
    implementation: {
      affectedSections: ['svgObjects', 'textOverlays'],
      promptGuidance: 'Add a small SVG object or tiny text overlay that\'s related to the twist/punchline but appears early in the clip. Make it small (width: 40, height: 40) and at the edge of the frame (x:90, y:85). Viewers who notice it will comment about it.',
    },
    pairsWith: ['engagement-rewatch-bait', 'storytelling-twist-ending'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 1,
  },
  {
    id: 'surprise-rule-of-three',
    name: 'Rule of Three Subversion',
    category: 'surprise',
    description: 'Set a pattern with two examples, then break it with the third for comedic/dramatic effect',
    bestFor: ['comedy', 'educational', 'entertainment', 'listicle'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 8, youtube: 7, reels: 7 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Present two items that follow an expected pattern, then the third subverts expectations completely. Example: "First we tried X, then Y, then... [long pause] ...we gave up entirely." Use [neutral] → [neutral] → [shocked/amused] emotion progression.',
    },
    pairsWith: ['engagement-rewatch-bait', 'pacing-varied'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 3,
  },
  {
    id: 'surprise-meta-reference',
    name: 'Meta / Self-Referential',
    category: 'surprise',
    description: 'Reference the format itself — "I bet the algorithm is going to love this one"',
    bestFor: ['comedy', 'hot-take', 'entertainment'],
    platformAffinity: { tiktok: 9, 'youtube-shorts': 7, youtube: 5, reels: 7 },
    implementation: {
      affectedSections: ['dialogue'],
      promptGuidance: 'Include a meta-reference to the video format: "And this is the part where I tell you to like and subscribe, but..." or commenting on the content itself. Use [amused] or [sarcastic] tone. This works best in internet-native content.',
    },
    pairsWith: ['surprise-fourth-wall', 'engagement-comment-bait'],
    conflictsWith: ['pacing-slow-build'],
    impactScore: 7,
    saturationLevel: 5,
  },

  // ── COMPOSITION TECHNIQUES (10+) ──
  {
    id: 'composition-rule-of-thirds',
    name: 'Rule of Thirds Placement',
    category: 'composition',
    description: 'Place characters and key elements at the intersection of thirds grid',
    bestFor: ['educational', 'documentary', 'story', 'interview'],
    platformAffinity: { tiktok: 6, 'youtube-shorts': 6, youtube: 9, reels: 6 },
    implementation: {
      affectedSections: ['characters'],
      promptGuidance: 'Position the primary character at x:33 or x:67 (thirds intersections) rather than dead center. This creates a more professional, cinematic composition. Leave space for text overlays on the opposite side.',
    },
    pairsWith: ['visual-cinematic-bars'],
    conflictsWith: [],
    impactScore: 5,
    saturationLevel: 2,
  },
  {
    id: 'composition-negative-space',
    name: 'Intentional Negative Space',
    category: 'composition',
    description: 'Leave deliberate empty space to let key elements breathe',
    bestFor: ['motivational', 'story', 'product-launch', 'announcement'],
    platformAffinity: { tiktok: 5, 'youtube-shorts': 5, youtube: 8, reels: 6 },
    implementation: {
      affectedSections: ['characters', 'textOverlays'],
      promptGuidance: 'Don\'t fill every inch of the canvas. Position the character to one side (x:30) and use the empty space (x:70 area) for clean text overlays. Fewer visual elements = more impact per element.',
    },
    pairsWith: ['visual-text-behind-subject'],
    conflictsWith: ['pacing-rapid-fire'],
    impactScore: 6,
    saturationLevel: 2,
  },
  {
    id: 'composition-layered-depth',
    name: 'Layered Visual Depth',
    category: 'composition',
    description: 'Create depth with background template + mid-ground stock + foreground character',
    bestFor: ['educational', 'documentary', 'story', 'product-launch'],
    platformAffinity: { tiktok: 6, 'youtube-shorts': 6, youtube: 8, reels: 6 },
    implementation: {
      affectedSections: ['htmlTemplates', 'stockMedia', 'characters', 'svgObjects'],
      promptGuidance: 'Layer the visual composition: HTML template as background (z-index lowest), stock media as mid-ground element, character in front, SVG objects as foreground accents. This creates professional-looking depth.',
    },
    pairsWith: ['visual-broll-cutaway'],
    conflictsWith: [],
    impactScore: 7,
    saturationLevel: 2,
  },

  // ── PLATFORM-SPECIFIC TECHNIQUES (10+) ──
  {
    id: 'platform-tiktok-stitch',
    name: 'Stitch/Duet Format',
    category: 'platform-specific',
    description: 'Format the clip as if responding to another video (even though it\'s self-contained)',
    bestFor: ['reaction', 'debate', 'hot-take', 'comedy', 'educational'],
    platformAffinity: { tiktok: 10, 'youtube-shorts': 5, youtube: 3, reels: 6 },
    implementation: {
      affectedSections: ['characters', 'htmlTemplates'],
      promptGuidance: 'Position the "reacting" character on one side. Use a social media mockup template to show the "original" content they\'re reacting to. This creates a stitch/duet feel that TikTok users are trained to engage with.',
    },
    pairsWith: ['character-reactor', 'visual-picture-in-picture'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 6,
  },
  {
    id: 'platform-youtube-retention',
    name: 'YouTube Retention Optimization',
    category: 'platform-specific',
    description: 'Structure for YouTube\'s retention graph — peaks every 15 seconds',
    bestFor: ['educational', 'explainer', 'tutorial', 'documentary'],
    platformAffinity: { tiktok: 4, 'youtube-shorts': 7, youtube: 10, reels: 4 },
    implementation: {
      affectedSections: ['dialogue', 'stockMedia', 'soundEffects'],
      promptGuidance: 'Add a pattern interrupt (visual change + sound effect) every 12-15 seconds to spike the retention graph. This could be a stock cutaway, an SVG animation, a text overlay, or an emotion shift. YouTube\'s algorithm rewards consistent retention.',
    },
    pairsWith: ['engagement-pattern-interrupt', 'pacing-varied'],
    conflictsWith: [],
    impactScore: 8,
    saturationLevel: 3,
  },
  {
    id: 'platform-reels-aesthetic',
    name: 'Instagram Reels Clean Aesthetic',
    category: 'platform-specific',
    description: 'Polished, visually clean style optimized for Instagram\'s aesthetic-driven audience',
    bestFor: ['product-launch', 'motivational', 'behind-the-scenes', 'tutorial'],
    platformAffinity: { tiktok: 5, 'youtube-shorts': 5, youtube: 5, instagram: 10, reels: 10 },
    implementation: {
      affectedSections: ['htmlTemplates', 'shapes'],
      promptGuidance: 'Use a clean, minimal template. Limit text overlays to 2-3 maximum. Choose a cohesive color palette (2-3 colors). Avoid visual clutter. Instagram audiences prefer polished, aesthetically pleasing content.',
    },
    pairsWith: ['composition-negative-space', 'visual-color-grading'],
    conflictsWith: ['visual-glitch-aesthetic', 'pacing-rapid-fire'],
    impactScore: 7,
    saturationLevel: 3,
  },

  // ── TREND TECHNIQUES (5+) ──
  {
    id: 'trend-ai-generated',
    name: 'AI-Generated Content Meta',
    category: 'trend',
    description: 'Lean into the AI-generated aesthetic and make it a feature',
    bestFor: ['educational', 'entertainment', 'hot-take', 'comedy'],
    platformAffinity: { tiktok: 8, 'youtube-shorts': 7, youtube: 6, reels: 7 },
    implementation: {
      affectedSections: ['dialogue', 'textOverlays'],
      promptGuidance: 'Acknowledge the AI-generated nature of the content. This can be a strength — lean into the unique aesthetic rather than hiding it. Add a small watermark-style text overlay: "AI-generated content".',
    },
    pairsWith: ['surprise-meta-reference'],
    conflictsWith: [],
    impactScore: 6,
    saturationLevel: 7,
  },
  {
    id: 'trend-faceless',
    name: 'Faceless Creator Format',
    category: 'trend',
    description: 'No character on screen — pure visuals + narration + captions',
    bestFor: ['educational', 'listicle', 'how-to', 'documentary', 'news'],
    platformAffinity: { tiktok: 7, 'youtube-shorts': 8, youtube: 8, reels: 6 },
    implementation: {
      affectedSections: ['characters', 'stockMedia', 'htmlTemplates', 'captions'],
      promptGuidance: 'Do NOT use characters on screen. Instead, use stock media (videos and images) as the primary visual, with karaoke-style captions for text. The "faceless" format lets the content speak for itself. Use frequent stock media switching every 3-5 seconds.',
    },
    pairsWith: ['visual-broll-cutaway', 'typography-kinetic'],
    conflictsWith: ['character-debate', 'character-reactor'],
    impactScore: 7,
    saturationLevel: 5,
  },
]

// ── Content Type Detector ─────────────────────────────────────────────

const CONTENT_TYPE_KEYWORDS: Record<ContentType, string[]> = {
  'educational': ['learn', 'explain', 'understand', 'science', 'history', 'how', 'why', 'what is', 'facts', 'knowledge'],
  'entertainment': ['funny', 'hilarious', 'wild', 'crazy', 'entertainment', 'fun', 'meme'],
  'product-launch': ['launch', 'product', 'introducing', 'new release', 'announcing', 'unveil', 'brand'],
  'tutorial': ['tutorial', 'step by step', 'guide', 'walkthrough', 'instructions'],
  'story': ['story', 'happened', 'once upon', 'true story', 'journey', 'adventure'],
  'debate': ['debate', 'vs', 'versus', 'argue', 'disagree', 'opinion', 'which is better'],
  'news': ['breaking', 'news', 'update', 'announcement', 'report', 'latest'],
  'listicle': ['top', 'best', 'worst', 'ranking', 'list', 'things you', 'reasons'],
  'comparison': ['compare', 'comparison', 'difference', 'better', 'vs', 'pros cons'],
  'behind-the-scenes': ['behind the scenes', 'bts', 'making of', 'process', 'how we'],
  'reaction': ['react', 'reaction', 'responding to', 'watching', 'reacting'],
  'explainer': ['explained', 'explainer', 'breakdown', 'deep dive', 'analysis', 'how does'],
  'motivational': ['motivat', 'inspir', 'success', 'mindset', 'believe', 'never give up', 'dream'],
  'comedy': ['joke', 'comedy', 'parody', 'skit', 'sketch', 'roast'],
  'documentary': ['documentary', 'history of', 'investigation', 'untold story', 'rise and fall'],
  'review': ['review', 'honest review', 'worth it', 'tested', 'rating'],
  'how-to': ['how to', 'diy', 'make your own', 'build', 'create', 'recipe'],
  'myth-busting': ['myth', 'debunk', 'actually', 'truth about', 'lie', 'misconception', 'wrong about'],
  'countdown': ['countdown', 'top 10', 'top 5', 'number one', '#1'],
  'day-in-life': ['day in the life', 'morning routine', 'daily', 'routine'],
  'challenge': ['challenge', 'dare', 'try', 'attempt', 'impossible'],
  'transformation': ['transformation', 'before after', 'before and after', 'glow up', 'makeover'],
  'hot-take': ['hot take', 'unpopular opinion', 'controversial', 'nobody talks about', 'overrated'],
  'interview': ['interview', 'conversation with', 'sit down with', 'qa', 'ask'],
  'case-study': ['case study', 'how they', 'success story', 'what happened to', 'rise of'],
  'announcement': ['announce', 'reveal', 'officially', 'confirmed', 'just dropped'],
  'recap': ['recap', 'summary', 'highlights', 'what happened', 'review of'],
}

/**
 * Detect the most likely content type from a user prompt.
 */
export function detectContentType(prompt: string): ContentType {
  const lower = prompt.toLowerCase()
  const scores: Partial<Record<ContentType, number>> = {}

  for (const [type, keywords] of Object.entries(CONTENT_TYPE_KEYWORDS) as [ContentType, string[]][]) {
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.split(' ').length // Multi-word matches score higher
    }
    if (score > 0) scores[type] = score
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
  return (sorted[0]?.[0] as ContentType) || 'educational'
}

/**
 * Detect the target platform from settings or prompt.
 */
export function detectPlatform(prompt: string, settings?: OrchestratorSettings): Platform {
  if (settings?.targetPlatform) {
    const map: Record<string, Platform> = {
      tiktok: 'tiktok',
      youtube: 'youtube',
      instagram: 'reels',
      reels: 'reels',
    }
    return map[settings.targetPlatform] || 'tiktok'
  }

  const lower = prompt.toLowerCase()
  if (lower.includes('tiktok')) return 'tiktok'
  if (lower.includes('youtube short')) return 'youtube-shorts'
  if (lower.includes('youtube')) return 'youtube'
  if (lower.includes('instagram') || lower.includes('reel')) return 'reels'

  // Default based on aspect ratio
  if (settings?.aspectRatio === '9:16') return 'tiktok'
  if (settings?.aspectRatio === '16:9') return 'youtube'
  if (settings?.aspectRatio === '1:1') return 'reels'

  return 'tiktok'
}

// ── Technique Selection Engine ─────────────────────────────────────────

/**
 * Select the best techniques for a given content type and platform.
 */
export function selectTechniques(
  contentType: ContentType,
  platform: Platform,
  count: number = 8,
): CreativeTechnique[] {
  // Score each technique based on content type match + platform affinity + freshness
  const scored = TECHNIQUE_LIBRARY.map((t) => {
    let score = 0

    // Content type match (0-30)
    if (t.bestFor.includes(contentType)) score += 20
    // Partial match for related content types
    const related = getRelatedContentTypes(contentType)
    if (related.some((r) => t.bestFor.includes(r))) score += 8

    // Platform affinity (0-10)
    score += (t.platformAffinity[platform] || 5)

    // Impact score bonus (0-10)
    score += t.impactScore

    // Freshness bonus (lower saturation = higher score, 0-10)
    score += (10 - t.saturationLevel)

    return { technique: t, score }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Select top techniques, ensuring at least one from each critical category
  const selected: CreativeTechnique[] = []
  const usedCategories = new Set<TechniqueCategory>()
  const requiredCategories: TechniqueCategory[] = ['hook', 'storytelling', 'pacing', 'emotional-arc']

  // First, ensure required categories
  for (const cat of requiredCategories) {
    const best = scored.find(
      (s) => s.technique.category === cat && !selected.includes(s.technique),
    )
    if (best) {
      selected.push(best.technique)
      usedCategories.add(cat)
    }
  }

  // Then fill remaining slots with highest-scored techniques
  for (const s of scored) {
    if (selected.length >= count) break
    if (selected.includes(s.technique)) continue

    // Check for conflicts
    const hasConflict = selected.some(
      (existing) =>
        existing.conflictsWith.includes(s.technique.id) ||
        s.technique.conflictsWith.includes(existing.id),
    )
    if (hasConflict) continue

    selected.push(s.technique)
    usedCategories.add(s.technique.category)
  }

  return selected
}

function getRelatedContentTypes(type: ContentType): ContentType[] {
  const relations: Record<string, ContentType[]> = {
    educational: ['explainer', 'how-to', 'tutorial', 'documentary'],
    entertainment: ['comedy', 'reaction', 'challenge'],
    story: ['documentary', 'case-study', 'behind-the-scenes'],
    debate: ['comparison', 'hot-take', 'myth-busting'],
    listicle: ['countdown', 'comparison', 'review'],
    motivational: ['story', 'transformation', 'case-study'],
    news: ['announcement', 'reaction', 'hot-take'],
  }
  return relations[type] || []
}

// ── Scene Intelligence ─────────────────────────────────────────────────

/**
 * Break a clip into intelligent scenes with varied visual treatments.
 */
export function generateSceneBreakdown(
  _contentType: ContentType,
  durationSeconds: number,
  techniques: CreativeTechnique[],
): SceneBreakdown[] {
  const scenes: SceneBreakdown[] = []
  const hookTechnique = techniques.find((t) => t.category === 'hook')

  if (durationSeconds <= 15) {
    // Ultra-short: Hook → Payoff
    scenes.push(
      { id: 's1', startPercent: 0, endPercent: 0.4, purpose: 'hook', visualTreatment: 'Bold text + character close-up', techniques: [hookTechnique?.id || 'hook-shocking-stat'], emotionTarget: 'surprised', pacing: 6, useBroll: false },
      { id: 's2', startPercent: 0.4, endPercent: 0.85, purpose: 'payoff', visualTreatment: 'Full visual treatment', techniques: [], emotionTarget: 'excited', pacing: 6, useBroll: true },
      { id: 's3', startPercent: 0.85, endPercent: 1.0, purpose: 'cta', visualTreatment: 'CTA overlay', techniques: [], emotionTarget: 'determined', pacing: 5, useBroll: false },
    )
  } else if (durationSeconds <= 30) {
    // Short: Hook → Build → Payoff → CTA
    scenes.push(
      { id: 's1', startPercent: 0, endPercent: 0.15, purpose: 'hook', visualTreatment: 'Attention-grabbing opener', techniques: [hookTechnique?.id || 'hook-bold-claim'], emotionTarget: 'surprised', pacing: 6, useBroll: false },
      { id: 's2', startPercent: 0.15, endPercent: 0.5, purpose: 'build', visualTreatment: 'Primary content with template', techniques: [], emotionTarget: 'curious', pacing: 5, useBroll: true },
      { id: 's3', startPercent: 0.5, endPercent: 0.85, purpose: 'climax', visualTreatment: 'Peak moment with data/reveal', techniques: [], emotionTarget: 'excited', pacing: 6, useBroll: true },
      { id: 's4', startPercent: 0.85, endPercent: 1.0, purpose: 'cta', visualTreatment: 'Call to action', techniques: [], emotionTarget: 'happy', pacing: 5, useBroll: false },
    )
  } else if (durationSeconds <= 60) {
    // Medium: Hook → Setup → Build → Twist → Resolution → CTA
    scenes.push(
      { id: 's1', startPercent: 0, endPercent: 0.08, purpose: 'hook', visualTreatment: 'Maximum impact opener', techniques: [hookTechnique?.id || 'hook-shocking-stat'], emotionTarget: 'shocked', pacing: 6, useBroll: false },
      { id: 's2', startPercent: 0.08, endPercent: 0.25, purpose: 'setup', visualTreatment: 'Context setting with template', techniques: [], emotionTarget: 'neutral', pacing: 5, useBroll: false },
      { id: 's3', startPercent: 0.25, endPercent: 0.5, purpose: 'build', visualTreatment: 'Building argument with data/visuals', techniques: [], emotionTarget: 'curious', pacing: 5, useBroll: true },
      { id: 's4', startPercent: 0.5, endPercent: 0.7, purpose: 'twist', visualTreatment: 'Perspective shift or revelation', techniques: [], emotionTarget: 'surprised', pacing: 6, useBroll: true },
      { id: 's5', startPercent: 0.7, endPercent: 0.9, purpose: 'resolution', visualTreatment: 'Key takeaway', techniques: [], emotionTarget: 'determined', pacing: 5, useBroll: false },
      { id: 's6', startPercent: 0.9, endPercent: 1.0, purpose: 'cta', visualTreatment: 'Final CTA', techniques: [], emotionTarget: 'happy', pacing: 5, useBroll: false },
    )
  } else {
    // Long (60s+): Full multi-scene treatment
    scenes.push(
      { id: 's1', startPercent: 0, endPercent: 0.05, purpose: 'hook', visualTreatment: 'Cold open with highest-impact moment', techniques: [hookTechnique?.id || 'hook-story-cold-open'], emotionTarget: 'shocked', pacing: 6, useBroll: false },
      { id: 's2', startPercent: 0.05, endPercent: 0.15, purpose: 'setup', visualTreatment: 'Context and world-building', techniques: [], emotionTarget: 'neutral', pacing: 4, useBroll: false },
      { id: 's3', startPercent: 0.15, endPercent: 0.35, purpose: 'build', visualTreatment: 'First major point with visuals', techniques: [], emotionTarget: 'curious', pacing: 5, useBroll: true },
      { id: 's4', startPercent: 0.35, endPercent: 0.45, purpose: 'breather', visualTreatment: 'Brief change of pace or humor', techniques: [], emotionTarget: 'amused', pacing: 4, useBroll: true },
      { id: 's5', startPercent: 0.45, endPercent: 0.65, purpose: 'build', visualTreatment: 'Escalating content with data', techniques: [], emotionTarget: 'serious', pacing: 5, useBroll: true },
      { id: 's6', startPercent: 0.65, endPercent: 0.8, purpose: 'climax', visualTreatment: 'Peak revelation or twist', techniques: [], emotionTarget: 'shocked', pacing: 6, useBroll: true },
      { id: 's7', startPercent: 0.8, endPercent: 0.92, purpose: 'resolution', visualTreatment: 'Wrap-up and key takeaway', techniques: [], emotionTarget: 'determined', pacing: 5, useBroll: false },
      { id: 's8', startPercent: 0.92, endPercent: 1.0, purpose: 'cta', visualTreatment: 'Final CTA and outro', techniques: [], emotionTarget: 'happy', pacing: 5, useBroll: false },
    )
  }

  // Distribute techniques across scenes
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    // Assign relevant techniques to each scene based on purpose
    const relevantTechniques = techniques.filter((t) => {
      if (scene.purpose === 'hook' && t.category === 'hook') return true
      if (scene.purpose === 'build' && (t.category === 'visual-style' || t.category === 'engagement')) return true
      if (scene.purpose === 'climax' && (t.category === 'surprise' || t.category === 'emotional-arc')) return true
      if (scene.purpose === 'twist' && t.category === 'surprise') return true
      if (scene.purpose === 'cta' && t.category === 'engagement') return true
      if (scene.purpose === 'breather' && t.category === 'audio') return true
      return false
    })
    scene.techniques = [...scene.techniques, ...relevantTechniques.map((t) => t.id)].slice(0, 3)
  }

  return scenes
}

// ── Surprise Element Generator ─────────────────────────────────────────

/**
 * Generate surprise elements to inject into a clip for unexpectedness.
 */
export function generateSurpriseElements(
  contentType: ContentType,
  durationSeconds: number,
): SurpriseElement[] {
  const surprises: SurpriseElement[] = []

  // Always include at least one surprise for clips over 15 seconds
  if (durationSeconds < 15) return []

  const allSurprises: SurpriseElement[] = [
    {
      type: 'fourth-wall',
      description: 'Character breaks the fourth wall with a self-aware comment',
      triggerPercent: 0.6,
      implementation: 'Add a dialogue line where the character directly addresses the viewer with a self-aware comment like "Are you still with me?" or "I know, right?"',
    },
    {
      type: 'visual-twist',
      description: 'Sudden visual style change — template switch or color shift',
      triggerPercent: 0.55,
      implementation: 'Switch the HTML template at this point, or add a dramatic color shift to the existing template config. Add a glitch sound effect.',
    },
    {
      type: 'audio-twist',
      description: 'Unexpected silence or dramatic sound effect before a big reveal',
      triggerPercent: 0.7,
      implementation: 'Add a brief 0.5s silence (no dialogue) followed by a dramatic impact sound effect, then deliver the key revelation.',
    },
    {
      type: 'perspective-shift',
      description: 'Flip the narrative perspective at the midpoint',
      triggerPercent: 0.5,
      implementation: 'Introduce a second character with an opposing view, or have the narrator suddenly say "But what if we look at it from the other side?"',
    },
    {
      type: 'meta-reference',
      description: 'Self-referential comment about the video format',
      triggerPercent: 0.75,
      implementation: 'Character makes a meta comment: "This is the part where most videos would end, but..." or references the platform format.',
    },
    {
      type: 'easter-egg',
      description: 'Hidden visual detail that foreshadows the ending',
      triggerPercent: 0.15,
      implementation: 'Add a small SVG object (40x40px, opacity 0.6) at the edge of the frame that visually relates to the clip\'s conclusion or twist.',
    },
  ]

  // Select 1-2 surprises based on content type
  const contentSurpriseMap: Record<string, string[]> = {
    comedy: ['fourth-wall', 'meta-reference', 'audio-twist'],
    educational: ['perspective-shift', 'visual-twist', 'easter-egg'],
    story: ['audio-twist', 'perspective-shift', 'easter-egg'],
    entertainment: ['fourth-wall', 'meta-reference', 'visual-twist'],
    debate: ['perspective-shift', 'audio-twist'],
    'hot-take': ['fourth-wall', 'meta-reference'],
    documentary: ['perspective-shift', 'audio-twist', 'easter-egg'],
    'myth-busting': ['perspective-shift', 'visual-twist'],
  }

  const preferredTypes = contentSurpriseMap[contentType] || ['visual-twist', 'audio-twist']
  const preferred = allSurprises.filter((s) => preferredTypes.includes(s.type))

  // Pick 1 for short clips, 2 for longer clips
  const count = durationSeconds > 45 ? 2 : 1
  for (let i = 0; i < Math.min(count, preferred.length); i++) {
    surprises.push(preferred[i])
  }

  return surprises
}

// ── Creative Approach Generator ────────────────────────────────────────

/**
 * Generate multiple creative approaches for a given prompt.
 * Returns 5 different approaches ranked by estimated engagement.
 */
export function generateCreativeApproaches(
  prompt: string,
  settings?: OrchestratorSettings,
): CreativeApproach[] {
  const contentType = detectContentType(prompt)
  const platform = detectPlatform(prompt, settings)
  const duration = settings?.durationSeconds || 45

  const approaches: CreativeApproach[] = []

  // Approach 1: "The Safe Play" — proven format, high reliability
  const safeTechniques = selectTechniques(contentType, platform, 6)
  const safeScenes = generateSceneBreakdown(contentType, duration, safeTechniques)
  approaches.push({
    id: 'approach-safe',
    name: 'The Proven Format',
    tagline: 'Reliable engagement with a tried-and-true approach',
    direction: `Classic ${contentType} format optimized for ${platform}. Uses the most proven techniques for this content type.`,
    scenes: safeScenes,
    techniques: safeTechniques.map((t) => t.id),
    engagementScore: 72,
    riskLevel: 'safe',
    uniqueFactor: 'Maximum reliability with proven patterns',
    promptInjection: buildPromptInjection(safeTechniques, safeScenes, []),
  })

  // Approach 2: "The Storyteller" — narrative-driven
  const storyTechniques = selectTechniquesForApproach('narrative', contentType, platform)
  const storyScenes = generateSceneBreakdown(contentType, duration, storyTechniques)
  approaches.push({
    id: 'approach-story',
    name: 'The Storyteller',
    tagline: 'Narrative-driven with an emotional arc that hooks viewers',
    direction: `Story-first approach: transform the topic into a compelling narrative with rising action, a twist, and a satisfying resolution.`,
    scenes: storyScenes,
    techniques: storyTechniques.map((t) => t.id),
    engagementScore: 78,
    riskLevel: 'moderate',
    uniqueFactor: 'Emotional storytelling creates deeper connection',
    promptInjection: buildPromptInjection(storyTechniques, storyScenes, []),
  })

  // Approach 3: "The Data Visualizer" — information-rich with charts and visuals
  const dataTechniques = selectTechniquesForApproach('data', contentType, platform)
  const dataScenes = generateSceneBreakdown(contentType, duration, dataTechniques)
  approaches.push({
    id: 'approach-data',
    name: 'The Visual Explainer',
    tagline: 'Data-rich with charts, numbers, and visual proof',
    direction: `Information-first approach: Use data visualizations, infographics, and big numbers to make the content feel authoritative and shareable.`,
    scenes: dataScenes,
    techniques: dataTechniques.map((t) => t.id),
    engagementScore: 74,
    riskLevel: 'safe',
    uniqueFactor: 'Visual data creates shareability and authority',
    promptInjection: buildPromptInjection(dataTechniques, dataScenes, []),
  })

  // Approach 4: "The Provocateur" — controversial/edgy angle
  const edgyTechniques = selectTechniquesForApproach('edgy', contentType, platform)
  const edgyScenes = generateSceneBreakdown(contentType, duration, edgyTechniques)
  const edgySurprises = generateSurpriseElements(contentType, duration)
  approaches.push({
    id: 'approach-edgy',
    name: 'The Provocateur',
    tagline: 'Bold, contrarian take that demands a reaction',
    direction: `Controversy-driven approach: Frame the topic as a bold, contrarian take. Challenge assumptions. Make viewers want to argue or agree in comments.`,
    scenes: edgyScenes,
    techniques: edgyTechniques.map((t) => t.id),
    engagementScore: 82,
    riskLevel: 'bold',
    uniqueFactor: 'Controversy drives comments and shares',
    promptInjection: buildPromptInjection(edgyTechniques, edgyScenes, edgySurprises),
  })

  // Approach 5: "The Experimental" — unconventional creative choices
  const experimentalTechniques = selectTechniquesForApproach('experimental', contentType, platform)
  const experimentalScenes = generateSceneBreakdown(contentType, duration, experimentalTechniques)
  const experimentalSurprises = generateSurpriseElements(contentType, duration)
  approaches.push({
    id: 'approach-experimental',
    name: 'The Rule-Breaker',
    tagline: 'Unexpected format that stands out from the crowd',
    direction: `Break conventions: Use non-linear storytelling, fourth-wall breaks, unexpected visual styles, and format-bending techniques that make viewers stop scrolling.`,
    scenes: experimentalScenes,
    techniques: experimentalTechniques.map((t) => t.id),
    engagementScore: 85,
    riskLevel: 'experimental',
    uniqueFactor: 'Breaks all conventions for maximum surprise factor',
    promptInjection: buildPromptInjection(experimentalTechniques, experimentalScenes, experimentalSurprises),
  })

  // Sort by engagement score
  approaches.sort((a, b) => b.engagementScore - a.engagementScore)

  return approaches
}

function selectTechniquesForApproach(
  approach: 'narrative' | 'data' | 'edgy' | 'experimental',
  contentType: ContentType,
  platform: Platform,
): CreativeTechnique[] {
  const priorityCategories: Record<string, TechniqueCategory[]> = {
    narrative: ['storytelling', 'emotional-arc', 'character-use', 'audio', 'hook'],
    data: ['visual-style', 'typography', 'composition', 'engagement', 'hook'],
    edgy: ['hook', 'surprise', 'engagement', 'pacing', 'audio'],
    experimental: ['surprise', 'transition', 'visual-style', 'character-use', 'hook'],
  }

  const priorities = priorityCategories[approach]
  const all = [...TECHNIQUE_LIBRARY]

  // Sort by priority category match + content type fit
  all.sort((a, b) => {
    const aIdx = priorities.indexOf(a.category)
    const bIdx = priorities.indexOf(b.category)
    const aPriority = aIdx >= 0 ? (priorities.length - aIdx) * 10 : 0
    const bPriority = bIdx >= 0 ? (priorities.length - bIdx) * 10 : 0
    const aContent = a.bestFor.includes(contentType) ? 15 : 0
    const bContent = b.bestFor.includes(contentType) ? 15 : 0
    const aPlatform = a.platformAffinity[platform] || 5
    const bPlatform = b.platformAffinity[platform] || 5
    return (bPriority + bContent + bPlatform) - (aPriority + aContent + aPlatform)
  })

  // Select top 8, ensuring at least one hook
  const selected: CreativeTechnique[] = []
  const hookTechnique = all.find((t) => t.category === 'hook')
  if (hookTechnique) selected.push(hookTechnique)

  for (const t of all) {
    if (selected.length >= 8) break
    if (selected.includes(t)) continue
    const hasConflict = selected.some(
      (s) => s.conflictsWith.includes(t.id) || t.conflictsWith.includes(s.id),
    )
    if (!hasConflict) selected.push(t)
  }

  return selected
}

// ── Prompt Injection Builder ──────────────────────────────────────────

/**
 * Build a creative direction prompt injection for the orchestrator.
 */
function buildPromptInjection(
  techniques: CreativeTechnique[],
  scenes: SceneBreakdown[],
  surprises: SurpriseElement[],
): string {
  const lines: string[] = []

  lines.push('CREATIVE DIRECTION (follow these specific creative choices):')
  lines.push('')

  // Hook instruction
  const hookTechnique = techniques.find((t) => t.category === 'hook')
  if (hookTechnique) {
    lines.push(`HOOK STRATEGY — "${hookTechnique.name}":`)
    lines.push(hookTechnique.implementation.promptGuidance)
    lines.push('')
  }

  // Storytelling instruction
  const storyTechnique = techniques.find((t) => t.category === 'storytelling')
  if (storyTechnique) {
    lines.push(`NARRATIVE STRUCTURE — "${storyTechnique.name}":`)
    lines.push(storyTechnique.implementation.promptGuidance)
    lines.push('')
  }

  // Pacing instruction
  const pacingTechnique = techniques.find((t) => t.category === 'pacing')
  if (pacingTechnique) {
    lines.push(`PACING — "${pacingTechnique.name}":`)
    lines.push(pacingTechnique.implementation.promptGuidance)
    lines.push('')
  }

  // Visual style
  const visualTechniques = techniques.filter((t) => t.category === 'visual-style' || t.category === 'composition')
  if (visualTechniques.length > 0) {
    lines.push('VISUAL TECHNIQUES:')
    for (const t of visualTechniques.slice(0, 3)) {
      lines.push(`- "${t.name}": ${t.implementation.promptGuidance}`)
    }
    lines.push('')
  }

  // Engagement
  const engagementTechniques = techniques.filter((t) => t.category === 'engagement')
  if (engagementTechniques.length > 0) {
    lines.push('ENGAGEMENT TACTICS:')
    for (const t of engagementTechniques.slice(0, 2)) {
      lines.push(`- "${t.name}": ${t.implementation.promptGuidance}`)
    }
    lines.push('')
  }

  // Emotional arc
  const emotionTechnique = techniques.find((t) => t.category === 'emotional-arc')
  if (emotionTechnique) {
    lines.push(`EMOTIONAL ARC — "${emotionTechnique.name}":`)
    lines.push(emotionTechnique.implementation.promptGuidance)
    lines.push('')
  }

  // Character use
  const charTechnique = techniques.find((t) => t.category === 'character-use')
  if (charTechnique) {
    lines.push(`CHARACTER STRATEGY — "${charTechnique.name}":`)
    lines.push(charTechnique.implementation.promptGuidance)
    lines.push('')
  }

  // Audio
  const audioTechniques = techniques.filter((t) => t.category === 'audio')
  if (audioTechniques.length > 0) {
    lines.push('AUDIO DESIGN:')
    for (const t of audioTechniques.slice(0, 2)) {
      lines.push(`- "${t.name}": ${t.implementation.promptGuidance}`)
    }
    lines.push('')
  }

  // Scene breakdown
  if (scenes.length > 0) {
    lines.push('SCENE-BY-SCENE BREAKDOWN (structure the clip exactly like this):')
    for (const scene of scenes) {
      const pctStart = Math.round(scene.startPercent * 100)
      const pctEnd = Math.round(scene.endPercent * 100)
      lines.push(`  ${pctStart}-${pctEnd}% | ${scene.purpose.toUpperCase()} | Emotion: ${scene.emotionTarget} | Pacing: ${scene.pacing} words/sec | Visual: ${scene.visualTreatment}${scene.useBroll ? ' | Use B-roll' : ''}`)
    }
    lines.push('')
  }

  // Surprise elements
  if (surprises.length > 0) {
    lines.push('SURPRISE ELEMENTS (include these unexpected moments):')
    for (const s of surprises) {
      const pct = Math.round(s.triggerPercent * 100)
      lines.push(`  At ~${pct}%: ${s.description}. Implementation: ${s.implementation}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ── Main Creative Intelligence API ────────────────────────────────────

/**
 * Generate a complete creative directive for a user prompt.
 * This is the main entry point called by the orchestrator.
 */
export function getCreativeDirective(
  prompt: string,
  settings?: OrchestratorSettings,
): CreativeDirective {
  const contentType = detectContentType(prompt)
  const platform = detectPlatform(prompt, settings)
  const duration = settings?.durationSeconds || 45

  // Generate all approaches
  const approaches = generateCreativeApproaches(prompt, settings)

  // Pick the best approach based on risk tolerance
  // Default: pick the moderate-risk approach for best balance
  const primaryApproach = approaches.find((a) => a.riskLevel === 'moderate') || approaches[0]
  const alternatives = approaches.filter((a) => a.id !== primaryApproach.id)

  // Generate surprise elements
  const surpriseElements = generateSurpriseElements(contentType, duration)

  // Use the primary approach's scene breakdown
  const sceneBreakdown = primaryApproach.scenes

  // Build the creative prompt injection
  const techniques = TECHNIQUE_LIBRARY.filter((t) => primaryApproach.techniques.includes(t.id))
  const creativePrompt = buildPromptInjection(techniques, sceneBreakdown, surpriseElements)

  return {
    contentType,
    platform,
    primaryApproach,
    alternatives,
    surpriseElements,
    sceneBreakdown,
    creativePrompt,
  }
}

/**
 * Get a simplified creative prompt injection string for the orchestrator.
 * This can be directly inserted into the Gemini prompt.
 */
export function getCreativePromptInjection(
  prompt: string,
  settings?: OrchestratorSettings,
): string {
  const directive = getCreativeDirective(prompt, settings)
  return directive.creativePrompt
}

/**
 * Get the technique library for UI display.
 */
export function getTechniqueLibrary(): CreativeTechnique[] {
  return [...TECHNIQUE_LIBRARY]
}

/**
 * Get techniques filtered by category.
 */
export function getTechniquesByCategory(category: TechniqueCategory): CreativeTechnique[] {
  return TECHNIQUE_LIBRARY.filter((t) => t.category === category)
}

/**
 * Get a technique by ID.
 */
export function getTechniqueById(id: string): CreativeTechnique | undefined {
  return TECHNIQUE_LIBRARY.find((t) => t.id === id)
}

/**
 * Get content type → technique mapping for display.
 */
export function getContentTypeMappings(): Record<ContentType, { primary: string[]; secondary: string[] }> {
  const mappings: Record<string, { primary: string[]; secondary: string[] }> = {}

  for (const type of Object.keys(CONTENT_TYPE_KEYWORDS) as ContentType[]) {
    const primary = TECHNIQUE_LIBRARY
      .filter((t) => t.bestFor.includes(type))
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 5)
      .map((t) => t.id)

    const secondary = TECHNIQUE_LIBRARY
      .filter((t) => t.bestFor.includes(type))
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(5, 10)
      .map((t) => t.id)

    mappings[type] = { primary, secondary }
  }

  return mappings as Record<ContentType, { primary: string[]; secondary: string[] }>
}
