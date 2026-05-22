import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MoireGridConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Moire: two overlapping grids at slightly different angles/spacings create interference fringes
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Two slowly rotating grid layers create moire in the background
    const gridSpacing = 12
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Grid A */}
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent ${gridSpacing}px),
              repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent ${gridSpacing}px)`,
            transform: `rotate(${time * 3}deg)`,
          }}
        />
        {/* Grid B — slightly different angle */}
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent ${gridSpacing + 1}px),
              repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent ${gridSpacing + 1}px)`,
            transform: `rotate(${-time * 2.3 + 4}deg)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Moire effect on text: two overlapping copies at slightly different angles
    // At entry: high angle difference = strong moire interference
    // Hold: slowly rotating, produces living moire pattern
    // Exit: angles diverge causing moire breakdown/erasure

    const angleDiff =
      phase === 'enter'
        ? (1 - eased) * 8 + 0.3
        : phase === 'hold'
          ? 0.3 + Math.sin(time * 0.7) * 0.2 // breathing moire
          : 0.3 + exitProgress * 10

    const baseRotation = time * 6 // slowly rotates both

    const opacity = phase === 'enter' ? Math.min(1, enterProgress * 3) : phase === 'exit' ? 1 - exitProgress : 1

    // Scale pulsing from moire beats
    const moireBeat = phase === 'hold' ? 1 + Math.sin(time * (angleDiff * 20)) * 0.01 : 1

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Layer A */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${baseRotation + angleDiff / 2}deg) scale(${moireBeat})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: 0.7,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>

        {/* Layer B — slightly different angle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${baseRotation - angleDiff / 2}deg) scale(${moireBeat})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: 0.7,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>

        {/* Combined bright center — where both align */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${baseRotation}deg)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: Math.max(0, 1 - angleDiff * 0.3) * 0.6,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MoireGridComponent(props: MotionGraphicProps<MoireGridConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-moire-grid',
  title: 'Kinetic Moire Grid',
  description:
    'Two overlapping text copies at slightly different angles create a living moire interference pattern — fringes beat and breathe as both layers slowly rotate',
  tags: ['kinetic', 'typography', 'moire', 'interference', 'grid', 'optical', 'wave', 'pattern'],
  category: 'captions',
  component: MoireGridComponent as any,
  defaultConfig: {
    words: ['MOIRE', 'FRINGE', 'WAVE', 'BEAT'],
    colors: ['#CCFFCC', '#A0F0A0', '#E0FFE0', '#80E080'],
    bgColor: '#020A02',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MOIRE', 'FRINGE', 'WAVE', 'BEAT'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CCFFCC', '#A0F0A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020A02', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
