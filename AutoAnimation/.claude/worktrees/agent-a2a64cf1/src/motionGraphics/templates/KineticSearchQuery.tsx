import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SearchQueryConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Browser chrome */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', padding: '0 2%', gap: '1%' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 'clamp(6px, 1vw, 10px)', height: 'clamp(6px, 1vw, 10px)', borderRadius: '50%', background: ['#FF5F57', '#FFBD2E', '#28C840'][i], opacity: 0.6 }} />
        ))}
        <div style={{ flex: 1, height: '55%', marginLeft: '2%', borderRadius: 6, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', padding: '0 2%' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(7px, 1.2vw, 11px)', color: 'rgba(0,0,0,0.25)' }}>search.example.com</div>
        </div>
      </div>
      {/* Logo placeholder */}
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3 }}>
        {['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#4285F4', '#EA4335'].map((c, i) => (
          <div key={i} style={{ width: 'clamp(14px, 3vw, 28px)', height: 'clamp(18px, 4vw, 36px)', borderRadius: 3, background: c, opacity: 0.15 }} />
        ))}
      </div>
      {/* Action buttons */}
      <div style={{ position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 'clamp(8px, 2vw, 16px)' }}>
        {['Search', 'Feeling Lucky'].map((label, i) => (
          <div key={i} style={{ padding: 'clamp(6px, 1vw, 10px) clamp(14px, 3vw, 24px)', borderRadius: 4, background: 'rgba(0,0,0,0.04)', fontFamily: "'Inter', sans-serif", fontSize: 'clamp(9px, 1.5vw, 13px)', color: 'rgba(0,0,0,0.25)' }}>{label}</div>
        ))}
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const totalChars = word.length
    let typedText = '', showCursor = true, barOpacity = 1, showSuggestions = false
    const sug = [word.toLowerCase(), word.toLowerCase() + ' meaning', word.toLowerCase() + ' examples', 'what is ' + word.toLowerCase()]

    if (phase === 'enter') {
      const n = Math.floor(enterProgress * (totalChars + 1))
      typedText = word.substring(0, Math.min(n, totalChars))
      showSuggestions = n >= 2
    } else if (phase === 'hold') {
      typedText = word
      showCursor = Math.sin(f * 0.12) > 0
      showSuggestions = holdProgress < 0.7
      if (holdProgress > 0.5 && holdProgress < 0.7) showCursor = false
    } else {
      typedText = word; showCursor = false; barOpacity = 1 - exitProgress
    }

    const selectAll = phase === 'hold' && holdProgress > 0.5 && holdProgress < 0.7

    return (
      <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', width: 'clamp(300px, 72vw, 580px)', opacity: barOpacity }}>
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: 'clamp(12px, 2.5vw, 20px) clamp(16px, 3vw, 26px)', background: '#FFF', borderRadius: showSuggestions ? '22px 22px 0 0' : 22, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', gap: 'clamp(10px, 2vw, 16px)' }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 'clamp(16px, 3vw, 24px)', height: 'clamp(16px, 3vw, 24px)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke="#9AA0A6" strokeWidth="2" />
            <line x1="16" y1="16" x2="21" y2="21" stroke="#9AA0A6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ flex: 1, position: 'relative', fontFamily: "'Inter', sans-serif", fontSize: 'clamp(18px, 4vw, 30px)', color: '#202124', whiteSpace: 'nowrap' }}>
            {selectAll && <div style={{ position: 'absolute', top: -2, bottom: -2, left: -2, width: `${typedText.length * 0.62}em`, background: color, opacity: 0.3, borderRadius: 2 }} />}
            <span style={{ position: 'relative', zIndex: 1 }}>{typedText}</span>
            {showCursor && <span style={{ display: 'inline-block', width: 2, height: '1.1em', background: color, marginLeft: 1, verticalAlign: 'text-bottom' }} />}
          </div>
          {typedText.length > 0 && phase !== 'exit' && (
            <div style={{ color: '#70757A', fontSize: 'clamp(14px, 2.5vw, 20px)', fontWeight: 300 }}>x</div>
          )}
        </div>
        {/* Suggestions */}
        {showSuggestions && (
          <div style={{ background: '#FFF', borderTop: '1px solid rgba(0,0,0,0.06)', borderRadius: '0 0 22px 22px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', paddingBottom: 6 }}>
            {sug.slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: 'clamp(6px, 1.2vw, 10px) clamp(16px, 3vw, 26px)', gap: 'clamp(10px, 2vw, 16px)' }}>
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14, flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="7" stroke="#9AA0A6" strokeWidth="2" />
                  <line x1="16" y1="16" x2="21" y2="21" stroke="#9AA0A6" strokeWidth="2" />
                </svg>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(13px, 2.5vw, 18px)', color: '#202124', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <strong>{typedText.toLowerCase()}</strong>{s.substring(typedText.length)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
}

function SearchQueryComponent(props: MotionGraphicProps<SearchQueryConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-search-query',
  title: 'Kinetic Search Query',
  description: 'Text typed into a search bar with blinking cursor, autocomplete suggestions dropdown, text selection highlight, and browser chrome',
  tags: ['kinetic', 'typography', 'search', 'google', 'internet', 'browser', 'query', 'typing'],
  category: 'captions',
  component: SearchQueryComponent as any,
  defaultConfig: {
    words: ['DESIGN', 'CODE', 'BUILD', 'SHIP'],
    colors: ['#4285F4', '#4285F4', '#4285F4', '#4285F4'],
    bgColor: '#FFFFFF',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DESIGN', 'CODE', 'BUILD', 'SHIP'], group: 'Content' },
    { key: 'colors', label: 'Accent Color', type: 'text-array', defaultValue: ['#4285F4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
