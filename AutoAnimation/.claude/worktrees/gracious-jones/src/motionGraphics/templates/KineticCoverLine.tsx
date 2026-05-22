import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CoverLineConfig extends KineticBaseConfig {
  accentColor: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Top barcode strip — magazine cover trim */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: '#D42B2B',
        }}
      />
      {/* Cover date/issue line — upper right */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          right: '6%',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(7px, 1.4vw, 12px)',
          fontWeight: 400,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: bgColor === '#FAFAFA' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
        }}
      >
        Vol. 12 · No. 4 · Spring 2026
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    // Parse as "HEADLINE | subtext" — subtext optional
    const parts = word.split('|').map((s) => s.trim())
    const headline = parts[0] || word
    const subtext = parts[1] || ''

    // Animate: color block wipes in from left, then headline punches in
    let blockWidth = 0
    let headlineOpacity = 0
    let headlineX = 0
    let subtextOpacity = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      blockWidth = eased * 100
      headlineOpacity = Math.max(0, (enterProgress - 0.35) / 0.65)
      headlineX = (1 - Math.min(1, (enterProgress - 0.35) / 0.65)) * -20
      subtextOpacity = Math.max(0, (enterProgress - 0.6) / 0.4)
    } else if (phase === 'hold') {
      blockWidth = 100
      headlineOpacity = 1
      headlineX = 0
      subtextOpacity = 1
    } else {
      // Collapse block to left on exit
      const eased = exitProgress * exitProgress
      blockWidth = (1 - eased) * 100
      headlineOpacity = 1 - exitProgress * 2
      subtextOpacity = 1 - exitProgress * 3
    }

    // Determine if a cover number label is shown (e.g. "ALSO:" or just the index)
    const coverLabel = `INSIDE ${String(index + 1).padStart(2, '0')}`

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          left: '6%',
          right: '6%',
        }}
      >
        {/* Small cover label above headline */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(7px, 1.5vw, 11px)',
            fontWeight: 600,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#D42B2B',
            opacity: subtextOpacity,
            marginBottom: 8,
          }}
        >
          {coverLabel}
        </div>

        {/* Color block behind headline */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: -8,
              bottom: 0,
              width: `calc(${blockWidth}% + 16px)`,
              background: '#D42B2B',
              overflow: 'hidden',
            }}
          />
          {/* Headline text — large bold serif */}
          <div
            style={{
              position: 'relative',
              fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(32px, 9vw, 120px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              color: '#FAFAFA',
              lineHeight: 0.95,
              whiteSpace: 'nowrap',
              opacity: headlineOpacity,
              transform: `translateX(${headlineX}px)`,
              padding: '4px 0',
            }}
          >
            {headline}
          </div>
        </div>

        {/* Subtext below */}
        {subtext && (
          <div
            style={{
              marginTop: 10,
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(10px, 2.2vw, 18px)',
              fontWeight: 300,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color,
              opacity: subtextOpacity * 0.85,
              whiteSpace: 'nowrap',
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    )
  },
}

function KineticCoverLineComponent(props: MotionGraphicProps<CoverLineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cover-line',
  title: 'Cover Line',
  description: 'Magazine cover headline with dramatic color-block wipe and bold serif type. Mimics print magazine cover-line layout.',
  tags: ['kinetic', 'typography', 'magazine', 'editorial', 'cover', 'headline', 'serif'],
  category: 'captions',
  component: KineticCoverLineComponent as any,
  defaultConfig: {
    words: [
      'POWER | The women reshaping the world',
      'BEAUTY | Skin-first approach to glow',
      'CULTURE | How Gen Z is changing art',
      'MONEY | 12 ways to build wealth now',
    ],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#FAFAFA',
    cycleDuration: 2.2,
    accentColor: '#D42B2B',
  },
  configSchema: [
    { key: 'words', label: 'Cover Lines (Headline | Subtext)', type: 'text-array', defaultValue: ['POWER | The women reshaping the world', 'BEAUTY | Skin-first approach to glow'], group: 'Content' },
    { key: 'colors', label: 'Text Color', type: 'text-array', defaultValue: ['#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D42B2B', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 6, group: 'Timing' },
  ],
})
