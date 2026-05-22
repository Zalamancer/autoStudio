import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DoorOpenConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let doorAngle = 90 // Doors start closed
    let textOpacity = 0

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      doorAngle = 90 * (1 - eased)
      textOpacity = enterProgress > 0.5 ? (enterProgress - 0.5) * 2 : 0
    } else if (phase === 'hold') {
      doorAngle = 0
      textOpacity = 1
    } else {
      const eased = easeInExpo(exitProgress)
      doorAngle = 90 * eased
      textOpacity = exitProgress < 0.4 ? 1 : (1 - exitProgress) / 0.6
    }

    const doorStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      width: '50%',
      height: '100%',
      backfaceVisibility: 'hidden',
      background: `linear-gradient(180deg, ${color}22, ${color}11)`,
      borderRight: `1px solid ${color}33`,
      borderLeft: `1px solid ${color}33`,
      boxShadow: doorAngle > 5 ? `inset 0 0 30px rgba(0,0,0,0.3)` : 'none',
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: 1200,
          overflow: 'hidden',
        }}
      >
        {/* Text behind the doors */}
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
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              textShadow: `0 0 40px ${color}66, 0 4px 20px rgba(0,0,0,0.3)`,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>

        {/* Left door */}
        <div
          style={{
            ...doorStyle,
            left: 0,
            transformOrigin: 'left center',
            transform: `rotateY(${-doorAngle}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, rgba(0,0,0,0.05), rgba(0,0,0,0.2))`,
            }}
          />
          {/* Door handle */}
          <div
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 8,
              height: 40,
              borderRadius: 4,
              background: `${color}88`,
              boxShadow: `0 0 10px ${color}44`,
            }}
          />
        </div>

        {/* Right door */}
        <div
          style={{
            ...doorStyle,
            right: 0,
            transformOrigin: 'right center',
            transform: `rotateY(${doorAngle}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(-90deg, rgba(0,0,0,0.05), rgba(0,0,0,0.2))`,
            }}
          />
          {/* Door handle */}
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 8,
              height: 40,
              borderRadius: 4,
              background: `${color}88`,
              boxShadow: `0 0 10px ${color}44`,
            }}
          />
        </div>
      </div>
    )
  },
}

function DoorOpenComponent(props: MotionGraphicProps<DoorOpenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-door-open',
  title: 'Kinetic Door Open',
  description: 'Double doors swing open with 3D perspective to reveal text behind them',
  tags: ['kinetic', 'typography', '3d', 'door', 'reveal', 'perspective', 'swing'],
  category: 'captions',
  component: DoorOpenComponent as any,
  defaultConfig: {
    words: ['OPEN', 'YOUR', 'MIND', 'WIDE'],
    colors: ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981'],
    bgColor: '#0f0f14',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OPEN', 'YOUR', 'MIND', 'WIDE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
