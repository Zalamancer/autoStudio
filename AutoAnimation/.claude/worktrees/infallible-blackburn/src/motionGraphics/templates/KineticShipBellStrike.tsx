import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShipBellStrikeConfig extends KineticBaseConfig {}

// Bell strike: sharp impact then exponential ring-out (decaying oscillation)
function bellDecay(t: number): number {
  if (t <= 0) return 0
  const freq = 14
  const decay = 6
  return Math.sin(freq * t * Math.PI) * Math.exp(-decay * t)
}

// Ease-out quart for text settle
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Concentric shockwave rings that pulse outward on each strike
    // Rings expand and fade — timed to the enter phase (first 20% of cycle)
    const t = (frame / fps) % 0.5 // ring cycle independent of word cycle
    const ringScale = 1 + t * 6
    const ringOpacity = Math.max(0, 1 - t * 2)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Shockwave ring 1 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '2px solid rgba(255,220,100,0.6)',
            transform: `translate(-50%, -50%) scale(${ringScale})`,
            opacity: ringOpacity * 0.7,
            pointerEvents: 'none',
          }}
        />
        {/* Shockwave ring 2 — offset by half a cycle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '1px solid rgba(255,220,100,0.35)',
            transform: `translate(-50%, -50%) scale(${ringScale * 1.5})`,
            opacity: ringOpacity * 0.4,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    // On enter: text SLAMS in from scale 1.4 → 1.0, with a bell-ring lateral wobble
    // On hold: text vibrates with decaying bell oscillation (using total elapsed time)
    // On exit: text scales down and fades, like a bell fading to silence

    let scale = 1
    let translateY = 0
    let opacity = 1
    let wobbleX = 0

    if (phase === 'enter') {
      const ep = easeOutQuart(enterProgress)
      scale = 1.4 - ep * 0.4
      opacity = enterProgress
      // Sharp lateral ring wobble on strike
      wobbleX = bellDecay(enterProgress) * 18
    } else if (phase === 'hold') {
      // Decaying ring — uses holdProgress to continue the bell tail
      wobbleX = bellDecay(0.3 + enterProgress * 0.4) * 6
      scale = 1
      opacity = 1
    } else {
      // Exit: shrink and fade — like bell sound dying
      scale = 1 - exitProgress * 0.15
      opacity = 1 - exitProgress
      translateY = exitProgress * 10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${wobbleX.toFixed(2)}px), calc(-50% + ${translateY.toFixed(2)}px)) scale(${scale.toFixed(4)})`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 9vw, 128px)',
            fontWeight: 900,
            letterSpacing: '0.06em',
            color,
            whiteSpace: 'nowrap',
            textShadow: `0 0 30px ${color}66, 0 4px 0 rgba(0,0,0,0.3)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ShipBellStrikeComponent(props: MotionGraphicProps<ShipBellStrikeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ship-bell-strike',
  title: 'Ship Bell Strike',
  description:
    'Text slams in like a ship bell strike with a lateral ring-wobble and decaying oscillation — concentric shockwave rings pulse from center.',
  tags: [
    'kinetic',
    'typography',
    'maritime',
    'nautical',
    'bell',
    'strike',
    'impact',
    'oscillation',
    'ring',
  ],
  category: 'captions',
  component: ShipBellStrikeComponent as any,
  defaultConfig: {
    words: ['STRIKE', 'WATCH', 'BELL', 'RING'],
    colors: ['#d4af37', '#c8a832', '#e8c84a', '#d4af37'],
    bgColor: '#12141a',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STRIKE', 'WATCH', 'BELL', 'RING'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#d4af37', '#c8a832', '#e8c84a', '#d4af37'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12141a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.6,
      max: 5,
      group: 'Timing',
    },
  ],
})
