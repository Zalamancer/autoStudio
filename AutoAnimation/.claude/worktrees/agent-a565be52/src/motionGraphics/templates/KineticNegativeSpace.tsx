import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NegativeSpaceConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function hash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Moving noise blocks that form the positive space around the text cutout
    const blocks = Array.from({ length: 18 }, (_, i) => {
      const col = i % 6
      const row = Math.floor(i / 6)
      const baseX = (col / 6) * width
      const baseY = (row / 3) * height
      const w = width / 6 + 4
      const h = height / 3 + 4
      const drift = Math.sin(t * 0.4 + i * 0.7) * 3
      const pulse = 0.85 + Math.sin(t * 0.6 + i * 0.5) * 0.15

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: baseX + drift,
            top: baseY + Math.cos(t * 0.35 + i * 0.9) * 2,
            width: w,
            height: h,
            background: `rgba(255,255,255,${0.03 + hash(i * 17) * 0.03})`,
            opacity: pulse,
            mixBlendMode: 'screen' as const,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {blocks}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // The text is rendered as a knockout: bright surface with text-shaped holes
    // This creates the "negative space" effect where text IS the absence

    const chars = word.split('')

    let surfaceOpacity = 1
    let yShift = 0

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      surfaceOpacity = ep
    } else if (phase === 'hold') {
      // Surface breathes: subtle luminance shift
      yShift = Math.sin(holdProgress * Math.PI * 3) * 1.5
    } else {
      const ep = easeInCubic(exitProgress)
      surfaceOpacity = 1 - ep
      yShift = ep * 30
    }

    // Per-character stagger for enter/exit
    const charElements = chars.map((ch, ci) => {
      let charOpacity = 1
      let charY = 0

      if (phase === 'enter') {
        const delay = (ci / (chars.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.7))
        charOpacity = easeOutExpo(p)
        charY = (1 - easeOutExpo(p)) * 10
      } else if (phase === 'exit') {
        const delay = ((chars.length - 1 - ci) / (chars.length + 1)) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        charOpacity = 1 - easeInCubic(p)
        charY = easeInCubic(p) * -15
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity: charOpacity,
            transform: `translateY(${charY}px)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Horizontal bands that form the bright surface
    const bandCount = 5
    const bands = Array.from({ length: bandCount }, (_, i) => {
      const bandY = (i / bandCount) * 100
      const bandH = 100 / bandCount + 1
      let slideX = 0

      if (phase === 'exit') {
        const ep = easeInCubic(exitProgress)
        slideX = (i % 2 === 0 ? 1 : -1) * ep * 120
      }

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: slideX + '%',
            top: `${bandY}%`,
            width: '100%',
            height: `${bandH}%`,
            background: color,
            mixBlendMode: 'difference' as const,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Bright surface layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: surfaceOpacity,
            overflow: 'hidden',
          }}
        >
          {bands}
        </div>

        {/* Text knockout: renders text that punches through the surface */}
        <div
          style={{
            position: 'absolute',
            top: `calc(50% + ${yShift}px)`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'white',
            mixBlendMode: 'difference' as const,
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function NegativeSpaceComponent(props: MotionGraphicProps<NegativeSpaceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-negative-space',
  title: 'Kinetic Negative Space',
  description:
    'Text appears as a knockout through a bright surface using mix-blend-mode difference. Horizontal bands form the positive space, text is the absence. Exit shatters the surface into sliding bands.',
  tags: ['kinetic', 'typography', 'negative', 'space', 'knockout', 'minimal', 'blend', 'concept'],
  category: 'captions',
  component: NegativeSpaceComponent as any,
  defaultConfig: {
    words: ['VOID', 'SPACE', 'ZERO', 'NULL'],
    colors: ['#E8E8E8', '#D4D4D8', '#A1A1AA', '#F4F4F5'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VOID', 'SPACE', 'ZERO', 'NULL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E8E8', '#D4D4D8', '#A1A1AA', '#F4F4F5'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
