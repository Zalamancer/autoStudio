import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ComaDistortConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Coma aberration: off-axis points produce comet-like smears radiating from center
// Each letter gets a directional smear that points away from the optical axis (center)
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Radial optical axis indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 1,
            height: 1,
            boxShadow: `0 0 ${30 + Math.sin(time * 1.5) * 10}px ${12 + Math.sin(time) * 4}px rgba(255,255,255,0.04)`,
            borderRadius: '50%',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Coma strength — strong at entry, corrects during hold, returns on exit
    const comaStrength =
      phase === 'enter' ? 1 - eased : phase === 'hold' ? 0.06 + Math.sin(time * 2.2) * 0.04 : exitProgress

    // Coma: text smears toward top-right (off-axis direction)
    // Multiple ghost copies stacked with progressive offset
    const ghostCount = 5

    // Hold: subtle comatic breathing
    const holdBob = phase === 'hold' ? Math.sin(time * 1.6) * 2 : 0

    const overallOpacity = phase === 'enter' ? Math.min(1, enterProgress * 2.5) : 1

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: overallOpacity }}>
        {/* Coma ghost trail — comet smear copies */}
        {Array.from({ length: ghostCount }, (_, g) => {
          const t = (g + 1) / ghostCount
          const smearX = t * comaStrength * 50 // horizontal smear to right
          const smearY = -t * comaStrength * 30 // upward smear
          const ghostOpacity = comaStrength * (1 - t) * 0.4
          const ghostBlur = t * comaStrength * 4

          return (
            <div
              key={`ghost-${g}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${smearX}px), calc(-50% + ${smearY + holdBob}px))`,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(44px, 13vw, 170px)',
                fontWeight: 800,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                opacity: ghostOpacity,
                filter: ghostBlur > 0 ? `blur(${ghostBlur}px)` : undefined,
                mixBlendMode: 'screen',
              }}
            >
              {word}
            </div>
          )
        })}

        {/* Main sharp text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${holdBob}px))`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            textShadow:
              comaStrength > 0.1
                ? `${comaStrength * 8}px ${-comaStrength * 5}px ${comaStrength * 12}px rgba(255,220,180,0.25)`
                : `0 0 8px rgba(255,255,255,0.08)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ComaDistortComponent(props: MotionGraphicProps<ComaDistortConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-coma-distort',
  title: 'Kinetic Coma Distort',
  description:
    'Coma optical aberration — text arrives with a comet-like directional smear of ghost copies that collapse into a sharp word as the lens corrects',
  tags: ['kinetic', 'typography', 'coma', 'aberration', 'optical', 'smear', 'lens', 'comet'],
  category: 'captions',
  component: ComaDistortComponent as any,
  defaultConfig: {
    words: ['STREAK', 'COMET', 'SMEAR', 'BLUR'],
    colors: ['#FFE8C0', '#FFD080', '#FFF0D8', '#FFCC60'],
    bgColor: '#07060A',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STREAK', 'COMET', 'SMEAR', 'BLUR'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE8C0', '#FFD080'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#07060A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
