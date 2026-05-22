import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LeafVeinConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle breathing pulse on background — like a leaf photosynthesizing
    const pulse = 0.02 + Math.sin(time * 0.8) * 0.01

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          boxShadow: `inset 0 0 80px rgba(100,160,60,${pulse})`,
        }}
      />
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    // Leaf vein branching: text grows in from a central midrib (left→right),
    // while a clip-path polygon sweeps out like a vein network branching sideways.

    const eased = phase === 'enter'
      ? easeOutExpo(enterProgress)
      : phase === 'exit'
      ? 1 - easeInExpo(Math.min(1, exitProgress * 1.1))
      : 1

    // Main midrib sweeps left to right
    const midribX = eased * 100  // percent

    // Secondary veins branch perpendicular at staggered intervals
    // We simulate this with a multi-point polygon that widens as midrib advances
    // The polygon starts as a thin horizontal band and fans out vertically
    const topSpread = eased * 55   // how far up the polygon fans
    const bottomSpread = eased * 55 // how far down

    // Build a polygon that looks like a leaf outline expanding from the midrib
    // Left anchor → spreads to elliptical leaf shape as progress increases
    const clipPath = `polygon(
      0% 50%,
      ${midribX * 0.15}% ${50 - topSpread * 0.4}%,
      ${midribX * 0.4}% ${50 - topSpread * 0.85}%,
      ${midribX * 0.6}% ${50 - topSpread}%,
      ${midribX * 0.8}% ${50 - topSpread * 0.85}%,
      ${midribX}% 50%,
      ${midribX * 0.8}% ${50 + bottomSpread * 0.85}%,
      ${midribX * 0.6}% ${50 + bottomSpread}%,
      ${midribX * 0.4}% ${50 + bottomSpread * 0.85}%,
      ${midribX * 0.15}% ${50 + bottomSpread * 0.4}%
    )`

    // Subtle oscillation during hold (leaf breathing in wind)
    const windSway = phase === 'hold'
      ? Math.sin(time * 1.8) * 1.5
      : 0

    const opacity = Math.min(1, eased * 1.3)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${windSway}px)`,
          opacity,
          clipPath,
          // clip-path is on the outer wrapper so it masks the text
        }}
      >
        <div
          style={{
            fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', serif",
            fontSize: 'clamp(38px, 9vw, 128px)',
            fontWeight: 400,
            letterSpacing: '0.08em',
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            textShadow: `0 1px 12px rgba(80,140,40,0.3)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LeafVeinComponent(props: MotionGraphicProps<LeafVeinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-leaf-vein',
  title: 'Leaf Vein Branch',
  description: 'Text grows in through a leaf-shaped clip-path that expands from the central midrib outward, mimicking vein branching.',
  tags: ['kinetic', 'typography', 'botanical', 'nature', 'leaf', 'vein', 'branch', 'organic', 'grow'],
  category: 'captions',
  component: LeafVeinComponent as any,
  defaultConfig: {
    words: ['FRESH', 'LUSH', 'GREEN', 'ALIVE'],
    colors: ['#7DC26A', '#5FAF4E', '#A8D878', '#4E9A3C'],
    bgColor: '#0d1a0a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FRESH', 'LUSH', 'GREEN', 'ALIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#7DC26A', '#5FAF4E', '#A8D878', '#4E9A3C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
