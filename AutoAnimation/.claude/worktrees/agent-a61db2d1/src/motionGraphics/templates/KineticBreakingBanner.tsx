import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BreakingBannerConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Pulsing urgency on the red banner
    const pulseAlpha = 0.85 + Math.sin(time * 6) * 0.15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top red BREAKING NEWS stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '18%',
            background: `rgba(204, 0, 0, ${pulseAlpha})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(10px, 3vw, 22px)',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 8,
              textTransform: 'uppercase',
            }}
          >
            BREAKING NEWS
          </span>
        </div>

        {/* Bottom crawl ticker bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '14%',
            background: '#1a1a1a',
            borderTop: '2px solid #CC0000',
            overflow: 'hidden',
          }}
        >
          {/* Scrolling crawl text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(8px, 2vw, 14px)',
              fontWeight: 600,
              color: '#CCCCCC',
              left: `${width - ((frame * 1.5) % (width * 3))}px`,
            }}
          >
            DEVELOPING STORY &#x2022; LIVE COVERAGE CONTINUES &#x2022; STAY TUNED FOR UPDATES &#x2022; MORE DETAILS COMING IN &#x2022; DEVELOPING STORY &#x2022; LIVE COVERAGE CONTINUES
          </div>
        </div>

        {/* Thin red accent line below top banner */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, #CC0000, #FF3333, #CC0000)',
          }}
        />

        {/* LIVE badge */}
        <div
          style={{
            position: 'absolute',
            top: '22%',
            right: '4%',
            background: '#CC0000',
            padding: '3px 10px',
            borderRadius: 2,
            opacity: Math.floor(time * 2) % 2 === 0 ? 1 : 0.6,
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 'clamp(7px, 1.8vw, 12px)',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 2,
            }}
          >
            &#x25CF; LIVE
          </span>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0

    if (phase === 'enter') {
      // Slide in from left like a CNN chyron
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      translateX = -width * 0.6 * (1 - eased)
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
    } else {
      // Slide out to right
      const eased = Math.pow(exitProgress, 2)
      translateX = width * 0.5 * eased
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%)`,
          opacity,
        }}
      >
        {/* Main headline text */}
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(32px, 10vw, 120px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            lineHeight: 1,
          }}
        >
          {word}
        </div>
        {/* Underline bar */}
        <div
          style={{
            marginTop: 6,
            height: 3,
            background: `linear-gradient(90deg, ${color}, transparent)`,
            borderRadius: 1,
          }}
        />
      </div>
    )
  },
}

function BreakingBannerComponent(props: MotionGraphicProps<BreakingBannerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-breaking-banner',
  title: 'Breaking Banner',
  description: 'CNN-style breaking news chyron with red urgency banner, LIVE badge, scrolling crawl ticker, and slide-in headline animation',
  tags: ['kinetic', 'typography', 'broadcast', 'news', 'breaking', 'banner', 'cnn', 'chyron', 'television'],
  category: 'captions',
  component: BreakingBannerComponent as any,
  defaultConfig: {
    words: ['BREAKING', 'ALERT', 'URGENT', 'LIVE'],
    colors: ['#FFFFFF', '#FFD700', '#FFFFFF', '#FF4444'],
    bgColor: '#0a0a14',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREAKING', 'ALERT', 'URGENT', 'LIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD700', '#FFFFFF', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
