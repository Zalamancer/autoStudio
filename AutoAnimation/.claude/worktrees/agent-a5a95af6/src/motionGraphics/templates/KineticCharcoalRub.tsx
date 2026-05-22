import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CharcoalRubConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Charcoal dust smudge particles appearing around text as it's rubbed
const DUST_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  xPercent: rand(i * 31) * 120 - 10,
  yOffset: (rand(i * 47) - 0.5) * 80,
  size: 3 + rand(i * 19) * 8,
  opacity: 0.08 + rand(i * 13) * 0.18,
}))

// Rubbing stroke lines — slight diagonal grain from frottage
const RUB_STROKES = Array.from({ length: 12 }, (_, i) => ({
  yPercent: 10 + i * 7,
  xStart: rand(i * 23) * 5,
  opacity: 0.04 + rand(i * 17) * 0.05,
  thickness: 1 + rand(i * 11),
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Newsprint / tracing paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 18px,
            rgba(0,0,0,0.025) 18px,
            rgba(0,0,0,0.025) 19px
          )`,
        }}
      />
      {/* Charcoal smudge residue around the page */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 10% 80%, rgba(60,55,55,0.06) 0%, transparent 40%),
            radial-gradient(ellipse at 90% 20%, rgba(60,55,55,0.04) 0%, transparent 35%)
          `,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 73

    let textOpacity = 0
    let dustOpacity = 0
    let rubBlur = 8
    let smudgeSpread = 1.4 // scale of the smudge aura
    let globalScale = 1

    if (phase === 'enter') {
      // Charcoal rubbing: text starts invisible, emerges with blur as if rubbed onto page
      // Blur reduces progressively — frottage reveals crisp marks as rubbing concentrates
      const ep = easeOutCubic(enterProgress)
      textOpacity = ep
      dustOpacity = Math.sin(enterProgress * Math.PI) * 0.9 // dust peaks mid-rub
      rubBlur = (1 - ep) * 8
      smudgeSpread = 1.4 - ep * 0.4
      globalScale = 0.95 + ep * 0.05
    } else if (phase === 'hold') {
      textOpacity = 1
      dustOpacity = 0.2 + Math.sin(holdProgress * Math.PI * 4 + seed) * 0.05
      rubBlur = 0.5
      smudgeSpread = 1
      globalScale = 1
    } else {
      // Exit: charcoal smeared / wiped off — blur increases and text fades
      const ep = exitProgress
      textOpacity = 1 - ep
      dustOpacity = ep * 0.6
      rubBlur = ep * 10
      smudgeSpread = 1 + ep * 0.5
      globalScale = 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${globalScale})`,
        }}
      >
        {/* Charcoal smudge aura — soft radial emanating from text edges */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${smudgeSpread})`,
            width: '110%',
            height: '200%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${color}${Math.round(dustOpacity * 0.5 * 255).toString(16).padStart(2, '0')} 0%, transparent 65%)`,
            filter: 'blur(12px)',
            pointerEvents: 'none',
          }}
        />

        {/* Rubbing stroke texture lines */}
        {RUB_STROKES.map((stroke, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${stroke.yPercent - 5}%`,
              left: `${stroke.xStart}%`,
              right: 0,
              height: stroke.thickness,
              background: color,
              opacity: stroke.opacity * textOpacity,
              // Diagonal frottage angle
              transform: `rotate(${(rand(i * 41 + seed) - 0.5) * 3}deg)`,
            }}
          />
        ))}

        {/* Floating charcoal dust particles */}
        {DUST_PARTICLES.map((particle, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `calc(50% + ${particle.yOffset}px)`,
              left: `${particle.xPercent}%`,
              width: particle.size,
              height: particle.size * (0.4 + rand(i * 29) * 0.6),
              borderRadius: '50%',
              background: color,
              opacity: particle.opacity * dustOpacity,
              filter: `blur(${1 + rand(i * 7) * 2}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(48px, 14vw, 170px)',
            fontWeight: 900,
            letterSpacing: 4,
            color,
            opacity: textOpacity,
            whiteSpace: 'nowrap',
            filter: rubBlur > 0.2 ? `blur(${rubBlur}px)` : undefined,
            // Charcoal: granular, powdery look via soft textShadow
            textShadow: `
              0 0 ${4 + rubBlur}px ${color}70,
              1px 1px 2px ${color}50,
              -1px -1px 2px ${color}30,
              0 0 ${8 + rubBlur * 2}px ${color}30
            `,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CharcoalRubComponent(props: MotionGraphicProps<CharcoalRubConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-charcoal-rub',
  title: 'Kinetic Charcoal Rub',
  description:
    'Charcoal frottage / rubbing — text emerges from blur as charcoal is rubbed over paper, with floating dust particles, smudge aura, and grain lines.',
  tags: ['kinetic', 'typography', 'charcoal', 'rub', 'frottage', 'dust', 'smudge', 'art', 'texture', 'sketch'],
  category: 'captions',
  component: CharcoalRubComponent as any,
  defaultConfig: {
    words: ['RUB', 'SMUDGE', 'SHADE', 'GRAIN'],
    colors: ['#2C2C2C', '#1A1A1A', '#3D3D3D', '#0D0D0D'],
    bgColor: '#EDE8DF',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RUB', 'SMUDGE', 'SHADE', 'GRAIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C2C2C', '#1A1A1A', '#3D3D3D', '#0D0D0D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#EDE8DF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 6, group: 'Timing' },
  ],
})
