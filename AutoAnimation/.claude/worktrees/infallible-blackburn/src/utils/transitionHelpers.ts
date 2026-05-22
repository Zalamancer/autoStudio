import type { TransitionType } from '@/types/transitions'

export function getTransitionCategory(type: TransitionType): string {
  if (type.startsWith('fade')) return 'fade'
  if (type.startsWith('slide')) return 'slide'
  if (type.startsWith('zoom')) return 'zoom'
  if (type.startsWith('wipe')) return 'wipe'
  if (type === 'dissolve') return 'dissolve'
  if (type === 'cut') return 'cut'
  return 'fade'
}

export const TRANSITION_CATEGORY_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  fade: { bg: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24', gradient: 'rgba(245, 158, 11, 0.5)' },
  slide: { bg: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa', gradient: 'rgba(59, 130, 246, 0.5)' },
  zoom: { bg: 'rgba(168, 85, 247, 0.3)', text: '#c084fc', gradient: 'rgba(168, 85, 247, 0.5)' },
  dissolve: { bg: 'rgba(6, 182, 212, 0.3)', text: '#22d3ee', gradient: 'rgba(6, 182, 212, 0.5)' },
  wipe: { bg: 'rgba(249, 115, 22, 0.3)', text: '#fb923c', gradient: 'rgba(249, 115, 22, 0.5)' },
  cut: { bg: 'rgba(161, 161, 170, 0.3)', text: '#a1a1aa', gradient: 'rgba(161, 161, 170, 0.5)' },
}

export function getTransitionLabel(type: TransitionType): string {
  switch (type) {
    case 'fade-in': return 'Fade In'
    case 'fade-out': return 'Fade Out'
    case 'slide-left': return 'Slide L'
    case 'slide-right': return 'Slide R'
    case 'slide-up': return 'Slide Up'
    case 'slide-down': return 'Slide Dn'
    case 'zoom-in': return 'Zoom In'
    case 'zoom-out': return 'Zoom Out'
    case 'dissolve': return 'Dissolve'
    case 'wipe-left': return 'Wipe L'
    case 'wipe-right': return 'Wipe R'
    case 'cut': return 'Cut'
    default: return type
  }
}
