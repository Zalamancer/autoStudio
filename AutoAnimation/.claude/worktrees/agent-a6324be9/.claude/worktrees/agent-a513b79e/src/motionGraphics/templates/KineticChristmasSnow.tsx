import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChristmasSnowConfig extends KineticBaseConfig {}

function SnowParticles({ frame, width, height }: { frame: number; width: number; height: number }) {
  const flakes = Array.from({ length: 40 }, (_, i) => {
    const x = ((i * 137 + 59) % width)
    const speed = 0.2 + ((i * 31) % 10) / 12
    const y = ((frame * speed * 0.6 + i * 53) % (height + 50)) - 25
    const size = 1.5 + (i % 5)
    const drift = Math.sin(frame * 0.015 + i * 0.7) * 12
    const flakeOpacity = 0.35 + ((i * 17) % 5) / 8
    return { x: x + drift, y, size, opacity: flakeOpacity }
  })

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      {flakes.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.size} fill="#FFFFFF" opacity={f.opacity} />
      ))}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, width, height }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, #1a0a0a 0%, ${bgColor} 50%, #0a1a0a 100%)`,
      }}
    >
      {/* Warm holiday glow */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          width: '60%',
          height: '40%',
          borderRadius: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(255,200,100,0.08), transparent 70%)',
        }}
      />
      <SnowParticles frame={frame} width={width} height={height} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 47 + 23

    let opacity = 0
    let scale = 1
    let blur = 0
    let translateY = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.85 + enterProgress * 0.15
      blur = (1 - enterProgress) * 6
      translateY = (1 - enterProgress) * -20
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 4 + seed) * 0.01
    } else {
      opacity = 1 - exitProgress
      blur = exitProgress * 8
      scale = 1 - exitProgress * 0.05
      translateY = exitProgress * 15
    }

    const glowSize = phase === 'hold'
      ? 20 + Math.sin(holdProgress * Math.PI * 3) * 8
      : 14

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 700,
          letterSpacing: 6,
          color,
          textShadow: [
            `0 0 ${glowSize}px rgba(255,200,100,0.6)`,
            `0 0 ${glowSize * 2}px rgba(255,150,50,0.3)`,
            `0 2px 4px rgba(0,0,0,0.4)`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function ChristmasSnowComponent(props: MotionGraphicProps<ChristmasSnowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-christmas-snow',
  title: 'Kinetic Christmas Snow',
  description: 'Festive Christmas style with snow falling on a red/green backdrop and warm glowing holiday text',
  tags: ['kinetic', 'typography', 'christmas', 'snow', 'holiday', 'festive', 'winter', 'seasonal'],
  category: 'captions',
  component: ChristmasSnowComponent as any,
  defaultConfig: {
    words: ['MERRY', 'CHRISTMAS', 'JOY', 'PEACE'],
    colors: ['#C41E3A', '#228B22', '#FFD700', '#FFFFFF'],
    bgColor: '#1a0505',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MERRY', 'CHRISTMAS', 'JOY', 'PEACE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C41E3A', '#228B22', '#FFD700', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
