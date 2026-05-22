import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MarkerStrokeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// Marker bleed positions at letter edges (simulated with pseudo-elements via absolute divs)
const BLEED_SPOTS = Array.from({ length: 10 }, (_, i) => ({
  xPercent: 5 + i * 9,
  yOffsetPercent: (rand(i * 37) - 0.5) * 30,
  size: 3 + rand(i * 23) * 4,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Whiteboard/paper subtle grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53
    const chars = word.split('')

    // Global wrapper state
    let globalOpacity = 1

    if (phase === 'exit') {
      // Fat marker is capped — text fades with a slight horizontal smear
      globalOpacity = 1 - easeOutQuart(exitProgress)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          opacity: globalOpacity,
        }}
      >
        {chars.map((ch, ci) => {
          const charSeed = seed + ci * 17
          // Stagger: each character is drawn slightly after previous
          const staggerDelay = (ci / chars.length) * 0.55
          let charOpacity = 1
          let clipRight = 100
          let bleedSize = 0
          let strokeWidth = 0

          if (phase === 'enter') {
            const t = Math.max(0, Math.min(1, (enterProgress - staggerDelay) / (1 - staggerDelay * 0.4 + 0.01)))
            const ep = easeOutQuart(t)
            charOpacity = t > 0 ? 1 : 0
            // Marker draws each letter via left-to-right clip
            clipRight = t > 0 ? (1 - ep) * 100 : 100
            bleedSize = t > 0 ? (1 - ep) * 3 : 0
            strokeWidth = ep * 2.5
          } else if (phase === 'hold') {
            clipRight = 0
            strokeWidth = 2.5
            // Marker ink slight sheen pulse
            bleedSize = 1 + Math.sin(holdProgress * Math.PI * 4 + ci * 0.9) * 0.5
          } else {
            clipRight = 0
            strokeWidth = 2.5
            bleedSize = 1
          }

          // Baseline micro-variation (hand holding marker)
          const baseShift = (rand(charSeed + 3) - 0.5) * 4

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                position: 'relative',
                fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(50px, 14vw, 168px)',
                fontWeight: 900,
                color,
                opacity: charOpacity,
                transform: `translateY(${baseShift}px)`,
                // Clip left to right as marker draws through
                clipPath: `inset(0 ${clipRight}% 0 0)`,
                // Marker ink bleed: thick WebkitTextStroke + inner shadow
                WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${color}` : undefined,
                textShadow:
                  bleedSize > 0
                    ? `
                      0 0 ${bleedSize * 2}px ${color}80,
                      ${bleedSize * 0.5}px 0 ${bleedSize}px ${color}50,
                      -${bleedSize * 0.5}px 0 ${bleedSize}px ${color}40
                    `
                    : `0 0 3px ${color}40`,
                whiteSpace: 'pre',
                letterSpacing: 2,
              }}
            >
              {ch}
            </span>
          )
        })}

        {/* Edge bleed dots — ink bleeding at stroke boundaries */}
        {phase !== 'exit' &&
          BLEED_SPOTS.map((spot, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `calc(50% + ${spot.yOffsetPercent}%)`,
                left: `${spot.xPercent}%`,
                width: spot.size * Math.min(1, enterProgress * 2),
                height: spot.size * Math.min(1, enterProgress * 2),
                borderRadius: '50%',
                background: color,
                opacity: 0.15 + rand(i * 11 + seed) * 0.2,
                filter: `blur(${1 + rand(i * 7) * 1.5}px)`,
              }}
            />
          ))}
      </div>
    )
  },
}

function MarkerStrokeComponent(props: MotionGraphicProps<MarkerStrokeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-marker-stroke',
  title: 'Kinetic Marker Stroke',
  description:
    'Fat marker draws text letter by letter with thick even strokes and visible ink bleed at edges, on a whiteboard background.',
  tags: ['kinetic', 'typography', 'marker', 'whiteboard', 'thick', 'stroke', 'ink', 'draw', 'bold'],
  category: 'captions',
  component: MarkerStrokeComponent as any,
  defaultConfig: {
    words: ['BOLD', 'MARK', 'THICK', 'DRAW'],
    colors: ['#E63946', '#2196F3', '#4CAF50', '#FF9800'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOLD', 'MARK', 'THICK', 'DRAW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E63946', '#2196F3', '#4CAF50', '#FF9800'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.4, max: 6, group: 'Timing' },
  ],
})
