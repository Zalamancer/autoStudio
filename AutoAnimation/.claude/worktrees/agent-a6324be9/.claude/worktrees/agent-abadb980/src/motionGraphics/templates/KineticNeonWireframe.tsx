import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonWireframeConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Floating wireframe polygon shapes in background
    const shapes = Array.from({ length: 5 }, (_, i) => {
      const seed = i * 53 + 7
      const cx = (seededRand(seed) * 0.8 + 0.1) * width
      const cy = (seededRand(seed + 1) * 0.8 + 0.1) * height
      const sides = 3 + Math.floor(seededRand(seed + 2) * 4) // 3..6 sides
      const size = 20 + seededRand(seed + 3) * 40
      const rotSpeed = (seededRand(seed + 4) - 0.5) * 0.4
      const rot = frame * rotSpeed + seededRand(seed + 5) * 360
      const opacity = 0.04 + seededRand(seed + 6) * 0.06

      // Build polygon points
      const pts = Array.from({ length: sides }, (_, j) => {
        const angle = (j / sides) * Math.PI * 2 + (rot * Math.PI) / 180
        return `${cx + Math.cos(angle) * size},${cy + Math.sin(angle) * size}`
      }).join(' ')

      const strokeColor = i % 2 === 0 ? `rgba(0,255,255,${opacity})` : `rgba(255,0,255,${opacity})`

      return (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={strokeColor}
          strokeWidth="0.8"
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {shapes}
        </svg>

        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Thin horizontal accent lines */}
        <div
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: '15%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.07), transparent)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            bottom: '15%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,0,255,0.07), transparent)',
          }}
        />

        {/* Corner label */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 18,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,255,0.2)',
            letterSpacing: 2,
          }}
        >
          WIREFRAME.MODE | DEPTH_ON
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    if (phase === 'enter') {
      // Wireframe outline strokes onto the text first, then fills with glow
      const outlineProgress = Math.min(1, enterProgress * 2)       // outline draws in first half
      const fillProgress = Math.max(0, (enterProgress - 0.5) * 2)  // fill comes in second half

      // Outline color fades to full color as fill comes in
      const textColor = fillProgress > 0 ? color : 'transparent'
      const strokeWidth = Math.max(0, (1 - fillProgress) * 3)

      // Outline opacity
      const outlineOpacity = outlineProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Wireframe outline layer — full word drawn as stroke only */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color: 'transparent',
                WebkitTextStroke: `${strokeWidth}px ${color}`,
                textShadow: outlineProgress > 0 ? `0 0 15px ${color}30` : 'none',
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
                opacity: outlineOpacity,
              }}
            >
              {word}
            </span>
          </div>

          {/* Filled glow layer — fades in */}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color: textColor,
              textShadow: fillProgress > 0
                ? `0 0 10px ${color}, 0 0 30px ${color}60`
                : 'none',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: fillProgress,
            }}
          >
            {word}
          </span>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully filled — outer glow pulses while thin wireframe stroke persists beneath
      const pulse = 0.7 + Math.sin(holdProgress * Math.PI * 4) * 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Persistent thin wireframe below */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color: 'transparent',
                WebkitTextStroke: `1px ${color}50`,
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          </div>

          {/* Main filled + glowing text */}
          <span
            style={{
              position: 'relative',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 ${10 * pulse}px ${color}, 0 0 ${35 * pulse}px ${color}70, 0 0 ${60 * pulse}px ${color}20`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>
      )
    } else {
      // Exit: glow fades out revealing just wireframe which then vanishes
      const fillOpacity = Math.max(0, 1 - exitProgress * 2)
      const outlineOpacity = Math.max(0, 1 - (exitProgress - 0.5) * 2)
      const strokeWidth = 2 + exitProgress * 2

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Wireframe survives longer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: outlineOpacity,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color: 'transparent',
                WebkitTextStroke: `${strokeWidth}px ${color}`,
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          </div>

          {/* Fill fades first */}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: fillOpacity,
            }}
          >
            {word}
          </span>
        </div>
      )
    }
  },
}

function NeonWireframeComponent(props: MotionGraphicProps<NeonWireframeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-wireframe',
  title: 'Kinetic Neon Wireframe',
  description: 'Neon wireframe outline strokes onto text first, then fills with glow — floating wireframe polygon shapes orbit in the background',
  tags: ['kinetic', 'typography', 'wireframe', 'neon', '3d', 'outline', 'glow', 'futuristic', 'sci-fi'],
  category: 'captions',
  component: NeonWireframeComponent as any,
  defaultConfig: {
    words: ['RENDER', 'MESH', 'GLOW', 'WIRE'],
    colors: ['#00FFFF', '#FF00FF', '#0066FF', '#00FFFF'],
    bgColor: '#0d0d1a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RENDER', 'MESH', 'GLOW', 'WIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#0066FF', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
