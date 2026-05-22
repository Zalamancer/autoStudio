import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NitroBoostConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Radial speed lines emanating from center
    const lineCount = 24
    const lines = Array.from({ length: lineCount }, (_, i) => {
      const angle = (i / lineCount) * 360
      const pulse = Math.sin(time * 6 + i * 0.5) * 0.3 + 0.7
      return { angle, pulse }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Radial burst lines */}
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: Math.max(width, height) * 0.8,
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,120,0,${0.04 * l.pulse}) 40%, rgba(255,60,0,${0.12 * l.pulse}) 100%)`,
              transformOrigin: '0% 50%',
              transform: `rotate(${l.angle}deg)`,
            }}
          />
        ))}
        {/* Central glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: Math.min(width, height) * 0.6,
            height: Math.min(width, height) * 0.6,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, rgba(255,100,0,${0.08 + Math.sin(time * 4) * 0.04}) 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />
        {/* Flame particles */}
        {Array.from({ length: 12 }, (_, i) => {
          const seed = i * 137.508
          const x = 50 + Math.sin(seed + time * 3) * 25
          const y = 50 + Math.cos(seed + time * 2.5) * 25
          const size = 4 + Math.sin(time * 5 + i) * 3
          const alpha = 0.15 + Math.sin(time * 4 + i * 0.8) * 0.1
          return (
            <div
              key={`p-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `rgba(255,${80 + i * 10},0,${alpha})`,
                boxShadow: `0 0 ${size * 2}px rgba(255,${80 + i * 10},0,${alpha * 0.5})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = 0
    let blur = 0

    if (phase === 'enter') {
      // Explosive entry: starts huge and blurry, snaps into place
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 3 - eased * 2
      blur = (1 - eased) * 12
      rotation = (1 - eased) * (index % 2 === 0 ? -8 : 8)
    } else if (phase === 'hold') {
      opacity = 1
      // Fiery tremor
      const t = Date.now() * 0.008
      scale = 1 + Math.sin(t) * 0.015
      rotation = Math.sin(t * 1.3) * 0.5
    } else {
      // Blast out
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      scale = 1 + eased * 2
      blur = eased * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          filter: blur > 0.5 ? `blur(${blur}px)` : 'none',
        }}
      >
        {/* Flame glow behind text */}
        <div
          style={{
            position: 'absolute',
            inset: '-30%',
            background: `radial-gradient(ellipse, ${color}30 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(42px, 13vw, 150px)',
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            textShadow: `0 0 10px ${color}, 0 0 30px ${color}80, 0 0 60px ${color}40, 0 4px 8px rgba(0,0,0,0.5)`,
          }}
        >
          {word}
        </div>
        {/* Bottom flame streaks */}
        {phase !== 'exit' && (
          <div style={{ position: 'absolute', bottom: '-20%', left: '10%', right: '10%', display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const h = 10 + Math.sin(Date.now() * 0.01 + i * 1.2) * 8
              return (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: h,
                    background: `linear-gradient(to bottom, ${color}, rgba(255,200,0,0.6), transparent)`,
                    borderRadius: '2px 2px 50% 50%',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    )
  },
}

function NitroBoostComponent(props: MotionGraphicProps<NitroBoostConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-nitro-boost',
  title: 'Nitro Boost',
  description: 'Text explodes into frame with nitro flame effects. Radial speed burst background with fire particles, flame streaks under text.',
  tags: ['kinetic', 'nitro', 'boost', 'flame', 'explosion', 'car', 'racing', 'motorsport'],
  category: 'captions',
  component: NitroBoostComponent as any,
  defaultConfig: {
    words: ['NITRO', 'BOOST', 'FLAME', 'MAX'],
    colors: ['#ff6600', '#ff3300', '#ffcc00', '#ff0044'],
    bgColor: '#0a0808',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NITRO', 'BOOST', 'FLAME', 'MAX'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff6600', '#ff3300', '#ffcc00', '#ff0044'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
