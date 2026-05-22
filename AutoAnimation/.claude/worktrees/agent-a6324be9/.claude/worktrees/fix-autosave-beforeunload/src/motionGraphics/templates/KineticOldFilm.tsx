import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OldFilmConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Film jitter — subtle random displacement
    const jitterX = Math.sin(time * 23.7) * 1.5 + Math.sin(time * 41.3) * 0.8
    const jitterY = Math.sin(time * 31.1) * 1.2 + Math.sin(time * 19.7) * 0.6
    // Flicker brightness
    const flicker = 0.85 + Math.sin(time * 11.3) * 0.05 + Math.sin(time * 27.9) * 0.03

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          transform: `translate(${jitterX}px, ${jitterY}px)`,
        }}
      >
        {/* Overall brightness flicker */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(240,220,180,${0.05 * flicker})`,
            pointerEvents: 'none',
          }}
        />
        {/* Vertical scratch lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const seed = i * 37 + 7
          const x = ((time * 3 + seed * 1.7) % 100)
          const scratchOpacity = Math.sin(time * 5 + seed) > 0.6 ? 0.12 : 0.03
          const scratchWidth = i % 3 === 0 ? 2 : 1
          return (
            <div
              key={`scratch-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: 0,
                bottom: 0,
                width: scratchWidth,
                background: `rgba(255,240,200,${scratchOpacity})`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Film burn spot */}
        <div
          style={{
            position: 'absolute',
            right: '10%',
            top: '15%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,200,100,${Math.sin(time * 2) > 0.7 ? 0.08 : 0}) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Frame edges — sprocket hole area */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4%',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '4%',
            background: 'linear-gradient(270deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Aged yellow tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(180,150,80,0.06)',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const seed = index * 53 + 17
    let opacity = 0
    let translateY = 0
    // Film jitter on text too
    const textJitterX = Math.sin(time * 19 + seed) * 1
    const textJitterY = Math.sin(time * 29 + seed) * 0.8

    if (phase === 'enter') {
      // Iris-wipe style: scale from center
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateY = (1 - eased) * 30
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle brightness flicker on hold
      opacity = 0.92 + Math.sin(f * 0.3 + seed) * 0.08
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * -20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '46%',
          left: '50%',
          transform: `translate(calc(-50% + ${textJitterX}px), calc(-50% + ${translateY + textJitterY}px))`,
          opacity,
          fontFamily: "'Georgia', 'Garamond', serif",
          fontSize: 'clamp(40px, 11vw, 145px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
          textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
          filter: 'contrast(0.9) brightness(0.95)',
        }}
      >
        {word}
      </div>
    )
  },
}

function OldFilmComponent(props: MotionGraphicProps<OldFilmConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-old-film',
  title: 'Kinetic Old Film',
  description: 'Old film reel effect with vertical scratches, gate jitter, brightness flicker, burn spots, and aged vignette',
  tags: ['kinetic', 'typography', 'old-film', 'vintage', 'retro', 'scratch', 'jitter', 'reel', 'cinema'],
  category: 'captions',
  component: OldFilmComponent as any,
  defaultConfig: {
    words: ['CLASSIC', 'CINEMA', 'REEL', 'GLORY'],
    colors: ['#E8D5B7', '#D4C4A0', '#C9B896', '#E8D5B7'],
    bgColor: '#1A1408',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CLASSIC', 'CINEMA', 'REEL', 'GLORY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D5B7', '#D4C4A0', '#C9B896', '#E8D5B7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1408', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
