import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BiFoldConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuint(t: number): number {
  return t * t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Bi-fold: word splits at center, left half folds left (-90Y), right half folds right (+90Y)
    // On enter: panels fold FROM flat-closed (90deg) TO open (0deg), revealing text
    let leftAngle = 0
    let rightAngle = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutQuint(enterProgress)
      // Left panel starts folded away (rotated -90), opens to 0
      leftAngle = -(1 - eased) * 90
      rightAngle = (1 - eased) * 90
      opacity = enterProgress > 0.05 ? 1 : enterProgress / 0.05
    } else if (phase === 'hold') {
      // Very slight breathing flex
      const flex = Math.sin(holdProgress * Math.PI * 2) * 1.5
      leftAngle = -flex
      rightAngle = flex
    } else {
      const eased = easeInQuint(exitProgress)
      leftAngle = -eased * 90
      rightAngle = eased * 90
      opacity = exitProgress < 0.75 ? 1 : (1 - exitProgress) / 0.25
    }

    // Shadow depth on the crease
    const foldDepth = Math.max(Math.abs(leftAngle), Math.abs(rightAngle)) / 90

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
        }}
      >
        {/* Left half — clips the left side of the word, pivots on right edge */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            perspective: 900,
            perspectiveOrigin: '100% 50%',
          }}
        >
          <div
            style={{
              transformOrigin: 'right center',
              transform: `rotateY(${leftAngle}deg)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              padding: '12px 0 12px 24px',
              // Crease shadow on the right edge of left panel
              boxShadow: leftAngle !== 0 ? `inset -6px 0 16px rgba(0,0,0,${foldDepth * 0.5})` : 'none',
            }}
          >
            {/* Clip to left half by overflow on parent */}
            <div
              style={{
                fontSize: 'clamp(48px, 12vw, 160px)',
                fontWeight: 900,
                color,
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                letterSpacing: '-0.02em',
                // Shift text so right half is hidden (will be shown by right panel)
                clipPath: 'inset(0 50% 0 0)',
                textShadow: `0 2px 8px ${color}33`,
              }}
            >
              {word}
            </div>
          </div>
        </div>

        {/* Right half — pivots on left edge */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: 900,
            perspectiveOrigin: '0% 50%',
          }}
        >
          <div
            style={{
              transformOrigin: 'left center',
              transform: `rotateY(${rightAngle}deg)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              padding: '12px 24px 12px 0',
              boxShadow: rightAngle !== 0 ? `inset 6px 0 16px rgba(0,0,0,${foldDepth * 0.5})` : 'none',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(48px, 12vw, 160px)',
                fontWeight: 900,
                color,
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                letterSpacing: '-0.02em',
                clipPath: 'inset(0 0 0 50%)',
                textShadow: `0 2px 8px ${color}33`,
              }}
            >
              {word}
            </div>
          </div>
        </div>

        {/* Center crease line — the fold axis */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            bottom: '20%',
            left: '50%',
            width: Math.max(1, foldDepth * 3),
            transform: 'translateX(-50%)',
            background: `rgba(255,255,255,${foldDepth * 0.4})`,
            pointerEvents: 'none',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },
}

function BiFoldComponent(props: MotionGraphicProps<BiFoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bi-fold',
  title: 'Kinetic Bi-Fold',
  description: 'Text splits at the center crease and each half folds open like a bi-fold door, exposing the word',
  tags: ['kinetic', 'typography', 'bifold', 'fold', 'door', 'hinge', 'split', 'mechanical'],
  category: 'captions',
  component: BiFoldComponent as any,
  defaultConfig: {
    words: ['SPLIT', 'FOLD', 'OPEN', 'WIDE'],
    colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
    bgColor: '#111111',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPLIT', 'FOLD', 'OPEN', 'WIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.4, max: 5, group: 'Timing' },
  ],
})
