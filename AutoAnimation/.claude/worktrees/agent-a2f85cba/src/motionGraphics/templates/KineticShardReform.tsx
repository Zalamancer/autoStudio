import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShardReformConfig extends KineticBaseConfig {
  shardCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

// Deterministic shard offsets — broken glass scatter positions
function getShardOffset(charIndex: number, totalChars: number, shardIdx: number, seed: number) {
  const hash = (charIndex * 31 + shardIdx * 17 + seed * 7) % 100
  const angle = (hash / 100) * Math.PI * 2
  const dist = 0.15 + (hash % 40) / 100
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    rot: ((hash * 3.14) % 360) - 180,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle cracks in the background suggest broken state */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }} viewBox="0 0 100 100">
        <line x1="20" y1="10" x2="45" y2="55" stroke="white" strokeWidth="0.3" />
        <line x1="45" y1="55" x2="30" y2="80" stroke="white" strokeWidth="0.2" />
        <line x1="70" y1="15" x2="55" y2="48" stroke="white" strokeWidth="0.3" />
        <line x1="55" y1="48" x2="75" y2="85" stroke="white" strokeWidth="0.2" />
        <line x1="45" y1="55" x2="75" y2="48" stroke="white" strokeWidth="0.15" />
      </svg>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
          alignItems: 'center',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / totalChars) * 0.3
          let translateX = 0
          let translateY = 0
          let rotation = 0
          let opacity = 0
          let scale = 1
          let glintOpacity = 0

          if (phase === 'enter') {
            // Each char slides in from a broken-glass scatter position
            const shard = getShardOffset(ci, totalChars, 0, ci * 3)
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            const eased = easeOutBack(p)

            translateX = shard.x * width * (1 - eased)
            translateY = shard.y * height * (1 - eased)
            rotation = shard.rot * (1 - eased)
            scale = 0.2 + eased * 0.8
            opacity = Math.min(1, p * 2.5)
            // Glint on impact
            glintOpacity = Math.max(0, eased - 0.7) * 3
          } else if (phase === 'hold') {
            opacity = 1
            scale = 1
            // Micro-vibration — glass settling
            const decay = Math.max(0, 1 - holdProgress * 3)
            translateX = Math.sin(holdProgress * Math.PI * 12 + ci) * decay * 2
            translateY = Math.cos(holdProgress * Math.PI * 10 + ci * 1.5) * decay * 1.5
            glintOpacity = Math.sin(holdProgress * Math.PI * 2) * 0.05
          } else {
            // Shatter outward on exit
            const shard = getShardOffset(ci, totalChars, 1, ci * 5 + 13)
            const p = easeInExpo(exitProgress)
            translateX = shard.x * width * p * 1.5
            translateY = shard.y * height * p * 1.5
            rotation = shard.rot * p * 0.5
            opacity = 1 - exitProgress * exitProgress
            scale = 1 - p * 0.3
          }

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
                transformOrigin: 'center center',
                opacity,
              }}
            >
              {/* Glint highlight on shard impact */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, white, transparent 60%)`,
                  opacity: glintOpacity,
                  pointerEvents: 'none',
                  borderRadius: 2,
                  zIndex: 2,
                  mixBlendMode: 'overlay',
                }}
              />
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  display: 'block',
                  lineHeight: 1,
                  textShadow: `0 0 20px ${color}40, 2px 2px 0 rgba(0,0,0,0.4)`,
                  filter: `brightness(${1 + glintOpacity * 0.5})`,
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function ShardReformComponent(props: MotionGraphicProps<ShardReformConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shard-reform',
  title: 'Kinetic Shard Reform',
  description: 'Letters fly in from scattered broken-glass positions with rotation, snapping together with an elastic overshoot and glint on impact — like shattered glass rejoining.',
  tags: ['kinetic', 'typography', 'shard', 'shatter', 'glass', 'reform', 'fragment', 'assembly', 'snap', 'impact'],
  category: 'captions',
  component: ShardReformComponent as any,
  defaultConfig: {
    words: ['BREAK', 'SNAP', 'FORM', 'WHOLE'],
    colors: ['#87CEEB', '#4FC3F7', '#29B6F6', '#0288D1'],
    bgColor: '#0A0A14',
    cycleDuration: 1.6,
    shardCount: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREAK', 'SNAP', 'FORM', 'WHOLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#87CEEB', '#4FC3F7', '#29B6F6', '#0288D1'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'shardCount', label: 'Shard Count', type: 'number', defaultValue: 8, min: 4, max: 16, group: 'Animation' },
  ],
})
