import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BarcodeSweepConfig extends KineticBaseConfig {}

function seededRand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Deterministic bar widths from word seed */
function makeBarWidths(word: string, seed: number): number[] {
  const bars: number[] = []
  const count = Math.max(30, word.length * 5)
  for (let i = 0; i < count; i++) {
    bars.push(1 + Math.floor(seededRand(seed + i * 41 + word.charCodeAt(i % word.length) * 3) * 3))
  }
  return bars
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, frame, fps }: BackgroundRenderProps) => {
    // Laser sweeps left-to-right continuously
    const time = frame / fps
    const laserX = ((time * 0.5) % 1.2 - 0.1) * width

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle scan-bed texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(255,255,255,0.012) 9px, rgba(255,255,255,0.012) 10px)',
        }} />
        {/* Red laser sweep */}
        <div style={{
          position: 'absolute', top: '20%', bottom: '20%',
          left: laserX, width: 3,
          background: 'linear-gradient(180deg, transparent, #FF2200 20%, #FF4400 50%, #FF2200 80%, transparent)',
          boxShadow: '0 0 12px 4px rgba(255,40,0,0.55)',
          filter: 'blur(0.5px)',
        }} />
        {/* Laser reflection bar */}
        <div style={{
          position: 'absolute', left: laserX - 6, top: '20%', bottom: '20%', width: 12,
          background: 'radial-gradient(ellipse at center, rgba(255,80,0,0.12) 0%, transparent 70%)',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 179 + 61
    const bars = makeBarWidths(word, seed)
    const totalUnits = bars.reduce((a, b) => a + b, 0)
    const barcodeW = Math.min(width * 0.72, 420)
    const unitW = barcodeW / totalUnits
    const barH = 90

    // Laser passes left-to-right during enter (0..1 = left..right)
    // Text characters decode as laser passes each character position
    const chars = word.split('')

    const baseStyle: React.CSSProperties = {
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: "'Courier New', monospace",
      fontSize: 'clamp(38px, 10vw, 148px)',
      fontWeight: 700,
      color,
      whiteSpace: 'nowrap',
      letterSpacing: 5,
    }

    if (phase === 'enter') {
      // Laser position 0..1 during enter
      const laserPos = enterProgress
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          {/* Barcode lines — fade out as laser passes */}
          <div style={{ position: 'relative', width: barcodeW, height: barH }}>
            {(() => {
              let x = 0
              return bars.map((w, i) => {
                const pos = x
                x += w * unitW
                const frac = pos / barcodeW
                const pastLaser = frac < laserPos
                const opacity = pastLaser ? Math.max(0, 0.15 - (laserPos - frac) * 0.5) : 0.85
                return i % 2 === 0 ? (
                  <div key={i} style={{
                    position: 'absolute', left: pos, top: 0,
                    width: w * unitW, height: barH,
                    background: color, opacity,
                  }} />
                ) : null
              })
            })()}
            {/* Moving laser line over barcode */}
            <div style={{
              position: 'absolute', top: -6, bottom: -6,
              left: laserPos * barcodeW, width: 3,
              background: 'linear-gradient(180deg, transparent, #FF3300 20%, #FF5500 50%, #FF3300 80%, transparent)',
              boxShadow: '0 0 10px 3px rgba(255,50,0,0.6)',
            }} />
          </div>
          {/* Text chars decode left-to-right behind laser */}
          <div style={{ ...baseStyle, position: 'relative', transform: 'none', top: 'auto', left: 'auto', marginTop: 8 }}>
            {chars.map((ch, ci) => {
              const charFrac = (ci + 0.5) / chars.length
              const decoded = charFrac < laserPos
              return (
                <span key={ci} style={{
                  opacity: decoded ? 1 : 0,
                  textShadow: decoded ? `0 0 10px ${color}80` : 'none',
                  transition: 'none',
                }}>
                  {ch}
                </span>
              )
            })}
          </div>
          {/* Number strip below barcode */}
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 10, letterSpacing: 3,
            color: `${color}50`, textAlign: 'center', marginTop: 4,
          }}>
            {chars.map((ch, ci) => ci < laserPos * chars.length ? ch.charCodeAt(0).toString().padStart(3, '0') : '░░░').join(' ')}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const pulse = 0.06 + Math.sin(holdProgress * Math.PI * 4) * 0.03
      return (
        <div style={baseStyle}>
          <span style={{ textShadow: `0 0 16px ${color}60` }}>{word}</span>
          {/* Ghost barcode behind text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: barcodeW, height: barH, opacity: pulse,
          }}>
            {(() => {
              let x = 0
              return bars.map((w, i) => {
                const pos = x; x += w * unitW
                return i % 2 === 0 ? (
                  <div key={i} style={{ position: 'absolute', left: pos, top: 0, width: w * unitW, height: barH, background: color }} />
                ) : null
              })
            })()}
          </div>
        </div>
      )
    } else {
      // Re-encode: text fades, barcode re-assembles, then shrinks
      const recode = Math.min(1, exitProgress / 0.45)
      const shrink = exitProgress < 0.45 ? 0 : (exitProgress - 0.45) / 0.55
      const scale = 1 - shrink * 0.8
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scaleY(${scale})`, opacity: 1 - shrink }}>
          <div style={{ position: 'relative', width: barcodeW, height: barH }}>
            {(() => {
              let x = 0
              return bars.map((w, i) => {
                const pos = x; x += w * unitW
                return i % 2 === 0 ? (
                  <div key={i} style={{ position: 'absolute', left: pos, top: 0, width: w * unitW, height: barH, background: color, opacity: recode }} />
                ) : null
              })
            })()}
          </div>
          <div style={{ ...baseStyle, position: 'relative', transform: 'none', top: 'auto', left: 'auto', opacity: 1 - recode }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function BarcodeSweepComponent(props: MotionGraphicProps<BarcodeSweepConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-barcode-sweep',
  title: 'Kinetic Barcode Sweep',
  description: 'Barcode scanner red laser line sweeps left-to-right; text characters decode behind the laser as it passes, bars fade away',
  tags: ['kinetic', 'typography', 'barcode', 'scan', 'laser', 'decode', 'retail', 'scanner'],
  category: 'captions',
  component: BarcodeSweepComponent as any,
  defaultConfig: {
    words: ['SCAN', 'READ', 'BEEP', 'DONE'],
    colors: ['#FFFFFF', '#EEEEEE', '#FFFFFF', '#CCCCCC'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'READ', 'BEEP', 'DONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#EEEEEE', '#FFFFFF', '#CCCCCC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
