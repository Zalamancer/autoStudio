import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DaguerreotypeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow shimmer across the polished silver plate
    const shimmerX = 50 + Math.sin(time * 0.8) * 20
    const shimmerY = 50 + Math.cos(time * 0.6) * 15
    // Mercury vapor drift
    const vaporY = (time * 8) % 100

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Polished silver plate base with mirror-like gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${shimmerX}% ${shimmerY}%, rgba(180,170,155,0.15), transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Silver halide grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(160,150,130,0.04) 2px, rgba(160,150,130,0.04) 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Mercury vapor wisps rising */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            bottom: `${vaporY}%`,
            height: 40,
            background: 'linear-gradient(0deg, rgba(200,190,170,0.06), rgba(200,190,170,0.02), transparent)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />
        {/* Oxidation vignette — dark tarnished edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(40,30,20,0.5) 90%)',
            pointerEvents: 'none',
          }}
        />
        {/* Plate edge border */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            border: '1px solid rgba(140,130,110,0.2)',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 73 + 17
    let opacity = 0
    let vaporBlur = 0

    if (phase === 'enter') {
      // Mercury vapor development — ghostly materialization from nothing
      // Starts as blurry vapor, sharpens as silver crystals form
      opacity = enterProgress * enterProgress // Slow start, accelerating
      vaporBlur = (1 - enterProgress) * 12
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle mirror shimmer during hold — the daguerreotype's hallmark viewing-angle shift
      vaporBlur = Math.sin(f * 0.08 + seed) * 0.5 + 0.5
    } else {
      // Fade like tarnishing silver
      opacity = 1 - exitProgress * exitProgress
      vaporBlur = exitProgress * 8
    }

    // Mirror-like reflection shift
    const reflectShift = Math.sin(f * 0.05 + seed) * 2

    return (
      <>
        {/* Ghost reflection layer — the mirror-image shimmer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${reflectShift}px), calc(-50% + 2px))`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 400,
            color: 'rgba(180,170,150,0.15)',
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: opacity * 0.4,
            filter: `blur(${vaporBlur + 3}px)`,
          }}
        >
          {word}
        </div>
        {/* Silver plate text — main element */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 400,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity,
            filter: `blur(${vaporBlur}px)`,
            textShadow: `0 0 15px rgba(180,170,150,0.3), 0 0 30px rgba(160,150,130,0.15)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DaguerreotypeComponent(props: MotionGraphicProps<DaguerreotypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-daguerreotype',
  title: 'Kinetic Daguerreotype',
  description: 'Silver plate photography: text materializes as mercury vapor develops on polished silver with ghostly mirror-like shimmer and sepia tones',
  tags: ['kinetic', 'typography', 'daguerreotype', 'silver', 'vintage', 'photography', 'darkroom', 'antique'],
  category: 'captions',
  component: DaguerreotypeComponent as any,
  defaultConfig: {
    words: ['SILVER', 'MERCURY', 'PLATE', 'EXPOSE'],
    colors: ['#c8b898', '#b8a888', '#d0c0a8', '#a89878'],
    bgColor: '#1a1612',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SILVER', 'MERCURY', 'PLATE', 'EXPOSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#c8b898', '#b8a888', '#d0c0a8', '#a89878'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1612', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
