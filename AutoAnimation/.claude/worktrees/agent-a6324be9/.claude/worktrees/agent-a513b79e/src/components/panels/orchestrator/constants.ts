import {
  Film,
  Palette,
  Users,
  Mic,
  MessageSquare,
  Type,
  Shapes,
  Code2,
  Music,
  Clock,
  Monitor,
  Search,
  Presentation,
  ShoppingBag,
  Image,
  Volume2,
  Camera,
  Video,
  Hand,
  Activity,
  Sparkles,
  ImageIcon,
  UserPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { OrchestratorAspectRatio } from '@/types/orchestrator'

// ── Quick Presets ──

export interface Preset {
  label: string
  description: string
  icon: LucideIcon
  prompt: string
}

export const PRESETS: Preset[] = [
  {
    label: 'Explainer',
    description: 'One character presents a topic',
    icon: Presentation,
    prompt:
      'Create a 30-second explainer video about how AI works, with one character presenting, animated background, title card at the start and a call-to-action at the end.',
  },
  {
    label: 'Dialogue',
    description: 'Two characters in conversation',
    icon: MessageSquare,
    prompt:
      'Create a 45-second comedy dialogue between two characters arguing about whether pineapple belongs on pizza. Include expressive emotions and dramatic captions.',
  },
  {
    label: 'Showcase',
    description: 'Product intro with text overlays',
    icon: ShoppingBag,
    prompt:
      'Create a 20-second product showcase intro with dynamic text overlays, energetic background, and a strong call-to-action at the end. No characters needed.',
  },
  {
    label: 'LeetCode',
    description: 'Coding tutorial walkthrough',
    icon: Code2,
    prompt:
      'Create a 60-second LeetCode coding tutorial video. Use the LeetCode Explainer template as the main visual. Show the problem statement card first for 4 seconds, then start typing the solution code character-by-character in a VS Code editor. Place one character in the bottom-right corner as a small picture-in-picture to explain the approach. The character should narrate: first explain the problem, then walk through the solution line by line, and finish with the time and space complexity analysis. Use 9:16 aspect ratio for short-form content.',
  },
  {
    label: 'Geopolitics',
    description: 'Visual storytelling with maps',
    icon: Search,
    prompt: `Create a 90-second visual storytelling video about "Why the USA wanted to buy Greenland" — cinematic, data-driven, with animated map, infographics, and moving SVG assets.

VISUAL STRUCTURE (use multiple HTML templates sequenced across the timeline):

1. INTRO (0-15%): Use the World Map template (tpl-world-map) for the full duration (0-100%). In its config.commands, add:
   - Frame ~0: hideUI (hide legend + controls for cleaner look)
   - Frame ~30: zoomToCountry "USA" (zoomLevel 3) + highlightCountry "USA" (color #4fc3f7)
   - Frame ~90: zoomToCountry "Greenland" (zoomLevel 4) + highlightCountry "Greenland" (color #ff6b6b)
   - Frame ~180: resetView + drawConnection from "USA" to "Greenland" (color #f4d03f)
   Title overlay "Why the USA Wanted to Buy Greenland" at 0-4% only (brief flash, then disappear).

2. STRATEGIC VALUE (15-40%): Add a Bar Chart (tpl-infographic-bar) at 15-40%. At frame ~400 in map commands: zoomToCountry "Greenland" (zoomLevel 5).

3. TRADE FLOW (40-60%): Add a Sankey Diagram (tpl-infographic-sankey) at 40-60%. At frame ~1080 in map commands:
   - drawConnection "USA" to "Denmark" (color #4ecdc4), drawConnection "Denmark" to "Greenland" (color #f4d03f)
   - highlightCountry "Denmark" (color #4ecdc4)

4. HISTORICAL (60-80%): World map only (no overlay chart). At frame ~1620:
   - clearConnections, clearHighlights, zoomToCountry "Greenland" (zoomLevel 4)
   - highlightCountry "Greenland" (color #e8d44d), showLabel "Greenland"
   Text overlays for dates: "1946 - Truman offers $100M", "2019 - Trump proposes purchase" (short, 3-4s each).

5. RIVALRY (80-95%): Add Bar Chart (tpl-infographic-bar) at 80-95%. At frame ~2160:
   - resetView, highlightCountry "Russia" (color #e74c3c), highlightCountry "China" (color #e67e22)
   - drawConnection "Russia" to "Greenland", drawConnection "China" to "Greenland"

6. OUTRO (95-100%): clearHighlights, resetView. Brief conclusion overlay.

SVG OBJECTS — IMPORTANT: only show during world-map-only segments (NOT during infographic overlays):
- "oil barrel" — 0-14% only (intro, map visible), fades in near Greenland (x:50,y:25), grows in scale. In map commands: zoomToCountry at a level that shows the USA-Greenland connection path.
- "gold coin" — 60-74% only (historical section, map visible), moves from USA (x:25,y:55) to Greenland (x:55,y:25), rotation 360
- "military jet" — 60-74% only (historical section, map visible), flies from USA (x:20,y:60) to Arctic (x:55,y:15)
- "dollar bill" — 60-74% only (historical section, map visible), moves from USA (x:25,y:55) to Denmark area (x:55,y:40)

CHARACTER: One narrator at top-center (position x:50, y:12, scale 0.4). Documentary style with emotion cues.

Use 16:9 aspect ratio, 30fps. Background: "lottie" with a subtle dark animation (world map IS the visual, do NOT use svg-generate). Captions: word-by-word at bottom.`,
  },
]

// ── Step Icons & Labels ──

export const STEP_ICONS: Record<string, LucideIcon> = {
  'setup-canvas': Film,
  'setup-background': Palette,
  'generate-characters': UserPlus,
  'setup-characters': Users,
  'generate-voices': Mic,
  'setup-dialogue': MessageSquare,
  'generate-music': Music,
  'setup-text-overlays': Type,
  'setup-shapes': Shapes,
  'setup-html-templates': Code2,
  'generate-svg-objects': Shapes,
  'setup-stock-media': Image,
  'setup-sound-effects': Volume2,
  'setup-captions': MessageSquare,
  'setup-camera': Camera,
  'setup-auto-camera': Camera,
  'setup-smart-broll': Video,
  'setup-gestures': Hand,
  'setup-character-motion': Activity,
  'sync-to-beat': Music,
  'setup-retention-hooks': Sparkles,
  'generate-thumbnail': ImageIcon,
  'finalize-timeline': Clock,
}

export const STEP_LABELS: Record<string, string> = {
  'setup-canvas': 'Canvas Setup',
  'setup-background': 'Background',
  'generate-characters': 'Generate Characters',
  'setup-characters': 'Characters',
  'generate-voices': 'Voice Generation',
  'setup-dialogue': 'Dialogue Timeline',
  'generate-music': 'Background Music',
  'setup-text-overlays': 'Text Overlays',
  'setup-shapes': 'Shapes',
  'setup-html-templates': 'HTML Templates',
  'generate-svg-objects': 'SVG Objects',
  'setup-stock-media': 'Stock Media',
  'setup-sound-effects': 'Sound Effects',
  'setup-captions': 'Captions',
  'setup-camera': 'Camera Setup',
  'setup-auto-camera': 'Auto Camera',
  'setup-smart-broll': 'Smart B-Roll',
  'setup-gestures': 'Character Gestures',
  'setup-character-motion': 'Character Motion',
  'sync-to-beat': 'Beat Sync',
  'setup-retention-hooks': 'Retention Hooks',
  'generate-thumbnail': 'Thumbnail',
  'finalize-timeline': 'Finalize Timeline',
}

// ── Aspect Ratio Options ──

export const ASPECT_RATIO_OPTIONS: {
  value: OrchestratorAspectRatio
  label: string
  icon: string
}[] = [
  { value: '16:9', label: '16:9', icon: '\u{1F5A5}\u{FE0F}' },
  { value: '9:16', label: '9:16', icon: '\u{1F4F1}' },
  { value: '1:1', label: '1:1', icon: '\u{2B1C}' },
  { value: '4:3', label: '4:3', icon: '\u{1F5BC}\u{FE0F}' },
  { value: '21:9', label: '21:9', icon: '\u{1F3AC}' },
]

// ── Cost Display ──

export const SOURCE_COLORS: Record<string, string> = {
  gemini: 'text-blue-400',
  elevenlabs: 'text-violet-400',
  'vertex-ai': 'text-emerald-400',
}

export const SOURCE_LABELS: Record<string, string> = {
  gemini: 'Gemini 2.0 Flash',
  elevenlabs: 'ElevenLabs TTS',
  'vertex-ai': 'Vertex AI',
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return `$${cost.toFixed(5)}`
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

// ── Phase Mapping ──

export const PHASE_STEPS = ['Prompt', 'Plan', 'Review', 'Execute', 'Done'] as const
export type PhaseStep = (typeof PHASE_STEPS)[number]

export function getPhaseIndex(phase: string): number {
  switch (phase) {
    case 'idle':
    case 'error':
      return 0
    case 'planning':
      return 1
    case 'reviewing':
    case 'comparing':
      return 2
    case 'executing':
      return 3
    case 'done':
      return 4
    default:
      return 0
  }
}

// ── Monitor icon re-export for settings ──
export { Monitor }
