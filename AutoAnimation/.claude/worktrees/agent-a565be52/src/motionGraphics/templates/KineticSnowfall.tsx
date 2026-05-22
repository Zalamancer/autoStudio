import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SnowfallConfig extends KineticBaseConfig {}

// Snowflake particles that drift down across the background
function SnowflakeBg({ frame, width, height, color }: { frame: number; width: number; height: number; color: string }) {
  const flakes = Array.from({ length: 30 }, (_, i) => {
    const x = ((i * 137 + 59) % width)
    const speed = 0.3 + ((i * 31) % 10) / 10
    const y = ((frame * speed * 0.5 + i * 47) % (height + 40)) - 20
    const size = 1 + (i % 4)
    const drift = Math.sin(frame * 0.02 + i) * 8
    const flakeOpacity = 0.3 + ((i * 17) % 5) / 10
    return { x: x + drift, y, size, opacity: flakeOpacity }
  })

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      {flakes.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.size} fill={color} opacity={f.opacity} />
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
        background: `linear-gradient(180deg, #1a2a3a 0%, ${bgColor} 100%)`,
      }}
    >
      <SnowflakeBg frame={frame} width={width} height={height} color="rgba(200,230,255,0.6)" />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 43 + 29

    let opacity = 0
    let scale = 1
    let blur = 0
    let translateY = 0

    if (phase === 'enter') {
      // Snow assembles the word from above: particles condense
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.85 + enterProgress * 0.15
      blur = (1 - enterProgress) * 8
      translateY = (1 - enterProgress) * -25  // fall in from above
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Slight crystal sparkle pulse
      scale = 1 + Math.sin(holdProgress * Math.PI * 5 + seed) * 0.01
    } else {
      // Disperse into snowflakes, drift upward
      opacity = 1 - exitProgress
      blur = exitProgress * 12
      scale = 1 + exitProgress * 0.08
      translateY = -exitProgress * 20  // snow lifts on exit
    }

    const frostShadow = phase === 'hold'
      ? 20 + Math.sin(holdProgress * Math.PI * 4) * 6
      : 16

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 200,
          letterSpacing: 10,
          textTransform: 'uppercase',
          color,
          textShadow: [
            `0 0 ${frostShadow}px ${color}`,
            `0 0 ${frostShadow * 2}px ${color}66`,
            `0 0 ${frostShadow * 3}px rgba(180,220,255,0.3)`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function SnowfallComponent(props: MotionGraphicProps<SnowfallConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-snowfall',
  title: 'Kinetic Snowfall',
  description: 'Snow particles drift down on a winter sky backdrop while text crystallizes with an icy glow',
  tags: ['kinetic', 'typography', 'snow', 'winter', 'particles', 'frost', 'cold', 'nature'],
  category: 'captions',
  component: SnowfallComponent as any,
  defaultConfig: {
    words: ['WINTER', 'SNOW', 'COLD', 'PURE'],
    colors: ['#E0F4FF', '#B0D4F0', '#FFFFFF', '#C8E6FA'],
    bgColor: '#0a1520',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WINTER', 'SNOW', 'COLD', 'PURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0F4FF', '#B0D4F0', '#FFFFFF', '#C8E6FA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1520', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 6, group: 'Timing' },
  ],
})
