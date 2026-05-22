import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ReceiptPrintConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const receiptW = Math.min(width * 0.55, height * 0.4)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Printer slot — the dark opening at top */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: receiptW * 1.2,
            height: 20,
            background: 'linear-gradient(180deg, #1a1a1a, #222, #1a1a1a)',
            borderRadius: 10,
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
            zIndex: 20,
          }}
        >
          {/* Printer body above the slot */}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: receiptW * 1.3,
              height: 40,
              background: 'linear-gradient(180deg, #333, #2a2a2a)',
              borderRadius: '8px 8px 0 0',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {/* Status LED */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 20,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: Math.sin(time * 4) > 0 ? '#00cc44' : '#008822',
                boxShadow: `0 0 4px ${Math.sin(time * 4) > 0 ? '#00cc44' : '#006622'}`,
              }}
            />
          </div>
        </div>
        {/* Receipt paper strip — scrolls downward */}
        <div
          style={{
            position: 'absolute',
            top: '14%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: receiptW,
            bottom: '10%',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {/* Paper body */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #f8f5f0 0%, #faf8f4 10%, #faf8f4 90%, #f5f2ec 100%)',
              boxShadow: '2px 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {/* Paper grain texture */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.008) 3px, rgba(0,0,0,0.008) 4px)' }} />
            {/* Receipt header */}
            <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: receiptW * 0.05, fontWeight: 700, color: '#333', letterSpacing: 3 }}>
                *** RECEIPT ***
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: receiptW * 0.03, color: '#888', marginTop: 4 }}>
                03/19/2026 12:00:00
              </div>
              <div style={{ marginTop: 8, borderTop: '1px dashed #ccc', width: receiptW * 0.8 }} />
            </div>
            {/* Decorative item lines */}
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} style={{ position: 'absolute', top: 90 + i * 22, left: '10%', right: '10%', display: 'flex', justifyContent: 'space-between', fontFamily: "'Courier New', monospace", fontSize: receiptW * 0.028, color: '#aaa' }}>
                <span>ITEM {i + 1}</span><span>{'........'}</span><span>${(4.99 + i * 3.5).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {/* Top fade — paper disappearing into printer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 30,
              background: `linear-gradient(180deg, ${bgColor} 0%, transparent 100%)`,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />
          {/* Bottom curl / tear edge */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 20,
              background: `linear-gradient(0deg, ${bgColor} 0%, transparent 100%)`,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let translateY = 0
    let charReveal = word.length

    if (phase === 'enter') {
      // Thermal print — text scrolls down from printer, revealed char by char
      if (enterProgress < 0.6) {
        const printT = enterProgress / 0.6
        translateY = (1 - printT) * -40
        charReveal = Math.floor(printT * (word.length + 1))
        opacity = printT
      } else {
        const settleT = (enterProgress - 0.6) / 0.4
        translateY = 0
        charReveal = word.length
        opacity = 0.8 + settleT * 0.2
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
      charReveal = word.length
    } else {
      // Scroll further down and fade
      translateY = exitProgress * 50
      opacity = 1 - exitProgress
      charReveal = word.length
    }

    const displayText = word.substring(0, Math.min(charReveal, word.length))

    return (
      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          zIndex: 15,
        }}
      >
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(28px, 7vw, 80px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            // Thermal print slightly uneven darkness
            textShadow: '0 0 1px rgba(0,0,0,0.1)',
          }}
        >
          {displayText}
          {/* Print head cursor */}
          {phase === 'enter' && charReveal < word.length && (
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: '0.9em',
                background: 'rgba(0,0,0,0.3)',
                marginLeft: 1,
                verticalAlign: 'middle',
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function ReceiptPrintComponent(props: MotionGraphicProps<ReceiptPrintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-receipt-print',
  title: 'Kinetic Receipt Print',
  description:
    'Thermal receipt printer with paper scrolling from the slot. Text prints character-by-character like a dot-matrix head, with receipt header, item lines, and edge fade.',
  tags: ['kinetic', 'typography', 'receipt', 'printer', 'thermal', 'analog', 'retail', 'paper'],
  category: 'captions',
  component: ReceiptPrintComponent as any,
  defaultConfig: {
    words: ['TOTAL', 'PAID', 'CHANGE', 'THANKS'],
    colors: ['#2a2a2a', '#2a2a2a', '#2a2a2a', '#2a2a2a'],
    bgColor: '#1a1a1e',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TOTAL', 'PAID', 'CHANGE', 'THANKS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a2a2a', '#2a2a2a', '#2a2a2a', '#2a2a2a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
