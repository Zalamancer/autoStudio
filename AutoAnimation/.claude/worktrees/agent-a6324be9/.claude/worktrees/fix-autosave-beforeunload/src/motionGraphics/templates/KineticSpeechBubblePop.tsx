import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpeechBubblePopConfig extends KineticBaseConfig {}

// Speech bubble that pops into frame from nothing — classic comic dialogue balloon
// The bubble tail points down-left, bold black outline, white fill, text inside
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Halftone dot pattern on background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1.5px, transparent 1.5px)',
          backgroundSize: '10px 10px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 37 + 11
    // Pop physics: overshoot spring
    let scale = 1
    let opacity = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 4)
      // Spring overshoot: grows past 1 then settles
      const t = enterProgress
      if (t < 0.5) {
        scale = t / 0.5 * 1.3
      } else if (t < 0.75) {
        scale = 1.3 - ((t - 0.5) / 0.25) * 0.35
      } else if (t < 0.9) {
        scale = 0.95 + ((t - 0.75) / 0.15) * 0.08
      } else {
        scale = 1.03 - ((t - 0.9) / 0.1) * 0.03
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      // Quick pop out — shrink and vanish
      scale = 1 - exitProgress * 1.0
      opacity = 1 - exitProgress * 2
    }

    // Slight tilt per word for liveliness
    const tilt = ((seed % 3) - 1) * 3

    // Bubble dimensions grow with scale
    const bubbleW = 340
    const bubbleH = 120
    const tailSize = 28

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -58%) scale(${scale}) rotate(${tilt}deg)`,
          opacity: Math.max(0, opacity),
          transformOrigin: 'center bottom',
        }}
      >
        {/* Bubble body — white oval with thick black border */}
        <div
          style={{
            position: 'relative',
            width: `${bubbleW}px`,
            height: `${bubbleH}px`,
            background: '#FFFFFF',
            borderRadius: '50%',
            border: '4px solid #000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '4px 4px 0 #000000',
          }}
        >
          {/* Text inside bubble */}
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(22px, 5vw, 72px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '1.5px #000000',
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              userSelect: 'none',
            }}
          >
            {word}
          </div>
        </div>
        {/* Speech bubble tail — pointing down-left */}
        <div
          style={{
            position: 'absolute',
            bottom: `-${tailSize - 4}px`,
            left: `${bubbleW * 0.28}px`,
            width: 0,
            height: 0,
            borderLeft: `${tailSize * 0.6}px solid transparent`,
            borderRight: `${tailSize * 0.4}px solid transparent`,
            borderTop: `${tailSize}px solid #000000`,
          }}
        />
        {/* Tail white fill (slightly inset) */}
        <div
          style={{
            position: 'absolute',
            bottom: `-${tailSize - 8}px`,
            left: `${bubbleW * 0.28 + 2}px`,
            width: 0,
            height: 0,
            borderLeft: `${tailSize * 0.5}px solid transparent`,
            borderRight: `${tailSize * 0.3}px solid transparent`,
            borderTop: `${tailSize - 4}px solid #FFFFFF`,
          }}
        />
      </div>
    )
  },
}

function SpeechBubblePopComponent(props: MotionGraphicProps<SpeechBubblePopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-speech-bubble-pop',
  title: 'Kinetic Speech Bubble Pop',
  description: 'Classic comic book speech bubble pops in with spring overshoot, white oval with thick black border and tail, text inside the balloon',
  tags: ['kinetic', 'typography', 'comic', 'speech-bubble', 'balloon', 'dialogue', 'pop', 'cartoon'],
  category: 'captions',
  component: SpeechBubblePopComponent as any,
  defaultConfig: {
    words: ['HEY!', 'WAIT!', 'WOW!', 'COOL!'],
    colors: ['#FF0000', '#0000FF', '#CC0099', '#FF6600'],
    bgColor: '#FFD700',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEY!', 'WAIT!', 'WOW!', 'COOL!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF0000', '#0000FF', '#CC0099', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.4, max: 5, group: 'Timing' },
  ],
})
