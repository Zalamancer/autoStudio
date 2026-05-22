import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MagneticSnapConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function hash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Magnetic field lines: subtle curved lines suggesting force field
    const lines = Array.from({ length: 8 }, (_, i) => {
      const yBase = height * (0.15 + i * 0.1)
      const wave = Math.sin(t * 0.6 + i * 0.4) * 15
      const opacity = 0.03 + Math.sin(t * 0.8 + i * 0.5) * 0.015

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: yBase + wave,
            height: 1,
            background: `linear-gradient(90deg, transparent 5%, rgba(255,255,255,${opacity}) 30%, rgba(255,255,255,${opacity * 1.5}) 50%, rgba(255,255,255,${opacity}) 70%, transparent 95%)`,
            mixBlendMode: 'screen' as const,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {lines}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.split('').map((ch, ci) => {
      const seed = ci * 23 + index * 11
      const centerIdx = (word.length - 1) / 2
      const fromCenter = ci - centerIdx

      let xOff = 0
      let yOff = 0
      let rotation = 0
      let opacity = 1

      if (phase === 'enter') {
        // Letters float loose, then snap to grid with overshoot
        const delay = hash(seed) * 0.25
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.75))
        const ep = easeOutBack(p)

        // Random scattered positions that converge to alignment
        const scatterX = (hash(seed + 1) - 0.5) * 200 * (1 - ep)
        const scatterY = (hash(seed + 2) - 0.5) * 120 * (1 - ep)
        const scatterRot = (hash(seed + 3) - 0.5) * 60 * (1 - ep)

        xOff = scatterX
        yOff = scatterY
        rotation = scatterRot
        opacity = Math.min(1, p * 3)
      } else if (phase === 'hold') {
        // Magnetic hum: letters vibrate subtly as if held by force
        const hum = Math.sin(holdProgress * Math.PI * 6 + ci * 1.2)
        xOff = hum * 0.8
        yOff = Math.cos(holdProgress * Math.PI * 5 + ci * 0.9) * 0.6
        rotation = hum * 0.3
      } else {
        // Repulsion: letters fly apart as if magnetic poles reversed
        const delay = (ci / word.length) * 0.15
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.85))
        const ep = easeInExpo(p)

        xOff = fromCenter * ep * 80
        yOff = (hash(seed + 4) - 0.5) * ep * 150
        rotation = fromCenter * ep * 25
        opacity = 1 - ep
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) rotate(${rotation}deg)`,
            mixBlendMode: 'screen' as const,
            textShadow: phase === 'enter' && enterProgress < 0.5
              ? `0 0 8px ${color}88`
              : 'none',
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
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function MagneticSnapComponent(props: MotionGraphicProps<MagneticSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-magnetic-snap',
  title: 'Kinetic Magnetic Snap',
  description:
    'Letters float loosely in space then snap into perfect alignment with satisfying overshoot. Magnetic field lines pulse in the background. Exit repels letters apart.',
  tags: ['kinetic', 'typography', 'magnetic', 'snap', 'minimal', 'alignment', 'physics'],
  category: 'captions',
  component: MagneticSnapComponent as any,
  defaultConfig: {
    words: ['SNAP', 'LOCK', 'HOLD', 'PULL'],
    colors: ['#FFFFFF', '#60A5FA', '#F472B6', '#A78BFA'],
    bgColor: '#08080f',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SNAP', 'LOCK', 'HOLD', 'PULL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#60A5FA', '#F472B6', '#A78BFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
