import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LightningStrikeConfig extends KineticBaseConfig {}

function LightningBolt({ frame, width, height }: { frame: number; width: number; height: number }) {
  const bolts = Array.from({ length: 3 }, (_, i) => {
    const seed = i * 137 + 29
    const active = ((frame + seed * 7) % 45) < 4
    if (!active) return null

    const startX = (seed * 23) % width
    const segments = Array.from({ length: 6 }, (_, j) => {
      const y = (j / 5) * height
      const jitter = Math.sin(frame * 0.5 + j * seed) * 40
      return `${startX + jitter},${y}`
    }).join(' ')

    return (
      <g key={i}>
        <polyline
          points={segments}
          fill="none"
          stroke="#ffffff"
          strokeWidth={3}
          opacity={0.9}
        />
        <polyline
          points={segments}
          fill="none"
          stroke="#a0d4ff"
          strokeWidth={8}
          opacity={0.3}
        />
        <polyline
          points={segments}
          fill="none"
          stroke="#60a0ff"
          strokeWidth={16}
          opacity={0.1}
        />
      </g>
    )
  })

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      {bolts}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const flashIntensity = ((frame % 45) < 3) ? 0.3 + Math.random() * 0.2 : 0
    const rumble = Math.sin(time * 0.5) * 0.5

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, #0a0c14 0%, #1a1d2e ${50 + rumble}%, #0d0f1a 100%)`,
      }}>
        {/* Storm clouds */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 22 - 5) % 100}%`,
              top: `${5 + i * 4}%`,
              width: `${30 + (i * 7) % 20}%`,
              height: '20%',
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(40,45,65,${0.6 + Math.sin(time + i) * 0.1}), transparent 70%)`,
              transform: `translateX(${Math.sin(time * 0.3 + i) * 10}px)`,
            }}
          />
        ))}
        {/* Lightning flash overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(180,200,255,${flashIntensity})`,
          pointerEvents: 'none',
        }} />
        <LightningBolt frame={frame} width={width} height={height} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scale = 1
    let blur = 0
    let glowIntensity = 0

    if (phase === 'enter') {
      // Flash in like lightning strike
      const t = enterProgress
      opacity = t < 0.15 ? 0 : t < 0.2 ? 1 : t < 0.35 ? 0.3 : Math.min(1, (t - 0.35) * 2.5)
      scale = t < 0.2 ? 1.15 : 1 + (1 - Math.min(1, (t - 0.2) * 2)) * 0.1
      glowIntensity = t < 0.3 ? 40 : 40 * (1 - Math.min(1, (t - 0.3) * 2))
      blur = t < 0.15 ? 4 : 0
    } else if (phase === 'hold') {
      opacity = 1
      // Electric flicker
      const flicker = Math.sin(holdProgress * Math.PI * 20) > 0.85 ? 0.15 : 0
      glowIntensity = 15 + flicker * 30
      scale = 1 + Math.sin(holdProgress * Math.PI * 8) * 0.005
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.05
      blur = exitProgress * 6
      glowIntensity = 15 * (1 - exitProgress)
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
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#E8F0FF',
          textShadow: `
            0 0 ${glowIntensity}px rgba(100,180,255,0.8),
            0 0 ${glowIntensity * 2}px rgba(60,120,255,0.4),
            0 0 ${glowIntensity * 3}px rgba(40,80,255,0.2),
            0 2px 4px rgba(0,0,0,0.6)
          `,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function LightningStrikeComponent(props: MotionGraphicProps<LightningStrikeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lightning-strike',
  title: 'Kinetic Lightning Strike',
  description: 'Text appears with dramatic lightning bolt flash effects against a stormy sky background',
  tags: ['kinetic', 'typography', 'lightning', 'storm', 'weather', 'electric', 'dramatic'],
  category: 'captions',
  component: LightningStrikeComponent as any,
  defaultConfig: {
    words: ['THUNDER', 'STRIKE', 'BOLT', 'FLASH'],
    colors: ['#A0D4FF', '#60A0FF', '#FFFFFF', '#B4C8FF'],
    bgColor: '#0a0c14',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THUNDER', 'STRIKE', 'BOLT', 'FLASH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A0D4FF', '#60A0FF', '#FFFFFF', '#B4C8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0c14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
