import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MousetrapSnapConfig extends KineticBaseConfig {}

// Ease: slow build then explosive snap
function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Base bar — the mousetrap platform */}
      <div
        style={{
          position: 'absolute',
          left: '15%',
          right: '15%',
          bottom: '30%',
          height: 6,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
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
    // Spring arm arc: before snap, text is held back (compressed down/forward)
    // After snap, springs up and overshoots
    let rotateZ = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let blur = 0

    const restY = height * 0.05 // resting Y offset above center

    if (phase === 'enter') {
      if (enterProgress < 0.55) {
        // Tension build: text pressed down, tilted forward
        const tension = enterProgress / 0.55
        const tensionEased = easeInExpo(tension)
        rotateZ = -28 * tensionEased // leans forward
        translateY = 80 * tensionEased // compressed toward trap
        scaleX = 1 + 0.15 * tensionEased
        scaleY = 1 - 0.1 * tensionEased
        opacity = 0.7 + 0.3 * tension
        blur = 0
      } else {
        // SNAP: explosive release — fast upward arc
        const snapT = (enterProgress - 0.55) / 0.45
        const snapped = easeOutElastic(snapT)
        rotateZ = -28 * (1 - snapped) + 12 * (1 - snapped) // snap through zero
        translateY = 80 * (1 - snapped) - restY * snapped
        scaleX = 1 + 0.15 * (1 - snapT * 0.5)
        scaleY = 1.25 - 0.3 * snapped // vertical stretch during snap
        blur = (1 - snapT) * 4 // motion blur at start of snap
        opacity = 1
      }
    } else if (phase === 'hold') {
      // Tiny oscillation settle
      const wobble = Math.sin(holdProgress * Math.PI * 8) * Math.exp(-holdProgress * 5)
      rotateZ = wobble * 4
      translateY = -restY
      scaleX = 1
      scaleY = 1
    } else {
      // Exit: snaps back down fast
      const exitEased = easeOutCubic(exitProgress)
      translateY = -restY + 120 * exitEased
      rotateZ = -20 * exitEased
      scaleY = 0.7 + 0.3 * (1 - exitEased)
      opacity = 1 - exitProgress * 0.9
      blur = exitEased * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Tension indicator bars */}
        {phase === 'enter' && enterProgress < 0.55 && (
          <>
            {[-1, 1].map((side) => (
              <div
                key={side}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: side === -1 ? '20%' : '70%',
                  width: 4,
                  height: `${(enterProgress / 0.55) * 30}%`,
                  background: `${color}66`,
                  borderRadius: 2,
                  transform: 'translateY(-50%)',
                  filter: 'blur(1px)',
                }}
              />
            ))}
          </>
        )}
        <div
          style={{
            transformOrigin: 'center bottom',
            transform: `translateY(${translateY}px) rotateZ(${rotateZ}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Impact', 'Anton', sans-serif",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textShadow: `3px 3px 0 rgba(0,0,0,0.4), 0 0 30px ${color}44`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function MousetrapSnapComponent(props: MotionGraphicProps<MousetrapSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mousetrap-snap',
  title: 'Mousetrap Snap',
  description:
    'Spring tension builds as text is pressed back, then explosive snap release launches text upward with elastic rebound.',
  tags: ['kinetic', 'typography', 'spring', 'snap', 'mousetrap', 'mechanical', 'explosive'],
  category: 'captions',
  component: MousetrapSnapComponent as any,
  defaultConfig: {
    words: ['SNAP', 'TRAP', 'CAUGHT', 'GOTCHA'],
    colors: ['#FF4444', '#FF8C00', '#FFD700', '#FF6B6B'],
    bgColor: '#1a1008',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SNAP', 'TRAP', 'CAUGHT', 'GOTCHA'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#FF8C00', '#FFD700', '#FF6B6B'],
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
