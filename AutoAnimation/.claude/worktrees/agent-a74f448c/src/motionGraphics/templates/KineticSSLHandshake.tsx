import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SSLHandshakeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Cipher-looking chars — hex-ish encrypted garble */
function cipherChar(seed: number): string {
  const hex = '0123456789ABCDEF'
  return hex[Math.floor(rand(seed) * 16)]
}

const TLS_STEPS = ['CLIENT HELLO', 'SERVER HELLO', 'CERTIFICATE', 'KEY EXCHANGE', 'FINISHED', 'ENCRYPTED']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const tlsStep = Math.min(TLS_STEPS.length - 1, Math.floor(time * 1.2))
    const isSecure = tlsStep >= TLS_STEPS.length - 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* TLS handshake steps left side */}
        <div style={{
          position: 'absolute', top: 12, left: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          lineHeight: 1.8,
        }}>
          {TLS_STEPS.map((step, i) => (
            <div key={i} style={{
              color: i < tlsStep
                ? 'rgba(0,220,100,0.15)'
                : i === tlsStep
                ? 'rgba(0,220,100,0.25)'
                : 'rgba(100,100,100,0.08)',
            }}>
              {i < tlsStep ? '[OK]' : i === tlsStep ? '[>>]' : '[  ]'} {step}
            </div>
          ))}
        </div>
        {/* Hex cipher stream in background */}
        {Array.from({ length: 6 }, (_, row) => {
          const y = row * (height / 6)
          const charsPerRow = 20
          return (
            <div key={row} style={{
              position: 'absolute', top: y, right: 10,
              fontFamily: "'Courier New', monospace", fontSize: 7,
              color: isSecure ? 'rgba(0,220,100,0.08)' : 'rgba(255,180,0,0.08)',
              letterSpacing: 2, whiteSpace: 'nowrap',
            }}>
              {Array.from({ length: charsPerRow }, (_, ci) =>
                cipherChar(row * 1000 + ci * 73 + Math.floor(time * 5))
              ).join(' ')}
            </div>
          )
        })}
        {/* Lock icon / status top-right */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          fontFamily: "'Courier New', monospace", fontSize: 8,
          color: isSecure ? 'rgba(0,220,100,0.25)' : 'rgba(255,180,0,0.2)',
          letterSpacing: 1,
        }}>
          {isSecure ? 'TLS 1.3 [LOCK]' : 'HANDSHAKE...'}
        </div>
        {/* Cipher suite bottom */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          fontFamily: "'Courier New', monospace", fontSize: 6,
          color: 'rgba(0,180,80,0.10)', letterSpacing: 1,
        }}>
          TLS_AES_256_GCM_SHA384
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 199 + 47
    const chars = word.split('')

    const wrap = (content: React.ReactNode) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap' }}>
        {content}
      </div>
    )

    if (phase === 'enter') {
      // SSL cipher decryption: each char starts as two cipher hex chars, collapses to real char
      // Phase 0..0.4: full cipher garble (all hex)
      // Phase 0.4..1.0: decrypts char by char from left to right
      const decryptStart = 0.4
      const decryptWindow = 0.45

      return wrap(
        chars.map((ch, ci) => {
          const charDecryptStart = decryptStart + (ci / chars.length) * decryptWindow
          const charDecryptEnd = charDecryptStart + 0.12
          const t = Math.max(0, Math.min(1, (enterProgress - charDecryptStart) / (charDecryptEnd - charDecryptStart)))
          const decrypted = t >= 1
          const decrypting = t > 0 && t < 1

          // Garble: show hex pair that narrows to single char
          let displayChar: string
          let extraChar = ''
          if (decrypted) {
            displayChar = ch
          } else if (decrypting) {
            const flip = Math.floor(f * 0.6 + ci * 13) % 4
            displayChar = flip === 0 ? ch : cipherChar(seed + ci * 29 + flip)
            extraChar = t < 0.5 ? cipherChar(seed + ci * 71 + Math.floor(f * 0.4)) : ''
          } else {
            displayChar = cipherChar(seed + ci * 17 + Math.floor(f * 0.5))
            extraChar = cipherChar(seed + ci * 71 + Math.floor(f * 0.4))
          }

          const opacity = enterProgress > 0.05 ? Math.min(1, (enterProgress - 0.05) / 0.15) : 0

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: decrypted ? color : decrypting ? 'rgba(255,200,80,0.9)' : 'rgba(255,180,0,0.6)',
                opacity,
                textShadow: decrypted
                  ? `0 0 10px ${color}60`
                  : '0 0 6px rgba(255,180,0,0.4)',
              }}
            >
              {displayChar}{extraChar && (
                <span style={{ fontSize: '0.45em', verticalAlign: 'middle', opacity: 0.7 }}>{extraChar}</span>
              )}
            </span>
          )
        })
      )
    } else if (phase === 'hold') {
      // Secure — subtle green glow pulse, occasional hex shimmer on edge chars
      const pulse = 0.8 + Math.sin(holdProgress * Math.PI * 3) * 0.2
      return wrap(
        chars.map((ch, ci) => {
          const shimmer = (ci === 0 || ci === chars.length - 1) && rand(seed + ci + Math.floor(holdProgress * 12)) < 0.05
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: shimmer ? 'rgba(0,220,100,0.9)' : color,
                textShadow: `0 0 ${8 * pulse}px ${color}50`,
              }}
            >
              {shimmer ? cipherChar(seed + ci + f) : ch}
            </span>
          )
        })
      )
    } else {
      // Exit: re-encrypt — chars flip back to cipher then fade
      return wrap(
        chars.map((ch, ci) => {
          const encryptAt = ci / chars.length * 0.6
          const t = Math.max(0, Math.min(1, (exitProgress - encryptAt) / 0.35))
          const reencrypted = t > 0.5
          const flickerRate = Math.floor(f * 0.5 + ci * 11)
          const displayChar = reencrypted
            ? cipherChar(seed + ci * 53 + flickerRate)
            : (t > 0.2 && flickerRate % 4 === 0 ? cipherChar(seed + ci * 53 + flickerRate) : ch)

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: reencrypted ? 'rgba(255,180,0,0.6)' : color,
                opacity: 1 - exitProgress * 0.9,
              }}
            >
              {displayChar}
            </span>
          )
        })
      )
    }
  },
}

function SSLHandshakeComponent(props: MotionGraphicProps<SSLHandshakeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ssl-handshake',
  title: 'Kinetic SSL Handshake',
  description: 'TLS/SSL handshake decryption — text starts as hex cipher garble and decrypts char-by-char through CLIENT HELLO to FINISHED',
  tags: ['kinetic', 'typography', 'ssl', 'tls', 'encrypt', 'decrypt', 'cipher', 'network', 'security', 'glitch'],
  category: 'captions',
  component: SSLHandshakeComponent as any,
  defaultConfig: {
    words: ['ENCRYPT', 'SECURE', 'DECRYPT', 'VERIFY'],
    colors: ['#00DC64', '#00FF96', '#00DC64', '#64FFB4'],
    bgColor: '#020A04',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ENCRYPT', 'SECURE', 'DECRYPT', 'VERIFY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00DC64', '#00FF96', '#00DC64', '#64FFB4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020A04', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
