import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TurntableConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

/**
 * KineticTurntable
 * Text sits on a spinning platter that decelerates to face the viewer.
 * The rotation axis is Y — text spins from side-on (90°) to front-on (0°).
 * The deceleration curve is the reveal: text is unreadable until the platter
 * faces forward, then holds, then spins away.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const platSize = Math.min(width, height) * 0.72

    // Subtle plinth / stand lines
    const platY = cy + platSize * 0.08

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Platter rim ellipse — decorative only */}
        <div
          style={{
            position: 'absolute',
            left: cx - platSize * 0.5,
            top: platY - platSize * 0.07,
            width: platSize,
            height: platSize * 0.14,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
          }}
        />
        {/* Spindle dot */}
        <div
          style={{
            position: 'absolute',
            left: cx - 4,
            top: platY - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
          }}
        />
        {/* Slow ambient spin ring */}
        <div
          style={{
            position: 'absolute',
            left: cx - platSize * 0.48,
            top: cy - platSize * 0.48,
            width: platSize * 0.96,
            height: platSize * 0.96,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.04)',
            transform: `rotate(${time * 8}deg)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // rotateY: 90° = side-on (invisible edge), 0° = facing viewer
    let rotateY = 90
    let opacity = 1
    let scaleX = 1

    if (phase === 'enter') {
      const eased = easeOutQuart(enterProgress)
      rotateY = 90 - 90 * eased
      opacity = enterProgress < 0.35 ? enterProgress / 0.35 : 1
    } else if (phase === 'hold') {
      rotateY = 0
    } else {
      const eased = easeInQuart(exitProgress)
      rotateY = 90 * eased
      opacity = exitProgress > 0.65 ? 1 - (exitProgress - 0.65) / 0.35 : 1
    }

    // Simulate perspective foreshortening: as it rotates edge-on scaleX collapses
    scaleX = Math.cos((rotateY * Math.PI) / 180)
    scaleX = Math.max(0.001, scaleX)

    // Shading: darker at steep angles
    const brightness = 0.5 + 0.5 * Math.cos((rotateY * Math.PI) / 180)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          opacity,
        }}
      >
        {/* Platter surface that carries the text */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scaleX(${scaleX})`,
            transition: 'none',
          }}
        >
          {/* Edge-shadow on left side to reinforce 3-D */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8%',
              background: `linear-gradient(to right, rgba(0,0,0,${0.6 * (1 - brightness)}), transparent)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              filter: `brightness(${0.4 + 0.6 * brightness})`,
              textShadow: `0 2px 24px ${color}55`,
            }}
          >
            {word}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '8%',
              background: `linear-gradient(to left, rgba(0,0,0,${0.6 * (1 - brightness)}), transparent)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  },
}

function TurntableComponent(props: MotionGraphicProps<TurntableConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-turntable',
  title: 'Kinetic Turntable',
  description:
    'Text rides a spinning turntable platter that decelerates to face the viewer — rotation IS the reveal.',
  tags: ['kinetic', 'typography', 'turntable', 'spin', 'rotate', 'decelerate', 'mechanical', '3d'],
  category: 'captions',
  component: TurntableComponent as any,
  defaultConfig: {
    words: ['SPIN', 'DROP', 'PLAY', 'STOP'],
    colors: ['#F5A623', '#E8E8E8', '#FF6B6B', '#4ECDC4'],
    bgColor: '#0f0f0f',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPIN', 'DROP', 'PLAY', 'STOP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5A623', '#E8E8E8', '#FF6B6B', '#4ECDC4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f0f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
