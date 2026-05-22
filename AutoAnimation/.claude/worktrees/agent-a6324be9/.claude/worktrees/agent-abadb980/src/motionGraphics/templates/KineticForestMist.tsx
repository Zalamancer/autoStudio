import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ForestMistConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Forest layers from back to front with increasing darkness
    const treeLayers = [
      {
        y: 55, color: '#1a3a20', opacity: 0.4,
        clipPath: 'polygon(0% 100%, 0% 60%, 3% 45%, 7% 55%, 12% 38%, 17% 52%, 22% 35%, 27% 50%, 32% 32%, 37% 48%, 42% 30%, 47% 45%, 52% 28%, 57% 44%, 62% 33%, 67% 47%, 72% 30%, 77% 45%, 82% 35%, 87% 50%, 92% 38%, 97% 48%, 100% 42%, 100% 100%)',
      },
      {
        y: 62, color: '#0f2d15', opacity: 0.6,
        clipPath: 'polygon(0% 100%, 0% 55%, 5% 40%, 10% 52%, 15% 35%, 20% 48%, 25% 30%, 30% 45%, 35% 28%, 40% 42%, 45% 25%, 50% 40%, 55% 30%, 60% 45%, 65% 28%, 70% 42%, 75% 32%, 80% 48%, 85% 35%, 90% 50%, 95% 38%, 100% 45%, 100% 100%)',
      },
      {
        y: 72, color: '#0a1f0e', opacity: 0.8,
        clipPath: 'polygon(0% 100%, 0% 50%, 4% 38%, 8% 48%, 13% 32%, 18% 45%, 23% 28%, 28% 42%, 33% 25%, 38% 40%, 43% 22%, 48% 38%, 53% 28%, 58% 42%, 63% 25%, 68% 40%, 73% 30%, 78% 45%, 83% 28%, 88% 42%, 93% 35%, 98% 45%, 100% 38%, 100% 100%)',
      },
      {
        y: 82, color: '#071509', opacity: 0.95,
        clipPath: 'polygon(0% 100%, 0% 45%, 6% 32%, 12% 42%, 18% 28%, 24% 40%, 30% 22%, 36% 38%, 42% 20%, 48% 35%, 54% 25%, 60% 38%, 66% 22%, 72% 36%, 78% 28%, 84% 40%, 90% 30%, 96% 42%, 100% 35%, 100% 100%)',
      },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #3a5a40 0%, #2d4a34 20%, ${bgColor} 50%, #0a1f0e 100%)`,
        }}
      >
        {/* Forest tree layers */}
        {treeLayers.map((layer, i) => (
          <div
            key={`trees-${i}`}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${100 - layer.y + 50}%`,
              background: layer.color,
              clipPath: layer.clipPath,
              opacity: layer.opacity,
              zIndex: i + 1,
            }}
          />
        ))}

        {/* Mist/fog layers drifting horizontally */}
        {[0, 1, 2].map(i => {
          const mistY = 40 + i * 15
          const drift = Math.sin(time * (0.1 + i * 0.05) + i * 2) * 30
          const mistOpacity = 0.08 + Math.sin(time * 0.2 + i * 1.5) * 0.04

          return (
            <div
              key={`mist-${i}`}
              style={{
                position: 'absolute',
                top: `${mistY}%`,
                left: `${-20 + drift}%`,
                width: '140%',
                height: '15%',
                background: `linear-gradient(90deg, transparent 0%, rgba(220,230,220,${mistOpacity}) 20%, rgba(200,215,200,${mistOpacity * 1.5}) 50%, rgba(220,230,220,${mistOpacity}) 80%, transparent 100%)`,
                zIndex: 5 + i,
                borderRadius: '50%',
              }}
            />
          )
        })}

        {/* Volumetric light rays through mist */}
        {[0, 1].map(i => {
          const rayOpacity = 0.03 + Math.sin(time * 0.3 + i * 3) * 0.015
          const rayX = 30 + i * 25
          return (
            <div
              key={`ray-${i}`}
              style={{
                position: 'absolute',
                top: 0,
                left: `${rayX}%`,
                width: '8%',
                height: '70%',
                background: `linear-gradient(180deg, rgba(180,200,150,${rayOpacity * 2}), rgba(180,200,150,${rayOpacity}), transparent)`,
                transform: `skewX(${-5 + i * 10}deg)`,
                zIndex: 8,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let blur = 0
    let translateY = 0

    if (phase === 'enter') {
      // Emerge from mist
      opacity = enterProgress
      blur = (1 - enterProgress) * 6
      translateY = (1 - enterProgress) * 10
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 2
    } else {
      // Dissolve back into mist
      opacity = 1 - exitProgress
      blur = exitProgress * 8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(42px, 11vw, 150px)',
          fontWeight: 300,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          textTransform: 'uppercase',
          letterSpacing: 12,
          color,
          textShadow: `0 0 20px ${color}44, 0 2px 10px rgba(0,0,0,0.4)`,
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function ForestMistComponent(props: MotionGraphicProps<ForestMistConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-forest-mist',
  title: 'Kinetic Forest Mist',
  description: 'Layered forest silhouette with drifting mist, volumetric light rays, and ethereal text',
  tags: ['kinetic', 'typography', 'forest', 'mist', 'fog', 'trees', 'nature', 'ethereal', 'green'],
  category: 'captions',
  component: ForestMistComponent as any,
  defaultConfig: {
    words: ['WILD', 'FOREST', 'MIST', 'DEEP'],
    colors: ['#D4E6B5', '#C8DDA0', '#B8CC8A', '#A8BD78'],
    bgColor: '#1a3020',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WILD', 'FOREST', 'MIST', 'DEEP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4E6B5', '#C8DDA0', '#B8CC8A', '#A8BD78'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a3020', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
