/**
 * Design tokens for the unified panel control system.
 * Matches the RightPanel TextProperties design language.
 */
export const PANEL = {
  // Surface backgrounds
  surface: 'bg-[#2a2a2a]',
  surfaceHover: 'hover:bg-[#3a3a3a]',
  surfaceActive: 'bg-[#3a3a3a]',

  // Accent (active state)
  accent: 'bg-[#4a7eff]',
  accentHover: 'hover:bg-[#3a6aee]',
  accentText: 'text-[#4a7eff]',
  accentBg: 'bg-[#4a7eff]/10',
  accentBorder: 'border-[#4a7eff]',
  accentBorderSubtle: 'border-[#4a7eff]/30',

  // Text
  label: 'text-gray-400 text-sm',
  labelFixed: 'text-gray-400 text-sm w-20 shrink-0',
  sublabel: 'text-gray-500 text-xs',
  heading: 'text-white text-base font-semibold',
  headingSm: 'text-white text-sm font-semibold',
  value: 'text-white text-sm',

  // Borders
  border: 'border-white/5',
  borderSurface: 'border-[#3a3a3a]',

  // Focus
  focusRing: 'focus:outline-none focus:ring-1 focus:ring-[#4a7eff]',

  // Toggle
  toggleOn: 'bg-[#4a7eff]',
  toggleOff: 'bg-[#3a3a3a]',

  // Common input
  input: 'bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4a7eff]',

  // Button variants
  btnPrimary: 'bg-[#4a7eff] text-white hover:bg-[#3a6aee]',
  btnSecondary: 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]',
  btnDestructive: 'bg-red-600/10 text-red-400 hover:bg-red-600/20',
  btnAccent: 'bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/30 hover:bg-[#4a7eff]/20',

  // Section
  section: 'border-b border-white/5',
} as const
