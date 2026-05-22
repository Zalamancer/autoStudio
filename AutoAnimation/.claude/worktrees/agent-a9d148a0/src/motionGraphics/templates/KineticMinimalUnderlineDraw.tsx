import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalUnderlineDrawConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    // The underline draws from left to right
    let underlineWidth = '100%'
    let underlineOpacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 2)
      translateY = (1 - eased) * 16
      // Underline draws in sync with text arrival
      underlineWidth = `${(eased * 100).toFixed(1)}%`
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      translateY = -eased * 12
      underlineOpacity = 1 - eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY.toFixed(2)}px)`,
          opacity,
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(36px, 8vw, 120px)',
              fontWeight: 300,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
          {/* Single 1px underline that draws left to right */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: 0,
              width: underlineWidth,
              height: 1,
              background: color,
              opacity: underlineOpacity,
            }}
          />
        </div>
      </div>
    )
  },
}

function MinimalUnderlineDrawComponent(props: MotionGraphicProps<MinimalUnderlineDrawConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-underline-draw',
  title: 'Minimal Underline Draw',
  description: 'A single 1px underline draws from left to right as the word arrives — one hairline accent element, zero decoration',
  tags: ['kinetic', 'typography', 'minimal', 'underline', 'draw', 'line', 'accent', 'editorial'],
  category: 'captions',
  component: MinimalUnderlineDrawComponent as any,
  defaultConfig: {
    words: ['DRAW', 'TRACE', 'MARK', 'LINE'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRAW', 'TRACE', 'MARK', 'LINE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
