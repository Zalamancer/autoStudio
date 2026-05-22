import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeightDropConfig extends KineticBaseConfig {}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Floor line with subtle vibration
    const shake = Math.sin(t * 8) * Math.max(0, 1 - t * 2) * 2
    // Ground crack marks
    const cracks = Array.from({ length: 4 }, (_, i) => {
      const cx = width * (0.25 + i * 0.15)
      const spread = 20 + i * 8
      const opacity = 0.04 + Math.sin(t * 0.5 + i) * 0.015

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx - spread / 2,
            top: height * 0.62 - 1,
            width: spread,
            height: 2,
            background: `radial-gradient(ellipse, rgba(255,255,255,${opacity}), transparent)`,
            mixBlendMode: 'screen' as const,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Floor line */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: `${62 + shake * 0.1}%`,
            height: 1,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        {cracks}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    const chars = word.split('').map((ch, ci) => {
      let yOff = 0
      let opacity = 1
      let squashX = 1
      let squashY = 1
      let rotation = 0

      if (phase === 'enter') {
        // Staggered heavy drop with bounce
        const delay = (ci / (word.length + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutBounce(p)

        // Fall from above into position
        yOff = (1 - ep) * -180
        opacity = Math.min(1, p * 3)

        // Impact squash: flatten on landing
        if (p > 0.3 && p < 0.5) {
          const squashPhase = (p - 0.3) / 0.2
          squashX = 1 + Math.sin(squashPhase * Math.PI) * 0.15
          squashY = 1 - Math.sin(squashPhase * Math.PI) * 0.1
        }
      } else if (phase === 'hold') {
        // Heavy settling: slight sway as if the mass is stabilizing
        const sway = Math.sin(holdProgress * Math.PI * 3 + ci * 0.9)
        rotation = sway * 0.5
        yOff = Math.abs(sway) * 1.2
        squashY = 1 - Math.abs(sway) * 0.01
      } else {
        // Letters crumble: tilt and fall through the floor
        const delay = (ci / (word.length + 1)) * 0.2
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.8))
        const ep = easeInQuad(p)

        yOff = ep * 200
        rotation = (ci % 2 === 0 ? 1 : -1) * ep * 30
        opacity = 1 - ep
        squashY = 1 + ep * 0.3
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translateY(${yOff}px) rotate(${rotation}deg) scaleX(${squashX}) scaleY(${squashY})`,
            transformOrigin: 'center bottom',
            mixBlendMode: 'screen' as const,
            textShadow: yOff < -5
              ? 'none'
              : `0 4px 12px rgba(0,0,0,0.5)`,
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
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function WeightDropComponent(props: MotionGraphicProps<WeightDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-weight-drop',
  title: 'Kinetic Weight Drop',
  description:
    'Heavy letters fall from above and bounce on impact with satisfying squash-and-stretch. Floor cracks appear at the landing zone. Exit crumbles letters through the floor.',
  tags: ['kinetic', 'typography', 'weight', 'drop', 'bounce', 'minimal', 'physics', 'impact'],
  category: 'captions',
  component: WeightDropComponent as any,
  defaultConfig: {
    words: ['HEAVY', 'DROP', 'MASS', 'SLAM'],
    colors: ['#F8FAFC', '#E2E8F0', '#FCA5A5', '#FBBF24'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEAVY', 'DROP', 'MASS', 'SLAM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F8FAFC', '#E2E8F0', '#FCA5A5', '#FBBF24'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
