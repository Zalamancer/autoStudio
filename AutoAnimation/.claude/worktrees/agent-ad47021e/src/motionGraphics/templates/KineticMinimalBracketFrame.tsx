import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalBracketFrameConfig extends KineticBaseConfig {}

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
    // Brackets slide in from outside — left from left, right from right
    let bracketOffset = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      translateY = (1 - eased) * 12
      bracketOffset = (1 - eased) * 24
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      translateY = -eased * 10
      bracketOffset = eased * 20
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
          gap: '0.2em',
        }}
      >
        {/* Left bracket */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(28px, 6vw, 90px)',
            fontWeight: 100,
            color,
            transform: `translateX(${-bracketOffset}px)`,
            lineHeight: 1,
            letterSpacing: 0,
          }}
        >
          [
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
          }}
        >
          {word}
        </div>
        {/* Right bracket */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(28px, 6vw, 90px)',
            fontWeight: 100,
            color,
            transform: `translateX(${bracketOffset}px)`,
            lineHeight: 1,
            letterSpacing: 0,
          }}
        >
          ]
        </div>
      </div>
    )
  },
}

function MinimalBracketFrameComponent(props: MotionGraphicProps<MinimalBracketFrameConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-bracket-frame',
  title: 'Minimal Bracket Frame',
  description: 'Square brackets slide in from the sides to frame the word — one pair of punctuation marks as structural texture, nothing else',
  tags: ['kinetic', 'typography', 'minimal', 'bracket', 'frame', 'punctuation', 'editorial', 'structure'],
  category: 'captions',
  component: MinimalBracketFrameComponent as any,
  defaultConfig: {
    words: ['FRAME', 'CONTAIN', 'DEFINE', 'SCOPE'],
    colors: ['#1A1A1A', '#333333', '#1A1A1A', '#222222'],
    bgColor: '#F8F8F8',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FRAME', 'CONTAIN', 'DEFINE', 'SCOPE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#333333', '#1A1A1A', '#222222'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F8F8F8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
