import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ExpiredFilmShiftConfig extends KineticBaseConfig {
  colorShiftAmount: number
}

function rand(s: number): number {
  const x = Math.sin(s * 91.3 + 217.5) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Expired film: color layers drift independently — dye coupler breakdown
    // Cyan/yellow shifts, heavy base fog, color crossover
    const fogLevel = 0.18 + Math.sin(time * 0.2) * 0.04
    const cyanShift = Math.sin(time * 0.15) * 0.08
    const yellowBase = 0.12 + Math.cos(time * 0.1) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Base fog — expired film chemical fogging */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(180,140,80,${fogLevel})`,
            pointerEvents: 'none',
          }}
        />
        {/* Yellow base color crossover — low humidity storage */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, rgba(200,160,40,${yellowBase}) 0%, rgba(160,80,120,${yellowBase * 0.5}) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Cyan shadow layer drift */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + cyanShift * 100}% ${50 - cyanShift * 60}%, rgba(0,120,160,0.08) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Micro-bleed horizontal bands — dye diffusion */}
        {[0.15, 0.3, 0.5, 0.65, 0.82].map((y, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${y * 100 + Math.sin(time * 0.08 + i) * 2}%`,
              height: 1 + (i % 2),
              background: `rgba(${160 + i * 15},${80 + i * 10},${40},${0.06 + rand(i * 13) * 0.04})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Film grain — denser from chemical fog */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`grain-${i}`}
            style={{
              position: 'absolute',
              left: `${rand(frame * 3 + i * 41) * 100}%`,
              top: `${rand(frame * 7 + i * 67) * 100}%`,
              width: 2,
              height: 2,
              background: rand(frame * 5 + i) > 0.4
                ? `rgba(220,180,80,${0.07 + rand(i * 23) * 0.08})`
                : `rgba(0,80,100,${0.05 + rand(i * 31) * 0.07})`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Edge halation — expired chemistry leaking */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(160,80,20,0.25) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Expired film color register shift — R/G/B layers misregistered
    const layerShift = 3 + Math.sin(t * 0.3 + index) * 1.5

    let opacity = 1
    let scale = 1
    let colorShiftX = 0

    if (phase === 'enter') {
      const ease = enterProgress * enterProgress
      opacity = ease
      scale = 0.95 + ease * 0.05
      colorShiftX = (1 - ease) * 8
    } else if (phase === 'hold') {
      // Slow color float — chemistry breathing
      colorShiftX = Math.sin(t * 0.4 + index * 1.3) * 1.5
      scale = 1 + Math.sin(t * 0.6) * 0.003
    } else {
      opacity = 1 - exitProgress
      colorShiftX = exitProgress * 6
    }

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', opacity }}>
        {/* Red layer — shifted left and warm */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(calc(-50% - ${layerShift + colorShiftX}px), -50%) scale(${scale})`,
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(42px, 11vw, 152px)',
            fontWeight: 700,
            color: 'rgba(220,80,20,0.7)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Cyan layer — shifted right, faded */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(calc(-50% + ${layerShift * 0.7 - colorShiftX}px), calc(-50% + ${layerShift * 0.3}px)) scale(${scale})`,
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(42px, 11vw, 152px)',
            fontWeight: 700,
            color: 'rgba(0,160,180,0.6)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Main text — yellow-shifted base */}
        <div
          style={{
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(42px, 11vw, 152px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            filter: 'sepia(0.3) saturate(0.85)',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ExpiredFilmShiftComponent(props: MotionGraphicProps<ExpiredFilmShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-expired-film-shift',
  title: 'Kinetic Expired Film Shift',
  description: 'Expired film stock color degradation — dye coupler breakdown creates cyan/red/yellow register shifts, chemical base fog, and slow color crossover drift',
  tags: ['kinetic', 'typography', 'expired film', 'color shift', 'analog', 'photography', 'dye', 'vintage'],
  category: 'captions',
  component: ExpiredFilmShiftComponent as any,
  defaultConfig: {
    words: ['FADED', 'PAST', 'MEMORY', 'AGED'],
    colors: ['#DEB887', '#D2B48C', '#DEB887', '#C4A882'],
    bgColor: '#1a1005',
    cycleDuration: 1.6,
    colorShiftAmount: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FADED', 'PAST', 'MEMORY', 'AGED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DEB887', '#D2B48C', '#DEB887', '#C4A882'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1005', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'colorShiftAmount', label: 'Color Shift (px)', type: 'number', defaultValue: 8, min: 2, max: 20, group: 'Animation' },
  ],
})
