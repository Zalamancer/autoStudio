import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmHalationConfig extends KineticBaseConfig {
  halationRadius: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Halation: light bleeding through the film base from bright highlights
    // Creates red/orange halo around bright areas — characteristic of Vision3 500T
    const haloPulse = 0.6 + Math.sin(time * 0.8) * 0.15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Anti-halation layer breakdown — warm orange bleed from center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 45%, rgba(255,120,40,${haloPulse * 0.12}) 0%, rgba(220,60,20,0.06) 40%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Secondary halation ring — film base reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 45%, transparent 20%, rgba(255,80,20,${haloPulse * 0.08}) 45%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Kodak Vision3 response curve vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(20,8,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Fine grain structure — Vision3 fine grain */}
        {Array.from({ length: 12 }, (_, i) => {
          const gx = ((i * 37 + Math.floor(time * 24) * 13) % 97) / 97 * 100
          const gy = ((i * 53 + Math.floor(time * 24) * 7) % 89) / 89 * 100
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${gx}%`,
                top: `${gy}%`,
                width: 1,
                height: 1,
                background: `rgba(255,160,60,${0.04 + (i % 4) * 0.015})`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Lens flare micro-streak from halation source */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '45%',
            width: 80,
            height: 1,
            transform: 'translate(-50%, -50%) rotate(12deg)',
            background: `linear-gradient(to right, transparent, rgba(255,160,60,${haloPulse * 0.15}), transparent)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const haloPulse = 0.6 + Math.sin(t * 0.8 + index) * 0.15

    let opacity = 1
    let scale = 1
    let halationBloom = haloPulse

    if (phase === 'enter') {
      const ease = 1 - Math.pow(1 - enterProgress, 2)
      opacity = ease
      scale = 0.94 + ease * 0.06
      halationBloom = haloPulse * (2 - enterProgress)
    } else if (phase === 'hold') {
      scale = 1 + Math.sin(t * 0.5 + index) * 0.004
    } else {
      opacity = 1 - exitProgress * 0.9
      halationBloom = haloPulse * (1 + exitProgress)
    }

    const glowPx = 15 + halationBloom * 25
    const glowPx2 = 30 + halationBloom * 40

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(46px, 12.5vw, 168px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 8,
          // Halation bloom — red/orange glow bleeding around bright text
          textShadow: `0 0 ${glowPx}px rgba(255,100,30,0.7), 0 0 ${glowPx2}px rgba(220,60,10,0.35), 0 0 ${glowPx2 * 1.5}px rgba(180,40,0,0.15)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function FilmHalationComponent(props: MotionGraphicProps<FilmHalationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-halation',
  title: 'Kinetic Film Halation',
  description: 'Kodak Vision3 halation effect — red-orange anti-halation bleed from bright text highlights, warm film grain, and pulsing bloom radius matching the glow',
  tags: ['kinetic', 'typography', 'halation', 'film', 'kodak', 'bloom', 'glow', 'cinematic', 'vision3'],
  category: 'captions',
  component: FilmHalationComponent as any,
  defaultConfig: {
    words: ['LIGHT', 'BLEED', 'BLOOM', 'GLOW'],
    colors: ['#FFFFFF', '#FFF5E6', '#FFFFFF', '#FFE4CC'],
    bgColor: '#0a0500',
    cycleDuration: 1.5,
    halationRadius: 40,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIGHT', 'BLEED', 'BLOOM', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFF5E6', '#FFFFFF', '#FFE4CC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0500', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'halationRadius', label: 'Halation Radius (px)', type: 'number', defaultValue: 40, min: 10, max: 100, group: 'Animation' },
  ],
})
