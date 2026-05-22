import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AccordionFoldConfig extends KineticBaseConfig {
  panels: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__accordionConfig ?? { panels: 5 }
    const panels = config.panels ?? 5
    const panelWidth = width / panels

    const panelElements = []
    for (let i = 0; i < panels; i++) {
      const stagger = i / panels
      let foldAngle = 90 // fully folded
      let panelOpacity = 0

      if (phase === 'enter') {
        const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.5) / 0.5))
        const eased = easeOutBack(delayed)
        foldAngle = 90 * (1 - eased)
        panelOpacity = delayed
      } else if (phase === 'hold') {
        foldAngle = 0
        panelOpacity = 1
      } else {
        const reverseStagger = (panels - 1 - i) / panels
        const delayed = Math.max(0, Math.min(1, (exitProgress - reverseStagger * 0.4) / 0.6))
        const eased = easeInCubic(delayed)
        foldAngle = 90 * eased
        panelOpacity = 1 - delayed
      }

      // Alternate fold direction for accordion effect
      const isEven = i % 2 === 0
      const originX = isEven ? '0% 50%' : '100% 50%'
      const rotateDir = isEven ? foldAngle : -foldAngle

      panelElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: i * panelWidth,
            top: 0,
            width: panelWidth + 1,
            height,
            perspective: 800,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: originX,
              transform: `rotateY(${rotateDir}deg)`,
              backfaceVisibility: 'hidden',
              opacity: panelOpacity,
            }}
          >
            {/* Clip the full word text to this panel's region */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: -i * panelWidth,
                width,
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: 800,
                  color,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                {word}
              </div>
            </div>
            {/* Panel fold shadow */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: isEven
                  ? `linear-gradient(90deg, rgba(0,0,0,${foldAngle * 0.003}), transparent)`
                  : `linear-gradient(270deg, rgba(0,0,0,${foldAngle * 0.003}), transparent)`,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>,
      )
    }

    return <>{panelElements}</>
  },
}

function AccordionFoldComponent(props: MotionGraphicProps<AccordionFoldConfig>) {
  ;(globalThis as any).__accordionConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-accordion-fold',
  title: 'Kinetic Accordion Fold',
  description: 'Text unfolds like an accordion with panels flipping open one by one from left to right',
  tags: ['kinetic', 'typography', 'accordion', 'fold', 'reveal', 'geometric', 'mechanical', '3d'],
  category: 'captions',
  component: AccordionFoldComponent as any,
  defaultConfig: {
    words: ['UNFOLD', 'OPEN', 'EXPAND', 'WIDE'],
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
    bgColor: '#141422',
    cycleDuration: 1.5,
    panels: 5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['UNFOLD', 'OPEN', 'EXPAND', 'WIDE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#141422', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'panels', label: 'Number of Panels', type: 'number', defaultValue: 5, min: 3, max: 12, group: 'Animation' },
  ],
})
