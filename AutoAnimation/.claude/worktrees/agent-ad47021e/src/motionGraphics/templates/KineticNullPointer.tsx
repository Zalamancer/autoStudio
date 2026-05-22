import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NullPointerConfig extends KineticBaseConfig {
  blinkRate: number
}

function dRand(seed: number): number {
  return Math.abs(Math.sin(seed * 145.5 + 67.89) * 43758.5453) % 1
}

// Deterministic "is visible at this frame" check
function isVisible(frame: number, blinkRate: number, seed: number): boolean {
  // Blinking pattern: mostly off, with irregular on pulses
  const period = blinkRate
  const phase = (frame + Math.floor(dRand(seed) * period)) % period
  return phase < period * 0.3
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* NULL pointer dereference error */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(255,80,255,0.4)',
            letterSpacing: 1,
          }}
        >
          NullPointerException: Cannot read properties of null
        </div>
        {/* Null reference visual */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,80,255,0.25)',
          }}
        >
          {`*ptr → NULL | ref: 0x0000000000000000`}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 263 + 97
    const chars = word.split('')

    if (phase === 'enter') {
      // Characters flicker into existence: start with rapid null-blink, stabilize
      const rendered = chars.map((realChar, ci) => {
        const stabilizeAt = 0.15 + (ci / chars.length) * 0.6
        const isStable = enterProgress >= stabilizeAt

        if (isStable) {
          return <span key={ci} style={{ color, opacity: 1 }}>{realChar}</span>
        }

        // Rapid blink before stabilizing — high frequency flicker
        const flickerPeriod = Math.max(2, Math.floor(8 * (1 - enterProgress / stabilizeAt)))
        const charSeed = seed + ci * 37
        const charVisible = isVisible(f + ci * 11, flickerPeriod, charSeed)

        return (
          <span key={ci} style={{ color, opacity: charVisible ? 0.9 : 0 }}>
            {charVisible ? realChar : '\u00A0'}
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
            letterSpacing: 3,
          }}
        >
          {rendered}
        </div>
      )
    }

    if (phase === 'hold') {
      // Stable text, but with rare whole-word blink-out (null dereference moment)
      // Two blink-out windows during hold
      const blinkWindow1 = holdProgress > 0.2 && holdProgress < 0.24
      const blinkWindow2 = holdProgress > 0.65 && holdProgress < 0.67
      const isNull = blinkWindow1 || blinkWindow2

      // During null moment show "null" annotation
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
            color: isNull ? 'rgba(255,80,255,0.3)' : color,
            textShadow: isNull ? 'none' : `0 0 8px ${color}50`,
          }}
        >
          {isNull ? 'null' : word}
        </div>
      )
    }

    // Exit: word blinks out character by character, each going to null
    const rendered = chars.map((realChar, ci) => {
      const nullAt = (ci / chars.length) * 0.85
      const isNull = exitProgress >= nullAt

      if (isNull) {
        const nullProgress = (exitProgress - nullAt) / (1 - nullAt + 0.001)
        // Rapid blink then gone
        const flickerPeriod = Math.max(2, Math.floor(10 * (1 - nullProgress)))
        const charSeed = seed + ci * 37 + 500
        const charVisible = isVisible(f + ci * 11, flickerPeriod, charSeed)
        return (
          <span key={ci} style={{ color, opacity: charVisible ? 0.4 * (1 - nullProgress) : 0 }}>
            {charVisible ? realChar : '\u00A0'}
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
        }}
      >
        {rendered}
      </div>
    )
  },
}

function NullPointerComponent(props: MotionGraphicProps<NullPointerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-null-pointer',
  title: 'Kinetic Null Pointer',
  description: 'Null pointer exception: text blinks in and out of existence in rapid flickers, like a null reference being dereferenced',
  tags: ['kinetic', 'typography', 'glitch', 'null', 'pointer', 'blink', 'software', 'digital'],
  category: 'captions',
  component: NullPointerComponent as any,
  defaultConfig: {
    words: ['NULL', 'VOID', 'NONE', 'NIL'],
    colors: ['#FF44FF', '#CC44CC', '#FF44FF', '#FF88FF'],
    bgColor: '#06000a',
    cycleDuration: 1.5,
    blinkRate: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NULL', 'VOID', 'NONE', 'NIL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF44FF', '#CC44CC', '#FF44FF', '#FF88FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06000a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'blinkRate', label: 'Blink Rate (frames)', type: 'number', defaultValue: 6, min: 2, max: 20, group: 'Animation' },
  ],
})
