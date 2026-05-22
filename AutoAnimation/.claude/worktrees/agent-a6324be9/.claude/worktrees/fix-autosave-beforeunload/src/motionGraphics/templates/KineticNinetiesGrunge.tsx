import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Era Aesthetic: 90s Grunge Revival (Nirvana / Riot Grrrl / Xerox zine)
// Washed-out, desaturated palette. Words appear via xerox noise static —
// fade in through a grainy stipple with rough edges, like photocopied
// 100 times. Text is mixed-size and slightly crooked. Background has
// photo-noise texture that shifts. Exit: burn into noise.

interface NinetiesGrungeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Shifting xerox noise — use a pseudo-random grid
    const noiseShift = Math.floor(time * 12) % 6
    const grainSize = 2 + noiseShift % 2

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#e8e0d4'
            ? 'linear-gradient(180deg, #e8e0d4 0%, #d8cfc0 100%)'
            : bgColor,
        }}
      >
        {/* Xerox grain overlay using diagonal stripe pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `repeating-linear-gradient(${45 + noiseShift * 5}deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) ${grainSize}px, transparent ${grainSize}px, transparent ${grainSize * 6}px)`,
              `repeating-linear-gradient(${135 + noiseShift * 3}deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) ${grainSize}px, transparent ${grainSize}px, transparent ${grainSize * 8}px)`,
            ].join(', '),
            pointerEvents: 'none',
          }}
        />
        {/* Dirty smudge splotch */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '30%',
            height: '25%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.04) 0%, transparent 70%)',
            transform: `rotate(${noiseShift * 3}deg)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let pixelate = 0
    let rotate = 0

    if (phase === 'enter') {
      // Xerox static resolve — grainy fade in with slight flicker
      const flicker = Math.random() > 0.85 ? 0.7 : 1
      opacity = Math.pow(enterProgress, 0.7) * flicker
      pixelate = (1 - enterProgress) * 4
      rotate = (1 - enterProgress) * -2
    } else if (phase === 'hold') {
      opacity = 1
      rotate = -1.5
    } else {
      // Burn into noise
      opacity = Math.pow(1 - exitProgress, 0.6)
      pixelate = exitProgress * 5
      rotate = -1.5 - exitProgress * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
          opacity,
          filter: pixelate > 0.5 ? `blur(${pixelate * 0.6}px) contrast(${1 + pixelate * 0.3})` : 'contrast(1.2)',
        }}
      >
        {/* Mixed-case xerox feel: first char bigger */}
        <div
          style={{
            fontFamily: "'Courier New', 'Arial', monospace",
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            color,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          <span style={{ fontSize: 'clamp(56px, 14vw, 190px)' }}>
            {word[0] || ''}
          </span>
          <span style={{ fontSize: 'clamp(36px, 9vw, 125px)' }}>
            {word.slice(1)}
          </span>
        </div>
      </div>
    )
  },
}

function NinetiesGrungeComponent(props: MotionGraphicProps<NinetiesGrungeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-nineties-grunge',
  title: 'Kinetic 90s Grunge',
  description: '90s grunge revival — xerox noise static resolve, mixed-size letterpress type, washed-out grain, crooked hold',
  tags: ['kinetic', 'typography', 'grunge', '90s', 'xerox', 'nirvana', 'zine', 'era'],
  category: 'captions',
  component: NinetiesGrungeComponent as any,
  defaultConfig: {
    words: ['SMELLS LIKE', 'NEVERMIND', 'WHATEVER', 'NEVERMORE'],
    colors: ['#2a1a0a', '#3a2a1a', '#1a1a2a', '#2a1a0a'],
    bgColor: '#e8e0d4',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SMELLS LIKE', 'NEVERMIND', 'WHATEVER', 'NEVERMORE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a1a0a', '#3a2a1a', '#1a1a2a', '#2a1a0a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8e0d4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
