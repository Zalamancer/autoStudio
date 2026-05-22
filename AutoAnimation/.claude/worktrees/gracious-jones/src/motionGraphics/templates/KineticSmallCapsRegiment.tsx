import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SmallCapsRegimentConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/**
 * Small Caps Regiment — displays the word simultaneously in two sizes:
 * actual uppercase letters at cap height, and small caps (uppercase rendered
 * at x-height ~75% of caps). During enter, cap-height letters march down
 * to meet the small cap baseline. On hold, the two registers breathe
 * independently — caps float slightly while small caps stay grounded.
 * This is genuinely typographic: Small Caps are a designed font feature
 * (here simulated with CSS font-variant and size manipulation).
 *
 * The animation reveals the grid structure of traditional book typography:
 * cap line, x-height, and the relationship between them.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Typographic grid lines */}
      {[
        { top: '36%', label: 'cap line', opacity: 0.07 },
        { top: '50%', label: 'x-line', opacity: 0.07 },
        { top: '72%', label: 'baseline', opacity: 0.10 },
      ].map(({ top, opacity }) => (
        <div
          key={top}
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top,
            height: 1,
            background: `rgba(100,100,100,${opacity})`,
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const capSize = Math.min(width * 0.12, height * 0.15, 106)
    const smallCapSize = capSize * 0.72 // x-height approximation
    const capY = height * 0.36 // cap line
    const baseline = height * 0.72 // baseline

    let opacity: number
    let capOffset: number = 0 // additional Y offset for caps row
    let smallCapOpacity: number = 1
    let rowGap: number = 1 // multiplier for spacing between rows

    if (phase === 'enter') {
      const t = easeOutQuart(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      // Caps descend from above, small caps rise from baseline
      capOffset = (1 - t) * (-capSize * 1.5)
      rowGap = t
    } else if (phase === 'hold') {
      opacity = 1
      // Independent floating: caps bob gently
      capOffset = Math.sin(holdProgress * Math.PI * 2) * capSize * 0.04
      rowGap = 1
    } else {
      const t = easeInQuad(exitProgress)
      opacity = 1 - t
    }

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Full caps row at cap height */}
        <div
          style={{
            position: 'absolute',
            top: capY + capOffset,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: capSize,
            fontWeight: 400,
            color,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            opacity: 0.4,
          }}
        >
          {word}
        </div>

        {/* Small caps row at x-height — this is the "regiment" */}
        <div
          style={{
            position: 'absolute',
            top: baseline,
            left: '50%',
            transform: 'translateX(-50%) translateY(-100%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: smallCapSize,
            fontWeight: 700,
            color,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontVariant: 'small-caps',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            opacity: smallCapOpacity,
          }}
        >
          {word}
        </div>

        {/* Annotation */}
        <div
          style={{
            position: 'absolute',
            right: '5%',
            top: capY + capOffset + capSize * 0.1,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: 0.2,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          caps
        </div>
        <div
          style={{
            position: 'absolute',
            right: '5%',
            top: baseline - smallCapSize * 1.1,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: 0.25,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          smcp
        </div>
      </div>
    )
  },
}

function SmallCapsRegimentComponent(props: MotionGraphicProps<SmallCapsRegimentConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-small-caps-regiment',
  title: 'Small Caps Regiment',
  description:
    'Displays the word in both full caps and small caps simultaneously, aligned to their proper typographic lines (cap line, x-height, baseline). Caps descend on enter while small caps rise. A tutorial in classical type hierarchy.',
  tags: ['kinetic', 'typography', 'small-caps', 'case', 'hierarchy', 'grid', 'serif', 'classical', 'craft'],
  category: 'captions',
  component: SmallCapsRegimentComponent as any,
  defaultConfig: {
    words: ['ROMAN', 'ORDER', 'RULES', 'CRAFT'],
    colors: ['#1c1c1c', '#3a3a3a', '#1c1c1c', '#3a3a3a'],
    bgColor: '#f4f1ec',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ROMAN', 'ORDER', 'RULES', 'CRAFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1c1c1c', '#3a3a3a', '#1c1c1c', '#3a3a3a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f4f1ec', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.5, max: 6, group: 'Timing' },
  ],
})
