import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ErosionWeatherConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Slow horizontal wind streaks
    const windShift = (frame * 0.4) % 400

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, ${bgColor} 0%, #6B5B45 50%, #4A3728 100%)`,
        }}
      >
        {/* Horizontal wind/rain streaks */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${(i * 8 + 4) % 100}%`,
                left: -400 + windShift,
                width: 300 + ((i * 97) % 200),
                height: 0.5 + (i % 2) * 0.5,
                background: `rgba(200,180,140,${0.04 + (i % 3) * 0.02})`,
                transform: 'skewX(-20deg)',
              }}
            />
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53 + 41

    let opacity = 0
    let blur = 0
    let scale = 1
    let translateX = 0

    if (phase === 'enter') {
      // Emerge from wind — letters solidify as wind clears
      opacity = enterProgress * enterProgress
      blur = (1 - enterProgress) * 10
      scale = 0.95 + enterProgress * 0.05
      translateX = (1 - enterProgress) * 15  // swept in from side
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Weathering shimmer: micro texture noise
      const grainShift = Math.sin(holdProgress * Math.PI * 7 + seed) * 0.5
      translateX = grainShift
    } else {
      // Erode: text slowly blurs and scatters in wind
      opacity = (1 - exitProgress) * (1 - exitProgress)
      blur = exitProgress * 12
      scale = 1 + exitProgress * 0.03
      translateX = exitProgress * 25  // blown away rightward
    }

    // Eroded, weathered text look via multi-layer shadow cracks
    const weatherDepth1 = `1px 1px 0 ${color}aa`
    const weatherDepth2 = `2px 2px 0 ${color}66`
    const weatherGlow = `0 0 ${8 + Math.sin(holdProgress * Math.PI * 5 + seed) * 3}px ${color}33`
    const windBlur = phase === 'exit' ? `blur(${exitProgress * 3}px) contrast(0.8)` : undefined

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
          opacity,
          filter: blur > 0
            ? `blur(${blur}px)`
            : windBlur,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 8,
          color,
          textShadow: [weatherDepth1, weatherDepth2, weatherGlow].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function ErosionWeatherComponent(props: MotionGraphicProps<ErosionWeatherConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-erosion-weather',
  title: 'Kinetic Erosion Weather',
  description: 'Ancient weathered rock text with wind streaks — letters solidify from blowing dust and erode away',
  tags: ['kinetic', 'typography', 'erosion', 'weather', 'wind', 'stone', 'ancient', 'organic'],
  category: 'captions',
  component: ErosionWeatherComponent as any,
  defaultConfig: {
    words: ['ERODE', 'WEATHER', 'TIME', 'WORN'],
    colors: ['#C9A96E', '#B8955A', '#D4B896', '#9E7A50'],
    bgColor: '#8B7355',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ERODE', 'WEATHER', 'TIME', 'WORN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C9A96E', '#B8955A', '#D4B896', '#9E7A50'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8B7355', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
