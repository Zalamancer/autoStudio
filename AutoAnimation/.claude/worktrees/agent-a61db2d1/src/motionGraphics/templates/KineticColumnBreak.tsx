import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColumnBreakConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Column Break — the word is split into two halves occupying separate
 * columns. On enter, columns slide in from opposite sides. During hold,
 * the two halves sit in editorial two-column layout with a clear gutter.
 * On exit, the columns converge and merge into a unified center word.
 * A column rule (vertical divider) animates with the layout.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
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
    const mid = Math.ceil(word.length / 2)
    const col1 = word.slice(0, mid)
    const col2 = word.slice(mid)

    const fontSize = Math.min(width * 0.13, height * 0.16, 110)
    const gutterW = width * 0.06

    // Column centers
    const col1CenterX = width * 0.25
    const col2CenterX = width * 0.75
    const mergedCenterX = width / 2

    // Column rule
    const ruleX = width / 2

    let col1X: number, col2X: number
    let col1Opacity: number, col2Opacity: number
    let ruleOpacity: number
    let ruleH: number
    let mergedOpacity: number
    let showMerged: boolean = false
    let fontSizeActual: number = fontSize
    let fontWeight: number

    if (phase === 'enter') {
      if (enterProgress < 0.5) {
        // Columns slide in from sides
        const t = easeOutExpo(enterProgress / 0.5)
        col1X = col1CenterX - (1 - t) * width * 0.4
        col2X = col2CenterX + (1 - t) * width * 0.4
        col1Opacity = t
        col2Opacity = t * 0.85
        ruleOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.3) / 0.2)) * 0.25
        ruleH = enterProgress < 0.4 ? 0 : easeOutExpo((enterProgress - 0.4) / 0.1) * height * 0.5
        showMerged = false
        mergedOpacity = 0
        fontWeight = Math.round(300 + t * 400)
      } else {
        // Hold in column layout for remaining enter
        const t = (enterProgress - 0.5) / 0.5
        col1X = col1CenterX
        col2X = col2CenterX
        col1Opacity = 1
        col2Opacity = 0.85
        ruleOpacity = 0.25
        ruleH = height * 0.5
        showMerged = false
        mergedOpacity = 0
        fontWeight = 700
      }
    } else if (phase === 'hold') {
      col1X = col1CenterX
      col2X = col2CenterX
      col1Opacity = 1
      col2Opacity = 0.85
      // Column rule pulses subtly
      ruleOpacity = 0.2 + Math.sin(holdProgress * Math.PI * 4) * 0.05
      ruleH = height * 0.5
      showMerged = false
      mergedOpacity = 0
      fontWeight = 700
    } else {
      // Exit: columns converge, merge, single word fades out
      const t = easeInOutCubic(exitProgress)
      col1X = col1CenterX + (mergedCenterX - col1CenterX) * t
      col2X = col2CenterX - (col2CenterX - mergedCenterX) * t

      // As they get close, fade columns and show merged
      const closeT = Math.max(0, (t - 0.6) / 0.4)
      col1Opacity = 1 - closeT
      col2Opacity = (1 - closeT) * 0.85
      ruleOpacity = 0.25 * (1 - t)
      ruleH = height * 0.5 * (1 - t)
      showMerged = closeT > 0.3
      mergedOpacity = Math.max(0, closeT - 0.3) / 0.7 * (1 - exitProgress)
      fontWeight = 700
    }

    const col1FontSize = fontSizeActual * (col1.length <= 3 ? 1.1 : 1.0)
    const col2FontSize = fontSizeActual * (col2.length <= 3 ? 1.1 : 1.0)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Column rule */}
        <div
          style={{
            position: 'absolute',
            left: ruleX,
            top: '50%',
            width: 1,
            height: ruleH,
            background: color,
            opacity: ruleOpacity,
            transform: 'translate(-0.5px, -50%)',
          }}
        />

        {/* Column 1 */}
        {!showMerged && (
          <div
            style={{
              position: 'absolute',
              left: col1X,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: col1FontSize,
              fontWeight,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              color,
              opacity: col1Opacity,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              userSelect: 'none',
              textAlign: 'right',
            }}
          >
            {col1}
          </div>
        )}

        {/* Column 2 */}
        {!showMerged && (
          <div
            style={{
              position: 'absolute',
              left: col2X,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: col2FontSize,
              fontWeight,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              color,
              opacity: col2Opacity,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              userSelect: 'none',
              textAlign: 'left',
            }}
          >
            {col2}
          </div>
        )}

        {/* Merged single word (exit only) */}
        {showMerged && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: fontSizeActual,
              fontWeight,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              color,
              opacity: mergedOpacity,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {word}
          </div>
        )}

        {/* Column labels */}
        {phase === 'hold' && (
          <>
            <div
              style={{
                position: 'absolute',
                left: col1CenterX,
                bottom: '18%',
                transform: 'translateX(-50%)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color,
                opacity: 0.18,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              col. 1
            </div>
            <div
              style={{
                position: 'absolute',
                left: col2CenterX,
                bottom: '18%',
                transform: 'translateX(-50%)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color,
                opacity: 0.18,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              col. 2
            </div>
          </>
        )}
      </div>
    )
  },
}

function ColumnBreakComponent(props: MotionGraphicProps<ColumnBreakConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-column-break',
  title: 'Column Break',
  description:
    'A word is split into two halves in editorial two-column layout with a column rule. Columns slide in from opposite sides, hold in position, then converge and merge into a single centered word on exit.',
  tags: ['kinetic', 'typography', 'column', 'layout', 'composition', 'editorial', 'rule', 'grid', 'craft'],
  category: 'captions',
  component: ColumnBreakComponent as any,
  defaultConfig: {
    words: ['COLUMN', 'LAYOUT', 'DIVIDE', 'SPLIT'],
    colors: ['#f0f0f0', '#d0d0d0', '#f0f0f0', '#b8b8b8'],
    bgColor: '#1c1c1c',
    cycleDuration: 2.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COLUMN', 'LAYOUT', 'DIVIDE', 'SPLIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f0f0f0', '#d0d0d0', '#f0f0f0', '#b8b8b8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1c1c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.6, min: 1.5, max: 6, group: 'Timing' },
  ],
})
