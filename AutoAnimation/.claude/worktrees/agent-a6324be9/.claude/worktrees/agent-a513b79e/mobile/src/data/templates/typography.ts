import type { BundledTemplate } from '../templates'

const typ001: BundledTemplate = {
  id: 'typ-bounce-slam',
  title: 'Bounce Slam',
  description: 'Bold text slams down with elastic bounce effect.',
  category: 'kinetic-typography',
  tags: ['bounce', 'slam', 'bold', 'energetic'],
  featured: true,
  configSchema: [
    { key: 'mainText', label: 'Main Text', type: 'text', defaultValue: 'SLAM', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ff3d00', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ff9100', group: 'Style' },
  ],
  defaultConfig: { mainText: 'SLAM', bgColor: '#0a0a0a', textColor: '#ff3d00', accentColor: '#ff9100' },
  motionDesignDescription: {
    name: 'Bounce Slam',
    description: 'Bold text slams down with elastic bounce.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'bg-flash', type: 'rect', style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '{{accentColor}}', opacity: 0 }, animation: { enterDelay: 0, enter: { from: { opacity: 0.6 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 80, fontWeight: 900, color: '{{textColor}}', textAlign: 'center', letterSpacing: 4 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -200, scale: 2.5 }, easing: 'bounceOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1.5 }, exit: { to: { opacity: 0, scale: 0.3 }, easing: 'cubicIn' } } },
      { id: 'underline', type: 'rect', style: { position: 'absolute', top: '58%', left: '25%', width: '50%', height: 6, backgroundColor: '{{accentColor}}', borderRadius: 3 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'dot-left', type: 'circle', style: { position: 'absolute', top: '56%', left: '22%', width: 12, height: 12, backgroundColor: '{{textColor}}', borderRadius: 6 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'dot-right', type: 'circle', style: { position: 'absolute', top: '56%', right: '22%', width: 12, height: 12, backgroundColor: '{{textColor}}', borderRadius: 6 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ002: BundledTemplate = {
  id: 'typ-typewriter-classic',
  title: 'Classic Typewriter',
  description: 'Text reveals letter by letter with a blinking cursor.',
  category: 'kinetic-typography',
  tags: ['typewriter', 'reveal', 'classic', 'minimal'],
  featured: true,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'Hello World.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#faf8f0', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cursorColor', label: 'Cursor Color', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
  ],
  defaultConfig: { mainText: 'Hello World.', bgColor: '#faf8f0', textColor: '#1a1a1a', cursorColor: '#1a1a1a' },
  motionDesignDescription: {
    name: 'Classic Typewriter',
    description: 'Letter-by-letter typewriter reveal with cursor.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.8,
    exitDuration: 0.2,
    elements: [
      { id: 'typed-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '44%', left: '12%', fontSize: 36, fontWeight: 400, fontFamily: 'Courier New, monospace', color: '{{textColor}}', letterSpacing: 2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, easing: 'linear' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'cursor', type: 'rect', style: { position: 'absolute', top: '44%', right: '40%', width: 3, height: 36, backgroundColor: '{{cursorColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'linear' }, hold: { effect: 'blink', amplitude: 1, speed: 2 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'paper-line', type: 'rect', style: { position: 'absolute', top: '56%', left: '10%', width: '80%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.15 }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ003: BundledTemplate = {
  id: 'typ-neon-glow',
  title: 'Neon Glow',
  description: 'Text flickers on with a neon sign glow effect.',
  category: 'kinetic-typography',
  tags: ['neon', 'glow', 'night', 'vibrant'],
  featured: true,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'NEON', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0221', group: 'Style' },
    { key: 'glowColor', label: 'Glow Color', type: 'color', defaultValue: '#ff00ff', group: 'Style' },
    { key: 'secondGlow', label: 'Second Glow', type: 'color', defaultValue: '#00ffff', group: 'Style' },
  ],
  defaultConfig: { mainText: 'NEON', bgColor: '#0d0221', glowColor: '#ff00ff', secondGlow: '#00ffff' },
  motionDesignDescription: {
    name: 'Neon Glow',
    description: 'Neon sign flicker-on effect with glow.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.15,
    elements: [
      { id: 'glow-bg', type: 'rect', style: { position: 'absolute', top: '30%', left: '20%', width: '60%', height: '40%', backgroundColor: '{{glowColor}}', opacity: 0.08, borderRadius: 20, filter: 'blur(40px)' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'easeOut' }, hold: { effect: 'pulse', amplitude: 0.04, speed: 1 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 700, color: '{{glowColor}}', textAlign: 'center', textShadow: '0 0 10px {{glowColor}}, 0 0 40px {{glowColor}}, 0 0 80px {{glowColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, hold: { effect: 'flicker', amplitude: 0.15, speed: 3 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'accent-line', type: 'rect', style: { position: 'absolute', top: '60%', left: '30%', width: '40%', height: 2, backgroundColor: '{{secondGlow}}', boxShadow: '0 0 10px {{secondGlow}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'corner-tl', type: 'rect', style: { position: 'absolute', top: '32%', left: '22%', width: 20, height: 20, borderTop: '2px solid {{secondGlow}}', borderLeft: '2px solid {{secondGlow}}' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'corner-br', type: 'rect', style: { position: 'absolute', bottom: '32%', right: '22%', width: 20, height: 20, borderBottom: '2px solid {{secondGlow}}', borderRight: '2px solid {{secondGlow}}' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ004: BundledTemplate = {
  id: 'typ-glitch-distort',
  title: 'Glitch Distortion',
  description: 'Text appears with RGB split and digital glitch artifacts.',
  category: 'kinetic-typography',
  tags: ['glitch', 'digital', 'distortion', 'cyberpunk'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'GLITCH', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'glitchColor', label: 'Glitch Color', type: 'color', defaultValue: '#00ff41', group: 'Style' },
  ],
  defaultConfig: { mainText: 'GLITCH', bgColor: '#0a0a0a', textColor: '#ffffff', glitchColor: '#00ff41' },
  motionDesignDescription: {
    name: 'Glitch Distortion',
    description: 'Digital glitch with RGB split artifacts.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.3,
    exitDuration: 0.15,
    elements: [
      { id: 'glitch-red', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 68, fontWeight: 900, color: '#ff0000', textAlign: 'center', opacity: 0.5, mixBlendMode: 'screen' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -10 }, easing: 'easeOut' }, hold: { effect: 'glitch', amplitude: 3, speed: 8 }, exit: { to: { opacity: 0, x: -20 }, easing: 'easeIn' } } },
      { id: 'glitch-blue', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 68, fontWeight: 900, color: '#0000ff', textAlign: 'center', opacity: 0.5, mixBlendMode: 'screen' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: 10 }, easing: 'easeOut' }, hold: { effect: 'glitch', amplitude: 3, speed: 8 }, exit: { to: { opacity: 0, x: 20 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 68, fontWeight: 900, color: '{{textColor}}', textAlign: 'center' }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0 }, easing: 'easeOut' }, hold: { effect: 'glitch', amplitude: 2, speed: 6 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'scanline', type: 'rect', style: { position: 'absolute', top: '50%', left: 0, width: '100%', height: 2, backgroundColor: '{{glitchColor}}', opacity: 0.6 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: -80 }, easing: 'linear' }, hold: { effect: 'scanline', amplitude: 100, speed: 4 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ005: BundledTemplate = {
  id: 'typ-minimal-fade',
  title: 'Minimal Fade',
  description: 'Clean text fades in with subtle upward drift.',
  category: 'kinetic-typography',
  tags: ['minimal', 'clean', 'elegant', 'simple'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'Less is more.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
  ],
  defaultConfig: { mainText: 'Less is more.', bgColor: '#ffffff', textColor: '#1a1a1a' },
  motionDesignDescription: {
    name: 'Minimal Fade',
    description: 'Clean fade-in with upward drift.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.6,
    exitDuration: 0.3,
    elements: [
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '45%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 300, color: '{{textColor}}', textAlign: 'center', letterSpacing: 2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: 30 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -20 }, easing: 'cubicIn' } } },
      { id: 'line-below', type: 'rect', style: { position: 'absolute', top: '55%', left: '40%', width: '20%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.3 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'cubicIn' } } },
    ],
  },
}

const typ006: BundledTemplate = {
  id: 'typ-bold-impact',
  title: 'Bold Impact',
  description: 'Massive bold text with impact lines radiating outward.',
  category: 'kinetic-typography',
  tags: ['bold', 'impact', 'strong', 'dramatic'],
  featured: true,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'IMPACT', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#ff0040', group: 'Style' },
  ],
  defaultConfig: { mainText: 'IMPACT', bgColor: '#000000', textColor: '#ffffff', lineColor: '#ff0040' },
  motionDesignDescription: {
    name: 'Bold Impact',
    description: 'Massive text with radiating impact lines.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.25,
    exitDuration: 0.15,
    elements: [
      { id: 'impact-line-1', type: 'rect', style: { position: 'absolute', top: '35%', left: '10%', width: 80, height: 4, backgroundColor: '{{lineColor}}', transform: 'rotate(-15deg)' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: 40, scaleX: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'impact-line-2', type: 'rect', style: { position: 'absolute', top: '60%', right: '10%', width: 80, height: 4, backgroundColor: '{{lineColor}}', transform: 'rotate(15deg)' }, animation: { enterDelay: 0.18, enter: { from: { opacity: 0, x: -40, scaleX: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '36%', left: '50%', transform: 'translateX(-50%)', fontSize: 96, fontWeight: 900, color: '{{textColor}}', textAlign: 'center', letterSpacing: 8, textTransform: 'uppercase' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 3 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scale: 0.5 }, easing: 'cubicIn' } } },
      { id: 'shadow-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '37%', left: '50.5%', transform: 'translateX(-50%)', fontSize: 96, fontWeight: 900, color: '{{lineColor}}', textAlign: 'center', letterSpacing: 8, textTransform: 'uppercase', opacity: 0.3, zIndex: -1 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, scale: 3.2 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'cubicIn' } } },
    ],
  },
}

const typ007: BundledTemplate = {
  id: 'typ-wave-ripple',
  title: 'Wave Ripple',
  description: 'Text undulates with a smooth wave motion.',
  category: 'kinetic-typography',
  tags: ['wave', 'ripple', 'smooth', 'organic'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'WAVE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a2332', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#4fc3f7', group: 'Style' },
    { key: 'waveColor', label: 'Wave Color', type: 'color', defaultValue: '#0288d1', group: 'Style' },
  ],
  defaultConfig: { mainText: 'WAVE', bgColor: '#1a2332', textColor: '#4fc3f7', waveColor: '#0288d1' },
  motionDesignDescription: {
    name: 'Wave Ripple',
    description: 'Text with smooth wave undulation.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'wave-line-1', type: 'rect', style: { position: 'absolute', top: '60%', left: '10%', width: '80%', height: 2, backgroundColor: '{{waveColor}}', opacity: 0.4 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, hold: { effect: 'wave', amplitude: 8, speed: 2 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'wave-line-2', type: 'rect', style: { position: 'absolute', top: '63%', left: '10%', width: '80%', height: 2, backgroundColor: '{{waveColor}}', opacity: 0.25 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, hold: { effect: 'wave', amplitude: 10, speed: 1.5 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 700, color: '{{textColor}}', textAlign: 'center', letterSpacing: 12 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: 40 }, easing: 'elasticOut' }, hold: { effect: 'wave', amplitude: 5, speed: 1.5 }, exit: { to: { opacity: 0, y: -30 }, easing: 'cubicIn' } } },
    ],
  },
}

const typ008: BundledTemplate = {
  id: 'typ-retro-vhs',
  title: 'Retro VHS',
  description: 'Nostalgic VHS-style text with tracking lines and date stamp.',
  category: 'kinetic-typography',
  tags: ['retro', 'vhs', 'vintage', 'nostalgic', '80s'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'REWIND', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e0', group: 'Style' },
    { key: 'tintColor', label: 'Tint', type: 'color', defaultValue: '#ff6b9d', group: 'Style' },
  ],
  defaultConfig: { mainText: 'REWIND', bgColor: '#0a0a12', textColor: '#e0e0e0', tintColor: '#ff6b9d' },
  motionDesignDescription: {
    name: 'Retro VHS',
    description: 'VHS tracking with retro text.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'tracking-line', type: 'rect', style: { position: 'absolute', top: '30%', left: 0, width: '100%', height: 3, backgroundColor: '{{tintColor}}', opacity: 0.5 }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'linear' }, hold: { effect: 'scanline', amplitude: 150, speed: 2 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 700, color: '{{textColor}}', fontFamily: 'monospace', textAlign: 'center', letterSpacing: 6 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: -8 }, easing: 'easeOut' }, hold: { effect: 'glitch', amplitude: 2, speed: 4 }, exit: { to: { opacity: 0, x: 8 }, easing: 'easeIn' } } },
      { id: 'rec-dot', type: 'circle', style: { position: 'absolute', top: '10%', left: '8%', width: 10, height: 10, backgroundColor: '#ff0000', borderRadius: 5 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0 }, easing: 'easeOut' }, hold: { effect: 'blink', amplitude: 1, speed: 1.5 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'rec-label', type: 'text', text: 'REC', style: { position: 'absolute', top: '8.5%', left: '12%', fontSize: 14, fontWeight: 700, color: '#ff0000', fontFamily: 'monospace' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0 }, easing: 'easeOut' }, hold: { effect: 'blink', amplitude: 1, speed: 1.5 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'timestamp', type: 'text', text: '00:03:27', style: { position: 'absolute', bottom: '10%', right: '8%', fontSize: 14, fontWeight: 400, color: '{{textColor}}', fontFamily: 'monospace', opacity: 0.6 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ009: BundledTemplate = {
  id: 'typ-cascade-stagger',
  title: 'Cascade Stagger',
  description: 'Multiple lines cascade in from the side with staggered timing.',
  category: 'kinetic-typography',
  tags: ['cascade', 'stagger', 'lines', 'sequential'],
  featured: false,
  configSchema: [
    { key: 'line1', label: 'Line 1', type: 'text', defaultValue: 'CREATE', group: 'Content' },
    { key: 'line2', label: 'Line 2', type: 'text', defaultValue: 'INSPIRE', group: 'Content' },
    { key: 'line3', label: 'Line 3', type: 'text', defaultValue: 'REPEAT', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#161616', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e8e8', group: 'Style' },
  ],
  defaultConfig: { line1: 'CREATE', line2: 'INSPIRE', line3: 'REPEAT', bgColor: '#161616', textColor: '#e8e8e8' },
  motionDesignDescription: {
    name: 'Cascade Stagger',
    description: 'Staggered cascade of text lines.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.6,
    exitDuration: 0.2,
    elements: [
      { id: 'line-1', type: 'text', text: '{{line1}}', style: { position: 'absolute', top: '32%', left: '15%', fontSize: 48, fontWeight: 800, color: '{{textColor}}', letterSpacing: 6 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -80 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 80 }, easing: 'cubicIn' } } },
      { id: 'line-2', type: 'text', text: '{{line2}}', style: { position: 'absolute', top: '45%', left: '15%', fontSize: 48, fontWeight: 800, color: '{{textColor}}', letterSpacing: 6 }, animation: { enterDelay: 0.12, enter: { from: { opacity: 0, x: -80 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 80 }, easing: 'cubicIn' } } },
      { id: 'line-3', type: 'text', text: '{{line3}}', style: { position: 'absolute', top: '58%', left: '15%', fontSize: 48, fontWeight: 800, color: '{{textColor}}', letterSpacing: 6 }, animation: { enterDelay: 0.24, enter: { from: { opacity: 0, x: -80 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 80 }, easing: 'cubicIn' } } },
      { id: 'accent-bar', type: 'rect', style: { position: 'absolute', top: '30%', left: '10%', width: 4, height: '35%', backgroundColor: '{{textColor}}', opacity: 0.3 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scaleY: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ010: BundledTemplate = {
  id: 'typ-zoom-burst',
  title: 'Zoom Burst',
  description: 'Text zooms from tiny to full size with a burst of energy.',
  category: 'kinetic-typography',
  tags: ['zoom', 'burst', 'energy', 'scale'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'BOOM', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffd700', group: 'Style' },
    { key: 'burstColor', label: 'Burst Color', type: 'color', defaultValue: '#ff6b00', group: 'Style' },
  ],
  defaultConfig: { mainText: 'BOOM', bgColor: '#1a0a2e', textColor: '#ffd700', burstColor: '#ff6b00' },
  motionDesignDescription: {
    name: 'Zoom Burst',
    description: 'Text zooms from tiny with burst energy.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.35,
    exitDuration: 0.2,
    elements: [
      { id: 'burst-circle', type: 'circle', style: { position: 'absolute', top: '35%', left: '35%', width: '30%', height: '30%', backgroundColor: '{{burstColor}}', borderRadius: '50%', opacity: 0.2, filter: 'blur(30px)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scale: 2 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 88, fontWeight: 900, color: '{{textColor}}', textAlign: 'center' }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, scale: 0.05 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 3 }, easing: 'cubicIn' } } },
      { id: 'ring', type: 'circle', style: { position: 'absolute', top: '30%', left: '25%', width: '50%', height: '40%', border: '2px solid {{burstColor}}', borderRadius: '50%', opacity: 0.4 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'cubicOut' }, hold: { effect: 'pulse', amplitude: 0.05, speed: 2 }, exit: { to: { opacity: 0, scale: 1.5 }, easing: 'easeIn' } } },
    ],
  },
}

const typ011: BundledTemplate = {
  id: 'typ-rotate-reveal',
  title: 'Rotate Reveal',
  description: 'Text rotates in from a tilted angle with smooth deceleration.',
  category: 'kinetic-typography',
  tags: ['rotate', 'spin', 'reveal', 'dynamic'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'SPIN', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0eb', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2d2d2d', group: 'Style' },
  ],
  defaultConfig: { mainText: 'SPIN', bgColor: '#f5f0eb', textColor: '#2d2d2d' },
  motionDesignDescription: {
    name: 'Rotate Reveal',
    description: 'Text rotates in from tilted angle.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 800, color: '{{textColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, rotate: -45, scale: 0.5 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, rotate: 45, scale: 0.5 }, easing: 'cubicIn' } } },
      { id: 'circle-accent', type: 'circle', style: { position: 'absolute', top: '38%', right: '20%', width: 40, height: 40, border: '2px solid {{textColor}}', borderRadius: 20, opacity: 0.2 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0, rotate: 90 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'dot-accent', type: 'circle', style: { position: 'absolute', top: '55%', left: '25%', width: 8, height: 8, backgroundColor: '{{textColor}}', borderRadius: 4, opacity: 0.3 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ012: BundledTemplate = {
  id: 'typ-gradient-slide',
  title: 'Gradient Slide',
  description: 'Text slides in with a gradient color wipe reveal.',
  category: 'kinetic-typography',
  tags: ['gradient', 'slide', 'colorful', 'modern'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'GRADIENT', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f0f', group: 'Style' },
    { key: 'color1', label: 'Color 1', type: 'color', defaultValue: '#667eea', group: 'Style' },
    { key: 'color2', label: 'Color 2', type: 'color', defaultValue: '#764ba2', group: 'Style' },
  ],
  defaultConfig: { mainText: 'GRADIENT', bgColor: '#0f0f0f', color1: '#667eea', color2: '#764ba2' },
  motionDesignDescription: {
    name: 'Gradient Slide',
    description: 'Gradient color wipe text reveal.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'gradient-bar', type: 'rect', style: { position: 'absolute', top: '38%', left: 0, width: '100%', height: '24%', background: 'linear-gradient(90deg, {{color1}}, {{color2}})', opacity: 0.15 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -200 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 200 }, easing: 'cubicIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 800, color: '{{color1}}', textAlign: 'center', letterSpacing: 4 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: -60 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 60 }, easing: 'cubicIn' } } },
      { id: 'sub-line', type: 'rect', style: { position: 'absolute', top: '58%', left: '35%', width: '30%', height: 3, backgroundColor: '{{color2}}' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ013: BundledTemplate = {
  id: 'typ-split-text',
  title: 'Split Text',
  description: 'Text splits horizontally revealing from the center.',
  category: 'kinetic-typography',
  tags: ['split', 'reveal', 'center', 'dramatic'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'SPLIT', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'dividerColor', label: 'Divider', type: 'color', defaultValue: '#e53935', group: 'Style' },
  ],
  defaultConfig: { mainText: 'SPLIT', bgColor: '#0d0d0d', textColor: '#ffffff', dividerColor: '#e53935' },
  motionDesignDescription: {
    name: 'Split Text',
    description: 'Text splits from center horizontally.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'divider-line', type: 'rect', style: { position: 'absolute', top: '49%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: 3, backgroundColor: '{{dividerColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scaleX: 0 }, easing: 'cubicIn' } } },
      { id: 'top-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 900, color: '{{textColor}}', textAlign: 'center', clipPath: 'inset(0 0 50% 0)' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: -30 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -30 }, easing: 'cubicIn' } } },
      { id: 'bottom-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 900, color: '{{textColor}}', textAlign: 'center', clipPath: 'inset(50% 0 0 0)' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 30 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: 30 }, easing: 'cubicIn' } } },
    ],
  },
}

const typ014: BundledTemplate = {
  id: 'typ-handwritten-organic',
  title: 'Handwritten Feel',
  description: 'Organic text that appears as if being hand-drawn on screen.',
  category: 'kinetic-typography',
  tags: ['handwritten', 'organic', 'natural', 'casual'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'hello there', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fefcf3', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3d3d3d', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#e07c5a', group: 'Style' },
  ],
  defaultConfig: { mainText: 'hello there', bgColor: '#fefcf3', textColor: '#3d3d3d', accentColor: '#e07c5a' },
  motionDesignDescription: {
    name: 'Handwritten Feel',
    description: 'Organic hand-drawn text reveal.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.7,
    exitDuration: 0.25,
    elements: [
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%) rotate(-2deg)', fontSize: 48, fontWeight: 400, fontStyle: 'italic', color: '{{textColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -20 }, easing: 'cubicIn' } } },
      { id: 'underline-squiggle', type: 'rect', style: { position: 'absolute', top: '56%', left: '30%', width: '40%', height: 3, backgroundColor: '{{accentColor}}', transform: 'rotate(1deg)', borderRadius: 2 }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'star-doodle', type: 'text', text: '✦', style: { position: 'absolute', top: '36%', right: '25%', fontSize: 20, color: '{{accentColor}}', opacity: 0.6 }, animation: { enterDelay: 0.5, enter: { from: { opacity: 0, scale: 0, rotate: -90 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.1, speed: 1 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ015: BundledTemplate = {
  id: 'typ-3d-perspective',
  title: '3D Perspective',
  description: 'Text flies in with 3D perspective rotation.',
  category: 'kinetic-typography',
  tags: ['3d', 'perspective', 'depth', 'cinematic'],
  featured: true,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'DEPTH', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f9fafb', group: 'Style' },
    { key: 'shadowColor', label: 'Shadow', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
  defaultConfig: { mainText: 'DEPTH', bgColor: '#111827', textColor: '#f9fafb', shadowColor: '#6366f1' },
  motionDesignDescription: {
    name: '3D Perspective',
    description: '3D perspective rotation text entrance.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'shadow-layer', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '44%', left: '51%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{shadowColor}}', textAlign: 'center', opacity: 0.3, filter: 'blur(4px)' }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, rotateX: 80, y: 60 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, rotateX: -40 }, easing: 'cubicIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{textColor}}', textAlign: 'center', letterSpacing: 6 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, rotateX: 80, y: 50 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, rotateX: -40, y: -30 }, easing: 'cubicIn' } } },
      { id: 'floor-line', type: 'rect', style: { position: 'absolute', top: '60%', left: '20%', width: '60%', height: 1, backgroundColor: '{{shadowColor}}', opacity: 0.4 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'perspective-grid', type: 'rect', style: { position: 'absolute', top: '62%', left: '30%', width: '40%', height: 1, backgroundColor: '{{shadowColor}}', opacity: 0.2 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ016: BundledTemplate = {
  id: 'typ-letter-scatter',
  title: 'Letter Scatter',
  description: 'Letters scatter in from random positions and assemble into a word.',
  category: 'kinetic-typography',
  tags: ['letter', 'scatter', 'assemble', 'playful'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'CHAOS', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
  defaultConfig: { mainText: 'CHAOS', bgColor: '#18181b', textColor: '#fbbf24' },
  motionDesignDescription: {
    name: 'Letter Scatter',
    description: 'Letters scatter in and assemble.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.6,
    exitDuration: 0.2,
    elements: [
      { id: 'letter-1', type: 'text', text: 'C', style: { position: 'absolute', top: '44%', left: '28%', fontSize: 72, fontWeight: 900, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -100, y: -80, rotate: -45 }, easing: 'backOut' }, exit: { to: { opacity: 0, x: -60, rotate: -30 }, easing: 'cubicIn' } } },
      { id: 'letter-2', type: 'text', text: 'H', style: { position: 'absolute', top: '44%', left: '36%', fontSize: 72, fontWeight: 900, color: '{{textColor}}' }, animation: { enterDelay: 0.06, enter: { from: { opacity: 0, x: 50, y: -120, rotate: 30 }, easing: 'backOut' }, exit: { to: { opacity: 0, y: -60, rotate: 20 }, easing: 'cubicIn' } } },
      { id: 'letter-3', type: 'text', text: 'A', style: { position: 'absolute', top: '44%', left: '44%', fontSize: 72, fontWeight: 900, color: '{{textColor}}' }, animation: { enterDelay: 0.12, enter: { from: { opacity: 0, x: -30, y: 100, rotate: 60 }, easing: 'backOut' }, exit: { to: { opacity: 0, y: 60 }, easing: 'cubicIn' } } },
      { id: 'letter-4', type: 'text', text: 'O', style: { position: 'absolute', top: '44%', left: '53%', fontSize: 72, fontWeight: 900, color: '{{textColor}}' }, animation: { enterDelay: 0.18, enter: { from: { opacity: 0, x: 80, y: 60, rotate: -60 }, easing: 'backOut' }, exit: { to: { opacity: 0, x: 60, rotate: -30 }, easing: 'cubicIn' } } },
      { id: 'letter-5', type: 'text', text: 'S', style: { position: 'absolute', top: '44%', left: '62%', fontSize: 72, fontWeight: 900, color: '{{textColor}}' }, animation: { enterDelay: 0.24, enter: { from: { opacity: 0, x: 100, y: -40, rotate: 45 }, easing: 'backOut' }, exit: { to: { opacity: 0, x: 80, rotate: 30 }, easing: 'cubicIn' } } },
    ],
  },
}

const typ017: BundledTemplate = {
  id: 'typ-word-stack',
  title: 'Word Stack',
  description: 'Words stack vertically with offset alignment for a poster look.',
  category: 'kinetic-typography',
  tags: ['stack', 'poster', 'editorial', 'layout'],
  featured: false,
  configSchema: [
    { key: 'word1', label: 'Word 1', type: 'text', defaultValue: 'THINK', group: 'Content' },
    { key: 'word2', label: 'Word 2', type: 'text', defaultValue: 'DIFFERENT', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f7f7f7', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ff4444', group: 'Style' },
  ],
  defaultConfig: { word1: 'THINK', word2: 'DIFFERENT', bgColor: '#f7f7f7', textColor: '#111111', accentColor: '#ff4444' },
  motionDesignDescription: {
    name: 'Word Stack',
    description: 'Vertically stacked words with offset alignment.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'word-1', type: 'text', text: '{{word1}}', style: { position: 'absolute', top: '35%', left: '12%', fontSize: 72, fontWeight: 900, color: '{{textColor}}', letterSpacing: 4 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: 40 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -30 }, easing: 'cubicIn' } } },
      { id: 'word-2', type: 'text', text: '{{word2}}', style: { position: 'absolute', top: '50%', left: '20%', fontSize: 72, fontWeight: 900, color: '{{accentColor}}', letterSpacing: 4 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 40 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -30 }, easing: 'cubicIn' } } },
      { id: 'dot', type: 'circle', style: { position: 'absolute', top: '67%', left: '22%', width: 12, height: 12, backgroundColor: '{{accentColor}}', borderRadius: 6 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ018: BundledTemplate = {
  id: 'typ-kinetic-quote',
  title: 'Kinetic Quote',
  description: 'Elegant quote with animated quotation marks and attribution.',
  category: 'kinetic-typography',
  tags: ['quote', 'elegant', 'wisdom', 'attribution'],
  featured: true,
  configSchema: [
    { key: 'quoteText', label: 'Quote', type: 'text', defaultValue: 'Design is intelligence made visible.', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: '— Alina Wheeler', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1917', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#d97706', group: 'Style' },
  ],
  defaultConfig: { quoteText: 'Design is intelligence made visible.', author: '— Alina Wheeler', bgColor: '#1c1917', textColor: '#fafaf9', accentColor: '#d97706' },
  motionDesignDescription: {
    name: 'Kinetic Quote',
    description: 'Elegant animated quote with attribution.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.6,
    exitDuration: 0.25,
    elements: [
      { id: 'quote-mark', type: 'text', text: '"', style: { position: 'absolute', top: '28%', left: '12%', fontSize: 120, fontWeight: 700, color: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -30, scale: 0.5 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'quote-text', type: 'text', text: '{{quoteText}}', style: { position: 'absolute', top: '40%', left: '15%', width: '70%', fontSize: 32, fontWeight: 300, color: '{{textColor}}', lineHeight: 1.5, fontStyle: 'italic' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 20 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, y: -15 }, easing: 'cubicIn' } } },
      { id: 'author', type: 'text', text: '{{author}}', style: { position: 'absolute', top: '65%', left: '15%', fontSize: 18, fontWeight: 500, color: '{{accentColor}}', letterSpacing: 2 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, x: -20 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'divider', type: 'rect', style: { position: 'absolute', top: '63%', left: '15%', width: 40, height: 2, backgroundColor: '{{accentColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ019: BundledTemplate = {
  id: 'typ-particle-text',
  title: 'Particle Burst Text',
  description: 'Text appears surrounded by particle-like decorative dots.',
  category: 'kinetic-typography',
  tags: ['particle', 'dots', 'explosion', 'celebration'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'PARTY', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f1f5f9', group: 'Style' },
    { key: 'particleColor', label: 'Particle Color', type: 'color', defaultValue: '#38bdf8', group: 'Style' },
  ],
  defaultConfig: { mainText: 'PARTY', bgColor: '#0f172a', textColor: '#f1f5f9', particleColor: '#38bdf8' },
  motionDesignDescription: {
    name: 'Particle Burst Text',
    description: 'Text with surrounding particle dots.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'p1', type: 'circle', style: { position: 'absolute', top: '30%', left: '25%', width: 6, height: 6, backgroundColor: '{{particleColor}}', borderRadius: 3 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0, x: 40, y: 30 }, easing: 'cubicOut' }, hold: { effect: 'float', amplitude: 5, speed: 2 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'p2', type: 'circle', style: { position: 'absolute', top: '35%', right: '20%', width: 8, height: 8, backgroundColor: '{{particleColor}}', borderRadius: 4, opacity: 0.7 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0, x: -30, y: 20 }, easing: 'cubicOut' }, hold: { effect: 'float', amplitude: 7, speed: 1.5 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'p3', type: 'circle', style: { position: 'absolute', top: '60%', left: '30%', width: 5, height: 5, backgroundColor: '{{particleColor}}', borderRadius: 3, opacity: 0.5 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0, x: 20, y: -30 }, easing: 'cubicOut' }, hold: { effect: 'float', amplitude: 6, speed: 2.5 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'p4', type: 'circle', style: { position: 'absolute', top: '55%', right: '25%', width: 4, height: 4, backgroundColor: '{{particleColor}}', borderRadius: 2, opacity: 0.6 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scale: 0, x: -20, y: -20 }, easing: 'cubicOut' }, hold: { effect: 'float', amplitude: 4, speed: 3 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 68, fontWeight: 900, color: '{{textColor}}', textAlign: 'center', letterSpacing: 8 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.8 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 1.2 }, easing: 'cubicIn' } } },
    ],
  },
}

const typ020: BundledTemplate = {
  id: 'typ-elastic-pop',
  title: 'Elastic Pop',
  description: 'Text pops in with a springy elastic overshoot.',
  category: 'kinetic-typography',
  tags: ['elastic', 'spring', 'pop', 'bouncy'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'POP!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fef3c7', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#92400e', group: 'Style' },
    { key: 'shadowColor', label: 'Shadow', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
  defaultConfig: { mainText: 'POP!', bgColor: '#fef3c7', textColor: '#92400e', shadowColor: '#f59e0b' },
  motionDesignDescription: {
    name: 'Elastic Pop',
    description: 'Springy elastic pop entrance.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.45,
    exitDuration: 0.15,
    elements: [
      { id: 'bg-circle', type: 'circle', style: { position: 'absolute', top: '32%', left: '30%', width: '40%', height: '36%', backgroundColor: '{{shadowColor}}', borderRadius: '50%', opacity: 0.15 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'cubicIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 80, fontWeight: 900, color: '{{textColor}}', textAlign: 'center' }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'backIn' } } },
      { id: 'sparkle-1', type: 'text', text: '✧', style: { position: 'absolute', top: '34%', right: '28%', fontSize: 24, color: '{{shadowColor}}' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0, rotate: -45 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'sparkle-2', type: 'text', text: '✧', style: { position: 'absolute', top: '55%', left: '28%', fontSize: 18, color: '{{shadowColor}}', opacity: 0.6 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scale: 0, rotate: 45 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ021: BundledTemplate = {
  id: 'typ-cinema-title',
  title: 'Cinema Title',
  description: 'Movie-poster style title with thin horizontal rules.',
  category: 'kinetic-typography',
  tags: ['cinema', 'movie', 'title', 'dramatic'],
  featured: true,
  configSchema: [
    { key: 'mainText', label: 'Title', type: 'text', defaultValue: 'THE FILM', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'A MOTION PICTURE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d4af37', group: 'Style' },
  ],
  defaultConfig: { mainText: 'THE FILM', subtitle: 'A MOTION PICTURE', bgColor: '#000000', textColor: '#d4af37' },
  motionDesignDescription: {
    name: 'Cinema Title', description: 'Movie-poster title card.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.7, exitDuration: 0.3,
    elements: [
      { id: 'top-rule', type: 'rect', style: { position: 'absolute', top: '36%', left: '20%', width: '60%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.5 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 300, color: '{{textColor}}', textAlign: 'center', letterSpacing: 16, textTransform: 'uppercase' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, letterSpacing: 40 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'cubicIn' } } },
      { id: 'bottom-rule', type: 'rect', style: { position: 'absolute', top: '54%', left: '20%', width: '60%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.5 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'subtitle', type: 'text', text: '{{subtitle}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 400, color: '{{textColor}}', textAlign: 'center', letterSpacing: 8, opacity: 0.6 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ022: BundledTemplate = {
  id: 'typ-countdown-reveal',
  title: 'Countdown Reveal',
  description: 'Numbers count down before revealing the main text.',
  category: 'kinetic-typography',
  tags: ['countdown', 'numbers', 'reveal', 'suspense'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Reveal Text', type: 'text', defaultValue: 'GO!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c0c', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#555555', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#00e676', group: 'Style' },
  ],
  defaultConfig: { mainText: 'GO!', bgColor: '#0c0c0c', numberColor: '#555555', textColor: '#00e676' },
  motionDesignDescription: {
    name: 'Countdown Reveal', description: 'Countdown numbers before text reveal.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.8, exitDuration: 0.15,
    elements: [
      { id: 'num-3', type: 'text', text: '3', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 120, fontWeight: 900, color: '{{numberColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 2 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scale: 0.5 }, easing: 'cubicIn' } } },
      { id: 'num-2', type: 'text', text: '2', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 120, fontWeight: 900, color: '{{numberColor}}', textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scale: 2 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scale: 0.5 }, easing: 'cubicIn' } } },
      { id: 'num-1', type: 'text', text: '1', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 120, fontWeight: 900, color: '{{numberColor}}', textAlign: 'center' }, animation: { enterDelay: 0.5, enter: { from: { opacity: 0, scale: 2 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scale: 0.5 }, easing: 'cubicIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 96, fontWeight: 900, color: '{{textColor}}', textAlign: 'center' }, animation: { enterDelay: 0.7, enter: { from: { opacity: 0, scale: 0.2 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ023: BundledTemplate = {
  id: 'typ-strikethrough',
  title: 'Strikethrough Replace',
  description: 'Old text gets struck through as new text appears below.',
  category: 'kinetic-typography',
  tags: ['strikethrough', 'replace', 'correction', 'clever'],
  featured: false,
  configSchema: [
    { key: 'oldText', label: 'Old Text', type: 'text', defaultValue: 'ordinary', group: 'Content' },
    { key: 'newText', label: 'New Text', type: 'text', defaultValue: 'EXTRAORDINARY', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fafafa', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#999999', group: 'Style' },
    { key: 'newColor', label: 'New Text Color', type: 'color', defaultValue: '#e11d48', group: 'Style' },
  ],
  defaultConfig: { oldText: 'ordinary', newText: 'EXTRAORDINARY', bgColor: '#fafafa', textColor: '#999999', newColor: '#e11d48' },
  motionDesignDescription: {
    name: 'Strikethrough Replace', description: 'Strike old text, reveal new.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'old-text', type: 'text', text: '{{oldText}}', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 400, color: '{{textColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'strike-line', type: 'rect', style: { position: 'absolute', top: '42%', left: '30%', width: '40%', height: 2, backgroundColor: '{{newColor}}' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'new-text', type: 'text', text: '{{newText}}', style: { position: 'absolute', top: '50%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 900, color: '{{newColor}}', textAlign: 'center', letterSpacing: 4 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, y: 20, scale: 0.9 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'cubicIn' } } },
    ],
  },
}

const typ024: BundledTemplate = {
  id: 'typ-spotlight-focus',
  title: 'Spotlight Focus',
  description: 'Text emerges from darkness with a circular spotlight effect.',
  category: 'kinetic-typography',
  tags: ['spotlight', 'focus', 'dramatic', 'dark'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'FOCUS', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'spotColor', label: 'Spotlight', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
  defaultConfig: { mainText: 'FOCUS', bgColor: '#000000', textColor: '#ffffff', spotColor: '#fbbf24' },
  motionDesignDescription: {
    name: 'Spotlight Focus', description: 'Spotlight illuminates text from darkness.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'spot-glow', type: 'circle', style: { position: 'absolute', top: '30%', left: '30%', width: '40%', height: '40%', backgroundColor: '{{spotColor}}', borderRadius: '50%', opacity: 0.08, filter: 'blur(50px)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.3 }, easing: 'cubicOut' }, hold: { effect: 'pulse', amplitude: 0.03, speed: 1 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 800, color: '{{textColor}}', textAlign: 'center', letterSpacing: 8 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'cubicIn' } } },
      { id: 'spot-ring', type: 'circle', style: { position: 'absolute', top: '28%', left: '28%', width: '44%', height: '44%', border: '1px solid {{spotColor}}', borderRadius: '50%', opacity: 0.15 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scale: 1.3 }, easing: 'easeIn' } } },
    ],
  },
}

const typ025: BundledTemplate = {
  id: 'typ-brush-stroke',
  title: 'Brush Stroke',
  description: 'Text revealed by an animated brush stroke wipe.',
  category: 'kinetic-typography',
  tags: ['brush', 'paint', 'artistic', 'creative'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'CREATE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#eaeaea', group: 'Style' },
    { key: 'brushColor', label: 'Brush Color', type: 'color', defaultValue: '#e94560', group: 'Style' },
  ],
  defaultConfig: { mainText: 'CREATE', bgColor: '#1a1a2e', textColor: '#eaeaea', brushColor: '#e94560' },
  motionDesignDescription: {
    name: 'Brush Stroke', description: 'Brush stroke wipe text reveal.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'brush-bg', type: 'rect', style: { position: 'absolute', top: '40%', left: '15%', width: '70%', height: '20%', backgroundColor: '{{brushColor}}', borderRadius: 4, transform: 'rotate(-1deg)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, scaleX: 0 }, easing: 'cubicIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '43%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 800, color: '{{textColor}}', textAlign: 'center', letterSpacing: 6 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'splatter-1', type: 'circle', style: { position: 'absolute', top: '38%', right: '18%', width: 8, height: 8, backgroundColor: '{{brushColor}}', borderRadius: 4 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'splatter-2', type: 'circle', style: { position: 'absolute', top: '58%', left: '20%', width: 6, height: 6, backgroundColor: '{{brushColor}}', borderRadius: 3 }, animation: { enterDelay: 0.22, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ026: BundledTemplate = {
  id: 'typ-pastel-soft',
  title: 'Pastel Soft',
  description: 'Soft pastel colored text with gentle floating entrance.',
  category: 'kinetic-typography',
  tags: ['pastel', 'soft', 'gentle', 'feminine'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'gentle', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fdf2f8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#be185d', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#f9a8d4', group: 'Style' },
  ],
  defaultConfig: { mainText: 'gentle', bgColor: '#fdf2f8', textColor: '#be185d', accentColor: '#f9a8d4' },
  motionDesignDescription: {
    name: 'Pastel Soft', description: 'Soft pastel gentle float.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.7, exitDuration: 0.3,
    elements: [
      { id: 'bg-blob', type: 'circle', style: { position: 'absolute', top: '35%', left: '35%', width: '30%', height: '30%', backgroundColor: '{{accentColor}}', borderRadius: '50%', opacity: 0.2, filter: 'blur(30px)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'cubicOut' }, hold: { effect: 'float', amplitude: 5, speed: 0.8 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '44%', left: '50%', transform: 'translateX(-50%)', fontSize: 52, fontWeight: 300, color: '{{textColor}}', textAlign: 'center', fontStyle: 'italic' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 25 }, easing: 'cubicOut' }, hold: { effect: 'float', amplitude: 3, speed: 1 }, exit: { to: { opacity: 0, y: -15 }, easing: 'cubicIn' } } },
      { id: 'petal-1', type: 'circle', style: { position: 'absolute', top: '36%', right: '30%', width: 12, height: 12, backgroundColor: '{{accentColor}}', borderRadius: 6, opacity: 0.4 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: -15 }, easing: 'cubicOut' }, hold: { effect: 'float', amplitude: 4, speed: 1.2 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ027: BundledTemplate = {
  id: 'typ-corporate-clean',
  title: 'Corporate Clean',
  description: 'Professional corporate-style text with structured layout.',
  category: 'kinetic-typography',
  tags: ['corporate', 'professional', 'business', 'clean'],
  featured: false,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'QUARTERLY REPORT', group: 'Content' },
    { key: 'subheading', label: 'Subheading', type: 'text', defaultValue: 'Q4 2024 Results', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f8fafc', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#2563eb', group: 'Style' },
  ],
  defaultConfig: { heading: 'QUARTERLY REPORT', subheading: 'Q4 2024 Results', bgColor: '#f8fafc', textColor: '#0f172a', accentColor: '#2563eb' },
  motionDesignDescription: {
    name: 'Corporate Clean', description: 'Professional structured text.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'accent-bar', type: 'rect', style: { position: 'absolute', top: '35%', left: '12%', width: 4, height: 60, backgroundColor: '{{accentColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleY: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'heading', type: 'text', text: '{{heading}}', style: { position: 'absolute', top: '36%', left: '16%', fontSize: 36, fontWeight: 700, color: '{{textColor}}', letterSpacing: 2 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: -30 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 30 }, easing: 'cubicIn' } } },
      { id: 'subheading', type: 'text', text: '{{subheading}}', style: { position: 'absolute', top: '48%', left: '16%', fontSize: 20, fontWeight: 400, color: '{{accentColor}}' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, x: -20 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bottom-line', type: 'rect', style: { position: 'absolute', top: '58%', left: '16%', width: '50%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.1 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ028: BundledTemplate = {
  id: 'typ-shake-impact',
  title: 'Shake Impact',
  description: 'Text arrives with a heavy shake and screen-rattle feel.',
  category: 'kinetic-typography',
  tags: ['shake', 'impact', 'heavy', 'earthquake'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'SHAKE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { mainText: 'SHAKE', bgColor: '#1a1a1a', textColor: '#ef4444' },
  motionDesignDescription: {
    name: 'Shake Impact', description: 'Heavy shake impact entrance.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.3, exitDuration: 0.15,
    elements: [
      { id: 'main-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 84, fontWeight: 900, color: '{{textColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -150 }, easing: 'bounceOut' }, hold: { effect: 'shake', amplitude: 3, speed: 8 }, exit: { to: { opacity: 0, y: 80 }, easing: 'cubicIn' } } },
      { id: 'crack-left', type: 'rect', style: { position: 'absolute', top: '52%', left: '20%', width: 30, height: 2, backgroundColor: '{{textColor}}', opacity: 0.4, transform: 'rotate(-20deg)' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'crack-right', type: 'rect', style: { position: 'absolute', top: '52%', right: '20%', width: 30, height: 2, backgroundColor: '{{textColor}}', opacity: 0.4, transform: 'rotate(20deg)' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ029: BundledTemplate = {
  id: 'typ-outline-fill',
  title: 'Outline to Fill',
  description: 'Text starts as outline then fills in with color.',
  category: 'kinetic-typography',
  tags: ['outline', 'fill', 'transition', 'stylish'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'FILL ME', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'outlineColor', label: 'Outline', type: 'color', defaultValue: '#6366f1', group: 'Style' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#818cf8', group: 'Style' },
  ],
  defaultConfig: { mainText: 'FILL ME', bgColor: '#0a0a0a', outlineColor: '#6366f1', fillColor: '#818cf8' },
  motionDesignDescription: {
    name: 'Outline to Fill', description: 'Outline text fills with color.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'outline-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 900, color: 'transparent', textAlign: 'center', WebkitTextStroke: '2px {{outlineColor}}', letterSpacing: 4 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.8 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'fill-text', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 900, color: '{{fillColor}}', textAlign: 'center', letterSpacing: 4, clipPath: 'inset(0 0 100% 0)' }, animation: { enterDelay: 0.25, enter: { from: { clipPath: 'inset(0 0 100% 0)' }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'accent-dot', type: 'circle', style: { position: 'absolute', top: '38%', right: '22%', width: 8, height: 8, backgroundColor: '{{outlineColor}}', borderRadius: 4 }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const typ030: BundledTemplate = {
  id: 'typ-double-exposure',
  title: 'Double Exposure',
  description: 'Layered text creates a double-exposure typographic effect.',
  category: 'kinetic-typography',
  tags: ['double-exposure', 'layered', 'artistic', 'overlay'],
  featured: false,
  configSchema: [
    { key: 'mainText', label: 'Text', type: 'text', defaultValue: 'DOUBLE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1e2e', group: 'Style' },
    { key: 'layer1Color', label: 'Layer 1', type: 'color', defaultValue: '#cba6f7', group: 'Style' },
    { key: 'layer2Color', label: 'Layer 2', type: 'color', defaultValue: '#89b4fa', group: 'Style' },
  ],
  defaultConfig: { mainText: 'DOUBLE', bgColor: '#1e1e2e', layer1Color: '#cba6f7', layer2Color: '#89b4fa' },
  motionDesignDescription: {
    name: 'Double Exposure', description: 'Layered double-exposure text.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'layer-back', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '40%', left: '48%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{layer2Color}}', textAlign: 'center', opacity: 0.4 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -20, y: 10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: -15 }, easing: 'cubicIn' } } },
      { id: 'layer-front', type: 'text', text: '{{mainText}}', style: { position: 'absolute', top: '42%', left: '52%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{layer1Color}}', textAlign: 'center', opacity: 0.8 }, animation: { enterDelay: 0.08, enter: { from: { opacity: 0, x: 20, y: -10 }, easing: 'cubicOut' }, exit: { to: { opacity: 0, x: 15 }, easing: 'cubicIn' } } },
      { id: 'blend-line', type: 'rect', style: { position: 'absolute', top: '58%', left: '30%', width: '40%', height: 2, backgroundColor: '{{layer1Color}}', opacity: 0.3 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'cubicOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}
