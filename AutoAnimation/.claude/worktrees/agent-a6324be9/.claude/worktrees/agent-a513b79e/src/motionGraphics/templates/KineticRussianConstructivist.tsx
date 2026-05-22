import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RussianConstructivistConfig extends KineticBaseConfig {}

// Russian Constructivist (Rodchenko/Lissitzky/UNOVIS) style:
// red/black/white palette, bold diagonal geometric shapes, grid-based
// layout, mechanical sans-serif, dramatic angular reveals
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Bold diagonal red bar — Rodchenko signature diagonal */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '50%',
            height: '140%',
            background: 'rgba(204,0,0,0.85)',
            transform: `skewX(-8deg)`,
            transformOrigin: 'top left',
          }}
        />
        {/* Black geometric bars — Constructivist grid */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: '#000000',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: 0,
            right: 0,
            height: '3px',
            background: '#000000',
            opacity: 0.5,
          }}
        />
        {/* Dynamic diagonal line (El Lissitzky Proun style) */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line x1="0" y1="100" x2="100" y2="0" stroke="#000000" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="#000000" strokeWidth="1" />
          <rect x="30" y="30" width="40" height="40" fill="none" stroke="rgba(204,0,0,0.6)" strokeWidth="0.8" />
        </svg>
        {/* Typography label at top — Constructivist text block feel */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '12px',
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(6px, 1.5vw, 14px)',
            fontWeight: 900,
            color: '#000000',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 0.4,
          }}
        >
          ПРОЕКТ
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let skewX = 0

    if (phase === 'enter') {
      // Slide in from left on diagonal — Constructivist mechanized motion
      opacity = Math.min(1, enterProgress * 2)
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      translateX = (1 - ease) * -60
      skewX = (1 - enterProgress) * -12
    } else if (phase === 'hold') {
      opacity = 1
      // No flourish — rigid, mechanical stillness (Constructivist discipline)
    } else {
      opacity = 1 - exitProgress
      translateX = exitProgress * 50
      skewX = exitProgress * 8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '55%', // offset right, away from the red diagonal
          transform: `translate(calc(-50% + ${translateX}px), -50%) skewX(${skewX}deg)`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(46px, 13vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: `3px 3px 0 rgba(0,0,0,0.6), -1px -1px 0 rgba(0,0,0,0.3)`,
            whiteSpace: 'nowrap',
            letterSpacing: -1,
            lineHeight: 0.9,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RussianConstructivistComponent(props: MotionGraphicProps<RussianConstructivistConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-russian-constructivist',
  title: 'Kinetic Russian Constructivist',
  description: 'Soviet Russian Constructivist poster style (Rodchenko/Lissitzky) with bold red diagonal, black geometric bars, Proun circle-square, and mechanical slide-in typography',
  tags: ['kinetic', 'typography', 'russian', 'constructivist', 'soviet', 'rodchenko', 'lissitzky', 'propaganda', 'avant-garde', 'geometric'],
  category: 'captions',
  component: RussianConstructivistComponent as any,
  defaultConfig: {
    words: ['FORWARD', 'UNITY', 'PROGRESS', 'BUILD'],
    colors: ['#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF'],
    bgColor: '#F5F0E0',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FORWARD', 'UNITY', 'PROGRESS', 'BUILD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 5, group: 'Timing' },
  ],
})
