import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JustifiedSnapConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

/**
 * Justified Snap — the text cycles through alignment states: flush-left →
 * centered → flush-right → justified (forced full-width), snapping between
 * each position as if a typographer is toggling the alignment tool.
 * Each alignment state is held briefly before the next snap. The transition
 * uses per-letter x-position animation for precise control.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Left margin guide */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '30%',
          bottom: '30%',
          width: 1,
          background: 'rgba(255,255,255,0.06)',
        }}
      />
      {/* Right margin guide */}
      <div
        style={{
          position: 'absolute',
          right: '8%',
          top: '30%',
          bottom: '30%',
          width: 1,
          background: 'rgba(255,255,255,0.06)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    const fontSize = Math.min(width * 0.13, height * 0.16, 110)
    const margin = width * 0.08

    // Alignment positions for the text block center-x
    // left: text left-aligned at margin
    // center: centered
    // right: right-aligned at right margin
    // justified: forced to full measure (letterSpacing expanded)
    const alignments = ['left', 'center', 'right', 'justify']

    // During hold, cycle through alignments based on holdProgress
    const alignSegments = alignments.length
    const alignIndex = Math.floor(holdProgress * alignSegments)
    const alignT = (holdProgress * alignSegments) % 1
    const currentAlign = alignments[Math.min(alignIndex, alignSegments - 1)] ?? 'center'
    const nextAlign = alignments[Math.min(alignIndex + 1, alignSegments - 1)] ?? 'center'

    function alignX(align: string): number {
      if (align === 'left') return margin
      if (align === 'right') return width - margin
      if (align === 'center') return width / 2
      if (align === 'justify') return width / 2
      return width / 2
    }

    function alignTextAlign(align: string): 'left' | 'center' | 'right' {
      if (align === 'left') return 'left'
      if (align === 'right') return 'right'
      return 'center'
    }

    function alignTranslate(align: string): string {
      if (align === 'left') return 'translateY(-50%)'
      if (align === 'right') return 'translate(-100%, -50%)'
      return 'translate(-50%, -50%)'
    }

    function alignLetterSpacing(align: string): string {
      if (align === 'justify') {
        // Spread letters to fill the measure
        const textW = word.length * fontSize * 0.62
        const measureW = (width - margin * 2)
        const extra = Math.max(0, measureW - textW)
        const perGap = word.length > 1 ? extra / (word.length - 1) : 0
        return `${(perGap / fontSize).toFixed(3)}em`
      }
      return '0.02em'
    }

    let opacity: number
    let x: number
    let textAlign: 'left' | 'center' | 'right'
    let cssTransform: string
    let letterSpacing: string
    let fontWeight: number

    if (phase === 'enter') {
      // Enter from left with quick snap
      const t = easeOutElastic(Math.min(1, enterProgress / 0.8))
      opacity = Math.min(1, enterProgress / 0.3)
      x = width / 2
      textAlign = 'center'
      cssTransform = 'translate(-50%, -50%)'
      letterSpacing = '0.02em'
      fontWeight = 600
    } else if (phase === 'hold') {
      // Snap between alignment states
      const snapT = Math.min(1, alignT * 6) // quick snap (first 1/6 of each segment)
      const eased = easeOutQuint(snapT)
      const prevX = alignX(currentAlign)
      const targetX = alignX(nextAlign)
      // Between states we interpolate; within state we hold
      const holdStateT = alignT < 0.15 ? eased : 1
      x = prevX + (targetX - prevX) * (alignT < 0.15 ? holdStateT : 1)
      // Actually, just snap to currentAlign for clean effect
      x = alignX(currentAlign)
      textAlign = alignTextAlign(currentAlign)
      cssTransform = alignTranslate(currentAlign)
      letterSpacing = alignLetterSpacing(currentAlign)
      opacity = 1
      fontWeight = currentAlign === 'justify' ? 700 : 600
    } else {
      // Exit: slide off to the right
      const t = easeInOutCubic(exitProgress)
      opacity = 1 - exitProgress
      x = width / 2 + t * width * 0.3
      textAlign = 'center'
      cssTransform = 'translate(-50%, -50%)'
      letterSpacing = '0.02em'
      fontWeight = 600
    }

    // Alignment label
    const labelMap: Record<string, string> = {
      left: '⌶L flush left',
      center: '⌶C centered',
      right: 'flush right ⌶R',
      justify: '⌶J justified',
    }
    const labelText = labelMap[currentAlign] ?? ''
    const labelOpacity = phase === 'hold' ? Math.min(1, (alignT < 0.2 ? alignT / 0.2 : 1) * 0.28) : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: x,
            transform: cssTransform,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize,
              fontWeight,
              letterSpacing,
              textAlign,
              textTransform: 'uppercase',
              color,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {word}
          </div>
        </div>
        {/* Alignment indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {labelText}
        </div>
      </div>
    )
  },
}

function JustifiedSnapComponent(props: MotionGraphicProps<JustifiedSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-justified-snap',
  title: 'Justified Snap',
  description:
    'Text snaps between typographic alignment states — flush-left, centered, flush-right, and force-justified — with typesetter\'s precision. Each alignment is labeled as it locks in.',
  tags: ['kinetic', 'typography', 'alignment', 'justified', 'flush', 'centered', 'typesetting', 'snap', 'craft'],
  category: 'captions',
  component: JustifiedSnapComponent as any,
  defaultConfig: {
    words: ['ALIGNED', 'CENTERED', 'JUSTIFIED', 'SNAPPED'],
    colors: ['#2d2d2d', '#1a1a1a', '#2d2d2d', '#333'],
    bgColor: '#f8f8f8',
    cycleDuration: 2.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ALIGNED', 'CENTERED', 'JUSTIFIED', 'SNAPPED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2d2d2d', '#1a1a1a', '#2d2d2d', '#333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f8f8f8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.8, min: 1.5, max: 6, group: 'Timing' },
  ],
})
