import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LevelUpBurstConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const STAT_LABELS = ['ATK', 'DEF', 'SPD', 'HP', 'MP', 'LCK']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Radiant golden burst from center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,215,0,${0.06 + Math.sin(time * 4) * 0.03}) 0%, transparent 50%)`,
          }}
        />

        {/* Rotating light beams */}
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * 360 + time * 25
          const beamAlpha = 0.04 + Math.sin(time * 2 + i * 0.4) * 0.02
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 2,
                height: '70%',
                background: `linear-gradient(180deg, rgba(255,215,0,${beamAlpha}), transparent 80%)`,
                transformOrigin: '50% 0%',
                transform: `rotate(${angle}deg)`,
              }}
            />
          )
        })}

        {/* Rising sparkle particles */}
        {Array.from({ length: 14 }, (_, i) => {
          const x = pseudoRandom(i * 41) * width
          const baseY = height + 20
          const riseSpeed = 30 + pseudoRandom(i * 67) * 50
          const y = baseY - ((time * riseSpeed + pseudoRandom(i * 89) * height) % (height + 40))
          const size = 2 + pseudoRandom(i * 101) * 3
          const twinkle = Math.sin(time * 6 + i * 2) > 0.3 ? 1 : 0.3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x + Math.sin(time * 2 + i) * 10,
                top: y,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `rgba(255,215,0,${0.5 * twinkle})`,
                boxShadow: `0 0 ${size * 2}px rgba(255,215,0,${0.3 * twinkle})`,
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
    let mainTextY = 0
    let shakeX = 0
    let shakeY = 0
    let ringScale = 0
    let statsOpacity = 0

    if (phase === 'enter') {
      const t = enterProgress
      opacity = Math.min(1, t * 4)

      // Explosive zoom slam
      if (t < 0.2) {
        scale = 4 - (t / 0.2) * 2.5
      } else if (t < 0.4) {
        scale = 1.5 + Math.sin((t - 0.2) / 0.2 * Math.PI) * 0.2
      } else {
        scale = 1.5
      }

      // Screen shake on impact
      shakeX = t < 0.3 ? Math.sin(f * 1.5) * 6 * (1 - t * 3) : 0
      shakeY = t < 0.3 ? Math.cos(f * 1.8) * 5 * (1 - t * 3) : 0

      // Ring burst expands
      ringScale = Math.min(1, t * 2)
      statsOpacity = Math.max(0, (t - 0.6) / 0.4)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1.5 + Math.sin(holdProgress * Math.PI * 3) * 0.04
      ringScale = 1
      statsOpacity = 1
    } else {
      opacity = 1 - exitProgress
      scale = 1.5 * (1 - exitProgress * 0.3)
      mainTextY = -exitProgress * 30
      ringScale = 1 - exitProgress * 0.5
      statsOpacity = 1 - exitProgress * 2
    }

    // Generate stat increases
    const statIncreases = STAT_LABELS.map((label, i) => ({
      label,
      value: Math.floor(pseudoRandom(index * 53 + i * 31) * 8) + 1,
      angle: (i / STAT_LABELS.length) * Math.PI * 2 - Math.PI / 2,
    }))

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Expanding ring burst */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '48%',
            transform: `translate(-50%, -50%) scale(${ringScale})`,
            width: 250,
            height: 250,
            borderRadius: '50%',
            border: `3px solid rgba(255,215,0,${0.3 * ringScale})`,
            opacity: opacity * 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '48%',
            transform: `translate(-50%, -50%) scale(${ringScale * 1.3})`,
            width: 250,
            height: 250,
            borderRadius: '50%',
            border: `1px solid rgba(255,215,0,${0.15 * ringScale})`,
            opacity: opacity * 0.4,
          }}
        />

        {/* Stat increase numbers orbiting around */}
        {statIncreases.map((stat, i) => {
          const radius = 120 + Math.sin(f * 0.05 + i) * 5
          const floatAngle = stat.angle + (f * 0.01)
          const sx = width / 2 + Math.cos(floatAngle) * radius
          const sy = height * 0.48 + Math.sin(floatAngle) * radius * 0.6
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: sx,
                top: sy,
                transform: 'translate(-50%, -50%)',
                opacity: Math.max(0, statsOpacity) * 0.9,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(8px, 2vw, 13px)',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: 1,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(14px, 3.5vw, 22px)',
                  fontWeight: 900,
                  color: '#00FF88',
                  textShadow: '0 0 8px rgba(0,255,136,0.4)',
                }}
              >
                +{stat.value}
              </div>
            </div>
          )
        })}

        {/* Main "LEVEL UP!" text */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '38%',
            transform: `translate(-50%, calc(-50% + ${mainTextY}px)) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFD700 30%, #FF8C00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 15px rgba(255,215,0,0.4)) drop-shadow(0 3px 0 rgba(150,100,0,0.5))`,
          }}
        >
          {word}
        </div>

        {/* Subtitle line */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '56%',
            transform: 'translate(-50%, 0)',
            opacity: statsOpacity * 0.6,
            fontFamily: "'Segoe UI', sans-serif",
            fontSize: 'clamp(10px, 2.5vw, 16px)',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: 4,
          }}
        >
          Stats Increased
        </div>
      </div>
    )
  },
}

function LevelUpBurstComponent(props: MotionGraphicProps<LevelUpBurstConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-level-up-burst',
  title: 'Kinetic Level Up Burst',
  description:
    'Explosive LEVEL UP text with radiant golden beams, expanding ring burst, orbiting stat increases (+ATK, +DEF), and rising sparkles',
  tags: ['kinetic', 'typography', 'level', 'up', 'rpg', 'game', 'burst', 'stats', 'xp'],
  category: 'captions',
  component: LevelUpBurstComponent as any,
  defaultConfig: {
    words: ['LEVEL UP!', 'LV. 50', 'MAX LV!', 'EVOLVED!'],
    colors: ['#FFD700', '#FFA500', '#FF4444', '#00FFAA'],
    bgColor: '#0a0a14',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Level Up Text',
      type: 'text-array',
      defaultValue: ['LEVEL UP!', 'LV. 50', 'MAX LV!', 'EVOLVED!'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Text Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FFA500', '#FF4444', '#00FFAA'],
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
