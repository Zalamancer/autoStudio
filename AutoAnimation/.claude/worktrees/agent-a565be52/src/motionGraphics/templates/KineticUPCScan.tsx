import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UPCScanConfig extends KineticBaseConfig {}

function seededRand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Generate UPC-A-like vertical bar widths from a seed */
function upcBars(seed: number, count: number): Array<{ w: number; dark: boolean }> {
  const bars: Array<{ w: number; dark: boolean }> = []
  for (let i = 0; i < count; i++) {
    bars.push({ w: 1 + Math.floor(seededRand(seed + i * 53) * 3), dark: i % 2 === 0 })
  }
  return bars
}

/** Convert char to 3-digit UPC-style number string */
function charToDigits(ch: string): string {
  return ch.charCodeAt(0).toString().padStart(3, '0')
}

const BEEP_FRAMES = 8 // number of frames the "beep" flash lasts

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Overhead scanner glass with red laser fan
    // Multiple laser lines fan outward from center
    const angle = ((time * 1.1) % 1) * 60 - 30 // oscillates -30..+30 deg

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scanner glass glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(200,0,0,0.04) 0%, transparent 70%)',
        }} />
        {/* Laser fan lines */}
        {[-2, -1, 0, 1, 2].map((i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '55%', left: '50%',
            width: '50%', height: 2,
            transformOrigin: '0% 50%',
            transform: `rotate(${angle + i * 8}deg)`,
            background: 'linear-gradient(90deg, rgba(255,0,0,0.55), rgba(255,0,0,0.1), transparent)',
            boxShadow: '0 0 4px rgba(255,0,0,0.2)',
          }} />
        ))}
        {[1, -1].map((dir) => (
          <div key={dir} style={{
            position: 'absolute',
            top: '55%', left: '50%',
            width: '50%', height: 2,
            transformOrigin: '0% 50%',
            transform: `rotate(${angle * dir - 90}deg)`,
            background: 'linear-gradient(90deg, rgba(255,0,0,0.4), rgba(255,0,0,0.08), transparent)',
          }} />
        ))}
        {/* Scanner label bottom */}
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,80,0,0.35)', letterSpacing: 3,
        }}>
          POINT OF SALE
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const seed = index * 223 + 97
    const barCount = Math.max(40, word.length * 8)
    const bars = upcBars(seed, barCount)
    const totalUnits = bars.reduce((s, b) => s + b.w, 0)
    const barcodeW = 280
    const barH = 110
    const unitW = barcodeW / totalUnits

    // Laser pass progress (0=not scanned, 1=fully scanned)
    // Simulate vertical pass — text decodes char by char
    const chars = word.split('')

    if (phase === 'enter') {
      const laserY = enterProgress // 0=top, 1=bottom
      // Text decodes as laser passes across the middle
      const charDecodeThreshold = 0.5 // laser at 50% height triggers decode
      const decodeStart = charDecodeThreshold
      const decodeProgress = Math.max(0, Math.min(1, (enterProgress - decodeStart) / 0.4))

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }}>
          {/* UPC barcode */}
          <div style={{ position: 'relative', width: barcodeW, height: barH }}>
            {(() => {
              let x = 0
              return bars.map((bar, i) => {
                const pos = x; x += bar.w * unitW
                return bar.dark ? (
                  <div key={i} style={{
                    position: 'absolute', left: pos, top: 0,
                    width: bar.w * unitW, height: barH,
                    background: color,
                    opacity: Math.max(0.1, 1 - decodeProgress * 0.85),
                  }} />
                ) : null
              })
            })()}
            {/* Horizontal laser beam passing down */}
            <div style={{
              position: 'absolute', left: -8, right: -8,
              top: laserY * barH,
              height: 2,
              background: 'linear-gradient(90deg, transparent, #FF3300 10%, #FF6600 50%, #FF3300 90%, transparent)',
              boxShadow: '0 0 10px 3px rgba(255,60,0,0.55)',
            }} />
          </div>

          {/* Digits below barcode — decode char by char */}
          <div style={{
            marginTop: 6, display: 'flex', justifyContent: 'center', gap: 0,
          }}>
            {/* Left guard digit */}
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: `${color}60`, marginRight: 4 }}>
              {decodeProgress > 0.05 ? charToDigits(word[0] ?? ' ')[0] : '▓'}
            </span>
            {chars.map((ch, ci) => {
              const charFrac = (ci + 0.5) / chars.length
              const decoded = charFrac < decodeProgress
              return (
                <span key={ci} style={{
                  fontFamily: 'monospace', fontSize: 11,
                  color: decoded ? `${color}80` : `${color}20`,
                  letterSpacing: 1,
                }}>
                  {decoded ? charToDigits(ch) : '░░░'}
                  {ci < chars.length - 1 && ' '}
                </span>
              )
            })}
          </div>

          {/* Decoded word appears below barcode */}
          <div style={{
            position: 'absolute', top: barH + 28, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(32px, 8.5vw, 120px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            opacity: decodeProgress,
            textShadow: `0 0 12px ${color}60`,
          }}>
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Clean decoded state with ghost barcode + beep glow
      const f = (frame ?? 0)
      const beepFlash = f < BEEP_FRAMES ? (1 - f / BEEP_FRAMES) * 0.4 : 0
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }}>
          {/* Ghost barcode */}
          <div style={{ position: 'relative', width: barcodeW, height: barH, opacity: 0.07 + beepFlash }}>
            {(() => {
              let x = 0
              return bars.map((bar, i) => {
                const pos = x; x += bar.w * unitW
                return bar.dark ? (
                  <div key={i} style={{ position: 'absolute', left: pos, top: 0, width: bar.w * unitW, height: barH, background: color }} />
                ) : null
              })
            })()}
          </div>
          <div style={{
            position: 'absolute', top: barH + 28, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(32px, 8.5vw, 120px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: `0 0 14px ${color}50`,
          }}>
            {word}
          </div>
          {/* Price tag strip */}
          <div style={{
            position: 'absolute', top: barH + 30 + 60, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'monospace', fontSize: 10, color: `${color}50`,
            letterSpacing: 4, whiteSpace: 'nowrap',
            opacity: Math.min(1, holdProgress * 3),
          }}>
            {'BEEP ✓ ACCEPTED'}
          </div>
        </div>
      )
    } else {
      // Re-encode to barcode on exit
      const recode = Math.min(1, exitProgress / 0.5)
      const shrink = exitProgress < 0.5 ? 0 : (exitProgress - 0.5) / 0.5
      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -55%) scaleY(${1 - shrink * 0.7})`,
          opacity: 1 - shrink,
        }}>
          <div style={{ position: 'relative', width: barcodeW, height: barH }}>
            {(() => {
              let x = 0
              return bars.map((bar, i) => {
                const pos = x; x += bar.w * unitW
                return bar.dark ? (
                  <div key={i} style={{ position: 'absolute', left: pos, top: 0, width: bar.w * unitW, height: barH, background: color, opacity: recode }} />
                ) : null
              })
            })()}
          </div>
          <div style={{
            position: 'absolute', top: barH + 28, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(32px, 8.5vw, 120px)',
            fontWeight: 700, color, whiteSpace: 'nowrap', letterSpacing: 6,
            opacity: 1 - recode,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function UPCScanComponent(props: MotionGraphicProps<UPCScanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-upc-scan',
  title: 'Kinetic UPC Scan',
  description: 'UPC barcode with red laser fan: vertical lines read as laser sweeps down, digit strip decodes, text appears with a satisfying beep flash',
  tags: ['kinetic', 'typography', 'upc', 'barcode', 'scan', 'retail', 'checkout', 'laser', 'beep'],
  category: 'captions',
  component: UPCScanComponent as any,
  defaultConfig: {
    words: ['PRICE', 'ITEM', 'SOLD', 'NEXT'],
    colors: ['#FFFFFF', '#EEEEEE', '#FFFFFF', '#DDDDDD'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRICE', 'ITEM', 'SOLD', 'NEXT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#EEEEEE', '#FFFFFF', '#DDDDDD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
