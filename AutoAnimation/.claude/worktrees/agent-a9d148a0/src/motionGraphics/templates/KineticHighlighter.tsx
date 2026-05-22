import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HighlighterConfig extends KineticBaseConfig {}

const highlightColors = ['rgba(255,235,59,0.45)', 'rgba(76,175,80,0.35)', 'rgba(33,150,243,0.35)', 'rgba(244,67,54,0.3)', 'rgba(156,39,176,0.3)']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle at 20% 30%, rgba(0,0,0,0.01) 0%, transparent 4%)',
            'radial-gradient(circle at 70% 60%, rgba(0,0,0,0.008) 0%, transparent 3%)',
            'radial-gradient(circle at 40% 80%, rgba(0,0,0,0.01) 0%, transparent 5%)',
          ].join(', '),
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 43 + 17
    const highlightColor = highlightColors[index % highlightColors.length]
    // Slight angle variation for organic feel
    const highlightAngle = Math.sin(seed * 1.7) * 2

    if (phase === 'enter') {
      // Highlighter sweeps left-to-right behind text
      const sweepPercent = enterProgress * 100
      const textOpacity = Math.min(1, enterProgress * 2)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Highlight sweep */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              bottom: '5%',
              left: '-4%',
              right: `${104 - sweepPercent}%`,
              background: highlightColor,
              transform: `rotate(${highlightAngle}deg)`,
              borderRadius: 2,
              // Uneven edges like real highlighter
              clipPath: 'polygon(0% 5%, 100% 0%, 100% 95%, 0% 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(40px, 10vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              opacity: textOpacity,
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      // Highlighted text sits with slight pulse
      const pulseOpacity = 0.85 + Math.sin(holdProgress * Math.PI * 2 + seed) * 0.1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '15%',
              bottom: '5%',
              left: '-4%',
              right: '-4%',
              background: highlightColor,
              transform: `rotate(${highlightAngle}deg)`,
              borderRadius: 2,
              clipPath: 'polygon(0% 5%, 100% 0%, 100% 95%, 0% 100%)',
              opacity: pulseOpacity,
            }}
          />
          <div
            style={{
              position: 'relative',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(40px, 10vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    // Exit: highlight fades, text fades
    const opacity = 1 - exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '15%',
            bottom: '5%',
            left: '-4%',
            right: '-4%',
            background: highlightColor,
            transform: `rotate(${highlightAngle}deg)`,
            borderRadius: 2,
            clipPath: 'polygon(0% 5%, 100% 0%, 100% 95%, 0% 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 130px)',
            fontWeight: 700,
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

function HighlighterComponent(props: MotionGraphicProps<HighlighterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-highlighter',
  title: 'Kinetic Highlighter',
  description: 'Animated highlighter marker sweeps behind text with semi-transparent colored highlight effect',
  tags: ['kinetic', 'typography', 'highlighter', 'marker', 'study', 'organic', 'textbook'],
  category: 'captions',
  component: HighlighterComponent as any,
  defaultConfig: {
    words: ['IMPORTANT', 'KEY', 'FOCUS', 'NOTE'],
    colors: ['#1A1A2E', '#2C3E50', '#1B2631', '#333333'],
    bgColor: '#FFFDF7',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['IMPORTANT', 'KEY', 'FOCUS', 'NOTE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A2E', '#2C3E50', '#1B2631', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFDF7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
