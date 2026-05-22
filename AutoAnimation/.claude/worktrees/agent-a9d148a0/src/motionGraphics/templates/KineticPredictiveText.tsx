import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PredictiveTextConfig extends KineticBaseConfig {
  wrongSuggestions: string[]
}

function dsin(seed: number): number {
  return Math.sin(seed * 127.1 + 311.7)
}

// Wrong suggestions cycle deterministically based on word index
const WRONG_BANKS: string[][] = [
  ['duck', 'shot', 'hit', 'sit'],
  ['cant', 'wont', 'dont', 'its'],
  ['their', 'there', 'they\'re', 'theer'],
  ['your', 'you\'re', 'yore', 'ur'],
  ['then', 'that', 'the', 'them'],
  ['on', 'in', 'in it', 'out'],
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // iOS/Android keyboard-style background
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Phone status bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 28,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
          }}
        >
          <div style={{ fontFamily: "'SF Pro Display', Arial, sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>9:41</div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {/* Signal bars */}
            {[4, 6, 8, 10].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
            ))}
            {/* Battery */}
            <div style={{ width: 18, height: 9, border: '1px solid rgba(255,255,255,0.5)', borderRadius: 2, marginLeft: 3, display: 'flex', alignItems: 'center', padding: '1px' }}>
              <div style={{ width: '75%', height: '100%', background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
            </div>
          </div>
        </div>
        {/* iMessage-style text input area at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: 'rgba(20,20,24,0.9)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 83 + 37
    const wrongBank = WRONG_BANKS[index % WRONG_BANKS.length]

    // How many wrong suggestions have cycled through based on holdProgress
    const suggestionCount = wrongBank.length
    // Each suggestion shown for 1/(suggestionCount+1) of hold phase
    const slotDuration = 0.7 / suggestionCount // use 70% of hold for cycling

    // Current wrong suggestion index (deterministic)
    const currentSuggestionIdx = Math.min(
      suggestionCount - 1,
      Math.floor((holdProgress / slotDuration))
    )
    const correctSelected = holdProgress > slotDuration * suggestionCount + 0.1

    // Which text is displayed: wrong suggestion cycling, then correct word
    let displayText = word
    let textColor = color
    let isWrong = false

    if (phase === 'enter') {
      // Text field typing animation
      displayText = word.slice(0, Math.ceil(enterProgress * word.length))
    } else if (phase === 'hold') {
      if (!correctSelected) {
        displayText = wrongBank[currentSuggestionIdx] ?? word
        textColor = '#FF6B6B'
        isWrong = true
      } else {
        displayText = word
        textColor = '#4CD964'
        isWrong = false
      }
    }

    // Suggestion bar items
    const suggestions = [
      wrongBank[Math.max(0, currentSuggestionIdx - 1)] ?? word,
      phase === 'hold' && !correctSelected ? wrongBank[currentSuggestionIdx] ?? word : word,
      wrongBank[Math.min(suggestionCount - 1, currentSuggestionIdx + 1)] ?? word,
    ]

    // Selected index in suggestion bar
    const selectedSuggIdx = correctSelected ? 2 : 1

    let opacity = 1
    if (phase === 'enter') opacity = 1
    else if (phase === 'exit') opacity = 1 - exitProgress

    // Cursor blink (deterministic: on for even 18-frame periods)
    const showCursor = phase === 'enter' && enterProgress < 0.98

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
          alignItems: 'center',
          gap: 0,
          width: '85%',
        }}
      >
        {/* Predictive text suggestion bar */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: 36,
            background: 'rgba(30,30,34,0.9)',
            borderRadius: '8px 8px 0 0',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            marginBottom: 0,
          }}
        >
          {suggestions.map((sug, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'SF Pro Display', Arial, sans-serif",
                fontSize: 14,
                color: i === selectedSuggIdx
                  ? (correctSelected ? '#4CD964' : '#FF6B6B')
                  : 'rgba(255,255,255,0.45)',
                fontWeight: i === selectedSuggIdx ? 600 : 400,
                background: i === selectedSuggIdx
                  ? (correctSelected ? 'rgba(76,217,100,0.12)' : 'rgba(255,107,107,0.12)')
                  : 'transparent',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                transition: 'none',
              }}
            >
              "{sug}"
            </div>
          ))}
        </div>

        {/* Text input field */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '10px 14px',
            fontFamily: "'SF Pro Display', Arial, sans-serif",
            fontSize: 'clamp(22px, 6vw, 72px)',
            fontWeight: 500,
            color: textColor,
            minHeight: 60,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span>{displayText}</span>
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: '#007AFF',
                marginLeft: 2,
                verticalAlign: 'middle',
              }}
            />
          )}
          {/* Checkmark when correct */}
          {correctSelected && (
            <span style={{ marginLeft: 8, fontSize: '0.6em', color: '#4CD964' }}>✓</span>
          )}
        </div>
      </div>
    )
  },
}

function PredictiveTextComponent(props: MotionGraphicProps<PredictiveTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-predictive-text',
  title: 'Kinetic Predictive Text',
  description: 'Phone predictive text: wrong autocomplete suggestions cycle in the suggestion bar (red), then the correct word is selected (green)',
  tags: ['kinetic', 'typography', 'glitch', 'predictive', 'autocomplete', 'phone', 'keyboard', 'cultural'],
  category: 'captions',
  component: PredictiveTextComponent as any,
  defaultConfig: {
    words: ['WHAT', 'ARE', 'YOU', 'DOING'],
    colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    bgColor: '#0a0a10',
    cycleDuration: 2.4,
    wrongSuggestions: ['duck', 'shot', 'hit', 'sit'],
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WHAT', 'ARE', 'YOU', 'DOING'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a10', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 1, max: 6, group: 'Timing' },
    { key: 'wrongSuggestions', label: 'Wrong Suggestions', type: 'text-array', defaultValue: ['duck', 'shot', 'hit', 'sit'], group: 'Animation' },
  ],
})
