import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PendulumDropConfig extends KineticBaseConfig {
  armLength: number
}

function elasticOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1
}

/** Damped pendulum angle: swings from startAngle to 0 with diminishing oscillation */
function pendulumAngle(t: number, startAngle: number, swings: number): number {
  const decay = Math.exp(-3.5 * t)
  return startAngle * decay * Math.cos(t * Math.PI * swings)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Pivot point indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '2px',
          height: '15%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '14%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Pivot is at top-center. Text hangs below on a pendulum arm.
    // Starts from far right corner, swings across to rest at center-bottom.
    const pivotY = height * 0.15 // pivot near top
    const armLength = height * 0.55 // pendulum arm length

    // Rest position = hanging straight down (angle 0 from pivot)
    // Start position = angle ~70 degrees from right
    const startAngle = 75 * (Math.PI / 180) // radians, from right

    let angle = 0
    let opacity = 0
    let scaleX = 1
    let scaleY = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 4)
      // Pendulum swing with damping: starts at startAngle, swings to 0
      angle = pendulumAngle(enterProgress, startAngle, 2.2)
    } else if (phase === 'hold') {
      opacity = 1
      // Settled with tiny residual sway
      const microSway = Math.exp(-holdProgress * 8) * 0.04
      angle = Math.sin(holdProgress * Math.PI * 4) * microSway
      scaleX = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.005
    } else {
      // Exit: swings out to the LEFT this time
      opacity = 1 - exitProgress * 1.5
      if (opacity < 0) opacity = 0
      angle = -exitProgress * startAngle * 0.8
      scaleX = 1 + exitProgress * 0.1
      scaleY = 1 - exitProgress * 0.1
    }

    // Compute text center position from pivot + arm + angle
    const textX = width / 2 + Math.sin(angle) * armLength
    const textY = pivotY + Math.cos(angle) * armLength

    // Text rotates slightly with the pendulum (feels attached)
    const textRotation = angle * (180 / Math.PI) * 0.3

    return (
      <div
        style={{
          position: 'absolute',
          left: textX,
          top: textY,
          transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${textRotation}deg)`,
          transformOrigin: 'center top',
          opacity,
        }}
      >
        {/* Pendulum string */}
        <div
          style={{
            position: 'absolute',
            top: -armLength * 0.5,
            left: '50%',
            transform: `translateX(-50%) rotate(${-textRotation}deg)`,
            width: '2px',
            height: armLength * 0.5,
            background: `rgba(255,255,255,0.15)`,
            transformOrigin: 'top center',
          }}
        />
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textShadow: `4px 4px 0 rgba(0,0,0,0.4), 0 0 30px ${color}20`,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PendulumDropComponent(props: MotionGraphicProps<PendulumDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pendulum-drop',
  title: 'Kinetic Pendulum Drop',
  description: 'Text swings in from the upper-right corner on a pendulum arc with damped oscillation, settling to hang at center',
  tags: ['kinetic', 'typography', 'pendulum', 'swing', 'physics', 'arc', 'gravity', 'damped'],
  category: 'captions',
  component: PendulumDropComponent as any,
  defaultConfig: {
    words: ['SWING', 'ARC', 'HANG', 'DROP'],
    colors: ['#FBBF24', '#A78BFA', '#34D399', '#FB7185'],
    bgColor: '#0F0A1E',
    cycleDuration: 1.8,
    armLength: 55,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWING', 'ARC', 'HANG', 'DROP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FBBF24', '#A78BFA', '#34D399', '#FB7185'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0A1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 6, group: 'Timing' },
    { key: 'armLength', label: 'Arm Length', type: 'number', defaultValue: 55, min: 20, max: 90, group: 'Animation' },
  ],
})
