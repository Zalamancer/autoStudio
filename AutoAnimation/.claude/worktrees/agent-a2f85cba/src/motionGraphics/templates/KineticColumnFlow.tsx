import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColumnFlowConfig extends KineticBaseConfig {
  columnCount: number
}

// Generates stable "lorem" body lines without Math.random
const FILLER_LINES = [
  'The light through the window',
  'moves like an argument',
  'no one bothered to finish.',
  'Pages turn. Cities breathe.',
  'Facts accumulate like debt.',
  'A sentence earns its place.',
  'The margin holds no answers.',
  'Print is a form of faith.',
  'Every column finds its end.',
  'The reader does the rest.',
  'Ink meets paper. Truth waits.',
  'Whitespace is not empty.',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const isDark = bgColor !== '#FAFAFA' && bgColor !== '#F4F1EC' && bgColor !== '#FFFFFF'
    const ruleColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Column gutter rule — single center column rule */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            bottom: '10%',
            left: '50%',
            width: 1,
            background: ruleColor,
          }}
        />
        {/* Top horizontal rule — column header baseline */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '6%',
            right: '6%',
            height: 1,
            background: ruleColor,
          }}
        />
        {/* Bottom rule */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '6%',
            right: '6%',
            height: 1,
            background: ruleColor,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Parse: "Headline | col1 content | col2 content" or just "Headline | body text"
    const parts = word.split('|').map((s) => s.trim())
    const headline = parts[0] || word
    const col1Text = parts[1] || ''
    const col2Text = parts[2] || ''

    // Flow animation: text streams in from top of each column
    let headlineOpacity = 0
    let headlineY = 0
    let col1ClipTop = 100   // percentage clipped from top (100 = fully hidden, 0 = fully shown)
    let col2ClipTop = 100
    let ruleOpacity = 0
    let exitOpacity = 1

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      headlineOpacity = Math.min(1, enterProgress * 3)
      headlineY = (1 - Math.min(1, enterProgress * 3)) * -10
      ruleOpacity = eased
      // Col 1 flows in first, col 2 slightly after
      col1ClipTop = Math.max(0, 100 - eased * 100 * 1.2)
      col2ClipTop = Math.max(0, 100 - Math.max(0, (enterProgress - 0.15) / 0.85) * 100 * 1.2)
    } else if (phase === 'hold') {
      headlineOpacity = 1
      headlineY = 0
      col1ClipTop = 0
      col2ClipTop = 0
      ruleOpacity = 1
      exitOpacity = 1
    } else {
      exitOpacity = 1 - exitProgress
      headlineOpacity = 1 - exitProgress * 2
      headlineY = exitProgress * -8
      col1ClipTop = exitProgress * 100
      col2ClipTop = Math.max(0, (exitProgress - 0.1) * 100 / 0.9)
      ruleOpacity = 1 - exitProgress
    }

    const sans = "'Helvetica Neue', 'Arial', sans-serif"
    const serif = "'Playfair Display', 'Georgia', serif"
    const accent = '#C9A84C'

    // Use filler lines to simulate column body text
    const fillerA = FILLER_LINES.slice(index % 4, (index % 4) + 5)
    const fillerB = FILLER_LINES.slice((index + 5) % 8, ((index + 5) % 8) + 5)

    return (
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '6%',
          right: '6%',
          bottom: '10%',
          opacity: exitOpacity,
        }}
      >
        {/* Column header: section label + headline */}
        <div
          style={{
            paddingTop: 14,
            paddingBottom: 12,
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontSize: 'clamp(7px, 1.3vw, 10px)',
              fontWeight: 600,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: 6,
            }}
          >
            Feature
          </div>
          <div
            style={{
              fontFamily: serif,
              fontSize: 'clamp(18px, 4.5vw, 60px)',
              fontWeight: 700,
              lineHeight: 1.05,
              color,
              letterSpacing: '-0.01em',
            }}
          >
            {headline}
          </div>
        </div>

        {/* Thin rule under headline */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: color,
            opacity: ruleOpacity * 0.18,
            marginBottom: 14,
          }}
        />

        {/* Two-column body layout */}
        <div
          style={{
            display: 'flex',
            gap: '4%',
            height: 'calc(100% - 8em)',
          }}
        >
          {/* Column 1 */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              clipPath: `inset(${col1ClipTop}% 0 0 0)`,
            }}
          >
            {col1Text ? (
              <div
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(10px, 2.2vw, 22px)',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color,
                  letterSpacing: '0.01em',
                }}
              >
                {col1Text}
              </div>
            ) : (
              <div>
                {fillerA.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: sans,
                      fontSize: 'clamp(8px, 1.7vw, 14px)',
                      fontWeight: 300,
                      lineHeight: 1.75,
                      color,
                      opacity: 0.55,
                      letterSpacing: '0.005em',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2 */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              clipPath: `inset(${col2ClipTop}% 0 0 0)`,
            }}
          >
            {col2Text ? (
              <div
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(10px, 2.2vw, 22px)',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color,
                  letterSpacing: '0.01em',
                }}
              >
                {col2Text}
              </div>
            ) : (
              <div>
                {fillerB.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: sans,
                      fontSize: 'clamp(8px, 1.7vw, 14px)',
                      fontWeight: 300,
                      lineHeight: 1.75,
                      color,
                      opacity: 0.55,
                      letterSpacing: '0.005em',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
}

function KineticColumnFlowComponent(props: MotionGraphicProps<ColumnFlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-column-flow',
  title: 'Column Flow',
  description: 'Text flows between magazine columns with animated text wrap reveal. Simulates a full two-column editorial spread with headline, section label, and staggered column body text.',
  tags: ['kinetic', 'typography', 'editorial', 'columns', 'magazine', 'layout', 'flow', 'longform'],
  category: 'captions',
  component: KineticColumnFlowComponent as any,
  defaultConfig: {
    words: [
      'The Architecture of Grief',
      'What Money Cannot Buy',
      'The Last Analog Summer',
      'How Silence Became Rare',
    ],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#F4F1EC',
    cycleDuration: 2.5,
    columnCount: 2,
  },
  configSchema: [
    { key: 'words', label: 'Headlines (or Headline | Col1 | Col2)', type: 'text-array', defaultValue: ['The Architecture of Grief', 'What Money Cannot Buy'], group: 'Content' },
    { key: 'colors', label: 'Text Color', type: 'text-array', defaultValue: ['#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4F1EC', group: 'Style' },
    { key: 'columnCount', label: 'Columns', type: 'number', defaultValue: 2, min: 1, max: 3, group: 'Layout' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 7, group: 'Timing' },
  ],
})
