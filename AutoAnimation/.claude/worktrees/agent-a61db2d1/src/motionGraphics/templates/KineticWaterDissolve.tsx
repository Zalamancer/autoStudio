import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaterDissolveConfig extends KineticBaseConfig {}

// Ripple rings that radiate from the center as text dissolves in water
function WaterRipples({ progress, color }: { progress: number; color: string }) {
  const rings = [0, 0.2, 0.4].map((offset, i) => {
    const t = ((progress + offset) % 1)
    const radius = t * 80
    const ringOpacity = (1 - t) * progress * 0.6
    return { radius, opacity: ringOpacity, key: i }
  })

  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
    >
      {rings.map(({ radius, opacity, key }) => (
        <ellipse
          key={key}
          cx={0}
          cy={0}
          rx={radius * 2.5}
          ry={radius * 0.6}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          opacity={opacity}
        />
      ))}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Slow caustic light pattern on water surface
    const shift = (frame * 0.3) % 100
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, #1a4a6a 0%, ${bgColor} 100%)`,
        }}
      >
        {/* Caustic light shimmer lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `linear-gradient(${shift}deg, transparent 48%, rgba(100,200,255,0.04) 50%, transparent 52%)`,
              `linear-gradient(${shift + 60}deg, transparent 46%, rgba(100,200,255,0.03) 50%, transparent 54%)`,
            ].join(', '),
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let blur = 0
    let scale = 1
    let translateY = 0
    let rippleProgress = 0

    if (phase === 'enter') {
      // Surface from below water — blur clears as text rises
      opacity = enterProgress * enterProgress
      blur = (1 - enterProgress) * 12
      scale = 0.85 + enterProgress * 0.15
      translateY = (1 - enterProgress) * 25
      rippleProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      blur = 0
      rippleProgress = holdProgress % 1
    } else {
      // Dissolve back into the water — blur and sink
      opacity = (1 - exitProgress) * (1 - exitProgress)
      blur = exitProgress * 18
      scale = 1 + exitProgress * 0.08
      translateY = exitProgress * 20
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
        }}
      >
        <WaterRipples progress={rippleProgress} color={color} />
        <div
          style={{
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(42px, 12vw, 160px)',
            fontWeight: 300,
            letterSpacing: 10,
            textTransform: 'uppercase',
            color,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: [
              `0 0 15px ${color}88`,
              `0 0 40px ${color}44`,
              `0 4px 20px rgba(0,100,200,0.4)`,
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

function WaterDissolveComponent(props: MotionGraphicProps<WaterDissolveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-water-dissolve',
  title: 'Kinetic Water Dissolve',
  description: 'Text surfaces from water with ripple rings and caustic blur, then dissolves back under the surface',
  tags: ['kinetic', 'typography', 'water', 'dissolve', 'liquid', 'ripple', 'nature'],
  category: 'captions',
  component: WaterDissolveComponent as any,
  defaultConfig: {
    words: ['FLOW', 'RIPPLE', 'DEEP', 'TIDE'],
    colors: ['#00BFFF', '#40E0D0', '#87CEEB', '#4FC3F7'],
    bgColor: '#051520',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLOW', 'RIPPLE', 'DEEP', 'TIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00BFFF', '#40E0D0', '#87CEEB', '#4FC3F7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#051520', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 6, group: 'Timing' },
  ],
})
