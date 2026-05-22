import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JackInBoxConfig extends KineticBaseConfig {}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutSpring(t: number): number {
  // Damped spring — big overshoot then settle
  if (t === 0) return 0
  if (t >= 1) return 1
  const c4 = (2 * Math.PI) / 2.2
  return Math.pow(2, -9 * t) * Math.sin((t * 9 - 0.5) * c4) + 1
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Box body */}
      <div
        style={{
          position: 'absolute',
          left: '28%',
          right: '28%',
          bottom: 0,
          height: '38%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.2))',
          border: '3px solid rgba(255,255,255,0.14)',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          boxShadow: 'inset 0 -8px 24px rgba(0,0,0,0.3)',
        }}
      />
      {/* Polka-dot stripes on box */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${28 + i * 11}%`,
            bottom: 0,
            width: '2%',
            height: '38%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      ))}
      {/* Box lid — hinge on left side */}
      <div
        style={{
          position: 'absolute',
          left: '26%',
          right: '26%',
          bottom: '36%',
          height: 10,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 4,
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
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let rotateZ = 0

    // Text starts hidden inside the box (below fold line at ~38% from bottom)
    const boxTop = height * 0.38
    const hiddenY = boxTop + 40 // fully inside box
    const popHeight = height * 0.55 // how far above box it pops

    if (phase === 'enter') {
      if (enterProgress < 0.6) {
        // Tension build: slight compression, text hidden in box
        const tension = enterProgress / 0.6
        const shake = Math.sin(tension * Math.PI * 12) * tension * 6
        translateY = hiddenY
        scaleX = 1 + 0.05 * Math.sin(tension * Math.PI * 8)
        scaleY = 0.85
        opacity = 0
        rotateZ = shake
      } else {
        // POP: explosive spring upward
        const popT = (enterProgress - 0.6) / 0.4
        const popped = easeOutSpring(popT)
        translateY = hiddenY * (1 - popped) - popHeight * popped * 0.3
        scaleX = 0.85 + 0.15 * popped + Math.sin(popT * Math.PI * 4) * 0.08 * (1 - popT)
        scaleY = 1.3 - 0.3 * popped // big vertical stretch at pop
        opacity = Math.min(1, popT * 5)
        rotateZ = (1 - popped) * 20 - 10 + Math.sin(popT * Math.PI * 3) * 8 * (1 - popT)
      }
    } else if (phase === 'hold') {
      // Bobbing on spring
      const bob = Math.sin(holdProgress * Math.PI * 5) * Math.exp(-holdProgress * 3)
      translateY = -popHeight * 0.3 - bob * 12
      scaleX = 1 + bob * 0.03
      scaleY = 1 - bob * 0.03
      rotateZ = bob * 3
      opacity = 1
    } else {
      // Exit: springs back down into box
      const exitEased = easeInCubic(exitProgress)
      translateY = -popHeight * 0.3 * (1 - exitEased) + hiddenY * exitEased
      scaleY = 1 - exitEased * 0.4
      scaleX = 1 + exitEased * 0.2
      rotateZ = exitEased * -15
      opacity = exitProgress < 0.7 ? 1 : (1 - exitProgress) / 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '38%',
          transform: `translateX(-50%)`,
          transformOrigin: 'center bottom',
        }}
      >
        {/* Spring coil visual */}
        {phase === 'enter' && enterProgress >= 0.6 && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              transform: 'translateX(-50%)',
              width: 8,
              height: Math.max(8, 60 * ((enterProgress - 0.6) / 0.4)),
              background: `repeating-linear-gradient(0deg, ${color}55 0px, transparent 4px, ${color}33 8px)`,
              borderRadius: 4,
            }}
          />
        )}
        <div
          style={{
            transform: `translateY(${-translateY}px) rotateZ(${rotateZ}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center bottom',
            opacity,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: `2px 4px 0 rgba(0,0,0,0.35), 0 0 40px ${color}44`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function JackInBoxComponent(props: MotionGraphicProps<JackInBoxConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-jack-in-box',
  title: 'Jack In The Box',
  description:
    'Spring tension builds inside the box with shaking, then text explosively pops out with elastic overshoot and springs back on exit.',
  tags: ['kinetic', 'typography', 'spring', 'pop', 'jack', 'box', 'mechanical', 'toy', 'elastic'],
  category: 'captions',
  component: JackInBoxComponent as any,
  defaultConfig: {
    words: ['POP!', 'BOO!', 'SURPRISE', 'GOTCHA'],
    colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
    bgColor: '#1a0a2e',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['POP!', 'BOO!', 'SURPRISE', 'GOTCHA'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a2e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
  ],
})
