/**
 * Design tokens for the unified panel control system.
 * Matches the RightPanel TextProperties design language.
 */
export const PANEL = {
  // Surface backgrounds
  surface: 'bg-panel-surface',
  surfaceHover: 'hover:bg-panel-surface-hover',
  surfaceActive: 'bg-panel-surface-hover',

  // Accent (active state)
  accent: 'bg-accent',
  accentHover: 'hover:bg-accent-hover',
  accentText: 'text-accent',
  accentBg: 'bg-accent/10',
  accentBorder: 'border-accent',
  accentBorderSubtle: 'border-accent/30',

  // Text
  label: 'text-gray-400 text-sm',
  labelFixed: 'text-gray-400 text-sm w-20 shrink-0',
  sublabel: 'text-gray-500 text-xs',
  heading: 'text-white text-base font-semibold',
  headingSm: 'text-white text-sm font-semibold',
  value: 'text-white text-sm',

  // Borders
  border: 'border-white/5',
  borderSurface: 'border-panel-border',

  // Focus
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',

  // Toggle
  toggleOn: 'bg-accent',
  toggleOff: 'bg-panel-surface-hover',

  // Common input — uses focus: (not focus-visible:) because text inputs need visible focus on click
  input: 'bg-panel-surface text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent',

  // Button variants
  btnPrimary: 'bg-accent text-white hover:bg-accent-hover',
  btnSecondary: 'bg-panel-surface text-white hover:bg-panel-surface-hover',
  btnDestructive: 'bg-red-600/10 text-red-400 hover:bg-red-600/20',
  btnAccent: 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20',

  // Section
  section: 'border-b border-white/5',
} as const
