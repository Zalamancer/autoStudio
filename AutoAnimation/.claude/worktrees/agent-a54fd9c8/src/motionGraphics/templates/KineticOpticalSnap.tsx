import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OpticalSnapConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Optical Snap — demonstrates the difference between mathematical center-spacing
 * and optical center-spacing. The word starts with every letter mechanically
 * equidistant (like a naive CSS letter-spacing), then each letter snaps
 * independently to its optically-corrected position — accounting for the visual
 * weight of round vs. straight sides. Letters with round-round adjacency (OO, CO,
 * GO) snap tighter; letters with straight sides (HH, IT) snap wider.
 * The "before/after" transition makes the craft immediately visible.
 */

// Simplified optical kern offsets by letter shape class
// Shape: 'round' (O,C,G,Q,D), 'diagonal' (A,V,W,Y,X), 'straight' (H,I,N,M,K)
function getShapeClass(ch: string): 'round' | 'diagonal' | 'straight' {
  const upper = ch.toUpperCase()
  if ('OCGQDPB'.includes(upper)) return 'round'
  if ('AVWYX'.includes(upper)) return 'diagonal'
  return 'straight'
}

function opticalOffset(left: string, right: string): number {
  const lClass = getShapeClass(left)
  const rClass = getShapeClass(right)
  // round-round pairs need tightest kern
  if (lClass === 'round' && rClass === 'round') return -0.09
  // diagonal pairs
  if (lClass === 'diagonal' || rClass === 'diagonal') return -0.07
  // round-straight
  if (lClass === 'round' || rClass === 'round') return -0.04
  // straight-straight — the widest pair, already natural
  return 0.0
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const letters = word.split('')
    const n = letters.length
    const fontSize = Math.min(width * 0.14, height * 0.18, 128)
    const mechSpacing = fontSize * 0.60 // mechanical (naive) spacing

    // Compute optical x positions
    const opticalPositions: number[] = []
    let cursor = 0
    for (let i = 0; i < n; i++) {
      opticalPositions.push(cursor)
      const kern = i < n - 1 ? opticalOffset(letters[i], letters[i + 1]) : 0
      cursor += mechSpacing * (1 + kern)
    }
    const totalOptical = cursor
    const totalMech = n * mechSpacing

    const centerX = width / 2
    const centerY = height / 2

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const mechX = centerX - totalMech / 2 + i * mechSpacing
      const optX = centerX - totalOptical / 2 + opticalPositions[i]

      let x: number
      let opacity: number
      let underlineH: number = 0

      if (phase === 'enter') {
        // Appear at mechanical positions
        opacity = Math.min(1, enterProgress * 3)
        x = mechX
      } else if (phase === 'hold') {
        // Snap to optical positions during first quarter of hold
        if (holdProgress < 0.25) {
          const snapT = easeOutExpo(holdProgress / 0.25)
          x = mechX + (optX - mechX) * snapT
        } else {
          x = optX
        }
        opacity = 1
        // Show snap highlight during transition
        underlineH = holdProgress < 0.35
          ? Math.max(0, 1 - holdProgress / 0.35) * 2
          : 0
      } else {
        // Exit: mechanical spacing reasserts, then fade
        const t = easeInQuad(exitProgress)
        x = optX + (mechX - optX) * t
        opacity = 1 - exitProgress
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: centerY,
            transform: 'translateY(-50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize,
            fontWeight: 400,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {letters[i]}
          {/* Snap indicator underline */}
          {underlineH > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: -3,
                left: 0,
                right: 0,
                height: underlineH,
                background: color,
                opacity: 0.4,
              }}
            />
          )}
        </div>
      )
    }

    // Label
    const labelText = phase === 'enter' ? 'mechanical' : phase === 'hold' && holdProgress < 0.4 ? 'optical →' : 'optical'
    const labelOpacity = phase === 'hold' ? 0.2 : phase === 'enter' ? enterProgress * 0.18 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '20%',
            transform: 'translateX(-50%)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.14em',
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

function OpticalSnapComponent(props: MotionGraphicProps<OpticalSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-optical-snap',
  title: 'Optical Snap',
  description:
    'Visualizes optical kerning: letters start at mechanical equidistant spacing then snap to optically-corrected positions based on letter shape class (round/diagonal/straight). Makes typographic craft visible.',
  tags: ['kinetic', 'typography', 'optical', 'kerning', 'snap', 'craft', 'spacing', 'per-letter', 'educational'],
  category: 'captions',
  component: OpticalSnapComponent as any,
  defaultConfig: {
    words: ['WAVE', 'TYPE', 'GOLD', 'VOID'],
    colors: ['#1c1c1c', '#444', '#1c1c1c', '#444'],
    bgColor: '#f2f0ec',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAVE', 'TYPE', 'GOLD', 'VOID'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1c1c1c', '#444', '#1c1c1c', '#444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f2f0ec', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.5, max: 5, group: 'Timing' },
  ],
})
