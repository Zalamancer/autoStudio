import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Position Rhythm 2/4 — Reverb Trail
// Text enters with a reverb tail: multiple ghost copies spreading outward and decaying

interface ReverbTrailConfig extends KineticBaseConfig {
  reverbDecay: number
}

const TAIL_COUNT = 6

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Reverb room hint: subtle radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)`,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height }: WordRenderProps) => {
    // The "dry" signal position
    let dryOpacity = 1
    let dryX = 0
    let dryY = 0

    if (phase === 'enter') {
      dryOpacity = Math.min(1, enterProgress * 2)
      dryY = (1 - enterProgress) * -height * 0.3
    } else if (phase === 'hold') {
      dryOpacity = 1
      // Gentle floating during hold — reverb tails appear around it
      dryX = Math.sin(holdProgress * Math.PI * 3) * 8
      dryY = Math.cos(holdProgress * Math.PI * 2) * 5
    } else {
      dryOpacity = 1 - exitProgress
    }

    // Reverb tails: spread spherically from origin, decaying fast
    const tailElements = Array.from({ length: TAIL_COUNT }, (_, i) => {
      const age = (i + 1) / TAIL_COUNT // 0.16 → 1.0
      // Each tail is spatially spread and temporally decayed
      const angle = (i / TAIL_COUNT) * Math.PI * 2
      const spread = age * 32
      const tailX = dryX + Math.cos(angle) * spread * 0.5
      const tailY = dryY + Math.sin(angle) * spread * 0.3
      const tailOpacity =
        phase === 'hold'
          ? dryOpacity * Math.pow(0.55, i + 1)
          : phase === 'enter'
            ? dryOpacity * Math.pow(0.55, i + 1) * enterProgress
            : 0
      return { tailX, tailY, tailOpacity, key: i }
    })

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {tailElements.map(({ tailX, tailY, tailOpacity, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(calc(-50% + ${tailX}px), calc(-50% + ${tailY}px))`,
              opacity: tailOpacity,
              fontSize: 'clamp(48px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Garamond', 'Georgia', serif",
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              filter: `blur(${key * 0.8}px)`,
            }}
          >
            {word}
          </div>
        ))}
        {/* Dry signal */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(calc(-50% + ${dryX}px), calc(-50% + ${dryY}px))`,
            opacity: dryOpacity,
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Garamond', 'Georgia', serif",
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            textShadow: `0 0 40px ${color}60, 0 2px 20px rgba(0,0,0,0.4)`,
            zIndex: 10,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ReverbTrailComponent(props: MotionGraphicProps<ReverbTrailConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-reverb-trail',
  title: 'Kinetic Reverb Trail',
  description:
    'Text with reverb tails: multiple ghost copies radiate outward with exponential decay. Creates immersive room-reverb spatial depth.',
  tags: ['kinetic', 'position', 'reverb', 'trail', 'echo', 'spatial', 'depth', 'music'],
  category: 'captions',
  component: ReverbTrailComponent as any,
  defaultConfig: {
    words: ['REVERB', 'SPACE', 'ROOM'],
    colors: ['#C9B1FF', '#A27FFF', '#7B4FE0'],
    bgColor: '#08001A',
    cycleDuration: 1.5,
    reverbDecay: 0.55,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVERB', 'SPACE', 'ROOM'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C9B1FF', '#A27FFF', '#7B4FE0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08001A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'reverbDecay',
      label: 'Reverb Decay',
      type: 'number',
      defaultValue: 0.55,
      min: 0.1,
      max: 0.9,
      group: 'Animation',
    },
  ],
})
