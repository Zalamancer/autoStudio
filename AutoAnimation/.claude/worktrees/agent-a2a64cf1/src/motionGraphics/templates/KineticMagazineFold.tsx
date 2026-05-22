import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MagazineFoldConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Vertical center crease shadow — the magazine spine */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 3,
          transform: 'translateX(-50%)',
          background: bgColor === '#FAFAFA'
            ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.06), transparent)'
            : 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)',
        }}
      />
      {/* Horizontal fold crease — mid-page */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '5%',
          right: '5%',
          height: 1,
          background: bgColor === '#FAFAFA'
            ? 'rgba(0,0,0,0.04)'
            : 'rgba(255,255,255,0.04)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // The magazine fold animation: top half folds down (rotateX), bottom half folds up
    // Uses perspective to simulate a page fold along the horizontal crease

    let topFoldAngle = -90  // starts folded away (top half)
    let bottomFoldAngle = 90  // starts folded away (bottom half)
    let opacity = 0
    let shadowOpacity = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      topFoldAngle = -90 + eased * 90        // unfolds from -90 to 0
      bottomFoldAngle = 90 - eased * 90      // unfolds from 90 to 0
      opacity = Math.min(1, enterProgress * 2)
      shadowOpacity = Math.max(0, 1 - enterProgress * 2)
    } else if (phase === 'hold') {
      topFoldAngle = 0
      bottomFoldAngle = 0
      opacity = 1
      shadowOpacity = 0
    } else {
      // Re-fold on exit: top goes up (positive angle), bottom goes down
      const eased = exitProgress * exitProgress
      topFoldAngle = eased * 90
      bottomFoldAngle = -eased * 90
      opacity = 1 - exitProgress
      shadowOpacity = exitProgress
    }

    const serif = "'Playfair Display', 'Georgia', 'Times New Roman', serif"
    const FONT_SIZE = 'clamp(28px, 7.5vw, 100px)'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '88%',
          textAlign: 'center',
          perspective: 800,
        }}
      >
        {/* Top half — clips to upper portion, folds downward */}
        <div
          style={{
            overflow: 'hidden',
            height: '1em',
            transformOrigin: 'bottom center',
            transform: `rotateX(${topFoldAngle}deg)`,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: serif,
              fontSize: FONT_SIZE,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color,
              lineHeight: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </div>

        {/* Fold crease highlight */}
        <div
          style={{
            height: 1,
            background: color,
            opacity: 0.12,
            margin: '0 auto',
            width: '60%',
          }}
        />

        {/* Bottom half — clips to lower portion, folds upward */}
        <div
          style={{
            overflow: 'hidden',
            height: '1em',
            transformOrigin: 'top center',
            transform: `rotateX(${bottomFoldAngle}deg)`,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: serif,
              fontSize: FONT_SIZE,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color,
              lineHeight: 0,
              whiteSpace: 'nowrap',
              marginTop: '-1em',
            }}
          >
            {word}
          </div>
        </div>

        {/* Crease shadow overlay — dims during fold */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), transparent 45%, transparent 55%, rgba(0,0,0,0.25))',
            opacity: shadowOpacity,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },
}

function KineticMagazineFoldComponent(props: MotionGraphicProps<MagazineFoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-magazine-fold',
  title: 'Magazine Fold',
  description: 'Text unfolds along a magazine crease with 3D perspective. Top and bottom halves unfold from the center spine. Classic print production technique.',
  tags: ['kinetic', 'typography', 'magazine', 'fold', 'editorial', '3d', 'perspective', 'print'],
  category: 'captions',
  component: KineticMagazineFoldComponent as any,
  defaultConfig: {
    words: ['CULTURE', 'DESIGN', 'TRAVEL', 'FINANCE'],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CULTURE', 'DESIGN', 'TRAVEL', 'FINANCE'], group: 'Content' },
    { key: 'colors', label: 'Text Color', type: 'text-array', defaultValue: ['#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
