import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LongShadowSweepConfig extends KineticBaseConfig {
  shadowLength: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle grid lines suggesting a flat surface
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ambient fill radial */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 80%)',
          }}
        />
        {/* Horizontal scanline grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 40px)',
            backgroundSize: '100% 40px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let scale = 1
    let shadowAngle = 0
    let shadowLength = 0
    let textOpacity = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.85 + p * 0.15
      textOpacity = p
      // Shadow sweeps from far left to natural position (225 deg)
      shadowAngle = 180 + (1 - p) * 90 // starts at 270, ends at 225
      shadowLength = 60 + (1 - p) * 140 // starts long, contracts to natural
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      textOpacity = 1
      // Light source slowly drifts — shadow angle oscillates gently
      shadowAngle = 225 + Math.sin(holdProgress * Math.PI * 2) * 8
      shadowLength = 60 + Math.sin(holdProgress * Math.PI * 3) * 5
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.1
      textOpacity = 1 - exitProgress
      shadowAngle = 225 + p * 90 // sweeps further to 315
      shadowLength = 60 + p * 160 // stretches out and off screen
    }

    const rad = (shadowAngle * Math.PI) / 180
    const steps = 20
    const stepSize = shadowLength / steps

    return (
      <>
        {/* Long shadow: stacked offset copies fading to transparent */}
        {Array.from({ length: steps }, (_, i) => {
          const t = (i + 1) / steps
          const ox = Math.cos(rad) * stepSize * (i + 1)
          const oy = Math.sin(rad) * stepSize * (i + 1)
          const layerOpacity = (1 - t) * 0.18 * opacity

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) scale(${scale})`,
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 6,
                color: 'rgba(0,0,0,0.9)',
                opacity: layerOpacity,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {word}
            </div>
          )
        })}
        {/* Main text layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            opacity: textOpacity,
            whiteSpace: 'nowrap',
            textShadow: `0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function LongShadowSweepComponent(props: MotionGraphicProps<LongShadowSweepConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-long-shadow-sweep',
  title: 'Kinetic Long Shadow Sweep',
  description: 'Flat long shadow sweeps across the frame as if a light source rotates past, contracting to a natural angle on hold, then stretching away on exit',
  tags: ['kinetic', 'typography', 'shadow', 'long-shadow', 'sweep', 'light', 'flat-design', 'bold'],
  category: 'captions',
  component: LongShadowSweepComponent as any,
  defaultConfig: {
    words: ['BOLD', 'CAST', 'LONG', 'DARK'],
    colors: ['#FFD93D', '#FF6B6B', '#4ECDC4', '#C77DFF'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.4,
    shadowLength: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOLD', 'CAST', 'LONG', 'DARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD93D', '#FF6B6B', '#4ECDC4', '#C77DFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'shadowLength', label: 'Shadow Length', type: 'number', defaultValue: 80, min: 20, max: 200, group: 'Animation' },
  ],
})
