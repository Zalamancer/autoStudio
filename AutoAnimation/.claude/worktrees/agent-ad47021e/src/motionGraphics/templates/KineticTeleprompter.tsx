import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TeleprompterConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Simulated scrolling lines of text in the background
    const lineCount = 14
    const scrollOffset = (time * 30) % (lineCount * 28)

    const bgLines = [
      'The senator confirmed today that new legislation',
      'will be introduced in the coming weeks regarding',
      'infrastructure spending across multiple states.',
      'Officials have stated the proposal includes both',
      'urban development and rural broadband expansion.',
      'The committee expects to hold hearings starting',
      'next month with testimonies from key stakeholders.',
      'In related news, the budget office released its',
      'latest projections showing moderate growth ahead.',
      'Critics of the plan argue that the timeline is',
      'overly ambitious given current fiscal constraints.',
      'Meanwhile, bipartisan support appears to be growing',
      'for a scaled-back version of the original proposal.',
      'More details are expected after the recess period.',
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Scrolling text lines */}
        {bgLines.map((line, i) => {
          const y = i * 28 - scrollOffset + height * 0.1
          const distFromCenter = Math.abs(y - height * 0.45)
          const maxDist = height * 0.45
          const alpha = Math.max(0.03, 0.15 - (distFromCenter / maxDist) * 0.12)

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '8%',
                right: '8%',
                top: y,
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(9px, 2vw, 15px)',
                color: `rgba(255, 255, 255, ${alpha})`,
                lineHeight: '28px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {line}
            </div>
          )
        })}

        {/* Center highlight bar - the "readable line" indicator */}
        <div
          style={{
            position: 'absolute',
            top: '43%',
            left: 0,
            right: 0,
            height: '14%',
            background: 'linear-gradient(180deg, transparent, rgba(255,50,50,0.06), transparent)',
            borderTop: '1px solid rgba(255, 80, 80, 0.2)',
            borderBottom: '1px solid rgba(255, 80, 80, 0.2)',
            pointerEvents: 'none',
          }}
        />

        {/* Left margin indicator arrows */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '3%',
            transform: 'translateY(-50%)',
            fontSize: 'clamp(10px, 2vw, 16px)',
            color: 'rgba(255, 80, 80, 0.4)',
          }}
        >
          &#x25B6;
        </div>
        <div
          style={{
            position: 'absolute',
            top: '48%',
            right: '3%',
            transform: 'translateY(-50%)',
            fontSize: 'clamp(10px, 2vw, 16px)',
            color: 'rgba(255, 80, 80, 0.4)',
          }}
        >
          &#x25C0;
        </div>

        {/* Speed indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '4%',
            right: '4%',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(7px, 1.3vw, 10px)',
            color: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          SPD: {Math.floor(12 + Math.sin(time * 0.5) * 3)} WPM
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      // Scroll up into the highlight zone
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      translateY = 40 * (1 - eased)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.9 + eased * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle micro-sway in the center
      translateY = Math.sin(holdProgress * Math.PI * 2) * 1
    } else {
      // Scroll up out of the highlight zone
      const eased = Math.pow(exitProgress, 2)
      translateY = -50 * eased
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.05
    }

    // Split word into characters for per-char highlight effect during hold
    const chars = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '47%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            lineHeight: 1.1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {phase === 'hold'
            ? chars.map((ch, ci) => {
                // Word-by-word style highlight moving across characters
                const charProgress = ci / Math.max(1, chars.length - 1)
                const isHighlighted = holdProgress >= charProgress
                return (
                  <span
                    key={ci}
                    style={{
                      color: isHighlighted ? color : `${color}88`,
                      textShadow: isHighlighted ? `0 0 12px ${color}40` : 'none',
                      transition: 'none',
                    }}
                  >
                    {ch}
                  </span>
                )
              })
            : <span style={{ color, textShadow: `0 0 8px ${color}20` }}>{word}</span>
          }
        </div>
      </div>
    )
  },
}

function TeleprompterComponent(props: MotionGraphicProps<TeleprompterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-teleprompter',
  title: 'Teleprompter',
  description: 'Broadcast teleprompter with scrolling background script, center-highlight readable line, per-character reveal, and studio prompter feel',
  tags: ['kinetic', 'typography', 'broadcast', 'teleprompter', 'scroll', 'studio', 'television', 'presenter'],
  category: 'captions',
  component: TeleprompterComponent as any,
  defaultConfig: {
    words: ['TONIGHT', 'SPECIAL', 'REPORT', 'LIVE'],
    colors: ['#FFFFFF', '#F0F0F0', '#FFFFFF', '#FF6666'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TONIGHT', 'SPECIAL', 'REPORT', 'LIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0F0F0', '#FFFFFF', '#FF6666'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
