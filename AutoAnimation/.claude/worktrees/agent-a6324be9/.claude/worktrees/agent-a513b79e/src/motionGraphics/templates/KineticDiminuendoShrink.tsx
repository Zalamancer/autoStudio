import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Visual Music 2/4 — Diminuendo Shrink
// Text diminishes from ff to pp — opposite of crescendo, fading into silence

interface DiminuendoShrinkConfig extends KineticBaseConfig {
  minScale: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const cycleLen = 2.0
    const phase = (t % cycleLen) / cycleLen
    // Diminuendo: brightness reduces
    const intensity = (1 - easeOutCubic(phase)) * 0.25

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Shrinking radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle ${30 + (1 - phase) * 40}% at 50% 50%,
              rgba(150,200,255,${intensity}) 0%,
              transparent 100%)`,
          }}
        />
        {/* Fading volume bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '10%',
            right: '10%',
            height: 4,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(1 - phase) * 100}%`,
              marginLeft: `${phase * 100}%`,
              background: `linear-gradient(to right, rgba(150,200,255,0.8), rgba(100,150,255,0.2))`,
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
      opacity = Math.min(1, enterProgress * 2)
      scale = 1.3 - enterProgress * 0.05
    } else if (phase === 'hold') {
      // Diminuendo: scale decreases from 1.25 to 0.7 (easeOut curve)
      const dim = easeOutCubic(holdProgress)
      scale = 1.25 - dim * 0.55
      // Slight tremolo as it fades
      const tremolo = Math.sin(holdProgress * Math.PI * 12) * (1 - holdProgress) * 0.02
      scale += tremolo
      opacity = 0.95 - dim * 0.3 // subtle opacity fade too
    } else {
      opacity = (0.65 - holdProgress * 0.3) * (1 - exitProgress)
      scale = Math.max(0.65, 0.7 - exitProgress * 0.3)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textShadow: `0 0 ${60 - holdProgress * 40}px ${color}${Math.floor((1 - holdProgress) * 100).toString(16).padStart(2,'0')}, 0 2px 15px rgba(0,0,0,0.3)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function DiminuendoShrinkComponent(props: MotionGraphicProps<DiminuendoShrinkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-diminuendo-shrink',
  title: 'Kinetic Diminuendo Shrink',
  description:
    'Musical diminuendo: text recedes from fortissimo to pianissimo with easeOut curve. Tremolo quiver and fading glow as it diminishes to silence.',
  tags: ['kinetic', 'visual-music', 'diminuendo', 'shrink', 'fade', 'dynamics', 'classical', 'music'],
  category: 'captions',
  component: DiminuendoShrinkComponent as any,
  defaultConfig: {
    words: ['FADE', 'SOFT', 'STILL'],
    colors: ['#A8D8EA', '#87CEEB', '#6BB3D4'],
    bgColor: '#020810',
    cycleDuration: 2.0,
    minScale: 0.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FADE', 'SOFT', 'STILL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A8D8EA', '#87CEEB', '#6BB3D4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 8, group: 'Timing' },
    { key: 'minScale', label: 'Min Scale', type: 'number', defaultValue: 0.7, min: 0.3, max: 0.95, group: 'Animation' },
  ],
})
