import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HeatWaveConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Heat shimmer lines rising
    const shimmerLines = Array.from({ length: 12 }, (_, i) => {
      const x = (i * 83 + 17) % 100
      const waveOffset = Math.sin(time * 2 + i * 0.8) * 8
      const lineOpacity = 0.04 + Math.sin(time * 1.5 + i) * 0.02

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            bottom: 0,
            width: 2,
            height: '100%',
            background: `linear-gradient(0deg, rgba(255,200,100,${lineOpacity * 2}), rgba(255,150,50,${lineOpacity}), transparent 60%)`,
            transform: `translateX(${waveOffset}px)`,
          }}
        />
      )
    })

    // Pulsating sun heat
    const sunPulse = 1 + Math.sin(time * 1.2) * 0.08
    const heatHue = 30 + Math.sin(time * 0.5) * 10

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg,
          hsl(${heatHue + 10}, 70%, 55%) 0%,
          hsl(${heatHue}, 80%, 50%) 30%,
          hsl(${heatHue - 5}, 85%, 45%) 60%,
          hsl(${heatHue - 10}, 75%, 35%) 100%)`,
      }}>
        {/* Blazing sun */}
        <div style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          width: `${18 * sunPulse}%`,
          height: `${18 * sunPulse}%`,
          borderRadius: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(255,255,200,0.9) 0%, rgba(255,200,50,0.5) 40%, rgba(255,150,30,0.2) 70%, transparent)',
          boxShadow: `0 0 ${80 * sunPulse}px rgba(255,200,50,0.4)`,
        }} />

        {/* Heat distortion waves */}
        {[...Array(6)].map((_, i) => {
          const waveY = 40 + i * 10 + Math.sin(time * 0.8 + i) * 5
          const waveOpacity = 0.06 + Math.sin(time + i * 0.7) * 0.02
          return (
            <div
              key={`w${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${waveY}%`,
                height: '8%',
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,${waveOpacity}), transparent)`,
                transform: `skewY(${Math.sin(time * 1.5 + i * 1.2) * 1.5}deg)`,
              }}
            />
          )
        })}

        {/* Ground heat shimmer */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '25%',
          background: 'linear-gradient(0deg, rgba(200,100,0,0.2), transparent)',
        }} />

        {shimmerLines}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let blur = 0

    if (phase === 'enter') {
      // Rise up like heat
      opacity = Math.min(1, enterProgress * 1.5)
      translateY = (1 - enterProgress) * 50
      scaleY = 0.8 + enterProgress * 0.2
      blur = (1 - enterProgress) * 3
    } else if (phase === 'hold') {
      opacity = 1
      // Heat shimmer distortion
      const shimmerTime = holdProgress * Math.PI * 8
      scaleX = 1 + Math.sin(shimmerTime) * 0.015
      scaleY = 1 + Math.sin(shimmerTime + 1) * 0.02
      translateY = Math.sin(holdProgress * Math.PI * 5) * 3
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 40
      scaleX = 1 + exitProgress * 0.1
      blur = exitProgress * 5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scaleX}, ${scaleY})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#FFF0D0',
          textShadow: `
            0 0 20px rgba(255,150,0,0.6),
            0 0 40px rgba(255,100,0,0.3),
            0 0 60px rgba(255,50,0,0.15),
            0 2px 4px rgba(0,0,0,0.2)
          `,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function HeatWaveComponent(props: MotionGraphicProps<HeatWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-heat-wave',
  title: 'Kinetic Heat Wave',
  description: 'Text distorted by heat shimmer with rising waves under a blazing sun',
  tags: ['kinetic', 'typography', 'heat', 'wave', 'weather', 'hot', 'summer', 'desert'],
  category: 'captions',
  component: HeatWaveComponent as any,
  defaultConfig: {
    words: ['SCORCHING', 'HEAT', 'BLAZING', 'WAVE'],
    colors: ['#FFD060', '#FF8C00', '#FF5500', '#FFAA30'],
    bgColor: '#c85a20',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCORCHING', 'HEAT', 'BLAZING', 'WAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD060', '#FF8C00', '#FF5500', '#FFAA30'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#c85a20', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
