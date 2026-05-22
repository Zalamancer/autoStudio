import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VictoryRoyaleConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Golden radial burst */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 40%, rgba(255,215,0,${0.08 + Math.sin(time * 2) * 0.03}) 0%, transparent 60%)`,
          }}
        />

        {/* Animated light rays from center */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 360 + time * 15
          const rayLength = 60 + Math.sin(time * 3 + i * 0.5) * 15
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '40%',
                width: 3,
                height: `${rayLength}%`,
                background: `linear-gradient(180deg, rgba(255,215,0,0.08), transparent)`,
                transformOrigin: '50% 0%',
                transform: `rotate(${angle}deg)`,
              }}
            />
          )
        })}

        {/* Confetti particles */}
        {Array.from({ length: 20 }, (_, i) => {
          const x = pseudoRandom(i * 31) * width
          const baseY = pseudoRandom(i * 47) * height
          const fallSpeed = 40 + pseudoRandom(i * 67) * 60
          const y = (baseY + time * fallSpeed) % (height + 20) - 10
          const rotation = time * (100 + pseudoRandom(i * 83) * 200)
          const size = 4 + pseudoRandom(i * 97) * 6
          const hue = pseudoRandom(i * 113) * 360
          const wobble = Math.sin(time * 3 + i * 0.7) * 15
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x + wobble,
                top: y,
                width: size,
                height: size * 0.6,
                background: `hsl(${hue}, 80%, 60%)`,
                transform: `rotate(${rotation}deg)`,
                opacity: 0.7,
                borderRadius: 1,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    let opacity = 0
    let scale = 1
    let translateY = 0
    let crownOpacity = 0
    let letterSpacing = 0

    if (phase === 'enter') {
      const t = enterProgress
      // Dramatic scale slam
      opacity = Math.min(1, t * 4)
      if (t < 0.3) {
        scale = 3 - (t / 0.3) * 1.8
      } else if (t < 0.5) {
        scale = 1.2 + Math.sin((t - 0.3) / 0.2 * Math.PI) * 0.15
      } else {
        scale = 1.2
      }
      translateY = (1 - t) * -20
      crownOpacity = Math.max(0, (t - 0.5) * 2)
      letterSpacing = t * 6
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1.2 + Math.sin(holdProgress * Math.PI * 2) * 0.03
      translateY = Math.sin(holdProgress * Math.PI * 3) * 3
      crownOpacity = 1
      letterSpacing = 6
    } else {
      opacity = 1 - exitProgress * exitProgress
      scale = 1.2 + exitProgress * 0.3
      translateY = -exitProgress * 40
      crownOpacity = 1 - exitProgress
      letterSpacing = 6 + exitProgress * 4
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* "#1" placement badge */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: `translate(-50%, 0) scale(${Math.min(1, opacity * 1.5)})`,
            opacity: crownOpacity * 0.8,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(20px, 5vw, 40px)',
            fontWeight: 900,
            color: '#FFD700',
            textShadow: '0 0 15px rgba(255,215,0,0.4)',
            letterSpacing: 2,
          }}
        >
          #1
        </div>

        {/* Crown icon above text */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: `translate(-50%, ${translateY - 10}px) scale(${scale * 0.5})`,
            opacity: crownOpacity,
          }}
        >
          {/* Crown shape using CSS */}
          <div style={{ position: 'relative', width: 60, height: 40 }}>
            {/* Crown base */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 14,
                background: 'linear-gradient(180deg, #FFD700, #DAA520)',
                borderRadius: '0 0 4px 4px',
              }}
            />
            {/* Crown points */}
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: i * 13 + 3,
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: `${16 + (i === 2 ? 8 : i % 2 === 0 ? 4 : 0)}px solid #FFD700`,
                }}
              />
            ))}
            {/* Crown jewels */}
            {[0, 2, 4].map(i => (
              <div
                key={`jewel-${i}`}
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: i * 13 + 7,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: i === 2 ? '#FF4444' : '#4488FF',
                  boxShadow: `0 0 4px ${i === 2 ? 'rgba(255,0,0,0.5)' : 'rgba(68,136,255,0.5)'}`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Main victory text */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '48%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 14vw, 180px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing,
            textShadow: `0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.2), 0 4px 0 rgba(150,100,0,0.5)`,
            whiteSpace: 'nowrap',
            background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 40%, #FF8C00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `brightness(${1 + Math.sin(f * 0.1) * 0.1})`,
          }}
        >
          {word}
        </div>

        {/* Subtitle "VICTORY ROYALE" */}
        <div
          style={{
            position: 'absolute',
            top: '62%',
            left: '50%',
            transform: `translate(-50%, ${translateY}px)`,
            opacity: opacity * 0.7,
            fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(10px, 3vw, 20px)',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            letterSpacing: 6,
          }}
        >
          Victory Royale
        </div>
      </div>
    )
  },
}

function VictoryRoyaleComponent(props: MotionGraphicProps<VictoryRoyaleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-victory-royale',
  title: 'Kinetic Victory Royale',
  description:
    'Battle royale victory screen with golden gradient text, crown icon, #1 badge, falling confetti, and radiant light rays',
  tags: ['kinetic', 'typography', 'victory', 'royale', 'battle', 'game', 'winner', 'crown', 'fortnite'],
  category: 'captions',
  component: VictoryRoyaleComponent as any,
  defaultConfig: {
    words: ['WINNER', 'CHAMPION', 'LEGEND', 'VICTORY'],
    colors: ['#FFD700', '#FFA500', '#FFD700', '#FF8C00'],
    bgColor: '#0a0a14',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Victory Words',
      type: 'text-array',
      defaultValue: ['WINNER', 'CHAMPION', 'LEGEND', 'VICTORY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Text Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FFA500', '#FFD700', '#FF8C00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 1,
      max: 6,
      group: 'Timing',
    },
  ],
})
