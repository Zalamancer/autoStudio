import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TriFoldConfig extends KineticBaseConfig {
  panelGap: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/** Staggered enter: left panel opens first, then center, then right */
function panelProgress(overall: number, panelIndex: number, totalPanels: number): number {
  const stagger = 0.25
  const start = panelIndex * stagger
  const end = start + (1 - (totalPanels - 1) * stagger)
  return Math.max(0, Math.min(1, (overall - start) / (end - start)))
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    // Three panels: left folds open to -90Y, center stays, right folds open to +90Y
    // Each panel shows one third of the word text
    const panels = [0, 1, 2]

    interface PanelAnim {
      angle: number
      shadow: number
    }

    const getAngles = (): PanelAnim[] => {
      if (phase === 'enter') {
        return panels.map((i) => {
          const p = easeOutCubic(panelProgress(enterProgress, i, 3))
          // Left panel (0) swings left, right panel (2) swings right, center (1) stays flat
          const maxAngle = i === 0 ? -90 : i === 2 ? 90 : 0
          return { angle: maxAngle * (1 - p), shadow: Math.sin(p * Math.PI) * 0.4 }
        })
      } else if (phase === 'hold') {
        const breathe = Math.sin(holdProgress * Math.PI * 2) * 1.5
        return [
          { angle: -breathe, shadow: 0 },
          { angle: 0, shadow: 0 },
          { angle: breathe, shadow: 0 },
        ]
      } else {
        return panels.map((i) => {
          const p = easeInCubic(panelProgress(exitProgress, 2 - i, 3))
          const maxAngle = i === 0 ? -90 : i === 2 ? 90 : 0
          return { angle: maxAngle * p, shadow: Math.sin(p * Math.PI) * 0.3 }
        })
      }
    }

    const angles = getAngles()
    const overallOpacity =
      phase === 'enter'
        ? enterProgress > 0.05 ? 1 : enterProgress / 0.05
        : phase === 'exit'
        ? exitProgress < 0.8 ? 1 : (1 - exitProgress) / 0.2
        : 1

    // Panel clip fractions: [0%..33%], [33%..66%], [66%..100%]
    const clipRanges = [
      { left: '0%', right: '66.67%' },
      { left: '33.33%', right: '33.33%' },
      { left: '66.67%', right: '0%' },
    ]

    // Pivot origins for each panel
    const pivotOrigins = ['right center', 'center center', 'left center']
    const perspectiveOrigins = ['100% 50%', '50% 50%', '0% 50%']

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: overallOpacity,
        }}
      >
        {panels.map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: 1000,
              perspectiveOrigin: perspectiveOrigins[i],
            }}
          >
            <div
              style={{
                transformOrigin: pivotOrigins[i],
                transform: `rotateY(${angles[i].angle}deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(44px, 11vw, 150px)',
                  fontWeight: 900,
                  color,
                  whiteSpace: 'nowrap',
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  letterSpacing: '-0.02em',
                  clipPath: `inset(0 ${clipRanges[i].right} 0 ${clipRanges[i].left})`,
                  textShadow: `0 2px 8px ${color}33`,
                }}
              >
                {word}
              </div>
              {/* Crease shadow on panel edges */}
              {angles[i].shadow > 0.05 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `rgba(0,0,0,${angles[i].shadow * 0.4})`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </div>
        ))}

        {/* Two crease lines at 1/3 and 2/3 */}
        {[33.33, 66.67].map((pct, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '15%',
              bottom: '15%',
              left: `${pct}%`,
              width: 1.5,
              background: `rgba(255,255,255,0.2)`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },
}

function TriFoldComponent(props: MotionGraphicProps<TriFoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tri-fold',
  title: 'Kinetic Tri-Fold',
  description: 'Text unfolds across three panels like a tri-fold brochure — staggered left-center-right hinge reveal',
  tags: ['kinetic', 'typography', 'trifold', 'brochure', 'fold', 'panel', 'hinge', 'mechanical'],
  category: 'captions',
  component: TriFoldComponent as any,
  defaultConfig: {
    words: ['UNFOLD', 'REVEAL', 'PANELS', 'THREE'],
    colors: ['#06B6D4', '#8B5CF6', '#F97316', '#22C55E'],
    bgColor: '#0a0a0a',
    cycleDuration: 2.0,
    panelGap: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['UNFOLD', 'REVEAL', 'PANELS', 'THREE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#06B6D4', '#8B5CF6', '#F97316', '#22C55E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.6, max: 6, group: 'Timing' },
    { key: 'panelGap', label: 'Panel Gap (px)', type: 'number', defaultValue: 2, min: 0, max: 8, group: 'Animation' },
  ],
})
