/**
 * Meme Template definitions.
 *
 * Each meme template is a BuiltinTemplate with category 'memes'.
 * The HTML files are in src/data/templates/meme-*.html and loaded
 * via Vite raw imports through builtinTemplates.ts.
 *
 * Meme templates follow the same CONFIG pattern as all other HTML
 * motion graphics templates, so the existing template config parser,
 * template bridge, and HTMLTemplateLayer infrastructure work seamlessly.
 */

import type { BuiltinTemplate } from './builtinTemplates'

export interface MemeTemplateMeta {
  /** Human-friendly template name */
  name: string
  /** Short description of the meme format */
  description: string
  /** Emoji thumbnail for the meme browser grid */
  emoji: string
  /** The editable text fields with their CONFIG key and label */
  fields: { key: string; label: string; placeholder: string }[]
}

/**
 * Metadata for meme templates (used by MemePanel for specialized UI).
 * Keyed by template id.
 */
export const MEME_TEMPLATE_META: Record<string, MemeTemplateMeta> = {
  'tpl-meme-drake': {
    name: 'Drake Format',
    description: 'Two panels: top = dislike, bottom = like',
    emoji: '\u{1F645}\u200D\u2642\uFE0F',
    fields: [
      { key: 'topText', label: 'Dislike (Top)', placeholder: 'Thing you dislike...' },
      { key: 'bottomText', label: 'Like (Bottom)', placeholder: 'Thing you prefer...' },
    ],
  },
  'tpl-meme-distracted-boyfriend': {
    name: 'Distracted Boyfriend',
    description: 'Three characters with labels',
    emoji: '\u{1F633}',
    fields: [
      { key: 'boyfriendLabel', label: 'Boyfriend (center)', placeholder: 'Me' },
      { key: 'girlfriendLabel', label: 'Girlfriend (right)', placeholder: 'My responsibilities' },
      { key: 'otherLabel', label: 'Other person (left)', placeholder: 'New shiny thing' },
    ],
  },
  'tpl-meme-change-my-mind': {
    name: 'Change My Mind',
    description: 'Person at table with sign',
    emoji: '\u{1F9D4}',
    fields: [
      { key: 'signText', label: 'Sign text', placeholder: 'Your hot take here...' },
      { key: 'bannerText', label: 'Banner text', placeholder: 'CHANGE MY MIND' },
    ],
  },
  'tpl-meme-expanding-brain': {
    name: 'Expanding Brain',
    description: 'Four tiers of increasing enlightenment',
    emoji: '\u{1F9E0}',
    fields: [
      { key: 'tier1Text', label: 'Tier 1 (small brain)', placeholder: 'Basic thing...' },
      { key: 'tier2Text', label: 'Tier 2 (medium brain)', placeholder: 'Better thing...' },
      { key: 'tier3Text', label: 'Tier 3 (glowing brain)', placeholder: 'Smart thing...' },
      { key: 'tier4Text', label: 'Tier 4 (galaxy brain)', placeholder: 'Ascended thing...' },
    ],
  },
  'tpl-meme-two-buttons': {
    name: 'Two Buttons',
    description: 'Sweating over two choices',
    emoji: '\u{1F630}',
    fields: [
      { key: 'leftButtonText', label: 'Left button', placeholder: 'Option A...' },
      { key: 'rightButtonText', label: 'Right button', placeholder: 'Option B...' },
      { key: 'titleText', label: 'Title', placeholder: 'THE HARDEST CHOICES' },
    ],
  },
  'tpl-meme-this-is-fine': {
    name: 'This Is Fine',
    description: 'Dog in burning room',
    emoji: '\u{1F525}',
    fields: [
      { key: 'speechText', label: 'Speech bubble', placeholder: 'This is fine.' },
    ],
  },
  'tpl-meme-stonks': {
    name: 'Stonks',
    description: 'Rising chart with meme man',
    emoji: '\u{1F4C8}',
    fields: [
      { key: 'titleText', label: 'Title', placeholder: 'STONKS' },
      { key: 'captionText', label: 'Caption', placeholder: 'When you buy high...' },
    ],
  },
  'tpl-meme-surprised-pikachu': {
    name: 'Surprised Pikachu',
    description: 'Doing something obvious, then acting surprised',
    emoji: '\u{1F62E}',
    fields: [
      { key: 'setupText', label: 'Setup text', placeholder: 'When you do the obvious thing...' },
      { key: 'captionText', label: 'Caption', placeholder: '*surprised face*' },
    ],
  },
  'tpl-meme-galaxy-brain': {
    name: 'Galaxy Brain',
    description: 'Cosmic brain enlightenment moment',
    emoji: '\u{1F30C}',
    fields: [
      { key: 'mainText', label: 'Main text', placeholder: 'Your galaxy brain take...' },
      { key: 'subText', label: 'Subtitle', placeholder: 'GALAXY BRAIN MOMENT' },
    ],
  },
  'tpl-meme-one-does-not-simply': {
    name: 'One Does Not Simply',
    description: 'Classic top/bottom text meme',
    emoji: '\u{1F9D0}',
    fields: [
      { key: 'topText', label: 'Top text', placeholder: 'One does not simply...' },
      { key: 'bottomText', label: 'Bottom text', placeholder: 'Walk into mordor' },
    ],
  },
  'tpl-meme-is-this-a': {
    name: 'Is This A...?',
    description: 'Person pointing at butterfly asking a question',
    emoji: '\u{1F98B}',
    fields: [
      { key: 'personLabel', label: 'Person label', placeholder: 'Me' },
      { key: 'butterflyLabel', label: 'Butterfly label', placeholder: 'Any minor inconvenience' },
      { key: 'questionText', label: 'Question', placeholder: 'Is this a reason to give up?' },
    ],
  },
  'tpl-meme-exit-ramp': {
    name: 'Exit Ramp',
    description: 'Car swerving off the highway',
    emoji: '\u{1F697}',
    fields: [
      { key: 'straightText', label: 'Straight ahead (good choice)', placeholder: 'Being productive' },
      { key: 'exitText', label: 'Exit ramp (bad choice)', placeholder: 'Scrolling memes' },
      { key: 'driverLabel', label: 'Driver label', placeholder: 'Me at 2 AM' },
    ],
  },
}

