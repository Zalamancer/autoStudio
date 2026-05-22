import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FerrisWheelArcConfig extends KineticBaseConfig {
  accentColor: string
}

// Ease out cubic for smooth deceleration
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Ease in cubic for smooth acceleration
function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, config }: WordRenderProps) => {
    const cfg = config as FerrisWheelArcConfig
    const accentColor = cfg?.accentColor ?? '#e8003d'

    // Ferris wheel: text arrives on an arc from the bottom of the wheel,
    // rotating counterclockwise into the 12-o'clock (top) position.
    // Arc radius = 200px. Angle goes from 90deg (bottom) → 0deg (center-right) for enter.
    // We treat "12 o'clock" as the display position (angle = -90deg from right = top).

    let translateX = 0
    let translateY = 0
    let rotate = 0
    let opacity = 1
    let scale = 1

    const RADIUS = 180 // px — conceptual arc radius

    if (phase === 'enter') {
      const p = easeOutCubic(enterProgress)
      // Start angle: 90deg (bottom of wheel), end angle: 0deg (resting position = centre)
      const startAngle = Math.PI / 2   // bottom
      const endAngle   = 0             // center-right; word "comes to rest" centered
      const angle = startAngle + (endAngle - startAngle) * p
      translateX = Math.cos(angle) * RADIUS * (1 - p)
      translateY = Math.sin(angle) * RADIUS * (1 - p)
      rotate = (1 - p) * 90           // gondola stays upright but parent rotates
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.7 + 0.3 * p
    } else if (phase === 'exit') {
      const p = easeInCubic(exitProgress)
      // Exit: arc up and to the left (wheel keeps spinning)
      const angle = (-Math.PI / 2) * p
      translateX = Math.cos(angle) * RADIUS * p
      translateY = Math.sin(angle) * RADIUS * p - RADIUS * p * 0.3
      rotate = -p * 90
      opacity = 1 - p
      scale = 1 - p * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX.toFixed(2)}px), calc(-50% + ${translateY.toFixed(2)}px)) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
          opacity,
        }}
      >
        {/* Gondola frame accent */}
        <div
          style={{
            position: 'absolute',
            inset: '-6px -12px',
            border: `3px solid ${accentColor}`,
            borderRadius: 4,
            opacity: phase === 'hold' ? 0.6 : opacity * 0.6,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 9vw, 130px)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function FerrisWheelArcComponent(props: MotionGraphicProps<FerrisWheelArcConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ferris-wheel-arc',
  title: 'Ferris Wheel Arc',
  description: 'Text enters on a sweeping ferris-wheel arc from below, decelerating into the center like a gondola cresting the top of the wheel.',
  tags: ['kinetic', 'typography', 'carnival', 'circus', 'ferris wheel', 'arc', 'rotation', 'fun'],
  category: 'captions',
  component: FerrisWheelArcComponent as any,
  defaultConfig: {
    words: ['RIDE', 'SPIN', 'SOAR', 'FLY'],
    colors: ['#ffffff', '#ffe100', '#ffffff', '#ffe100'],
    bgColor: '#1a0a2e',
    cycleDuration: 1.4,
    accentColor: '#e8003d',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RIDE', 'SPIN', 'SOAR', 'FLY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffe100', '#ffffff', '#ffe100'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a2e', group: 'Style' },
    { key: 'accentColor', label: 'Gondola Accent', type: 'color', defaultValue: '#e8003d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.6, max: 5, group: 'Timing' },
  ],
})
