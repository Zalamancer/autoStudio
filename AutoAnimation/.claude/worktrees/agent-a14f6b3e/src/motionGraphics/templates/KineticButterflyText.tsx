import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ButterflyTextConfig extends KineticBaseConfig {}

// Butterfly wings made of two mirrored ellipses
function Butterfly({ x, y, color, size, rot, flapAngle, opacity }: {
  x: number; y: number; color: string; size: number; rot: number; flapAngle: number; opacity: number
}) {
  const wingW = size * 1.4
  const wingH = size * 0.9
  // Flapping: scaleX varies with flapAngle
  const scaleX = Math.abs(Math.cos(flapAngle))
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={opacity}>
      {/* Left wing */}
      <ellipse cx={-wingW * 0.4 * scaleX} cy={0} rx={wingW * 0.5 * scaleX} ry={wingH * 0.5} fill={color} />
      {/* Right wing */}
      <ellipse cx={wingW * 0.4 * scaleX} cy={0} rx={wingW * 0.5 * scaleX} ry={wingH * 0.5} fill={color} />
      {/* Body */}
      <ellipse cx={0} cy={0} rx={size * 0.08} ry={size * 0.45} fill={`${color}cc`} />
    </g>
  )
}

function ButterflyCloud({ progress, color, seed, frame }: { progress: number; color: string; seed: number; frame: number }) {
  if (progress <= 0.01) return null

  const numButterflies = 12
  const butterflies = Array.from({ length: numButterflies }, (_, i) => {
    const angle = ((seed * (i + 1) * 137) % 360) * (Math.PI / 180)
    const radius = (20 + ((seed + i * 11) % 50)) * Math.sin(progress * Math.PI)
    const x = Math.cos(angle) * radius * 2
    const y = Math.sin(angle) * radius * 0.7
    const flapAngle = (frame ?? 0) * 0.25 + i * 0.8 + seed
    const size = 12 + ((seed + i * 7) % 10)
    const rot = angle * (180 / Math.PI) + Math.sin(flapAngle * 0.5) * 15
    const bf_opacity = Math.sin(progress * Math.PI) * (0.5 + ((i * seed + 3) % 5) / 10)
    return { x, y, size, rot, flapAngle, opacity: bf_opacity }
  })

  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
    >
      {butterflies.map((b, i) => (
        <Butterfly key={i} {...b} color={color} />
      ))}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 60%, #2a1a3a 0%, ${bgColor} 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 73 + 53

    let opacity = 0
    let scale = 1
    let translateY = 0
    let cloudProgress = 0

    if (phase === 'enter') {
      // Butterflies converge to form the word
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.6 + enterProgress * 0.4
      translateY = (1 - enterProgress) * 20
      cloudProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      translateY = Math.sin(holdProgress * Math.PI * 3 + seed) * 4
      cloudProgress = 0.6 + holdProgress * 0.4
    } else {
      // Butterflies scatter and flutter away
      opacity = 1 - exitProgress
      cloudProgress = exitProgress
    }

    const dreamGlow = phase === 'hold'
      ? 12 + Math.sin(holdProgress * Math.PI * 6) * 5
      : 8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
        }}
      >
        <ButterflyCloud progress={cloudProgress} color={color} seed={seed} frame={Math.floor(Date.now() / 16)} />
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 8,
            color,
            textShadow: [
              `0 0 ${dreamGlow}px ${color}`,
              `0 0 ${dreamGlow * 2.5}px ${color}55`,
            ].join(', '),
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ButterflyTextComponent(props: MotionGraphicProps<ButterflyTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-butterfly-text',
  title: 'Kinetic Butterfly Text',
  description: 'Animated SVG butterflies with flapping wings swarm around text as it materializes and disperses',
  tags: ['kinetic', 'typography', 'butterfly', 'insects', 'particles', 'dream', 'nature', 'magical'],
  category: 'captions',
  component: ButterflyTextComponent as any,
  defaultConfig: {
    words: ['DREAM', 'FREE', 'FLY', 'LIGHT'],
    colors: ['#DA70D6', '#9B59B6', '#FF8DA1', '#BA55D3'],
    bgColor: '#1a0a2a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAM', 'FREE', 'FLY', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DA70D6', '#9B59B6', '#FF8DA1', '#BA55D3'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a2a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.4, max: 6, group: 'Timing' },
  ],
})
