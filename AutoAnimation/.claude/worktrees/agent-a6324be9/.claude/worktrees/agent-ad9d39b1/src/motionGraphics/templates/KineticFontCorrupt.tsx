import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FontCorruptConfig extends KineticBaseConfig {}

// Wrong-glyph substitution pool — visually similar but wrong characters
const WRONG_GLYPHS = 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿĀāĂăĄą'
const CORRUPT_GLYPHS = '░▒▓█▀▄■□▪▫▬▭▮▯▰▱◆◇○●◎◉★☆'

function dRand(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

function wrongGlyph(seed: number): string {
  return WRONG_GLYPHS[Math.floor(dRand(seed) * WRONG_GLYPHS.length)]
}

function corruptGlyph(seed: number): string {
  return CORRUPT_GLYPHS[Math.floor(dRand(seed * 1.7 + 99) * CORRUPT_GLYPHS.length)]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle horizontal scan artifacts
    const scanLines = Array.from({ length: 6 }, (_, i) => {
      const y = ((time * 18 + i * 37.3) % 110) - 5
      const vis = (time * 2.3 + i * 0.7) % 3 < 0.15
      return vis ? (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${y}%`,
            height: 1,
            background: 'rgba(255,200,0,0.18)',
            pointerEvents: 'none',
          }}
        />
      ) : null
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 3px)',
            pointerEvents: 'none',
          }}
        />
        {scanLines}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 211 + 73
    const chars = word.split('')

    if (phase === 'enter') {
      // Letters cycle through wrong glyphs then snap to correct form
      const rendered = chars.map((realChar, ci) => {
        // Each character resolves at staggered times
        const resolveAt = 0.15 + (ci / chars.length) * 0.7
        const resolved = enterProgress >= resolveAt

        if (resolved) {
          return (
            <span key={ci} style={{ color, transition: 'none' }}>
              {realChar}
            </span>
          )
        }

        // Before resolving: cycle through wrong font glyphs rapidly
        const wrongSeed = seed + ci * 37 + Math.floor(f / 2)
        const charProgress = enterProgress / resolveAt
        // Close to resolving — show wrong-but-similar glyph; far away — show block corrupt
        const glyph = charProgress > 0.6 ? wrongGlyph(wrongSeed) : corruptGlyph(wrongSeed * 0.5)
        const glyphColor = charProgress > 0.6 ? '#FFB800' : 'rgba(255,150,0,0.5)'

        return (
          <span key={ci} style={{ color: glyphColor }}>
            {glyph}
          </span>
        )
      })

      // Slight horizontal jitter during render corruption
      const jitterX = enterProgress < 0.85 ? (dRand(seed + Math.floor(f / 3)) - 0.5) * 6 * (1 - enterProgress) : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${jitterX}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            opacity: 0.3 + enterProgress * 0.7,
          }}
        >
          {rendered}
        </div>
      )
    }

    if (phase === 'hold') {
      // Clean text with rare single-character flickers to wrong glyphs
      const glitchWindow = holdProgress > 0.4 && holdProgress < 0.44
      const rendered = chars.map((ch, ci) => {
        if (glitchWindow && (ci + Math.floor(holdProgress * 200)) % chars.length === 0) {
          return (
            <span key={ci} style={{ color: '#FFB800' }}>
              {wrongGlyph(seed + ci + f)}
            </span>
          )
        }
        return <span key={ci} style={{ color }}>{ch}</span>
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textShadow: `0 0 8px ${color}50`,
          }}
        >
          {rendered}
        </div>
      )
    }

    // Exit: characters revert to wrong glyphs progressively from left
    const rendered = chars.map((realChar, ci) => {
      const corruptAt = (ci / chars.length) * 0.8
      const corrupted = exitProgress >= corruptAt
      if (corrupted) {
        const wrongSeed = seed + ci * 37 + Math.floor(f / 2)
        const glyphProgress = (exitProgress - corruptAt) / (1 - corruptAt + 0.001)
        const glyph = glyphProgress > 0.5 ? corruptGlyph(wrongSeed) : wrongGlyph(wrongSeed)
        return (
          <span key={ci} style={{ color: '#FFB800', opacity: 1 - glyphProgress * 0.7 }}>
            {glyph}
          </span>
        )
      }
      return <span key={ci} style={{ color }}>{realChar}</span>
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 9vw, 140px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          opacity: 1 - exitProgress * 0.5,
        }}
      >
        {rendered}
      </div>
    )
  },
}

function FontCorruptComponent(props: MotionGraphicProps<FontCorruptConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-font-corrupt',
  title: 'Kinetic Font Corrupt',
  description: 'Font rendering corruption: letters shift through wrong Unicode glyphs and block characters then snap to the correct form',
  tags: ['kinetic', 'typography', 'glitch', 'corrupt', 'font', 'unicode', 'software', 'digital'],
  category: 'captions',
  component: FontCorruptComponent as any,
  defaultConfig: {
    words: ['RENDER', 'ERROR', 'FONT', 'FAIL'],
    colors: ['#FFB800', '#FF8C00', '#FFD700', '#FFA500'],
    bgColor: '#0a0800',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RENDER', 'ERROR', 'FONT', 'FAIL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB800', '#FF8C00', '#FFD700', '#FFA500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0800', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
