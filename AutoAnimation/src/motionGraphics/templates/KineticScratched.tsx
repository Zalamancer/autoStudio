import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScratchedConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(145deg, #1a1610 0%, ${bgColor} 50%, #0d0b08 100%)`,
      }}
    >
      {/* Subtle texture overlay for grungy surface */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 3px,
            rgba(255,255,255,0.01) 3px,
            rgba(255,255,255,0.01) 4px
          )`,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, width, height }: WordRenderProps) => {
    let opacity = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 1.8)
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      opacity = 1 - exitProgress
    }

    // Generate scratch marks
    const scratchCount = 8
    const scratches = Array.from({ length: scratchCount }, (_, i) => {
      const seed = index * 43 + i * 17
      const x1 = 20 + rand(seed) * 60
      const y1 = 20 + rand(seed + 1) * 60
      const angle = -30 + rand(seed + 2) * 60
      const len = 40 + rand(seed + 3) * 80
      const thickness = 1 + rand(seed + 4) * 2

      // Scratches draw in during enter
      let scratchProgress = 0
      if (phase === 'enter') {
        const delay = (i / scratchCount) * 0.5
        scratchProgress = Math.min(1, Math.max(0, (enterProgress - delay) / (1 - delay)))
      } else {
        scratchProgress = 1
      }

      const scratchOpacity = phase === 'exit' ? (1 - exitProgress) * 0.6 : 0.4 + rand(seed + 5) * 0.3

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x1}%`,
            top: `${y1}%`,
            width: len * scratchProgress,
            height: thickness,
            background: `linear-gradient(90deg, rgba(200, 180, 150, ${scratchOpacity}), rgba(160, 140, 110, ${scratchOpacity * 0.5}), transparent)`,
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 50%',
          }}
        />
      )
    })

    return (
      <>
        {scratches}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            textShadow: '2px 2px 0 rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            // Distressed look via slight skew
            filter: phase === 'enter' ? `contrast(${1 + (1 - enterProgress) * 0.3})` : undefined,
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ScratchedComponent(props: MotionGraphicProps<ScratchedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scratched',
  title: 'Kinetic Scratched',
  description: 'Scratched and carved text with animated scratch marks drawing in, distressed grungy surface aesthetic',
  tags: ['kinetic', 'typography', 'horror', 'scratched', 'carved', 'grunge', 'dark', 'distressed'],
  category: 'captions',
  component: ScratchedComponent as any,
  defaultConfig: {
    words: ['CARVED', 'MARKED', 'SCAR', 'RUIN'],
    colors: ['#C8B496', '#A09078', '#D4C4A8', '#8B7355'],
    bgColor: '#121008',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CARVED', 'MARKED', 'SCAR', 'RUIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B496', '#A09078', '#D4C4A8', '#8B7355'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#121008', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
