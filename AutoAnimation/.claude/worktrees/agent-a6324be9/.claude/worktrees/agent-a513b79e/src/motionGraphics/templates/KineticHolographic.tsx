import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HolographicConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Holographic grid lines
    const gridLines = Array.from({ length: 12 }, (_, i) => {
      const yPos = ((i * 8.5 + time * 5) % 110) - 5
      const opacity = 0.03 + Math.sin(time * 2 + i) * 0.015
      return (
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${yPos}%`,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(0,255,255,${opacity}), rgba(255,0,255,${opacity}), transparent)`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    const vertLines = Array.from({ length: 8 }, (_, i) => {
      const xPos = ((i * 13 + time * 3) % 110) - 5
      const opacity = 0.02 + Math.sin(time * 1.5 + i * 0.7) * 0.01
      return (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${xPos}%`,
            width: 1,
            background: `linear-gradient(180deg, transparent, rgba(0,255,255,${opacity}), transparent)`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {gridLines}
        {vertLines}
        {/* Central holographic bloom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(0,255,255,0.04) 0%, rgba(180,0,255,0.02) 40%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Bottom projection base glow */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            bottom: '15%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.4), rgba(255,0,255,0.3), rgba(0,255,255,0.4), transparent)',
            boxShadow: '0 0 20px rgba(0,255,255,0.15), 0 0 40px rgba(180,0,255,0.1)',
            pointerEvents: 'none',
          }}
        />
        {/* Projection cone lines */}
        <div
          style={{
            position: 'absolute',
            left: '30%',
            bottom: '16%',
            width: 1,
            height: '30%',
            background: 'linear-gradient(0deg, rgba(0,255,255,0.08), transparent)',
            transform: 'rotate(-8deg)',
            transformOrigin: 'bottom center',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '30%',
            bottom: '16%',
            width: 1,
            height: '30%',
            background: 'linear-gradient(0deg, rgba(0,255,255,0.08), transparent)',
            transform: 'rotate(8deg)',
            transformOrigin: 'bottom center',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f * 0.033

    if (phase === 'enter') {
      // Holographic projection materializing from bottom
      const rise = Math.min(1, enterProgress * 1.6)
      const opacity = Math.min(1, enterProgress * 2)
      const scaleY = 0.3 + rise * 0.7
      const chromaOffset = (1 - enterProgress) * 4

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {/* Cyan channel offset */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'rgba(0,255,255,0.3)',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              transform: `translateX(${-chromaOffset}px) scaleY(${scaleY})`,
              opacity: opacity * 0.5,
            }}
          >
            {word}
          </div>
          {/* Magenta channel offset */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'rgba(255,0,255,0.3)',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              transform: `translateX(${chromaOffset}px) scaleY(${scaleY})`,
              opacity: opacity * 0.5,
            }}
          >
            {word}
          </div>
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textShadow: `0 0 10px ${color}, 0 0 30px rgba(0,255,255,0.3)`,
              opacity,
              transform: `scaleY(${scaleY})`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Holographic shimmer and flicker
      const flicker = Math.sin(f * 0.4) > 0.85 ? 0.75 : 1
      const chromaShift = Math.sin(f * 0.1) * 1.5
      const scanLine = ((f * 2) % 100)

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'rgba(0,255,255,0.15)',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              transform: `translateX(${-chromaShift}px)`,
            }}
          >
            {word}
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'rgba(255,0,255,0.12)',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              transform: `translateX(${chromaShift}px)`,
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textShadow: `0 0 10px ${color}, 0 0 25px rgba(0,255,255,0.2), 0 0 50px rgba(180,0,255,0.1)`,
              opacity: flicker,
            }}
          >
            {word}
          </div>
          {/* Horizontal scan line */}
          <div
            style={{
              position: 'absolute',
              left: -10,
              right: -10,
              top: `${scanLine}%`,
              height: 1,
              background: 'rgba(0,255,255,0.2)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )
    } else {
      // Dissolve with chromatic aberration
      const chromaOffset = exitProgress * 8
      const opacity = 1 - exitProgress
      const scaleY = 1 - exitProgress * 0.5

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'rgba(0,255,255,0.3)',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              transform: `translateX(${-chromaOffset}px) scaleY(${scaleY})`,
            }}
          >
            {word}
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'rgba(255,0,255,0.3)',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              transform: `translateX(${chromaOffset}px) scaleY(${scaleY})`,
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textShadow: `0 0 15px ${color}`,
              transform: `scaleY(${scaleY})`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function HolographicComponent(props: MotionGraphicProps<HolographicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-holographic',
  title: 'Kinetic Holographic',
  description: 'Holographic projection text with chromatic aberration, scan lines, grid background, and projection cone effect',
  tags: ['kinetic', 'typography', 'holographic', 'projection', 'cyberpunk', 'futuristic', 'sci-fi'],
  category: 'captions',
  component: HolographicComponent as any,
  defaultConfig: {
    words: ['HOLO', 'BEAM', 'SYNC', 'LIVE'],
    colors: ['#00FFFF', '#FF00FF', '#00FFFF', '#B400FF'],
    bgColor: '#05080f',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HOLO', 'BEAM', 'SYNC', 'LIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#00FFFF', '#B400FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#05080f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
