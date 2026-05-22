import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrebleClefConfig extends KineticBaseConfig {
  inkColor: string
  paperColor: string
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const clefSize = Math.min(width, height) * 0.55

    // Treble clef stroke animation: draw the clef progressively
    const drawProgress = (time * 0.3) % 1
    const clefOpacity = 0.12 + 0.03 * Math.sin(time * 0.5)

    // Staff lines behind the clef
    const staffLineCount = 5
    const staffGap = clefSize * 0.07
    const staffTop = height * 0.5 - (staffLineCount * staffGap) / 2

    // Ink splatter spots for manuscript feel
    const splatters = [
      { x: 0.15, y: 0.25, r: 3, opacity: 0.06 },
      { x: 0.78, y: 0.72, r: 4, opacity: 0.05 },
      { x: 0.42, y: 0.85, r: 2.5, opacity: 0.04 },
      { x: 0.88, y: 0.18, r: 3.5, opacity: 0.05 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Aged paper texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 20% 80%, rgba(140,110,60,0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 20%, rgba(140,110,60,0.04) 0%, transparent 40%)
            `,
          }}
        />

        {/* Vignette edges for manuscript look */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 100px rgba(100,70,30,0.12)',
          }}
        />

        {/* Staff lines */}
        {Array.from({ length: staffLineCount }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: staffTop + i * staffGap,
              height: 1.5,
              background: 'rgba(80,55,30,0.18)',
            }}
          />
        ))}

        {/* Large decorative treble clef - drawn with SVG path */}
        <svg
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: clefSize,
            height: clefSize * 1.4,
            opacity: clefOpacity,
          }}
          viewBox="0 0 200 280"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="inkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2C1810" />
              <stop offset="100%" stopColor="#4A3020" />
            </linearGradient>
          </defs>
          {/* Treble clef approximation path */}
          <path
            d={`
              M 100 250
              C 100 250, 60 210, 60 170
              C 60 130, 90 100, 100 80
              C 110 60, 130 50, 130 70
              C 130 90, 100 110, 80 140
              C 60 170, 50 200, 70 220
              C 90 240, 130 230, 140 200
              C 150 170, 130 130, 100 110
              C 70 90, 55 60, 75 35
              C 95 10, 120 20, 120 20
              M 100 80
              L 100 250
            `}
            fill="none"
            stroke="url(#inkGrad)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={800}
            strokeDashoffset={800 - drawProgress * 800}
          />
        </svg>

        {/* Ink splatters */}
        {splatters.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              width: s.r * 2,
              height: s.r * 2,
              borderRadius: '50%',
              background: `rgba(44,24,16,${s.opacity})`,
            }}
          />
        ))}

        {/* Quill pen resting at corner */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            right: '8%',
            width: 60,
            height: 3,
            background: 'linear-gradient(to right, #4A3525, #8B7355, #C8A96E)',
            transform: 'rotate(-35deg)',
            borderRadius: 2,
            opacity: 0.25,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -4,
              top: -2,
              width: 8,
              height: 7,
              background: '#4A3525',
              clipPath: 'polygon(100% 50%, 0% 0%, 0% 100%)',
              opacity: 0.8,
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
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const eased = easeInOutCubic(enterProgress)

    let opacity = 1
    let scale = 1
    let strokeDashoffset = 0

    if (phase === 'enter') {
      opacity = eased
      scale = 0.85 + 0.15 * eased
      // Simulate handwriting reveal via clip
      strokeDashoffset = (1 - eased) * 100
    } else if (phase === 'exit') {
      const exitEased = easeInOutCubic(exitProgress)
      opacity = 1 - exitEased
      scale = 1 + 0.1 * exitEased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(36px, 9vw, 120px)',
            fontWeight: 600,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Georgia', 'Palatino', 'Garamond', serif",
            fontStyle: 'italic',
            letterSpacing: '0.08em',
            textShadow: '1px 2px 8px rgba(44,24,16,0.3)',
            clipPath: phase === 'enter' ? `inset(0 ${strokeDashoffset}% 0 0)` : undefined,
          }}
        >
          {word}
        </div>

        {/* Decorative flourish under the text */}
        <svg
          style={{
            display: 'block',
            margin: '4px auto 0',
            width: '80%',
            height: 12,
            opacity: phase === 'enter' ? eased * 0.4 : phase === 'exit' ? (1 - exitProgress) * 0.4 : 0.4,
          }}
          viewBox="0 0 200 20"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M 10 10 Q 50 0, 100 10 Q 150 20, 190 10"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.5}
          />
        </svg>
      </div>
    )
  },
}

function TrebleClefComponent(props: MotionGraphicProps<TrebleClefConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-treble-clef',
  title: 'Kinetic Treble Clef',
  description:
    'Treble clef flourish: text drawn with the flowing stroke of a treble clef, musical penmanship with ink on manuscript paper.',
  tags: ['kinetic', 'music', 'treble', 'clef', 'calligraphy', 'manuscript', 'ink', 'classical'],
  category: 'captions',
  component: TrebleClefComponent as any,
  defaultConfig: {
    words: ['ARIA', 'DOLCE', 'LEGATO', 'FINE'],
    colors: ['#3D2415', '#2C1810', '#4A2C17', '#5C3A20'],
    bgColor: '#F2E8D0',
    cycleDuration: 1.4,
    inkColor: '#2C1810',
    paperColor: '#F2E8D0',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ARIA', 'DOLCE', 'LEGATO', 'FINE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#3D2415', '#2C1810', '#4A2C17', '#5C3A20'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F2E8D0', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
