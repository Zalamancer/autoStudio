import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Era Aesthetic: 70s Disco Gold Revival
// Deep brown/amber/gold palette. Words spiral in from 0 rotation
// to upright with a mirror-ball sparkle burst — like a spotlight
// hitting a disco ball above the dance floor.
// Hold: text pulses to the imagined beat with golden shimmer.
// Background has rotating mirror-ball light dots.

interface SeventiesDiscoGoldConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Mirror-ball reflected light dots
    const dots = Array.from({ length: 24 }, (_, i) => {
      const seed = i * 61 + 11
      const speed = 0.4 + (seed % 5) * 0.15
      const angle = (time * speed * 60 + i * 15) % 360
      const radius = 20 + (seed % 30)
      const x = 50 + Math.cos((angle * Math.PI) / 180) * radius
      const y = 40 + Math.sin((angle * Math.PI) / 180) * radius * 0.5
      const phase2 = (time * 2 + i * 0.4) % 2
      const dotOp = Math.max(0, Math.sin(phase2 * Math.PI)) * 0.6
      const dotSize = 3 + (seed % 5)

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: ['#ffd700', '#ffaa00', '#ffffff', '#ffcc44'][(seed) % 4],
            opacity: dotOp,
            filter: 'blur(0.5px)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#1a0e00'
            ? 'radial-gradient(ellipse at 50% 30%, #2d1a00 0%, #1a0e00 70%)'
            : bgColor,
        }}
      >
        {dots}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let rotate = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Spiral in from rotation
      const t = enterProgress
      const eased = 1 - Math.pow(1 - t, 2)
      opacity = Math.min(t / 0.3, 1)
      rotate = (1 - eased) * -180
      scale = 0.4 + eased * 0.6
    } else if (phase === 'hold') {
      opacity = 1
      rotate = 0
      // Beat pulse
      const beat = Math.pow(Math.abs(Math.sin(Date.now() * 0.003 + index * 0.8)), 4)
      scale = 1 + beat * 0.03
    } else {
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      rotate = eased * 180
      scale = 1 - eased * 0.4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale}) translateY(${translateY}px)`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10vw, 145px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            background: `linear-gradient(180deg, #ffe066 0%, #ffd700 40%, #c8960c 70%, #ffd700 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            filter: `drop-shadow(0 0 8px rgba(255,180,0,0.5)) drop-shadow(0 2px 0px rgba(0,0,0,0.5))`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SeventiesDiscoGoldComponent(props: MotionGraphicProps<SeventiesDiscoGoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-seventies-disco-gold',
  title: 'Kinetic 70s Disco Gold',
  description: '70s disco revival — mirror-ball light dots, spiral-in entrance, gold gradient text, beat-pulse hold',
  tags: ['kinetic', 'typography', 'disco', '70s', 'gold', 'mirror-ball', 'retro', 'era'],
  category: 'captions',
  component: SeventiesDiscoGoldComponent as any,
  defaultConfig: {
    words: ['BOOGIE', 'HUSTLE', 'GROOVE', 'SHINE'],
    colors: ['#ffd700', '#ffd700', '#ffd700', '#ffd700'],
    bgColor: '#1a0e00',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOOGIE', 'HUSTLE', 'GROOVE', 'SHINE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffd700', '#ffd700', '#ffd700', '#ffd700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0e00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
