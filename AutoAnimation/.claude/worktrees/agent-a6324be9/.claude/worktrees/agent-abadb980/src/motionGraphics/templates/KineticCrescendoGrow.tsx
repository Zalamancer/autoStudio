import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Visual Music 1/4 — Crescendo Grow
// Text swells gradually from pp to ff — musical crescendo mapped to scale+brightness

interface CrescendoGrowConfig extends KineticBaseConfig {
  peakScale: number
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Crescendo sweep: brightness grows over time
    const cycleLen = 2.0
    const phase = (t % cycleLen) / cycleLen
    const intensity = easeInCubic(phase) * 0.3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Growing radial glow — expands with crescendo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%,
              rgba(255,255,255,${intensity}) 0%,
              rgba(255,180,50,${intensity * 0.6}) 30%,
              transparent 70%)`,
          }}
        />
        {/* Volume bar at bottom — fills left to right */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '10%',
            right: '10%',
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${phase * 100}%`,
              background: `linear-gradient(to right, rgba(255,255,255,0.3), rgba(255,220,80,0.8))`,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      // Start tiny (pp), fade in
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.4 + enterProgress * 0.6
    } else if (phase === 'hold') {
      opacity = 1
      // Crescendo: scale grows from 0.88 to 1.25 over hold duration (easeIn curve)
      const crescendo = easeInCubic(holdProgress)
      scale = 0.88 + crescendo * 0.37
      // Slight oscillation on the growing wave
      scale += Math.sin(holdProgress * Math.PI * 8) * holdProgress * 0.015
    } else {
      opacity = 1 - exitProgress
      scale = 1.25 - exitProgress * 0.25
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(40px, 10vw, 140px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textShadow: `
            0 0 ${20 + holdProgress * 60}px ${color}${Math.floor(holdProgress * 200).toString(16).padStart(2,'0')},
            0 2px 20px rgba(0,0,0,0.4)
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function CrescendoGrowComponent(props: MotionGraphicProps<CrescendoGrowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crescendo-grow',
  title: 'Kinetic Crescendo Grow',
  description:
    'Musical crescendo visualized: text swells from pianissimo (small) to fortissimo (large) with easeIn curve. Radial glow expands with volume.',
  tags: ['kinetic', 'visual-music', 'crescendo', 'grow', 'dynamics', 'classical', 'swell', 'music'],
  category: 'captions',
  component: CrescendoGrowComponent as any,
  defaultConfig: {
    words: ['RISE', 'SWELL', 'PEAK'],
    colors: ['#FFD700', '#FFA500', '#FF6347'],
    bgColor: '#0D0800',
    cycleDuration: 2.0,
    peakScale: 1.25,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RISE', 'SWELL', 'PEAK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFA500', '#FF6347'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0800', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 8, group: 'Timing' },
    { key: 'peakScale', label: 'Peak Scale', type: 'number', defaultValue: 1.25, min: 1.05, max: 2.0, group: 'Animation' },
  ],
})
