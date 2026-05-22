import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BallpointPenConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// Pressure variation: ballpoint pens show light/dark sections based on writing speed/pressure
// Simulate with per-character weight and opacity variation
const PRESSURE_PROFILE = Array.from({ length: 20 }, (_, i) => ({
  weight: 0.65 + rand(i * 31 + 7) * 0.45, // 0.65 to 1.1 (maps to stroke width)
  opacity: 0.7 + rand(i * 19 + 3) * 0.3,  // ink density variation
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Notebook lined paper */}
      {Array.from({ length: 16 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${6 + i * 6}%`,
            height: 1,
            background: i % 4 === 0 ? 'rgba(100,149,237,0.18)' : 'rgba(100,149,237,0.09)',
          }}
        />
      ))}
      {/* Red margin */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '10%',
          width: '1.5px',
          background: 'rgba(220,50,50,0.2)',
        }}
      />
      {/* Spiral holes suggestion */}
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '2%',
            top: `${8 + i * 12}%`,
            width: 10,
            height: 10,
            borderRadius: '50%',
            border: '1.5px solid rgba(180,180,180,0.3)',
            background: 'rgba(200,200,200,0.08)',
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 59
    const chars = word.split('')

    let globalOpacity = 1
    if (phase === 'exit') {
      // Ballpoint: crossed out with a single line
      globalOpacity = 1
    }

    // How far the strikethrough has progressed during exit
    const strikeProgress = phase === 'exit' ? easeInOutQuad(exitProgress) : 0
    const textFadeOnStrike = phase === 'exit' ? Math.max(0, 1 - (exitProgress - 0.7) / 0.3) : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'baseline',
          opacity: globalOpacity,
        }}
      >
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'baseline' }}>
          {chars.map((ch, ci) => {
            const pressureIdx = (ci + seed) % PRESSURE_PROFILE.length
            const pressure = PRESSURE_PROFILE[pressureIdx]

            // Stagger: each character drawn with slight delay, as pen moves across
            const staggerDelay = (ci / chars.length) * 0.6
            let charOpacity = 0
            let charClipRight = 100
            let strokeW = 0

            if (phase === 'enter') {
              const t = Math.max(0, Math.min(1, (enterProgress - staggerDelay) / (1 - staggerDelay * 0.5 + 0.01)))
              const ep = easeInOutQuad(t)
              charOpacity = t > 0 ? pressure.opacity * textFadeOnStrike : 0
              charClipRight = t > 0 ? (1 - ep) * 100 : 100
              // Pressure: as pen presses down at start of each char, stroke thickens
              strokeW = t > 0.05 ? pressure.weight * 1.5 * ep : 0
            } else if (phase === 'hold') {
              charOpacity = pressure.opacity
              charClipRight = 0
              // Slight pressure variation during hold — pen resting on paper
              strokeW = pressure.weight * (1.4 + Math.sin(holdProgress * Math.PI * 5 + ci * 1.1) * 0.15)
            } else {
              charOpacity = pressure.opacity * textFadeOnStrike
              charClipRight = 0
              strokeW = pressure.weight * 1.4
            }

            // Very slight baseline variations from hand movement
            const baselineShift = (rand(seed + ci * 7 + 1) - 0.5) * 3

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Segoe Script', 'Lucida Handwriting', 'Comic Sans MS', cursive",
                  fontSize: 'clamp(44px, 12vw, 148px)',
                  fontWeight: 400,
                  color,
                  opacity: charOpacity,
                  transform: `translateY(${baselineShift}px)`,
                  clipPath: `inset(0 ${charClipRight}% 0 0)`,
                  // Pressure variation via textShadow and stroke
                  WebkitTextStroke: strokeW > 0.1 ? `${strokeW * 0.4}px ${color}` : undefined,
                  textShadow:
                    strokeW > 0.5
                      ? `0 0 ${strokeW * 0.8}px ${color}50, ${strokeW * 0.3}px ${strokeW * 0.2}px 0 ${color}30`
                      : undefined,
                  whiteSpace: 'pre',
                  letterSpacing: 1,
                }}
              >
                {ch}
              </span>
            )
          })}

          {/* Strikethrough line during exit */}
          <div
            style={{
              position: 'absolute',
              top: '52%',
              left: 0,
              width: `${strikeProgress * 100}%`,
              height: 2.5,
              background: color,
              opacity: 0.85,
              borderRadius: 1,
              // Slight wobble on the strikethrough line
              transform: `rotate(${(rand(seed) - 0.5) * 2}deg)`,
            }}
          />
        </div>
      </div>
    )
  },
}

function BallpointPenComponent(props: MotionGraphicProps<BallpointPenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ballpoint-pen',
  title: 'Kinetic Ballpoint Pen',
  description:
    'Ballpoint pen writes text character by character with pressure variation and ink density changes, on lined notebook paper. Exit: crossed out with a pen strikethrough.',
  tags: ['kinetic', 'typography', 'ballpoint', 'pen', 'handwriting', 'notebook', 'pressure', 'write', 'cursive'],
  category: 'captions',
  component: BallpointPenComponent as any,
  defaultConfig: {
    words: ['WRITE', 'NOTE', 'DRAFT', 'SIGN'],
    colors: ['#1A237E', '#1B5E20', '#B71C1C', '#4A148C'],
    bgColor: '#FEFEFE',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WRITE', 'NOTE', 'DRAFT', 'SIGN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A237E', '#1B5E20', '#B71C1C', '#4A148C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FEFEFE', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.4, max: 6, group: 'Timing' },
  ],
})
