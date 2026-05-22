import type { MotionDesignDescription } from '@proanimate/core'

export interface BundledTemplate {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  featured: boolean
  configSchema: Array<{
    key: string
    label: string
    type: 'text' | 'color' | 'number' | 'boolean' | 'text-array' | 'select'
    defaultValue: unknown
    group: string
    options?: string[]
    min?: number
    max?: number
  }>
  defaultConfig: Record<string, unknown>
  motionDesignDescription: MotionDesignDescription
}

// ---------------------------------------------------------------------------
// KINETIC TYPOGRAPHY (20 templates)
// ---------------------------------------------------------------------------

const kt01_bounce: BundledTemplate = {
  id: 'kt-bounce-pop',
  title: 'Bounce Pop',
  description: 'Bold word slams in with a rubbery bounce, flanked by decorative lines.',
  category: 'kinetic-typography',
  tags: ['bounce', 'bold', 'energetic', 'fun'],
  featured: true,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'BOUNCE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#facc15', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#f97316', group: 'Style' },
  ],
  defaultConfig: { word: 'BOUNCE', bgColor: '#0a0a0a', textColor: '#facc15', accentColor: '#f97316' },
  motionDesignDescription: {
    name: 'Bounce Pop',
    description: 'Bold word slams in with a rubbery bounce.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'line-left',
        type: 'rect',
        style: { position: 'absolute', left: '8%', top: '48%', width: 60, height: 4, backgroundColor: '{{accentColor}}', borderRadius: 2 },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0, x: -40, scaleX: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0, x: -30 }, easing: 'easeIn' },
        },
      },
      {
        id: 'main-word',
        type: 'text',
        text: '{{word}}',
        style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{textColor}}', textAlign: 'center', letterSpacing: 6 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: -120, scale: 1.8 }, easing: 'bounceOut' },
          hold: { effect: 'pulse', amplitude: 0.03, speed: 2 },
          exit: { to: { opacity: 0, y: 60, scale: 0.5 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'line-right',
        type: 'rect',
        style: { position: 'absolute', right: '8%', top: '48%', width: 60, height: 4, backgroundColor: '{{accentColor}}', borderRadius: 2 },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0, x: 40, scaleX: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0, x: 30 }, easing: 'easeIn' },
        },
      },
      {
        id: 'shadow-circle',
        type: 'circle',
        style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', width: 120, height: 120, backgroundColor: '{{accentColor}}', opacity: 0.1, borderRadius: '50%' },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' },
          exit: { to: { opacity: 0, scale: 2 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt02_slide: BundledTemplate = {
  id: 'kt-smooth-slide',
  title: 'Smooth Slide',
  description: 'Words slide in from alternating sides with a smooth deceleration.',
  category: 'kinetic-typography',
  tags: ['slide', 'smooth', 'clean', 'modern'],
  featured: false,
  configSchema: [
    { key: 'line1', label: 'Line 1', type: 'text', defaultValue: 'THINK', group: 'Content' },
    { key: 'line2', label: 'Line 2', type: 'text', defaultValue: 'DIFFERENT', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
  defaultConfig: { line1: 'THINK', line2: 'DIFFERENT', bgColor: '#1a1a2e', textColor: '#e2e8f0', accentColor: '#6366f1' },
  motionDesignDescription: {
    name: 'Smooth Slide',
    description: 'Words slide in from alternating sides.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'top-line',
        type: 'rect',
        style: { position: 'absolute', top: '35%', left: '15%', width: '70%', height: 2, backgroundColor: '{{accentColor}}', opacity: 0.4 },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'word1',
        type: 'text',
        text: '{{line1}}',
        style: { position: 'absolute', top: '38%', left: '15%', fontSize: 56, fontWeight: 300, color: '{{textColor}}', letterSpacing: 12 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, x: -200 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, x: -100 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'word2',
        type: 'text',
        text: '{{line2}}',
        style: { position: 'absolute', top: '48%', right: '15%', fontSize: 56, fontWeight: 800, color: '{{accentColor}}', letterSpacing: 4 },
        animation: {
          enterDelay: 0.25,
          enter: { from: { opacity: 0, x: 200 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, x: 100 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'bottom-line',
        type: 'rect',
        style: { position: 'absolute', top: '58%', left: '15%', width: '70%', height: 2, backgroundColor: '{{accentColor}}', opacity: 0.4 },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt03_scale: BundledTemplate = {
  id: 'kt-scale-explosion',
  title: 'Scale Explosion',
  description: 'Text scales up from nothing with an elastic overshoot against a vivid backdrop.',
  category: 'kinetic-typography',
  tags: ['scale', 'explosion', 'dramatic', 'vivid'],
  featured: true,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'WOW', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'that was amazing', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#7c3aed', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
  defaultConfig: { word: 'WOW', subtitle: 'that was amazing', bgColor: '#7c3aed', textColor: '#ffffff' },
  motionDesignDescription: {
    name: 'Scale Explosion',
    description: 'Text scales up from nothing with elastic overshoot.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.15,
    elements: [
      {
        id: 'bg-circle',
        type: 'circle',
        style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 250, height: 250, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '50%' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, scale: 3 }, easing: 'easeIn' },
        },
      },
      {
        id: 'main-word',
        type: 'text',
        text: '{{word}}',
        style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 96, fontWeight: 900, color: '{{textColor}}', textAlign: 'center' },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' },
          hold: { effect: 'breathe', amplitude: 0.02, speed: 1.5 },
          exit: { to: { opacity: 0, scale: 3, blur: 10 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'subtitle',
        type: 'text',
        text: '{{subtitle}}',
        style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 400, color: 'rgba(255,255,255,0.7)', textAlign: 'center', letterSpacing: 3 },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, y: 20 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt04_fade: BundledTemplate = {
  id: 'kt-elegant-fade',
  title: 'Elegant Fade',
  description: 'Soft, sophisticated text fade with a thin underline accent on cream background.',
  category: 'kinetic-typography',
  tags: ['fade', 'elegant', 'minimal', 'soft'],
  featured: false,
  configSchema: [
    { key: 'line1', label: 'Line 1', type: 'text', defaultValue: 'Less is', group: 'Content' },
    { key: 'line2', label: 'Line 2', type: 'text', defaultValue: 'More', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1c1917', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#d97706', group: 'Style' },
  ],
  defaultConfig: { line1: 'Less is', line2: 'More', bgColor: '#fafaf9', textColor: '#1c1917', accentColor: '#d97706' },
  motionDesignDescription: {
    name: 'Elegant Fade',
    description: 'Soft, sophisticated text fade with thin underline.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.2,
    elements: [
      {
        id: 'line1',
        type: 'text',
        text: '{{line1}}',
        typographyPreset: 'elegant-fade',
        style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 300, color: '{{textColor}}', letterSpacing: 2, fontStyle: 'italic' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, blur: 8 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, blur: 8 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'line2',
        type: 'text',
        text: '{{line2}}',
        typographyPreset: 'elegant-fade',
        style: { position: 'absolute', top: '48%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 700, color: '{{textColor}}' },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0, blur: 8 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, blur: 8 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'underline',
        type: 'rect',
        style: { position: 'absolute', top: '58%', left: '35%', width: '30%', height: 2, backgroundColor: '{{accentColor}}' },
        animation: {
          enterDelay: 0.6,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt05_elasticPop: BundledTemplate = {
  id: 'kt-elastic-pop',
  title: 'Elastic Pop',
  description: 'Letters pop in one by one with springy overshoot on a neon-lit dark canvas.',
  category: 'kinetic-typography',
  tags: ['elastic', 'pop', 'neon', 'character'],
  featured: true,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'CREATE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f23', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#22d3ee', group: 'Style' },
    { key: 'glowColor', label: 'Glow', type: 'color', defaultValue: '#06b6d4', group: 'Style' },
  ],
  defaultConfig: { word: 'CREATE', bgColor: '#0f0f23', textColor: '#22d3ee', glowColor: '#06b6d4' },
  motionDesignDescription: {
    name: 'Elastic Pop',
    description: 'Letters pop in one by one with springy overshoot.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.15,
    elements: [
      {
        id: 'glow-bg',
        type: 'circle',
        style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, backgroundColor: '{{glowColor}}', opacity: 0.06, borderRadius: '50%', filter: 'blur(40px)' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0.5 }, easing: 'cubicOut' },
          hold: { effect: 'glow', amplitude: 0.3, speed: 1 },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'main-text',
        type: 'text',
        text: '{{word}}',
        typographyPreset: 'character-pop',
        style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 68, fontWeight: 800, color: '{{textColor}}', letterSpacing: 14, textShadow: '0 0 30px {{glowColor}}' },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, scale: 0, rotation: -10 }, easing: 'elasticOut' },
          hold: { effect: 'glow', amplitude: 0.15, speed: 2 },
          exit: { to: { opacity: 0, y: 40, blur: 6 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'tagline',
        type: 'text',
        text: 'something new',
        style: { position: 'absolute', top: '56%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: 8, textTransform: 'uppercase' },
        animation: {
          enterDelay: 0.6,
          enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt06_cinematic: BundledTemplate = {
  id: 'kt-cinematic-reveal',
  title: 'Cinematic Reveal',
  description: 'Letterboxed reveal with horizontal bars retracting to expose bold title text.',
  category: 'kinetic-typography',
  tags: ['cinematic', 'reveal', 'film', 'dramatic'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'THE STORY', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'begins now', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
  defaultConfig: { title: 'THE STORY', subtitle: 'begins now', bgColor: '#0a0a0a', textColor: '#fbbf24' },
  motionDesignDescription: {
    name: 'Cinematic Reveal',
    description: 'Letterboxed reveal with horizontal bars.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.2,
    elements: [
      {
        id: 'bar-top',
        type: 'rect',
        style: { position: 'absolute', top: '0%', left: '0%', width: '100%', height: '38%', backgroundColor: '#111111' },
        animation: {
          enterDelay: 0,
          enter: { from: { y: -100 }, easing: 'cubicOut' },
          exit: { to: { y: -200 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'bar-bottom',
        type: 'rect',
        style: { position: 'absolute', bottom: '0%', left: '0%', width: '100%', height: '38%', backgroundColor: '#111111' },
        animation: {
          enterDelay: 0,
          enter: { from: { y: 100 }, easing: 'cubicOut' },
          exit: { to: { y: 200 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'title-text',
        type: 'text',
        text: '{{title}}',
        style: { position: 'absolute', top: '43%', left: '50%', transform: 'translateX(-50%)', fontSize: 52, fontWeight: 900, color: '{{textColor}}', letterSpacing: 8 },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        text: '{{subtitle}}',
        style: { position: 'absolute', top: '54%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: 6 },
        animation: {
          enterDelay: 0.55,
          enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt07_neonGlow: BundledTemplate = {
  id: 'kt-neon-glow',
  title: 'Neon Glow',
  description: 'Text flickers to life like a neon sign with intense color glow on dark background.',
  category: 'kinetic-typography',
  tags: ['neon', 'glow', 'retro', 'night'],
  featured: true,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'OPEN', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c1d', group: 'Style' },
    { key: 'neonColor', label: 'Neon Color', type: 'color', defaultValue: '#f43f5e', group: 'Style' },
  ],
  defaultConfig: { word: 'OPEN', bgColor: '#0c0c1d', neonColor: '#f43f5e' },
  motionDesignDescription: {
    name: 'Neon Glow',
    description: 'Text flickers to life like a neon sign.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'neon-backlight',
        type: 'circle',
        style: { position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, backgroundColor: '{{neonColor}}', opacity: 0.08, borderRadius: '50%', filter: 'blur(60px)' },
        animation: {
          enterDelay: 0.2,
          enter: { from: { opacity: 0 }, easing: 'linear' },
          hold: { effect: 'pulse', amplitude: 0.4, speed: 3 },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'neon-text',
        type: 'text',
        text: '{{word}}',
        style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 80, fontWeight: 700, color: '{{neonColor}}', textShadow: '0 0 10px {{neonColor}}, 0 0 40px {{neonColor}}, 0 0 80px {{neonColor}}', letterSpacing: 10 },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, blur: 12 }, easing: 'cubicOut' },
          hold: { effect: 'glow', amplitude: 0.25, speed: 4 },
          exit: { to: { opacity: 0, blur: 8 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'neon-underline',
        type: 'rect',
        style: { position: 'absolute', top: '56%', left: '25%', width: '50%', height: 3, backgroundColor: '{{neonColor}}', boxShadow: '0 0 12px {{neonColor}}', borderRadius: 2 },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'backOut' },
          hold: { effect: 'glow', amplitude: 0.3, speed: 3 },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt08_glitch: BundledTemplate = {
  id: 'kt-glitch-hack',
  title: 'Glitch Hack',
  description: 'Distorted text with digital glitch aesthetic and offset colored shadows.',
  category: 'kinetic-typography',
  tags: ['glitch', 'digital', 'hack', 'cyberpunk'],
  featured: false,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'ERROR', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f1f5f9', group: 'Style' },
    { key: 'glitchColor1', label: 'Glitch 1', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'glitchColor2', label: 'Glitch 2', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
  ],
  defaultConfig: { word: 'ERROR', bgColor: '#0d0d0d', textColor: '#f1f5f9', glitchColor1: '#ef4444', glitchColor2: '#3b82f6' },
  motionDesignDescription: {
    name: 'Glitch Hack',
    description: 'Distorted text with digital glitch aesthetic.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.25,
    exitDuration: 0.1,
    elements: [
      {
        id: 'glitch-shadow-r',
        type: 'text',
        text: '{{word}}',
        typographyPreset: 'glitch-hack',
        style: { position: 'absolute', top: '43%', left: '51%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{glitchColor1}}', opacity: 0.6, letterSpacing: 4 },
        animation: {
          enterDelay: 0.05,
          enter: { from: { opacity: 0, x: 20 }, easing: 'linear' },
          exit: { to: { opacity: 0, x: -15 }, easing: 'linear' },
        },
      },
      {
        id: 'glitch-shadow-b',
        type: 'text',
        text: '{{word}}',
        typographyPreset: 'glitch-hack',
        style: { position: 'absolute', top: '42.5%', left: '49%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{glitchColor2}}', opacity: 0.6, letterSpacing: 4 },
        animation: {
          enterDelay: 0.08,
          enter: { from: { opacity: 0, x: -20 }, easing: 'linear' },
          exit: { to: { opacity: 0, x: 15 }, easing: 'linear' },
        },
      },
      {
        id: 'main-text',
        type: 'text',
        text: '{{word}}',
        typographyPreset: 'glitch-hack',
        style: { position: 'absolute', top: '42.5%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{textColor}}', letterSpacing: 4 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0 }, easing: 'linear' },
          exit: { to: { opacity: 0 }, easing: 'linear' },
        },
      },
      {
        id: 'scan-line',
        type: 'rect',
        style: { position: 'absolute', top: '46%', left: '0%', width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0, y: -60 }, easing: 'linear' },
          exit: { to: { opacity: 0, y: 60 }, easing: 'linear' },
        },
      },
    ],
  },
}

const kt09_wave: BundledTemplate = {
  id: 'kt-wave-playful',
  title: 'Wave Playful',
  description: 'Text undulates in a wave pattern with pastel palette and playful energy.',
  category: 'kinetic-typography',
  tags: ['wave', 'playful', 'pastel', 'fun'],
  featured: false,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'HELLO!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fef3c7', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#9333ea', group: 'Style' },
  ],
  defaultConfig: { word: 'HELLO!', bgColor: '#fef3c7', textColor: '#9333ea' },
  motionDesignDescription: {
    name: 'Wave Playful',
    description: 'Text undulates in a wave pattern.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'deco-circle-1',
        type: 'circle',
        style: { position: 'absolute', top: '30%', left: '20%', width: 40, height: 40, backgroundColor: '#f9a8d4', borderRadius: '50%', opacity: 0.5 },
        animation: {
          enterDelay: 0.4,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' },
          hold: { effect: 'float', amplitude: 8, speed: 1.5 },
          exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'wave-text',
        type: 'text',
        text: '{{word}}',
        typographyPreset: 'wave-playful',
        style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 800, color: '{{textColor}}' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: 50, rotation: -5 }, easing: 'backOut' },
          hold: { effect: 'float', amplitude: 6, speed: 2 },
          exit: { to: { opacity: 0, y: -30 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'deco-circle-2',
        type: 'circle',
        style: { position: 'absolute', top: '55%', right: '18%', width: 30, height: 30, backgroundColor: '#a78bfa', borderRadius: '50%', opacity: 0.5 },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' },
          hold: { effect: 'float', amplitude: 10, speed: 1 },
          exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'deco-circle-3',
        type: 'circle',
        style: { position: 'absolute', top: '62%', left: '35%', width: 20, height: 20, backgroundColor: '#fbbf24', borderRadius: '50%', opacity: 0.5 },
        animation: {
          enterDelay: 0.6,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' },
          hold: { effect: 'float', amplitude: 5, speed: 2 },
          exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt10_typewriter: BundledTemplate = {
  id: 'kt-typewriter',
  title: 'Typewriter Classic',
  description: 'Monospaced text types itself out letter by letter with a blinking cursor.',
  category: 'kinetic-typography',
  tags: ['typewriter', 'classic', 'retro', 'mono'],
  featured: false,
  configSchema: [
    { key: 'text', label: 'Text', type: 'text', defaultValue: 'Once upon a time...', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fffbeb', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#292524', group: 'Style' },
  ],
  defaultConfig: { text: 'Once upon a time...', bgColor: '#fffbeb', textColor: '#292524' },
  motionDesignDescription: {
    name: 'Typewriter Classic',
    description: 'Monospaced text types itself out.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.15,
    elements: [
      {
        id: 'paper-texture',
        type: 'rect',
        style: { position: 'absolute', top: '30%', left: '10%', width: '80%', height: '40%', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 4 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'typed-text',
        type: 'text',
        text: '{{text}}',
        typographyPreset: 'typewriter-classic',
        style: { position: 'absolute', top: '43%', left: '15%', fontSize: 28, fontWeight: 400, color: '{{textColor}}', fontFamily: 'monospace', maxWidth: '70%' },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0 }, easing: 'linear' },
          exit: { to: { opacity: 0, blur: 4 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'cursor',
        type: 'rect',
        style: { position: 'absolute', top: '43%', left: '72%', width: 3, height: 30, backgroundColor: '{{textColor}}' },
        animation: {
          enterDelay: 0.6,
          enter: { from: { opacity: 0 }, easing: 'linear' },
          hold: { effect: 'pulse', amplitude: 1, speed: 4 },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt11_cascade: BundledTemplate = {
  id: 'kt-cascade-fall',
  title: 'Cascade Fall',
  description: 'Words cascade down the screen with staggered gravity drops on navy background.',
  category: 'kinetic-typography',
  tags: ['cascade', 'fall', 'stagger', 'gravity'],
  featured: false,
  configSchema: [
    { key: 'word1', label: 'Word 1', type: 'text', defaultValue: 'EVERY', group: 'Content' },
    { key: 'word2', label: 'Word 2', type: 'text', defaultValue: 'PIXEL', group: 'Content' },
    { key: 'word3', label: 'Word 3', type: 'text', defaultValue: 'MATTERS', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e293b', group: 'Style' },
    { key: 'color1', label: 'Color 1', type: 'color', defaultValue: '#f472b6', group: 'Style' },
    { key: 'color2', label: 'Color 2', type: 'color', defaultValue: '#a78bfa', group: 'Style' },
    { key: 'color3', label: 'Color 3', type: 'color', defaultValue: '#38bdf8', group: 'Style' },
  ],
  defaultConfig: { word1: 'EVERY', word2: 'PIXEL', word3: 'MATTERS', bgColor: '#1e293b', color1: '#f472b6', color2: '#a78bfa', color3: '#38bdf8' },
  motionDesignDescription: {
    name: 'Cascade Fall',
    description: 'Words cascade down the screen with staggered gravity.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'w1',
        type: 'text',
        text: '{{word1}}',
        typographyPreset: 'kinetic-cascade',
        style: { position: 'absolute', top: '30%', left: '15%', fontSize: 48, fontWeight: 300, color: '{{color1}}', letterSpacing: 6 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: -80 }, easing: 'bounceOut' },
          exit: { to: { opacity: 0, y: 40 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'w2',
        type: 'text',
        text: '{{word2}}',
        typographyPreset: 'kinetic-cascade',
        style: { position: 'absolute', top: '42%', left: '30%', fontSize: 60, fontWeight: 700, color: '{{color2}}', letterSpacing: 4 },
        animation: {
          enterDelay: 0.2,
          enter: { from: { opacity: 0, y: -100 }, easing: 'bounceOut' },
          exit: { to: { opacity: 0, y: 60 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'w3',
        type: 'text',
        text: '{{word3}}',
        typographyPreset: 'kinetic-cascade',
        style: { position: 'absolute', top: '55%', left: '20%', fontSize: 52, fontWeight: 900, color: '{{color3}}', letterSpacing: 8 },
        animation: {
          enterDelay: 0.4,
          enter: { from: { opacity: 0, y: -120 }, easing: 'bounceOut' },
          exit: { to: { opacity: 0, y: 80 }, easing: 'cubicIn' },
        },
      },
    ],
  },
}

const kt12_rotate: BundledTemplate = {
  id: 'kt-spin-reveal',
  title: 'Spin Reveal',
  description: 'Text spins into frame with a rotational entrance, landing on a warm terracotta background.',
  category: 'kinetic-typography',
  tags: ['rotate', 'spin', 'reveal', 'warm'],
  featured: false,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'DESIGN', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'with intention', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#dc6843', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fef2f2', group: 'Style' },
  ],
  defaultConfig: { word: 'DESIGN', tagline: 'with intention', bgColor: '#dc6843', textColor: '#fef2f2' },
  motionDesignDescription: {
    name: 'Spin Reveal',
    description: 'Text spins into frame with rotational entrance.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'circle-deco',
        type: 'circle',
        style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', backgroundColor: 'transparent' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0, rotation: -180 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, rotation: 90 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'spin-text',
        type: 'text',
        text: '{{word}}',
        style: { position: 'absolute', top: '43%', left: '50%', transform: 'translateX(-50%)', fontSize: 58, fontWeight: 800, color: '{{textColor}}', letterSpacing: 6 },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, rotation: -90, scale: 0.3 }, easing: 'backOut' },
          hold: { effect: 'breathe', amplitude: 0.02, speed: 1 },
          exit: { to: { opacity: 0, rotation: 45, scale: 0.5 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'tagline',
        type: 'text',
        text: '{{tagline}}',
        style: { position: 'absolute', top: '56%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.7)', letterSpacing: 4, fontStyle: 'italic' },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt13_zoom: BundledTemplate = {
  id: 'kt-zoom-through',
  title: 'Zoom Through',
  description: 'Text zooms past the camera like flying through space with trailing motion blur.',
  category: 'kinetic-typography',
  tags: ['zoom', 'speed', 'space', 'through'],
  featured: false,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'SPEED', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030712', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0f2fe', group: 'Style' },
    { key: 'trailColor', label: 'Trail', type: 'color', defaultValue: '#0ea5e9', group: 'Style' },
  ],
  defaultConfig: { word: 'SPEED', bgColor: '#030712', textColor: '#e0f2fe', trailColor: '#0ea5e9' },
  motionDesignDescription: {
    name: 'Zoom Through',
    description: 'Text zooms past camera with motion blur.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.25,
    exitDuration: 0.1,
    elements: [
      {
        id: 'star-1',
        type: 'circle',
        style: { position: 'absolute', top: '25%', left: '30%', width: 3, height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '50%' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, x: -100, scale: 2 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'star-2',
        type: 'circle',
        style: { position: 'absolute', top: '60%', left: '70%', width: 2, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '50%' },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, x: 80, scale: 2 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'trail-line',
        type: 'rect',
        style: { position: 'absolute', top: '48%', left: '0%', width: '100%', height: 2, backgroundColor: '{{trailColor}}', opacity: 0.3 },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'zoom-text',
        type: 'text',
        text: '{{word}}',
        style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 80, fontWeight: 900, color: '{{textColor}}', letterSpacing: 12 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 5, blur: 15 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, scale: 0, blur: 10 }, easing: 'cubicIn' },
        },
      },
    ],
  },
}

const kt14_blurFocus: BundledTemplate = {
  id: 'kt-blur-focus',
  title: 'Blur Focus',
  description: 'Text emerges from heavy blur into sharp focus, with a soft teal-to-dark gradient feel.',
  category: 'kinetic-typography',
  tags: ['blur', 'focus', 'depth', 'cinematic'],
  featured: false,
  configSchema: [
    { key: 'line1', label: 'Line 1', type: 'text', defaultValue: 'FOCUS', group: 'Content' },
    { key: 'line2', label: 'Line 2', type: 'text', defaultValue: 'on what matters', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#134e4a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ccfbf1', group: 'Style' },
  ],
  defaultConfig: { line1: 'FOCUS', line2: 'on what matters', bgColor: '#134e4a', textColor: '#ccfbf1' },
  motionDesignDescription: {
    name: 'Blur Focus',
    description: 'Text emerges from heavy blur into sharp focus.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.2,
    elements: [
      {
        id: 'focus-main',
        type: 'text',
        text: '{{line1}}',
        typographyPreset: 'blur-focus',
        style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 800, color: '{{textColor}}' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, blur: 20, scale: 1.1 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, blur: 20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'focus-sub',
        type: 'text',
        text: '{{line2}}',
        typographyPreset: 'blur-focus',
        style: { position: 'absolute', top: '53%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, fontWeight: 300, color: 'rgba(204,251,241,0.7)', letterSpacing: 4 },
        animation: {
          enterDelay: 0.35,
          enter: { from: { opacity: 0, blur: 12 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, blur: 12 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'lens-ring',
        type: 'circle',
        style: { position: 'absolute', top: '33%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, border: '1px solid rgba(204,251,241,0.15)', borderRadius: '50%', backgroundColor: 'transparent' },
        animation: {
          enterDelay: 0.2,
          enter: { from: { opacity: 0, scale: 0.5 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, scale: 1.5 }, easing: 'cubicIn' },
        },
      },
    ],
  },
}

const kt15_tracking: BundledTemplate = {
  id: 'kt-tracking-expand',
  title: 'Tracking Expand',
  description: 'Letters start compressed and expand with increasing letter-spacing reveal.',
  category: 'kinetic-typography',
  tags: ['tracking', 'expand', 'minimal', 'spacing'],
  featured: false,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'BREATHE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#44403c', group: 'Style' },
  ],
  defaultConfig: { word: 'BREATHE', bgColor: '#fafaf9', textColor: '#44403c' },
  motionDesignDescription: {
    name: 'Tracking Expand',
    description: 'Letters expand with increasing spacing.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.15,
    elements: [
      {
        id: 'dot-before',
        type: 'circle',
        style: { position: 'absolute', top: '47%', left: '12%', width: 6, height: 6, backgroundColor: '{{textColor}}', borderRadius: '50%', opacity: 0.3 },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'expand-text',
        type: 'text',
        text: '{{word}}',
        typographyPreset: 'tracking-reveal',
        style: { position: 'absolute', top: '43%', left: '50%', transform: 'translateX(-50%)', fontSize: 42, fontWeight: 300, color: '{{textColor}}', letterSpacing: 20 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scaleX: 0.5 }, easing: 'cubicOut' },
          hold: { effect: 'breathe', amplitude: 0.01, speed: 1 },
          exit: { to: { opacity: 0, scaleX: 1.5 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'dot-after',
        type: 'circle',
        style: { position: 'absolute', top: '47%', right: '12%', width: 6, height: 6, backgroundColor: '{{textColor}}', borderRadius: '50%', opacity: 0.3 },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt16_splitReveal: BundledTemplate = {
  id: 'kt-split-reveal',
  title: 'Split Reveal',
  description: 'Two halves of the word split apart to reveal a glowing accent word between them.',
  category: 'kinetic-typography',
  tags: ['split', 'reveal', 'contrast', 'dramatic'],
  featured: true,
  configSchema: [
    { key: 'topWord', label: 'Top Word', type: 'text', defaultValue: 'BREAK', group: 'Content' },
    { key: 'midWord', label: 'Middle Word', type: 'text', defaultValue: 'THE', group: 'Content' },
    { key: 'bottomWord', label: 'Bottom Word', type: 'text', defaultValue: 'RULES', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f4f4f5', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#f43f5e', group: 'Style' },
  ],
  defaultConfig: { topWord: 'BREAK', midWord: 'THE', bottomWord: 'RULES', bgColor: '#18181b', textColor: '#f4f4f5', accentColor: '#f43f5e' },
  motionDesignDescription: {
    name: 'Split Reveal',
    description: 'Two halves split apart revealing accent word.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'top-word',
        type: 'text',
        text: '{{topWord}}',
        style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 900, color: '{{textColor}}', letterSpacing: 6 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: 40 }, easing: 'backOut' },
          exit: { to: { opacity: 0, y: -30 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'mid-accent',
        type: 'text',
        text: '{{midWord}}',
        style: { position: 'absolute', top: '45%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 400, color: '{{accentColor}}', letterSpacing: 14, fontStyle: 'italic' },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' },
          hold: { effect: 'glow', amplitude: 0.2, speed: 2 },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'bottom-word',
        type: 'text',
        text: '{{bottomWord}}',
        style: { position: 'absolute', top: '53%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 900, color: '{{textColor}}', letterSpacing: 6 },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, y: -40 }, easing: 'backOut' },
          exit: { to: { opacity: 0, y: 30 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'accent-line',
        type: 'rect',
        style: { position: 'absolute', top: '65%', left: '35%', width: '30%', height: 3, backgroundColor: '{{accentColor}}' },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt17_gravityDrop: BundledTemplate = {
  id: 'kt-gravity-drop',
  title: 'Gravity Drop',
  description: 'Heavy block letters fall with realistic gravity and bounce on an industrial grey background.',
  category: 'kinetic-typography',
  tags: ['gravity', 'drop', 'heavy', 'industrial'],
  featured: false,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'HEAVY', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#27272a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fafafa', group: 'Style' },
    { key: 'groundColor', label: 'Ground', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
  defaultConfig: { word: 'HEAVY', bgColor: '#27272a', textColor: '#fafafa', groundColor: '#f59e0b' },
  motionDesignDescription: {
    name: 'Gravity Drop',
    description: 'Heavy letters fall with realistic gravity bounce.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'ground-line',
        type: 'rect',
        style: { position: 'absolute', top: '58%', left: '15%', width: '70%', height: 4, backgroundColor: '{{groundColor}}', borderRadius: 2 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'heavy-text',
        type: 'text',
        text: '{{word}}',
        style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{textColor}}', letterSpacing: 8 },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, y: -300 }, easing: 'bounceOut' },
          exit: { to: { opacity: 0, y: 200 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'impact-dust-l',
        type: 'circle',
        style: { position: 'absolute', top: '54%', left: '25%', width: 30, height: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' },
        animation: {
          enterDelay: 0.45,
          enter: { from: { opacity: 0, scale: 0, y: 10 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'impact-dust-r',
        type: 'circle',
        style: { position: 'absolute', top: '54%', right: '25%', width: 30, height: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' },
        animation: {
          enterDelay: 0.45,
          enter: { from: { opacity: 0, scale: 0, y: 10 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt18_spiral: BundledTemplate = {
  id: 'kt-spiral-intro',
  title: 'Spiral Intro',
  description: 'Text spirals in from a distant vortex point with rotation and scale on deep purple.',
  category: 'kinetic-typography',
  tags: ['spiral', 'vortex', 'intro', 'psychedelic'],
  featured: false,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'WHIRL', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2e1065', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e9d5ff', group: 'Style' },
    { key: 'ringColor', label: 'Ring', type: 'color', defaultValue: '#a855f7', group: 'Style' },
  ],
  defaultConfig: { word: 'WHIRL', bgColor: '#2e1065', textColor: '#e9d5ff', ringColor: '#a855f7' },
  motionDesignDescription: {
    name: 'Spiral Intro',
    description: 'Text spirals in from a distant vortex point.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'ring-outer',
        type: 'circle',
        style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 250, height: 250, border: '1px solid rgba(168,85,247,0.2)', borderRadius: '50%', backgroundColor: 'transparent' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0, rotation: -270 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, rotation: 90 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'ring-inner',
        type: 'circle',
        style: { position: 'absolute', top: '37%', left: '50%', transform: 'translateX(-50%)', width: 140, height: 140, border: '1px solid rgba(168,85,247,0.3)', borderRadius: '50%', backgroundColor: 'transparent' },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, scale: 0, rotation: 180 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, rotation: -90 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'spiral-text',
        type: 'text',
        text: '{{word}}',
        style: { position: 'absolute', top: '43%', left: '50%', transform: 'translateX(-50%)', fontSize: 60, fontWeight: 700, color: '{{textColor}}', letterSpacing: 8 },
        animation: {
          enterDelay: 0.2,
          enter: { from: { opacity: 0, scale: 0, rotation: -360 }, easing: 'backOut' },
          hold: { effect: 'float', amplitude: 3, speed: 1 },
          exit: { to: { opacity: 0, scale: 3, rotation: 180 }, easing: 'cubicIn' },
        },
      },
    ],
  },
}

const kt19_stagger: BundledTemplate = {
  id: 'kt-stagger-grid',
  title: 'Stagger Grid',
  description: 'Words appear in a grid pattern with carefully staggered timing on a mint background.',
  category: 'kinetic-typography',
  tags: ['stagger', 'grid', 'pattern', 'systematic'],
  featured: false,
  configSchema: [
    { key: 'w1', label: 'Word 1', type: 'text', defaultValue: 'PLAN', group: 'Content' },
    { key: 'w2', label: 'Word 2', type: 'text', defaultValue: 'BUILD', group: 'Content' },
    { key: 'w3', label: 'Word 3', type: 'text', defaultValue: 'SHIP', group: 'Content' },
    { key: 'w4', label: 'Word 4', type: 'text', defaultValue: 'GROW', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ecfdf5', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#065f46', group: 'Style' },
  ],
  defaultConfig: { w1: 'PLAN', w2: 'BUILD', w3: 'SHIP', w4: 'GROW', bgColor: '#ecfdf5', textColor: '#065f46' },
  motionDesignDescription: {
    name: 'Stagger Grid',
    description: 'Words appear in a grid pattern with staggered timing.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'g1',
        type: 'text',
        text: '{{w1}}',
        style: { position: 'absolute', top: '32%', left: '20%', fontSize: 36, fontWeight: 700, color: '{{textColor}}' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: 30, scale: 0.8 }, easing: 'backOut' },
          exit: { to: { opacity: 0, y: -20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'g2',
        type: 'text',
        text: '{{w2}}',
        style: { position: 'absolute', top: '32%', right: '20%', fontSize: 36, fontWeight: 700, color: '{{textColor}}' },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, y: 30, scale: 0.8 }, easing: 'backOut' },
          exit: { to: { opacity: 0, y: -20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'g3',
        type: 'text',
        text: '{{w3}}',
        style: { position: 'absolute', top: '50%', left: '20%', fontSize: 36, fontWeight: 700, color: '{{textColor}}' },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0, y: 30, scale: 0.8 }, easing: 'backOut' },
          exit: { to: { opacity: 0, y: -20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'g4',
        type: 'text',
        text: '{{w4}}',
        style: { position: 'absolute', top: '50%', right: '20%', fontSize: 36, fontWeight: 700, color: '{{textColor}}' },
        animation: {
          enterDelay: 0.45,
          enter: { from: { opacity: 0, y: 30, scale: 0.8 }, easing: 'backOut' },
          exit: { to: { opacity: 0, y: -20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'grid-line-h',
        type: 'rect',
        style: { position: 'absolute', top: '45%', left: '15%', width: '70%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.15 },
        animation: {
          enterDelay: 0.2,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'grid-line-v',
        type: 'rect',
        style: { position: 'absolute', top: '28%', left: '50%', width: 1, height: '35%', backgroundColor: '{{textColor}}', opacity: 0.15 },
        animation: {
          enterDelay: 0.2,
          enter: { from: { opacity: 0, scaleY: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const kt20_impactBurst: BundledTemplate = {
  id: 'kt-impact-burst',
  title: 'Impact Burst',
  description: 'Text slams in with radiating impact lines like a comic book punch on bright yellow.',
  category: 'kinetic-typography',
  tags: ['impact', 'burst', 'comic', 'bold'],
  featured: true,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'BAM!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1c1917', group: 'Style' },
    { key: 'burstColor', label: 'Burst', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { word: 'BAM!', bgColor: '#fbbf24', textColor: '#1c1917', burstColor: '#ef4444' },
  motionDesignDescription: {
    name: 'Impact Burst',
    description: 'Text slams in with radiating comic-book impact.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.25,
    exitDuration: 0.1,
    elements: [
      {
        id: 'burst-circle',
        type: 'circle',
        style: { position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', width: 220, height: 220, backgroundColor: '{{burstColor}}', opacity: 0.15, borderRadius: '50%' },
        animation: {
          enterDelay: 0.05,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, scale: 2 }, easing: 'easeIn' },
        },
      },
      {
        id: 'ray-1',
        type: 'rect',
        style: { position: 'absolute', top: '38%', left: '12%', width: 50, height: 4, backgroundColor: '{{burstColor}}', borderRadius: 2, transform: 'rotate(-15deg)' },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, x: 40, scaleX: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'ray-2',
        type: 'rect',
        style: { position: 'absolute', top: '38%', right: '12%', width: 50, height: 4, backgroundColor: '{{burstColor}}', borderRadius: 2, transform: 'rotate(15deg)' },
        animation: {
          enterDelay: 0.18,
          enter: { from: { opacity: 0, x: -40, scaleX: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'ray-3',
        type: 'rect',
        style: { position: 'absolute', top: '58%', left: '20%', width: 40, height: 4, backgroundColor: '{{burstColor}}', borderRadius: 2, transform: 'rotate(25deg)' },
        animation: {
          enterDelay: 0.22,
          enter: { from: { opacity: 0, x: 30, scaleX: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'impact-text',
        type: 'text',
        text: '{{word}}',
        style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 88, fontWeight: 900, color: '{{textColor}}', textShadow: '3px 3px 0 {{burstColor}}' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 3 }, easing: 'backOut' },
          hold: { effect: 'pulse', amplitude: 0.04, speed: 3 },
          exit: { to: { opacity: 0, scale: 0, rotation: 15 }, easing: 'cubicIn' },
        },
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// SOCIAL MEDIA (10 templates)
// ---------------------------------------------------------------------------

const sm01_quoteMinimal: BundledTemplate = {
  id: 'sm-quote-minimal',
  title: 'Quote Card — Minimal',
  description: 'Clean minimal quote card with thin quotation marks and attribution.',
  category: 'social-media',
  tags: ['quote', 'minimal', 'clean', 'instagram'],
  featured: true,
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'The only way to do great work is to love what you do.', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: '— Steve Jobs', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1c1917', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#a3a3a3', group: 'Style' },
  ],
  defaultConfig: { quote: 'The only way to do great work is to love what you do.', author: '— Steve Jobs', bgColor: '#fafaf9', textColor: '#1c1917', accentColor: '#a3a3a3' },
  motionDesignDescription: {
    name: 'Quote Card — Minimal',
    description: 'Clean minimal quote card.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.2,
    elements: [
      {
        id: 'quote-mark',
        type: 'text',
        text: '\u201C',
        style: { position: 'absolute', top: '25%', left: '12%', fontSize: 120, fontWeight: 300, color: '{{accentColor}}', opacity: 0.3, fontFamily: 'Georgia, serif' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: -20 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'quote-text',
        type: 'text',
        text: '{{quote}}',
        style: { position: 'absolute', top: '35%', left: '15%', width: '70%', fontSize: 24, fontWeight: 400, color: '{{textColor}}', lineHeight: 1.6, fontFamily: 'Georgia, serif' },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, y: 20 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, y: -10 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'divider',
        type: 'rect',
        style: { position: 'absolute', top: '62%', left: '15%', width: 40, height: 2, backgroundColor: '{{accentColor}}' },
        animation: {
          enterDelay: 0.4,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'author-text',
        type: 'text',
        text: '{{author}}',
        style: { position: 'absolute', top: '66%', left: '15%', fontSize: 16, fontWeight: 400, color: '{{accentColor}}', letterSpacing: 2 },
        animation: {
          enterDelay: 0.55,
          enter: { from: { opacity: 0, x: -20 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm02_quoteBold: BundledTemplate = {
  id: 'sm-quote-bold',
  title: 'Quote Card — Bold',
  description: 'Bold high-contrast quote with large serif text on a deep background.',
  category: 'social-media',
  tags: ['quote', 'bold', 'contrast', 'dramatic'],
  featured: false,
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'Stay hungry, stay foolish.', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: 'STEVE JOBS', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1b4b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5f3ff', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#c084fc', group: 'Style' },
  ],
  defaultConfig: { quote: 'Stay hungry, stay foolish.', author: 'STEVE JOBS', bgColor: '#1e1b4b', textColor: '#f5f3ff', accentColor: '#c084fc' },
  motionDesignDescription: {
    name: 'Quote Card — Bold',
    description: 'Bold high-contrast quote card.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'accent-bar',
        type: 'rect',
        style: { position: 'absolute', top: '28%', left: '10%', width: 6, height: '35%', backgroundColor: '{{accentColor}}', borderRadius: 3 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scaleY: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'bold-quote',
        type: 'text',
        text: '{{quote}}',
        style: { position: 'absolute', top: '30%', left: '18%', width: '70%', fontSize: 36, fontWeight: 700, color: '{{textColor}}', lineHeight: 1.4 },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, x: -30 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, x: 20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'author-label',
        type: 'text',
        text: '{{author}}',
        style: { position: 'absolute', top: '68%', left: '18%', fontSize: 14, fontWeight: 600, color: '{{accentColor}}', letterSpacing: 4 },
        animation: {
          enterDelay: 0.4,
          enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm03_igStory: BundledTemplate = {
  id: 'sm-ig-story',
  title: 'Instagram Story',
  description: 'Full-screen portrait story layout with gradient background, headline and CTA.',
  category: 'social-media',
  tags: ['instagram', 'story', 'gradient', 'portrait'],
  featured: false,
  configSchema: [
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'NEW DROP', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Available Now', group: 'Content' },
    { key: 'cta', label: 'CTA', type: 'text', defaultValue: 'SWIPE UP', group: 'Content' },
    { key: 'gradientStart', label: 'Gradient Start', type: 'color', defaultValue: '#ec4899', group: 'Style' },
    { key: 'gradientEnd', label: 'Gradient End', type: 'color', defaultValue: '#8b5cf6', group: 'Style' },
  ],
  defaultConfig: { headline: 'NEW DROP', subtitle: 'Available Now', cta: 'SWIPE UP', gradientStart: '#ec4899', gradientEnd: '#8b5cf6' },
  motionDesignDescription: {
    name: 'Instagram Story',
    description: 'Full-screen portrait story layout.',
    background: 'linear-gradient(135deg, {{gradientStart}}, {{gradientEnd}})',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'deco-ring',
        type: 'circle',
        style: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 120, height: 120, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', backgroundColor: 'transparent' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' },
          hold: { effect: 'breathe', amplitude: 0.05, speed: 1 },
          exit: { to: { opacity: 0, scale: 0 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'headline',
        type: 'text',
        text: '{{headline}}',
        style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 52, fontWeight: 900, color: '#ffffff', letterSpacing: 6, textAlign: 'center' },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, y: -40, scale: 0.8 }, easing: 'backOut' },
          exit: { to: { opacity: 0, y: -20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'subtitle',
        type: 'text',
        text: '{{subtitle}}',
        style: { position: 'absolute', top: '52%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 300, color: 'rgba(255,255,255,0.8)', letterSpacing: 4 },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'cta-text',
        type: 'text',
        text: '{{cta}}',
        style: { position: 'absolute', top: '78%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 600, color: '#ffffff', letterSpacing: 6 },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, y: 20 }, easing: 'cubicOut' },
          hold: { effect: 'float', amplitude: 5, speed: 2 },
          exit: { to: { opacity: 0, y: 10 }, easing: 'easeIn' },
        },
      },
      {
        id: 'cta-arrow',
        type: 'text',
        text: '\u2191',
        style: { position: 'absolute', top: '82%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, color: 'rgba(255,255,255,0.6)' },
        animation: {
          enterDelay: 0.6,
          enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' },
          hold: { effect: 'float', amplitude: 8, speed: 2.5 },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm04_lowerThird: BundledTemplate = {
  id: 'sm-lower-third',
  title: 'Lower Third',
  description: 'Broadcast-style lower third with name, title, and sliding accent bar.',
  category: 'social-media',
  tags: ['lower-third', 'broadcast', 'news', 'name'],
  featured: false,
  configSchema: [
    { key: 'name', label: 'Name', type: 'text', defaultValue: 'Jane Smith', group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Creative Director', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f8fafc', group: 'Style' },
  ],
  defaultConfig: { name: 'Jane Smith', title: 'Creative Director', bgColor: '#0f172a', barColor: '#3b82f6', textColor: '#f8fafc' },
  motionDesignDescription: {
    name: 'Lower Third',
    description: 'Broadcast-style lower third overlay.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.25,
    exitDuration: 0.15,
    elements: [
      {
        id: 'lt-bg',
        type: 'rect',
        style: { position: 'absolute', top: '72%', left: '5%', width: '60%', height: '14%', backgroundColor: 'rgba(15,23,42,0.9)', borderRadius: 4 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, x: -100, scaleX: 0.5 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, x: -60 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'lt-accent',
        type: 'rect',
        style: { position: 'absolute', top: '72%', left: '5%', width: 5, height: '14%', backgroundColor: '{{barColor}}', borderRadius: '4px 0 0 4px' },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, scaleY: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'lt-name',
        type: 'text',
        text: '{{name}}',
        style: { position: 'absolute', top: '74%', left: '9%', fontSize: 22, fontWeight: 700, color: '{{textColor}}' },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, x: -20 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, x: -10 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'lt-title',
        type: 'text',
        text: '{{title}}',
        style: { position: 'absolute', top: '80%', left: '9%', fontSize: 14, fontWeight: 400, color: '{{barColor}}', letterSpacing: 2 },
        animation: {
          enterDelay: 0.25,
          enter: { from: { opacity: 0, x: -15 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm05_endScreen: BundledTemplate = {
  id: 'sm-end-screen',
  title: 'End Screen',
  description: 'YouTube-style end screen with subscribe prompt and handle display.',
  category: 'social-media',
  tags: ['end-screen', 'youtube', 'subscribe', 'outro'],
  featured: false,
  configSchema: [
    { key: 'channel', label: 'Channel', type: 'text', defaultValue: '@yourchannel', group: 'Content' },
    { key: 'cta', label: 'CTA', type: 'text', defaultValue: 'SUBSCRIBE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f0f', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { channel: '@yourchannel', cta: 'SUBSCRIBE', bgColor: '#0f0f0f', accentColor: '#ef4444' },
  motionDesignDescription: {
    name: 'End Screen',
    description: 'End screen with subscribe prompt.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.2,
    elements: [
      {
        id: 'sub-btn',
        type: 'rect',
        style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 48, backgroundColor: '{{accentColor}}', borderRadius: 24 },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' },
          hold: { effect: 'pulse', amplitude: 0.03, speed: 2 },
          exit: { to: { opacity: 0, scale: 0.8 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'sub-text',
        type: 'text',
        text: '{{cta}}',
        style: { position: 'absolute', top: '44.5%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 700, color: '#ffffff', letterSpacing: 3 },
        animation: {
          enterDelay: 0.2,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'channel-handle',
        type: 'text',
        text: '{{channel}}',
        style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 500, color: '#ffffff', letterSpacing: 1 },
        animation: {
          enterDelay: 0.35,
          enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, y: -10 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'thanks-text',
        type: 'text',
        text: 'Thanks for watching!',
        style: { position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: -10 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm06_cta: BundledTemplate = {
  id: 'sm-call-to-action',
  title: 'Call to Action',
  description: 'Punchy CTA with large button, supporting text, and urgency indicator.',
  category: 'social-media',
  tags: ['cta', 'button', 'conversion', 'marketing'],
  featured: false,
  configSchema: [
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Limited Time Offer', group: 'Content' },
    { key: 'ctaText', label: 'CTA Button', type: 'text', defaultValue: 'GET STARTED', group: 'Content' },
    { key: 'subtext', label: 'Subtext', type: 'text', defaultValue: 'No credit card required', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c4a6e', group: 'Style' },
    { key: 'ctaColor', label: 'CTA Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
  defaultConfig: { headline: 'Limited Time Offer', ctaText: 'GET STARTED', subtext: 'No credit card required', bgColor: '#0c4a6e', ctaColor: '#22c55e' },
  motionDesignDescription: {
    name: 'Call to Action',
    description: 'Punchy CTA with button and urgency.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'cta-headline',
        type: 'text',
        text: '{{headline}}',
        style: { position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', fontSize: 32, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: -25 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, y: -15 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'cta-btn-bg',
        type: 'rect',
        style: { position: 'absolute', top: '48%', left: '50%', transform: 'translateX(-50%)', width: 220, height: 52, backgroundColor: '{{ctaColor}}', borderRadius: 8 },
        animation: {
          enterDelay: 0.2,
          enter: { from: { opacity: 0, scale: 0.7 }, easing: 'backOut' },
          hold: { effect: 'pulse', amplitude: 0.04, speed: 2 },
          exit: { to: { opacity: 0, scale: 0.8 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'cta-btn-text',
        type: 'text',
        text: '{{ctaText}}',
        style: { position: 'absolute', top: '50.5%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: 3 },
        animation: {
          enterDelay: 0.25,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'cta-sub',
        type: 'text',
        text: '{{subtext}}',
        style: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.5)' },
        animation: {
          enterDelay: 0.4,
          enter: { from: { opacity: 0, y: 8 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm07_countdown: BundledTemplate = {
  id: 'sm-countdown',
  title: 'Countdown',
  description: 'Dramatic countdown from 3 to 1 with pulsing numbers and launch text.',
  category: 'social-media',
  tags: ['countdown', 'launch', 'timer', 'dramatic'],
  featured: false,
  configSchema: [
    { key: 'launchText', label: 'Launch Text', type: 'text', defaultValue: 'LAUNCHING SOON', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#f43f5e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fafafa', group: 'Style' },
  ],
  defaultConfig: { launchText: 'LAUNCHING SOON', bgColor: '#0a0a0a', numberColor: '#f43f5e', textColor: '#fafafa' },
  motionDesignDescription: {
    name: 'Countdown',
    description: 'Dramatic countdown with pulsing numbers.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'num-3',
        type: 'counter',
        counterTarget: 3,
        style: { position: 'absolute', top: '35%', left: '22%', fontSize: 80, fontWeight: 900, color: '{{numberColor}}', opacity: 0.3 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 2 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'num-2',
        type: 'counter',
        counterTarget: 2,
        style: { position: 'absolute', top: '35%', left: '45%', fontSize: 80, fontWeight: 900, color: '{{numberColor}}', opacity: 0.5 },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, scale: 2 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'num-1',
        type: 'counter',
        counterTarget: 1,
        style: { position: 'absolute', top: '35%', right: '22%', fontSize: 80, fontWeight: 900, color: '{{numberColor}}' },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0, scale: 2 }, easing: 'cubicOut' },
          hold: { effect: 'pulse', amplitude: 0.05, speed: 3 },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'launch-text',
        type: 'text',
        text: '{{launchText}}',
        style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 600, color: '{{textColor}}', letterSpacing: 6 },
        animation: {
          enterDelay: 0.5,
          enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' },
          hold: { effect: 'glow', amplitude: 0.15, speed: 2 },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm08_announcement: BundledTemplate = {
  id: 'sm-announcement',
  title: 'Announcement',
  description: 'Big announcement card with badge, headline, and details on warm gradient.',
  category: 'social-media',
  tags: ['announcement', 'news', 'badge', 'launch'],
  featured: false,
  configSchema: [
    { key: 'badge', label: 'Badge', type: 'text', defaultValue: 'NEW', group: 'Content' },
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Version 2.0 is here', group: 'Content' },
    { key: 'detail', label: 'Detail', type: 'text', defaultValue: 'Redesigned from the ground up', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fef3c7', group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#dc2626', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1c1917', group: 'Style' },
  ],
  defaultConfig: { badge: 'NEW', headline: 'Version 2.0 is here', detail: 'Redesigned from the ground up', bgColor: '#fef3c7', badgeColor: '#dc2626', textColor: '#1c1917' },
  motionDesignDescription: {
    name: 'Announcement',
    description: 'Big announcement with badge and details.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'badge-bg',
        type: 'rect',
        style: { position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', width: 70, height: 28, backgroundColor: '{{badgeColor}}', borderRadius: 14 },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' },
          exit: { to: { opacity: 0, scale: 0 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'badge-text',
        type: 'text',
        text: '{{badge}}',
        style: { position: 'absolute', top: '33%', left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 800, color: '#ffffff', letterSpacing: 2 },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'ann-headline',
        type: 'text',
        text: '{{headline}}',
        style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 34, fontWeight: 800, color: '{{textColor}}', textAlign: 'center', maxWidth: '80%' },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, y: 25 }, easing: 'backOut' },
          exit: { to: { opacity: 0, y: -15 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'ann-detail',
        type: 'text',
        text: '{{detail}}',
        style: { position: 'absolute', top: '56%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 400, color: 'rgba(28,25,23,0.6)', textAlign: 'center' },
        animation: {
          enterDelay: 0.35,
          enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm09_poll: BundledTemplate = {
  id: 'sm-poll-question',
  title: 'Poll / Question',
  description: 'Interactive poll-style card with question and two answer options.',
  category: 'social-media',
  tags: ['poll', 'question', 'interactive', 'engagement'],
  featured: false,
  configSchema: [
    { key: 'question', label: 'Question', type: 'text', defaultValue: 'Which do you prefer?', group: 'Content' },
    { key: 'optionA', label: 'Option A', type: 'text', defaultValue: 'Dark Mode', group: 'Content' },
    { key: 'optionB', label: 'Option B', type: 'text', defaultValue: 'Light Mode', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1b4b', group: 'Style' },
    { key: 'optionColor', label: 'Option Color', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
  defaultConfig: { question: 'Which do you prefer?', optionA: 'Dark Mode', optionB: 'Light Mode', bgColor: '#1e1b4b', optionColor: '#6366f1' },
  motionDesignDescription: {
    name: 'Poll / Question',
    description: 'Poll card with question and options.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'q-icon',
        type: 'text',
        text: '?',
        style: { position: 'absolute', top: '26%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 300, color: 'rgba(255,255,255,0.15)' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0, rotation: -30 }, easing: 'elasticOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'q-text',
        type: 'text',
        text: '{{question}}',
        style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 26, fontWeight: 600, color: '#ffffff', textAlign: 'center', maxWidth: '80%' },
        animation: {
          enterDelay: 0.1,
          enter: { from: { opacity: 0, y: 20 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'opt-a-bg',
        type: 'rect',
        style: { position: 'absolute', top: '50%', left: '12%', width: '76%', height: 44, backgroundColor: '{{optionColor}}', borderRadius: 8, opacity: 0.8 },
        animation: {
          enterDelay: 0.25,
          enter: { from: { opacity: 0, x: -40 }, easing: 'backOut' },
          exit: { to: { opacity: 0, x: -20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'opt-a-text',
        type: 'text',
        text: '{{optionA}}',
        style: { position: 'absolute', top: '52%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 600, color: '#ffffff' },
        animation: {
          enterDelay: 0.3,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'opt-b-bg',
        type: 'rect',
        style: { position: 'absolute', top: '62%', left: '12%', width: '76%', height: 44, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' },
        animation: {
          enterDelay: 0.35,
          enter: { from: { opacity: 0, x: 40 }, easing: 'backOut' },
          exit: { to: { opacity: 0, x: 20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'opt-b-text',
        type: 'text',
        text: '{{optionB}}',
        style: { position: 'absolute', top: '64%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.8)' },
        animation: {
          enterDelay: 0.4,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const sm10_brandedIntro: BundledTemplate = {
  id: 'sm-branded-intro',
  title: 'Branded Intro',
  description: 'Clean branded intro with logo placeholder circle, brand name, and tagline.',
  category: 'social-media',
  tags: ['intro', 'brand', 'logo', 'identity'],
  featured: false,
  configSchema: [
    { key: 'brandLetter', label: 'Brand Initial', type: 'text', defaultValue: 'P', group: 'Content' },
    { key: 'brandName', label: 'Brand Name', type: 'text', defaultValue: 'ProAnimate', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Create. Animate. Publish.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'brandColor', label: 'Brand Color', type: 'color', defaultValue: '#8b5cf6', group: 'Style' },
  ],
  defaultConfig: { brandLetter: 'P', brandName: 'ProAnimate', tagline: 'Create. Animate. Publish.', bgColor: '#111827', brandColor: '#8b5cf6' },
  motionDesignDescription: {
    name: 'Branded Intro',
    description: 'Clean branded intro with logo and tagline.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.2,
    elements: [
      {
        id: 'logo-circle',
        type: 'circle',
        style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, backgroundColor: '{{brandColor}}', borderRadius: '50%' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' },
          exit: { to: { opacity: 0, scale: 0 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'logo-letter',
        type: 'text',
        text: '{{brandLetter}}',
        style: { position: 'absolute', top: '33%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 700, color: '#ffffff' },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'brand-name',
        type: 'text',
        text: '{{brandName}}',
        style: { position: 'absolute', top: '50%', left: '50%', transform: 'translateX(-50%)', fontSize: 32, fontWeight: 700, color: '#ffffff', letterSpacing: 2 },
        animation: {
          enterDelay: 0.25,
          enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, y: -10 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'tagline-text',
        type: 'text',
        text: '{{tagline}}',
        style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: 3 },
        animation: {
          enterDelay: 0.45,
          enter: { from: { opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// DATA VISUALIZATION (8 templates)
// ---------------------------------------------------------------------------

const dv01_singleStat: BundledTemplate = {
  id: 'dv-single-stat',
  title: 'Single Stat Counter',
  description: 'Single hero number that counts up with suffix and label text.',
  category: 'data-visualization',
  tags: ['counter', 'stat', 'number', 'metric'],
  featured: true,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Monthly Active Users', group: 'Content' },
    { key: 'target', label: 'Target Number', type: 'number', defaultValue: 12500, group: 'Content', min: 0, max: 999999 },
    { key: 'suffix', label: 'Suffix', type: 'text', defaultValue: '+', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#22d3ee', group: 'Style' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#94a3b8', group: 'Style' },
  ],
  defaultConfig: { label: 'Monthly Active Users', target: 12500, suffix: '+', bgColor: '#0f172a', numberColor: '#22d3ee', labelColor: '#94a3b8' },
  motionDesignDescription: {
    name: 'Single Stat Counter',
    description: 'Hero number counts up with label.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'stat-label',
        type: 'text',
        text: '{{label}}',
        style: { position: 'absolute', top: '36%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 400, color: '{{labelColor}}', letterSpacing: 3, textTransform: 'uppercase' },
        animation: {
          enterDelay: 0,
          enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
      {
        id: 'stat-number',
        type: 'counter',
        counterTarget: 12500,
        counterSuffix: '{{suffix}}',
        style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 800, color: '{{numberColor}}' },
        animation: {
          enterDelay: 0.15,
          enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' },
          hold: { effect: 'glow', amplitude: 0.1, speed: 1.5 },
          exit: { to: { opacity: 0, y: 20 }, easing: 'cubicIn' },
        },
      },
      {
        id: 'stat-underline',
        type: 'rect',
        style: { position: 'absolute', top: '60%', left: '35%', width: '30%', height: 3, backgroundColor: '{{numberColor}}', borderRadius: 2, opacity: 0.5 },
        animation: {
          enterDelay: 0.4,
          enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 }, easing: 'easeIn' },
        },
      },
    ],
  },
}

const dv02_multiStat: BundledTemplate = {
  id: 'dv-multi-stat',
  title: 'Multi-Stat Dashboard',
  description: 'Three key metrics side by side with counters and labels.',
  category: 'data-visualization',
  tags: ['dashboard', 'multi-stat', 'metrics', 'KPI'],
  featured: false,
  configSchema: [
    { key: 'label1', label: 'Stat 1 Label', type: 'text', defaultValue: 'Users', group: 'Content' },
    { key: 'val1', label: 'Stat 1 Value', type: 'number', defaultValue: 8400, group: 'Content', min: 0, max: 999999 },
    { key: 'label2', label: 'Stat 2 Label', type: 'text', defaultValue: 'Revenue', group: 'Content' },
    { key: 'val2', label: 'Stat 2 Value', type: 'number', defaultValue: 52, group: 'Content', min: 0, max: 999999 },
    { key: 'label3', label: 'Stat 3 Label', type: 'text', defaultValue: 'Growth', group: 'Content' },
    { key: 'val3', label: 'Stat 3 Value', type: 'number', defaultValue: 127, group: 'Content', min: 0, max: 999999 },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#a78bfa', group: 'Style' },
  ],
  defaultConfig: { label1: 'Users', val1: 8400, label2: 'Revenue', val2: 52, label3: 'Growth', val3: 127, bgColor: '#18181b', accentColor: '#a78bfa' },
  motionDesignDescription: {
    name: 'Multi-Stat Dashboard',
    description: 'Three key metrics side by side.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'ms-val1',
        type: 'counter',
        counterTarget: 8400,
        style: { position: 'absolute', top: '38%', left: '16%', fontSize: 40, fontWeight: 800, color: '{{accentColor}}' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, y: 20 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ms-lbl1',
        type: 'text',
        text: '{{label1}}',
        style: { position: 'absolute', top: '50%', left: '16%', fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ms-val2',
        type: 'counter',
        counterTarget: 52,
        counterSuffix: 'K',
        style: { position: 'absolute', top: '38%', left: '42%', fontSize: 40, fontWeight: 800, color: '{{accentColor}}' },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 20 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ms-lbl2',
        type: 'text',
        text: '{{label2}}',
        style: { position: 'absolute', top: '50%', left: '42%', fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' },
        animation: { enterDelay: 0.25, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ms-val3',
        type: 'counter',
        counterTarget: 127,
        counterSuffix: '%',
        style: { position: 'absolute', top: '38%', left: '68%', fontSize: 40, fontWeight: 800, color: '{{accentColor}}' },
        animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 20 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ms-lbl3',
        type: 'text',
        text: '{{label3}}',
        style: { position: 'absolute', top: '50%', left: '68%', fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' },
        animation: { enterDelay: 0.4, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const dv03_progressBar: BundledTemplate = {
  id: 'dv-progress-bar',
  title: 'Progress Bar Reveal',
  description: 'Animated progress bar fills to target percentage with label and value.',
  category: 'data-visualization',
  tags: ['progress', 'bar', 'loading', 'percentage'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Project Completion', group: 'Content' },
    { key: 'percent', label: 'Percent', type: 'number', defaultValue: 78, group: 'Content', min: 0, max: 100 },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#10b981', group: 'Style' },
  ],
  defaultConfig: { label: 'Project Completion', percent: 78, bgColor: '#0f172a', barColor: '#10b981' },
  motionDesignDescription: {
    name: 'Progress Bar Reveal',
    description: 'Progress bar fills to target percentage.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'pb-label',
        type: 'text',
        text: '{{label}}',
        style: { position: 'absolute', top: '38%', left: '15%', fontSize: 18, fontWeight: 500, color: '#e2e8f0' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -20 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pb-track',
        type: 'rect',
        style: { position: 'absolute', top: '46%', left: '15%', width: '70%', height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pb-fill',
        type: 'bar',
        barPercent: 78,
        style: { position: 'absolute', top: '46%', left: '15%', width: '70%', height: 16, backgroundColor: '{{barColor}}', borderRadius: 8 },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pb-value',
        type: 'counter',
        counterTarget: 78,
        counterSuffix: '%',
        style: { position: 'absolute', top: '38%', right: '15%', fontSize: 18, fontWeight: 700, color: '{{barColor}}' },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const dv04_comparisonBars: BundledTemplate = {
  id: 'dv-comparison-bars',
  title: 'Comparison Bars',
  description: 'Side-by-side horizontal bars comparing two values with labels.',
  category: 'data-visualization',
  tags: ['comparison', 'bars', 'versus', 'data'],
  featured: false,
  configSchema: [
    { key: 'labelA', label: 'Label A', type: 'text', defaultValue: 'Product A', group: 'Content' },
    { key: 'percentA', label: 'Value A %', type: 'number', defaultValue: 85, group: 'Content', min: 0, max: 100 },
    { key: 'labelB', label: 'Label B', type: 'text', defaultValue: 'Product B', group: 'Content' },
    { key: 'percentB', label: 'Value B %', type: 'number', defaultValue: 62, group: 'Content', min: 0, max: 100 },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e293b', group: 'Style' },
    { key: 'colorA', label: 'Color A', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'colorB', label: 'Color B', type: 'color', defaultValue: '#f97316', group: 'Style' },
  ],
  defaultConfig: { labelA: 'Product A', percentA: 85, labelB: 'Product B', percentB: 62, bgColor: '#1e293b', colorA: '#3b82f6', colorB: '#f97316' },
  motionDesignDescription: {
    name: 'Comparison Bars',
    description: 'Side-by-side horizontal bars for comparison.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'cb-title',
        type: 'text',
        text: 'Comparison',
        style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, textTransform: 'uppercase' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'cb-lblA',
        type: 'text',
        text: '{{labelA}}',
        style: { position: 'absolute', top: '36%', left: '12%', fontSize: 16, fontWeight: 500, color: '#e2e8f0' },
        animation: { enterDelay: 0.05, enter: { from: { opacity: 0, x: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'cb-barA',
        type: 'bar',
        barPercent: 85,
        style: { position: 'absolute', top: '42%', left: '12%', width: '76%', height: 20, backgroundColor: '{{colorA}}', borderRadius: 4 },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'cb-lblB',
        type: 'text',
        text: '{{labelB}}',
        style: { position: 'absolute', top: '52%', left: '12%', fontSize: 16, fontWeight: 500, color: '#e2e8f0' },
        animation: { enterDelay: 0.25, enter: { from: { opacity: 0, x: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'cb-barB',
        type: 'bar',
        barPercent: 62,
        style: { position: 'absolute', top: '58%', left: '12%', width: '76%', height: 20, backgroundColor: '{{colorB}}', borderRadius: 4 },
        animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const dv05_arcGauge: BundledTemplate = {
  id: 'dv-arc-gauge',
  title: 'Arc Gauge',
  description: 'Semi-circular arc gauge showing a percentage value with animated sweep.',
  category: 'data-visualization',
  tags: ['arc', 'gauge', 'percentage', 'circular'],
  featured: true,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Performance', group: 'Content' },
    { key: 'angle', label: 'Arc Angle', type: 'number', defaultValue: 270, group: 'Content', min: 0, max: 360 },
    { key: 'value', label: 'Display Value', type: 'text', defaultValue: '75%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0a09', group: 'Style' },
    { key: 'arcColor', label: 'Arc Color', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
  defaultConfig: { label: 'Performance', angle: 270, value: '75%', bgColor: '#0c0a09', arcColor: '#f59e0b' },
  motionDesignDescription: {
    name: 'Arc Gauge',
    description: 'Semi-circular arc gauge with animated sweep.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.15,
    elements: [
      {
        id: 'arc-bg',
        type: 'arc',
        arcAngle: 360,
        style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, stroke: 'rgba(255,255,255,0.08)', strokeWidth: 12, fill: 'none' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'arc-fill',
        type: 'arc',
        arcAngle: 270,
        style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, stroke: '{{arcColor}}', strokeWidth: 12, fill: 'none', strokeLinecap: 'round' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, rotation: -90 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'arc-value',
        type: 'text',
        text: '{{value}}',
        style: { position: 'absolute', top: '43%', left: '50%', transform: 'translateX(-50%)', fontSize: 42, fontWeight: 700, color: '{{arcColor}}' },
        animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'arc-label',
        type: 'text',
        text: '{{label}}',
        style: { position: 'absolute', top: '62%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, textTransform: 'uppercase' },
        animation: { enterDelay: 0.45, enter: { from: { opacity: 0, y: 8 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const dv06_percentReveal: BundledTemplate = {
  id: 'dv-percent-reveal',
  title: 'Percentage Reveal',
  description: 'Giant percentage number with animated counter and context text on deep green.',
  category: 'data-visualization',
  tags: ['percentage', 'reveal', 'big-number', 'counter'],
  featured: false,
  configSchema: [
    { key: 'value', label: 'Percentage', type: 'number', defaultValue: 94, group: 'Content', min: 0, max: 100 },
    { key: 'context', label: 'Context', type: 'text', defaultValue: 'Customer Satisfaction', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#064e3b', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#34d399', group: 'Style' },
  ],
  defaultConfig: { value: 94, context: 'Customer Satisfaction', bgColor: '#064e3b', numberColor: '#34d399' },
  motionDesignDescription: {
    name: 'Percentage Reveal',
    description: 'Giant percentage with animated counter.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'pct-bg-circle',
        type: 'circle',
        style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, backgroundColor: 'rgba(52,211,153,0.08)', borderRadius: '50%' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scale: 2 }, easing: 'easeIn' } },
      },
      {
        id: 'pct-number',
        type: 'counter',
        counterTarget: 94,
        counterSuffix: '%',
        style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 88, fontWeight: 900, color: '{{numberColor}}' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0.3, blur: 8 }, easing: 'backOut' }, hold: { effect: 'glow', amplitude: 0.1, speed: 1.5 }, exit: { to: { opacity: 0, blur: 8 }, easing: 'cubicIn' } },
      },
      {
        id: 'pct-context',
        type: 'text',
        text: '{{context}}',
        style: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },
        animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const dv07_metricCards: BundledTemplate = {
  id: 'dv-metric-cards',
  title: 'Metric Cards',
  description: 'Two floating metric cards with icons, values, and trend indicators.',
  category: 'data-visualization',
  tags: ['cards', 'metrics', 'trend', 'dashboard'],
  featured: false,
  configSchema: [
    { key: 'metric1', label: 'Metric 1', type: 'text', defaultValue: 'Revenue', group: 'Content' },
    { key: 'value1', label: 'Value 1', type: 'text', defaultValue: '$48.2K', group: 'Content' },
    { key: 'trend1', label: 'Trend 1', type: 'text', defaultValue: '+12%', group: 'Content' },
    { key: 'metric2', label: 'Metric 2', type: 'text', defaultValue: 'Users', group: 'Content' },
    { key: 'value2', label: 'Value 2', type: 'text', defaultValue: '3,847', group: 'Content' },
    { key: 'trend2', label: 'Trend 2', type: 'text', defaultValue: '+8%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1b4b', group: 'Style' },
  ],
  defaultConfig: { metric1: 'Revenue', value1: '$48.2K', trend1: '+12%', metric2: 'Users', value2: '3,847', trend2: '+8%', bgColor: '#1e1b4b' },
  motionDesignDescription: {
    name: 'Metric Cards',
    description: 'Two floating metric cards with trends.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'card1-bg',
        type: 'rect',
        style: { position: 'absolute', top: '28%', left: '10%', width: '80%', height: '16%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12 },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, y: 20, scale: 0.95 }, easing: 'backOut' }, exit: { to: { opacity: 0, y: -10 }, easing: 'cubicIn' } },
      },
      {
        id: 'card1-label',
        type: 'text',
        text: '{{metric1}}',
        style: { position: 'absolute', top: '30%', left: '16%', fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'card1-value',
        type: 'text',
        text: '{{value1}}',
        style: { position: 'absolute', top: '35%', left: '16%', fontSize: 28, fontWeight: 700, color: '#ffffff' },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'card1-trend',
        type: 'text',
        text: '{{trend1}}',
        style: { position: 'absolute', top: '36%', right: '16%', fontSize: 16, fontWeight: 600, color: '#34d399' },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 5 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'card2-bg',
        type: 'rect',
        style: { position: 'absolute', top: '50%', left: '10%', width: '80%', height: '16%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12 },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 20, scale: 0.95 }, easing: 'backOut' }, exit: { to: { opacity: 0, y: -10 }, easing: 'cubicIn' } },
      },
      {
        id: 'card2-label',
        type: 'text',
        text: '{{metric2}}',
        style: { position: 'absolute', top: '52%', left: '16%', fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
        animation: { enterDelay: 0.25, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'card2-value',
        type: 'text',
        text: '{{value2}}',
        style: { position: 'absolute', top: '57%', left: '16%', fontSize: 28, fontWeight: 700, color: '#ffffff' },
        animation: { enterDelay: 0.3, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'card2-trend',
        type: 'text',
        text: '{{trend2}}',
        style: { position: 'absolute', top: '58%', right: '16%', fontSize: 16, fontWeight: 600, color: '#34d399' },
        animation: { enterDelay: 0.35, enter: { from: { opacity: 0, y: 5 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const dv08_scorecard: BundledTemplate = {
  id: 'dv-scorecard',
  title: 'Scorecard',
  description: 'Sports/game-style scorecard with two teams, scores, and versus label.',
  category: 'data-visualization',
  tags: ['score', 'versus', 'sports', 'game'],
  featured: false,
  configSchema: [
    { key: 'teamA', label: 'Team A', type: 'text', defaultValue: 'HOME', group: 'Content' },
    { key: 'scoreA', label: 'Score A', type: 'number', defaultValue: 3, group: 'Content', min: 0, max: 999 },
    { key: 'teamB', label: 'Team B', type: 'text', defaultValue: 'AWAY', group: 'Content' },
    { key: 'scoreB', label: 'Score B', type: 'number', defaultValue: 1, group: 'Content', min: 0, max: 999 },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'colorA', label: 'Team A Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'colorB', label: 'Team B Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { teamA: 'HOME', scoreA: 3, teamB: 'AWAY', scoreB: 1, bgColor: '#0f172a', colorA: '#3b82f6', colorB: '#ef4444' },
  motionDesignDescription: {
    name: 'Scorecard',
    description: 'Sports-style scorecard with two teams.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'sc-teamA',
        type: 'text',
        text: '{{teamA}}',
        style: { position: 'absolute', top: '34%', left: '18%', fontSize: 18, fontWeight: 600, color: '{{colorA}}', letterSpacing: 3 },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -30 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: -15 }, easing: 'cubicIn' } },
      },
      {
        id: 'sc-scoreA',
        type: 'counter',
        counterTarget: 3,
        style: { position: 'absolute', top: '40%', left: '22%', fontSize: 64, fontWeight: 900, color: '#ffffff' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'bounceOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'sc-vs',
        type: 'text',
        text: 'VS',
        style: { position: 'absolute', top: '44%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: 4 },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'sc-teamB',
        type: 'text',
        text: '{{teamB}}',
        style: { position: 'absolute', top: '34%', right: '18%', fontSize: 18, fontWeight: 600, color: '{{colorB}}', letterSpacing: 3 },
        animation: { enterDelay: 0.05, enter: { from: { opacity: 0, x: 30 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 15 }, easing: 'cubicIn' } },
      },
      {
        id: 'sc-scoreB',
        type: 'counter',
        counterTarget: 1,
        style: { position: 'absolute', top: '40%', right: '22%', fontSize: 64, fontWeight: 900, color: '#ffffff' },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'bounceOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'sc-divider',
        type: 'rect',
        style: { position: 'absolute', top: '36%', left: '50%', transform: 'translateX(-50%)', width: 1, height: '22%', backgroundColor: 'rgba(255,255,255,0.15)' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleY: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// TITLES (7 templates)
// ---------------------------------------------------------------------------

const tt01_movie: BundledTemplate = {
  id: 'tt-movie-title',
  title: 'Movie Title',
  description: 'Epic movie-poster style title with dramatic fade and wide tracking.',
  category: 'titles',
  tags: ['movie', 'cinema', 'epic', 'dramatic'],
  featured: true,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'INCEPTION', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Your mind is the scene of the crime', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030712', group: 'Style' },
    { key: 'titleColor', label: 'Title Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
  defaultConfig: { title: 'INCEPTION', tagline: 'Your mind is the scene of the crime', bgColor: '#030712', titleColor: '#e2e8f0' },
  motionDesignDescription: {
    name: 'Movie Title',
    description: 'Epic movie-poster style title.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.2,
    elements: [
      {
        id: 'mt-line-top',
        type: 'rect',
        style: { position: 'absolute', top: '40%', left: '20%', width: '60%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'mt-title',
        type: 'text',
        text: '{{title}}',
        style: { position: 'absolute', top: '43%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 300, color: '{{titleColor}}', letterSpacing: 24, textAlign: 'center' },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, blur: 6 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, blur: 6 }, easing: 'cubicIn' } },
      },
      {
        id: 'mt-line-bot',
        type: 'rect',
        style: { position: 'absolute', top: '56%', left: '20%', width: '60%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'mt-tagline',
        type: 'text',
        text: '{{tagline}}',
        style: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, textAlign: 'center', fontStyle: 'italic' },
        animation: { enterDelay: 0.5, enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const tt02_newsHeadline: BundledTemplate = {
  id: 'tt-news-headline',
  title: 'News Headline',
  description: 'Breaking news style headline with red accent bar and urgent typography.',
  category: 'titles',
  tags: ['news', 'headline', 'breaking', 'urgent'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'BREAKING NEWS', group: 'Content' },
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Major Announcement Expected Today', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#dc2626', group: 'Style' },
  ],
  defaultConfig: { label: 'BREAKING NEWS', headline: 'Major Announcement Expected Today', bgColor: '#0f172a', accentColor: '#dc2626' },
  motionDesignDescription: {
    name: 'News Headline',
    description: 'Breaking news style headline.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.25,
    exitDuration: 0.15,
    elements: [
      {
        id: 'nh-bar',
        type: 'rect',
        style: { position: 'absolute', top: '38%', left: '8%', width: '84%', height: 4, backgroundColor: '{{accentColor}}' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'nh-label-bg',
        type: 'rect',
        style: { position: 'absolute', top: '40%', left: '8%', width: 160, height: 32, backgroundColor: '{{accentColor}}' },
        animation: { enterDelay: 0.05, enter: { from: { opacity: 0, x: -40 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: -20 }, easing: 'cubicIn' } },
      },
      {
        id: 'nh-label',
        type: 'text',
        text: '{{label}}',
        style: { position: 'absolute', top: '41.5%', left: '10%', fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: 2 },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'nh-headline',
        type: 'text',
        text: '{{headline}}',
        style: { position: 'absolute', top: '48%', left: '8%', width: '84%', fontSize: 28, fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -10 }, easing: 'cubicIn' } },
      },
    ],
  },
}

const tt03_minimalTitle: BundledTemplate = {
  id: 'tt-minimal-title',
  title: 'Minimal Title',
  description: 'Ultra-minimal title with thin weight and generous whitespace on light background.',
  category: 'titles',
  tags: ['minimal', 'clean', 'light', 'simple'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Chapter One', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#292524', group: 'Style' },
  ],
  defaultConfig: { title: 'Chapter One', bgColor: '#fafaf9', textColor: '#292524' },
  motionDesignDescription: {
    name: 'Minimal Title',
    description: 'Ultra-minimal title with thin weight.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.2,
    elements: [
      {
        id: 'min-dot',
        type: 'circle',
        style: { position: 'absolute', top: '44%', left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, backgroundColor: '{{textColor}}', borderRadius: '50%', opacity: 0.3 },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'min-title',
        type: 'text',
        text: '{{title}}',
        style: { position: 'absolute', top: '48%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 200, color: '{{textColor}}', letterSpacing: 6 },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'cubicIn' } },
      },
      {
        id: 'min-line',
        type: 'rect',
        style: { position: 'absolute', top: '57%', left: '45%', width: '10%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.2 },
        animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const tt04_splitTitle: BundledTemplate = {
  id: 'tt-split-title',
  title: 'Split Title',
  description: 'Title split between top and bottom of screen with contrasting weights.',
  category: 'titles',
  tags: ['split', 'top-bottom', 'contrast', 'editorial'],
  featured: false,
  configSchema: [
    { key: 'topText', label: 'Top Text', type: 'text', defaultValue: 'THE', group: 'Content' },
    { key: 'bottomText', label: 'Bottom Text', type: 'text', defaultValue: 'FUTURE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'topColor', label: 'Top Color', type: 'color', defaultValue: '#71717a', group: 'Style' },
    { key: 'bottomColor', label: 'Bottom Color', type: 'color', defaultValue: '#fafafa', group: 'Style' },
  ],
  defaultConfig: { topText: 'THE', bottomText: 'FUTURE', bgColor: '#0a0a0a', topColor: '#71717a', bottomColor: '#fafafa' },
  motionDesignDescription: {
    name: 'Split Title',
    description: 'Title split top and bottom with contrasting weights.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'st-top',
        type: 'text',
        text: '{{topText}}',
        style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 200, color: '{{topColor}}', letterSpacing: 20 },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -30 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -15 }, easing: 'cubicIn' } },
      },
      {
        id: 'st-center-line',
        type: 'rect',
        style: { position: 'absolute', top: '48%', left: '30%', width: '40%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'st-bottom',
        type: 'text',
        text: '{{bottomText}}',
        style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 900, color: '{{bottomColor}}', letterSpacing: 10 },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 30 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: 15 }, easing: 'cubicIn' } },
      },
    ],
  },
}

const tt05_subtitleFade: BundledTemplate = {
  id: 'tt-subtitle-fade',
  title: 'Subtitle Fade',
  description: 'Cinematic subtitle/caption style with gentle fade from below.',
  category: 'titles',
  tags: ['subtitle', 'caption', 'fade', 'cinematic'],
  featured: false,
  configSchema: [
    { key: 'text', label: 'Subtitle', type: 'text', defaultValue: 'Sometimes the smallest step in the right direction ends up being the biggest step of your life.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
  defaultConfig: { text: 'Sometimes the smallest step in the right direction ends up being the biggest step of your life.', bgColor: '#0a0a0a', textColor: '#ffffff' },
  motionDesignDescription: {
    name: 'Subtitle Fade',
    description: 'Cinematic subtitle with gentle fade.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.2,
    elements: [
      {
        id: 'sub-bg',
        type: 'rect',
        style: { position: 'absolute', top: '68%', left: '8%', width: '84%', height: '18%', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8 },
        animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'cubicIn' } },
      },
      {
        id: 'sub-text',
        type: 'text',
        text: '{{text}}',
        style: { position: 'absolute', top: '72%', left: '12%', width: '76%', fontSize: 18, fontWeight: 400, color: '{{textColor}}', lineHeight: 1.6, textAlign: 'center' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -8 }, easing: 'cubicIn' } },
      },
      {
        id: 'sub-indicator',
        type: 'rect',
        style: { position: 'absolute', top: '88%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 3, backgroundColor: '{{textColor}}', opacity: 0.3, borderRadius: 2 },
        animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const tt06_chapterTitle: BundledTemplate = {
  id: 'tt-chapter-title',
  title: 'Chapter Title',
  description: 'Book-chapter style with numeral and title separated by a thin rule.',
  category: 'titles',
  tags: ['chapter', 'book', 'editorial', 'elegant'],
  featured: false,
  configSchema: [
    { key: 'number', label: 'Number', type: 'text', defaultValue: 'I', group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'The Beginning', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1917', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d6d3d1', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#b45309', group: 'Style' },
  ],
  defaultConfig: { number: 'I', title: 'The Beginning', bgColor: '#1c1917', textColor: '#d6d3d1', accentColor: '#b45309' },
  motionDesignDescription: {
    name: 'Chapter Title',
    description: 'Book-chapter style with numeral and title.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.2,
    elements: [
      {
        id: 'ch-num',
        type: 'text',
        text: '{{number}}',
        style: { position: 'absolute', top: '36%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 200, color: '{{accentColor}}', fontFamily: 'Georgia, serif' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -10 }, easing: 'cubicIn' } },
      },
      {
        id: 'ch-rule',
        type: 'rect',
        style: { position: 'absolute', top: '47%', left: '40%', width: '20%', height: 1, backgroundColor: '{{accentColor}}', opacity: 0.5 },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ch-title',
        type: 'text',
        text: '{{title}}',
        style: { position: 'absolute', top: '51%', left: '50%', transform: 'translateX(-50%)', fontSize: 30, fontWeight: 300, color: '{{textColor}}', letterSpacing: 6, fontFamily: 'Georgia, serif' },
        animation: { enterDelay: 0.35, enter: { from: { opacity: 0, y: 12 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -8 }, easing: 'cubicIn' } },
      },
    ],
  },
}

const tt07_dramaticReveal: BundledTemplate = {
  id: 'tt-dramatic-reveal',
  title: 'Dramatic Reveal',
  description: 'Title words revealed one at a time with scale and blur transitions on rich purple.',
  category: 'titles',
  tags: ['dramatic', 'reveal', 'sequential', 'premium'],
  featured: false,
  configSchema: [
    { key: 'word1', label: 'Word 1', type: 'text', defaultValue: 'EXPECT', group: 'Content' },
    { key: 'word2', label: 'Word 2', type: 'text', defaultValue: 'THE', group: 'Content' },
    { key: 'word3', label: 'Word 3', type: 'text', defaultValue: 'UNEXPECTED', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3b0764', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5f3ff', group: 'Style' },
  ],
  defaultConfig: { word1: 'EXPECT', word2: 'THE', word3: 'UNEXPECTED', bgColor: '#3b0764', textColor: '#f5f3ff' },
  motionDesignDescription: {
    name: 'Dramatic Reveal',
    description: 'Words revealed one at a time with blur transitions.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.15,
    elements: [
      {
        id: 'dr-w1',
        type: 'text',
        text: '{{word1}}',
        style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 300, color: '{{textColor}}', letterSpacing: 10, opacity: 0.7 },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, blur: 15, scale: 1.3 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, blur: 10 }, easing: 'cubicIn' } },
      },
      {
        id: 'dr-w2',
        type: 'text',
        text: '{{word2}}',
        style: { position: 'absolute', top: '44%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 200, color: 'rgba(245,243,255,0.4)', letterSpacing: 14 },
        animation: { enterDelay: 0.25, enter: { from: { opacity: 0, blur: 10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'dr-w3',
        type: 'text',
        text: '{{word3}}',
        style: { position: 'absolute', top: '52%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 800, color: '{{textColor}}', letterSpacing: 6 },
        animation: { enterDelay: 0.45, enter: { from: { opacity: 0, blur: 20, scale: 0.7 }, easing: 'backOut' }, hold: { effect: 'glow', amplitude: 0.1, speed: 1.5 }, exit: { to: { opacity: 0, blur: 15 }, easing: 'cubicIn' } },
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// INFOGRAPHIC (5 templates)
// ---------------------------------------------------------------------------

const ig01_featureList: BundledTemplate = {
  id: 'ig-feature-list',
  title: 'Feature List',
  description: 'Checkmark feature list with staggered items appearing on dark canvas.',
  category: 'infographic',
  tags: ['features', 'list', 'checkmark', 'product'],
  featured: false,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'What you get', group: 'Content' },
    { key: 'f1', label: 'Feature 1', type: 'text', defaultValue: 'Unlimited exports', group: 'Content' },
    { key: 'f2', label: 'Feature 2', type: 'text', defaultValue: 'Custom branding', group: 'Content' },
    { key: 'f3', label: 'Feature 3', type: 'text', defaultValue: 'Priority support', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'checkColor', label: 'Check Color', type: 'color', defaultValue: '#10b981', group: 'Style' },
  ],
  defaultConfig: { heading: 'What you get', f1: 'Unlimited exports', f2: 'Custom branding', f3: 'Priority support', bgColor: '#111827', checkColor: '#10b981' },
  motionDesignDescription: {
    name: 'Feature List',
    description: 'Checkmark feature list with staggered items.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'fl-heading',
        type: 'text',
        text: '{{heading}}',
        style: { position: 'absolute', top: '24%', left: '12%', fontSize: 28, fontWeight: 700, color: '#f9fafb' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -20 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'fl-check1',
        type: 'text',
        text: '\u2713',
        style: { position: 'absolute', top: '36%', left: '12%', fontSize: 18, fontWeight: 700, color: '{{checkColor}}' },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'fl-f1',
        type: 'text',
        text: '{{f1}}',
        style: { position: 'absolute', top: '36%', left: '20%', fontSize: 18, fontWeight: 400, color: '#d1d5db' },
        animation: { enterDelay: 0.18, enter: { from: { opacity: 0, x: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'fl-check2',
        type: 'text',
        text: '\u2713',
        style: { position: 'absolute', top: '46%', left: '12%', fontSize: 18, fontWeight: 700, color: '{{checkColor}}' },
        animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'fl-f2',
        type: 'text',
        text: '{{f2}}',
        style: { position: 'absolute', top: '46%', left: '20%', fontSize: 18, fontWeight: 400, color: '#d1d5db' },
        animation: { enterDelay: 0.33, enter: { from: { opacity: 0, x: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'fl-check3',
        type: 'text',
        text: '\u2713',
        style: { position: 'absolute', top: '56%', left: '12%', fontSize: 18, fontWeight: 700, color: '{{checkColor}}' },
        animation: { enterDelay: 0.45, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'fl-f3',
        type: 'text',
        text: '{{f3}}',
        style: { position: 'absolute', top: '56%', left: '20%', fontSize: 18, fontWeight: 400, color: '#d1d5db' },
        animation: { enterDelay: 0.48, enter: { from: { opacity: 0, x: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const ig02_processSteps: BundledTemplate = {
  id: 'ig-process-steps',
  title: 'Process Steps',
  description: 'Three numbered steps with connecting lines on a warm background.',
  category: 'infographic',
  tags: ['process', 'steps', '1-2-3', 'how-to'],
  featured: false,
  configSchema: [
    { key: 'step1', label: 'Step 1', type: 'text', defaultValue: 'Choose a template', group: 'Content' },
    { key: 'step2', label: 'Step 2', type: 'text', defaultValue: 'Customize it', group: 'Content' },
    { key: 'step3', label: 'Step 3', type: 'text', defaultValue: 'Export & share', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fef3c7', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#d97706', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1c1917', group: 'Style' },
  ],
  defaultConfig: { step1: 'Choose a template', step2: 'Customize it', step3: 'Export & share', bgColor: '#fef3c7', numberColor: '#d97706', textColor: '#1c1917' },
  motionDesignDescription: {
    name: 'Process Steps',
    description: 'Three numbered steps with connecting lines.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'ps-n1',
        type: 'text',
        text: '01',
        style: { position: 'absolute', top: '26%', left: '12%', fontSize: 36, fontWeight: 800, color: '{{numberColor}}' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ps-s1',
        type: 'text',
        text: '{{step1}}',
        style: { position: 'absolute', top: '28%', left: '25%', fontSize: 18, fontWeight: 500, color: '{{textColor}}' },
        animation: { enterDelay: 0.05, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ps-line1',
        type: 'rect',
        style: { position: 'absolute', top: '37%', left: '14%', width: 1, height: '6%', backgroundColor: '{{numberColor}}', opacity: 0.3 },
        animation: { enterDelay: 0.12, enter: { from: { opacity: 0, scaleY: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ps-n2',
        type: 'text',
        text: '02',
        style: { position: 'absolute', top: '45%', left: '12%', fontSize: 36, fontWeight: 800, color: '{{numberColor}}' },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ps-s2',
        type: 'text',
        text: '{{step2}}',
        style: { position: 'absolute', top: '47%', left: '25%', fontSize: 18, fontWeight: 500, color: '{{textColor}}' },
        animation: { enterDelay: 0.25, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ps-line2',
        type: 'rect',
        style: { position: 'absolute', top: '56%', left: '14%', width: 1, height: '6%', backgroundColor: '{{numberColor}}', opacity: 0.3 },
        animation: { enterDelay: 0.32, enter: { from: { opacity: 0, scaleY: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ps-n3',
        type: 'text',
        text: '03',
        style: { position: 'absolute', top: '64%', left: '12%', fontSize: 36, fontWeight: 800, color: '{{numberColor}}' },
        animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'ps-s3',
        type: 'text',
        text: '{{step3}}',
        style: { position: 'absolute', top: '66%', left: '25%', fontSize: 18, fontWeight: 500, color: '{{textColor}}' },
        animation: { enterDelay: 0.45, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const ig03_comparison: BundledTemplate = {
  id: 'ig-comparison',
  title: 'Comparison',
  description: 'Side-by-side comparison with "vs" divider and contrasting color columns.',
  category: 'infographic',
  tags: ['comparison', 'versus', 'side-by-side', 'pros-cons'],
  featured: false,
  configSchema: [
    { key: 'labelA', label: 'Left Label', type: 'text', defaultValue: 'Before', group: 'Content' },
    { key: 'labelB', label: 'Right Label', type: 'text', defaultValue: 'After', group: 'Content' },
    { key: 'descA', label: 'Left Description', type: 'text', defaultValue: 'Slow, manual process', group: 'Content' },
    { key: 'descB', label: 'Right Description', type: 'text', defaultValue: 'Fast, automated flow', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e293b', group: 'Style' },
    { key: 'colorA', label: 'Left Color', type: 'color', defaultValue: '#f87171', group: 'Style' },
    { key: 'colorB', label: 'Right Color', type: 'color', defaultValue: '#34d399', group: 'Style' },
  ],
  defaultConfig: { labelA: 'Before', labelB: 'After', descA: 'Slow, manual process', descB: 'Fast, automated flow', bgColor: '#1e293b', colorA: '#f87171', colorB: '#34d399' },
  motionDesignDescription: {
    name: 'Comparison',
    description: 'Side-by-side comparison with vs divider.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'cmp-divider',
        type: 'rect',
        style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 1, height: '50%', backgroundColor: 'rgba(255,255,255,0.15)' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleY: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'cmp-vs',
        type: 'text',
        text: 'VS',
        style: { position: 'absolute', top: '46%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: 3 },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'cmp-lblA',
        type: 'text',
        text: '{{labelA}}',
        style: { position: 'absolute', top: '32%', left: '12%', fontSize: 24, fontWeight: 700, color: '{{colorA}}' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: -20 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: -10 }, easing: 'cubicIn' } },
      },
      {
        id: 'cmp-descA',
        type: 'text',
        text: '{{descA}}',
        style: { position: 'absolute', top: '42%', left: '12%', fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.6)', maxWidth: '35%', lineHeight: 1.5 },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'cmp-lblB',
        type: 'text',
        text: '{{labelB}}',
        style: { position: 'absolute', top: '32%', right: '12%', fontSize: 24, fontWeight: 700, color: '{{colorB}}' },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: 20 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 10 }, easing: 'cubicIn' } },
      },
      {
        id: 'cmp-descB',
        type: 'text',
        text: '{{descB}}',
        style: { position: 'absolute', top: '42%', right: '12%', fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.6)', maxWidth: '35%', lineHeight: 1.5, textAlign: 'right' },
        animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const ig04_prosCons: BundledTemplate = {
  id: 'ig-pros-cons',
  title: 'Pros & Cons',
  description: 'Green/red pros and cons list with thumbs up/down indicators.',
  category: 'infographic',
  tags: ['pros', 'cons', 'list', 'decision'],
  featured: false,
  configSchema: [
    { key: 'pro1', label: 'Pro 1', type: 'text', defaultValue: 'Easy to use', group: 'Content' },
    { key: 'pro2', label: 'Pro 2', type: 'text', defaultValue: 'Great value', group: 'Content' },
    { key: 'con1', label: 'Con 1', type: 'text', defaultValue: 'Learning curve', group: 'Content' },
    { key: 'con2', label: 'Con 2', type: 'text', defaultValue: 'Limited free plan', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
  ],
  defaultConfig: { pro1: 'Easy to use', pro2: 'Great value', con1: 'Learning curve', con2: 'Limited free plan', bgColor: '#18181b' },
  motionDesignDescription: {
    name: 'Pros & Cons',
    description: 'Green/red pros and cons list.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'pc-pro-label',
        type: 'text',
        text: 'PROS',
        style: { position: 'absolute', top: '24%', left: '12%', fontSize: 14, fontWeight: 800, color: '#22c55e', letterSpacing: 4 },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-p1-icon',
        type: 'text',
        text: '+',
        style: { position: 'absolute', top: '32%', left: '12%', fontSize: 20, fontWeight: 700, color: '#22c55e' },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-p1',
        type: 'text',
        text: '{{pro1}}',
        style: { position: 'absolute', top: '32%', left: '20%', fontSize: 16, fontWeight: 400, color: '#d4d4d8' },
        animation: { enterDelay: 0.12, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-p2-icon',
        type: 'text',
        text: '+',
        style: { position: 'absolute', top: '40%', left: '12%', fontSize: 20, fontWeight: 700, color: '#22c55e' },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-p2',
        type: 'text',
        text: '{{pro2}}',
        style: { position: 'absolute', top: '40%', left: '20%', fontSize: 16, fontWeight: 400, color: '#d4d4d8' },
        animation: { enterDelay: 0.22, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-divider',
        type: 'rect',
        style: { position: 'absolute', top: '50%', left: '12%', width: '76%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
        animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-con-label',
        type: 'text',
        text: 'CONS',
        style: { position: 'absolute', top: '54%', left: '12%', fontSize: 14, fontWeight: 800, color: '#ef4444', letterSpacing: 4 },
        animation: { enterDelay: 0.35, enter: { from: { opacity: 0, x: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-c1-icon',
        type: 'text',
        text: '\u2212',
        style: { position: 'absolute', top: '62%', left: '12%', fontSize: 20, fontWeight: 700, color: '#ef4444' },
        animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-c1',
        type: 'text',
        text: '{{con1}}',
        style: { position: 'absolute', top: '62%', left: '20%', fontSize: 16, fontWeight: 400, color: '#d4d4d8' },
        animation: { enterDelay: 0.42, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-c2-icon',
        type: 'text',
        text: '\u2212',
        style: { position: 'absolute', top: '70%', left: '12%', fontSize: 20, fontWeight: 700, color: '#ef4444' },
        animation: { enterDelay: 0.5, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'pc-c2',
        type: 'text',
        text: '{{con2}}',
        style: { position: 'absolute', top: '70%', left: '20%', fontSize: 16, fontWeight: 400, color: '#d4d4d8' },
        animation: { enterDelay: 0.52, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

const ig05_keyTakeaways: BundledTemplate = {
  id: 'ig-key-takeaways',
  title: 'Key Takeaways',
  description: 'Numbered key takeaways with bold accent numbers on a teal background.',
  category: 'infographic',
  tags: ['takeaways', 'summary', 'key-points', 'recap'],
  featured: false,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Key Takeaways', group: 'Content' },
    { key: 'point1', label: 'Point 1', type: 'text', defaultValue: 'Start with the problem', group: 'Content' },
    { key: 'point2', label: 'Point 2', type: 'text', defaultValue: 'Build the solution', group: 'Content' },
    { key: 'point3', label: 'Point 3', type: 'text', defaultValue: 'Measure the impact', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d9488', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0fdfa', group: 'Style' },
  ],
  defaultConfig: { heading: 'Key Takeaways', point1: 'Start with the problem', point2: 'Build the solution', point3: 'Measure the impact', bgColor: '#0d9488', textColor: '#f0fdfa' },
  motionDesignDescription: {
    name: 'Key Takeaways',
    description: 'Numbered takeaways with accent numbers.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      {
        id: 'kt-heading',
        type: 'text',
        text: '{{heading}}',
        style: { position: 'absolute', top: '22%', left: '12%', fontSize: 26, fontWeight: 700, color: '{{textColor}}' },
        animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -15 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'kt-rule',
        type: 'rect',
        style: { position: 'absolute', top: '31%', left: '12%', width: '30%', height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
        animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'kt-n1',
        type: 'text',
        text: '1',
        style: { position: 'absolute', top: '37%', left: '12%', fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,0.25)' },
        animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'kt-p1',
        type: 'text',
        text: '{{point1}}',
        style: { position: 'absolute', top: '39%', left: '22%', fontSize: 18, fontWeight: 500, color: '{{textColor}}' },
        animation: { enterDelay: 0.2, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'kt-n2',
        type: 'text',
        text: '2',
        style: { position: 'absolute', top: '50%', left: '12%', fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,0.25)' },
        animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'kt-p2',
        type: 'text',
        text: '{{point2}}',
        style: { position: 'absolute', top: '52%', left: '22%', fontSize: 18, fontWeight: 500, color: '{{textColor}}' },
        animation: { enterDelay: 0.35, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'kt-n3',
        type: 'text',
        text: '3',
        style: { position: 'absolute', top: '63%', left: '12%', fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,0.25)' },
        animation: { enterDelay: 0.45, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
      {
        id: 'kt-p3',
        type: 'text',
        text: '{{point3}}',
        style: { position: 'absolute', top: '65%', left: '22%', fontSize: 18, fontWeight: 500, color: '{{textColor}}' },
        animation: { enterDelay: 0.5, enter: { from: { opacity: 0, x: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } },
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// MASTER ARRAY
// ---------------------------------------------------------------------------

export const BUNDLED_TEMPLATES: BundledTemplate[] = [
  // Kinetic Typography (20)
  kt01_bounce,
  kt02_slide,
  kt03_scale,
  kt04_fade,
  kt05_elasticPop,
  kt06_cinematic,
  kt07_neonGlow,
  kt08_glitch,
  kt09_wave,
  kt10_typewriter,
  kt11_cascade,
  kt12_rotate,
  kt13_zoom,
  kt14_blurFocus,
  kt15_tracking,
  kt16_splitReveal,
  kt17_gravityDrop,
  kt18_spiral,
  kt19_stagger,
  kt20_impactBurst,
  // Social Media (10)
  sm01_quoteMinimal,
  sm02_quoteBold,
  sm03_igStory,
  sm04_lowerThird,
  sm05_endScreen,
  sm06_cta,
  sm07_countdown,
  sm08_announcement,
  sm09_poll,
  sm10_brandedIntro,
  // Data Visualization (8)
  dv01_singleStat,
  dv02_multiStat,
  dv03_progressBar,
  dv04_comparisonBars,
  dv05_arcGauge,
  dv06_percentReveal,
  dv07_metricCards,
  dv08_scorecard,
  // Titles (7)
  tt01_movie,
  tt02_newsHeadline,
  tt03_minimalTitle,
  tt04_splitTitle,
  tt05_subtitleFade,
  tt06_chapterTitle,
  tt07_dramaticReveal,
  // Infographic (5)
  ig01_featureList,
  ig02_processSteps,
  ig03_comparison,
  ig04_prosCons,
  ig05_keyTakeaways,
]

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

export function getFeaturedTemplates(): BundledTemplate[] {
  return BUNDLED_TEMPLATES.filter(t => t.featured)
}

export function getTemplatesByCategory(category: string): BundledTemplate[] {
  return BUNDLED_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: string): BundledTemplate | undefined {
  return BUNDLED_TEMPLATES.find(t => t.id === id)
}

export function searchTemplates(query: string): BundledTemplate[] {
  const lower = query.toLowerCase()
  return BUNDLED_TEMPLATES.filter(t =>
    t.title.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.toLowerCase().includes(lower))
  )
}

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'kinetic-typography', label: 'Typography' },
  { id: 'social-media', label: 'Social' },
  { id: 'data-visualization', label: 'Data Viz' },
  { id: 'titles', label: 'Titles' },
  { id: 'infographic', label: 'Infographic' },
]
