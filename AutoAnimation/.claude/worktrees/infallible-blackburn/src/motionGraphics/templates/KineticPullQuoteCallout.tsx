import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PullQuoteCalloutConfig extends KineticBaseConfig {
  accentColor: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Parse "Quote text | — Attribution" or just "Quote text"
    const parts = word.split('|').map((s) => s.trim())
    const quoteText = parts[0] || word
    const attribution = parts[1] || ''

    let opacity = 0
    let ruleLeftWidth = 0
    let ruleRightWidth = 0
    let quoteMarkScale = 0
    let textY = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      // Rule lines extend outward from center
      ruleLeftWidth = eased * 100
      ruleRightWidth = eased * 100
      // Quotation marks scale in first
      quoteMarkScale = Math.min(1, enterProgress * 3)
      // Body text fades up after
      opacity = Math.max(0, (enterProgress - 0.3) / 0.7)
      textY = (1 - opacity) * 12
    } else if (phase === 'hold') {
      opacity = 1
      ruleLeftWidth = 100
      ruleRightWidth = 100
      quoteMarkScale = 1
      textY = 0
    } else {
      // Fade and rules retract inward
      opacity = 1 - exitProgress
      ruleLeftWidth = (1 - exitProgress) * 100
      ruleRightWidth = (1 - exitProgress) * 100
      quoteMarkScale = 1 - exitProgress
      textY = exitProgress * -12
    }

    const accent = '#C9A84C'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${textY}px)`,
          width: '78%',
          opacity,
        }}
      >
        {/* Top rule line system */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 18,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: color,
              opacity: 0.25,
              transformOrigin: 'right center',
              transform: `scaleX(${ruleLeftWidth / 100})`,
            }}
          />
          {/* Oversized opening quotation mark */}
          <div
            style={{
              fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(36px, 9vw, 100px)',
              fontWeight: 700,
              lineHeight: 1,
              color: accent,
              opacity: quoteMarkScale,
              transform: `scale(${quoteMarkScale})`,
              transformOrigin: 'center center',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            &#x201C;
          </div>
          <div
            style={{
              flex: 1,
              height: 1,
              background: color,
              opacity: 0.25,
              transformOrigin: 'left center',
              transform: `scaleX(${ruleRightWidth / 100})`,
            }}
          />
        </div>

        {/* Pull quote body text — large italic serif */}
        <div
          style={{
            fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(15px, 3.8vw, 46px)',
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.32,
            color,
            textAlign: 'center',
            letterSpacing: '0.01em',
          }}
        >
          {quoteText}
        </div>

        {/* Bottom rule + closing mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 18,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: color,
              opacity: 0.25,
              transformOrigin: 'right center',
              transform: `scaleX(${ruleLeftWidth / 100})`,
            }}
          />
          <div
            style={{
              fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(36px, 9vw, 100px)',
              fontWeight: 700,
              lineHeight: 1,
              color: accent,
              opacity: quoteMarkScale,
              transform: `scale(${quoteMarkScale})`,
              transformOrigin: 'center center',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            &#x201D;
          </div>
          <div
            style={{
              flex: 1,
              height: 1,
              background: color,
              opacity: 0.25,
              transformOrigin: 'left center',
              transform: `scaleX(${ruleRightWidth / 100})`,
            }}
          />
        </div>

        {/* Attribution line */}
        {attribution && (
          <div
            style={{
              marginTop: 14,
              textAlign: 'center',
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(9px, 1.8vw, 14px)',
              fontWeight: 400,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color,
              opacity: opacity * 0.55,
            }}
          >
            {attribution}
          </div>
        )}
      </div>
    )
  },
}

function KineticPullQuoteCalloutComponent(props: MotionGraphicProps<PullQuoteCalloutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pull-quote-callout',
  title: 'Pull Quote Callout',
  description: 'Editorial pull quote with oversized serif quotation marks, rule lines extending outward, and italic body text. Classic magazine spread technique.',
  tags: ['kinetic', 'typography', 'editorial', 'pull-quote', 'magazine', 'serif', 'quote'],
  category: 'captions',
  component: KineticPullQuoteCalloutComponent as any,
  defaultConfig: {
    words: [
      '"The most dangerous risk is not taking one." | — Mark Zuckerberg',
      '"Design is not just what it looks like." | — Steve Jobs',
      '"The future belongs to those who prepare." | — Malcolm X',
      '"Simplicity is the ultimate sophistication." | — Leonardo da Vinci',
    ],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#F4F1EC',
    cycleDuration: 2.5,
    accentColor: '#C9A84C',
  },
  configSchema: [
    { key: 'words', label: 'Quotes (Text | — Attribution)', type: 'text-array', defaultValue: ['"The most dangerous risk is not taking one." | — Mark Zuckerberg'], group: 'Content' },
    { key: 'colors', label: 'Text Color', type: 'text-array', defaultValue: ['#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4F1EC', group: 'Style' },
    { key: 'accentColor', label: 'Accent (Quote Mark)', type: 'color', defaultValue: '#C9A84C', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 7, group: 'Timing' },
  ],
})
