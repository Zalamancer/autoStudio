import type { TabGroupDef, TabGroupId, LeftPanelTab } from '@/types'

/** Groups with more sub-tabs than this threshold use card grid navigation */
export const CARD_GRID_THRESHOLD = 2

export const TAB_GROUPS: TabGroupDef[] = [
  {
    id: 'create',
    label: 'Characters',
    subTabs: [{ id: 'character', label: 'Characters', icon: 'Sparkles', description: 'Create & manage characters' }],
  },
  {
    id: 'media',
    label: 'Library',
    subTabs: [{ id: 'media', label: 'Library', icon: 'Image', description: 'Media assets & stock library' }],
  },
  // Generator group removed — all generator tools now live in the right panel dropdown.
  // Access via "Generate" buttons in Library (Images / Videos tabs).
  {
    id: 'audio',
    label: 'Audio',
    subTabs: [
      { id: 'audio-browse', label: 'Browse & SFX', icon: 'Music', description: 'Browse, search & generate audio' },
      { id: 'voice-clone', label: 'Voice Clone', icon: 'Mic', description: 'Clone & manage custom voices' },
      { id: 'singing', label: 'Singing', icon: 'Music', description: 'Singing lip sync & audio' },
      { id: 'adaptive-music', label: 'Adaptive Music', icon: 'Music', description: 'Emotion-driven adaptive music' },
      {
        id: 'audio-enhancement',
        label: 'Audio FX',
        icon: 'AudioLines',
        description: 'Professional audio processing & enhancement',
      },
      { id: 'beat-sync', label: 'Audio Sync', icon: 'Music', description: 'Sync animations to audio beats' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    subTabs: [
      { id: 'mixed-media', label: 'Mixed Media', icon: 'Layers', description: 'Overlays & style effects' },
      { id: 'animStyle', label: 'Anim Style', icon: 'Wand2', description: 'Transfer animation style to keyframes' },
      {
        id: 'style-transfer',
        label: 'Style Transfer',
        icon: 'Paintbrush',
        description: 'AI video style transformation',
      },
      { id: 'transitions', label: 'Transitions', icon: 'ArrowRightLeft', description: 'Scene transition effects' },
      {
        id: 'cinema-studio',
        label: 'Cinema',
        icon: 'Film',
        description: 'Cinema camera body, lens & optical controls',
      },
    ],
  },
  {
    id: 'script',
    label: 'Script',
    subTabs: [
      { id: 'scripts', label: 'Script', icon: 'ScrollText', description: 'AI-generated scripts & voiceover' },
      { id: 'dialogue', label: 'Dialogue', icon: 'MessageCircle', description: 'Multi-character dialogue editor' },
      { id: 'transcript', label: 'Transcript', icon: 'FileText', description: 'Text-based video editing' },
      { id: 'captions', label: 'Captions', icon: 'Subtitles', description: 'Auto-synced subtitles & styles' },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    subTabs: [
      { id: 'text', label: 'Text', icon: 'Type', description: 'Titles, subtitles & text overlays' },
      { id: 'brand-kit', label: 'Brand Kit', icon: 'Palette', description: 'Colors, fonts & brand assets' },
      { id: 'schema', label: 'Schema', icon: 'Database', description: 'Project variables & bindings' },
      {
        id: 'assets',
        label: 'Assets',
        icon: 'Layers',
        description: 'Animations, SVG art, components & motion designs',
      },
      { id: 'memes', label: 'Memes', icon: 'Smile', description: 'Meme template generator' },
      { id: 'crowd', label: 'Crowd', icon: 'Users', description: 'Background crowd character generator' },
      {
        id: 'motion-gallery',
        label: 'Motion Gallery',
        icon: 'LayoutGrid',
        description: 'Browse 800+ motion graphics templates',
      },
    ],
  },
  {
    id: 'publish',
    label: 'Publish',
    subTabs: [
      { id: 'auto-publish', label: 'Schedule', icon: 'Calendar', description: 'Auto-publish & scheduling' },
      { id: 'series', label: 'Series', icon: 'Library', description: 'Episodic content management' },
      {
        id: 'competitor-scraper',
        label: 'Competitors',
        icon: 'Search',
        description: 'Scrape & analyze competitor videos',
      },
      { id: 'trends', label: 'Trends', icon: 'Flame', description: 'Trending topics & hashtags' },
      { id: 'virality', label: 'Score', icon: 'TrendingUp', description: 'Virality & engagement scoring' },
      { id: 'repurpose', label: 'Repurpose', icon: 'Copy', description: 'Resize & adapt for platforms' },
    ],
  },
  // {
  //   id: 'apps',
  //   label: 'Apps',
  //   subTabs: [
  //     { id: 'apps', label: 'Apps', icon: 'LayoutGrid', description: 'One-click creative apps' },
  //   ],
  // },
]

/** Reverse lookup: any LeftPanelTab → its group */
export const TAB_TO_GROUP: Record<string, TabGroupId> = {}
for (const group of TAB_GROUPS) {
  if (group.subTabs.length === 0) {
    // 'layers' group has no sub-tabs — the group ID itself maps
    TAB_TO_GROUP[group.id] = group.id
  }
  for (const sub of group.subTabs) {
    TAB_TO_GROUP[sub.id] = group.id
  }
}
// Hidden tabs that still belong to groups (used for canvas mode switching)
TAB_TO_GROUP['rig-editor'] = 'create'
TAB_TO_GROUP['rig-editor-3d'] = 'create'
TAB_TO_GROUP['3d-objects'] = 'create'

/** Default sub-tab when clicking a group icon */
export const GROUP_DEFAULT_TAB: Record<TabGroupId, LeftPanelTab> = {
  create: 'character',
  media: 'media',
  // video group removed — generators moved to right panel
  audio: 'audio-browse',
  edit: 'mixed-media',
  script: 'scripts',
  design: 'text',
  publish: 'auto-publish',
  // apps: 'apps',
}

/** Absorbed/merged tabs → redirect target */
export const ABSORBED_TAB_REDIRECT: Partial<Record<string, LeftPanelTab>> = {
  // Legacy redirects
  templates: 'scripts',
  translation: 'dialogue',
  'transcript-editor': 'dialogue',
  'transcript-import': 'dialogue',
  dubbing: 'dialogue',
  'content-calendar': 'auto-publish',
  'motion-capture': 'character',
  'motion-tracking': 'character',
  'live-avatar': 'character',
  '3d-objects': 'character',
  // Moved to right panel
  'character-identity': 'character',
  wardrobe: 'character',
  // AI Models became dropdown (no standalone tab)
  'ai-models': 'assets',
  // Apps tab commented out
  apps: 'character',
  // Consolidated into Assets tab
  'svg-art': 'assets',
  'component-creator': 'assets',
  'motion-design': 'assets',
  animations: 'assets',
  // Merged/absorbed tabs
  camera: 'cinema-studio',
  'shot-grid': 'cinema-studio',
  'effect-browser': 'mixed-media',
  'style-effects': 'mixed-media',
  moodboard: 'brand-kit',
  'audio-reactive': 'beat-sync',
  'content-score': 'virality',
  pacing: 'virality',
  'social-integration': 'trends',
  annotations: 'text',
  'export-profiles': 'auto-publish',
  'branching-video': 'scripts',
  'pptx-import': 'media',
  // Generator tabs moved to right panel — redirect to Library
  'gen-image': 'media',
  'gen-text-to-video': 'media',
  'image-to-video': 'media',
  'gen-audio-to-video': 'media',
  'gen-video-to-video': 'media',
  'gen-retake': 'media',
  'gen-extend': 'media',
  'broll-suggest': 'media',
  'gen-manim': 'media',
}
