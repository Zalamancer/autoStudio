import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EncodingErrorConfig extends KineticBaseConfig {}

// Mojibake: UTF-8 bytes misread as Latin-1 / CP1252 / ISO-8859 garbage
const MOJIBAKE_SEQUENCES = [
  'Ã¢â‚¬â„¢',
  'Ã‚Â©',
  'â€œ',
  'â€™',
  'Ã¯Â¿Â½',
  'Ã¢â‚¬Å"',
  'Ã¢â‚¬â€',
  'å½¢',
  'è§£',
  'ç‰©',
  'æ•°',
  'ã‚¢',
  'ãƒ­',
  'ï¿½ï¿½',
]
const LATIN1_GARBAGE = 'ÃÂ¡¢£¤¥¦§¨©ªÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ'

function dRand(seed: number): number {
  return Math.abs(Math.sin(seed * 91.3 + 199.1) * 38471.2913) % 1
}

function mojibakeChar(seed: number): string {
  const pool = LATIN1_GARBAGE
  return pool[Math.floor(dRand(seed) * pool.length)]
}

function mojibakeSeq(seed: number): string {
  return MOJIBAKE_SEQUENCES[Math.floor(dRand(seed * 2.3) * MOJIBAKE_SEQUENCES.length)]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Encoding error header bar
    const headerText = `Content-Type: text/html; charset=ISO-8859-1`
    const errText = `UnicodeDecodeError: 'utf-8' codec can't decode byte 0x${Math.floor(dRand(time) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()}`

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top status bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '6px 12px',
            background: 'rgba(255,80,0,0.15)',
            borderBottom: '1px solid rgba(255,80,0,0.3)',
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(255,80,0,0.7)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {headerText}
        </div>
        {/* Bottom error line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '6px 12px',
            background: 'rgba(255,0,0,0.08)',
            borderTop: '1px solid rgba(255,0,0,0.2)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,100,100,0.6)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {errText}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 157 + 83
    const chars = word.split('')

    if (phase === 'enter') {
      // Each char starts as multi-byte mojibake then collapses to correct character
      const rendered = chars.map((realChar, ci) => {
        const resolveAt = 0.1 + (ci / chars.length) * 0.75
        const resolved = enterProgress >= resolveAt

        if (resolved) {
          return (
            <span key={ci} style={{ color }}>
              {realChar}
            </span>
          )
        }

        // Show mojibake sequence that shrinks as we approach resolveAt
        const charProgress = enterProgress / (resolveAt + 0.001)
        const seqSeed = seed + ci * 53 + Math.floor(f / 3)
        const isSeq = charProgress > 0.4

        if (isSeq) {
          const seq = mojibakeSeq(seqSeed)
          return (
            <span key={ci} style={{ color: '#FF6600', fontSize: 'clamp(14px, 3vw, 48px)', opacity: 0.7 }}>
              {seq}
            </span>
          )
        }

        return (
          <span key={ci} style={{ color: 'rgba(255,100,0,0.5)' }}>
            {mojibakeChar(seqSeed)}
          </span>
        )
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
            letterSpacing: 2,
            opacity: 0.2 + enterProgress * 0.8,
          }}
        >
          {rendered}
        </div>
      )
    }

    if (phase === 'hold') {
      // Mostly clean with occasional single char mojibake flicker
      const flickerActive = holdProgress > 0.55 && holdProgress < 0.6
      const rendered = chars.map((ch, ci) => {
        if (flickerActive && ci === Math.floor(chars.length * 0.5)) {
          return (
            <span key={ci} style={{ color: '#FF6600' }}>
              {mojibakeChar(seed + ci + f)}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color }}>
            {ch}
          </span>
        )
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
            letterSpacing: 2,
            textShadow: `0 0 6px ${color}40`,
          }}
        >
          {rendered}
        </div>
      )
    }

    // Exit: re-garbling from right to left
    const rendered = chars.map((realChar, ci) => {
      const garbleAt = ((chars.length - 1 - ci) / chars.length) * 0.75
      const garbled = exitProgress >= garbleAt
      if (garbled) {
        const seqSeed = seed + ci * 53 + Math.floor(f / 3)
        const gProgress = (exitProgress - garbleAt) / (1 - garbleAt + 0.001)
        const glyph = gProgress > 0.4 ? mojibakeSeq(seqSeed) : mojibakeChar(seqSeed)
        return (
          <span
            key={ci}
            style={{
              color: '#FF6600',
              fontSize: gProgress > 0.4 ? 'clamp(12px, 2.5vw, 40px)' : undefined,
              opacity: 1 - gProgress * 0.6,
            }}
          >
            {glyph}
          </span>
        )
      }
      return (
        <span key={ci} style={{ color }}>
          {realChar}
        </span>
      )
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
          letterSpacing: 2,
          opacity: 1 - exitProgress * 0.6,
        }}
      >
        {rendered}
      </div>
    )
  },
}

function EncodingErrorComponent(props: MotionGraphicProps<EncodingErrorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-encoding-error',
  title: 'Kinetic Encoding Error',
  description:
    'Mojibake / encoding error: garbled multi-byte Unicode garbage characters settle into correct readable text',
  tags: ['kinetic', 'typography', 'glitch', 'mojibake', 'encoding', 'unicode', 'software', 'digital'],
  category: 'captions',
  component: EncodingErrorComponent as any,
  defaultConfig: {
    words: ['ENCODE', 'PARSE', 'UTF8', 'DECODE'],
    colors: ['#FF8C00', '#FFA040', '#FFB800', '#FF6600'],
    bgColor: '#080400',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ENCODE', 'PARSE', 'UTF8', 'DECODE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF8C00', '#FFA040', '#FFB800', '#FF6600'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080400', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
