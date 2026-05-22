import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TypewriterConfig extends KineticBaseConfig {
  cursorBlink: boolean
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* CRT scanlines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px)',
          pointerEvents: 'none',
        }}
      />
      {/* Phosphor vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Letter-by-letter reveal
    const totalChars = word.length
    const visibleChars = phase === 'exit'
      ? totalChars
      : Math.floor(enterProgress * (totalChars + 1))

    const displayText = phase === 'exit'
      ? word
      : word.substring(0, visibleChars)

    const showCursor = phase !== 'exit' || exitProgress < 0.5
    const cursorBlink = Math.sin(Date.now() * 0.01) > 0

    let opacity = 1
    let translateY = 0
    if (phase === 'exit') {
      opacity = 1 - exitProgress
      translateY = exitProgress * -20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(32px, 8vw, 120px)',
          fontWeight: 700,
          letterSpacing: 4,
          color,
          textShadow: `0 0 8px ${color}, 0 0 20px ${color}`,
          whiteSpace: 'nowrap',
        }}
      >
        {displayText}
        {showCursor && (
          <span style={{ opacity: cursorBlink ? 1 : 0 }}>_</span>
        )}
      </div>
    )
  },
}

function TypewriterComponent(props: MotionGraphicProps<TypewriterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-typewriter-cascade',
  title: 'Kinetic Typewriter Cascade',
  description: 'Monospace typewriter letter-by-letter typing with CRT scanlines and phosphor glow',
  tags: ['kinetic', 'typography', 'typewriter', 'retro', 'crt'],
  category: 'captions',
  component: TypewriterComponent as any,
  defaultConfig: {
    words: ['LOADING', 'SYSTEM', 'READY', 'GO'],
    colors: ['#33FF33', '#33FF33', '#33FF33', '#FFFF00'],
    bgColor: '#0d1117',
    cycleDuration: 1.5,
    cursorBlink: true,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOADING', 'SYSTEM', 'READY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#33FF33'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1117', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
