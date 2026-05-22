import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SepiaConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Flickering grain intensity
    const grainFlicker = 0.06 + Math.sin(time * 7.3) * 0.02 + Math.sin(time * 13.1) * 0.01

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #3E2723 0%, ${bgColor} 30%, #4E342E 70%, #2C1A0E 100%)`,
        }}
      >
        {/* Warm sepia vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(30,15,5,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Film grain overlay — horizontal noise lines */}
        {Array.from({ length: 8 }, (_, i) => {
          const y = ((time * 15 + i * 13.7) % 110) - 5
          const opacity = grainFlicker * (0.5 + (i % 3) * 0.3)
          return (
            <div
              key={`grain-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${y}%`,
                height: i % 2 === 0 ? 1 : 2,
                background: `rgba(180,140,90,${opacity})`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Dust specks */}
        {Array.from({ length: 5 }, (_, i) => {
          const seed = i * 47 + 19
          const x = ((seed * 7.3 + time * 2) % 100)
          const y = ((seed * 3.1 + time * 1.5) % 100)
          const size = 2 + (seed % 3)
          const vis = Math.sin(time * 3 + seed) > 0.3 ? 0.15 : 0
          return (
            <div
              key={`dust-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `rgba(200,170,120,${vis})`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Warm color wash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(160,100,40,0.08) 0%, rgba(120,70,20,0.05) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 67 + 11
    let opacity = 0
    let translateY = 0
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Fade in from warm blur, like old projector focusing
      const eased = 1 - Math.pow(1 - enterProgress, 2.5)
      opacity = eased
      blur = (1 - eased) * 6
      scale = 0.95 + eased * 0.05
      translateY = (1 - eased) * 15
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle aged flicker
      const flicker = Math.sin(f * 0.2 + seed) * 0.03
      opacity = 0.95 + flicker
      translateY = Math.sin(f * 0.08 + seed) * 1.5
    } else {
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      blur = eased * 4
      translateY = eased * -10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          filter: `blur(${blur}px) sepia(0.4) saturate(0.8)`,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(38px, 11vw, 150px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          textTransform: 'uppercase',
          textShadow: `0 2px 8px rgba(60,30,10,0.5), 0 0 30px rgba(160,100,40,0.2)`,
        }}
      >
        {word}
        {/* Underline flourish */}
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '10%',
            right: '10%',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
            opacity: phase === 'enter' ? enterProgress : phase === 'exit' ? 1 - exitProgress : 1,
          }}
        />
      </div>
    )
  },
}

function SepiaComponent(props: MotionGraphicProps<SepiaConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sepia',
  title: 'Kinetic Sepia',
  description: 'Warm sepia-toned text with film grain, dust specks, aged vignette, and soft focus entrance',
  tags: ['kinetic', 'typography', 'sepia', 'vintage', 'retro', 'warm', 'film', 'grain', 'aged'],
  category: 'captions',
  component: SepiaComponent as any,
  defaultConfig: {
    words: ['MEMORY', 'FADED', 'GOLDEN', 'DAYS'],
    colors: ['#D4A574', '#C49A6C', '#BF8A5E', '#D4A574'],
    bgColor: '#2C1A0E',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MEMORY', 'FADED', 'GOLDEN', 'DAYS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A574', '#C49A6C', '#BF8A5E', '#D4A574'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2C1A0E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
