import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WindowShadeConfig extends KineticBaseConfig {
  wobbleIntensity: number
}

// Spring-loaded window shade: fast release then dampened oscillation at rest
function springSettle(t: number, frequency: number, decay: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  // Damped oscillation: 1 - e^(-decay*t) * cos(freq*t*pi)
  return 1 - Math.exp(-decay * t * 8) * Math.cos(frequency * t * Math.PI * 6)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__windowShadeConfig ?? { wobbleIntensity: 1 }
    const wobble = config.wobbleIntensity ?? 1

    // Shade starts pulled down (covering), spring-releases upward with wobble
    let shadeBottom = height // bottom edge of shade (height = fully covering)

    // After the shade rolls up past a point, that area is clear (text visible)
    let springProgress = 0

    if (phase === 'enter') {
      springProgress = springSettle(enterProgress, wobble * 0.7, 1.2)
      springProgress = Math.max(0, Math.min(1.15, springProgress)) // allow slight overshoot
    } else if (phase === 'hold') {
      // Gentle hanging sway
      springProgress = 1 + Math.sin(holdProgress * Math.PI * 2.5) * 0.015 * wobble
    } else {
      springProgress = 1 - easeInQuart(exitProgress) * 1.1
    }

    springProgress = Math.max(0, springProgress)
    shadeBottom = height * (1 - springProgress)

    // The shade hangs down from the top; its bottom edge is at shadeBottom
    // When shadeBottom < height, text is visible below shadeBottom...
    // Actually: shade rolls UP — starts at bottom = height (covering full view)
    // and rolls to bottom = 0 (fully retracted to top)
    const shadeHeight = Math.max(0, shadeBottom)

    // Roll cylinder at the bottom edge of the shade
    const rollRadius = 10
    const cylinderY = shadeHeight - rollRadius

    // Wobble lateral shift for the bottom edge (pendulum effect)
    const lateralWobble = phase === 'hold'
      ? Math.sin(holdProgress * Math.PI * 5) * 12 * wobble * (1 - holdProgress * 0.4)
      : phase === 'enter' && enterProgress > 0.6
      ? Math.sin((enterProgress - 0.6) * Math.PI * 8) * 8 * wobble * (1 - enterProgress)
      : 0

    const textOpacity = Math.min(1, Math.max(0, (1 - springProgress) < 0.85 ? springProgress * 1.5 : 1))

    // Material color for the shade — cream/beige roller blind
    const shadeColor = 'linear-gradient(180deg, #d4cfc4 0%, #c8c3b8 50%, #ddd8cc 100%)'

    return (
      <>
        {/* Text revealed as shade rolls up */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: `0 2px 20px ${color}44`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Shade panel */}
        {shadeHeight > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: lateralWobble * 0.15,
              width: width - Math.abs(lateralWobble) * 0.1,
              height: shadeHeight,
              background: shadeColor,
              boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 -2px 6px rgba(0,0,0,0.15)`,
              transformOrigin: 'top center',
            }}
          >
            {/* Horizontal texture lines */}
            {Array.from({ length: Math.floor(shadeHeight / 20) }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: i * 20 + 10,
                  left: 0,
                  width: '100%',
                  height: 1,
                  background: 'rgba(0,0,0,0.07)',
                }}
              />
            ))}

            {/* Bottom pull rail */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: 14,
                background: 'linear-gradient(180deg, #b8b3a8, #a09a8e)',
                boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
              }}
            />

            {/* Pull ring center */}
            <div
              style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: `translateX(calc(-50% + ${lateralWobble}px))`,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d0cbc0, #908880)',
                border: '2px solid rgba(0,0,0,0.2)',
                boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        )}

        {/* Mounting bar at very top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height: 16,
            background: 'linear-gradient(180deg, #606060, #484848)',
            boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
          }}
        />
      </>
    )
  },
}

function WindowShadeComponent(props: MotionGraphicProps<WindowShadeConfig>) {
  ;(globalThis as any).__windowShadeConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-window-shade',
  title: 'Kinetic Window Shade',
  description: 'Spring-loaded window shade snaps upward with realistic wobble and oscillation, revealing text beneath',
  tags: ['kinetic', 'typography', 'window', 'shade', 'spring', 'reveal', 'mechanical', 'everyday', 'wobble'],
  category: 'captions',
  component: WindowShadeComponent as any,
  defaultConfig: {
    words: ['ROLL', 'SNAP', 'SPRING', 'UP'],
    colors: ['#FCD34D', '#34D399', '#60A5FA', '#F87171'],
    bgColor: '#1c1c28',
    cycleDuration: 1.8,
    wobbleIntensity: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ROLL', 'SNAP', 'SPRING', 'UP'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FCD34D', '#34D399', '#60A5FA', '#F87171'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1c28', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'wobbleIntensity',
      label: 'Wobble Intensity',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 3,
      group: 'Animation',
    },
  ],
})
