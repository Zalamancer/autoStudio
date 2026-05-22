import type { BundledTemplate } from '../templates'

const dv001: BundledTemplate = {
  id: 'dv-vertical-bar-rise',
  title: 'Vertical Bar Rise',
  description: 'Bars grow upward from the bottom to reveal data values.',
  category: 'data-visualization',
  tags: ['bar-chart', 'vertical', 'growth', 'clean'],
  featured: true,
  configSchema: [
    { key: 'label', label: 'Chart Title', type: 'text', defaultValue: 'Revenue', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '$12.4M', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
  defaultConfig: { label: 'Revenue', value: '$12.4M', bgColor: '#0f172a', barColor: '#3b82f6', textColor: '#e2e8f0' },
  motionDesignDescription: {
    name: 'Vertical Bar Rise',
    description: 'Bars grow upward from the bottom.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 700, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar1', type: 'rect', style: { position: 'absolute', bottom: '25%', left: '15%', width: 40, height: 120, backgroundColor: '{{barColor}}', borderRadius: 4, opacity: 0.6 }, animation: { enterDelay: 0.1, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0, opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar2', type: 'rect', style: { position: 'absolute', bottom: '25%', left: '35%', width: 40, height: 180, backgroundColor: '{{barColor}}', borderRadius: 4, opacity: 0.8 }, animation: { enterDelay: 0.2, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0, opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar3', type: 'rect', style: { position: 'absolute', bottom: '25%', left: '55%', width: 40, height: 220, backgroundColor: '{{barColor}}', borderRadius: 4 }, animation: { enterDelay: 0.3, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0, opacity: 0 }, easing: 'easeIn' } } },
      { id: 'value-label', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 800, color: '{{barColor}}' }, animation: { enterDelay: 0.5, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv002: BundledTemplate = {
  id: 'dv-horizontal-bar-slide',
  title: 'Horizontal Bar Slide',
  description: 'Horizontal bars slide in from the left to show comparative data.',
  category: 'data-visualization',
  tags: ['bar-chart', 'horizontal', 'comparison', 'slide'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Market Share', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '64%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1b4b', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#818cf8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e7ff', group: 'Style' },
  ],
  defaultConfig: { label: 'Market Share', value: '64%', bgColor: '#1e1b4b', barColor: '#818cf8', textColor: '#e0e7ff' },
  motionDesignDescription: {
    name: 'Horizontal Bar Slide',
    description: 'Horizontal bars slide in from the left.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '15%', left: '10%', fontSize: 24, fontWeight: 700, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -30 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar1', type: 'rect', style: { position: 'absolute', top: '35%', left: '10%', width: 200, height: 24, backgroundColor: '{{barColor}}', borderRadius: 4 }, animation: { enterDelay: 0.1, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'bar2', type: 'rect', style: { position: 'absolute', top: '50%', left: '10%', width: 150, height: 24, backgroundColor: '{{barColor}}', borderRadius: 4, opacity: 0.7 }, animation: { enterDelay: 0.2, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'bar3', type: 'rect', style: { position: 'absolute', top: '65%', left: '10%', width: 100, height: 24, backgroundColor: '{{barColor}}', borderRadius: 4, opacity: 0.5 }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'value-label', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '80%', right: '10%', fontSize: 40, fontWeight: 800, color: '{{barColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv003: BundledTemplate = {
  id: 'dv-donut-chart-spin',
  title: 'Donut Chart Spin',
  description: 'Donut chart segments spin into view with a center label.',
  category: 'data-visualization',
  tags: ['donut', 'pie', 'spin', 'percentage'],
  featured: true,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Completion', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '78%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0a09', group: 'Style' },
    { key: 'primaryColor', label: 'Primary', type: 'color', defaultValue: '#f97316', group: 'Style' },
    { key: 'textColor', label: 'Text', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
  ],
  defaultConfig: { label: 'Completion', value: '78%', bgColor: '#0c0a09', primaryColor: '#f97316', textColor: '#fafaf9' },
  motionDesignDescription: {
    name: 'Donut Chart Spin',
    description: 'Donut segments spin into view.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.6,
    exitDuration: 0.2,
    elements: [
      { id: 'ring-bg', type: 'circle', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, borderRadius: '50%', border: '16px solid rgba(255,255,255,0.1)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.5, rotate: -90 }, easing: 'easeOut' }, exit: { to: { opacity: 0, scale: 0.8 }, easing: 'easeIn' } } },
      { id: 'ring-fill', type: 'circle', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, borderRadius: '50%', border: '16px solid {{primaryColor}}', borderRightColor: 'transparent' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0.5, rotate: -180 }, easing: 'backOut' }, exit: { to: { opacity: 0, rotate: 90 }, easing: 'easeIn' } } },
      { id: 'center-value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 42, fontWeight: 800, color: '{{textColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, fontWeight: 600, color: '{{textColor}}', opacity: 0.7 }, animation: { enterDelay: 0.5, enter: { from: { opacity: 0, y: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv004: BundledTemplate = {
  id: 'dv-number-counter',
  title: 'Number Counter',
  description: 'Large number scales up with a counting animation effect.',
  category: 'data-visualization',
  tags: ['counter', 'number', 'odometer', 'bold'],
  featured: true,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Total Users', group: 'Content' },
    { key: 'value', label: 'Number', type: 'text', defaultValue: '1,247,893', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020617', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#22d3ee', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#94a3b8', group: 'Style' },
  ],
  defaultConfig: { label: 'Total Users', value: '1,247,893', bgColor: '#020617', numberColor: '#22d3ee', textColor: '#94a3b8' },
  motionDesignDescription: {
    name: 'Number Counter',
    description: 'Large number scales up with counting effect.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 500, color: '{{textColor}}', textTransform: 'uppercase', letterSpacing: 3 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'number', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 64, fontWeight: 900, color: '{{numberColor}}', fontVariantNumeric: 'tabular-nums' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0.3, y: 30 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1.5 }, exit: { to: { opacity: 0, scale: 1.2 }, easing: 'easeIn' } } },
      { id: 'underline', type: 'rect', style: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', width: 80, height: 3, backgroundColor: '{{numberColor}}', borderRadius: 2 }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'glow', type: 'circle', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 100, backgroundColor: '{{numberColor}}', opacity: 0.05, borderRadius: '50%' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv005: BundledTemplate = {
  id: 'dv-percentage-circle-fill',
  title: 'Percentage Circle Fill',
  description: 'Circle progressively fills to show a percentage with a bold center number.',
  category: 'data-visualization',
  tags: ['percentage', 'circle', 'progress', 'fill'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Progress', group: 'Content' },
    { key: 'value', label: 'Percentage', type: 'text', defaultValue: '85%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#10b981', group: 'Style' },
    { key: 'textColor', label: 'Text', type: 'color', defaultValue: '#f4f4f5', group: 'Style' },
  ],
  defaultConfig: { label: 'Progress', value: '85%', bgColor: '#18181b', fillColor: '#10b981', textColor: '#f4f4f5' },
  motionDesignDescription: {
    name: 'Percentage Circle Fill',
    description: 'Circle fills to show a percentage.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.6,
    exitDuration: 0.2,
    elements: [
      { id: 'outer-ring', type: 'circle', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', border: '12px solid rgba(255,255,255,0.08)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.6 }, easing: 'easeOut' }, exit: { to: { opacity: 0, scale: 0.8 }, easing: 'easeIn' } } },
      { id: 'fill-ring', type: 'circle', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', border: '12px solid {{fillColor}}', borderBottomColor: 'transparent' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, rotate: -180, scale: 0.6 }, easing: 'backOut' }, exit: { to: { opacity: 0, rotate: 90 }, easing: 'easeIn' } } },
      { id: 'pct-value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '36%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 800, color: '{{textColor}}' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 600, color: '{{textColor}}', opacity: 0.6 }, animation: { enterDelay: 0.5, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv006: BundledTemplate = {
  id: 'dv-stat-comparison',
  title: 'Stat Comparison',
  description: 'Two stats side by side with a vs divider for easy comparison.',
  category: 'data-visualization',
  tags: ['comparison', 'versus', 'stats', 'side-by-side'],
  featured: false,
  configSchema: [
    { key: 'leftLabel', label: 'Left Label', type: 'text', defaultValue: 'Before', group: 'Content' },
    { key: 'leftValue', label: 'Left Value', type: 'text', defaultValue: '2.4K', group: 'Content' },
    { key: 'rightLabel', label: 'Right Label', type: 'text', defaultValue: 'After', group: 'Content' },
    { key: 'rightValue', label: 'Right Value', type: 'text', defaultValue: '8.1K', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
  ],
  defaultConfig: { leftLabel: 'Before', leftValue: '2.4K', rightLabel: 'After', rightValue: '8.1K', bgColor: '#0f172a' },
  motionDesignDescription: {
    name: 'Stat Comparison',
    description: 'Two stats side by side with vs divider.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'left-val', type: 'text', text: '{{leftValue}}', style: { position: 'absolute', top: '35%', left: '20%', fontSize: 48, fontWeight: 800, color: '#ef4444' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -40 }, easing: 'backOut' }, exit: { to: { opacity: 0, x: -20 }, easing: 'easeIn' } } },
      { id: 'left-label', type: 'text', text: '{{leftLabel}}', style: { position: 'absolute', top: '52%', left: '20%', fontSize: 16, fontWeight: 500, color: '#94a3b8' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'divider', type: 'rect', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 2, height: 100, backgroundColor: '#334155' }, animation: { enterDelay: 0.15, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'right-val', type: 'text', text: '{{rightValue}}', style: { position: 'absolute', top: '35%', right: '20%', fontSize: 48, fontWeight: 800, color: '#22c55e' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, x: 40 }, easing: 'backOut' }, exit: { to: { opacity: 0, x: 20 }, easing: 'easeIn' } } },
      { id: 'right-label', type: 'text', text: '{{rightLabel}}', style: { position: 'absolute', top: '52%', right: '20%', fontSize: 16, fontWeight: 500, color: '#94a3b8' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv007: BundledTemplate = {
  id: 'dv-growth-arrow',
  title: 'Growth Arrow',
  description: 'Upward arrow shoots in with a growth percentage.',
  category: 'data-visualization',
  tags: ['growth', 'arrow', 'upward', 'increase'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Metric', type: 'text', defaultValue: 'Revenue Growth', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '+147%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#022c22', group: 'Style' },
    { key: 'arrowColor', label: 'Arrow Color', type: 'color', defaultValue: '#34d399', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ecfdf5', group: 'Style' },
  ],
  defaultConfig: { label: 'Revenue Growth', value: '+147%', bgColor: '#022c22', arrowColor: '#34d399', textColor: '#ecfdf5' },
  motionDesignDescription: {
    name: 'Growth Arrow',
    description: 'Upward arrow shoots in with growth percentage.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'arrow-shaft', type: 'rect', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%) rotate(-45deg)', width: 8, height: 100, backgroundColor: '{{arrowColor}}', borderRadius: 4 }, animation: { enterDelay: 0, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0, opacity: 0 }, easing: 'easeIn' } } },
      { id: 'arrow-head', type: 'rect', style: { position: 'absolute', top: '28%', left: '45%', width: 30, height: 8, backgroundColor: '{{arrowColor}}', borderRadius: 4, transform: 'rotate(-45deg)' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 52, fontWeight: 900, color: '{{arrowColor}}' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 30, scale: 0.5 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.03, speed: 2 }, exit: { to: { opacity: 0, y: -20 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '75%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '{{textColor}}', opacity: 0.7 }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv008: BundledTemplate = {
  id: 'dv-kpi-dashboard-card',
  title: 'KPI Dashboard Card',
  description: 'Clean dashboard card with metric, label and trend indicator.',
  category: 'data-visualization',
  tags: ['kpi', 'dashboard', 'card', 'metric'],
  featured: true,
  configSchema: [
    { key: 'label', label: 'KPI Label', type: 'text', defaultValue: 'Monthly Active Users', group: 'Content' },
    { key: 'value', label: 'KPI Value', type: 'text', defaultValue: '45.2K', group: 'Content' },
    { key: 'trend', label: 'Trend', type: 'text', defaultValue: '+12.5%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
  defaultConfig: { label: 'Monthly Active Users', value: '45.2K', trend: '+12.5%', bgColor: '#111827', accentColor: '#6366f1' },
  motionDesignDescription: {
    name: 'KPI Dashboard Card',
    description: 'Dashboard card with metric and trend.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'card-bg', type: 'rect', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 180, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.9, y: 20 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0.95 }, easing: 'easeIn' } } },
      { id: 'card-label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'card-value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 800, color: '#f9fafb' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 15 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'card-trend', type: 'text', text: '{{trend}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 600, color: '{{accentColor}}' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'accent-line', type: 'rect', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 3, backgroundColor: '{{accentColor}}', borderRadius: 2 }, animation: { enterDelay: 0.05, enter: { from: { scaleX: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv009: BundledTemplate = {
  id: 'dv-progress-bar-fill',
  title: 'Progress Bar Fill',
  description: 'Sleek progress bar fills from left to right with percentage label.',
  category: 'data-visualization',
  tags: ['progress', 'bar', 'fill', 'loading'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Project Completion', group: 'Content' },
    { key: 'value', label: 'Percentage', type: 'text', defaultValue: '73%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#8b5cf6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e4e4e7', group: 'Style' },
  ],
  defaultConfig: { label: 'Project Completion', value: '73%', bgColor: '#0a0a0a', fillColor: '#8b5cf6', textColor: '#e4e4e7' },
  motionDesignDescription: {
    name: 'Progress Bar Fill',
    description: 'Progress bar fills from left with percentage.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '35%', left: '12%', fontSize: 20, fontWeight: 600, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar-track', type: 'rect', style: { position: 'absolute', top: '48%', left: '12%', width: 260, height: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar-fill', type: 'rect', style: { position: 'absolute', top: '48%', left: '12%', width: 190, height: 14, backgroundColor: '{{fillColor}}', borderRadius: 7 }, animation: { enterDelay: 0.2, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'pct', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '58%', right: '12%', fontSize: 36, fontWeight: 800, color: '{{fillColor}}' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv010: BundledTemplate = {
  id: 'dv-ranking-leaderboard',
  title: 'Ranking Leaderboard',
  description: 'Top 3 ranking bars slide in staggered to reveal leaderboard positions.',
  category: 'data-visualization',
  tags: ['ranking', 'leaderboard', 'top', 'positions'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Top Performers', group: 'Content' },
    { key: 'value', label: '#1 Score', type: 'text', defaultValue: '98.5', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1917', group: 'Style' },
    { key: 'goldColor', label: 'Gold', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
  ],
  defaultConfig: { label: 'Top Performers', value: '98.5', bgColor: '#1c1917', goldColor: '#fbbf24', textColor: '#fafaf9' },
  motionDesignDescription: {
    name: 'Ranking Leaderboard',
    description: 'Top 3 ranking bars slide in staggered.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 700, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'rank1', type: 'rect', style: { position: 'absolute', top: '30%', left: '10%', width: 240, height: 36, backgroundColor: '{{goldColor}}', borderRadius: 8 }, animation: { enterDelay: 0.15, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'rank2', type: 'rect', style: { position: 'absolute', top: '48%', left: '10%', width: 180, height: 36, backgroundColor: '#9ca3af', borderRadius: 8 }, animation: { enterDelay: 0.25, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'rank3', type: 'rect', style: { position: 'absolute', top: '66%', left: '10%', width: 130, height: 36, backgroundColor: '#b45309', borderRadius: 8 }, animation: { enterDelay: 0.35, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'score', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '82%', left: '50%', transform: 'translateX(-50%)', fontSize: 32, fontWeight: 800, color: '{{goldColor}}' }, animation: { enterDelay: 0.45, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv011: BundledTemplate = {
  id: 'dv-line-graph-draw',
  title: 'Line Graph Draw',
  description: 'Animated line draws across the screen to show a trend.',
  category: 'data-visualization',
  tags: ['line', 'graph', 'trend', 'draw'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Metric', type: 'text', defaultValue: 'Sales Trend', group: 'Content' },
    { key: 'value', label: 'Current Value', type: 'text', defaultValue: '$84K', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#38bdf8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
  defaultConfig: { label: 'Sales Trend', value: '$84K', bgColor: '#0f172a', lineColor: '#38bdf8', textColor: '#e2e8f0' },
  motionDesignDescription: {
    name: 'Line Graph Draw',
    description: 'Line draws across screen showing trend.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.6,
    exitDuration: 0.2,
    elements: [
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '15%', left: '10%', fontSize: 20, fontWeight: 600, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'line-seg1', type: 'rect', style: { position: 'absolute', top: '55%', left: '10%', width: 70, height: 3, backgroundColor: '{{lineColor}}', borderRadius: 2, transform: 'rotate(-15deg)' }, animation: { enterDelay: 0.1, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'line-seg2', type: 'rect', style: { position: 'absolute', top: '48%', left: '30%', width: 70, height: 3, backgroundColor: '{{lineColor}}', borderRadius: 2, transform: 'rotate(10deg)' }, animation: { enterDelay: 0.2, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'line-seg3', type: 'rect', style: { position: 'absolute', top: '40%', left: '52%', width: 80, height: 3, backgroundColor: '{{lineColor}}', borderRadius: 2, transform: 'rotate(-20deg)' }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'endpoint', type: 'circle', style: { position: 'absolute', top: '33%', right: '15%', width: 14, height: 14, backgroundColor: '{{lineColor}}', borderRadius: '50%' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '25%', right: '10%', fontSize: 36, fontWeight: 800, color: '{{lineColor}}' }, animation: { enterDelay: 0.5, enter: { from: { opacity: 0, y: 10 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv012: BundledTemplate = {
  id: 'dv-gauge-meter',
  title: 'Gauge Meter',
  description: 'Semi-circular gauge fills to indicate a value on a scale.',
  category: 'data-visualization',
  tags: ['gauge', 'meter', 'speedometer', 'dial'],
  featured: true,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Performance', group: 'Content' },
    { key: 'value', label: 'Score', type: 'text', defaultValue: '87', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0a09', group: 'Style' },
    { key: 'gaugeColor', label: 'Gauge Color', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
  ],
  defaultConfig: { label: 'Performance', value: '87', bgColor: '#0c0a09', gaugeColor: '#f59e0b', textColor: '#fafaf9' },
  motionDesignDescription: {
    name: 'Gauge Meter',
    description: 'Semi-circular gauge fills to indicate value.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.6,
    exitDuration: 0.2,
    elements: [
      { id: 'gauge-bg', type: 'circle', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', border: '14px solid rgba(255,255,255,0.08)', borderBottomColor: 'transparent' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'gauge-fill', type: 'circle', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', border: '14px solid {{gaugeColor}}', borderBottomColor: 'transparent', borderRightColor: 'transparent' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, rotate: -90, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0, rotate: -45 }, easing: 'easeIn' } } },
      { id: 'needle', type: 'rect', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%) rotate(-30deg)', width: 4, height: 70, backgroundColor: '{{textColor}}', borderRadius: 2, transformOrigin: 'bottom center' }, animation: { enterDelay: 0.3, enter: { from: { rotate: -90, opacity: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'score', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', fontSize: 52, fontWeight: 900, color: '{{gaugeColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '{{textColor}}', opacity: 0.6 }, animation: { enterDelay: 0.5, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv013: BundledTemplate = {
  id: 'dv-stock-ticker',
  title: 'Stock Ticker',
  description: 'Stock price reveal with ticker symbol and change indicator.',
  category: 'data-visualization',
  tags: ['stock', 'ticker', 'price', 'finance'],
  featured: false,
  configSchema: [
    { key: 'ticker', label: 'Ticker', type: 'text', defaultValue: 'AAPL', group: 'Content' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '$178.42', group: 'Content' },
    { key: 'change', label: 'Change', type: 'text', defaultValue: '+2.34%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
  defaultConfig: { ticker: 'AAPL', price: '$178.42', change: '+2.34%', bgColor: '#0a0a0a', accentColor: '#22c55e' },
  motionDesignDescription: {
    name: 'Stock Ticker',
    description: 'Stock price reveal with ticker and change.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.4,
    exitDuration: 0.2,
    elements: [
      { id: 'ticker-sym', type: 'text', text: '{{ticker}}', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 700, color: '#6b7280', letterSpacing: 4 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'price', type: 'text', text: '{{price}}', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 900, color: '#f9fafb' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'change-badge', type: 'rect', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', width: 100, height: 36, backgroundColor: '{{accentColor}}', borderRadius: 18, opacity: 0.15 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'change', type: 'text', text: '{{change}}', style: { position: 'absolute', top: '59%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 700, color: '{{accentColor}}' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 10 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv014: BundledTemplate = {
  id: 'dv-survey-results',
  title: 'Survey Results',
  description: 'Stacked horizontal bars showing poll/survey response distribution.',
  category: 'data-visualization',
  tags: ['survey', 'poll', 'results', 'responses'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Question', type: 'text', defaultValue: 'Customer Satisfaction', group: 'Content' },
    { key: 'value', label: 'Top Answer %', type: 'text', defaultValue: '72%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
    { key: 'barColor', label: 'Primary Bar', type: 'color', defaultValue: '#2563eb', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1e293b', group: 'Style' },
  ],
  defaultConfig: { label: 'Customer Satisfaction', value: '72%', bgColor: '#fafaf9', barColor: '#2563eb', textColor: '#1e293b' },
  motionDesignDescription: {
    name: 'Survey Results',
    description: 'Stacked bars showing poll results.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'question', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '15%', left: '10%', fontSize: 22, fontWeight: 700, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar-excellent', type: 'rect', style: { position: 'absolute', top: '32%', left: '10%', width: 220, height: 28, backgroundColor: '{{barColor}}', borderRadius: 6 }, animation: { enterDelay: 0.1, enter: { from: { scaleX: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'bar-good', type: 'rect', style: { position: 'absolute', top: '48%', left: '10%', width: 150, height: 28, backgroundColor: '{{barColor}}', borderRadius: 6, opacity: 0.7 }, animation: { enterDelay: 0.2, enter: { from: { scaleX: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'bar-avg', type: 'rect', style: { position: 'absolute', top: '64%', left: '10%', width: 80, height: 28, backgroundColor: '{{barColor}}', borderRadius: 6, opacity: 0.4 }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'top-pct', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '12%', right: '10%', fontSize: 40, fontWeight: 800, color: '{{barColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv015: BundledTemplate = {
  id: 'dv-score-rating-stars',
  title: 'Score Rating Stars',
  description: 'Star rating reveal with numeric score and label.',
  category: 'data-visualization',
  tags: ['score', 'rating', 'stars', 'review'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'User Rating', group: 'Content' },
    { key: 'value', label: 'Score', type: 'text', defaultValue: '4.8', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'starColor', label: 'Star Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'textColor', label: 'Text', type: 'color', defaultValue: '#e4e4e7', group: 'Style' },
  ],
  defaultConfig: { label: 'User Rating', value: '4.8', bgColor: '#18181b', starColor: '#fbbf24', textColor: '#e4e4e7' },
  motionDesignDescription: {
    name: 'Score Rating Stars',
    description: 'Star rating with numeric score.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'star1', type: 'circle', style: { position: 'absolute', top: '35%', left: '18%', width: 32, height: 32, backgroundColor: '{{starColor}}', borderRadius: 4 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0, rotate: -180 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'star2', type: 'circle', style: { position: 'absolute', top: '35%', left: '30%', width: 32, height: 32, backgroundColor: '{{starColor}}', borderRadius: 4 }, animation: { enterDelay: 0.08, enter: { from: { opacity: 0, scale: 0, rotate: -180 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'star3', type: 'circle', style: { position: 'absolute', top: '35%', left: '42%', width: 32, height: 32, backgroundColor: '{{starColor}}', borderRadius: 4 }, animation: { enterDelay: 0.16, enter: { from: { opacity: 0, scale: 0, rotate: -180 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'score', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '33%', right: '15%', fontSize: 48, fontWeight: 900, color: '{{starColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0.3 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '{{textColor}}', opacity: 0.6 }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv016: BundledTemplate = {
  id: 'dv-funnel-chart',
  title: 'Funnel Chart',
  description: 'Funnel stages narrow progressively to show conversion flow.',
  category: 'data-visualization',
  tags: ['funnel', 'conversion', 'stages', 'flow'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Conversion Funnel', group: 'Content' },
    { key: 'value', label: 'Final %', type: 'text', defaultValue: '3.2%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'funnelColor', label: 'Funnel Color', type: 'color', defaultValue: '#a78bfa', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
  defaultConfig: { label: 'Conversion Funnel', value: '3.2%', bgColor: '#0f172a', funnelColor: '#a78bfa', textColor: '#e2e8f0' },
  motionDesignDescription: {
    name: 'Funnel Chart',
    description: 'Narrowing funnel stages show conversion.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, fontWeight: 700, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'stage1', type: 'rect', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 240, height: 32, backgroundColor: '{{funnelColor}}', borderRadius: 4 }, animation: { enterDelay: 0.1, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'stage2', type: 'rect', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 32, backgroundColor: '{{funnelColor}}', borderRadius: 4, opacity: 0.75 }, animation: { enterDelay: 0.2, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'stage3', type: 'rect', style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', width: 120, height: 32, backgroundColor: '{{funnelColor}}', borderRadius: 4, opacity: 0.5 }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'stage4', type: 'rect', style: { position: 'absolute', top: '70%', left: '50%', transform: 'translateX(-50%)', width: 60, height: 32, backgroundColor: '{{funnelColor}}', borderRadius: 4, opacity: 0.3 }, animation: { enterDelay: 0.4, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'conv-rate', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', fontSize: 32, fontWeight: 800, color: '{{funnelColor}}' }, animation: { enterDelay: 0.5, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv017: BundledTemplate = {
  id: 'dv-scatter-plot-burst',
  title: 'Scatter Plot Burst',
  description: 'Data points burst onto the canvas like scattered stars.',
  category: 'data-visualization',
  tags: ['scatter', 'plot', 'dots', 'burst'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Data Distribution', group: 'Content' },
    { key: 'value', label: 'Correlation', type: 'text', defaultValue: 'r=0.87', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020617', group: 'Style' },
    { key: 'dotColor', label: 'Dot Color', type: 'color', defaultValue: '#f472b6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
  defaultConfig: { label: 'Data Distribution', value: 'r=0.87', bgColor: '#020617', dotColor: '#f472b6', textColor: '#e2e8f0' },
  motionDesignDescription: {
    name: 'Scatter Plot Burst',
    description: 'Data points burst onto canvas.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'dot1', type: 'circle', style: { position: 'absolute', top: '30%', left: '20%', width: 16, height: 16, backgroundColor: '{{dotColor}}', borderRadius: '50%' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'dot2', type: 'circle', style: { position: 'absolute', top: '45%', left: '35%', width: 12, height: 12, backgroundColor: '{{dotColor}}', borderRadius: '50%', opacity: 0.8 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'dot3', type: 'circle', style: { position: 'absolute', top: '55%', left: '50%', width: 18, height: 18, backgroundColor: '{{dotColor}}', borderRadius: '50%' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'dot4', type: 'circle', style: { position: 'absolute', top: '38%', left: '65%', width: 14, height: 14, backgroundColor: '{{dotColor}}', borderRadius: '50%', opacity: 0.7 }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'dot5', type: 'circle', style: { position: 'absolute', top: '25%', left: '75%', width: 10, height: 10, backgroundColor: '{{dotColor}}', borderRadius: '50%', opacity: 0.6 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'corr', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '15%', right: '10%', fontSize: 28, fontWeight: 700, color: '{{textColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 15 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv018: BundledTemplate = {
  id: 'dv-timeline-milestone',
  title: 'Timeline Milestone',
  description: 'Vertical timeline with milestone dots appearing in sequence.',
  category: 'data-visualization',
  tags: ['timeline', 'milestone', 'history', 'sequence'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Project Timeline', group: 'Content' },
    { key: 'value', label: 'Current Phase', type: 'text', defaultValue: 'Phase 3', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1b4b', group: 'Style' },
    { key: 'dotColor', label: 'Dot Color', type: 'color', defaultValue: '#818cf8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e7ff', group: 'Style' },
  ],
  defaultConfig: { label: 'Project Timeline', value: 'Phase 3', bgColor: '#1e1b4b', dotColor: '#818cf8', textColor: '#e0e7ff' },
  motionDesignDescription: {
    name: 'Timeline Milestone',
    description: 'Vertical timeline with milestone dots.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'line', type: 'rect', style: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 3, height: 200, backgroundColor: 'rgba(255,255,255,0.15)' }, animation: { enterDelay: 0, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'dot1', type: 'circle', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 18, height: 18, backgroundColor: '{{dotColor}}', borderRadius: '50%', opacity: 0.4 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'dot2', type: 'circle', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', width: 18, height: 18, backgroundColor: '{{dotColor}}', borderRadius: '50%', opacity: 0.6 }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'dot3', type: 'circle', style: { position: 'absolute', top: '62%', left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, backgroundColor: '{{dotColor}}', borderRadius: '50%' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, hold: { effect: 'pulse', amplitude: 0.1, speed: 2 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'phase', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 700, color: '{{dotColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 15 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv019: BundledTemplate = {
  id: 'dv-pie-chart-explode',
  title: 'Pie Chart Explode',
  description: 'Pie chart segments explode outward from center.',
  category: 'data-visualization',
  tags: ['pie', 'chart', 'explode', 'segments'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Market Share', group: 'Content' },
    { key: 'value', label: 'Main Segment', type: 'text', defaultValue: '42%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'primaryColor', label: 'Primary', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'textColor', label: 'Text', type: 'color', defaultValue: '#f3f4f6', group: 'Style' },
  ],
  defaultConfig: { label: 'Market Share', value: '42%', bgColor: '#111827', primaryColor: '#3b82f6', textColor: '#f3f4f6' },
  motionDesignDescription: {
    name: 'Pie Chart Explode',
    description: 'Pie segments explode from center.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'seg1', type: 'circle', style: { position: 'absolute', top: '28%', left: '38%', width: 80, height: 80, backgroundColor: '{{primaryColor}}', borderRadius: '50% 50% 0 0' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0, rotate: -90 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'seg2', type: 'circle', style: { position: 'absolute', top: '28%', left: '52%', width: 60, height: 60, backgroundColor: '#60a5fa', borderRadius: '50% 0 0 50%' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0, rotate: 90 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'seg3', type: 'circle', style: { position: 'absolute', top: '48%', left: '45%', width: 50, height: 50, backgroundColor: '#93c5fd', borderRadius: '0 0 50% 50%' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0, rotate: 180 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'pct', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '68%', left: '50%', transform: 'translateX(-50%)', fontSize: 44, fontWeight: 800, color: '{{primaryColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '{{textColor}}', opacity: 0.6 }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv020: BundledTemplate = {
  id: 'dv-multi-metric-dashboard',
  title: 'Multi-Metric Dashboard',
  description: 'Three metric cards appear in a grid formation.',
  category: 'data-visualization',
  tags: ['dashboard', 'multi', 'metrics', 'grid'],
  featured: true,
  configSchema: [
    { key: 'label', label: 'Header', type: 'text', defaultValue: 'Q4 Metrics', group: 'Content' },
    { key: 'value', label: 'Primary Value', type: 'text', defaultValue: '$2.4M', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'cardColor', label: 'Card Accent', type: 'color', defaultValue: '#6366f1', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
  defaultConfig: { label: 'Q4 Metrics', value: '$2.4M', bgColor: '#0f172a', cardColor: '#6366f1', textColor: '#e2e8f0' },
  motionDesignDescription: {
    name: 'Multi-Metric Dashboard',
    description: 'Three metric cards in a grid.',
    background: '{{bgColor}}',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.5,
    exitDuration: 0.2,
    elements: [
      { id: 'header', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, fontWeight: 700, color: '{{textColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'card1', type: 'rect', style: { position: 'absolute', top: '22%', left: '8%', width: 120, height: 80, backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 20, scale: 0.9 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0.9 }, easing: 'easeIn' } } },
      { id: 'card2', type: 'rect', style: { position: 'absolute', top: '22%', right: '8%', width: 120, height: 80, backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, y: 20, scale: 0.9 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0.9 }, easing: 'easeIn' } } },
      { id: 'main-value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', fontSize: 52, fontWeight: 900, color: '{{cardColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0.3 }, easing: 'elasticOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bottom-line', type: 'rect', style: { position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 2, backgroundColor: '{{cardColor}}', opacity: 0.3 }, animation: { enterDelay: 0.4, enter: { from: { scaleX: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv021: BundledTemplate = {
  id: 'dv-trend-line-glow',
  title: 'Trend Line Glow',
  description: 'Glowing trend line traces upward path with data label.',
  category: 'data-visualization',
  tags: ['trend', 'line', 'glow', 'upward'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Metric', type: 'text', defaultValue: 'Growth Rate', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '+34%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020617', group: 'Style' },
    { key: 'glowColor', label: 'Glow Color', type: 'color', defaultValue: '#06b6d4', group: 'Style' },
  ],
  defaultConfig: { label: 'Growth Rate', value: '+34%', bgColor: '#020617', glowColor: '#06b6d4' },
  motionDesignDescription: {
    name: 'Trend Line Glow', description: 'Glowing trend line upward.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'glow-area', type: 'rect', style: { position: 'absolute', top: '40%', left: '10%', width: 260, height: 60, backgroundColor: '{{glowColor}}', opacity: 0.05, borderRadius: 30 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scaleX: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'line1', type: 'rect', style: { position: 'absolute', top: '55%', left: '10%', width: 90, height: 3, backgroundColor: '{{glowColor}}', borderRadius: 2, transform: 'rotate(-5deg)' }, animation: { enterDelay: 0.1, enter: { from: { scaleX: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'line2', type: 'rect', style: { position: 'absolute', top: '48%', left: '38%', width: 90, height: 3, backgroundColor: '{{glowColor}}', borderRadius: 2, transform: 'rotate(-12deg)' }, animation: { enterDelay: 0.2, enter: { from: { scaleX: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'line3', type: 'rect', style: { position: 'absolute', top: '36%', left: '64%', width: 80, height: 3, backgroundColor: '{{glowColor}}', borderRadius: 2, transform: 'rotate(-18deg)' }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '22%', right: '10%', fontSize: 42, fontWeight: 800, color: '{{glowColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '#94a3b8' }, animation: { enterDelay: 0.45, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv022: BundledTemplate = {
  id: 'dv-map-data-points',
  title: 'Map Data Points',
  description: 'Data points ping onto a map-like grid representing locations.',
  category: 'data-visualization',
  tags: ['map', 'location', 'points', 'geo'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Global Reach', group: 'Content' },
    { key: 'value', label: 'Count', type: 'text', defaultValue: '142 Cities', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0a09', group: 'Style' },
    { key: 'dotColor', label: 'Dot Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { label: 'Global Reach', value: '142 Cities', bgColor: '#0c0a09', dotColor: '#ef4444' },
  motionDesignDescription: {
    name: 'Map Data Points', description: 'Points ping onto map grid.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'grid-h1', type: 'rect', style: { position: 'absolute', top: '35%', left: '5%', width: 280, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'grid-h2', type: 'rect', style: { position: 'absolute', top: '55%', left: '5%', width: 280, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'pin1', type: 'circle', style: { position: 'absolute', top: '30%', left: '25%', width: 12, height: 12, backgroundColor: '{{dotColor}}', borderRadius: '50%' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0, y: -20 }, easing: 'bounceOut' }, hold: { effect: 'pulse', amplitude: 0.2, speed: 3 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'pin2', type: 'circle', style: { position: 'absolute', top: '45%', left: '55%', width: 12, height: 12, backgroundColor: '{{dotColor}}', borderRadius: '50%' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0, y: -20 }, easing: 'bounceOut' }, hold: { effect: 'pulse', amplitude: 0.2, speed: 3 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'pin3', type: 'circle', style: { position: 'absolute', top: '38%', left: '72%', width: 12, height: 12, backgroundColor: '{{dotColor}}', borderRadius: '50%' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0, y: -20 }, easing: 'bounceOut' }, hold: { effect: 'pulse', amplitude: 0.2, speed: 3 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'count', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', fontSize: 32, fontWeight: 800, color: '{{dotColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 15 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv023: BundledTemplate = {
  id: 'dv-pyramid-layers',
  title: 'Pyramid Layers',
  description: 'Stacked pyramid layers build from bottom to top.',
  category: 'data-visualization',
  tags: ['pyramid', 'layers', 'hierarchy', 'stack'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Priority Pyramid', group: 'Content' },
    { key: 'value', label: 'Top Value', type: 'text', defaultValue: 'Critical', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1917', group: 'Style' },
    { key: 'pyramidColor', label: 'Color', type: 'color', defaultValue: '#f97316', group: 'Style' },
  ],
  defaultConfig: { label: 'Priority Pyramid', value: 'Critical', bgColor: '#1c1917', pyramidColor: '#f97316' },
  motionDesignDescription: {
    name: 'Pyramid Layers', description: 'Pyramid layers build bottom to top.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'base', type: 'rect', style: { position: 'absolute', top: '70%', left: '50%', transform: 'translateX(-50%)', width: 240, height: 28, backgroundColor: '{{pyramidColor}}', borderRadius: 4, opacity: 0.3 }, animation: { enterDelay: 0, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'mid1', type: 'rect', style: { position: 'absolute', top: '56%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 28, backgroundColor: '{{pyramidColor}}', borderRadius: 4, opacity: 0.5 }, animation: { enterDelay: 0.1, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'mid2', type: 'rect', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', width: 120, height: 28, backgroundColor: '{{pyramidColor}}', borderRadius: 4, opacity: 0.7 }, animation: { enterDelay: 0.2, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'top', type: 'rect', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 60, height: 28, backgroundColor: '{{pyramidColor}}', borderRadius: 4 }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0, opacity: 0 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.05, speed: 2 }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'top-label', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '16%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 800, color: '{{pyramidColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: -10 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv024: BundledTemplate = {
  id: 'dv-dual-bar-comparison',
  title: 'Dual Bar Comparison',
  description: 'Two colored bars grow side by side for A/B comparison.',
  category: 'data-visualization',
  tags: ['comparison', 'dual', 'bars', 'ab-test'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'A/B Test Results', group: 'Content' },
    { key: 'value', label: 'Winner', type: 'text', defaultValue: 'Variant B +23%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'colorA', label: 'Color A', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'colorB', label: 'Color B', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
  defaultConfig: { label: 'A/B Test Results', value: 'Variant B +23%', bgColor: '#18181b', colorA: '#ef4444', colorB: '#22c55e' },
  motionDesignDescription: {
    name: 'Dual Bar Comparison', description: 'Two bars grow side by side.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, fontWeight: 700, color: '#e4e4e7' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'barA', type: 'rect', style: { position: 'absolute', bottom: '30%', left: '25%', width: 50, height: 140, backgroundColor: '{{colorA}}', borderRadius: 6 }, animation: { enterDelay: 0.1, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'barB', type: 'rect', style: { position: 'absolute', bottom: '30%', right: '25%', width: 50, height: 190, backgroundColor: '{{colorB}}', borderRadius: 6 }, animation: { enterDelay: 0.2, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'labelA', type: 'text', text: 'A', style: { position: 'absolute', bottom: '22%', left: '28%', fontSize: 18, fontWeight: 700, color: '{{colorA}}' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'labelB', type: 'text', text: 'B', style: { position: 'absolute', bottom: '22%', right: '28%', fontSize: 18, fontWeight: 700, color: '{{colorB}}' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'winner', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, fontWeight: 700, color: '{{colorB}}' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, y: 10 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv025: BundledTemplate = {
  id: 'dv-radial-progress',
  title: 'Radial Progress',
  description: 'Radial arc sweeps around to show progress percentage.',
  category: 'data-visualization',
  tags: ['radial', 'progress', 'arc', 'sweep'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Upload', group: 'Content' },
    { key: 'value', label: 'Percentage', type: 'text', defaultValue: '92%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'arcColor', label: 'Arc Color', type: 'color', defaultValue: '#14b8a6', group: 'Style' },
  ],
  defaultConfig: { label: 'Upload', value: '92%', bgColor: '#0a0a0a', arcColor: '#14b8a6' },
  motionDesignDescription: {
    name: 'Radial Progress', description: 'Radial arc sweeps for progress.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'track', type: 'circle', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, borderRadius: '50%', border: '10px solid rgba(255,255,255,0.06)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.7 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'arc', type: 'circle', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, borderRadius: '50%', border: '10px solid {{arcColor}}', borderRightColor: 'transparent' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, rotate: -180, scale: 0.7 }, easing: 'backOut' }, exit: { to: { opacity: 0, rotate: 90 }, easing: 'easeIn' } } },
      { id: 'pct', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 44, fontWeight: 900, color: '{{arcColor}}' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 500, color: '#a1a1aa' }, animation: { enterDelay: 0.45, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv026: BundledTemplate = {
  id: 'dv-stacked-bar',
  title: 'Stacked Bar Chart',
  description: 'Stacked segments within bars show proportional data.',
  category: 'data-visualization',
  tags: ['stacked', 'bar', 'proportional', 'segments'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Revenue by Channel', group: 'Content' },
    { key: 'value', label: 'Total', type: 'text', defaultValue: '$5.8M', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'color1', label: 'Color 1', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'color2', label: 'Color 2', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
  defaultConfig: { label: 'Revenue by Channel', value: '$5.8M', bgColor: '#111827', color1: '#3b82f6', color2: '#f59e0b' },
  motionDesignDescription: {
    name: 'Stacked Bar Chart', description: 'Stacked bar segments show proportions.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 700, color: '#e5e7eb' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'seg1a', type: 'rect', style: { position: 'absolute', bottom: '25%', left: '15%', width: 40, height: 80, backgroundColor: '{{color1}}', borderRadius: '4px 4px 0 0' }, animation: { enterDelay: 0.1, enter: { from: { scaleY: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'seg1b', type: 'rect', style: { position: 'absolute', bottom: '50%', left: '15%', width: 40, height: 40, backgroundColor: '{{color2}}', borderRadius: '4px 4px 0 0' }, animation: { enterDelay: 0.15, enter: { from: { scaleY: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'seg2a', type: 'rect', style: { position: 'absolute', bottom: '25%', left: '45%', width: 40, height: 120, backgroundColor: '{{color1}}', borderRadius: '4px 4px 0 0' }, animation: { enterDelay: 0.2, enter: { from: { scaleY: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'seg2b', type: 'rect', style: { position: 'absolute', bottom: '62%', left: '45%', width: 40, height: 30, backgroundColor: '{{color2}}', borderRadius: '4px 4px 0 0' }, animation: { enterDelay: 0.25, enter: { from: { scaleY: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'total', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '12%', right: '10%', fontSize: 36, fontWeight: 800, color: '{{color1}}' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv027: BundledTemplate = {
  id: 'dv-big-number-drop',
  title: 'Big Number Drop',
  description: 'A massive number drops from above with impact effect.',
  category: 'data-visualization',
  tags: ['number', 'big', 'drop', 'impact'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Downloads', group: 'Content' },
    { key: 'value', label: 'Number', type: 'text', defaultValue: '10M+', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'numColor', label: 'Number Color', type: 'color', defaultValue: '#f43f5e', group: 'Style' },
  ],
  defaultConfig: { label: 'Downloads', value: '10M+', bgColor: '#0f172a', numColor: '#f43f5e' },
  motionDesignDescription: {
    name: 'Big Number Drop', description: 'Massive number drops from above.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'impact-ring', type: 'circle', style: { position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)', width: 200, height: 200, borderRadius: '50%', border: '2px solid {{numColor}}', opacity: 0.2 }, animation: { enterDelay: 0.2, enter: { from: { scale: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scale: 2, opacity: 0 }, easing: 'easeIn' } } },
      { id: 'number', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', fontSize: 80, fontWeight: 900, color: '{{numColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, y: -200, scale: 1.5 }, easing: 'bounceOut' }, exit: { to: { opacity: 0, y: 50 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '62%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, fontWeight: 600, color: '#94a3b8' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 15 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'line', type: 'rect', style: { position: 'absolute', top: '56%', left: '50%', transform: 'translateX(-50%)', width: 100, height: 2, backgroundColor: '{{numColor}}', opacity: 0.4 }, animation: { enterDelay: 0.25, enter: { from: { scaleX: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv028: BundledTemplate = {
  id: 'dv-speedometer',
  title: 'Speedometer',
  description: 'Speedometer dial with needle sweeping to target value.',
  category: 'data-visualization',
  tags: ['speedometer', 'dial', 'speed', 'gauge'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Page Speed', group: 'Content' },
    { key: 'value', label: 'Score', type: 'text', defaultValue: '96', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'dialColor', label: 'Dial Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
  defaultConfig: { label: 'Page Speed', value: '96', bgColor: '#0a0a0a', dialColor: '#22c55e' },
  motionDesignDescription: {
    name: 'Speedometer', description: 'Speedometer with sweeping needle.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.6, exitDuration: 0.2,
    elements: [
      { id: 'outer', type: 'circle', style: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'arc-green', type: 'circle', style: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', border: '8px solid {{dialColor}}', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, rotate: -90 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'needle', type: 'rect', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 3, height: 60, backgroundColor: '#ffffff', borderRadius: 2, transformOrigin: 'bottom center' }, animation: { enterDelay: 0.2, enter: { from: { rotate: -90, opacity: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'center-dot', type: 'circle', style: { position: 'absolute', top: '48%', left: '50%', transform: 'translate(-50%,-50%)', width: 16, height: 16, backgroundColor: '#ffffff', borderRadius: '50%' }, animation: { enterDelay: 0.25, enter: { from: { scale: 0 }, easing: 'backOut' }, exit: { to: { scale: 0 }, easing: 'easeIn' } } },
      { id: 'score', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 900, color: '{{dialColor}}' }, animation: { enterDelay: 0.35, enter: { from: { opacity: 0, scale: 0.3 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '#71717a' }, animation: { enterDelay: 0.45, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv029: BundledTemplate = {
  id: 'dv-waterfall-chart',
  title: 'Waterfall Chart',
  description: 'Connected bars stepping up and down showing cumulative effect.',
  category: 'data-visualization',
  tags: ['waterfall', 'cumulative', 'steps', 'financial'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Revenue Breakdown', group: 'Content' },
    { key: 'value', label: 'Net', type: 'text', defaultValue: '+$340K', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1b4b', group: 'Style' },
    { key: 'upColor', label: 'Up Color', type: 'color', defaultValue: '#34d399', group: 'Style' },
    { key: 'downColor', label: 'Down Color', type: 'color', defaultValue: '#f87171', group: 'Style' },
  ],
  defaultConfig: { label: 'Revenue Breakdown', value: '+$340K', bgColor: '#1e1b4b', upColor: '#34d399', downColor: '#f87171' },
  motionDesignDescription: {
    name: 'Waterfall Chart', description: 'Steps up and down showing cumulative.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 700, color: '#e0e7ff' }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'step1', type: 'rect', style: { position: 'absolute', bottom: '30%', left: '10%', width: 36, height: 100, backgroundColor: '{{upColor}}', borderRadius: 4 }, animation: { enterDelay: 0.08, enter: { from: { scaleY: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'step2', type: 'rect', style: { position: 'absolute', bottom: '55%', left: '28%', width: 36, height: 60, backgroundColor: '{{upColor}}', borderRadius: 4 }, animation: { enterDelay: 0.16, enter: { from: { scaleY: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'step3', type: 'rect', style: { position: 'absolute', bottom: '55%', left: '46%', width: 36, height: 40, backgroundColor: '{{downColor}}', borderRadius: 4 }, animation: { enterDelay: 0.24, enter: { from: { scaleY: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'step4', type: 'rect', style: { position: 'absolute', bottom: '40%', left: '64%', width: 36, height: 70, backgroundColor: '{{upColor}}', borderRadius: 4 }, animation: { enterDelay: 0.32, enter: { from: { scaleY: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'net', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '12%', right: '10%', fontSize: 32, fontWeight: 800, color: '{{upColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv030: BundledTemplate = {
  id: 'dv-minimal-stat-card',
  title: 'Minimal Stat Card',
  description: 'Clean white card with large centered stat and thin accent.',
  category: 'data-visualization',
  tags: ['minimal', 'card', 'stat', 'clean'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Conversion Rate', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '4.7%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#2563eb', group: 'Style' },
    { key: 'textColor', label: 'Text', type: 'color', defaultValue: '#1e293b', group: 'Style' },
  ],
  defaultConfig: { label: 'Conversion Rate', value: '4.7%', bgColor: '#ffffff', accentColor: '#2563eb', textColor: '#1e293b' },
  motionDesignDescription: {
    name: 'Minimal Stat Card', description: 'Clean card with centered stat.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'accent-top', type: 'rect', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 50, height: 3, backgroundColor: '{{accentColor}}', borderRadius: 2 }, animation: { enterDelay: 0, enter: { from: { scaleX: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 900, color: '{{textColor}}' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, y: 20 }, easing: 'backOut' }, exit: { to: { opacity: 0, y: -10 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 500, color: '#64748b' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv031: BundledTemplate = {
  id: 'dv-revenue-split',
  title: 'Revenue Split',
  description: 'Three colored bars split apart showing revenue distribution.',
  category: 'data-visualization',
  tags: ['revenue', 'split', 'distribution', 'bars'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Title', type: 'text', defaultValue: 'Revenue Split', group: 'Content' },
    { key: 'value', label: 'Total', type: 'text', defaultValue: '$12.8M', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'primaryColor', label: 'Primary', type: 'color', defaultValue: '#8b5cf6', group: 'Style' },
  ],
  defaultConfig: { label: 'Revenue Split', value: '$12.8M', bgColor: '#0f172a', primaryColor: '#8b5cf6' },
  motionDesignDescription: {
    name: 'Revenue Split', description: 'Bars split showing revenue distribution.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'title', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'bar1', type: 'rect', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 30, backgroundColor: '{{primaryColor}}', borderRadius: 6 }, animation: { enterDelay: 0.1, enter: { from: { scaleX: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'bar2', type: 'rect', style: { position: 'absolute', top: '45%', left: '50%', transform: 'translateX(-50%)', width: 140, height: 30, backgroundColor: '{{primaryColor}}', borderRadius: 6, opacity: 0.65 }, animation: { enterDelay: 0.2, enter: { from: { scaleX: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'bar3', type: 'rect', style: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', width: 80, height: 30, backgroundColor: '{{primaryColor}}', borderRadius: 6, opacity: 0.35 }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'total', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: 40, fontWeight: 800, color: '{{primaryColor}}' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, scale: 0.5 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv032: BundledTemplate = {
  id: 'dv-heat-indicator',
  title: 'Heat Indicator',
  description: 'Temperature-style heat bar fills with gradient intensity.',
  category: 'data-visualization',
  tags: ['heat', 'temperature', 'indicator', 'gradient'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Server Load', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '82%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'hotColor', label: 'Hot Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { label: 'Server Load', value: '82%', bgColor: '#18181b', hotColor: '#ef4444' },
  motionDesignDescription: {
    name: 'Heat Indicator', description: 'Heat bar fills with intensity.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 600, color: '#a1a1aa' }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'track', type: 'rect', style: { position: 'absolute', top: '42%', left: '15%', width: 220, height: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'fill', type: 'rect', style: { position: 'absolute', top: '42%', left: '15%', width: 180, height: 20, backgroundColor: '{{hotColor}}', borderRadius: 10 }, animation: { enterDelay: 0.15, enter: { from: { scaleX: 0 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 3 }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 900, color: '{{hotColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 15 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv033: BundledTemplate = {
  id: 'dv-bullet-chart',
  title: 'Bullet Chart',
  description: 'Bullet graph showing actual vs target with marker.',
  category: 'data-visualization',
  tags: ['bullet', 'target', 'actual', 'benchmark'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Metric', type: 'text', defaultValue: 'Sales vs Target', group: 'Content' },
    { key: 'value', label: 'Actual', type: 'text', defaultValue: '$890K', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#2563eb', group: 'Style' },
    { key: 'targetColor', label: 'Target', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
  defaultConfig: { label: 'Sales vs Target', value: '$890K', bgColor: '#111827', barColor: '#2563eb', targetColor: '#ef4444' },
  motionDesignDescription: {
    name: 'Bullet Chart', description: 'Bullet graph actual vs target.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '25%', left: '10%', fontSize: 20, fontWeight: 600, color: '#e5e7eb' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'range-bg', type: 'rect', style: { position: 'absolute', top: '42%', left: '10%', width: 260, height: 30, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'actual-bar', type: 'rect', style: { position: 'absolute', top: '45%', left: '10%', width: 200, height: 24, backgroundColor: '{{barColor}}', borderRadius: 4 }, animation: { enterDelay: 0.15, enter: { from: { scaleX: 0 }, easing: 'backOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'target-line', type: 'rect', style: { position: 'absolute', top: '40%', left: '78%', width: 4, height: 36, backgroundColor: '{{targetColor}}', borderRadius: 2 }, animation: { enterDelay: 0.25, enter: { from: { scaleY: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'value', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '62%', left: '10%', fontSize: 36, fontWeight: 800, color: '{{barColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 10 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv034: BundledTemplate = {
  id: 'dv-metric-ticker-tape',
  title: 'Metric Ticker Tape',
  description: 'Scrolling ticker style metric reveal with dash lines.',
  category: 'data-visualization',
  tags: ['ticker', 'tape', 'scroll', 'metric'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Metric', type: 'text', defaultValue: 'DAILY ACTIVE', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '23,847', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020617', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#f97316', group: 'Style' },
  ],
  defaultConfig: { label: 'DAILY ACTIVE', value: '23,847', bgColor: '#020617', accentColor: '#f97316' },
  motionDesignDescription: {
    name: 'Metric Ticker Tape', description: 'Ticker style metric reveal.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'dash1', type: 'rect', style: { position: 'absolute', top: '38%', left: '5%', width: 30, height: 2, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'dash2', type: 'rect', style: { position: 'absolute', top: '38%', right: '5%', width: 30, height: 2, backgroundColor: '{{accentColor}}', opacity: 0.3 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 600, color: '#6b7280', letterSpacing: 4 }, animation: { enterDelay: 0.05, enter: { from: { opacity: 0, x: -30 }, easing: 'easeOut' }, exit: { to: { opacity: 0, x: 30 }, easing: 'easeIn' } } },
      { id: 'number', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', fontSize: 56, fontWeight: 900, color: '{{accentColor}}', fontVariantNumeric: 'tabular-nums' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: 60 }, easing: 'backOut' }, exit: { to: { opacity: 0, x: -60 }, easing: 'easeIn' } } },
    ],
  },
}

const dv035: BundledTemplate = {
  id: 'dv-concentric-rings',
  title: 'Concentric Rings',
  description: 'Multiple concentric circles expand to show layered metrics.',
  category: 'data-visualization',
  tags: ['concentric', 'rings', 'layered', 'multi-ring'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Activity Score', group: 'Content' },
    { key: 'value', label: 'Score', type: 'text', defaultValue: '340', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#ec4899', group: 'Style' },
  ],
  defaultConfig: { label: 'Activity Score', value: '340', bgColor: '#0a0a0a', ringColor: '#ec4899' },
  motionDesignDescription: {
    name: 'Concentric Rings', description: 'Concentric circles expand.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'ring-outer', type: 'circle', style: { position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', border: '3px solid {{ringColor}}', opacity: 0.2 }, animation: { enterDelay: 0, enter: { from: { scale: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scale: 1.5, opacity: 0 }, easing: 'easeIn' } } },
      { id: 'ring-mid', type: 'circle', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 150, height: 150, borderRadius: '50%', border: '4px solid {{ringColor}}', opacity: 0.4 }, animation: { enterDelay: 0.1, enter: { from: { scale: 0, opacity: 0 }, easing: 'easeOut' }, exit: { to: { scale: 1.3, opacity: 0 }, easing: 'easeIn' } } },
      { id: 'ring-inner', type: 'circle', style: { position: 'absolute', top: '34%', left: '50%', transform: 'translateX(-50%)', width: 100, height: 100, borderRadius: '50%', border: '5px solid {{ringColor}}', opacity: 0.7 }, animation: { enterDelay: 0.2, enter: { from: { scale: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scale: 1.2, opacity: 0 }, easing: 'easeIn' } } },
      { id: 'score', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, fontWeight: 900, color: '{{ringColor}}' }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '#a1a1aa' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv036: BundledTemplate = {
  id: 'dv-data-table-row',
  title: 'Data Table Row',
  description: 'Highlighted table row slides in with key-value pair.',
  category: 'data-visualization',
  tags: ['table', 'row', 'data', 'key-value'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Key', type: 'text', defaultValue: 'Monthly Revenue', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: '$1.2M', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'rowColor', label: 'Row Color', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
  defaultConfig: { label: 'Monthly Revenue', value: '$1.2M', bgColor: '#111827', rowColor: '#6366f1' },
  motionDesignDescription: {
    name: 'Data Table Row', description: 'Table row slides in with data.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'row-bg', type: 'rect', style: { position: 'absolute', top: '42%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 50, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, x: -40, scaleX: 0.8 }, easing: 'backOut' }, exit: { to: { opacity: 0, x: 40 }, easing: 'easeIn' } } },
      { id: 'key', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '45%', left: '12%', fontSize: 16, fontWeight: 500, color: '#9ca3af' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: -20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'val', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '44%', right: '12%', fontSize: 24, fontWeight: 800, color: '{{rowColor}}' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, x: 20 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv037: BundledTemplate = {
  id: 'dv-animated-counter-box',
  title: 'Animated Counter Box',
  description: 'Boxed counter with border animation and ticking number.',
  category: 'data-visualization',
  tags: ['counter', 'box', 'border', 'animated'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Orders Today', group: 'Content' },
    { key: 'value', label: 'Count', type: 'text', defaultValue: '1,847', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020617', group: 'Style' },
    { key: 'borderColor', label: 'Border', type: 'color', defaultValue: '#06b6d4', group: 'Style' },
  ],
  defaultConfig: { label: 'Orders Today', value: '1,847', bgColor: '#020617', borderColor: '#06b6d4' },
  motionDesignDescription: {
    name: 'Animated Counter Box', description: 'Boxed counter with border animation.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'box', type: 'rect', style: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 220, height: 140, backgroundColor: 'transparent', borderRadius: 16, border: '2px solid {{borderColor}}' }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0.8 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0.9 }, easing: 'easeIn' } } },
      { id: 'number', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', fontSize: 48, fontWeight: 900, color: '{{borderColor}}' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, y: 20 }, easing: 'backOut' }, hold: { effect: 'pulse', amplitude: 0.02, speed: 1.5 }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2 }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv038: BundledTemplate = {
  id: 'dv-traffic-light',
  title: 'Traffic Light Status',
  description: 'Three-circle traffic light indicating status with glowing active circle.',
  category: 'data-visualization',
  tags: ['status', 'traffic-light', 'indicator', 'health'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'System', type: 'text', defaultValue: 'System Health', group: 'Content' },
    { key: 'value', label: 'Status', type: 'text', defaultValue: 'HEALTHY', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'activeColor', label: 'Active', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
  defaultConfig: { label: 'System Health', value: 'HEALTHY', bgColor: '#0f172a', activeColor: '#22c55e' },
  motionDesignDescription: {
    name: 'Traffic Light Status', description: 'Traffic light status indicator.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'light-red', type: 'circle', style: { position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, backgroundColor: '#ef4444', borderRadius: '50%', opacity: 0.2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'light-yellow', type: 'circle', style: { position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, backgroundColor: '#fbbf24', borderRadius: '50%', opacity: 0.2 }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, scale: 0 }, easing: 'backOut' }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'light-green', type: 'circle', style: { position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, backgroundColor: '{{activeColor}}', borderRadius: '50%' }, animation: { enterDelay: 0.2, enter: { from: { opacity: 0, scale: 0 }, easing: 'elasticOut' }, hold: { effect: 'pulse', amplitude: 0.15, speed: 2 }, exit: { to: { opacity: 0, scale: 0 }, easing: 'easeIn' } } },
      { id: 'status', type: 'text', text: '{{value}}', style: { position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 800, color: '{{activeColor}}', letterSpacing: 3 }, animation: { enterDelay: 0.3, enter: { from: { opacity: 0, y: 10 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'sys-label', type: 'text', text: '{{label}}', style: { position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 500, color: '#64748b', letterSpacing: 2 }, animation: { enterDelay: 0, enter: { from: { opacity: 0 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv039: BundledTemplate = {
  id: 'dv-profit-loss',
  title: 'Profit & Loss',
  description: 'Split screen showing profit up and loss down with net result.',
  category: 'data-visualization',
  tags: ['profit', 'loss', 'financial', 'split'],
  featured: false,
  configSchema: [
    { key: 'profit', label: 'Profit', type: 'text', defaultValue: '+$420K', group: 'Content' },
    { key: 'loss', label: 'Loss', type: 'text', defaultValue: '-$180K', group: 'Content' },
    { key: 'net', label: 'Net', type: 'text', defaultValue: 'Net: +$240K', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
  ],
  defaultConfig: { profit: '+$420K', loss: '-$180K', net: 'Net: +$240K', bgColor: '#0a0a0a' },
  motionDesignDescription: {
    name: 'Profit & Loss', description: 'Split profit up loss down.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.5, exitDuration: 0.2,
    elements: [
      { id: 'profit-arrow', type: 'rect', style: { position: 'absolute', top: '25%', left: '25%', width: 6, height: 60, backgroundColor: '#22c55e', borderRadius: 3 }, animation: { enterDelay: 0, enter: { from: { scaleY: 0, y: 30 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'profit-val', type: 'text', text: '{{profit}}', style: { position: 'absolute', top: '28%', left: '35%', fontSize: 36, fontWeight: 800, color: '#22c55e' }, animation: { enterDelay: 0.1, enter: { from: { opacity: 0, x: -20 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'loss-arrow', type: 'rect', style: { position: 'absolute', top: '50%', left: '25%', width: 6, height: 40, backgroundColor: '#ef4444', borderRadius: 3 }, animation: { enterDelay: 0.15, enter: { from: { scaleY: 0, y: -20 }, easing: 'backOut' }, exit: { to: { scaleY: 0 }, easing: 'easeIn' } } },
      { id: 'loss-val', type: 'text', text: '{{loss}}', style: { position: 'absolute', top: '52%', left: '35%', fontSize: 30, fontWeight: 800, color: '#ef4444' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, x: -20 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'divider', type: 'rect', style: { position: 'absolute', top: '72%', left: '10%', width: 260, height: 1, backgroundColor: '#334155' }, animation: { enterDelay: 0.3, enter: { from: { scaleX: 0 }, easing: 'easeOut' }, exit: { to: { scaleX: 0 }, easing: 'easeIn' } } },
      { id: 'net-val', type: 'text', text: '{{net}}', style: { position: 'absolute', top: '78%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, fontWeight: 700, color: '#22c55e' }, animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 10 }, easing: 'backOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}

const dv040: BundledTemplate = {
  id: 'dv-metric-badge',
  title: 'Metric Badge',
  description: 'Circular badge with metric and label popping in with bounce.',
  category: 'data-visualization',
  tags: ['badge', 'metric', 'circle', 'pop'],
  featured: false,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Score', group: 'Content' },
    { key: 'value', label: 'Value', type: 'text', defaultValue: 'A+', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#8b5cf6', group: 'Style' },
  ],
  defaultConfig: { label: 'Score', value: 'A+', bgColor: '#18181b', badgeColor: '#8b5cf6' },
  motionDesignDescription: {
    name: 'Metric Badge', description: 'Circle badge pops in with bounce.', background: '{{bgColor}}', configSchema: [], defaultConfig: {}, enterDuration: 0.4, exitDuration: 0.2,
    elements: [
      { id: 'badge-bg', type: 'circle', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 160, height: 160, backgroundColor: '{{badgeColor}}', borderRadius: '50%', opacity: 0.15 }, animation: { enterDelay: 0, enter: { from: { scale: 0, opacity: 0 }, easing: 'backOut' }, exit: { to: { scale: 0 }, easing: 'easeIn' } } },
      { id: 'badge-ring', type: 'circle', style: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 160, height: 160, borderRadius: '50%', border: '4px solid {{badgeColor}}' }, animation: { enterDelay: 0.05, enter: { from: { scale: 0, opacity: 0 }, easing: 'elasticOut' }, exit: { to: { scale: 0 }, easing: 'easeIn' } } },
      { id: 'grade', type: 'text', text: '{{value}}', style: { position: 'absolute', top: '36%', left: '50%', transform: 'translateX(-50%)', fontSize: 52, fontWeight: 900, color: '{{badgeColor}}' }, animation: { enterDelay: 0.15, enter: { from: { opacity: 0, scale: 0 }, easing: 'bounceOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
      { id: 'label', type: 'text', text: '{{label}}', style: { position: 'absolute', bottom: '22%', left: '50%', transform: 'translateX(-50%)', fontSize: 18, fontWeight: 500, color: '#a1a1aa' }, animation: { enterDelay: 0.25, enter: { from: { opacity: 0, y: 10 }, easing: 'easeOut' }, exit: { to: { opacity: 0 }, easing: 'easeIn' } } },
    ],
  },
}
