import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Content Format: Ratio Response
// Twitter/X ratio energy. Clean white background, bold "ratio"
// reply energy. Words type in ultra-fast one character per frame,
// then a blue "reply" line shoots in from the left.
// Hold: word sits with a blinking text cursor. Exit: delete animation.

interface RatioResponseConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#ffffff' ? '#ffffff' : bgColor,
      }}
    >
      {/* Twitter-blue reply thread line */}
      <div
        style={{
          position: 'absolute',
          left: 'clamp(20px, 5%, 60px)',
          top: '10%',
          bottom: '10%',
          width: 2,
          background: 'rgba(29,161,242,0.15)',
          borderRadius: 1,
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let displayText = word
    let showCursor = false
    let opacity = 1
    let replyLineWidth = 0

    if (phase === 'enter') {
      // Fast type-in
      const charsVisible = Math.ceil(enterProgress * word.length)
      displayText = word.substring(0, charsVisible)
      showCursor = charsVisible < word.length
      replyLineWidth = enterProgress * 40
    } else if (phase === 'hold') {
      displayText = word
      showCursor = Math.floor(Date.now() / 530) % 2 === 0
      replyLineWidth = 40
    } else {
      // Delete backwards
      const charsRemaining = Math.ceil((1 - exitProgress) * word.length)
      displayText = word.substring(0, charsRemaining)
      showCursor = true
      opacity = 1 - exitProgress * 0.4
      replyLineWidth = (1 - exitProgress) * 40
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
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        {/* Reply indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: replyLineWidth,
              height: 2,
              background: '#1DA1F2',
              borderRadius: 1,
            }}
          />
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(9px, 2vw, 26px)',
              fontWeight: 400,
              color: '#1DA1F2',
              opacity: replyLineWidth > 5 ? 1 : 0,
            }}
          >
            replying
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(34px, 8.5vw, 120px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            color,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {displayText}
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: '0.85em',
                background: color,
                marginLeft: 2,
                borderRadius: 1,
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function RatioResponseComponent(props: MotionGraphicProps<RatioResponseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ratio-response',
  title: 'Kinetic Ratio Response',
  description: 'Twitter/X ratio format — fast type-in with blinking cursor, reply thread indicator, delete-backwards exit',
  tags: ['kinetic', 'typography', 'ratio', 'twitter', 'reply', 'content-format', 'social'],
  category: 'captions',
  component: RatioResponseComponent as any,
  defaultConfig: {
    words: ['RATIO', 'SKILL ISSUE', 'TOUCH GRASS', 'L + RATIO'],
    colors: ['#0f0f0f', '#0f0f0f', '#0f0f0f', '#0f0f0f'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RATIO', 'SKILL ISSUE', 'TOUCH GRASS', 'L + RATIO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0f0f0f', '#0f0f0f', '#0f0f0f', '#0f0f0f'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 4, group: 'Timing' },
  ],
})
