import type { BundledTemplate } from '../templates'

// ---------------------------------------------------------------------------
// INFOGRAPHIC TEMPLATES (100 templates: inf001 – inf100)
// ---------------------------------------------------------------------------

const inf001: BundledTemplate = {
  id: 'inf-fact-card-bold',
  title: 'Bold Fact Card',
  description: 'Eye-catching fact card with large number and supporting text.',
  category: 'infographic',
  tags: ['fact', 'number', 'bold', 'statistic'],
  featured: true,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'DID YOU KNOW?', group: 'Content' },
    { key: 'fact', label: 'Fact Text', type: 'text', defaultValue: '73% of users prefer short-form video', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
  ],
  defaultConfig: { heading: 'DID YOU KNOW?', fact: '73% of users prefer short-form video', bgColor: '#0f172a', accentColor: '#3b82f6' },
  motionDesignDescription: {
    name: 'Bold Fact Card',
    description: 'Eye-catching fact card with large number and supporting text.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'accent-bar', type: 'rect', style: { position: 'absolute', top: '15%', left: '10%', width: 60, height: 4, backgroundColor: '{{accentColor}}', borderRadius: 2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0, scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'heading', type: 'text', text: '{{heading}}', style: { position: 'absolute', top: '18%', left: '10%', fontSize: 16, fontWeight: 700, color: '{{accentColor}}', letterSpacing: 3, textTransform: 'uppercase' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0, y: -10 }, easing: 'easeIn' } } },
      { id: 'fact-text', type: 'text', text: '{{fact}}', style: { position: 'absolute', top: '30%', left: '10%', width: '80%', fontSize: 32, fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 30 }, easing: 'easeOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1.5 }, exit: { to: { opacity: 0, y: 20 }, easing: 'easeIn' } } },
      { id: 'bottom-line', type: 'rect', style: { position: 'absolute', bottom: '15%', left: '10%', width: '80%', height: 2, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf002: BundledTemplate = {
  id: 'inf-step-process-3',
  title: '3-Step Process',
  description: 'Clean three-step process flow with numbered circles.',
  category: 'infographic',
  tags: ['steps', 'process', 'how-to', 'sequential'],
  featured: true,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'HOW IT WORKS', group: 'Content' },
    { key: 'step1', label: 'Step 1', type: 'text', defaultValue: 'Sign Up', group: 'Content' },
    { key: 'step2', label: 'Step 2', type: 'text', defaultValue: 'Customize', group: 'Content' },
    { key: 'step3', label: 'Step 3', type: 'text', defaultValue: 'Launch', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#10b981', group: 'Style' },
  ],
  defaultConfig: { title: 'HOW IT WORKS', step1: 'Sign Up', step2: 'Customize', step3: 'Launch', accentColor: '#10b981' },
  motionDesignDescription: {
    name: '3-Step Process',
    description: 'Three-step process with staggered reveal.',
    background: '#ffffff',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: 2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'step1-circle', type: 'circle', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, backgroundColor: '{{accentColor}}', borderRadius: 20 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'step1-text', type: 'text', text: '1. {{step1}}', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', marginTop: 50, fontSize: 18, fontWeight: 600, color: '#334155', textAlign: 'center' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'step2-text', type: 'text', text: '2. {{step2}}', style: { position: 'absolute', top: '48%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 600, color: '#334155', textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'step3-text', type: 'text', text: '3. {{step3}}', style: { position: 'absolute', top: '62%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 600, color: '#334155', textAlign: 'center' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf003: BundledTemplate = {
  id: 'inf-comparison-vs',
  title: 'VS Comparison',
  description: 'Side-by-side comparison layout with bold VS divider.',
  category: 'infographic',
  tags: ['comparison', 'vs', 'versus', 'side-by-side'],
  featured: true,
  configSchema: [
    { key: 'leftLabel', label: 'Left Label', type: 'text', defaultValue: 'Option A', group: 'Content' },
    { key: 'rightLabel', label: 'Right Label', type: 'text', defaultValue: 'Option B', group: 'Content' },
    { key: 'leftColor', label: 'Left Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'rightColor', label: 'Right Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { leftLabel: 'Option A', rightLabel: 'Option B', leftColor: '#3b82f6', rightColor: '#ef4444' },
  motionDesignDescription: {
    name: 'VS Comparison',
    description: 'Side-by-side comparison with dramatic VS reveal.',
    background: '#0f172a',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'left-panel', type: 'rect', style: { position: 'absolute', top: '15%', left: '5%', width: '40%', height: '70%', backgroundColor: '{{leftColor}}', borderRadius: 12, opacity: 0.15 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -60 }, easing: 'easeOut' }, exit: { to: { opacity: 0, x: -30 }, easing: 'easeIn' } } },
      { id: 'left-label', type: 'text', text: '{{leftLabel}}', style: { position: 'absolute', top: '45%', left: '25%', transform: 'translate(-50%,-50%)', fontSize: 28, fontWeight: 800, color: '{{leftColor}}', textAlign: 'center' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'vs-badge', type: 'text', text: 'VS', style: { position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 36, fontWeight: 900, color: '#fbbf24', textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scale: 2.5 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.05, speed: 2 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'right-panel', type: 'rect', style: { position: 'absolute', top: '15%', right: '5%', width: '40%', height: '70%', backgroundColor: '{{rightColor}}', borderRadius: 12, opacity: 0.15 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: 60 }, easing: 'easeOut' }, exit: { to: { opacity: 0, x: 30 }, easing: 'easeIn' } } },
      { id: 'right-label', type: 'text', text: '{{rightLabel}}', style: { position: 'absolute', top: '45%', left: '75%', transform: 'translate(-50%,-50%)', fontSize: 28, fontWeight: 800, color: '{{rightColor}}', textAlign: 'center' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf004: BundledTemplate = {
  id: 'inf-bullet-list-reveal',
  title: 'Bullet List Reveal',
  description: 'Animated bullet points that slide in one by one.',
  category: 'infographic',
  tags: ['list', 'bullets', 'points', 'reveal'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Key Takeaways', group: 'Content' },
    { key: 'item1', label: 'Item 1', type: 'text', defaultValue: 'Simple and effective', group: 'Content' },
    { key: 'item2', label: 'Item 2', type: 'text', defaultValue: 'Easy to customize', group: 'Content' },
    { key: 'item3', label: 'Item 3', type: 'text', defaultValue: 'Works everywhere', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
  defaultConfig: { title: 'Key Takeaways', item1: 'Simple and effective', item2: 'Easy to customize', item3: 'Works everywhere', accentColor: '#6366f1' },
  motionDesignDescription: {
    name: 'Bullet List Reveal',
    description: 'Staggered bullet list with accent dots.',
    background: '#fafafa',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '12%', left: '10%', fontSize: 26, fontWeight: 800, color: '#1e293b' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'dot1', type: 'circle', style: { position: 'absolute', top: '30%', left: '10%', width: 10, height: 10, backgroundColor: '{{accentColor}}', borderRadius: 5 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item1', type: 'text', text: '{{item1}}', style: { position: 'absolute', top: '28.5%', left: '16%', fontSize: 20, fontWeight: 500, color: '#334155' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -30 }, easing: 'easeOut' }, exit: { to: { opacity: 0, x: -15 }, easing: 'easeIn' } } },
      { id: 'item2', type: 'text', text: '{{item2}}', style: { position: 'absolute', top: '42%', left: '16%', fontSize: 20, fontWeight: 500, color: '#334155' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, x: -30 }, easing: 'easeOut' }, exit: { to: { opacity: 0, x: -15 }, easing: 'easeIn' } } },
      { id: 'item3', type: 'text', text: '{{item3}}', style: { position: 'absolute', top: '55.5%', left: '16%', fontSize: 20, fontWeight: 500, color: '#334155' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, x: -30 }, easing: 'easeOut' }, exit: { to: { opacity: 0, x: -15 }, easing: 'easeIn' } } },
    ],
  },
}

const inf005: BundledTemplate = {
  id: 'inf-icon-text-combo',
  title: 'Icon + Text Card',
  description: 'Large icon area with supporting heading and body text.',
  category: 'infographic',
  tags: ['icon', 'text', 'card', 'clean'],
  featured: false,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Lightning Fast', group: 'Content' },
    { key: 'body', label: 'Body', type: 'text', defaultValue: 'Our engine processes in under 2 seconds.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f0fdf4', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
  defaultConfig: { heading: 'Lightning Fast', body: 'Our engine processes in under 2 seconds.', bgColor: '#f0fdf4', accentColor: '#22c55e' },
  motionDesignDescription: {
    name: 'Icon + Text Card',
    description: 'Icon placeholder with heading and body.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'icon-circle', type: 'circle', style: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, backgroundColor: '{{accentColor}}', borderRadius: 40, opacity: 0.2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'icon-inner', type: 'circle', style: { position: 'absolute', top: '23%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, backgroundColor: '{{accentColor}}', borderRadius: 20 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'heading', type: 'text', text: '{{heading}}', style: { position: 'absolute', top: '48%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 800, color: '#1e293b', textAlign: 'center' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0, y: 10 }, easing: 'easeIn' } } },
      { id: 'body', type: 'text', text: '{{body}}', style: { position: 'absolute', top: '60%', left: '15%', width: '70%', fontSize: 16, fontWeight: 400, color: '#64748b', textAlign: 'center', lineHeight: 1.5 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf006: BundledTemplate = {
  id: 'inf-tip-card',
  title: 'Quick Tip Card',
  description: 'Bright tip card with lightbulb accent and tip text.',
  category: 'infographic',
  tags: ['tip', 'advice', 'hint', 'lightbulb'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'PRO TIP', group: 'Content' },
    { key: 'tip', label: 'Tip Text', type: 'text', defaultValue: 'Always save your work before exporting.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fffbeb', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
  defaultConfig: { label: 'PRO TIP', tip: 'Always save your work before exporting.', bgColor: '#fffbeb', accentColor: '#f59e0b' },
  motionDesignDescription: {
    name: 'Quick Tip Card',
    description: 'Tip card with accent badge.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'bulb-circle', type: 'circle', style: { position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', width: 60, height: 60, backgroundColor: '{{accentColor}}', borderRadius: 30 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0, rotate: -45 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.04, speed: 1.5 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 700, color: '{{accentColor}}', letterSpacing: 3 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'tip-text', type: 'text', text: '{{tip}}', style: { position: 'absolute', top: '50%', left: '12%', width: '76%', fontSize: 24, fontWeight: 600, color: '#78350f', textAlign: 'center', lineHeight: 1.4 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 25 }, easing: 'easeOut' }, exit: { to: { opacity: 0, y: 15 }, easing: 'easeIn' } } },
    ],
  },
}

const inf007: BundledTemplate = {
  id: 'inf-how-to-sequence',
  title: 'How-To Sequence',
  description: 'Step-by-step how-to with numbered instructions.',
  category: 'infographic',
  tags: ['how-to', 'tutorial', 'instructions', 'guide'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'How To Get Started', group: 'Content' },
    { key: 'step1', label: 'Step 1', type: 'text', defaultValue: 'Download the app', group: 'Content' },
    { key: 'step2', label: 'Step 2', type: 'text', defaultValue: 'Create your account', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#8b5cf6', group: 'Style' },
  ],
  defaultConfig: { title: 'How To Get Started', step1: 'Download the app', step2: 'Create your account', accentColor: '#8b5cf6' },
  motionDesignDescription: {
    name: 'How-To Sequence',
    description: 'Step-by-step numbered tutorial card.',
    background: '#faf5ff',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 800, color: '#581c87', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -25 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'divider', type: 'rect', style: { position: 'absolute', top: '24%', left: '30%', width: '40%', height: 2, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'num1', type: 'text', text: '01', style: { position: 'absolute', top: '32%', left: '10%', fontSize: 40, fontWeight: 900, color: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'step1', type: 'text', text: '{{step1}}', style: { position: 'absolute', top: '35%', left: '22%', fontSize: 20, fontWeight: 600, color: '#374151' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'num2', type: 'text', text: '02', style: { position: 'absolute', top: '50%', left: '10%', fontSize: 40, fontWeight: 900, color: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'step2', type: 'text', text: '{{step2}}', style: { position: 'absolute', top: '53%', left: '22%', fontSize: 20, fontWeight: 600, color: '#374151' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf008: BundledTemplate = {
  id: 'inf-pros-cons',
  title: 'Pros & Cons',
  description: 'Split layout showing pros on left, cons on right.',
  category: 'infographic',
  tags: ['pros', 'cons', 'comparison', 'decision'],
  featured: true,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Pros & Cons', group: 'Content' },
    { key: 'pro', label: 'Pro', type: 'text', defaultValue: 'Easy to learn', group: 'Content' },
    { key: 'con', label: 'Con', type: 'text', defaultValue: 'Limited advanced features', group: 'Content' },
    { key: 'proColor', label: 'Pro Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
    { key: 'conColor', label: 'Con Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { title: 'Pros & Cons', pro: 'Easy to learn', con: 'Limited advanced features', proColor: '#22c55e', conColor: '#ef4444' },
  motionDesignDescription: {
    name: 'Pros & Cons',
    description: 'Split pros and cons card.',
    background: '#ffffff',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 800, color: '#1e293b' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'pro-bg', type: 'rect', style: { position: 'absolute', top: '25%', left: '5%', width: '42%', height: '55%', backgroundColor: '{{proColor}}', borderRadius: 12, opacity: 0.1 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: -40 }, easing: 'easeOut' }, exit: { to: { opacity: 0, x: -20 }, easing: 'easeIn' } } },
      { id: 'pro-label', type: 'text', text: '✓ {{pro}}', style: { position: 'absolute', top: '42%', left: '8%', width: '36%', fontSize: 18, fontWeight: 600, color: '{{proColor}}' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'con-bg', type: 'rect', style: { position: 'absolute', top: '25%', right: '5%', width: '42%', height: '55%', backgroundColor: '{{conColor}}', borderRadius: 12, opacity: 0.1 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: 40 }, easing: 'easeOut' }, exit: { to: { opacity: 0, x: 20 }, easing: 'easeIn' } } },
      { id: 'con-label', type: 'text', text: '✗ {{con}}', style: { position: 'absolute', top: '42%', right: '8%', width: '36%', fontSize: 18, fontWeight: 600, color: '{{conColor}}' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, x: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf009: BundledTemplate = {
  id: 'inf-faq-reveal',
  title: 'FAQ Reveal',
  description: 'Question and answer reveal with expanding animation.',
  category: 'infographic',
  tags: ['faq', 'question', 'answer', 'reveal'],
  featured: false,
  configSchema: [
    { key: 'question', label: 'Question', type: 'text', defaultValue: 'How does it work?', group: 'Content' },
    { key: 'answer', label: 'Answer', type: 'text', defaultValue: 'Simply upload your content and our AI handles the rest.', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#0ea5e9', group: 'Style' },
  ],
  defaultConfig: { question: 'How does it work?', answer: 'Simply upload your content and our AI handles the rest.', accentColor: '#0ea5e9' },
  motionDesignDescription: {
    name: 'FAQ Reveal',
    description: 'Question appears then answer reveals below.',
    background: '#f0f9ff',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'q-mark', type: 'text', text: '?', style: { position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', fontSize: 60, fontWeight: 900, color: '{{accentColor}}', opacity: 0.2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 3, rotate: 15 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'question', type: 'text', text: '{{question}}', style: { position: 'absolute', top: '35%', left: '10%', width: '80%', fontSize: 26, fontWeight: 700, color: '#0c4a6e', textAlign: 'center' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0, y: -10 }, easing: 'easeIn' } } },
      { id: 'divider', type: 'rect', style: { position: 'absolute', top: '52%', left: '20%', width: '60%', height: 2, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'answer', type: 'text', text: '{{answer}}', style: { position: 'absolute', top: '58%', left: '10%', width: '80%', fontSize: 18, fontWeight: 400, color: '#475569', textAlign: 'center', lineHeight: 1.5 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, y: 25 }, easing: 'easeOut' }, exit: { to: { opacity: 0, y: 15 }, easing: 'easeIn' } } },
    ],
  },
}

const inf010: BundledTemplate = {
  id: 'inf-quick-stat',
  title: 'Quick Stat',
  description: 'Large centered statistic with label and accent underline.',
  category: 'infographic',
  tags: ['stat', 'number', 'metric', 'data'],
  featured: true,
  configSchema: [
    { key: 'stat', label: 'Statistic', type: 'text', defaultValue: '2.5M+', group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Active Users Worldwide', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#06b6d4', group: 'Style' },
  ],
  defaultConfig: { stat: '2.5M+', label: 'Active Users Worldwide', bgColor: '#0f172a', accentColor: '#06b6d4' },
  motionDesignDescription: {
    name: 'Quick Stat',
    description: 'Large stat number with label reveal.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'stat-number', type: 'text', text: '{{stat}}', style: { position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '{{accentColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.3, y: 30 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1 }, exit: { to: { opacity: 0, scale: 0.5 }, easing: 'easeIn' } } },
      { id: 'underline', type: 'rect', style: { position: 'absolute', top: '55%', left: '25%', width: '50%', height: 3, backgroundColor: '{{accentColor}}', borderRadius: 2 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '#94a3b8', textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf011: BundledTemplate = {
  id: 'inf-checklist',
  title: 'Animated Checklist',
  description: 'Checklist items that check off one by one.',
  category: 'infographic',
  tags: ['checklist', 'todo', 'tasks', 'check'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Before You Go', group: 'Content' },
    { key: 'item1', label: 'Item 1', type: 'text', defaultValue: 'Pack your bags', group: 'Content' },
    { key: 'item2', label: 'Item 2', type: 'text', defaultValue: 'Charge devices', group: 'Content' },
    { key: 'item3', label: 'Item 3', type: 'text', defaultValue: 'Check passport', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
  defaultConfig: { title: 'Before You Go', item1: 'Pack your bags', item2: 'Charge devices', item3: 'Check passport', accentColor: '#22c55e' },
  motionDesignDescription: {
    name: 'Animated Checklist', description: 'Checklist items with staggered check marks.', background: '#ffffff', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '10%', left: '10%', fontSize: 24, fontWeight: 800, color: '#1e293b' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'check1', type: 'text', text: '✓', style: { position: 'absolute', top: '28%', left: '10%', fontSize: 22, fontWeight: 700, color: '{{accentColor}}' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item1', type: 'text', text: '{{item1}}', style: { position: 'absolute', top: '28%', left: '18%', fontSize: 20, fontWeight: 500, color: '#334155' }, animation: { enterDelay: 0.18, enter: { from: { opacity: 0, x: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item2', type: 'text', text: '{{item2}}', style: { position: 'absolute', top: '42%', left: '18%', fontSize: 20, fontWeight: 500, color: '#334155' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, x: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item3', type: 'text', text: '{{item3}}', style: { position: 'absolute', top: '56%', left: '18%', fontSize: 20, fontWeight: 500, color: '#334155' }, animation: { enterDelay: 0.42, enter: { from: { opacity: 0, x: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf012: BundledTemplate = {
  id: 'inf-warning-alert',
  title: 'Warning Alert',
  description: 'Attention-grabbing warning card with bold alert styling.',
  category: 'infographic',
  tags: ['warning', 'alert', 'caution', 'danger'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'WARNING', group: 'Content' },
    { key: 'message', label: 'Message', type: 'text', defaultValue: 'Do not share your password with anyone.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fef2f2', group: 'Style' },
    { key: 'alertColor', label: 'Alert Color', type: 'color', defaultValue: '#dc2626', group: 'Style' },
  ],
  defaultConfig: { label: 'WARNING', message: 'Do not share your password with anyone.', bgColor: '#fef2f2', alertColor: '#dc2626' },
  motionDesignDescription: {
    name: 'Warning Alert', description: 'Bold warning card with pulsing accent.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'alert-bar', type: 'rect', style: { position: 'absolute', top: 0, left: 0, width: '100%', height: 6, backgroundColor: '{{alertColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'triangle', type: 'text', text: '⚠', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, color: '{{alertColor}}' }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.06, speed: 3 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '45%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 900, color: '{{alertColor}}', letterSpacing: 4 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'message', type: 'text', text: '{{message}}', style: { position: 'absolute', top: '58%', left: '10%', width: '80%', fontSize: 18, fontWeight: 500, color: '#991b1b', textAlign: 'center', lineHeight: 1.4 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf013: BundledTemplate = {
  id: 'inf-top5-list',
  title: 'Top 5 List',
  description: 'Countdown-style top 5 list with numbered items.',
  category: 'infographic',
  tags: ['top5', 'list', 'ranking', 'countdown'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Top 5 Tips', group: 'Content' },
    { key: 'item1', label: '#1', type: 'text', defaultValue: 'Be consistent', group: 'Content' },
    { key: 'item2', label: '#2', type: 'text', defaultValue: 'Stay focused', group: 'Content' },
    { key: 'item3', label: '#3', type: 'text', defaultValue: 'Learn daily', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
  defaultConfig: { title: 'Top 5 Tips', item1: 'Be consistent', item2: 'Stay focused', item3: 'Learn daily', accentColor: '#f59e0b' },
  motionDesignDescription: {
    name: 'Top 5 List', description: 'Ranked list with staggered number reveal.', background: '#0f172a', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: 2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'num1', type: 'text', text: '1', style: { position: 'absolute', top: '24%', left: '8%', fontSize: 28, fontWeight: 900, color: '{{accentColor}}' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item1', type: 'text', text: '{{item1}}', style: { position: 'absolute', top: '25%', left: '16%', fontSize: 18, fontWeight: 500, color: '#e2e8f0' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'num2', type: 'text', text: '2', style: { position: 'absolute', top: '38%', left: '8%', fontSize: 28, fontWeight: 900, color: '{{accentColor}}' }, animation: { enterDelay: 0.22, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item2', type: 'text', text: '{{item2}}', style: { position: 'absolute', top: '39%', left: '16%', fontSize: 18, fontWeight: 500, color: '#e2e8f0' }, animation: { enterDelay: 0.27, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item3', type: 'text', text: '{{item3}}', style: { position: 'absolute', top: '53%', left: '16%', fontSize: 18, fontWeight: 500, color: '#e2e8f0' }, animation: { enterDelay: 0.39, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf014: BundledTemplate = {
  id: 'inf-myth-vs-fact',
  title: 'Myth vs Fact',
  description: 'Debunk myths with a striking myth vs fact layout.',
  category: 'infographic',
  tags: ['myth', 'fact', 'debunk', 'truth'],
  featured: true,
  configSchema: [
    { key: 'myth', label: 'Myth', type: 'text', defaultValue: 'You need 8 glasses of water daily', group: 'Content' },
    { key: 'fact', label: 'Fact', type: 'text', defaultValue: 'Water needs vary by person and activity', group: 'Content' },
    { key: 'mythColor', label: 'Myth Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'factColor', label: 'Fact Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
  defaultConfig: { myth: 'You need 8 glasses of water daily', fact: 'Water needs vary by person and activity', mythColor: '#ef4444', factColor: '#22c55e' },
  motionDesignDescription: {
    name: 'Myth vs Fact', description: 'Myth crossed out then fact revealed.', background: '#1e293b', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'myth-label', type: 'text', text: 'MYTH', style: { position: 'absolute', top: '15%', left: '10%', fontSize: 14, fontWeight: 700, color: '{{mythColor}}', letterSpacing: 3 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'myth-text', type: 'text', text: '{{myth}}', style: { position: 'absolute', top: '22%', left: '10%', width: '80%', fontSize: 22, fontWeight: 600, color: '#94a3b8', textDecoration: 'line-through' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'strike', type: 'rect', style: { position: 'absolute', top: '32%', left: '10%', width: '80%', height: 2, backgroundColor: '{{mythColor}}' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'fact-label', type: 'text', text: 'FACT', style: { position: 'absolute', top: '45%', left: '10%', fontSize: 14, fontWeight: 700, color: '{{factColor}}', letterSpacing: 3 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'fact-text', type: 'text', text: '{{fact}}', style: { position: 'absolute', top: '52%', left: '10%', width: '80%', fontSize: 24, fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 20 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf015: BundledTemplate = {
  id: 'inf-before-after',
  title: 'Before & After',
  description: 'Dramatic before/after comparison reveal.',
  category: 'infographic',
  tags: ['before', 'after', 'transformation', 'comparison'],
  featured: false,
  configSchema: [
    { key: 'before', label: 'Before', type: 'text', defaultValue: 'Messy workflow', group: 'Content' },
    { key: 'after', label: 'After', type: 'text', defaultValue: 'Streamlined process', group: 'Content' },
    { key: 'beforeColor', label: 'Before Color', type: 'color', defaultValue: '#94a3b8', group: 'Style' },
    { key: 'afterColor', label: 'After Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
  ],
  defaultConfig: { before: 'Messy workflow', after: 'Streamlined process', beforeColor: '#94a3b8', afterColor: '#3b82f6' },
  motionDesignDescription: {
    name: 'Before & After', description: 'Before fades to after with transition.', background: '#0f172a', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'before-label', type: 'text', text: 'BEFORE', style: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 700, color: '{{beforeColor}}', letterSpacing: 3 }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'before-text', type: 'text', text: '{{before}}', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', fontSize: 26, fontWeight: 600, color: '{{beforeColor}}', textAlign: 'center' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0, y: -15 }, easing: 'easeIn' } } },
      { id: 'arrow', type: 'text', text: '→', style: { position: 'absolute', top: '44%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, color: '#475569' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'after-label', type: 'text', text: 'AFTER', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 700, color: '{{afterColor}}', letterSpacing: 3 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'after-text', type: 'text', text: '{{after}}', style: { position: 'absolute', top: '66%', left: '50%', transform: 'translateX(-50%)', fontSize: 30, fontWeight: 800, color: '{{afterColor}}', textAlign: 'center' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 20, scale: 0.8 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1.5 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf016: BundledTemplate = {
  id: 'inf-definition-card',
  title: 'Definition Card',
  description: 'Dictionary-style definition with word and meaning.',
  category: 'infographic',
  tags: ['definition', 'glossary', 'word', 'meaning'],
  featured: false,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'Resilience', group: 'Content' },
    { key: 'pronunciation', label: 'Pronunciation', type: 'text', defaultValue: '/rɪˈzɪl.i.əns/', group: 'Content' },
    { key: 'definition', label: 'Definition', type: 'text', defaultValue: 'The capacity to recover quickly from difficulties.', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#7c3aed', group: 'Style' },
  ],
  defaultConfig: { word: 'Resilience', pronunciation: '/rɪˈzɪl.i.əns/', definition: 'The capacity to recover quickly from difficulties.', accentColor: '#7c3aed' },
  motionDesignDescription: {
    name: 'Definition Card', description: 'Word with pronunciation and definition.', background: '#faf5ff', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'word', type: 'text', text: '{{word}}', style: { position: 'absolute', top: '22%', left: '10%', fontSize: 36, fontWeight: 800, color: '#1e1b4b', fontStyle: 'italic' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'pron', type: 'text', text: '{{pronunciation}}', style: { position: 'absolute', top: '35%', left: '10%', fontSize: 16, fontWeight: 400, color: '{{accentColor}}' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'line', type: 'rect', style: { position: 'absolute', top: '44%', left: '10%', width: '80%', height: 1, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'def', type: 'text', text: '{{definition}}', style: { position: 'absolute', top: '50%', left: '10%', width: '80%', fontSize: 20, fontWeight: 500, color: '#4b5563', lineHeight: 1.5 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf017: BundledTemplate = {
  id: 'inf-timeline-2pt',
  title: 'Timeline 2-Point',
  description: 'Simple two-point timeline with dates and events.',
  category: 'infographic',
  tags: ['timeline', 'history', 'dates', 'sequence'],
  featured: false,
  configSchema: [
    { key: 'date1', label: 'Date 1', type: 'text', defaultValue: '2020', group: 'Content' },
    { key: 'event1', label: 'Event 1', type: 'text', defaultValue: 'Company founded', group: 'Content' },
    { key: 'date2', label: 'Date 2', type: 'text', defaultValue: '2024', group: 'Content' },
    { key: 'event2', label: 'Event 2', type: 'text', defaultValue: '1M users reached', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#0ea5e9', group: 'Style' },
  ],
  defaultConfig: { date1: '2020', event1: 'Company founded', date2: '2024', event2: '1M users reached', accentColor: '#0ea5e9' },
  motionDesignDescription: {
    name: 'Timeline 2-Point', description: 'Two-point timeline with connecting line.', background: '#ffffff', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'line', type: 'rect', style: { position: 'absolute', top: '50%', left: '15%', width: '70%', height: 3, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'dot1', type: 'circle', style: { position: 'absolute', top: '47%', left: '20%', width: 16, height: 16, backgroundColor: '{{accentColor}}', borderRadius: 8 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'date1', type: 'text', text: '{{date1}}', style: { position: 'absolute', top: '35%', left: '20%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 800, color: '{{accentColor}}', textAlign: 'center' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'event1', type: 'text', text: '{{event1}}', style: { position: 'absolute', top: '58%', left: '12%', fontSize: 14, fontWeight: 500, color: '#64748b', textAlign: 'center', width: '20%' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'dot2', type: 'circle', style: { position: 'absolute', top: '47%', left: '72%', width: 16, height: 16, backgroundColor: '{{accentColor}}', borderRadius: 8 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'date2', type: 'text', text: '{{date2}}', style: { position: 'absolute', top: '35%', left: '72%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 800, color: '{{accentColor}}', textAlign: 'center' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, y: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf018: BundledTemplate = {
  id: 'inf-feature-highlight',
  title: 'Feature Highlight',
  description: 'Single feature spotlight with icon area and description.',
  category: 'infographic',
  tags: ['feature', 'highlight', 'product', 'spotlight'],
  featured: false,
  configSchema: [
    { key: 'feature', label: 'Feature Name', type: 'text', defaultValue: 'Auto-Save', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Your work is saved automatically every 30 seconds.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#eff6ff', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#2563eb', group: 'Style' },
  ],
  defaultConfig: { feature: 'Auto-Save', description: 'Your work is saved automatically every 30 seconds.', bgColor: '#eff6ff', accentColor: '#2563eb' },
  motionDesignDescription: {
    name: 'Feature Highlight', description: 'Single feature with icon and text.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'icon-bg', type: 'rect', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 64, height: 64, backgroundColor: '{{accentColor}}', borderRadius: 16, opacity: 0.15 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0, rotate: -10 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'icon-dot', type: 'circle', style: { position: 'absolute', top: '26%', left: '50%', transform: 'translateX(-50%)', width: 28, height: 28, backgroundColor: '{{accentColor}}', borderRadius: 14 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'feature-name', type: 'text', text: '{{feature}}', style: { position: 'absolute', top: '48%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 800, color: '#1e3a5f', textAlign: 'center' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'desc', type: 'text', text: '{{description}}', style: { position: 'absolute', top: '60%', left: '12%', width: '76%', fontSize: 16, fontWeight: 400, color: '#64748b', textAlign: 'center', lineHeight: 1.5 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf019: BundledTemplate = {
  id: 'inf-percentage-bar',
  title: 'Percentage Bar',
  description: 'Animated percentage bar with label and value.',
  category: 'infographic',
  tags: ['percentage', 'bar', 'progress', 'data'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Completion Rate', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '87%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#10b981', group: 'Style' },
  ],
  defaultConfig: { label: 'Completion Rate', value: '87%', bgColor: '#0f172a', barColor: '#10b981' },
  motionDesignDescription: {
    name: 'Percentage Bar', description: 'Animated progress bar with percentage.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '32%', left: '10%', fontSize: 18, fontWeight: 500, color: '#94a3b8' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar-bg', type: 'rect', style: { position: 'absolute', top: '45%', left: '10%', width: '80%', height: 12, backgroundColor: '#1e293b', borderRadius: 6 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar-fill', type: 'rect', style: { position: 'absolute', top: '45%', left: '10%', width: '70%', height: 12, backgroundColor: '{{barColor}}', borderRadius: 6 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '55%', left: '10%', fontSize: 48, fontWeight: 900, color: '{{barColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf020: BundledTemplate = {
  id: 'inf-quote-card-minimal',
  title: 'Minimal Quote Card',
  description: 'Clean quote card with large quotation mark accent.',
  category: 'infographic',
  tags: ['quote', 'testimonial', 'minimal', 'clean'],
  featured: false,
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'Simplicity is the ultimate sophistication.', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: '— Leonardo da Vinci', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
  defaultConfig: { quote: 'Simplicity is the ultimate sophistication.', author: '— Leonardo da Vinci', bgColor: '#ffffff', accentColor: '#6366f1' },
  motionDesignDescription: {
    name: 'Minimal Quote Card', description: 'Quote with large decorative quotation mark.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'big-quote', type: 'text', text: '"', style: { position: 'absolute', top: '12%', left: '8%', fontSize: 120, fontWeight: 900, color: '{{accentColor}}', opacity: 0.15, lineHeight: 1 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 2 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'quote-text', type: 'text', text: '{{quote}}', style: { position: 'absolute', top: '35%', left: '12%', width: '76%', fontSize: 24, fontWeight: 600, color: '#1e293b', lineHeight: 1.5, fontStyle: 'italic' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0, y: 10 }, easing: 'easeIn' } } },
      { id: 'author', type: 'text', text: '{{author}}', style: { position: 'absolute', top: '68%', left: '12%', fontSize: 16, fontWeight: 500, color: '{{accentColor}}' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, x: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf021: BundledTemplate = {
  id: 'inf-number-counter',
  title: 'Number Counter',
  description: 'Big animated number with subtitle context.',
  category: 'infographic',
  tags: ['number', 'counter', 'metric', 'KPI'],
  featured: false,
  configSchema: [
    { key: 'number', label: 'Number', type: 'text', defaultValue: '500K', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Downloads This Month', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020617', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#a78bfa', group: 'Style' },
  ],
  defaultConfig: { number: '500K', subtitle: 'Downloads This Month', bgColor: '#020617', numberColor: '#a78bfa' },
  motionDesignDescription: {
    name: 'Number Counter', description: 'Large number scales in with subtitle.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'num', type: 'text', text: '{{number}}', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', fontSize: 80, fontWeight: 900, color: '{{numberColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.2, y: 40 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1 }, exit: { to: { opacity: 0, scale: 0.5 }, easing: 'easeIn' } } },
      { id: 'line', type: 'rect', style: { position: 'absolute', top: '56%', left: '30%', width: '40%', height: 2, backgroundColor: '{{numberColor}}', opacity: 0.4 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'sub', type: 'text', text: '{{subtitle}}', style: { position: 'absolute', top: '62%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '#94a3b8', textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf022: BundledTemplate = {
  id: 'inf-did-you-know',
  title: 'Did You Know?',
  description: 'Fun educational card with question mark accent.',
  category: 'infographic',
  tags: ['did-you-know', 'trivia', 'educational', 'fun-fact'],
  featured: false,
  configSchema: [
    { key: 'fact', label: 'Fact', type: 'text', defaultValue: 'Honey never spoils — edible honey has been found in 3000-year-old tombs.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fefce8', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ca8a04', group: 'Style' },
  ],
  defaultConfig: { fact: 'Honey never spoils — edible honey has been found in 3000-year-old tombs.', bgColor: '#fefce8', accentColor: '#ca8a04' },
  motionDesignDescription: {
    name: 'Did You Know?', description: 'Fun fact with question mark accent.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'qmark', type: 'text', text: '?', style: { position: 'absolute', top: '8%', right: '10%', fontSize: 100, fontWeight: 900, color: '{{accentColor}}', opacity: 0.1 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, rotate: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: 'DID YOU KNOW?', style: { position: 'absolute', top: '20%', left: '10%', fontSize: 16, fontWeight: 800, color: '{{accentColor}}', letterSpacing: 3 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar', type: 'rect', style: { position: 'absolute', top: '30%', left: '10%', width: 50, height: 3, backgroundColor: '{{accentColor}}' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'fact', type: 'text', text: '{{fact}}', style: { position: 'absolute', top: '38%', left: '10%', width: '80%', fontSize: 24, fontWeight: 600, color: '#422006', lineHeight: 1.5 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 25 }, easing: 'easeOut' }, exit: { to: { opacity: 0, y: 10 }, easing: 'easeIn' } } },
    ],
  },
}

const inf023: BundledTemplate = {
  id: 'inf-feature-grid-2x2',
  title: 'Feature Grid 2x2',
  description: 'Four features in a clean 2x2 grid layout.',
  category: 'infographic',
  tags: ['features', 'grid', 'product', 'overview'],
  featured: true,
  configSchema: [
    { key: 'f1', label: 'Feature 1', type: 'text', defaultValue: 'Fast', group: 'Content' },
    { key: 'f2', label: 'Feature 2', type: 'text', defaultValue: 'Secure', group: 'Content' },
    { key: 'f3', label: 'Feature 3', type: 'text', defaultValue: 'Simple', group: 'Content' },
    { key: 'f4', label: 'Feature 4', type: 'text', defaultValue: 'Reliable', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#0ea5e9', group: 'Style' },
  ],
  defaultConfig: { f1: 'Fast', f2: 'Secure', f3: 'Simple', f4: 'Reliable', accentColor: '#0ea5e9' },
  motionDesignDescription: {
    name: 'Feature Grid 2x2', description: 'Four features in 2x2 grid.', background: '#0f172a', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'dot1', type: 'circle', style: { position: 'absolute', top: '25%', left: '25%', transform: 'translate(-50%,-50%)', width: 12, height: 12, backgroundColor: '{{accentColor}}', borderRadius: 6 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'f1', type: 'text', text: '{{f1}}', style: { position: 'absolute', top: '30%', left: '25%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'f2', type: 'text', text: '{{f2}}', style: { position: 'absolute', top: '30%', left: '75%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'f3', type: 'text', text: '{{f3}}', style: { position: 'absolute', top: '62%', left: '25%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'f4', type: 'text', text: '{{f4}}', style: { position: 'absolute', top: '62%', left: '75%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf024: BundledTemplate = {
  id: 'inf-process-arrow',
  title: 'Process Arrow Flow',
  description: 'Horizontal process flow connected by arrows.',
  category: 'infographic',
  tags: ['process', 'flow', 'arrow', 'workflow'],
  featured: false,
  configSchema: [
    { key: 'step1', label: 'Step 1', type: 'text', defaultValue: 'Research', group: 'Content' },
    { key: 'step2', label: 'Step 2', type: 'text', defaultValue: 'Design', group: 'Content' },
    { key: 'step3', label: 'Step 3', type: 'text', defaultValue: 'Build', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#8b5cf6', group: 'Style' },
  ],
  defaultConfig: { step1: 'Research', step2: 'Design', step3: 'Build', accentColor: '#8b5cf6' },
  motionDesignDescription: {
    name: 'Process Arrow Flow', description: 'Horizontal flow with arrows between steps.', background: '#faf5ff', configSchema: [], defaultConfig: {},
    enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 's1', type: 'text', text: '{{step1}}', style: { position: 'absolute', top: '45%', left: '12%', fontSize: 18, fontWeight: 700, color: '{{accentColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'arr1', type: 'text', text: '→', style: { position: 'absolute', top: '43%', left: '32%', fontSize: 28, color: '#c4b5fd' }, animation: { enterDelay: 0.12, enter: { from: { opacity: 0, x: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 's2', type: 'text', text: '{{step2}}', style: { position: 'absolute', top: '45%', left: '42%', fontSize: 18, fontWeight: 700, color: '{{accentColor}}', textAlign: 'center' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'arr2', type: 'text', text: '→', style: { position: 'absolute', top: '43%', left: '62%', fontSize: 28, color: '#c4b5fd' }, animation: { enterDelay: 0.32, enter: { from: { opacity: 0, x: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 's3', type: 'text', text: '{{step3}}', style: { position: 'absolute', top: '45%', left: '72%', fontSize: 18, fontWeight: 700, color: '{{accentColor}}', textAlign: 'center' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf025: BundledTemplate = {
  id: 'inf-key-value-pair',
  title: 'Key-Value Pair',
  description: 'Clean key-value data display with labels and values.',
  category: 'infographic',
  tags: ['data', 'key-value', 'specs', 'details'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Specifications', group: 'Content' },
    { key: 'key1', label: 'Key 1', type: 'text', defaultValue: 'Resolution', group: 'Content' },
    { key: 'val1', label: 'Value 1', type: 'text', defaultValue: '4K Ultra HD', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#0d9488', group: 'Style' },
  ],
  defaultConfig: { title: 'Specifications', key1: 'Resolution', val1: '4K Ultra HD', accentColor: '#0d9488' },
  motionDesignDescription: {
    name: 'Key-Value Pair', description: 'Label-value display.', background: '#f0fdfa', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '15%', left: '10%', fontSize: 22, fontWeight: 800, color: '#134e4a' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'divider', type: 'rect', style: { position: 'absolute', top: '27%', left: '10%', width: '80%', height: 1, backgroundColor: '{{accentColor}}', opacity: 0.2 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'key1', type: 'text', text: '{{key1}}', style: { position: 'absolute', top: '35%', left: '10%', fontSize: 14, fontWeight: 600, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'val1', type: 'text', text: '{{val1}}', style: { position: 'absolute', top: '43%', left: '10%', fontSize: 28, fontWeight: 700, color: '{{accentColor}}' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf026: BundledTemplate = {
  id: 'inf-callout-box',
  title: 'Callout Box',
  description: 'Highlighted callout with left border accent.',
  category: 'infographic',
  tags: ['callout', 'highlight', 'note', 'important'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Important', group: 'Content' },
    { key: 'body', label: 'Body', type: 'text', defaultValue: 'Remember to back up your data before updating.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#eff6ff', group: 'Style' },
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
  ],
  defaultConfig: { title: 'Important', body: 'Remember to back up your data before updating.', bgColor: '#eff6ff', borderColor: '#3b82f6' },
  motionDesignDescription: {
    name: 'Callout Box', description: 'Left-bordered callout box.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'border', type: 'rect', style: { position: 'absolute', top: '25%', left: '8%', width: 5, height: '50%', backgroundColor: '{{borderColor}}', borderRadius: 3 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleY: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'card-bg', type: 'rect', style: { position: 'absolute', top: '25%', left: '12%', width: '78%', height: '50%', backgroundColor: '#ffffff', borderRadius: 8 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '32%', left: '16%', fontSize: 20, fontWeight: 700, color: '{{borderColor}}' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'body', type: 'text', text: '{{body}}', style: { position: 'absolute', top: '44%', left: '16%', width: '68%', fontSize: 16, fontWeight: 400, color: '#475569', lineHeight: 1.5 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf027: BundledTemplate = {
  id: 'inf-donut-stat',
  title: 'Donut Stat',
  description: 'Circular donut-style stat with center number.',
  category: 'infographic',
  tags: ['donut', 'circle', 'stat', 'chart'],
  featured: false,
  configSchema: [
    { key: 'value', label: 'Value', type: 'text', defaultValue: '76%', group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Satisfaction Rate', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#06b6d4', group: 'Style' },
  ],
  defaultConfig: { value: '76%', label: 'Satisfaction Rate', bgColor: '#0f172a', ringColor: '#06b6d4' },
  motionDesignDescription: {
    name: 'Donut Stat', description: 'Ring chart effect with centered value.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'ring-outer', type: 'circle', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 140, height: 140, borderRadius: 70, borderWidth: 8, borderColor: '{{ringColor}}', opacity: 0.2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'ring-accent', type: 'circle', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 140, height: 140, borderRadius: 70, borderWidth: 8, borderColor: '{{ringColor}}', borderTopColor: 'transparent' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0, rotate: -90 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 900, color: '{{ringColor}}', textAlign: 'center' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '72%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 500, color: '#94a3b8', textAlign: 'center' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf028: BundledTemplate = {
  id: 'inf-split-text-reveal',
  title: 'Split Text Reveal',
  description: 'Text splits from center revealing heading and subtext.',
  category: 'infographic',
  tags: ['split', 'reveal', 'dramatic', 'text'],
  featured: false,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'THE FUTURE', group: 'Content' },
    { key: 'subtext', label: 'Subtext', type: 'text', defaultValue: 'is already here', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fafafa', group: 'Style' },
  ],
  defaultConfig: { heading: 'THE FUTURE', subtext: 'is already here', bgColor: '#18181b', textColor: '#fafafa' },
  motionDesignDescription: {
    name: 'Split Text Reveal', description: 'Heading appears then subtext slides up.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'line-top', type: 'rect', style: { position: 'absolute', top: '40%', left: '20%', width: '60%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'heading', type: 'text', text: '{{heading}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 42, fontWeight: 900, color: '{{textColor}}', letterSpacing: 6, textAlign: 'center' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: -25 }, easing: 'backOut' }, exit: { to: { opacity: 0, y: -15 }, easing: 'easeIn' } } },
      { id: 'subtext', type: 'text', text: '{{subtext}}', style: { position: 'absolute', top: '56%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 400, color: '{{textColor}}', opacity: 0.6, textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'line-bottom', type: 'rect', style: { position: 'absolute', top: '66%', left: '20%', width: '60%', height: 1, backgroundColor: '{{textColor}}', opacity: 0.2 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf029: BundledTemplate = {
  id: 'inf-two-column-text',
  title: 'Two Column Text',
  description: 'Clean two-column layout with heading and two text blocks.',
  category: 'infographic',
  tags: ['columns', 'layout', 'text', 'article'],
  featured: false,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Key Insights', group: 'Content' },
    { key: 'col1', label: 'Column 1', type: 'text', defaultValue: 'Performance improved by 40% with the new architecture.', group: 'Content' },
    { key: 'col2', label: 'Column 2', type: 'text', defaultValue: 'User retention doubled after the redesign.', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#2563eb', group: 'Style' },
  ],
  defaultConfig: { heading: 'Key Insights', col1: 'Performance improved by 40% with the new architecture.', col2: 'User retention doubled after the redesign.', accentColor: '#2563eb' },
  motionDesignDescription: {
    name: 'Two Column Text', description: 'Heading plus two text columns.', background: '#ffffff', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'heading', type: 'text', text: '{{heading}}', style: { position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 26, fontWeight: 800, color: '#0f172a', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'divider', type: 'rect', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 3, backgroundColor: '{{accentColor}}' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'col1', type: 'text', text: '{{col1}}', style: { position: 'absolute', top: '35%', left: '6%', width: '42%', fontSize: 16, fontWeight: 400, color: '#475569', lineHeight: 1.5 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'col2', type: 'text', text: '{{col2}}', style: { position: 'absolute', top: '35%', right: '6%', width: '42%', fontSize: 16, fontWeight: 400, color: '#475569', lineHeight: 1.5 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, x: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf030: BundledTemplate = {
  id: 'inf-countdown-timer',
  title: 'Countdown Card',
  description: 'Countdown-style card with number and event name.',
  category: 'infographic',
  tags: ['countdown', 'timer', 'event', 'days'],
  featured: false,
  configSchema: [
    { key: 'number', label: 'Number', type: 'text', defaultValue: '14', group: 'Content' },
    { key: 'unit', label: 'Unit', type: 'text', defaultValue: 'DAYS LEFT', group: 'Content' },
    { key: 'event', label: 'Event', type: 'text', defaultValue: 'Until Product Launch', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ec4899', group: 'Style' },
  ],
  defaultConfig: { number: '14', unit: 'DAYS LEFT', event: 'Until Product Launch', accentColor: '#ec4899' },
  motionDesignDescription: {
    name: 'Countdown Card', description: 'Big countdown number with event label.', background: '#0f172a', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'num', type: 'text', text: '{{number}}', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', fontSize: 96, fontWeight: 900, color: '{{accentColor}}', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 3 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.03, speed: 1 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'unit', type: 'text', text: '{{unit}}', style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 700, color: '{{accentColor}}', letterSpacing: 4, textAlign: 'center' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'event', type: 'text', text: '{{event}}', style: { position: 'absolute', top: '66%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 500, color: '#94a3b8', textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf031: BundledTemplate = {
  id: 'inf-gradient-stat',
  title: 'Gradient Stat Card',
  description: 'Stat card with colored gradient accent stripe.',
  category: 'infographic',
  tags: ['gradient', 'stat', 'modern', 'colorful'],
  featured: false,
  configSchema: [
    { key: 'stat', label: 'Stat', type: 'text', defaultValue: '99.9%', group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Uptime Guarantee', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#14b8a6', group: 'Style' },
  ],
  defaultConfig: { stat: '99.9%', label: 'Uptime Guarantee', bgColor: '#0f172a', accentColor: '#14b8a6' },
  motionDesignDescription: {
    name: 'Gradient Stat Card', description: 'Stat with gradient accent.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'stripe', type: 'rect', style: { position: 'absolute', top: 0, left: 0, width: '100%', height: 4, backgroundColor: '{{accentColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'stat', type: 'text', text: '{{stat}}', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 900, color: '{{accentColor}}' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 30, scale: 0.7 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '#94a3b8', textAlign: 'center' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf032: BundledTemplate = {
  id: 'inf-emoji-fact',
  title: 'Emoji Fact Card',
  description: 'Fun fact card with large emoji and fact text.',
  category: 'infographic',
  tags: ['emoji', 'fun', 'fact', 'social'],
  featured: false,
  configSchema: [
    { key: 'emoji', label: 'Emoji', type: 'text', defaultValue: '🚀', group: 'Content' },
    { key: 'fact', label: 'Fact', type: 'text', defaultValue: 'We shipped 200 features this year', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#faf5ff', group: 'Style' },
  ],
  defaultConfig: { emoji: '🚀', fact: 'We shipped 200 features this year', bgColor: '#faf5ff' },
  motionDesignDescription: {
    name: 'Emoji Fact Card', description: 'Large emoji with supporting fact.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'emoji', type: 'text', text: '{{emoji}}', style: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', fontSize: 72 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0, rotate: -20 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.04, speed: 2 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'fact', type: 'text', text: '{{fact}}', style: { position: 'absolute', top: '50%', left: '12%', width: '76%', fontSize: 26, fontWeight: 700, color: '#1e1b4b', textAlign: 'center', lineHeight: 1.4 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 25 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf033: BundledTemplate = {
  id: 'inf-numbered-card',
  title: 'Numbered Card',
  description: 'Large background number with overlaid text content.',
  category: 'infographic',
  tags: ['numbered', 'card', 'bold', 'editorial'],
  featured: false,
  configSchema: [
    { key: 'number', label: 'Number', type: 'text', defaultValue: '01', group: 'Content' },
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Start with Why', group: 'Content' },
    { key: 'body', label: 'Body', type: 'text', defaultValue: 'Define your purpose before building anything.', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#e11d48', group: 'Style' },
  ],
  defaultConfig: { number: '01', heading: 'Start with Why', body: 'Define your purpose before building anything.', accentColor: '#e11d48' },
  motionDesignDescription: {
    name: 'Numbered Card', description: 'Large background number with text overlay.', background: '#fff1f2', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'bg-num', type: 'text', text: '{{number}}', style: { position: 'absolute', top: '10%', right: '5%', fontSize: 160, fontWeight: 900, color: '{{accentColor}}', opacity: 0.08 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 1.5 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'heading', type: 'text', text: '{{heading}}', style: { position: 'absolute', top: '35%', left: '10%', fontSize: 30, fontWeight: 800, color: '#1e293b' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: -25 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar', type: 'rect', style: { position: 'absolute', top: '48%', left: '10%', width: 40, height: 3, backgroundColor: '{{accentColor}}' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'body', type: 'text', text: '{{body}}', style: { position: 'absolute', top: '55%', left: '10%', width: '75%', fontSize: 18, fontWeight: 400, color: '#64748b', lineHeight: 1.5 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf034: BundledTemplate = {
  id: 'inf-triple-icon-row',
  title: 'Triple Icon Row',
  description: 'Three icon circles in a row with labels underneath.',
  category: 'infographic',
  tags: ['icons', 'row', 'three', 'features'],
  featured: false,
  configSchema: [
    { key: 'label1', label: 'Label 1', type: 'text', defaultValue: 'Design', group: 'Content' },
    { key: 'label2', label: 'Label 2', type: 'text', defaultValue: 'Develop', group: 'Content' },
    { key: 'label3', label: 'Label 3', type: 'text', defaultValue: 'Deploy', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
  defaultConfig: { label1: 'Design', label2: 'Develop', label3: 'Deploy', accentColor: '#6366f1' },
  motionDesignDescription: {
    name: 'Triple Icon Row', description: 'Three icon placeholders with labels.', background: '#eef2ff', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'c1', type: 'circle', style: { position: 'absolute', top: '30%', left: '20%', transform: 'translateX(-50%)', width: 56, height: 56, backgroundColor: '{{accentColor}}', borderRadius: 28, opacity: 0.2 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'l1', type: 'text', text: '{{label1}}', style: { position: 'absolute', top: '50%', left: '20%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 600, color: '#312e81', textAlign: 'center' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'c2', type: 'circle', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 56, height: 56, backgroundColor: '{{accentColor}}', borderRadius: 28, opacity: 0.2 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'l2', type: 'text', text: '{{label2}}', style: { position: 'absolute', top: '50%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 600, color: '#312e81', textAlign: 'center' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'c3', type: 'circle', style: { position: 'absolute', top: '30%', left: '80%', transform: 'translateX(-50%)', width: 56, height: 56, backgroundColor: '{{accentColor}}', borderRadius: 28, opacity: 0.2 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'l3', type: 'text', text: '{{label3}}', style: { position: 'absolute', top: '50%', left: '80%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 600, color: '#312e81', textAlign: 'center' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf035: BundledTemplate = {
  id: 'inf-banner-announcement',
  title: 'Banner Announcement',
  description: 'Full-width banner-style announcement card.',
  category: 'infographic',
  tags: ['banner', 'announcement', 'news', 'alert'],
  featured: false,
  configSchema: [
    { key: 'tag', label: 'Tag', type: 'text', defaultValue: 'NEW', group: 'Content' },
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Version 2.0 is Here', group: 'Content' },
    { key: 'body', label: 'Body', type: 'text', defaultValue: 'Faster, smarter, and more powerful than ever.', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
  defaultConfig: { tag: 'NEW', heading: 'Version 2.0 is Here', body: 'Faster, smarter, and more powerful than ever.', accentColor: '#f59e0b' },
  motionDesignDescription: {
    name: 'Banner Announcement', description: 'Announcement banner with tag and body.', background: '#0f172a', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'tag-bg', type: 'rect', style: { position: 'absolute', top: '28%', left: '10%', width: 50, height: 26, backgroundColor: '{{accentColor}}', borderRadius: 4 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'tag', type: 'text', text: '{{tag}}', style: { position: 'absolute', top: '29%', left: '12%', fontSize: 12, fontWeight: 800, color: '#0f172a', letterSpacing: 1 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'heading', type: 'text', text: '{{heading}}', style: { position: 'absolute', top: '40%', left: '10%', fontSize: 30, fontWeight: 800, color: '#ffffff' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'body', type: 'text', text: '{{body}}', style: { position: 'absolute', top: '56%', left: '10%', width: '80%', fontSize: 17, fontWeight: 400, color: '#94a3b8', lineHeight: 1.4 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf036: BundledTemplate = {
  id: 'inf-recipe-card',
  title: 'Recipe Card',
  description: 'Clean recipe-style card with ingredients list feel.',
  category: 'infographic',
  tags: ['recipe', 'ingredients', 'food', 'cooking'],
  featured: false,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Quick Recipe', group: 'Content' },
    { key: 'item1', label: 'Step 1', type: 'text', defaultValue: 'Mix dry ingredients', group: 'Content' },
    { key: 'item2', label: 'Step 2', type: 'text', defaultValue: 'Add wet ingredients', group: 'Content' },
    { key: 'item3', label: 'Step 3', type: 'text', defaultValue: 'Bake at 350°F for 25 min', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ea580c', group: 'Style' },
  ],
  defaultConfig: { title: 'Quick Recipe', item1: 'Mix dry ingredients', item2: 'Add wet ingredients', item3: 'Bake at 350°F for 25 min', accentColor: '#ea580c' },
  motionDesignDescription: {
    name: 'Recipe Card', description: 'Recipe steps with warm tones.', background: '#fff7ed', configSchema: [], defaultConfig: {},
    enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{title}}', style: { position: 'absolute', top: '12%', left: '10%', fontSize: 24, fontWeight: 800, color: '#9a3412' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'dot1', type: 'circle', style: { position: 'absolute', top: '30%', left: '10%', width: 8, height: 8, backgroundColor: '{{accentColor}}', borderRadius: 4 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item1', type: 'text', text: '{{item1}}', style: { position: 'absolute', top: '29%', left: '16%', fontSize: 18, fontWeight: 500, color: '#431407' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item2', type: 'text', text: '{{item2}}', style: { position: 'absolute', top: '43%', left: '16%', fontSize: 18, fontWeight: 500, color: '#431407' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, x: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'item3', type: 'text', text: '{{item3}}', style: { position: 'absolute', top: '57%', left: '16%', fontSize: 18, fontWeight: 500, color: '#431407' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, x: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf037: BundledTemplate = {
  id: 'inf-minimal-badge',
  title: 'Minimal Badge',
  description: 'Simple centered badge with icon circle and label.',
  category: 'infographic',
  tags: ['badge', 'minimal', 'award', 'certified'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'CERTIFIED', group: 'Content' },
    { key: 'sublabel', label: 'Sublabel', type: 'text', defaultValue: 'Quality Assured', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ecfdf5', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#059669', group: 'Style' },
  ],
  defaultConfig: { label: 'CERTIFIED', sublabel: 'Quality Assured', bgColor: '#ecfdf5', accentColor: '#059669' },
  motionDesignDescription: {
    name: 'Minimal Badge', description: 'Centered badge with ring.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'ring', type: 'circle', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '{{accentColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'inner', type: 'circle', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, backgroundColor: '{{accentColor}}', borderRadius: 20 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 800, color: '{{accentColor}}', letterSpacing: 3, textAlign: 'center' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'sublabel', type: 'text', text: '{{sublabel}}', style: { position: 'absolute', top: '67%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 400, color: '#64748b', textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf038: BundledTemplate = {
  id: 'inf-pricing-card',
  title: 'Pricing Card',
  description: 'Simple pricing display with price, plan name, and feature.',
  category: 'infographic',
  tags: ['pricing', 'plan', 'cost', 'subscription'],
  featured: false,
  configSchema: [
    { key: 'plan', label: 'Plan', type: 'text', defaultValue: 'Pro Plan', group: 'Content' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '$29/mo', group: 'Content' },
    { key: 'feature', label: 'Feature', type: 'text', defaultValue: 'Unlimited projects + priority support', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#7c3aed', group: 'Style' },
  ],
  defaultConfig: { plan: 'Pro Plan', price: '$29/mo', feature: 'Unlimited projects + priority support', accentColor: '#7c3aed' },
  motionDesignDescription: {
    name: 'Pricing Card', description: 'Plan name, price, and feature.', background: '#faf5ff', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'plan', type: 'text', text: '{{plan}}', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 700, color: '{{accentColor}}', letterSpacing: 2, textTransform: 'uppercase' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'price', type: 'text', text: '{{price}}', style: { position: 'absolute', top: '34%', left: '50%', transform: 'translateX(-50%)', fontSize: 52, fontWeight: 900, color: '#1e1b4b', textAlign: 'center' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'divider', type: 'rect', style: { position: 'absolute', top: '56%', left: '25%', width: '50%', height: 1, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'feature', type: 'text', text: '{{feature}}', style: { position: 'absolute', top: '62%', left: '12%', width: '76%', fontSize: 16, fontWeight: 400, color: '#64748b', textAlign: 'center', lineHeight: 1.4 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf039: BundledTemplate = {
  id: 'inf-score-rating',
  title: 'Score Rating',
  description: 'Rating score display with out-of-10 or star-like format.',
  category: 'infographic',
  tags: ['score', 'rating', 'review', 'stars'],
  featured: false,
  configSchema: [
    { key: 'score', label: 'Score', type: 'text', defaultValue: '9.2', group: 'Content' },
    { key: 'outOf', label: 'Out Of', type: 'text', defaultValue: '/ 10', group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'User Satisfaction', group: 'Content' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
  defaultConfig: { score: '9.2', outOf: '/ 10', label: 'User Satisfaction', accentColor: '#f59e0b' },
  motionDesignDescription: {
    name: 'Score Rating', description: 'Big score with fractional display.', background: '#0f172a', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'score', type: 'text', text: '{{score}}', style: { position: 'absolute', top: '28%', left: '40%', fontSize: 72, fontWeight: 900, color: '{{accentColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.3 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'outOf', type: 'text', text: '{{outOf}}', style: { position: 'absolute', top: '42%', left: '72%', fontSize: 24, fontWeight: 500, color: '#64748b' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '62%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '#94a3b8', textAlign: 'center' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const inf040: BundledTemplate = {
  id: 'inf-swipe-cta',
  title: 'Swipe CTA Card',
  description: 'Call-to-action card with swipe direction indicator.',
  category: 'infographic',
  tags: ['cta', 'swipe', 'action', 'engage'],
  featured: false,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Want to learn more?', group: 'Content' },
    { key: 'cta', label: 'CTA Text', type: 'text', defaultValue: 'Swipe Right →', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e293b', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#38bdf8', group: 'Style' },
  ],
  defaultConfig: { heading: 'Want to learn more?', cta: 'Swipe Right →', bgColor: '#1e293b', accentColor: '#38bdf8' },
  motionDesignDescription: {
    name: 'Swipe CTA Card', description: 'CTA card with directional prompt.', background: '{{bgColor}}', configSchema: [], defaultConfig: {},
    enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'heading', type: 'text', text: '{{heading}}', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 700, color: '#ffffff', textAlign: 'center' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'line', type: 'rect', style: { position: 'absolute', top: '52%', left: '30%', width: '40%', height: 2, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'cta', type: 'text', text: '{{cta}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 600, color: '{{accentColor}}', textAlign: 'center' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, x: -30 }, easing: 'easeOut' }, hold: { effect: 'pulse', amplitude: 0.03, speed: 2 }, exit: { to: { opacity: 0, x: 30 }, easing: 'easeIn' } } },
    ],
  },
}
