import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Ancient glyphs used as "undecoded" stand-ins — Unicode Egyptological / geometric symbols
const GLYPHS = ['𓂀', '𓃭', '𓅓', '𓆙', '𓇯', '𓈖', '𓉐', '𓊃', '𓋴', '𓌳', '𓍿', '𓎛', '𓏏', '𓐍', '𓀭', '𓁹']

function scrambleChar(char: string, progress: number, seed: number): string {
  // As progress rises from 0→1 each character "resolves" from a glyph into the real letter
  const threshold = (seed % 7) / 7 // staggered per character
  if (progress > threshold + 0.25) return char
  return GLYPHS[(seed * 3 + Math.floor(progress * 12)) % GLYPHS.length]
}

interface HieroglyphDecodeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        // Subtle papyrus-grain texture via repeating radial gradient
        backgroundImage:
          'repeating-radial-gradient(ellipse 120px 60px at 30% 40%, rgba(255,255,255,0.04) 0%, transparent 70%), ' +
          'repeating-radial-gradient(ellipse 80px 120px at 70% 60%, rgba(0,0,0,0.04) 0%, transparent 70%)',
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Enter: characters decode one-by-one left→right
    // Hold: fully legible
    // Exit: re-scramble right→left and dissolve

    let displayOpacity = 1
    let scale = 1

    if (phase === 'enter') {
      displayOpacity = Math.min(1, enterProgress * 2)
      scale = 0.92 + enterProgress * 0.08
    } else if (phase === 'exit') {
      displayOpacity = 1 - exitProgress * 0.85
      scale = 1 + exitProgress * 0.04
    }

    const chars = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})`,
          opacity: displayOpacity,
          display: 'flex',
          gap: '0.04em',
        }}
      >
        {chars.map((char, i) => {
          let displayed = char
          let charOpacity = 1
          let charColor = color

          if (phase === 'enter') {
            // Each character resolves at a staggered point in enterProgress
            const charThreshold = i / chars.length
            const localProgress = Math.max(0, (enterProgress - charThreshold) / (1 - charThreshold + 0.001))
            displayed = scrambleChar(char, Math.min(1, localProgress * 1.6), i * 7 + 3)
            charOpacity = Math.min(1, 0.3 + localProgress * 0.7)
            // Unresolved chars tinted toward golden-amber
            if (displayed !== char) charColor = '#c8a84b'
          } else if (phase === 'exit') {
            // Re-scramble from right side
            const charThreshold = (chars.length - 1 - i) / chars.length
            const localProgress = Math.max(0, (exitProgress - charThreshold) / (1 - charThreshold + 0.001))
            if (localProgress > 0.3) {
              displayed = scrambleChar(char, 1 - localProgress, (i * 5 + 11))
              if (displayed !== char) charColor = '#c8a84b'
            }
          }

          return (
            <span
              key={i}
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(32px, 7vw, 108px)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: charColor,
                opacity: charOpacity,
                display: 'inline-block',
                transition: 'color 0.05s',
                lineHeight: 1,
              }}
            >
              {displayed}
            </span>
          )
        })}
      </div>
    )
  },
}

function HieroglyphDecodeComponent(props: MotionGraphicProps<HieroglyphDecodeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hieroglyph-decode',
  title: 'Hieroglyph Decode',
  description:
    'Each letter is hidden behind an ancient hieroglyph that resolves character-by-character left-to-right, as if a scholar is translating a cartouche in real time.',
  tags: ['kinetic', 'typography', 'archaeology', 'ancient', 'hieroglyph', 'decode', 'mystery'],
  category: 'captions',
  component: HieroglyphDecodeComponent as any,
  defaultConfig: {
    words: ['ANCIENT', 'DECODE', 'REVEAL', 'SACRED'],
    colors: ['#1a1208', '#2c1a04', '#1a1208', '#2c1a04'],
    bgColor: '#e8d5a3',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ANCIENT', 'DECODE', 'REVEAL', 'SACRED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1208', '#2c1a04', '#1a1208', '#2c1a04'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8d5a3', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.8, max: 5, group: 'Timing' },
  ],
})
