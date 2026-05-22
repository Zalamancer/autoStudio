import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroWaveConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Sunset gradient that subtly shifts
    const hueShift = Math.sin(time * 0.4) * 5

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg,
            hsl(${270 + hueShift}, 60%, 15%) 0%,
            hsl(${300 + hueShift}, 70%, 25%) 30%,
            hsl(${330 + hueShift}, 80%, 40%) 50%,
            hsl(${20 + hueShift}, 90%, 55%) 70%,
            hsl(${40 + hueShift}, 95%, 60%) 100%)`,
        }}
      >
        {/* Perspective grid — horizon line at 70% */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '30%',
            overflow: 'hidden',
          }}
        >
          {/* Horizontal grid lines */}
          {Array.from({ length: 12 }, (_, i) => {
            const y = Math.pow(i / 12, 1.8) * 100
            const lineOpacity = 0.15 + (i / 12) * 0.25
            return (
              <div
                key={`h-${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${y}%`,
                  height: 1,
                  background: `rgba(255,0,200,${lineOpacity})`,
                  boxShadow: `0 0 4px rgba(255,0,200,${lineOpacity * 0.5})`,
                }}
              />
            )
          })}
          {/* Vertical grid lines with perspective */}
          {Array.from({ length: 15 }, (_, i) => {
            const x = ((i - 7) / 7) * 60 + 50
            return (
              <div
                key={`v-${i}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${x}%`,
                  width: 1,
                  background: `rgba(255,0,200,0.15)`,
                  transformOrigin: 'top center',
                  transform: `perspective(600px) rotateY(0deg)`,
                }}
              />
            )
          })}
        </div>
        {/* Sun circle */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '55%',
            transform: 'translate(-50%, -50%)',
            width: Math.min(width, height) * 0.25,
            height: Math.min(width, height) * 0.25,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #FFE066 0%, #FF6B6B 50%, #C850C0 100%)',
            boxShadow: '0 0 40px rgba(255,107,107,0.4), 0 0 80px rgba(200,80,192,0.2)',
          }}
        >
          {/* Horizontal stripe cutouts on the sun */}
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`stripe-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${10 + i * 12}%`,
                height: `${3 + i * 1.5}%`,
                background: 'rgba(0,0,0,0.9)',
              }}
            />
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateY = (1 - eased) * 40
      scale = 0.8 + eased * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(Date.now() * 0.002 + index) * 3
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * -30
      scale = 1 + exitProgress * 0.1
    }

    // Chrome text gradient reflection
    return (
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          letterSpacing: 8,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: 'transparent',
          backgroundImage: `linear-gradient(180deg, #ffffff 0%, #e0e0e0 25%, ${color} 50%, #ffffff 75%, #b0b0b0 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
          filter: `drop-shadow(0 0 8px rgba(255,100,200,0.4)) drop-shadow(0 4px 12px rgba(0,0,0,0.5))`,
        }}
      >
        {word}
      </div>
    )
  },
}

function RetroWaveComponent(props: MotionGraphicProps<RetroWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-retro-wave',
  title: 'Kinetic Retro Wave',
  description: 'Synthwave outrun style with chrome text, sunset gradient, perspective grid lines, and retro sun',
  tags: ['kinetic', 'typography', 'synthwave', 'outrun', 'retrowave', '80s', 'chrome', 'aesthetic'],
  category: 'captions',
  component: RetroWaveComponent as any,
  defaultConfig: {
    words: ['TURBO', 'DRIVE', 'NEON', 'RUSH'],
    colors: ['#FF6EC7', '#00FFFF', '#FFD700', '#FF4500'],
    bgColor: '#1a0030',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TURBO', 'DRIVE', 'NEON', 'RUSH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6EC7', '#00FFFF', '#FFD700', '#FF4500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0030', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
