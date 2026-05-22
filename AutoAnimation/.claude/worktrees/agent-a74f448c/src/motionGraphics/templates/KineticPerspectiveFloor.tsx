import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PerspectiveFloorConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Perspective grid floor
    const gridLines: React.ReactNode[] = []

    // Horizontal depth lines (converging to vanishing point)
    for (let i = 0; i < 10; i++) {
      const y = 55 + i * 5 // Lines from center to bottom
      const opacity = 0.04 + (i / 10) * 0.08
      gridLines.push(
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: `${y}%`,
            height: 1,
            background: `rgba(255,255,255,${opacity})`,
            pointerEvents: 'none',
          }}
        />
      )
    }

    // Vertical perspective lines converging at top center
    for (let i = 0; i < 8; i++) {
      const xPct = 15 + (i / 7) * 70
      const topX = 50 // Vanishing point
      const opacity = 0.03 + Math.abs(i - 3.5) / 7 * 0.04
      // Use linear gradient trick: line from (topX, 50%) to (xPct, 100%)
      gridLines.push(
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.min(topX, xPct)}%`,
            top: '50%',
            width: `${Math.abs(xPct - topX) + 0.5}%`,
            height: '50%',
            borderLeft: xPct < topX ? `1px solid rgba(255,255,255,${opacity})` : 'none',
            borderRight: xPct >= topX ? `1px solid rgba(255,255,255,${opacity})` : 'none',
            transformOrigin: xPct < topX ? 'top right' : 'top left',
            pointerEvents: 'none',
          }}
        />
      )
    }

    // Ambient light glow at vanishing point
    const glowPulse = 0.06 + Math.sin(time * 1.5) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {gridLines}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            width: '40%',
            height: '20%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse, rgba(255,255,255,${glowPulse}), transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // The core effect: text starts flat on the floor (extreme rotateX) and tilts up to face camera
    let rotateX = 0
    let translateY = 0
    let scaleY = 1
    let opacity = 1
    let shadowBlur = 0
    let perspective = 900

    if (phase === 'enter') {
      // Start flat on floor (85deg) -> tilt up to face camera (0deg)
      const t = easeOutBack(enterProgress)
      rotateX = 85 * (1 - t) // 85 -> 0
      translateY = (1 - t) * 30 // Shift down while flat, rise as tilts up
      scaleY = 0.15 + t * 0.85 // Very compressed when flat -> normal
      opacity = Math.min(1, enterProgress * 2.5)
      shadowBlur = (1 - t) * 30
    } else if (phase === 'hold') {
      // Subtle breathing tilt
      rotateX = Math.sin(holdProgress * Math.PI * 2) * 3
      translateY = Math.sin(holdProgress * Math.PI * 2) * 2
    } else {
      // Fall back to floor
      const t = easeInCubic(exitProgress)
      rotateX = t * 85
      translateY = t * 30
      scaleY = 1 - t * 0.85
      opacity = 1 - t
      shadowBlur = t * 30
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective,
          perspectiveOrigin: '50% 60%',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `rotateX(${rotateX}deg) translateY(${translateY}px) scaleY(${scaleY})`,
            transformOrigin: 'center bottom',
            transformStyle: 'preserve-3d',
            opacity,
          }}
        >
          {/* Floor shadow when text is tilted */}
          {(phase === 'enter' || phase === 'exit') && shadowBlur > 2 && (
            <div
              style={{
                position: 'absolute',
                bottom: -10,
                left: '10%',
                right: '10%',
                height: 8,
                background: `rgba(0,0,0,0.3)`,
                filter: `blur(${shadowBlur}px)`,
                borderRadius: '50%',
                transformOrigin: 'center bottom',
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(48px, 14vw, 170px)',
              fontWeight: 900,
              color,
              textShadow: `0 4px 20px ${color}44, 0 0 40px ${color}22`,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
          {/* Reflection on the floor */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(48px, 14vw, 170px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              letterSpacing: 4,
              textTransform: 'uppercase',
              opacity: 0.12,
              transform: 'scaleY(-0.4)',
              transformOrigin: 'top center',
              filter: 'blur(3px)',
              pointerEvents: 'none',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function PerspectiveFloorComponent(props: MotionGraphicProps<PerspectiveFloorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-perspective-floor',
  title: 'Kinetic Perspective Floor',
  description: 'Text starts flat on a perspective grid floor in extreme foreshortening, then tilts up to face the camera with elastic overshoot and floor reflection',
  tags: ['kinetic', 'typography', 'perspective', 'floor', '3d', 'tilt', 'depth', 'dramatic'],
  category: 'captions',
  component: PerspectiveFloorComponent as any,
  defaultConfig: {
    words: ['RISE', 'DEPTH', 'FLOOR', 'VIEW'],
    colors: ['#F472B6', '#A78BFA', '#60A5FA', '#34D399'],
    bgColor: '#0a0a12',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RISE', 'DEPTH', 'FLOOR', 'VIEW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F472B6', '#A78BFA', '#60A5FA', '#34D399'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
