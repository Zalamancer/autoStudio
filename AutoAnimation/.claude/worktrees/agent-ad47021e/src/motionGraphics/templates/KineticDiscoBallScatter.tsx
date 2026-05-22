import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DiscoBallScatterConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Disco ball: hundreds of mirrored tiles scatter light beams across the room
const SPOTS = Array.from({ length: 18 }, (_, i) => ({
  x: rand(i * 71) * 100,
  y: rand(i * 53) * 100,
  size: 3 + rand(i * 37) * 8,
  hue: Math.floor(rand(i * 29) * 360),
  speed: 0.6 + rand(i * 19) * 1.4,
  phase: rand(i * 43) * Math.PI * 2,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scattered light spots from disco ball */}
        {SPOTS.map((spot, i) => {
          const x = spot.x + Math.sin(time * spot.speed + spot.phase) * 15
          const y = spot.y + Math.cos(time * spot.speed * 0.7 + spot.phase) * 10
          const brightness = 0.3 + Math.sin(time * spot.speed * 2 + spot.phase) * 0.2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: spot.size,
                height: spot.size,
                borderRadius: '50%',
                background: `hsl(${spot.hue}, 100%, 70%)`,
                opacity: brightness * 0.3,
                filter: `blur(${spot.size * 0.8}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
        {/* Disco ball glint at top center */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.1) 70%, transparent 100%)',
            boxShadow: '0 0 12px 4px rgba(255,255,255,0.15)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    const overallOpacity =
      phase === 'enter' ? Math.min(1, enterProgress * 2.5) : phase === 'exit' ? 1 - exitProgress : 1

    // Hold: text shimmer from disco lights sweeping across
    const sweepX = Math.sin(time * 1.5) * 80
    const sweepHue = (time * 120) % 360

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: overallOpacity }}>
        {/* Main text with disco sheen */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${0.8 + backEased * 0.2})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow:
              phase === 'hold'
                ? `0 0 20px rgba(255,255,255,0.3), 0 0 40px ${color}30`
                : `0 0 10px rgba(255,255,255,0.2)`,
          }}
        >
          {word}
        </div>

        {/* Sweeping disco light beam across text */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(50% + ${sweepX}px)`,
              transform: 'translate(-50%, -50%)',
              width: 40,
              height: '120px',
              background: `radial-gradient(ellipse at center, hsl(${sweepHue}, 100%, 70%) 0%, transparent 70%)`,
              opacity: 0.25,
              mixBlendMode: 'screen',
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function DiscoBallScatterComponent(props: MotionGraphicProps<DiscoBallScatterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-disco-ball-scatter',
  title: 'Kinetic Disco Ball Scatter',
  description:
    'Disco ball projection — scattered colored light spots dance across the frame while a sweeping beam illuminates the text with chromatic highlights',
  tags: ['kinetic', 'typography', 'disco', 'projection', 'scatter', 'light', 'party', 'dance'],
  category: 'captions',
  component: DiscoBallScatterComponent as any,
  defaultConfig: {
    words: ['DISCO', 'DANCE', 'GROOVE', 'SHINE'],
    colors: ['#FFFFFF', '#FFE8FF', '#E8F0FF', '#FFE8E8'],
    bgColor: '#080008',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DISCO', 'DANCE', 'GROOVE', 'SHINE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFE8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080008', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
