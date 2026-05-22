import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalDotAccentConfig extends KineticBaseConfig {}

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
    let dotScale = 0
    let dotOpacity = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      translateY = (1 - eased) * 20
      // Dot pops in slightly after the text
      const dotEased = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
      dotScale = dotEased
      dotOpacity = dotEased
    } else if (phase === 'hold') {
      dotScale = 1
      dotOpacity = 1
    } else {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      translateY = -eased * 14
      dotScale = 1 - eased
      dotOpacity = 1 - eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY.toFixed(2)}px)`,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3em',
        }}
      >
        {/* Single accent dot to the left of the word */}
        <div
          style={{
            width: '0.18em',
            height: '0.18em',
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            transform: `scale(${dotScale.toFixed(3)})`,
            opacity: dotOpacity,
          }}
        />
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
      </div>
    )
  },
}

function MinimalDotAccentComponent(props: MotionGraphicProps<MinimalDotAccentConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-dot-accent',
  title: 'Minimal Dot Accent',
  description: 'A single accent dot pops in beside the word after it arrives — one punctuation element as pure typographic texture',
  tags: ['kinetic', 'typography', 'minimal', 'dot', 'accent', 'bullet', 'punctuation', 'clean'],
  category: 'captions',
  component: MinimalDotAccentComponent as any,
  defaultConfig: {
    words: ['POINT', 'FOCUS', 'MARK', 'NOTE'],
    colors: ['#1A1A1A', '#555555', '#1A1A1A', '#333333'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POINT', 'FOCUS', 'MARK', 'NOTE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#555555', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 6, group: 'Timing' },
  ],
})
