import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlideProjectorConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Projection light cone — warm falloff from center
    const flicker = 0.92 + Math.sin(time * 12) * 0.02 + Math.sin(time * 7.3) * 0.015

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Projected light rectangle — the slide frame */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '12%',
            right: '12%',
            bottom: '10%',
            background: `radial-gradient(ellipse at 50% 50%,
              rgba(255,248,230,${0.12 * flicker}) 0%,
              rgba(255,240,210,${0.06 * flicker}) 60%,
              transparent 100%)`,
          }}
        />
        {/* Slide mount border — the cardboard frame */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '10%',
            right: '10%',
            bottom: '8%',
            border: '3px solid rgba(200,180,140,0.2)',
            borderRadius: 2,
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
          }}
        />
        {/* Corner marks — 35mm slide alignment dots */}
        {[
          { top: '7%', left: '9%' },
          { top: '7%', right: '9%' },
          { bottom: '7%', left: '9%' },
          { bottom: '7%', right: '9%' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(200,180,140,0.15)',
            } as any}
          />
        ))}
        {/* Dust particles floating in projector beam */}
        {Array.from({ length: 6 }, (_, i) => {
          const seed = i * 73 + 11
          const x = 20 + (seed * 3.7 % 60)
          const y = 15 + ((seed * 2.3 + time * 8) % 70)
          const size = 1.5 + (seed % 3)
          const particleOpacity = 0.08 + Math.sin(time * 2 + seed) * 0.04
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `rgba(255,240,200,${particleOpacity})`,
                filter: 'blur(0.5px)',
              }}
            />
          )
        })}
        {/* Warm projector vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
  }: WordRenderProps) => {
    let opacity = 0
    let blur = 0
    let brightness = 1
    let translateX = 0

    if (phase === 'enter') {
      // Slide click-advance: brief defocus blur then sharp snap into place
      if (enterProgress < 0.3) {
        // Previous slide leaving — blur out
        opacity = 0.4 + enterProgress * 2
        blur = 12 * (1 - enterProgress / 0.3)
        brightness = 1.3
        translateX = (1 - enterProgress / 0.3) * -15
      } else if (enterProgress < 0.5) {
        // Momentary blackout between slides
        const blackT = (enterProgress - 0.3) / 0.2
        opacity = 1 - blackT * 0.6
        blur = 6 * (1 - blackT)
        brightness = 1.2 - blackT * 0.2
      } else {
        // New slide snaps in
        const snapT = (enterProgress - 0.5) / 0.5
        opacity = 0.4 + snapT * 0.6
        blur = 8 * (1 - snapT)
        brightness = 1 + (1 - snapT) * 0.15
        translateX = (1 - snapT) * 10
      }
    } else if (phase === 'hold') {
      opacity = 1
      blur = 0
      brightness = 1
      // Subtle projector vibration
      translateX = Math.sin(holdProgress * Math.PI * 6) * 0.5
    } else {
      // Slide advancing out
      const t = exitProgress
      opacity = 1 - t
      blur = t * 14
      brightness = 1 + t * 0.3
      translateX = t * -12
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%)`,
          opacity,
          filter: `blur(${blur}px) brightness(${brightness})`,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
          textShadow: `0 0 20px rgba(255,240,200,0.3)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function SlideProjectorComponent(props: MotionGraphicProps<SlideProjectorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slide-projector',
  title: 'Kinetic Slide Projector',
  description:
    '35mm slide projector with click-advance mechanic. Each word snaps through defocus blur like a carousel slide changing, with dust motes in the projector beam.',
  tags: ['kinetic', 'typography', 'slide', 'projector', 'analog', '35mm', 'carousel', 'vintage'],
  category: 'captions',
  component: SlideProjectorComponent as any,
  defaultConfig: {
    words: ['VACATION', 'SUMMER', '1974', 'FAMILY'],
    colors: ['#f5e6c8', '#f0ddb8', '#e8d5b0', '#f5e6c8'],
    bgColor: '#0a0808',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VACATION', 'SUMMER', '1974', 'FAMILY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f5e6c8', '#f0ddb8', '#e8d5b0', '#f5e6c8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
