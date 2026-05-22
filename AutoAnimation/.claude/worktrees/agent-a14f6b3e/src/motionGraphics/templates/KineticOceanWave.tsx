import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OceanWaveConfig extends KineticBaseConfig {}

// Wave path that sweeps across the text
function WaveSweep({ progress, color, width }: { progress: number; color: string; width: number }) {
  if (progress <= 0.02 || progress >= 0.98) return null

  const waveH = 20
  const points = Array.from({ length: 20 }, (_, i) => {
    const x = (i / 19) * (width + 80) - 40
    const y = Math.sin((i / 3) + progress * Math.PI * 4) * waveH
    return `${x},${y}`
  })
  const waveLine = `M${points[0]} ` + points.slice(1).map(p => `L${p}`).join(' ')
  const closePath = `L${width + 40},${waveH * 3} L${-40},${waveH * 3} Z`

  return (
    <svg
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      width={width}
      height={waveH * 6}
    >
      <path
        d={`${waveLine} ${closePath}`}
        fill={`${color}22`}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.5}
      />
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, width }: BackgroundRenderProps) => {
    const waveOffset = ((frame ?? 0) * 0.5) % width

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #0a1a2a 0%, ${bgColor} 50%, #051018 100%)`,
        }}
      >
        {/* Animated ocean horizon waves */}
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: -waveOffset,
            right: 0,
            height: 3,
            background: `linear-gradient(to right, transparent, rgba(0,180,255,0.2) 20%, rgba(0,200,255,0.3) 50%, rgba(0,180,255,0.2) 80%, transparent)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: -(width - waveOffset),
            right: 0,
            height: 2,
            background: `linear-gradient(to right, transparent, rgba(0,150,200,0.15) 30%, rgba(0,170,220,0.2) 60%, transparent)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 71 + 29

    let opacity = 0
    let scale = 1
    let translateY = 0
    let waveProgress = 0

    if (phase === 'enter') {
      // Wave washes in and deposits the text
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.8 + enterProgress * 0.2
      translateY = Math.sin(enterProgress * Math.PI) * 10  // surge and settle
      waveProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Gentle bob on the ocean
      translateY = Math.sin(holdProgress * Math.PI * 3 + seed) * 5
      waveProgress = holdProgress % 1
    } else {
      // Wave pulls text back out to sea
      opacity = (1 - exitProgress) * (1 - exitProgress)
      scale = 1 + exitProgress * 0.05
      translateY = exitProgress * 15
      waveProgress = exitProgress
    }

    const depthGlow = phase === 'hold'
      ? 14 + Math.sin(holdProgress * Math.PI * 5) * 5
      : 10

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
        <WaveSweep progress={waveProgress} color={color} width={width * 0.8} />
        <div
          style={{
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 200,
            textTransform: 'uppercase',
            letterSpacing: 12,
            color,
            textShadow: [
              `0 0 ${depthGlow}px ${color}88`,
              `0 0 ${depthGlow * 3}px ${color}44`,
              `0 4px 20px rgba(0,80,150,0.4)`,
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

function OceanWaveComponent(props: MotionGraphicProps<OceanWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ocean-wave',
  title: 'Kinetic Ocean Wave',
  description: 'Text rides in on an SVG wave sweep over an animated ocean horizon, then recedes with the tide',
  tags: ['kinetic', 'typography', 'ocean', 'wave', 'water', 'sea', 'nature', 'coastal'],
  category: 'captions',
  component: OceanWaveComponent as any,
  defaultConfig: {
    words: ['OCEAN', 'WAVE', 'TIDE', 'DEEP'],
    colors: ['#00B4D8', '#48CAE4', '#90E0EF', '#ADE8F4'],
    bgColor: '#03045E',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OCEAN', 'WAVE', 'TIDE', 'DEEP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00B4D8', '#48CAE4', '#90E0EF', '#ADE8F4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#03045E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
