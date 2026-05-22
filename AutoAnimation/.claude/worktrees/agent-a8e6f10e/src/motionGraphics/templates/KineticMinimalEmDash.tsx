import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalEmDashConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    // Em-dash slides in from right just before the word
    let dashTranslateX = 0
    let dashOpacity = 0
    let textTranslateX = 0

    if (phase === 'enter') {
      const eased = easeOutQuart(enterProgress)
      opacity = eased
      // Dash arrives first, slightly earlier
      const dashEased = easeOutQuart(Math.min(enterProgress * 1.5, 1))
      dashTranslateX = (1 - dashEased) * 30
      dashOpacity = dashEased
      textTranslateX = (1 - eased) * 20
    } else if (phase === 'hold') {
      dashOpacity = 1
    } else {
      const eased = easeInQuart(exitProgress)
      opacity = 1 - eased
      dashOpacity = 1 - eased
      dashTranslateX = -eased * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.15em',
        }}
      >
        {/* Em-dash divider */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(28px, 6vw, 90px)',
            fontWeight: 100,
            color,
            transform: `translateX(${dashTranslateX.toFixed(2)}px)`,
            opacity: dashOpacity,
            letterSpacing: 0,
            lineHeight: 1,
          }}
        >
          —
        </div>
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            transform: `translateX(${textTranslateX.toFixed(2)}px)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MinimalEmDashComponent(props: MotionGraphicProps<MinimalEmDashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-em-dash',
  title: 'Minimal Em Dash',
  description: 'An em-dash slides in just before the word as a typographic divider — single punctuation mark as the entire accent element',
  tags: ['kinetic', 'typography', 'minimal', 'em-dash', 'divider', 'punctuation', 'editorial', 'prefix'],
  category: 'captions',
  component: MinimalEmDashComponent as any,
  defaultConfig: {
    words: ['TRUTH', 'CLARITY', 'FOCUS', 'INTENT'],
    colors: ['#1A1A1A', '#2A2A2A', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRUTH', 'CLARITY', 'FOCUS', 'INTENT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#2A2A2A', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
