import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FanUnfoldConfig extends KineticBaseConfig {
  blades: number
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__fanUnfoldConfig ?? { blades: 7 }
    const blades = Math.max(4, Math.min(12, config.blades ?? 7))

    let fanProgress = 0
    if (phase === 'enter') {
      fanProgress = easeOutElastic(enterProgress)
    } else if (phase === 'hold') {
      fanProgress = 1
    } else {
      fanProgress = 1 - easeInQuad(exitProgress)
    }

    // Fan is anchored at bottom-left corner. Blades fan out from 0 to 90 degrees.
    // Total sweep = 100 degrees (from -5 deg to 95 deg counterclockwise from bottom).
    const totalSweep = 95 // degrees
    const bladeAngleSpan = totalSweep / (blades - 1)
    const bladeLength = Math.sqrt(width * width + height * height) * 0.72
    const bladeWidth = bladeLength * 0.22

    const pivotX = width * 0.05
    const pivotY = height * 0.95

    const bladeElements = []

    for (let i = 0; i < blades; i++) {
      // Stagger: inner blades (lower angle) open first
      const staggerDelay = (i / blades) * 0.35
      const bladeProgress = Math.max(0, Math.min(1, (fanProgress - staggerDelay) / (1 - staggerDelay * 0.8)))

      // Final resting angle for this blade
      const finalAngle = -85 + i * bladeAngleSpan // from bottom pointing upward, sweeping right
      // Start angle: all collapsed at 0 (pointing straight down)
      const currentAngle = finalAngle * bladeProgress + (-90) * (1 - bladeProgress)

      // Color gradient across blades (uses the word color with varying opacity)
      const bladeOpacity = 0.55 + (i / blades) * 0.35
      const hueFactor = i / blades

      // Derive RGB interpolation from word color hex (fallback to a warm range)
      const r = Math.round(200 + hueFactor * 30)
      const g = Math.round(170 + hueFactor * 20)
      const b = Math.round(120 + hueFactor * 60)

      bladeElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: pivotX,
            top: pivotY,
            width: bladeLength,
            height: bladeWidth,
            transformOrigin: '0% 50%',
            transform: `rotate(${currentAngle}deg)`,
            background: `linear-gradient(90deg, rgba(${r},${g},${b},${bladeOpacity}) 0%, rgba(${r + 20},${g + 10},${b + 30},${bladeOpacity * 0.6}) 100%)`,
            borderRadius: `0 ${bladeWidth * 0.5}px ${bladeWidth * 0.5}px 0`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.2)`,
            border: '0.5px solid rgba(255,255,255,0.08)',
          }}
        />,
      )
    }

    // Pivot rivet
    const rivetSize = Math.min(width, height) * 0.03

    const textOpacity =
      phase === 'enter'
        ? Math.min(1, enterProgress * 2.5)
        : phase === 'hold'
          ? 1
          : 1 - exitProgress

    return (
      <>
        {/* Blades behind text */}
        {bladeElements}

        {/* Pivot point rivet */}
        <div
          style={{
            position: 'absolute',
            left: pivotX - rivetSize / 2,
            top: pivotY - rivetSize / 2,
            width: rivetSize,
            height: rivetSize,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(220,215,200,0.9) 0%, rgba(160,155,140,0.8) 100%)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />

        {/* Text on top of fan */}
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-40%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function FanUnfoldComponent(props: MotionGraphicProps<FanUnfoldConfig>) {
  ;(globalThis as any).__fanUnfoldConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fan-unfold',
  title: 'Kinetic Fan Unfold',
  description: 'Fan blades unfurl from the bottom-left corner with an elastic spring, sweeping open to reveal text',
  tags: ['kinetic', 'typography', 'fan', 'unfold', 'reveal', 'geometric', 'mechanical', 'sweep'],
  category: 'captions',
  component: FanUnfoldComponent as any,
  defaultConfig: {
    words: ['UNFURL', 'SWEEP', 'FAN', 'SPREAD'],
    colors: ['#FFF7E6', '#FFE0A3', '#FFD580', '#FFC845'],
    bgColor: '#180e04',
    cycleDuration: 1.6,
    blades: 7,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['UNFURL', 'SWEEP', 'FAN', 'SPREAD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFF7E6', '#FFE0A3', '#FFD580', '#FFC845'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#180e04', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'blades',
      label: 'Fan Blades',
      type: 'number',
      defaultValue: 7,
      min: 4,
      max: 12,
      group: 'Animation',
    },
  ],
})
