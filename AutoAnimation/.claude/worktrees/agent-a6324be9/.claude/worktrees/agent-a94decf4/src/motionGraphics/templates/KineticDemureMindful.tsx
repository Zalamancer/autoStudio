import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// 2025 TikTok Trend: Very Demure, Very Mindful
// Whisper-soft sage/blush tones. Words glide in from the right
// with extreme gentleness — never shout, always float. A small
// mindful dot breathes in and out next to the word during hold.
// Exit: dissolve gently leftward like a soft exhale.

interface DemureMindfulConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Soft expanding circles — like mindful breathing rings
    const rings = Array.from({ length: 3 }, (_, i) => {
      const phase = (time * 0.3 + i * 0.5) % 4
      const ringOpacity = phase < 2 ? (phase / 2) * 0.06 : ((4 - phase) / 2) * 0.06
      const ringScale = 0.3 + phase * 0.2

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '60%',
            paddingBottom: '60%',
            marginLeft: '-30%',
            marginTop: '-30%',
            borderRadius: '50%',
            border: '1px solid rgba(150,180,140,0.4)',
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#f0f5ee'
            ? 'linear-gradient(160deg, #f0f5ee 0%, #eaf0e8 50%, #f5ede8 100%)'
            : bgColor,
        }}
      >
        {rings}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateX = (1 - eased) * 30
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
    } else {
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      translateX = -eased * 20
    }

    // Mindful breathing dot
    const dotScale = phase === 'hold'
      ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.3
      : 1
    const dotOpacity = phase === 'hold' ? 0.6 : opacity * 0.4

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px)`,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: "'Optima', 'Palatino', 'Georgia', serif",
            fontSize: 'clamp(30px, 7.5vw, 105px)',
            fontWeight: 300,
            letterSpacing: 8,
            textTransform: 'lowercase',
            whiteSpace: 'nowrap',
            color,
            fontStyle: 'italic',
          }}
        >
          {word}
        </div>
        {/* Mindful breathing dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            transform: `scale(${dotScale})`,
            opacity: dotOpacity,
            flexShrink: 0,
          }}
        />
      </div>
    )
  },
}

function DemureMindfulComponent(props: MotionGraphicProps<DemureMindfulConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-demure-mindful',
  title: 'Kinetic Demure Mindful',
  description: '2025 TikTok very demure aesthetic — whisper-soft sage/blush, lowercase italic glide-in, breathing mindful dot',
  tags: ['kinetic', 'typography', 'demure', 'mindful', 'tiktok', 'soft', 'sage', 'trending', '2025'],
  category: 'captions',
  component: DemureMindfulComponent as any,
  defaultConfig: {
    words: ['present', 'grateful', 'gentle', 'still'],
    colors: ['#5a7a58', '#5a7a58', '#5a7a58', '#5a7a58'],
    bgColor: '#f0f5ee',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['present', 'grateful', 'gentle', 'still'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5a7a58', '#5a7a58', '#5a7a58', '#5a7a58'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f0f5ee', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
