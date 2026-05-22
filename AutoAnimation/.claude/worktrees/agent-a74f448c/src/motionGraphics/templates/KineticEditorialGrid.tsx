import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EditorialGridConfig extends KineticBaseConfig {
  accentColor: string
}

// Each word is treated as a multi-column layout: "SECTION | Headline text | page 42"
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Draw three editorial column rule lines
    const isDark = bgColor === '#0A0A0A' || bgColor === '#111111' || bgColor === '#1A1A1A'
    const ruleColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Three column gutters at ~33% and ~66% */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            bottom: '8%',
            left: '33.33%',
            width: 1,
            background: ruleColor,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '8%',
            bottom: '8%',
            left: '66.66%',
            width: 1,
            background: ruleColor,
          }}
        />
        {/* Horizontal baseline grid lines */}
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            style={{
              position: 'absolute',
              top: `${pct}%`,
              left: '5%',
              right: '5%',
              height: 1,
              background: ruleColor,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const parts = word.split('|').map((s) => s.trim())
    const section = parts[0] || word
    const headline = parts[1] || ''
    const pageRef = parts[2] || ''

    // Grid snap: elements stagger in from their grid positions
    let opacity = 0
    let col1X = 0
    let col2X = 0
    let col3X = 0
    let ruleWidth = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 2.5)
      // Each column snaps in with a slight stagger
      col1X = (1 - Math.min(1, enterProgress * 3)) * -16
      col2X = (1 - Math.min(1, Math.max(0, enterProgress * 3 - 0.5))) * 16
      col3X = (1 - Math.min(1, Math.max(0, enterProgress * 3 - 1))) * -16
      ruleWidth = eased * 100
    } else if (phase === 'hold') {
      opacity = 1
      col1X = 0
      col2X = 0
      col3X = 0
      ruleWidth = 100
    } else {
      opacity = 1 - exitProgress
      col1X = exitProgress * -16
      col2X = exitProgress * 16
      col3X = exitProgress * -16
      ruleWidth = (1 - exitProgress) * 100
    }

    const accent = '#C9A84C'
    const sans = "'Helvetica Neue', 'Arial', sans-serif"
    const serif = "'Playfair Display', 'Georgia', serif"

    // Alternate grid layout by index (even: left-heavy, odd: right-heavy)
    const isAlt = index % 2 === 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '88%',
          opacity,
        }}
      >
        {/* Top horizontal rule */}
        <div
          style={{
            width: `${ruleWidth}%`,
            height: 1,
            background: color,
            opacity: 0.2,
            marginBottom: 16,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4%' }}>
          {/* Column 1: section label */}
          <div
            style={{
              flex: isAlt ? 2 : 1,
              transform: `translateX(${col1X}px)`,
            }}
          >
            <div
              style={{
                fontFamily: sans,
                fontSize: 'clamp(7px, 1.4vw, 11px)',
                fontWeight: 600,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: 6,
              }}
            >
              {section}
            </div>
            {!headline && (
              <div
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(22px, 5.5vw, 72px)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color,
                  letterSpacing: '-0.01em',
                }}
              >
                {word}
              </div>
            )}
          </div>

          {/* Column 2: headline */}
          {headline && (
            <div
              style={{
                flex: isAlt ? 1 : 2,
                transform: `translateX(${col2X}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(16px, 4vw, 52px)',
                  fontWeight: 700,
                  lineHeight: 1.08,
                  color,
                  letterSpacing: '-0.01em',
                }}
              >
                {headline}
              </div>
            </div>
          )}

          {/* Column 3: page reference */}
          {pageRef && (
            <div
              style={{
                flex: '0 0 auto',
                textAlign: 'right',
                transform: `translateX(${col3X}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: sans,
                  fontSize: 'clamp(7px, 1.4vw, 11px)',
                  fontWeight: 300,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color,
                  opacity: 0.45,
                  marginBottom: 4,
                }}
              >
                pg
              </div>
              <div
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(18px, 4vw, 48px)',
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                  opacity: 0.85,
                }}
              >
                {pageRef}
              </div>
            </div>
          )}
        </div>

        {/* Bottom rule */}
        <div
          style={{
            width: `${ruleWidth * 0.4}%`,
            height: 1,
            background: accent,
            opacity: 0.6,
            marginTop: 16,
          }}
        />
      </div>
    )
  },
}

function KineticEditorialGridComponent(props: MotionGraphicProps<EditorialGridConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-editorial-grid',
  title: 'Editorial Grid',
  description: 'Text snaps into a clean editorial multi-column grid with column rules and baseline grid. Section label, headline, and page reference layout.',
  tags: ['kinetic', 'typography', 'editorial', 'grid', 'magazine', 'columns', 'layout', 'serif'],
  category: 'captions',
  component: KineticEditorialGridComponent as any,
  defaultConfig: {
    words: [
      'FEATURE | Why Cities Are Shrinking | 28',
      'CULTURE | The Art of Slowness | 44',
      'SCIENCE | Ocean Intelligence | 62',
      'MONEY | The Invisible Recession | 80',
    ],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#F4F1EC',
    cycleDuration: 2,
    accentColor: '#C9A84C',
  },
  configSchema: [
    { key: 'words', label: 'Content (Section | Headline | Page)', type: 'text-array', defaultValue: ['FEATURE | Why Cities Are Shrinking | 28'], group: 'Content' },
    { key: 'colors', label: 'Text Color', type: 'text-array', defaultValue: ['#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4F1EC', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A84C', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 6, group: 'Timing' },
  ],
})
