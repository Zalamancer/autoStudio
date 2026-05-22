import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Compression/Expansion 4: Accordion Squeeze ───────────────────────────────
// Letter-spacing concertinas in and out — the word compresses to zero width
// then expands with overshoot, like an accordion being played.

interface AccordionSqueezeConfig extends KineticBaseConfig {
  maxSpread: number
  squeezeDepth: number
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (Math.PI * 2) / 3) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Accordion fold shadow lines */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${10 + i * 10}%`, top: '20%', bottom: '20%',
          width: 1,
          background: `rgba(255,255,255,0.03)`,
          transform: `skewX(${(i % 2 === 0 ? 5 : -5)}deg)`,
        }} />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // Global letter spacing (the accordion bellows)
    let globalSpread = 0  // extra em spacing per char
    let globalScX = 1     // horizontal scale of whole container
    let globalOp = 1

    if (phase === 'enter') {
      // Start maximally squeezed (scaleX=0), then accordion opens
      if (enterProgress < 0.15) {
        globalScX = 0.01
        globalOp = 0.3
        globalSpread = 0
      } else {
        const p = (enterProgress - 0.15) / 0.85
        const e = easeOutElastic(Math.min(1, p * 1.1))
        globalScX = Math.max(0.01, e)
        globalSpread = e * 0.05 - 0.03 // brief negative spacing at peak elastic
        globalOp = Math.min(1, p * 2)
      }
    } else if (phase === 'hold') {
      // Gentle accordion breathing
      const breathe = Math.sin(holdProgress * Math.PI * 3) * 0.015
      globalSpread = breathe
      globalScX = 1 + breathe * 0.5
      globalOp = 1
    } else {
      // Squeeze shut for exit
      const p = easeInCubic(exitProgress)
      globalScX = Math.max(0.01, 1 - p * 0.99)
      globalOp = 1 - p * 0.6
      globalSpread = -p * 0.05
    }

    // Per-character accordion fold tilt (each char tilts alternately)
    const charElements = chars.map((ch, ci) => {
      const isEven = ci % 2 === 0
      const normPos = totalChars > 1 ? ci / (totalChars - 1) : 0.5

      let charRot = 0, charScX = 1

      if (phase === 'enter') {
        const p = Math.max(0, (enterProgress - 0.1) / 0.9)
        const e = easeOutElastic(Math.min(1, p))
        charRot = (isEven ? 1 : -1) * (1 - e) * 15
        charScX = 0.5 + e * 0.5
      } else if (phase === 'hold') {
        charRot = (isEven ? 1 : -1) * Math.sin(holdProgress * Math.PI * 3 + ci * 0.6) * 3
      } else {
        const p = easeInCubic(exitProgress)
        charRot = (isEven ? 1 : -1) * p * 20
        charScX = 1 - p * 0.5
      }

      return (
        <div
          key={ci}
          style={{
            display: 'inline-block',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(46px, 11vw, 144px)',
            fontWeight: 900,
            color,
            letterSpacing: `${0.05 + globalSpread}em`,
            transform: `rotate(${charRot}deg) scaleX(${charScX})`,
            transformOrigin: 'center bottom',
            textShadow: `1px 1px 0 rgba(0,0,0,0.4)`,
            lineHeight: 1.1,
          }}
        >
          {ch}
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scaleX(${globalScX})`,
          opacity: globalOp,
          display: 'flex', whiteSpace: 'nowrap',
          transformOrigin: 'center center',
        }}>
          {charElements}
        </div>
      </div>
    )
  },
}

function AccordionSqueezeComponent(props: MotionGraphicProps<AccordionSqueezeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-accordion-squeeze',
  title: 'Kinetic Accordion Squeeze',
  description: 'Word compresses to zero width and bellows open with elastic overshoot — each character tilts alternately like accordion folds, breathes gently on hold.',
  tags: ['kinetic', 'typography', 'accordion', 'squeeze', 'compression', 'expansion', 'elastic', 'letterspace'],
  category: 'captions',
  component: AccordionSqueezeComponent as any,
  defaultConfig: {
    words: ['SQUEEZE', 'PRESS', 'FLEX', 'WIDE'],
    colors: ['#FF6633', '#FFFFFF', '#FF3366', '#FFAA33'],
    bgColor: '#1a0808',
    cycleDuration: 1.5,
    maxSpread: 0.1,
    squeezeDepth: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SQUEEZE', 'PRESS', 'FLEX', 'WIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6633', '#FFFFFF', '#FF3366', '#FFAA33'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'maxSpread', label: 'Max Letter Spread', type: 'number', defaultValue: 0.1, min: 0.02, max: 0.5, group: 'Animation' },
    { key: 'squeezeDepth', label: 'Squeeze Depth', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
