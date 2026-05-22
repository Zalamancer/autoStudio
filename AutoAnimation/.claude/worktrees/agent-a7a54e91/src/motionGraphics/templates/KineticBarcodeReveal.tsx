import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BarcodeRevealConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Generate barcode bar widths from word seed */
function barcodePattern(word: string, seed: number): number[] {
  const bars: number[] = []
  const total = word.length * 6 + 10
  for (let i = 0; i < total; i++) {
    bars.push(1 + Math.floor(rand(seed + i * 37 + word.charCodeAt(i % word.length)) * 3))
  }
  return bars
}

/** Render barcode bars into a container */
function BarcodeBars({ bars, unitW, barH, color, opacity }: {
  bars: number[]; unitW: number; barH: number; color: string; opacity: number
}) {
  let x = 0
  return (
    <>
      {bars.map((w, i) => {
        const pos = x
        x += w * unitW
        return i % 2 === 0 ? (
          <div key={i} style={{ position: 'absolute', left: pos, top: 0, width: w * unitW, height: barH, background: color, opacity }} />
        ) : null
      })}
    </>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const scanY = ((time * 60) % 120) - 10

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Scanner laser */}
        <div style={{
          position: 'absolute', left: '15%', right: '15%', top: `${scanY}%`, height: 2,
          background: 'linear-gradient(90deg, transparent, #FF0000, #FF0000, transparent)',
          boxShadow: '0 0 8px rgba(255,0,0,0.3)',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, frame }: WordRenderProps) => {
    const seed = index * 167 + 53
    const bars = barcodePattern(word, seed)
    const totalUnits = bars.reduce((a, b) => a + b, 0)
    const barcodeW = Math.min(width * 0.7, 400)
    const unitW = barcodeW / totalUnits
    const barH = 80

    const textStyle = (opacity: number): React.CSSProperties => ({
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      fontFamily: "'Courier New', monospace", fontSize: 'clamp(36px, 10vw, 140px)', fontWeight: 700,
      color, whiteSpace: 'nowrap', opacity, textShadow: `0 0 12px ${color}40`, letterSpacing: 4,
    })

    if (phase === 'enter') {
      // Barcode appears, scan line passes, morphs to text
      const bcPhase = Math.min(1, enterProgress / 0.5)
      const decode = enterProgress < 0.5 ? 0 : (enterProgress - 0.5) / 0.5
      const textOp = Math.max(0, (decode - 0.3) / 0.7)
      const bcOp = 1 - Math.max(0, (decode - 0.4) / 0.6)

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ position: 'relative', width: barcodeW, height: barH, opacity: bcOp }}>
            <BarcodeBars bars={bars} unitW={unitW} barH={barH} color={color} opacity={bcPhase} />
          </div>
          <div style={textStyle(textOp)}>{word}</div>
          {decode > 0 && decode < 0.6 && (
            <div style={{ position: 'absolute', left: -10, right: -10, top: `${decode / 0.6 * 100}%`, height: 2, background: '#FF0000', boxShadow: '0 0 10px rgba(255,0,0,0.5)' }} />
          )}
          {/* Numeric code below barcode */}
          <div style={{ textAlign: 'center', fontFamily: "'Courier New', monospace", fontSize: 10, color: `${color}40`, marginTop: 4, letterSpacing: 3, opacity: bcOp }}>
            {Array.from(word, ch => ch.charCodeAt(0).toString().padStart(3, '0')).join(' ')}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const ghostA = 0.06 + Math.sin(holdProgress * Math.PI * 2) * 0.03
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: barcodeW, height: barH }}>
            <BarcodeBars bars={bars} unitW={unitW} barH={barH} color={color} opacity={ghostA} />
          </div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(36px, 10vw, 140px)', fontWeight: 700, color, whiteSpace: 'nowrap', textShadow: `0 0 10px ${color}30`, letterSpacing: 4 }}>
            {word}
          </div>
        </div>
      )
    } else {
      // Re-encode to barcode, shrink away
      const encode = Math.min(1, exitProgress / 0.4)
      const shrink = exitProgress < 0.4 ? 0 : (exitProgress - 0.4) / 0.6
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ position: 'relative', width: barcodeW, height: barH * (1 - shrink) }}>
            <BarcodeBars bars={bars} unitW={unitW} barH={barH * (1 - shrink)} color={color} opacity={encode * (1 - shrink)} />
          </div>
          <div style={textStyle(1 - encode)}>{word}</div>
        </div>
      )
    }
  },
}

function BarcodeRevealComponent(props: MotionGraphicProps<BarcodeRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-barcode-reveal',
  title: 'Kinetic Barcode Reveal',
  description: 'Text encoded as a barcode that gets scanned by a red laser line and decodes into readable words, with ghost barcode behind',
  tags: ['kinetic', 'typography', 'barcode', 'scan', 'retail', 'digital', 'decode', 'data'],
  category: 'captions',
  component: BarcodeRevealComponent as any,
  defaultConfig: {
    words: ['SCAN', 'DECODE', 'PRICE', 'SOLD'],
    colors: ['#FFFFFF', '#EEEEEE', '#FFFFFF', '#DDDDDD'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'DECODE', 'PRICE', 'SOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#EEEEEE', '#FFFFFF', '#DDDDDD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
