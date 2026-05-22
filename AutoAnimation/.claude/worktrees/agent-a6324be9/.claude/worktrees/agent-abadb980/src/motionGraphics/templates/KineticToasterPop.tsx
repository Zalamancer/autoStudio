import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ToasterPopConfig extends KineticBaseConfig {}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) {
    return n1 * t * t
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Toaster body */}
      <div
        style={{
          position: 'absolute',
          left: '20%',
          right: '20%',
          bottom: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.2))',
          border: '3px solid rgba(255,255,255,0.12)',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          boxShadow: 'inset 0 -12px 30px rgba(0,0,0,0.4)',
        }}
      />
      {/* Slot opening */}
      <div
        style={{
          position: 'absolute',
          left: '32%',
          right: '32%',
          bottom: '36%',
          height: 10,
          background: 'rgba(0,0,0,0.7)',
          borderRadius: '4px 4px 0 0',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6)',
        }}
      />
      {/* Toaster feet */}
      {[0.22, 0.75].map((x, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            bottom: 0,
            width: '4%',
            height: '5%',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '0 0 4px 4px',
          }}
        />
      ))}
      {/* Lever on side */}
      <div
        style={{
          position: 'absolute',
          left: '20%',
          bottom: '18%',
          width: 14,
          height: 30,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 7,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />
      {/* Heating glow inside slot */}
      <div
        style={{
          position: 'absolute',
          left: '34%',
          right: '34%',
          bottom: '38%',
          height: 6,
          background: 'radial-gradient(ellipse, rgba(255,120,0,0.3), transparent)',
          filter: 'blur(4px)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    height,
  }: WordRenderProps) => {
    // Text pops up from slot: starts at slot level, launches upward with arc, settles with bounce
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let rotateZ = 0

    // Slot is at ~38% from bottom, text origin starts there
    const slotY = height * 0.38
    const launchHeight = height * 0.52 // how high above slot it goes
    const restY = height * 0.15    // resting position above slot (floats in center area)

    if (phase === 'enter') {
      if (enterProgress < 0.15) {
        // Pre-launch: visible in slot, slight pre-compression
        translateY = slotY + 20 * (1 - enterProgress / 0.15)
        scaleX = 0.9 + 0.1 * (enterProgress / 0.15)
        scaleY = 0.85 + 0.15 * (enterProgress / 0.15)
        opacity = enterProgress / 0.15
      } else {
        // LAUNCH: fast upward spring
        const launchT = (enterProgress - 0.15) / 0.85
        const bounced = easeOutBounce(Math.min(1, launchT * 1.1))
        const peakT = Math.min(1, launchT * 2)
        // Parabolic arc up, then settle
        translateY = slotY * (1 - bounced) - launchHeight * Math.sin(launchT * Math.PI * 0.9) * (1 - launchT * 0.3) + restY * bounced
        scaleY = 1.3 - 0.3 * bounced // vertical stretch on launch
        scaleX = 0.85 + 0.15 * bounced
        rotateZ = Math.sin(launchT * Math.PI * 2) * 5 * (1 - launchT)
        opacity = 1
      }
    } else if (phase === 'hold') {
      // Slight heat shimmer floating
      const shimmer = Math.sin(holdProgress * Math.PI * 6) * 2
      translateY = restY - shimmer
      scaleY = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.02
      opacity = 1
      rotateZ = Math.sin(holdProgress * Math.PI * 3) * 1
    } else {
      // Exit: drops back down into slot
      const exitEased = easeInQuart(exitProgress)
      translateY = restY * (1 - exitEased) + slotY * exitEased + 20 * exitEased
      scaleY = 1 - exitEased * 0.3
      scaleX = 1 + exitEased * 0.15
      opacity = exitProgress < 0.6 ? 1 : (1 - exitProgress) / 0.4
    }

    // Heat shimmer particles
    const showHeat = phase === 'enter' && enterProgress > 0.1 && enterProgress < 0.5

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '38%',
        }}
      >
        {/* Heat ripple lines */}
        {showHeat && [1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: `${38 + i * 6}%`,
              left: `${35 + i * 3}%`,
              right: `${35 + i * 3}%`,
              height: 2,
              background: `${color}${Math.floor((0.15 - i * 0.04) * 255).toString(16).padStart(2, '0')}`,
              borderRadius: 1,
              filter: 'blur(2px)',
              transform: `scaleX(${1 - enterProgress * 0.5})`,
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            bottom: '38%',
            left: '50%',
            transform: `translateX(-50%) translateY(${-translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotateZ(${rotateZ}deg)`,
            transformOrigin: 'center bottom',
            opacity,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 138px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Impact', 'Anton', sans-serif",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textShadow: `3px 3px 0 rgba(0,0,0,0.4), 0 0 40px ${color}66`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function ToasterPopComponent(props: MotionGraphicProps<ToasterPopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-toaster-pop',
  title: 'Toaster Pop',
  description:
    'Text springs up from a toaster slot with parabolic launch arc, bounces to rest position, drops back in on exit.',
  tags: ['kinetic', 'typography', 'toaster', 'spring', 'pop', 'launch', 'mechanical', 'bounce'],
  category: 'captions',
  component: ToasterPopComponent as any,
  defaultConfig: {
    words: ['HOT', 'TOAST', 'CRISP', 'DONE'],
    colors: ['#FF8C00', '#FFD700', '#FF6347', '#FFA500'],
    bgColor: '#1a1008',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HOT', 'TOAST', 'CRISP', 'DONE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF8C00', '#FFD700', '#FF6347', '#FFA500'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1008', group: 'Style' },
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
