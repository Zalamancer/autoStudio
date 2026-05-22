import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BylineSlideConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Parse "By Author Name | Title / Role | Publication"
    const parts = word.split('|').map((s) => s.trim())
    const authorLine = parts[0] || word  // e.g. "By Sarah Chen"
    const role = parts[1] || ''           // e.g. "Senior Editor"
    const publication = parts[2] || ''    // e.g. "The Atlantic"

    let opacity = 0
    let x = 0
    let ruleWidth = 0
    let roleOpacity = 0
    let pubOpacity = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      // Author name slides in from left
      x = (1 - eased) * -28
      opacity = Math.min(1, enterProgress * 2.5)
      // Rule line extends right after name arrives
      ruleWidth = Math.max(0, (enterProgress - 0.35) / 0.65) * 100
      // Role and pub fade in last
      roleOpacity = Math.max(0, (enterProgress - 0.55) / 0.45)
      pubOpacity = Math.max(0, (enterProgress - 0.7) / 0.3)
    } else if (phase === 'hold') {
      x = 0
      opacity = 1
      ruleWidth = 100
      roleOpacity = 1
      pubOpacity = 1
    } else {
      // Slide out to the right
      const eased = exitProgress * exitProgress
      x = eased * 28
      opacity = 1 - exitProgress
      ruleWidth = (1 - exitProgress) * 100
      roleOpacity = 1 - exitProgress * 2
      pubOpacity = 1 - exitProgress * 2
    }

    const sans = "'Helvetica Neue', 'Arial', sans-serif"
    const serif = "'Playfair Display', 'Georgia', serif"

    // Extract "By " prefix if present for separate styling
    const hasByPrefix = authorLine.toLowerCase().startsWith('by ')
    const byPrefix = hasByPrefix ? authorLine.slice(0, 3) : ''
    const authorName = hasByPrefix ? authorLine.slice(3) : authorLine

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '8%',
          transform: `translateY(-50%) translateX(${x}px)`,
          opacity,
        }}
      >
        {/* "By" prefix — small caps, muted */}
        {byPrefix && (
          <div
            style={{
              fontFamily: sans,
              fontSize: 'clamp(8px, 1.6vw, 12px)',
              fontWeight: 300,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color,
              opacity: 0.45,
              marginBottom: 4,
            }}
          >
            {byPrefix.trim()}
          </div>
        )}

        {/* Author name — medium-weight serif */}
        <div
          style={{
            fontFamily: serif,
            fontSize: 'clamp(22px, 6vw, 80px)',
            fontWeight: 600,
            lineHeight: 1,
            color,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {authorName}
        </div>

        {/* Thin separator rule + role info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 12,
          }}
        >
          {/* Extending rule line */}
          <div
            style={{
              width: `${ruleWidth * 0.6}px`,
              maxWidth: 160,
              minWidth: 0,
              height: 1,
              background: color,
              opacity: 0.3,
              flexShrink: 0,
              transition: 'none',
            }}
          />

          {/* Role */}
          {role && (
            <div
              style={{
                fontFamily: sans,
                fontSize: 'clamp(8px, 1.8vw, 13px)',
                fontWeight: 300,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color,
                opacity: roleOpacity * 0.7,
                whiteSpace: 'nowrap',
              }}
            >
              {role}
            </div>
          )}

          {/* Bullet separator */}
          {role && publication && (
            <div
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: color,
                opacity: pubOpacity * 0.4,
                flexShrink: 0,
              }}
            />
          )}

          {/* Publication */}
          {publication && (
            <div
              style={{
                fontFamily: sans,
                fontSize: 'clamp(8px, 1.8vw, 13px)',
                fontWeight: 300,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color,
                opacity: pubOpacity * 0.45,
                whiteSpace: 'nowrap',
              }}
            >
              {publication}
            </div>
          )}
        </div>
      </div>
    )
  },
}

function KineticBylineSlideComponent(props: MotionGraphicProps<BylineSlideConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-byline-slide',
  title: 'Byline Slide',
  description: 'Author byline slides in from the left with a thin extending rule separator, role and publication metadata. Elegant editorial attribution.',
  tags: ['kinetic', 'typography', 'editorial', 'byline', 'author', 'magazine', 'attribution', 'serif'],
  category: 'captions',
  component: KineticBylineSlideComponent as any,
  defaultConfig: {
    words: [
      'By Sarah Chen | Senior Editor | The Atlantic',
      'By Marcus Webb | Staff Writer | New Yorker',
      'By Priya Sharma | Contributing Editor | TIME',
      'By James Okafor | Culture Critic | The Guardian',
    ],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#F4F1EC',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Bylines (By Name | Role | Publication)', type: 'text-array', defaultValue: ['By Sarah Chen | Senior Editor | The Atlantic'], group: 'Content' },
    { key: 'colors', label: 'Text Color', type: 'text-array', defaultValue: ['#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4F1EC', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 6, group: 'Timing' },
  ],
})
