import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GhostSolidConfig extends KineticBaseConfig {
  ghostOpacity: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle ethereal shimmer
    const shimmer = Math.sin(time * 1.5) * 0.5 + 0.5
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(200,220,255,${0.02 + shimmer * 0.02}) 0%, transparent 70%)`,
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        {chars.map((ch, ci) => {
          const charFraction = chars.length > 1 ? ci / (chars.length - 1) : 0.5

          // Ghost layer props
          let ghostOpacity = 0
          let ghostScale = 1
          let ghostBlur = 0
          let ghostTranslateY = 0

          // Solid layer props
          let solidOpacity = 0
          let solidScale = 1
          let solidBlur = 0
          let rotation = 0

          if (phase === 'enter') {
            // Ghost floats up from below, then SNAPS solid
            const stagger = charFraction * 0.1
            const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))

            if (p < 0.6) {
              // Ghost phase: ethereal form drifts upward
              const ghostT = p / 0.6
              ghostOpacity = ghostT * 0.35
              ghostTranslateY = 20 * (1 - ghostT)
              ghostBlur = (1 - ghostT) * 6
              ghostScale = 1.1 - ghostT * 0.1
              solidOpacity = 0
            } else {
              // Snap: ghost instantly materializes solid with scale pop
              const snapT = (p - 0.6) / 0.4
              const solidSnap = easeOutBack(snapT)
              ghostOpacity = (1 - snapT) * 0.35
              ghostTranslateY = 0
              solidOpacity = Math.min(1, snapT * 2)
              solidScale = solidSnap
              solidBlur = (1 - snapT) * 4
            }
          } else if (phase === 'hold') {
            // Alternate between ghost and solid states — haunting flicker
            const flickerT = Math.sin(holdProgress * Math.PI * 5 + ci * 0.8)
            const flickerAmt = Math.max(0, flickerT) * (1 - holdProgress * 0.6) * 0.3

            solidOpacity = 1 - flickerAmt
            ghostOpacity = flickerAmt * 0.7
            ghostBlur = flickerAmt * 4
            ghostTranslateY = flickerAmt * -8
            ghostScale = 1 + flickerAmt * 0.05
          } else {
            // Dematerialize: solid becomes ghost, then fades
            const ep = easeInCubic(exitProgress)
            solidOpacity = 1 - ep * 0.8
            solidBlur = ep * 8
            solidScale = 1 + ep * 0.1
            ghostOpacity = ep * 0.4
            ghostTranslateY = -ep * 30
            ghostBlur = ep * 10
          }

          return (
            <div key={ci} style={{ position: 'relative', display: 'inline-block', whiteSpace: 'pre' }}>
              {/* Ghost layer */}
              {ghostOpacity > 0.01 && (
                <span style={{
                  position: 'absolute',
                  top: ghostTranslateY,
                  left: 0,
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(44px, 11vw, 150px)',
                  fontWeight: 900,
                  color,
                  opacity: ghostOpacity,
                  filter: `blur(${ghostBlur}px)`,
                  transform: `scale(${ghostScale})`,
                  transformOrigin: 'center center',
                  whiteSpace: 'pre',
                  pointerEvents: 'none',
                }}>
                  {ch}
                </span>
              )}
              {/* Solid layer */}
              <span style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(44px, 11vw, 150px)',
                fontWeight: 900,
                color,
                opacity: solidOpacity,
                filter: solidBlur > 0.5 ? `blur(${solidBlur}px)` : 'none',
                transform: `scale(${solidScale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                whiteSpace: 'pre',
                textShadow: `0 2px 8px rgba(0,0,0,0.3)`,
                lineHeight: 1,
              }}>
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function GhostSolidComponent(props: MotionGraphicProps<GhostSolidConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ghost-solid',
  title: 'Kinetic Ghost Solid',
  description: 'Text haunts between translucent ghost form and opaque solid — letters drift up as ethereal wisps then snap into physical form with a pop; hold phase flickers between states',
  tags: ['kinetic', 'typography', 'ghost', 'solid', 'morph', 'transform', 'ethereal', 'materialize', 'flicker'],
  category: 'captions',
  component: GhostSolidComponent as any,
  defaultConfig: {
    words: ['HAUNT', 'GHOST', 'APPEAR', 'FADE'],
    colors: ['#B0C4DE', '#87CEEB', '#E0E8F0', '#C8D8E8'],
    bgColor: '#0D1117',
    cycleDuration: 1.5,
    ghostOpacity: 35,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HAUNT', 'GHOST', 'APPEAR', 'FADE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B0C4DE', '#87CEEB', '#E0E8F0', '#C8D8E8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1117', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'ghostOpacity', label: 'Ghost Opacity (%)', type: 'number', defaultValue: 35, min: 10, max: 60, group: 'Animation' },
  ],
})
