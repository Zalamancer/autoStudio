import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RolodexConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const baseW = Math.min(width * 0.7, height * 0.9)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Desk surface subtle grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              85deg, transparent, transparent 80px,
              rgba(100,80,50,0.02) 80px, rgba(100,80,50,0.02) 82px
            )`,
          }}
        />
        {/* Rolodex base / stand */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: baseW * 0.7,
            height: baseW * 0.08,
            background: 'linear-gradient(180deg, #555 0%, #444 40%, #3a3a3a 100%)',
            borderRadius: '0 0 6px 6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        />
        {/* Rotary spindle — left post */}
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: `calc(50% - ${baseW * 0.32}px)`,
            width: 8,
            height: baseW * 0.45,
            background: 'linear-gradient(90deg, #666, #888, #666)',
            borderRadius: 3,
            boxShadow: '2px 0 6px rgba(0,0,0,0.3)',
          }}
        />
        {/* Rotary spindle — right post */}
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            right: `calc(50% - ${baseW * 0.32}px)`,
            width: 8,
            height: baseW * 0.45,
            background: 'linear-gradient(90deg, #666, #888, #666)',
            borderRadius: 3,
            boxShadow: '-2px 0 6px rgba(0,0,0,0.3)',
          }}
        />
        {/* Card stack behind — fanned cards */}
        {Array.from({ length: 5 }, (_, i) => {
          const cardAngle = (i - 2) * 3
          const cardY = 4 + Math.abs(i - 2) * 2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${28 + cardY}%`,
                left: '50%',
                width: baseW * 0.58,
                height: baseW * 0.28,
                transform: `translateX(-50%) rotate(${cardAngle}deg)`,
                background: i % 2 === 0
                  ? 'linear-gradient(180deg, #f8f4ec, #f0ebe0)'
                  : 'linear-gradient(180deg, #f5f0e5, #ede6d8)',
                borderRadius: '3px 3px 0 0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                zIndex: i,
              }}
            >
              {/* Faint ruled lines on background cards */}
              {Array.from({ length: 3 }, (_, l) => (
                <div
                  key={l}
                  style={{
                    position: 'absolute',
                    top: `${30 + l * 22}%`,
                    left: '10%',
                    right: '10%',
                    height: 1,
                    background: 'rgba(100,140,200,0.08)',
                  }}
                />
              ))}
            </div>
          )
        })}
        {/* Alphabetical tab — top index notch */}
        <div
          style={{
            position: 'absolute',
            top: '24%',
            left: `calc(50% + ${baseW * 0.15}px)`,
            width: baseW * 0.08,
            height: baseW * 0.04,
            background: 'linear-gradient(180deg, #d4c9b5, #c8bca8)',
            borderRadius: '4px 4px 0 0',
            boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
            zIndex: 6,
          }}
        />
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
    index,
    width,
    height,
  }: WordRenderProps) => {
    const baseW = Math.min(width * 0.7, height * 0.9)
    let opacity = 0
    let rotateX = 0
    let translateY = 0
    let zIndex = 10

    if (phase === 'enter') {
      // Card flips forward from the stack — 3D rotation
      if (enterProgress < 0.6) {
        const flipT = enterProgress / 0.6
        const eased = 1 - Math.pow(1 - flipT, 2)
        rotateX = -90 + eased * 90
        opacity = eased
        translateY = (1 - eased) * -20
        zIndex = 10
      } else {
        // Settle with small bounce
        const settleT = (enterProgress - 0.6) / 0.4
        rotateX = Math.sin(settleT * Math.PI) * -4
        opacity = 1
        translateY = Math.sin(settleT * Math.PI) * -3
      }
    } else if (phase === 'hold') {
      opacity = 1
      rotateX = 0
      translateY = 0
      // Gentle idle sway
      rotateX = Math.sin(holdProgress * Math.PI * 2) * 0.5
    } else {
      // Flip card away
      const eased = exitProgress * exitProgress
      rotateX = eased * 90
      opacity = 1 - eased
      translateY = eased * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: baseW * 0.58,
          height: baseW * 0.28,
          transform: `translateX(-50%) translateY(${translateY}px) perspective(600px) rotateX(${rotateX}deg)`,
          transformOrigin: 'center top',
          opacity,
          zIndex,
          background: 'linear-gradient(180deg, #faf6ee, #f2ece0)',
          borderRadius: '3px 3px 0 0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Card content area with ruled lines */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {Array.from({ length: 4 }, (_, l) => (
            <div
              key={l}
              style={{
                position: 'absolute',
                top: `${25 + l * 20}%`,
                left: '8%',
                right: '8%',
                height: 1,
                background: 'rgba(100,140,200,0.12)',
              }}
            />
          ))}
        </div>
        {/* Word text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: `clamp(20px, ${baseW * 0.06}px, 52px)`,
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RolodexComponent(props: MotionGraphicProps<RolodexConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rolodex',
  title: 'Kinetic Rolodex',
  description:
    'Rolodex rotary card file with metal spindle posts and fanned index cards. Each entry flips forward with 3D perspective rotation and settles with a bounce.',
  tags: ['kinetic', 'typography', 'rolodex', 'cards', 'flip', 'analog', 'office', 'mechanical', 'index'],
  category: 'captions',
  component: RolodexComponent as any,
  defaultConfig: {
    words: ['ANDERSON', 'BAKER', 'CLARK', 'DAVIS'],
    colors: ['#2a2a2a', '#2a2a2a', '#2a2a2a', '#2a2a2a'],
    bgColor: '#3a3530',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ANDERSON', 'BAKER', 'CLARK', 'DAVIS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a2a2a', '#2a2a2a', '#2a2a2a', '#2a2a2a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3a3530', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
