import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HalloweenSpookyConfig extends KineticBaseConfig {}

function BatShapes({ frame, width, height }: { frame: number; width: number; height: number }) {
  const bats = Array.from({ length: 12 }, (_, i) => {
    const seed = (i * 2654435761) >>> 0
    const baseX = (seed % 1000) / 10
    const baseY = 10 + ((seed >> 5) % 60)
    const speed = 0.3 + ((seed >> 10) % 20) / 40
    const wingPhase = frame * speed * 0.08 + i * 1.3
    const xDrift = Math.sin(frame * 0.01 + i * 0.9) * 20
    const yDrift = Math.sin(frame * 0.015 + i * 1.1) * 8
    const wingSpan = 8 + (i % 5)
    const wingFlap = Math.sin(wingPhase) * 0.4
    return { x: baseX + xDrift / (width / 100), y: baseY + yDrift / (height / 100), wingSpan, wingFlap, opacity: 0.25 + ((seed >> 15) % 3) / 10 }
  })

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {bats.map((b, i) => {
        const cx = (b.x / 100) * width
        const cy = (b.y / 100) * height
        const w = b.wingSpan
        return (
          <g key={i} opacity={b.opacity}>
            {/* Left wing */}
            <ellipse
              cx={cx - w * (0.6 + b.wingFlap)}
              cy={cy - w * b.wingFlap * 0.3}
              rx={w * 0.7}
              ry={w * 0.25}
              fill="#2a1a3a"
              transform={`rotate(${-10 + b.wingFlap * 20}, ${cx}, ${cy})`}
            />
            {/* Right wing */}
            <ellipse
              cx={cx + w * (0.6 + b.wingFlap)}
              cy={cy - w * b.wingFlap * 0.3}
              rx={w * 0.7}
              ry={w * 0.25}
              fill="#2a1a3a"
              transform={`rotate(${10 - b.wingFlap * 20}, ${cx}, ${cy})`}
            />
            {/* Body */}
            <ellipse cx={cx} cy={cy} rx={w * 0.15} ry={w * 0.25} fill="#1a0a2a" />
          </g>
        )
      })}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, width, height }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 80%, #2a1040 0%, ${bgColor} 60%, #050008 100%)`,
      }}
    >
      {/* Eerie moon glow */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          right: '15%',
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,100,0.3), rgba(255,180,50,0.05) 70%)',
          boxShadow: '0 0 40px rgba(255,200,100,0.15)',
        }}
      />
      <BatShapes frame={frame} width={width} height={height} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53 + 17

    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Eerie materialization: flickers in
      const flicker = enterProgress < 0.3 ? Math.sin(enterProgress * 40 + seed) * 0.3 : 0
      opacity = Math.min(1, enterProgress * 2.5) + flicker
      scale = 0.9 + enterProgress * 0.1
      translateY = (1 - enterProgress) * 10
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle eerie pulse
      scale = 1 + Math.sin(holdProgress * Math.PI * 3 + seed) * 0.015
      translateY = Math.sin(holdProgress * Math.PI * 2 + seed) * 2
    } else {
      // Drip/dissolve exit
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.1
      translateY = exitProgress * 30
    }

    const dripShadow = phase === 'hold'
      ? 10 + Math.sin(holdProgress * Math.PI * 4) * 5
      : 8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          color,
          textShadow: [
            `0 ${dripShadow}px ${dripShadow * 1.5}px rgba(100,0,150,0.5)`,
            `0 0 20px rgba(255,100,0,0.3)`,
            `0 0 40px ${color}22`,
          ].join(', '),
          whiteSpace: 'nowrap',
          letterSpacing: 4,
        }}
      >
        {word}
      </div>
    )
  },
}

function HalloweenSpookyComponent(props: MotionGraphicProps<HalloweenSpookyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-halloween-spooky',
  title: 'Kinetic Halloween Spooky',
  description: 'Spooky Halloween style with bat shapes, eerie moon, orange/purple tones and dripping text',
  tags: ['kinetic', 'typography', 'halloween', 'spooky', 'gothic', 'horror', 'bats', 'seasonal'],
  category: 'captions',
  component: HalloweenSpookyComponent as any,
  defaultConfig: {
    words: ['SPOOKY', 'HALLOWEEN', 'BOO', 'FRIGHT'],
    colors: ['#FF6600', '#9933CC', '#FF9900', '#CC33FF'],
    bgColor: '#0a0015',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPOOKY', 'HALLOWEEN', 'BOO', 'FRIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6600', '#9933CC', '#FF9900', '#CC33FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0015', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
