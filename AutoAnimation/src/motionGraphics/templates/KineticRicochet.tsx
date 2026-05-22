import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RicochetConfig extends KineticBaseConfig {}

// Bounce path: text ricochets off 3 walls before landing center
// Wall hits at t=0.2, t=0.45, t=0.65 — each reverses primary axis velocity
function getRicochetPosition(t: number, width: number, height: number): { x: number; y: number; rotate: number } {
  // Keyframe positions and angles for each bounce segment
  // Start: top-right corner; hits right wall, then bottom wall, then left wall, lands center
  const keyframes = [
    { t: 0, x: width * 0.55, y: -height * 0.5, r: -35 }, // enter from top-right
    { t: 0.22, x: width * 0.42, y: height * 0.12, r: 20 }, // bounce off top-right
    { t: 0.45, x: -width * 0.38, y: height * 0.18, r: -15 }, // ricochet to left side
    { t: 0.65, x: width * 0.22, y: -height * 0.08, r: 8 }, // bounce to near-center
    { t: 1.0, x: 0, y: 0, r: 0 }, // settle center
  ]

  // Find segment
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]
    const b = keyframes[i + 1]
    if (t >= a.t && t <= b.t) {
      const seg = (t - a.t) / (b.t - a.t)
      // Ease-out within each segment for decelerating bounces
      const ease = 1 - Math.pow(1 - seg, 2)
      return {
        x: a.x + (b.x - a.x) * ease,
        y: a.y + (b.y - a.y) * ease,
        rotate: a.r + (b.r - a.r) * ease,
      }
    }
  }
  return { x: 0, y: 0, rotate: 0 }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Neon wall border lines */}
        {['top', 'bottom', 'left', 'right'].map((side, i) => {
          const pulse = 0.4 + Math.sin(time * 3 + i * 1.2) * 0.2
          const borderStyle = `2px solid rgba(0,255,200,${pulse})`
          const style: React.CSSProperties = { position: 'absolute' }
          if (side === 'top') {
            style.top = 12
            style.left = 12
            style.right = 12
            style.borderTop = borderStyle
          }
          if (side === 'bottom') {
            style.bottom = 12
            style.left = 12
            style.right = 12
            style.borderBottom = borderStyle
          }
          if (side === 'left') {
            style.left = 12
            style.top = 12
            style.bottom = 12
            style.borderLeft = borderStyle
          }
          if (side === 'right') {
            style.right = 12
            style.top = 12
            style.bottom = 12
            style.borderRight = borderStyle
          }
          return <div key={side} style={style} />
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let translateX = 0
    let translateY = 0
    let rotate = 0
    let opacity = 1
    let scaleX = 1
    let scaleY = 1

    if (phase === 'enter') {
      const pos = getRicochetPosition(enterProgress, width, height)
      translateX = pos.x
      translateY = pos.y
      rotate = pos.rotate
      opacity = Math.min(1, enterProgress * 8)

      // Squash at each bounce wall-hit
      const hitPoints = [0.22, 0.45, 0.65]
      for (const hit of hitPoints) {
        const dist = Math.abs(enterProgress - hit)
        if (dist < 0.06) {
          const squash = 1 - dist / 0.06
          scaleX = 1 + squash * 0.4
          scaleY = 1 - squash * 0.3
        }
      }
    } else if (phase === 'hold') {
      // Settled — micro-vibration fading out
      const vib = Math.exp(-holdProgress * 15) * Math.sin(holdProgress * 60) * 4
      translateX = vib
      translateY = vib * 0.5
      scaleX = 1 + Math.exp(-holdProgress * 10) * 0.06
      scaleY = 1 - Math.exp(-holdProgress * 10) * 0.04
      opacity = 1
    } else {
      // Exit: launches diagonally upward like a final ricochet
      const t = exitProgress * exitProgress
      translateX = t * width * 0.7
      translateY = -t * height * 0.7
      rotate = exitProgress * 25
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
          transformOrigin: 'center center',
          opacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(48px, 13vw, 180px)',
          fontWeight: 900,
          color,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textShadow: `3px 3px 0 rgba(0,0,0,0.6), 0 0 25px ${color}70`,
          filter: `drop-shadow(0 4px 10px rgba(0,0,0,0.7))`,
        }}
      >
        {word}
      </div>
    )
  },
}

function RicochetComponent(props: MotionGraphicProps<RicochetConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ricochet',
  title: 'Kinetic Ricochet',
  description:
    'Text bounces off three walls in rapid succession, ricocheting with squash on each impact before settling center. Neon border walls glow.',
  tags: ['kinetic', 'typography', 'ricochet', 'bounce', 'walls', 'physics', 'energy', 'neon'],
  category: 'captions',
  component: RicochetComponent as any,
  defaultConfig: {
    words: ['PING!', 'BOUNCE', 'RICO', 'BANG'],
    colors: ['#00FFCC', '#FF6600', '#FF00AA', '#FFFF00'],
    bgColor: '#080820',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PING!', 'BOUNCE', 'RICO', 'BANG'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FFCC', '#FF6600', '#FF00AA', '#FFFF00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080820', group: 'Style' },
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
