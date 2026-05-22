import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DropExplosionConfig extends KineticBaseConfig {
  explosionColor: string
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Drop at beginning of cycle, then hold
    const dropFreq = 0.5
    const dropPhase = (time * dropFreq) % 1
    const isExplosion = dropPhase < 0.15
    const explosion = isExplosion ? dropPhase / 0.15 : Math.pow(1 - (dropPhase - 0.15) / 0.85, 2)

    // Shockwave rings expanding from center
    const numRings = 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Core explosion flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%,
              rgba(255,200,0,${isExplosion ? (dropPhase / 0.15) * 0.5 : 0}) 0%,
              rgba(255,100,0,${explosion * 0.3}) 20%,
              rgba(200,0,100,${explosion * 0.15}) 50%,
              transparent 80%)`,
          }}
        />
        {/* Explosion shockwave rings */}
        {Array.from({ length: numRings }).map((_, i) => {
          const delay = i * 0.015
          const rp = Math.max(0, (time * dropFreq - delay) % 1)
          const rScale = 0.02 + rp * 3.5
          const rOp = Math.max(
            0,
            (1 - rp) * 0.7 * (i < 3 ? explosion : rp < 0.2 ? rp / 0.2 : Math.pow(1 - (rp - 0.2) / 0.8, 2)),
          )
          const dim = Math.min(width, height)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: dim,
                height: dim,
                borderRadius: '50%',
                border: `${3 - i * 0.2}px solid rgba(255,${100 + i * 15},0,0.9)`,
                transform: `translate(-50%, -50%) scale(${rScale})`,
                opacity: rOp,
              }}
            />
          )
        })}
        {/* Debris particles */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const speed = 0.15 + (i % 3) * 0.08
          const dist = explosion * speed * Math.min(width, height)
          const px = width * 0.5 + Math.cos(angle) * dist
          const py = height * 0.5 + Math.sin(angle) * dist
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: 4 + (i % 3) * 2,
                height: 4 + (i % 3) * 2,
                borderRadius: '50%',
                background: `rgba(255,${80 + i * 10},0,${explosion * 0.9})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 10%, ${bgColor}88 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const dropFreq = 0.5
    const dropPhase = (time * dropFreq) % 1
    const isExplosion = dropPhase < 0.15
    const explosion = isExplosion ? dropPhase / 0.15 : Math.pow(1 - (dropPhase - 0.15) / 0.85, 2)

    let opacity = 1
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      const bounced = easeOutBounce(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 3.0 - 2.0 * bounced
    } else if (phase === 'hold') {
      // Drop explosion: massive scale on drop then settle
      if (isExplosion) {
        scale = 0.3 + easeOutExpo(dropPhase / 0.15) * 1.1
      } else {
        scale = 1 + Math.pow(1 - (dropPhase - 0.15) / 0.85, 3) * 0.4
      }
      rotate = isExplosion ? (dropPhase / 0.15 - 0.5) * 4 : 0
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontSize: 'clamp(52px, 13vw, 176px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          textShadow: `
            0 0 ${20 + explosion * 60}px ${color}${Math.round(explosion * 120)
              .toString(16)
              .padStart(2, '0')},
            0 0 80px rgba(255,100,0,${explosion * 0.5}),
            0 4px 24px rgba(0,0,0,0.9)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function DropExplosionComponent(props: MotionGraphicProps<DropExplosionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drop-explosion',
  title: 'Kinetic Drop Explosion',
  description:
    'The drop moment — text explodes outward with a massive shockwave blast, particle debris, and expanding orange rings. The peak EDM drop visualization.',
  tags: ['kinetic', 'music', 'drop', 'explosion', 'edm', 'bass', 'shockwave', 'impact', 'festival'],
  category: 'captions',
  component: DropExplosionComponent as any,
  defaultConfig: {
    words: ['DROP', 'FIRE', 'BLAST', 'BOOM'],
    colors: ['#FF8C00', '#FF5500', '#FFB000', '#FF3300'],
    bgColor: '#050100',
    cycleDuration: 2.0,
    explosionColor: '#FF8C00',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DROP', 'FIRE', 'BLAST', 'BOOM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF8C00', '#FF5500', '#FFB000', '#FF3300'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050100', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    { key: 'explosionColor', label: 'Explosion Color', type: 'color', defaultValue: '#FF8C00', group: 'Animation' },
  ],
})
