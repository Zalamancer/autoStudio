import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CRTMonitorConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const scanY = (time * 40) % 100

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* CRT scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,0,0.03) 1px, rgba(0,255,0,0.03) 2px)',
            pointerEvents: 'none',
          }}
        />
        {/* Moving scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 3,
            background: 'rgba(0,255,0,0.08)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
        {/* Phosphor vignette / screen curvature */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Screen edge glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(0,255,0,0.04)',
            borderRadius: 16,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    // Character-by-character reveal like old terminals
    const totalChars = word.length
    let displayText = ''
    let showCursor = true
    let opacity = 1

    if (phase === 'enter') {
      // Type characters one by one
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))
      displayText = word.substring(0, Math.min(charsToShow, totalChars))
      showCursor = true
    } else if (phase === 'hold') {
      displayText = word
      // Blinking cursor after text
      showCursor = Math.sin(f * 0.15) > 0
    } else {
      displayText = word
      opacity = 1 - exitProgress
      showCursor = false
    }

    // Prompt prefix
    const prompt = '> '

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(36px, 9vw, 130px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          textShadow: `0 0 8px ${color}, 0 0 20px ${color}`,
          letterSpacing: 4,
        }}
      >
        <span style={{ opacity: 0.5 }}>{prompt}</span>
        {displayText}
        {showCursor && (
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(12px, 3vw, 30px)',
              height: 'clamp(30px, 7vw, 100px)',
              background: color,
              marginLeft: 4,
              verticalAlign: 'middle',
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        )}
      </div>
    )
  },
}

function CRTMonitorComponent(props: MotionGraphicProps<CRTMonitorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crt-monitor',
  title: 'Kinetic CRT Monitor',
  description: 'CRT green phosphor terminal with character-by-character typing, scan lines, screen curvature, and blinking cursor',
  tags: ['kinetic', 'typography', 'crt', 'terminal', 'retro', 'hacker', 'green'],
  category: 'captions',
  component: CRTMonitorComponent as any,
  defaultConfig: {
    words: ['BOOT', 'INIT', 'LOAD', 'READY'],
    colors: ['#00ff00', '#00ff00', '#00ff00', '#00ff00'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOOT', 'INIT', 'LOAD', 'READY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00ff00', '#00ff00', '#00ff00', '#00ff00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
