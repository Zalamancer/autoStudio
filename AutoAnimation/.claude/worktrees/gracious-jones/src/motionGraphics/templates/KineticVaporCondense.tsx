import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VaporCondenseConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function hash(seed: number): number {
  const x = Math.sin(seed * 78.233 + 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Drifting vapor wisps
    const wisps = Array.from({ length: 5 }, (_, i) => {
      const baseX = width * (0.1 + hash(i * 37) * 0.8)
      const baseY = height * (0.2 + hash(i * 53) * 0.6)
      const driftX = Math.sin(t * 0.2 + i * 1.3) * 40
      const driftY = Math.cos(t * 0.15 + i * 0.9) * 20
      const w = 120 + hash(i * 19) * 200
      const h = 30 + hash(i * 41) * 50
      const opacity = 0.025 + Math.sin(t * 0.4 + i * 0.7) * 0.01

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: baseX + driftX - w / 2,
            top: baseY + driftY - h / 2,
            width: w,
            height: h,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(255,255,255,${opacity}), transparent 70%)`,
            mixBlendMode: 'screen' as const,
            filter: 'blur(8px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {wisps}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.split('').map((ch, ci) => {
      const seed = ci * 13 + index * 5
      let blur = 0
      let opacity = 1
      let yOff = 0
      let letterSpread = 0
      let charScale = 1

      if (phase === 'enter') {
        // Vapor condensation: wide, blurry mist focuses into sharp letters
        const delay = (ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.7))
        const ep = easeOutQuart(p)

        blur = (1 - ep) * 18
        opacity = 0.2 + ep * 0.8
        letterSpread = (1 - ep) * 30
        yOff = (1 - ep) * -15
        charScale = 1 + (1 - ep) * 0.15
      } else if (phase === 'hold') {
        // Condensation shimmer: tiny focus oscillation like heat haze
        const shimmer = Math.sin(holdProgress * Math.PI * 5 + ci * 0.8)
        blur = Math.abs(shimmer) * 0.8
        yOff = shimmer * 1.2
        charScale = 1 + shimmer * 0.008
      } else {
        // Evaporation: letters blur and drift upward like steam
        const delay = (ci / (word.length + 1)) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        const ep = easeInCubic(p)

        blur = ep * 20
        opacity = 1 - ep
        yOff = -ep * 40
        charScale = 1 + ep * 0.2
        letterSpread = ep * 20
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${letterSpread * (hash(seed) - 0.5)}px, ${yOff}px) scale(${charScale})`,
            filter: `blur(${blur}px)`,
            mixBlendMode: 'screen' as const,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 300,
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function VaporCondenseComponent(props: MotionGraphicProps<VaporCondenseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vapor-condense',
  title: 'Kinetic Vapor Condense',
  description:
    'Letters condense from a wide misty blur into crisp, sharp forms like vapor crystallizing on cold glass. Light font weight emphasizes the ethereal quality.',
  tags: ['kinetic', 'typography', 'vapor', 'condense', 'minimal', 'blur', 'ethereal'],
  category: 'captions',
  component: VaporCondenseComponent as any,
  defaultConfig: {
    words: ['MIST', 'FORM', 'CLEAR', 'FADE'],
    colors: ['#E2E8F0', '#CBD5E1', '#94A3B8', '#F1F5F9'],
    bgColor: '#0c0c14',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MIST', 'FORM', 'CLEAR', 'FADE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E2E8F0', '#CBD5E1', '#94A3B8', '#F1F5F9'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
