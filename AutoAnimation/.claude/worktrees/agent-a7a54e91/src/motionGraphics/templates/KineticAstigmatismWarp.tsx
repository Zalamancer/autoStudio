import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AstigmatismWarpConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Astigmatism: lens focuses horizontal and vertical lines at different focal distances
// Result: text is sharp in one axis and smeared in the perpendicular axis
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Orthogonal focus test pattern — crosshair lines
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: `rgba(255,255,255,${0.04 + Math.sin(time * 1.2) * 0.02})`,
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: `rgba(255,255,255,${0.04 + Math.cos(time * 0.9) * 0.02})`,
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Astigmatism oscillates between focusing horizontal (scaleX blur) and vertical (scaleY blur)
    // At entry: heavy astigmatic blur cycling between axes
    // On hold: subtle residual oscillation
    const stigmaPhase =
      phase === 'enter'
        ? Math.sin(time * 8) * (1 - eased) // oscillates as it corrects
        : phase === 'hold'
          ? Math.sin(time * 2.5) * 0.06
          : Math.sin(time * 5) * exitProgress

    // Horizontal stretch: positive stigmaPhase = horizontally smeared
    const scaleX = 1 + Math.max(0, stigmaPhase) * 3.5
    const scaleY = 1 + Math.max(0, -stigmaPhase) * 2.5

    // Blur amount correlated with distortion
    const blurX = Math.abs(stigmaPhase) * (phase === 'enter' ? (1 - eased) * 8 : 0.8)

    // Dual-focus ghost: one sharp in X, one sharp in Y
    const dualStrength = phase === 'enter' ? 1 - eased : phase === 'exit' ? exitProgress : 0.05

    const overallOpacity =
      phase === 'enter' ? Math.min(1, enterProgress * 2.5) : phase === 'exit' ? 1 - exitProgress : 1

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: overallOpacity }}>
        {/* Ghost A — horizontally sharp, vertically smeared */}
        {dualStrength > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scaleY(2)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              opacity: dualStrength * 0.18,
              filter: `blur(${dualStrength * 6}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}

        {/* Ghost B — vertically sharp, horizontally smeared */}
        {dualStrength > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scaleX(2)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              opacity: dualStrength * 0.18,
              filter: `blur(${dualStrength * 6}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}

        {/* Main text — astigmatic warp */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            filter: blurX > 0.1 ? `blur(${blurX}px)` : undefined,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function AstigmatismWarpComponent(props: MotionGraphicProps<AstigmatismWarpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-astigmatism-warp',
  title: 'Kinetic Astigmatism Warp',
  description:
    'Text oscillates between horizontal and vertical axis blur — astigmatic correction animates the word from dual-axis smear to sharp focus',
  tags: ['kinetic', 'typography', 'astigmatism', 'aberration', 'warp', 'optical', 'blur', 'focus'],
  category: 'captions',
  component: AstigmatismWarpComponent as any,
  defaultConfig: {
    words: ['WARP', 'AXIS', 'SKEW', 'LENS'],
    colors: ['#E0E8FF', '#C8D8FF', '#F0F4FF', '#B8CCFF'],
    bgColor: '#050510',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WARP', 'AXIS', 'SKEW', 'LENS'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0E8FF', '#C8D8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
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
