import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AccordionStretchConfig extends KineticBaseConfig {
  folds: number
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeInQuart(t: number): number { return t * t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Accordion fold shadow lines */}
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${10 + i * 12}%`,
            height: 1,
            background: `rgba(255,255,255,${0.02 + Math.sin(time * 1.5 + i * 0.5) * 0.01})`,
          }} />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, height }: WordRenderProps) => {
    // The entire word compresses from full width to a single vertical line, then pops back out
    let scaleX = 1
    let scaleY = 1
    let opacity = 1

    // Fold lines — visual accordion pleats
    const foldCount = 6
    const foldLines: number[] = []
    for (let i = 1; i < foldCount; i++) {
      foldLines.push((i / foldCount) * 100)
    }

    if (phase === 'enter') {
      // Start as ultra-compressed (near zero width) then pop open with overshoot
      const compressed = 1 - easeOutBack(enterProgress)
      scaleX = Math.max(0.02, compressed * 0.02 + easeOutBack(enterProgress))
      // During compression, height exaggerates (bellows push up)
      scaleY = 1 + (1 - enterProgress) * 0.4
      opacity = Math.min(1, enterProgress * 4)
    } else if (phase === 'hold') {
      // Gentle breathing: very slight horizontal pulse like bellows
      const breathe = Math.sin(holdProgress * Math.PI * 4) * 0.025
      scaleX = 1 + breathe
      scaleY = 1 - breathe * 0.3
    } else {
      // Compress back to line, then slide out
      const ep = easeInQuart(exitProgress)
      scaleX = 1 - ep * 0.95
      scaleY = 1 + ep * 0.5
      opacity = exitProgress > 0.7 ? 1 - (exitProgress - 0.7) / 0.3 : 1
    }

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        transformOrigin: 'center center',
      }}>
        {/* Main text with accordion transform */}
        <div style={{
          transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
          transformOrigin: 'center center',
          opacity,
          position: 'relative',
        }}>
          {/* Fold shadow lines overlaid on the text */}
          {foldLines.map((pos, fi) => (
            <div key={fi} style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${pos}%`,
              width: 2,
              background: `rgba(0,0,0,${0.15 * (1 - Math.abs(scaleX - 1))})`,
              zIndex: 2,
              pointerEvents: 'none',
            }} />
          ))}
          <div style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textShadow: `2px 4px 12px rgba(0,0,0,0.4)`,
            lineHeight: 1,
          }}>
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function AccordionStretchComponent(props: MotionGraphicProps<AccordionStretchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-accordion-stretch',
  title: 'Kinetic Accordion Stretch',
  description: 'Text enters as a compressed vertical sliver then unfolds outward like accordion bellows, popping open with elastic overshoot and gentle breathing pulse while held',
  tags: ['kinetic', 'typography', 'accordion', 'elastic', 'compress', 'stretch', 'fold', 'deform'],
  category: 'captions',
  component: AccordionStretchComponent as any,
  defaultConfig: {
    words: ['OPEN', 'EXPAND', 'FOLD', 'PRESS'],
    colors: ['#E63946', '#A8DADC', '#457B9D', '#F1FAEE'],
    bgColor: '#1D3557',
    cycleDuration: 1.3,
    folds: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OPEN', 'EXPAND', 'FOLD', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E63946', '#A8DADC', '#457B9D', '#F1FAEE'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1D3557', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'folds', label: 'Fold Lines', type: 'number', defaultValue: 6, min: 2, max: 12, group: 'Animation' },
  ],
})
