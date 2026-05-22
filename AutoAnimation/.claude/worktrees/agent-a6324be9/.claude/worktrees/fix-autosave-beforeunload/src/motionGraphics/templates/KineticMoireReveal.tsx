import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MoireRevealConfig extends KineticBaseConfig {
  lineFrequency: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Background moire: two line grids at slightly different angles rotating slowly
    // The interference pattern creates moving wave patterns
    const angle1 = t * 2.5
    const angle2 = t * 2.5 + 1.5  // slightly offset to create beating moire

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Grid layer 1 */}
        <div
          style={{
            position: 'absolute',
            inset: -100,
            backgroundImage: `repeating-linear-gradient(
              ${angle1}deg,
              rgba(200,200,220,0.04) 0px,
              rgba(200,200,220,0.04) 1px,
              transparent 1px,
              transparent 8px
            )`,
          }}
        />
        {/* Grid layer 2 — slightly different angle */}
        <div
          style={{
            position: 'absolute',
            inset: -100,
            backgroundImage: `repeating-linear-gradient(
              ${angle2}deg,
              rgba(180,190,215,0.04) 0px,
              rgba(180,190,215,0.04) 1px,
              transparent 1px,
              transparent 8px
            )`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__moireRevealConfig ?? { lineFrequency: 6 }
    const lineFrequency = cfg.lineFrequency ?? 6

    // Moire reveal: two interference grids aligned perfectly at start (creating dense pattern)
    // As they align, the interference clears and reveals the text

    // The moire clearing = two grids rotate into alignment
    // At max misalignment: opaque interference pattern
    // At alignment: grids cancel and become transparent

    let misalignment = 0  // 0 = aligned (clear), 1 = fully misaligned (opaque moire)
    let textOpacity = 0
    let textBlur = 0

    if (phase === 'enter') {
      // Grids start misaligned, converge to aligned state (revealing text)
      const ep = easeOutExpo(enterProgress)
      misalignment = 1 - ep
      textOpacity = ep
      textBlur = (1 - ep) * 4
    } else if (phase === 'hold') {
      // Grids nearly aligned with gentle slow drift
      misalignment = Math.sin(t * 0.4) * 0.05
      textOpacity = 1
      textBlur = 0
    } else {
      // Grids drift apart again, moire pattern reclaims
      const ep = easeInQuad(exitProgress)
      misalignment = ep
      textOpacity = 1 - ep
      textBlur = ep * 4
    }

    // Build moire interference pattern overlay
    const spacing = lineFrequency  // px between lines
    const angle1 = 0
    const angle2 = misalignment * 12  // angle differential creates moire

    // The pattern opacity scales with misalignment
    const patternAlpha = misalignment * 0.85

    // Moire creates visible bands — simulate as layered striped gradients at beat frequency
    const beatFreq = spacing * (1 + misalignment * 3)  // larger beat when more misaligned
    const beatPhase = t * 15 * misalignment  // bands move when misaligned

    const moireElements: React.ReactNode[] = []

    if (patternAlpha > 0.01) {
      // Layer 1: base lines
      moireElements.push(
        <div
          key="m1"
          style={{
            position: 'absolute',
            inset: -50,
            backgroundImage: `repeating-linear-gradient(
              ${angle1}deg,
              rgba(150,160,180,${patternAlpha * 0.7}) 0px,
              rgba(150,160,180,${patternAlpha * 0.7}) ${spacing * 0.5}px,
              rgba(20,24,35,${patternAlpha * 0.5}) ${spacing * 0.5}px,
              rgba(20,24,35,${patternAlpha * 0.5}) ${spacing}px
            )`,
          }}
        />,
      )

      // Layer 2: rotated lines
      moireElements.push(
        <div
          key="m2"
          style={{
            position: 'absolute',
            inset: -50,
            backgroundImage: `repeating-linear-gradient(
              ${angle2}deg,
              rgba(120,135,160,${patternAlpha * 0.5}) 0px,
              rgba(120,135,160,${patternAlpha * 0.5}) ${spacing * 0.5}px,
              transparent ${spacing * 0.5}px,
              transparent ${spacing}px
            )`,
            mixBlendMode: 'multiply',
          }}
        />,
      )

      // Moire beat bands (the emergent interference pattern)
      if (misalignment > 0.05) {
        moireElements.push(
          <div
            key="beat"
            style={{
              position: 'absolute',
              inset: -50,
              backgroundImage: `repeating-linear-gradient(
                ${angle1 + angle2 / 2}deg,
                rgba(200,210,230,${patternAlpha * 0.15}) 0px,
                rgba(200,210,230,${patternAlpha * 0.15}) ${beatFreq * 0.4}px,
                rgba(10,15,25,${patternAlpha * 0.2}) ${beatFreq * 0.4}px,
                rgba(10,15,25,${patternAlpha * 0.2}) ${beatFreq}px
              )`,
              transform: `translateX(${beatPhase}px)`,
            }}
          />,
        )
      }
    }

    // Per-character interference reveal (characters that align first appear first)
    const chars = word.split('').map((ch, ci) => {
      const charNorm = word.length > 1 ? ci / (word.length - 1) : 0.5
      // Characters at positions where grids happen to be aligned appear earlier
      const charAlignBonus = Math.sin(charNorm * Math.PI * 3) * 0.1
      const charOpacity = Math.min(1, textOpacity + charAlignBonus)
      const charBlur = Math.max(0, textBlur - charAlignBonus * 2)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            filter: charBlur > 0.1 ? `blur(${charBlur}px)` : 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text layer (behind moire) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>

        {/* Moire pattern overlay (on top of text) */}
        {moireElements}
      </div>
    )
  },
}

function MoireRevealComponent(props: MotionGraphicProps<MoireRevealConfig>) {
  ;(globalThis as any).__moireRevealConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-moire-reveal',
  title: 'Kinetic Moire Reveal',
  description: 'Two interference line grids align, causing the moire pattern to clear and reveal text — moving beat bands and per-character timing',
  tags: ['kinetic', 'typography', 'moire', 'interference', 'pattern', 'optical', 'reveal', 'lines', 'grid'],
  category: 'captions',
  component: MoireRevealComponent as any,
  defaultConfig: {
    words: ['ALIGN', 'CLEAR', 'FOCUS', 'SYNC'],
    colors: ['#D0E0FF', '#B8CCFF', '#E0EAFF', '#A8BCFF'],
    bgColor: '#080c18',
    cycleDuration: 1.6,
    lineFrequency: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ALIGN', 'CLEAR', 'FOCUS', 'SYNC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D0E0FF', '#B8CCFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'lineFrequency', label: 'Line Spacing (px)', type: 'number', defaultValue: 6, min: 3, max: 16, group: 'Animation' },
  ],
})
