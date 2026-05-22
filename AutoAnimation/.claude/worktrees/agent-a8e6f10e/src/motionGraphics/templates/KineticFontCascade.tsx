import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FontCascadeConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Ordered from most exotic/wild to the final settled serif
const FONT_STACK = [
  { family: "'Comic Sans MS', 'Chalkboard SE', cursive", weight: 700, label: 'Comic Sans' },
  { family: "'Impact', 'Arial Black', sans-serif", weight: 900, label: 'Impact' },
  { family: "'Courier New', monospace", weight: 700, label: 'Courier' },
  { family: "'Arial', 'Helvetica Neue', sans-serif", weight: 400, label: 'Arial' },
  { family: "'Georgia', serif", weight: 400, label: 'Georgia' },
  { family: "'Trebuchet MS', sans-serif", weight: 700, label: 'Trebuchet' },
  { family: "'Palatino Linotype', 'Book Antiqua', serif", weight: 400, label: 'Palatino' },
  { family: "'Playfair Display', 'Times New Roman', serif", weight: 900, label: 'Playfair' },
]

const SETTLE_FONT = FONT_STACK[FONT_STACK.length - 1]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
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
    const fontSize = Math.min(width * 0.16, height * 0.2, 140)
    const totalFonts = FONT_STACK.length

    // During enter: cycle rapidly through fonts
    // Each font occupies a segment of enterProgress 0..0.8
    // Final 20% of enter is the settle transition
    const cycleRange = 0.80
    const settleRange = 0.20

    let fontFamily: string
    let fontWeight: number | string
    let fontLabel: string
    let fontOpacity = 1
    let fontScale = 1
    let showLabel = false
    let labelOpacity = 0

    if (phase === 'enter') {
      if (enterProgress < cycleRange) {
        const cycleT = enterProgress / cycleRange
        const fontIndex = Math.floor(cycleT * (totalFonts - 1))
        const fontLocalT = (cycleT * (totalFonts - 1)) - fontIndex
        const font = FONT_STACK[Math.min(fontIndex, totalFonts - 2)]
        fontFamily = font.family
        fontWeight = font.weight
        fontLabel = font.label

        // Slight scale bounce between fonts
        fontScale = 0.92 + Math.sin(fontLocalT * Math.PI) * 0.12
        fontOpacity = 0.7 + fontLocalT * 0.3
        showLabel = true
        labelOpacity = Math.sin(fontLocalT * Math.PI) * 0.7
      } else {
        // Settle onto final font
        const t = easeOutCubic((enterProgress - cycleRange) / settleRange)
        fontFamily = SETTLE_FONT.family
        fontWeight = SETTLE_FONT.weight
        fontLabel = SETTLE_FONT.label
        fontScale = 1 + (1 - t) * 0.15
        fontOpacity = 1
        showLabel = true
        labelOpacity = t * 0.5
      }
    } else if (phase === 'hold') {
      fontFamily = SETTLE_FONT.family
      fontWeight = SETTLE_FONT.weight
      fontLabel = SETTLE_FONT.label
      fontScale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.01
      fontOpacity = 1
      showLabel = true
      labelOpacity = 0.35 - holdProgress * 0.3 // label fades out during hold
    } else {
      fontFamily = SETTLE_FONT.family
      fontWeight = SETTLE_FONT.weight
      fontLabel = SETTLE_FONT.label
      fontOpacity = 1 - exitProgress * exitProgress
      fontScale = 1 + exitProgress * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize,
            fontWeight,
            color,
            opacity: fontOpacity,
            transform: `scale(${fontScale})`,
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}
        >
          {word}
        </div>
        {showLabel && (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: Math.max(10, fontSize * 0.14),
              fontWeight: 400,
              color,
              opacity: labelOpacity,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: fontSize * 0.1,
              textAlign: 'center',
            }}
          >
            {fontLabel}
          </div>
        )}
      </div>
    )
  },
}

function FontCascadeComponent(props: MotionGraphicProps<FontCascadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-font-cascade',
  title: 'Font Cascade',
  description:
    'The word rapidly cycles through Comic Sans, Impact, Courier, Arial, Georgia and more before snapping to its final elegant typeface. Each font name is labelled beneath.',
  tags: ['kinetic', 'typography', 'fonts', 'cascade', 'typeface', 'cycling', 'design', 'specimen'],
  category: 'captions',
  component: FontCascadeComponent as any,
  defaultConfig: {
    words: ['DESIGN', 'STYLE', 'FONT', 'TYPE'],
    colors: ['#F8F8F2', '#FFD700', '#FF79C6', '#8BE9FD'],
    bgColor: '#1e1e2e',
    cycleDuration: 2.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DESIGN', 'STYLE', 'FONT', 'TYPE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F8F8F2', '#FFD700', '#FF79C6', '#8BE9FD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1e2e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 1.0,
      max: 6,
      group: 'Timing',
    },
  ],
})
