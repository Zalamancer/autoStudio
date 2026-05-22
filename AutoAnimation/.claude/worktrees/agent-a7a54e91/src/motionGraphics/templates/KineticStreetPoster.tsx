import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StreetPosterConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle paper texture via noise */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Deterministic pseudo-random rotation from index
    const seed = index * 137 + 42
    const randomAngle = ((seed % 31) - 15) // -15 to 15 degrees

    let opacity = 0
    let scale = 1
    let rotation = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
      scale = 1 + (1 - enterProgress) * 0.3
      rotation = randomAngle * (1 - enterProgress)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Slight random jitter
      rotation = Math.sin(Date.now() * 0.008 + seed) * 0.5
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.3
      rotation = exitProgress * (randomAngle > 0 ? 20 : -20)
    }

    // Alternate fonts: Impact for even, Georgia for odd
    const fontFamily = index % 2 === 0
      ? "Impact, 'Arial Black', sans-serif"
      : "'Georgia', 'Times New Roman', serif"

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          fontFamily,
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 3,
          color,
          textShadow: '2px 2px 0 rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function StreetPosterComponent(props: MotionGraphicProps<StreetPosterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-street-poster',
  title: 'Kinetic Street Poster',
  description: 'Urban wheat-paste poster style with mixed fonts, rotation, and gritty paper texture',
  tags: ['kinetic', 'typography', 'urban', 'poster', 'street'],
  category: 'captions',
  component: StreetPosterComponent as any,
  defaultConfig: {
    words: ['REVOLT', 'RESIST', 'RECLAIM', 'RISE'],
    colors: ['#1a1a1a', '#CC3333', '#2a5a2a', '#1a1a1a'],
    bgColor: '#E8DCC8',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVOLT', 'RESIST', 'RECLAIM', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#CC3333', '#2a5a2a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8DCC8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
