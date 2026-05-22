import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RainDropConfig extends KineticBaseConfig {}

// Falling rain streaks
function RainStreaks({ frame, width, height }: { frame: number; width: number; height: number }) {
  const numDrops = 40
  const drops = Array.from({ length: numDrops }, (_, i) => {
    const x = ((i * 137 + 59) % width)
    const speed = 0.8 + ((i * 43) % 10) / 10
    const y = ((frame * speed * 0.8 + i * 37) % (height + 60)) - 30
    const len = 8 + (i % 8)
    const opacity = 0.2 + ((i * 17) % 5) / 20
    return { x, y, len, opacity }
  })

  return (
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={width} height={height}>
      {drops.map((d, i) => (
        <line
          key={i}
          x1={d.x}
          y1={d.y}
          x2={d.x - 2}
          y2={d.y + d.len}
          stroke="rgba(180,210,255,0.5)"
          strokeWidth={0.8}
          opacity={d.opacity}
        />
      ))}
    </svg>
  )
}

// Ripple ring on a puddle surface
function PuddleRipple({ progress, color }: { progress: number; color: string }) {
  if (progress <= 0.02) return null

  const rings = [0, 0.15, 0.3].map((offset) => {
    const t = ((progress + offset) % 1)
    const rx = t * 100
    const ry = t * 30
    const rOpacity = (1 - t) * progress * 0.4
    return { rx, ry, opacity: rOpacity }
  })

  return (
    <svg
      style={{ position: 'absolute', top: '75%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
    >
      {rings.map((r, i) => (
        <ellipse key={i} cx={0} cy={0} rx={r.rx} ry={r.ry} stroke={color} strokeWidth={1} fill="none" opacity={r.opacity} />
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
        background: `linear-gradient(180deg, ${bgColor} 0%, #1a2a3a 100%)`,
      }}
    >
      <RainStreaks frame={frame} width={width} height={height} />
      {/* Wet ground reflection at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20%',
          background: `linear-gradient(to top, rgba(0,100,180,0.15) 0%, transparent 100%)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 59 + 31

    let opacity = 0
    let scale = 1
    let translateY = 0
    let blur = 0
    let rippleProgress = 0

    if (phase === 'enter') {
      // Rain splashes to form the text: drops arrive and splash
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.7 + enterProgress * 0.3
      translateY = (1 - enterProgress) * -30  // drops falling in
      rippleProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Text reflects like letters on wet asphalt
      translateY = Math.sin(holdProgress * Math.PI * 4 + seed) * 2
      rippleProgress = holdProgress % 1
    } else {
      // Rain washes away the text
      opacity = (1 - exitProgress) * (1 - exitProgress)
      blur = exitProgress * 14
      scale = 1 + exitProgress * 0.05
      translateY = exitProgress * 20  // washed down
      rippleProgress = exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <PuddleRipple progress={rippleProgress} color={color} />
        <div
          style={{
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 200,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color,
            textShadow: [
              `0 0 16px ${color}88`,
              `0 0 40px ${color}44`,
              `0 6px 20px rgba(0,80,160,0.3)`,
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

function RainDropComponent(props: MotionGraphicProps<RainDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rain-drop',
  title: 'Kinetic Rain Drop',
  description: 'Rain streaks fall across a dark sky while text forms from splashing drops with puddle ripples',
  tags: ['kinetic', 'typography', 'rain', 'water', 'storm', 'drops', 'puddle', 'nature'],
  category: 'captions',
  component: RainDropComponent as any,
  defaultConfig: {
    words: ['STORM', 'RAIN', 'WET', 'GREY'],
    colors: ['#6BA3BE', '#4A8FA8', '#82B9CF', '#5A9BB0'],
    bgColor: '#1a2530',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STORM', 'RAIN', 'WET', 'GREY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6BA3BE', '#4A8FA8', '#82B9CF', '#5A9BB0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a2530', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 6, group: 'Timing' },
  ],
})
