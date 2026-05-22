import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SilentFilmConfig extends KineticBaseConfig {
  grainIntensity: number
}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Flickering brightness like old projector (18fps judder)
    const projectorFlicker = 0.85 + rand(Math.floor(frame * 0.7)) * 0.15
    // Iris vignette that gently breathes
    const irisSize = 62 + Math.sin(time * 1.2) * 3
    // Film grain: scattered bright/dark spots
    const grainDots = Array.from({ length: 12 }, (_, i) => ({
      x: rand(frame * 13 + i * 97) * 100,
      y: rand(frame * 29 + i * 53) * 100,
      size: 1 + rand(frame * 7 + i * 41) * 3,
      bright: rand(frame * 3 + i * 19) > 0.5,
    }))
    // Occasional vertical scratch line
    const scratchX = rand(Math.floor(frame * 0.3)) * 100
    const showScratch = rand(frame * 11) < 0.15

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#1a1610',
          filter: `brightness(${projectorFlicker}) sepia(0.6)`,
        }}
      >
        {/* Inner warm sepia fill */}
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
        {/* Iris vignette — circular black border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse ${irisSize}% ${irisSize}% at 50% 50%, transparent 60%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.95) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Ornate border corners */}
        {[0, 1, 2, 3].map(corner => {
          const isTop = corner < 2
          const isLeft = corner % 2 === 0
          return (
            <div
              key={corner}
              style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: '4%',
                [isLeft ? 'left' : 'right']: '6%',
                width: 40,
                height: 40,
                borderTop: isTop ? '3px solid rgba(210,190,140,0.5)' : 'none',
                borderBottom: isTop ? 'none' : '3px solid rgba(210,190,140,0.5)',
                borderLeft: isLeft ? '3px solid rgba(210,190,140,0.5)' : 'none',
                borderRight: isLeft ? 'none' : '3px solid rgba(210,190,140,0.5)',
              }}
            />
          )
        })}
        {/* Decorative top/bottom rule lines */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '15%',
            right: '15%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(210,190,140,0.4) 20%, rgba(210,190,140,0.4) 80%, transparent)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '15%',
            right: '15%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(210,190,140,0.4) 20%, rgba(210,190,140,0.4) 80%, transparent)',
          }}
        />
        {/* Film grain dots */}
        {grainDots.map((dot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: dot.size,
              height: dot.size,
              borderRadius: '50%',
              background: dot.bright ? 'rgba(255,255,240,0.15)' : 'rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Vertical scratch */}
        {showScratch && (
          <div
            style={{
              position: 'absolute',
              left: `${scratchX}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(255,255,240,0.12)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      // Iris-in reveal: text fades in as if iris opening
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased
      scale = 0.9 + eased * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle projector jitter
      scale = 1 + Math.sin(f * 0.8) * 0.003
    } else {
      // Iris-out: fade to black
      opacity = 1 - Math.pow(exitProgress, 2)
      scale = 1 - exitProgress * 0.05
    }

    // Projector gate weave — tiny position wobble
    const weaveX = Math.sin(f * 0.6 + index * 3) * 1.2
    const weaveY = Math.cos(f * 0.4 + index * 5) * 0.8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${weaveX}px), calc(-50% + ${weaveY}px)) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Playfair Display', 'Times New Roman', serif",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 700,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: 8,
          color,
          textShadow: '2px 2px 0 rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
          filter: `sepia(0.3) contrast(1.1)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function SilentFilmComponent(props: MotionGraphicProps<SilentFilmConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-silent-film',
  title: 'Kinetic Silent Film',
  description: 'Silent movie intertitle card with flickering film grain, iris vignette, ornate border corners, and projector gate weave',
  tags: ['kinetic', 'typography', 'silent', 'film', 'vintage', 'intertitle', '1920s', 'cinema', 'sepia'],
  category: 'captions',
  component: SilentFilmComponent as any,
  defaultConfig: {
    words: ['BEHOLD', 'THE END', 'ALAS', 'HARK'],
    colors: ['#D2BE8C', '#C8B478', '#DEC896', '#BEA86E'],
    bgColor: '#1a1610',
    cycleDuration: 1.5,
    grainIntensity: 50,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BEHOLD', 'THE END', 'ALAS', 'HARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D2BE8C', '#C8B478', '#DEC896', '#BEA86E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1610', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'grainIntensity', label: 'Grain Intensity', type: 'number', defaultValue: 50, min: 0, max: 100, group: 'Animation' },
  ],
})
