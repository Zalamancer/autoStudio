import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CraneUpRevealConfig extends KineticBaseConfig {
  craneHeight: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Horizon line rises as camera cranes up — parallax ground/sky split
    const horizonY = 60 - Math.sin(time * 0.4) * 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Sky gradient — crane up reveals open sky */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, rgba(20,30,60,0.7) 0%, transparent ${horizonY}%, rgba(0,0,0,0.4) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Horizon glow — golden hour rim */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${horizonY}%`,
            height: 2,
            background: 'linear-gradient(to right, transparent, rgba(255,200,80,0.35), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle parallax ground — receding fast */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: `${100 - horizonY + 5}%`,
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 80%)',
            pointerEvents: 'none',
          }}
        />
        {/* Vertical guide lines — frame sensor gates */}
        {[0.25, 0.75].map((x, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Crane altitude indicator — thin progress bar */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: '10%',
            bottom: '10%',
            width: 2,
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 12,
            bottom: '10%',
            width: 2,
            height: `${(Math.sin(time * 0.4) * 0.5 + 0.5) * 80}%`,
            background: 'rgba(255,200,80,0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Crane up: text rises from below into frame
    let translateY = 0
    let opacity = 1
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Rises from +80% to 0 with ease-out — crane deceleration
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      translateY = (1 - ease) * 80
      opacity = Math.min(1, enterProgress * 2.5)
      blur = (1 - enterProgress) * 4
    } else if (phase === 'hold') {
      // Subtle floating — crane settling
      translateY = Math.sin(t * 0.8 + index) * 1.5
      opacity = 1
      scale = 1 + Math.sin(t * 1.1 + index * 0.5) * 0.005
    } else {
      // Continues up, craning past frame top
      const ease = Math.pow(exitProgress, 2)
      translateY = -ease * 60
      opacity = 1 - exitProgress * 0.9
      blur = exitProgress * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          textTransform: 'uppercase',
          textShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        {word}
      </div>
    )
  },
}

function CraneUpRevealComponent(props: MotionGraphicProps<CraneUpRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crane-up-reveal',
  title: 'Kinetic Crane Up Reveal',
  description:
    'Text rises into frame from below like a cinematic crane shot — deceleration ease, horizon parallax, altitude indicator, and floating hold',
  tags: ['kinetic', 'typography', 'crane', 'camera', 'cinematic', 'rise', 'film', 'movement'],
  category: 'captions',
  component: CraneUpRevealComponent as any,
  defaultConfig: {
    words: ['RISE', 'ABOVE', 'BEYOND', 'EPIC'],
    colors: ['#F5DEB3', '#FFD700', '#F5DEB3', '#FFFFFF'],
    bgColor: '#0d1520',
    cycleDuration: 1.6,
    craneHeight: 80,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RISE', 'ABOVE', 'BEYOND', 'EPIC'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F5DEB3', '#FFD700', '#F5DEB3', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1520', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'craneHeight',
      label: 'Crane Travel (px)',
      type: 'number',
      defaultValue: 80,
      min: 20,
      max: 200,
      group: 'Animation',
    },
  ],
})
