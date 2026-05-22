import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpringDoorConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Door frame
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Door frame border */}
        <div
          style={{
            position: 'absolute',
            left: '18%',
            right: '18%',
            top: '10%',
            bottom: '5%',
            border: '5px solid rgba(255,255,255,0.1)',
            borderRadius: '4px 4px 0 0',
          }}
        />
        {/* Floor threshold */}
        <div
          style={{
            position: 'absolute',
            left: '16%',
            right: '16%',
            bottom: '4%',
            height: 8,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 4,
          }}
        />
        {/* Hinge marks on left */}
        {[0.25, 0.65].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '19%',
              top: `${10 + pos * 80}%`,
              width: 12,
              height: 20,
              background: 'rgba(255,255,255,0.18)',
              borderRadius: 3,
              transform: 'translateX(-50%)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    // Door swings open (rotateY from -80deg to 0), text comes through, door swings shut
    let doorRotateY = -80 // closed = rotated away (perspective from right hinge)
    let textTranslateX = -120 // text starts behind door (left side, behind frame)
    let textOpacity = 0
    let doorOpacity = 1
    // Door swing-back tracking for hold
    let doorSwingBack = 0

    if (phase === 'enter') {
      // Door swings open fast, then rebounds
      const doorEased = easeOutElastic(Math.min(1, enterProgress * 1.2))
      doorRotateY = -80 + 80 * doorEased // swings to 0 and overshoots

      // Text pushes through during mid-enter
      const textT = Math.max(0, (enterProgress - 0.2) / 0.8)
      const textEased = easeOutBack(Math.min(1, textT))
      textTranslateX = -120 * (1 - textEased)
      textOpacity = Math.min(1, textT * 2)
    } else if (phase === 'hold') {
      doorRotateY = 0
      // Door gently swings back a bit (spring loaded)
      doorSwingBack = Math.sin(holdProgress * Math.PI * 2) * 8 * Math.exp(-holdProgress * 3)
      doorRotateY = doorSwingBack
      textTranslateX = 0
      textOpacity = 1
    } else {
      // Door springs shut, text moves through and out right
      const exitEased = easeInOutQuad(exitProgress)
      doorRotateY = -80 * exitEased
      textTranslateX = 120 * exitEased
      textOpacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1000,
          perspectiveOrigin: '20% 50%', // hinge point on left
        }}
      >
        {/* Spring-loaded door panel */}
        <div
          style={{
            position: 'absolute',
            left: '18%',
            top: '10%',
            bottom: '5%',
            width: '64%',
            transformOrigin: 'left center',
            transform: `rotateY(${doorRotateY}deg)`,
            background: `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.15) 100%)`,
            border: `2px solid rgba(255,255,255,0.1)`,
            borderLeft: `4px solid rgba(255,255,255,0.18)`,
            borderRadius: '0 4px 4px 0',
            opacity: doorOpacity,
            boxShadow: `inset -8px 0 24px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Door panel lines */}
          {[0.3, 0.7].map((yp, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${yp * 100}%`,
                left: '10%',
                right: '10%',
                height: 2,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 1,
              }}
            />
          ))}
          {/* Door knob */}
          <div
            style={{
              position: 'absolute',
              right: '8%',
              top: '48%',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          />
        </div>

        {/* Text coming through the door */}
        <div
          style={{
            transform: `translateX(${textTranslateX}px)`,
            opacity: textOpacity,
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              textShadow: `2px 3px 0 rgba(0,0,0,0.4), 0 0 40px ${color}44`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function SpringDoorComponent(props: MotionGraphicProps<SpringDoorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spring-door',
  title: 'Spring Door',
  description:
    'Spring-loaded door swings open with elastic overshoot, text pushes through, then door snaps shut behind it.',
  tags: ['kinetic', 'typography', 'spring', 'door', 'mechanical', 'swing', 'perspective', '3d'],
  category: 'captions',
  component: SpringDoorComponent as any,
  defaultConfig: {
    words: ['OPEN', 'PUSH', 'ENTER', 'THROUGH'],
    colors: ['#64DFDF', '#80B3FF', '#FF9F1C', '#E9C46A'],
    bgColor: '#0d1117',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OPEN', 'PUSH', 'ENTER', 'THROUGH'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#64DFDF', '#80B3FF', '#FF9F1C', '#E9C46A'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1117', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
