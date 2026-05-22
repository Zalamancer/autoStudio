import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InkBlotConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInBack(t: number): number {
  const c = 1.70158
  return (c + 1) * t * t * t - c * t * t
}

function hash(seed: number): number {
  const x = Math.sin(seed * 78.233 + 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Subtle ink wash stains drifting across the background
    const stains = Array.from({ length: 6 }, (_, i) => {
      const cx = width * (0.15 + hash(i * 31) * 0.7)
      const cy = height * (0.2 + hash(i * 47) * 0.6)
      const size = 80 + hash(i * 13) * 160
      const drift = Math.sin(t * 0.3 + i * 1.1) * 12
      const pulse = 1 + Math.sin(t * 0.5 + i * 0.8) * 0.08

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx + drift - size / 2,
            top: cy - size / 2,
            width: size * pulse,
            height: size * pulse * (0.8 + hash(i * 19) * 0.4),
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(255,255,255,0.04), transparent 70%)`,
            mixBlendMode: 'screen' as const,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {stains}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.split('').map((ch, ci) => {
      const seed = ci * 17 + index * 7
      let opacity = 1
      let blur = 0
      let inkScale = 1
      let yOff = 0
      let inkSpread = 0

      if (phase === 'enter') {
        // Each letter: ink drop expands then sharpens into letterform
        const delay = (ci / (word.length + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutExpo(p)

        // Ink blob starts large and blurry, sharpens to crisp letter
        inkScale = 1 + (1 - ep) * 1.2
        blur = (1 - ep) * 12
        opacity = Math.min(1, p * 2.5)
        inkSpread = (1 - ep) * 20
      } else if (phase === 'hold') {
        // Subtle ink feathering: letters breathe with slight blur oscillation
        const breathe = Math.sin(holdProgress * Math.PI * 4 + ci * 0.7)
        blur = Math.abs(breathe) * 0.6
        yOff = breathe * 1.5
        inkScale = 1 + breathe * 0.01
      } else {
        // Ink dissolves: bleeds outward and fades
        const delay = ((word.length - 1 - ci) / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInBack(Math.min(1, p))

        inkScale = 1 + ep * 0.8
        blur = ep * 15
        opacity = 1 - ep
        inkSpread = ep * 25
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity,
            transform: `translateY(${yOff}px) scale(${inkScale})`,
            filter: `blur(${blur}px)`,
            textShadow: `0 0 ${inkSpread}px ${color}, 0 0 ${inkSpread * 2}px ${color}44`,
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
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function InkBlotComponent(props: MotionGraphicProps<InkBlotConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ink-blot',
  title: 'Kinetic Ink Blot',
  description:
    'Each letter appears as an expanding ink drop that sharpens into a crisp letterform. Minimal, elegant reveal with ink-wash background stains.',
  tags: ['kinetic', 'typography', 'ink', 'blot', 'minimal', 'reveal', 'organic'],
  category: 'captions',
  component: InkBlotComponent as any,
  defaultConfig: {
    words: ['INK', 'BLOT', 'DRIP', 'MARK'],
    colors: ['#E8E8E8', '#C4B5FD', '#F0ABFC', '#FFFFFF'],
    bgColor: '#0a0a0f',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INK', 'BLOT', 'DRIP', 'MARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E8E8', '#C4B5FD', '#F0ABFC', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
