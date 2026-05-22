import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CompassNeedleConfig extends KineticBaseConfig {}

// Spring overshoot easing — decaying oscillation, settles to 1
function springSettle(t: number): number {
  if (t >= 1) return 1
  const freq = 7
  const decay = 5
  return 1 - Math.cos(freq * t * Math.PI) * Math.exp(-decay * t)
}

function easeInQuad(t: number): number {
  return t * t
}

// Each word maps to a named heading so the needle sweeps to a meaningful angle
const WORD_HEADINGS = [0, 90, 180, 270, 45, 135, 315, 225]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const compassSize = Math.min(width, height) * 0.55

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Compass bezel ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: compassSize,
            height: compassSize,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
          }}
        />
        {/* Inner decorative ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: compassSize * 0.88,
            height: compassSize * 0.88,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        />
        {/* 8 cardinal tick marks via rotated divs */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 2,
              height: compassSize * 0.09,
              background: i % 2 === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
              transformOrigin: `1px ${compassSize * 0.5}px`,
              transform: `translateX(-1px) translateY(-${compassSize * 0.5}px) rotate(${i * 45}deg)`,
            }}
          />
        ))}
        {/* N label */}
        <div
          style={{
            position: 'absolute',
            top: `calc(50% - ${compassSize * 0.44}px)`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,80,80,0.6)',
            letterSpacing: '0.1em',
          }}
        >
          N
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
    index,
    width,
    height,
  }: WordRenderProps) => {
    const compassSize = Math.min(width, height) * 0.55
    const needleLength = compassSize * 0.42

    // Target heading for this word (0 = north/up)
    const targetDeg = WORD_HEADINGS[index % WORD_HEADINGS.length]
    const prevDeg = WORD_HEADINGS[(index - 1 + WORD_HEADINGS.length) % WORD_HEADINGS.length]

    let needleAngle: number
    let opacity = 1

    if (phase === 'enter') {
      const settled = springSettle(enterProgress)
      // Sweep from previous heading to target with spring overshoot
      const delta = ((targetDeg - prevDeg + 540) % 360) - 180
      needleAngle = prevDeg + delta * settled
      opacity = enterProgress < 0.2 ? enterProgress / 0.2 : 1
    } else if (phase === 'hold') {
      // Micro-jitter — needle dithers ±0.5° like a real compass
      needleAngle = targetDeg + Math.sin(exitProgress * 30) * 0.5
    } else {
      needleAngle = targetDeg + easeInQuad(exitProgress) * 90
      opacity = exitProgress > 0.65 ? 1 - (exitProgress - 0.65) / 0.35 : 1
    }

    // Convert heading to CSS rotation: 0=north means needle points up (-90deg in screen coords)
    const cssAngle = needleAngle - 90

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Needle — CSS-only with two rotated divs (red tip, white tail) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 0,
            height: 0,
          }}
        >
          {/* Red north tip */}
          <div
            style={{
              position: 'absolute',
              width: 4,
              height: needleLength,
              background: `linear-gradient(to bottom, ${color}, rgba(255,80,80,0.4))`,
              transformOrigin: '2px 100%',
              transform: `translateX(-2px) translateY(-${needleLength}px) rotate(${cssAngle}deg)`,
              borderRadius: '2px 2px 0 0',
            }}
          />
          {/* White south tail */}
          <div
            style={{
              position: 'absolute',
              width: 3,
              height: needleLength * 0.45,
              background: 'rgba(220,220,220,0.35)',
              transformOrigin: '1.5px 0%',
              transform: `translateX(-1.5px) rotate(${cssAngle + 180}deg)`,
              borderRadius: '0 0 2px 2px',
            }}
          />
          {/* Pivot hub */}
          <div
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              border: `1.5px solid ${color}`,
              transform: 'translate(-5px, -5px)',
            }}
          />
        </div>

        {/* Word below the compass */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(28px, 6vw, 88px)',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color,
            whiteSpace: 'nowrap',
            textShadow: `0 0 24px ${color}44`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CompassNeedleComponent(props: MotionGraphicProps<CompassNeedleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-compass-needle',
  title: 'Compass Needle',
  description:
    'A compass needle sweeps to a new heading with spring overshoot for each word — pure CSS needle with decaying oscillation mimicking real magnetised needle physics.',
  tags: [
    'kinetic',
    'typography',
    'maritime',
    'nautical',
    'compass',
    'needle',
    'navigation',
    'direction',
    'spring',
  ],
  category: 'captions',
  component: CompassNeedleComponent as any,
  defaultConfig: {
    words: ['NORTH', 'EAST', 'SOUTH', 'WEST'],
    colors: ['#e8dfc8', '#c8d8e8', '#dde8c8', '#e8c8d8'],
    bgColor: '#0e1520',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['NORTH', 'EAST', 'SOUTH', 'WEST'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#e8dfc8', '#c8d8e8', '#dde8c8', '#e8c8d8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e1520', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
  ],
})
