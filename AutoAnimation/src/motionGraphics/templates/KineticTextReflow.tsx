import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TextReflowConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Text Reflow — a phrase starts broken across two lines (like a narrow column),
 * then "reflows" to a single wider line as if the column width was increased.
 * The word wraps intelligently at the midpoint. Each half slides, scales,
 * and repositions to simulate live text reflow in a typesetting system.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Two-column guide (visible during enter) */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          bottom: '20%',
          left: '50%',
          width: 1,
          background: 'rgba(255,255,255,0.04)',
          transform: 'translateX(-0.5px)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    // Split word at midpoint for two-line broken layout
    const mid = Math.ceil(word.length / 2)
    const line1 = word.slice(0, mid)
    const line2 = word.slice(mid)

    const singleFontSize = Math.min(width * 0.12, height * 0.15, 100)
    const twoLineFontSize = singleFontSize * 0.75

    const lineHeight = twoLineFontSize * 1.2
    const totalTwoLineH = lineHeight * 2

    // Positions for two-line layout
    const twoLineY1 = height / 2 - lineHeight * 0.6
    const twoLineY2 = height / 2 + lineHeight * 0.6

    // Position for single-line layout (centered)
    const singleY = height / 2

    let line1X: number, line1Y: number, line1Size: number, line1Opacity: number, line1Align: 'center' | 'left' | 'right'
    let line2X: number, line2Y: number, line2Size: number, line2Opacity: number, line2Align: 'center' | 'left' | 'right'
    let showLine2 = true

    if (phase === 'enter') {
      if (enterProgress < 0.35) {
        // Start: two-line layout appears (right-aligned line 1, left-aligned line 2)
        const t = enterProgress / 0.35
        const eased = easeOutCubic(t)
        line1X = width / 2
        line1Y = twoLineY1 - (1 - eased) * height * 0.2
        line1Size = twoLineFontSize
        line1Opacity = eased
        line1Align = 'right'

        line2X = width / 2
        line2Y = twoLineY2 + (1 - eased) * height * 0.15
        line2Size = twoLineFontSize
        line2Opacity = eased * 0.85
        line2Align = 'left'
        showLine2 = true
      } else {
        // Reflow: two lines merge into one
        const t = easeOutBack(Math.min(1, (enterProgress - 0.35) / 0.65))
        // Line 1 moves to single-line position and grows
        line1X = width / 2
        line1Y = twoLineY1 + (singleY - twoLineY1) * t
        line1Size = twoLineFontSize + (singleFontSize - twoLineFontSize) * t
        line1Opacity = 1
        line1Align = 'center' // morphs to center from right

        // Line 2 rises to merge with line 1, fades out
        line2X = width / 2
        line2Y = twoLineY2 - (twoLineY2 - twoLineY1) * t * 0.8
        line2Size = twoLineFontSize * (1 - t * 0.5)
        line2Opacity = 1 - t * t
        line2Align = 'left'
        showLine2 = line2Opacity > 0.05
      }
    } else if (phase === 'hold') {
      // Hold at single line — gentle breathing
      const breathe = Math.sin(holdProgress * Math.PI * 2) * 0.008
      line1X = width / 2
      line1Y = singleY
      line1Size = singleFontSize * (1 + breathe)
      line1Opacity = 1
      line1Align = 'center'
      showLine2 = false
      line2X = 0
      line2Y = 0
      line2Size = 0
      line2Opacity = 0
      line2Align = 'left' as 'center' | 'left' | 'right'
    } else {
      // Exit: single line breaks back to two lines, fades
      const t = easeInOutQuart(exitProgress)
      line1X = width / 2
      line1Y = singleY - t * (singleY - twoLineY1)
      line1Size = singleFontSize - (singleFontSize - twoLineFontSize) * t
      line1Opacity = 1 - exitProgress
      line1Align = 'right'

      line2X = width / 2
      line2Y = singleY + t * (twoLineY2 - singleY)
      line2Size = twoLineFontSize * t
      line2Opacity = t * (1 - exitProgress)
      line2Align = 'left'
      showLine2 = line2Opacity > 0.02
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Line 1 */}
        <div
          style={{
            position: 'absolute',
            left: line1X,
            top: line1Y,
            transform:
              line1Align === 'center'
                ? 'translate(-50%, -50%)'
                : line1Align === 'right'
                  ? 'translate(-100%, -50%)'
                  : 'translateY(-50%)',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: line1Size,
            fontWeight: 700,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color,
            opacity: line1Opacity,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {phase === 'hold' ? word : line1}
        </div>
        {/* Line 2 */}
        {showLine2 && (
          <div
            style={{
              position: 'absolute',
              left: line2X,
              top: line2Y,
              transform:
                line2Align === 'center'
                  ? 'translate(-50%, -50%)'
                  : line2Align === 'left'
                    ? 'translateY(-50%)'
                    : 'translate(-100%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: line2Size,
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color,
              opacity: line2Opacity,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {line2}
          </div>
        )}
      </div>
    )
  },
}

function TextReflowComponent(props: MotionGraphicProps<TextReflowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-text-reflow',
  title: 'Text Reflow',
  description:
    'A word appears broken across two lines (narrow column layout), then reflows into a single wider line as if the typesetting column width was expanded. Simulates live text reflow in editorial software.',
  tags: ['kinetic', 'typography', 'reflow', 'layout', 'composition', 'two-line', 'merge', 'editorial', 'craft'],
  category: 'captions',
  component: TextReflowComponent as any,
  defaultConfig: {
    words: ['REFLOW', 'LAYOUT', 'COLUMN', 'MERGE'],
    colors: ['#e8f4fd', '#b3d9f0', '#e8f4fd', '#8bc4e6'],
    bgColor: '#0a1929',
    cycleDuration: 2.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REFLOW', 'LAYOUT', 'COLUMN', 'MERGE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#e8f4fd', '#b3d9f0', '#e8f4fd', '#8bc4e6'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1929', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 1.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