/**
 * Meme template definitions in BuiltinTemplate format.
 * These are appended to BUILTIN_TEMPLATES in builtinTemplates.ts.
 */
export const MEME_TEMPLATES: BuiltinTemplate[] = [
  {
    id: 'tpl-meme-drake',
    title: 'Drake Format',
    description: 'Two-panel meme: top panel = dislike, bottom panel = like. Animated slide-in with emoji reactions.',
    filename: 'meme-drake.html',
    tags: ['meme', 'drake', 'comparison', 'two-panel'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-distracted-boyfriend',
    title: 'Distracted Boyfriend',
    description: 'Three-character meme with labeled emoji characters. Animated label reveals with heart and eyes.',
    filename: 'meme-distracted-boyfriend.html',
    tags: ['meme', 'distracted', 'boyfriend', 'three-label'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-change-my-mind',
    title: 'Change My Mind',
    description: 'Person sitting at a table with a sign. Outdoor scene with clouds and coffee cup.',
    filename: 'meme-change-my-mind.html',
    tags: ['meme', 'change-my-mind', 'debate', 'opinion'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-expanding-brain',
    title: 'Expanding Brain',
    description: 'Four tiers of escalating brain power with increasing glow effects and particles.',
    filename: 'meme-expanding-brain.html',
    tags: ['meme', 'expanding-brain', 'tiers', 'escalation'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-two-buttons',
    title: 'Two Buttons',
    description: 'Sweating over two impossible choices. Animated button reveals with stressed emoji.',
    filename: 'meme-two-buttons.html',
    tags: ['meme', 'two-buttons', 'choice', 'dilemma'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-this-is-fine',
    title: 'This Is Fine',
    description: 'Dog sitting in burning room saying "This is fine." Progressive fire animation with embers.',
    filename: 'meme-this-is-fine.html',
    tags: ['meme', 'this-is-fine', 'fire', 'denial'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-stonks',
    title: 'Stonks',
    description: 'Rising stock chart with meme man emoji. Animated chart drawing with scrolling ticker.',
    filename: 'meme-stonks.html',
    tags: ['meme', 'stonks', 'stocks', 'chart', 'finance'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-surprised-pikachu',
    title: 'Surprised Pikachu',
    description: 'Setup text followed by surprised face reveal with burst lines and exclamation marks.',
    filename: 'meme-surprised-pikachu.html',
    tags: ['meme', 'surprised', 'pikachu', 'reaction'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-galaxy-brain',
    title: 'Galaxy Brain',
    description: 'Cosmic brain with expanding glow rings on starfield. Nebula effects and particle stars.',
    filename: 'meme-galaxy-brain.html',
    tags: ['meme', 'galaxy-brain', 'cosmic', 'enlightenment'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-one-does-not-simply',
    title: 'One Does Not Simply',
    description: 'Classic top/bottom text with dramatic lighting and scan line effects.',
    filename: 'meme-one-does-not-simply.html',
    tags: ['meme', 'one-does-not-simply', 'classic', 'boromir'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-is-this-a',
    title: 'Is This A...?',
    description: 'Person pointing at butterfly meme with labeled characters and question text.',
    filename: 'meme-is-this-a.html',
    tags: ['meme', 'is-this-a', 'butterfly', 'question'],
    category: 'memes',
  },
  {
    id: 'tpl-meme-exit-ramp',
    title: 'Exit Ramp',
    description: 'Car swerving off highway to take the exit. Road scene with animated swerve and tire marks.',
    filename: 'meme-exit-ramp.html',
    tags: ['meme', 'exit-ramp', 'highway', 'swerve', 'choice'],
    category: 'memes',
  },
]
