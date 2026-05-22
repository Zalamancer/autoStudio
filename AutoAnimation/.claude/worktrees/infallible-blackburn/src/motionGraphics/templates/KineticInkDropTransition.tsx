import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InkDropConfig extends KineticBaseConfig {}

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

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let inkSize = 0 // percentage for radial gradient
    let textOpacity = 0
    let textScale = 1

    if (phase === 'enter') {
      const t = easeOutCubic(enterProgress)
      inkSize = t * 75 // 0% → 75% (covers viewport)
      textOpacity = enterProgress > 0.5 ? (enterProgress - 0.5) * 2 : 0
      textScale = 0.8 + easeOutCubic(Math.max(0, enterProgress - 0.5) * 2) * 0.2
    } else if (phase === 'hold') {
      inkSize = 75
      textOpacity = 1
      textScale = 1
      // Subtle breathe
      textScale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.015
    } else {
      const t = easeInCubic(exitProgress)
      inkSize = 75 * (1 - t) // shrinks back
      textOpacity = 1 - exitProgress * 2
      textScale = 1 - t * 0.2
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Ink drop circle */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, #1a1a2e ${inkSize}%, transparent ${inkSize + 0.5}%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Ink edge ring */}
        {inkSize > 2 && inkSize < 74 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, inkSize - 2)}%, rgba(100,100,180,0.3) ${inkSize}%, transparent ${inkSize + 1}%)`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: Math.max(0, textOpacity),
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function InkDropTransitionComponent(props: MotionGraphicProps<InkDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ink-drop-transition',
  title: 'Kinetic Ink Drop',
  description: 'Dark ink circle blooms from center to reveal each word, then contracts back into a dot on exit',
  tags: ['kinetic', 'typography', 'transition', 'ink', 'reveal', 'organic'],
  category: 'captions',
  component: InkDropTransitionComponent as any,
  defaultConfig: {
    words: ['INK', 'DROP', 'BLOT', 'MARK'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#e8e4dc',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INK', 'DROP', 'BLOT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8e4dc', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
