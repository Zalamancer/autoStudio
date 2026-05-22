import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MicroscopeZoomConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) * 0.42

    // Floating particle debris under the slide
    const particles: React.ReactNode[] = []
    for (let i = 0; i < 15; i++) {
      const seed = i * 137.5
      const angle = (seed + frame * 0.3) * (Math.PI / 180)
      const dist = 60 + (i * 23) % 180
      const px = cx + Math.cos(angle) * dist
      const py = cy + Math.sin(angle) * dist
      const size = 2 + (i % 4)
      const opacity = 0.06 + (i % 5) * 0.02
      particles.push(
        <circle key={`p${i}`} cx={px} cy={py} r={size} fill={`rgba(200,220,180,${opacity})`} />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Field of view circle */}
          <defs>
            <radialGradient id="fov-grad">
              <stop offset="0%" stopColor="rgba(240,245,230,0.06)" />
              <stop offset="70%" stopColor="rgba(240,245,230,0.03)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <clipPath id="fov-clip">
              <circle cx={cx} cy={cy} r={radius} />
            </clipPath>
          </defs>

          {/* Specimen stage background */}
          <circle cx={cx} cy={cy} r={radius} fill="url(#fov-grad)" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(150,170,140,0.2)" strokeWidth={2} />

          {/* Particles within FOV */}
          <g clipPath="url(#fov-clip)">{particles}</g>

          {/* Crosshair reticle */}
          <line x1={cx - 20} y1={cy} x2={cx - 8} y2={cy} stroke="rgba(255,60,60,0.5)" strokeWidth={1} />
          <line x1={cx + 8} y1={cy} x2={cx + 20} y2={cy} stroke="rgba(255,60,60,0.5)" strokeWidth={1} />
          <line x1={cx} y1={cy - 20} x2={cx} y2={cy - 8} stroke="rgba(255,60,60,0.5)" strokeWidth={1} />
          <line x1={cx} y1={cy + 8} x2={cx} y2={cy + 20} stroke="rgba(255,60,60,0.5)" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={14} fill="none" stroke="rgba(255,60,60,0.25)" strokeWidth={0.5} />

          {/* Scale bar */}
          <line x1={cx - 60} y1={cy + radius - 30} x2={cx + 60} y2={cy + radius - 30} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
          <text x={cx} y={cy + radius - 16} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={9} fontFamily="monospace">100 um</text>
        </svg>

        {/* Dark vignette outside FOV */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, transparent ${radius - 10}px, rgba(0,0,0,0.85) ${radius + 5}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Magnification label */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 16,
            fontFamily: 'monospace',
            fontSize: 11,
            color: 'rgba(200,220,180,0.4)',
            letterSpacing: 1,
          }}
        >
          40x
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    // Subtle specimen stage vibration
    const jitterX = Math.sin(f * 0.2) * 0.5
    const jitterY = Math.cos(f * 0.25) * 0.5

    if (phase === 'enter') {
      // Rack focus: blurry to sharp
      const blurAmount = (1 - enterProgress) * 8
      const scale = 0.85 + enterProgress * 0.15
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale}) translate(${jitterX}px, ${jitterY}px)`,
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 6px ${color}40`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            filter: `blur(${blurAmount}px)`,
            opacity: 0.4 + enterProgress * 0.6,
          }}
        >
          {word}
        </div>
      )
    } else if (phase === 'hold') {
      // Sharp focus with subtle chromatic edges
      const chromaShift = Math.sin(holdProgress * Math.PI * 2) * 0.5
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${jitterX}px, ${jitterY}px)`,
          }}
        >
          {/* Chromatic aberration layer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              color: 'rgba(255,100,100,0.08)',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              transform: `translateX(${chromaShift}px)`,
            }}
          >
            {word}
          </div>
          {/* Main sharp text */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 4px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Defocus exit - text blurs back out
      const blurAmount = exitProgress * 10
      const opacity = 1 - exitProgress
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 + exitProgress * 0.1}) translate(${jitterX}px, ${jitterY}px)`,
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            filter: `blur(${blurAmount}px)`,
            opacity,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function MicroscopeZoomComponent(props: MotionGraphicProps<MicroscopeZoomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-microscope-zoom',
  title: 'Kinetic Microscope Zoom',
  description: 'Microscope rack focus with crosshair reticle, field-of-view circle, specimen stage debris, and blur-to-sharp text reveal',
  tags: ['kinetic', 'typography', 'microscope', 'zoom', 'focus', 'science', 'laboratory', 'specimen'],
  category: 'captions',
  component: MicroscopeZoomComponent as any,
  defaultConfig: {
    words: ['CELL', 'TISSUE', 'SAMPLE', 'FOCUS'],
    colors: ['#e8f0d8', '#d0e8c0', '#c8e0b0', '#f0f8e0'],
    bgColor: '#0a0c08',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CELL', 'TISSUE', 'SAMPLE', 'FOCUS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8f0d8', '#d0e8c0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0c08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
