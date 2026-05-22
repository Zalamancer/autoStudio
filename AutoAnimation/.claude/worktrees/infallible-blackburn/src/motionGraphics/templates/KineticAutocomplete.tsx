import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AutocompleteConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

function generateSuggestions(word: string, seed: number): string[] {
  const prefixes = ['how to ', 'best ', 'why is ', 'what is ', 'top 10 ']
  const suffixes = [' near me', ' tutorial', ' meaning', ' review', ' tips']
  const results: string[] = []
  for (let i = 0; i < 4; i++) {
    const pIdx = Math.floor(pseudoRandom(seed + i * 31) * prefixes.length)
    const sIdx = Math.floor(pseudoRandom(seed + i * 47) * suffixes.length)
    if (i === 0) {
      results.push(word)
    } else {
      results.push(prefixes[pIdx] + word.toLowerCase() + suffixes[sIdx])
    }
  }
  return results
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 211 + 67
    const suggestions = generateSuggestions(word, seed)

    // Typing progress for the search input
    let typedChars = 0
    let showDropdown = false
    let selectedIdx = -1
    let opacity = 1
    let dropdownOpacity = 1

    if (phase === 'enter') {
      // Type out the word letter by letter
      typedChars = Math.floor(enterProgress * (word.length + 1))
      // Show dropdown after 40% typed
      showDropdown = enterProgress > 0.4
      dropdownOpacity = showDropdown ? Math.min(1, (enterProgress - 0.4) / 0.2) : 0
      selectedIdx = -1
    } else if (phase === 'hold') {
      typedChars = word.length
      showDropdown = true
      // Cycle through highlighted suggestions
      const cyclePos = holdProgress * (suggestions.length + 0.5)
      selectedIdx = Math.min(Math.floor(cyclePos), suggestions.length - 1)
      dropdownOpacity = 1
    } else {
      typedChars = word.length
      showDropdown = exitProgress < 0.5
      selectedIdx = 0
      opacity = 1 - exitProgress
      dropdownOpacity = 1 - exitProgress * 2
    }

    const displayText = word.substring(0, Math.min(typedChars, word.length))
    const showCursor = phase !== 'exit' && Math.sin(f * 0.15) > -0.2

    return (
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(280px, 70vw, 560px)',
          opacity,
        }}
      >
        {/* Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'clamp(10px, 2vw, 18px) clamp(14px, 3vw, 22px)',
            background: '#FFFFFF',
            borderRadius: showDropdown && dropdownOpacity > 0.5
              ? 'clamp(12px, 2.5vw, 22px) clamp(12px, 2.5vw, 22px) 0 0'
              : 'clamp(12px, 2.5vw, 22px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)',
            gap: 'clamp(8px, 1.5vw, 14px)',
          }}
        >
          {/* Search icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              width: 'clamp(16px, 3vw, 24px)',
              height: 'clamp(16px, 3vw, 24px)',
              flexShrink: 0,
            }}
          >
            <circle cx="11" cy="11" r="7" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
            <line x1="16" y1="16" x2="21" y2="21" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Input text */}
          <div
            style={{
              flex: 1,
              fontFamily: "'Inter', '-apple-system', sans-serif",
              fontSize: 'clamp(18px, 4vw, 32px)',
              fontWeight: 400,
              color: '#1A1A1A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {displayText}
            {showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(2px, 0.4vw, 3px)',
                  height: '1em',
                  background: color,
                  marginLeft: 1,
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
            {/* Ghost autocomplete text */}
            {phase === 'enter' && typedChars > 0 && typedChars < word.length && (
              <span style={{ color: 'rgba(0,0,0,0.15)' }}>
                {word.substring(typedChars)}
              </span>
            )}
          </div>
        </div>

        {/* Dropdown suggestions */}
        {showDropdown && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '0 0 clamp(12px, 2.5vw, 22px) clamp(12px, 2.5vw, 22px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              opacity: Math.max(0, Math.min(1, dropdownOpacity)),
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {suggestions.map((suggestion, i) => {
              const isSelected = i === selectedIdx
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'clamp(8px, 1.5vw, 14px) clamp(14px, 3vw, 22px)',
                    gap: 'clamp(8px, 1.5vw, 14px)',
                    background: isSelected ? `${color}12` : 'transparent',
                    borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                  }}
                >
                  {/* Search icon mini */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{
                      width: 'clamp(12px, 2vw, 16px)',
                      height: 'clamp(12px, 2vw, 16px)',
                      flexShrink: 0,
                      opacity: 0.3,
                    }}
                  >
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 'clamp(13px, 2.5vw, 20px)',
                      color: isSelected ? color : '#4A4A4A',
                      fontWeight: isSelected ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {suggestion}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  },
}

function AutocompleteComponent(props: MotionGraphicProps<AutocompleteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-autocomplete',
  title: 'Kinetic Autocomplete',
  description: 'Text appearing as autocomplete suggestions in a search dropdown with typing animation, ghost text, and highlighted selection cycling',
  tags: ['kinetic', 'typography', 'autocomplete', 'search', 'internet', 'dropdown', 'ui'],
  category: 'captions',
  component: AutocompleteComponent as any,
  defaultConfig: {
    words: ['REACT', 'DESIGN', 'CREATE', 'BUILD'],
    colors: ['#4285F4', '#4285F4', '#4285F4', '#4285F4'],
    bgColor: '#F0F2F5',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REACT', 'DESIGN', 'CREATE', 'BUILD'], group: 'Content' },
    { key: 'colors', label: 'Accent Color', type: 'text-array', defaultValue: ['#4285F4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F2F5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
