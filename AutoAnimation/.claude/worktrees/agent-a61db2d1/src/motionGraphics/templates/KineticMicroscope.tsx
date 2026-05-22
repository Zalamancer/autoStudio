import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MicroscopeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const size = Math.min(width, height)

    // Microscope lens circle
    const lensRadius = size * 0.38
    const vignetteRadius = size * 0.42

    // Floating microorganisms in background
    const organisms = Array.from({ length: 10 }, (_, i) => {
      const x = ((i * 61 + 29) % 80) + 10
      const y = ((i * 43 + 17) % 80) + 10
      const drift = Math.sin(time * 0.5 + i * 1.7) * 3
      const oSize = 8 + ((i * 19) % 16)
      return { x: x + drift, y: y + Math.cos(time * 0.4 + i) * 2, size: oSize }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
        {/* Microscope view field */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: bgColor,
            clipPath: `circle(${lensRadius}px at 50% 50%)`,
          }}
        >
          {/* Grid lines like microscope reticle */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(255,255,255,0.04)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(255,255,255,0.04)',
            }}
          />

          {/* Floating organisms */}
          {organisms.map((org, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${org.x}%`,
                top: `${org.y}%`,
                width: org.size,
                height: org.size * 0.7,
                borderRadius: '50%',
                border: `1px solid rgba(100,216,255,${0.06 + (i % 3) * 0.02})`,
                background: `rgba(100,216,255,${0.02 + (i % 2) * 0.01})`,
              }}
            />
          ))}
        </div>

        {/* Vignette ring */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: vignetteRadius * 2,
            height: vignetteRadius * 2,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.05)',
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const time = frame / fps
    let opacity = 0
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Zoom in like focusing a microscope lens
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      scale = 3 - eased * 2 // Start very big (out of focus), zoom to 1x
      blur = (1 - eased) * 15
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Subtle focus breathing
      const breathe = Math.sin(time * 2 + index) * 0.02
      scale = 1 + breathe
      blur = Math.abs(Math.sin(time * 1.5)) * 0.5
    } else {
      // Zoom out of focus
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      scale = 1 + eased * 2
      blur = eased * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Courier New', 'Monaco', monospace",
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textShadow: `0 0 20px ${color}50, 0 0 40px ${color}20`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MicroscopeComponent(props: MotionGraphicProps<MicroscopeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-microscope',
  title: 'Kinetic Microscope',
  description: 'Text zooms in like microscope focus with circular lens view, reticle grid, and floating microorganism background',
  tags: ['kinetic', 'typography', 'science', 'microscope', 'biology', 'zoom', 'lab'],
  category: 'captions',
  component: MicroscopeComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'CELL', 'ZOOM', 'SCAN'],
    colors: ['#64D8FF', '#00FF88', '#FFD700', '#FF6EC7'],
    bgColor: '#0a1520',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'CELL', 'ZOOM', 'SCAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64D8FF', '#00FF88', '#FFD700', '#FF6EC7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1520', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
