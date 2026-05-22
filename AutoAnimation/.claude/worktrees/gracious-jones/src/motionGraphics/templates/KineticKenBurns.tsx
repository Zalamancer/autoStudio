import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KenBurnsConfig extends KineticBaseConfig {
  driftSpeed: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow Ken Burns zoom on the background itself — documentary feel
    const bgScale = 1 + Math.sin(time * 0.15) * 0.04
    const bgPanX = Math.sin(time * 0.08) * 2
    const bgPanY = Math.cos(time * 0.06) * 1.5

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Simulated documentary photo background — muted earth tones */}
        <div
          style={{
            position: 'absolute',
            inset: '-5%',
            transform: `scale(${bgScale}) translate(${bgPanX}%, ${bgPanY}%)`,
            background: `linear-gradient(135deg,
              hsl(35, 12%, 14%) 0%,
              hsl(30, 15%, 18%) 25%,
              hsl(25, 10%, 20%) 50%,
              hsl(28, 12%, 16%) 75%,
              hsl(32, 14%, 12%) 100%)`,
          }}
        >
          {/* Faux photograph texture grain */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                rgba(255,255,255,0.01) 3px,
                rgba(255,255,255,0.01) 4px
              ), repeating-linear-gradient(
                90deg,
                transparent,
                transparent 3px,
                rgba(255,255,255,0.008) 3px,
                rgba(255,255,255,0.008) 4px
              )`,
              pointerEvents: 'none',
            }}
          />
        </div>
        {/* Warm vignette — documentary grading */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Thin rule line — documentary title separator */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            bottom: '35%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,240,0.2) 30%, rgba(255,255,240,0.2) 70%, transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30 // approximate fps
    let opacity = 0
    let scale = 1
    let panX = 0
    let panY = 0

    // Each word gets a unique drift direction
    const driftAngle = (index * 1.8 + 0.5) % (Math.PI * 2)
    const driftDirX = Math.cos(driftAngle)
    const driftDirY = Math.sin(driftAngle) * 0.4

    if (phase === 'enter') {
      // Gentle fade-in with slow zoom starting
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased
      scale = 1 + (1 - eased) * 0.03
      panX = driftDirX * (1 - eased) * -8
      panY = driftDirY * (1 - eased) * -4
    } else if (phase === 'hold') {
      opacity = 1
      // Continuous slow drift — the Ken Burns motion
      const drift = holdProgress * 12
      scale = 1 + holdProgress * 0.02
      panX = driftDirX * drift
      panY = driftDirY * drift
    } else {
      // Slow fade out while still drifting
      const eased = 1 - Math.pow(exitProgress, 2)
      opacity = eased
      scale = 1.02 + exitProgress * 0.01
      panX = driftDirX * (12 + exitProgress * 6)
      panY = driftDirY * (12 + exitProgress * 3)
    }

    return (
      <>
        {/* Subtitle / location text — small, understated */}
        <div
          style={{
            position: 'absolute',
            top: '58%',
            left: '50%',
            transform: `translate(calc(-50% + ${panX * 0.3}px), 0)`,
            opacity: opacity * 0.4,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(12px, 3vw, 28px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: color,
            whiteSpace: 'nowrap',
          }}
        >
          {'a documentary'}
        </div>
        {/* Main title text with Ken Burns drift */}
        <div
          style={{
            position: 'absolute',
            top: '44%',
            left: '50%',
            transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`,
            opacity,
            fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 400,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function KenBurnsComponent(props: MotionGraphicProps<KenBurnsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ken-burns',
  title: 'Kinetic Ken Burns',
  description: 'Documentary title card with slow Ken Burns zoom/pan drift on text, warm earth-tone backdrop, serif typography, and cinematic vignette',
  tags: ['kinetic', 'typography', 'ken-burns', 'documentary', 'cinema', 'drift', 'zoom', 'pan', 'title-card'],
  category: 'captions',
  component: KenBurnsComponent as any,
  defaultConfig: {
    words: ['LEGACY', 'WITNESS', 'TRUTH', 'RISE'],
    colors: ['#E8E0C8', '#D8D0B8', '#F0E8D0', '#C8C0A8'],
    bgColor: '#1a1610',
    cycleDuration: 2,
    driftSpeed: 50,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEGACY', 'WITNESS', 'TRUTH', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0C8', '#D8D0B8', '#F0E8D0', '#C8C0A8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1610', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 5, group: 'Timing' },
    { key: 'driftSpeed', label: 'Drift Speed', type: 'number', defaultValue: 50, min: 10, max: 100, group: 'Animation' },
  ],
})
