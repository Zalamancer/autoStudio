import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlamDownConfig extends KineticBaseConfig {}

function easeInQuint(t: number): number {
  return t * t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Impact crack lines radiating from bottom center */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * 180 + 180 // lower half only
          const len = 60 + (i % 3) * 40
          const pulse = 0.3 + Math.sin(time * 8 + i) * 0.15
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: width / 2,
                top: height * 0.62,
                width: 1.5,
                height: len,
                background: `rgba(255,200,0,${pulse})`,
                transformOrigin: '0 0',
                transform: `rotate(${angle + 90}deg)`,
              }}
            />
          )
        })}
        {/* Shockwave ring at impact point */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '62%',
            transform: `translate(-50%, -50%) scale(${1 + Math.sin(time * 6) * 0.08})`,
            width: 120,
            height: 30,
            borderRadius: '50%',
            border: `2px solid rgba(255,200,0,${0.2 + Math.sin(time * 5) * 0.1})`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let shakeX = 0
    let shakeY = 0

    // Text rests slightly below center (near-bottom shelf)
    const restY = height * 0.1

    if (phase === 'enter') {
      // Accelerates in from above with gravity, slams to rest
      const dropHeight = height * 1.2

      if (enterProgress < 0.55) {
        // Freefall: fast easeIn from off-top
        const t = easeInQuint(enterProgress / 0.55)
        translateY = -dropHeight + t * dropHeight
        opacity = Math.min(1, enterProgress * 6)
        scaleY = 1 + (1 - t) * 0.3 // stretch during fall
        scaleX = 1 - (1 - t) * 0.15
      } else {
        // Impact zone: squash and screen shake
        const impactT = (enterProgress - 0.55) / 0.45
        translateY = restY * Math.min(1, impactT * 3)

        const squash = Math.exp(-impactT * 6) * Math.sin(impactT * 30)
        scaleX = 1 + squash * 0.5
        scaleY = 1 - squash * 0.35

        // Violent screen shake during impact
        if (impactT < 0.4) {
          const shakeStrength = (1 - impactT / 0.4) * 18
          shakeX = Math.sin(f * 3.1) * shakeStrength
          shakeY = Math.cos(f * 2.7) * shakeStrength * 0.7
        }
      }
    } else if (phase === 'hold') {
      translateY = restY
      // Settle resonance dying off
      const vib = Math.exp(-holdProgress * 10) * Math.sin(holdProgress * 50) * 3
      shakeX = vib
      scaleX = 1 + Math.exp(-holdProgress * 8) * 0.08
      scaleY = 1 - Math.exp(-holdProgress * 8) * 0.06
      opacity = 1
    } else {
      // Exit: ripped upward at high speed
      translateY = restY - exitProgress * exitProgress * height * 1.3
      scaleY = 1 + exitProgress * 0.4
      scaleX = 1 - exitProgress * 0.3
      opacity = 1 - exitProgress * 1.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '50%',
            transform: `translateX(-50%) translateY(${-translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center bottom',
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(48px, 13vw, 180px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textShadow: `0 8px 0 rgba(0,0,0,0.7), 0 0 40px ${color}80`,
              filter: `drop-shadow(0 12px 20px rgba(0,0,0,0.8))`,
            }}
          >
            {word}
          </div>
          {/* Ground dust cloud on impact */}
          {phase !== 'exit' && (
            <div
              style={{
                position: 'absolute',
                bottom: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${120 + (phase === 'enter' && enterProgress > 0.55 ? ((enterProgress - 0.55) / 0.45) * 80 : 0)}%`,
                height: 10,
                borderRadius: '50%',
                background: `rgba(255,200,0,${phase === 'hold' ? 0.15 - holdProgress * 0.12 : 0.25})`,
                filter: 'blur(6px)',
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function SlamDownComponent(props: MotionGraphicProps<SlamDownConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slam-down',
  title: 'Kinetic Slam Down',
  description:
    'Text slams down from above with gravitational freefall, violent squash on impact, full-screen shake, and radiating crack lines.',
  tags: ['kinetic', 'typography', 'slam', 'impact', 'physics', 'gravity', 'energy', 'force'],
  category: 'captions',
  component: SlamDownComponent as any,
  defaultConfig: {
    words: ['SLAM!', 'BOOM', 'CRASH', 'HIT'],
    colors: ['#FF4400', '#FFCC00', '#FF0066', '#00CCFF'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SLAM!', 'BOOM', 'CRASH', 'HIT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4400', '#FFCC00', '#FF0066', '#00CCFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
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
