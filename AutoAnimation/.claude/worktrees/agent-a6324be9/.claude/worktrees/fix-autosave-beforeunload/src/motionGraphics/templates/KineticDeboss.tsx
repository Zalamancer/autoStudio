import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DebossConfig extends KineticBaseConfig {}

function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Thick cotton card stock with subtle tooth/grain
    const grainDots: React.ReactNode[] = []
    for (let i = 0; i < 80; i++) {
      const x = hash(i * 31 + 5) * width
      const y = hash(i * 47 + 9) * height
      const size = 1 + hash(i * 73) * 2
      grainDots.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(0,0,0,${0.01 + hash(i * 19) * 0.015})`,
          }}
        />
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {grainDots}
        {/* Light source gradient — top-left illumination for emboss/deboss */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%, rgba(0,0,0,0.02) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 79 + 43
    const chars = word.split('')

    // Blind deboss: no ink, just pressed into paper. Visibility comes ONLY from shadows.
    // Light from top-left: highlight on top/left edges, shadow on bottom/right

    let pressDepth = 0 // 0..1 how deep the deboss is
    let shadowIntensity = 0
    let highlightIntensity = 0
    let overallOpacity = 0

    if (phase === 'enter') {
      const t = enterProgress
      // Press action: die pushes down into thick stock
      if (t < 0.3) {
        // Initial contact
        const contact = t / 0.3
        pressDepth = contact * 0.3
        shadowIntensity = contact * 0.3
        highlightIntensity = contact * 0.2
        overallOpacity = contact
      } else if (t < 0.6) {
        // Deep press with slight overshoot
        const deep = (t - 0.3) / 0.3
        const eased = 1 - Math.pow(1 - deep, 3)
        pressDepth = 0.3 + eased * 0.8 // overshoot to 1.1
        shadowIntensity = 0.3 + eased * 0.7
        highlightIntensity = 0.2 + eased * 0.6
        overallOpacity = 1
      } else {
        // Settle back to final depth
        const settle = (t - 0.6) / 0.4
        pressDepth = 1.1 - settle * 0.1 // settle to 1.0
        shadowIntensity = 1
        highlightIntensity = 0.8
        overallOpacity = 1
      }
    } else if (phase === 'hold') {
      pressDepth = 1
      shadowIntensity = 1
      highlightIntensity = 0.8
      overallOpacity = 1
      // Subtle lighting shift during hold (as if viewer tilts card)
      const tilt = Math.sin(holdProgress * Math.PI) * 0.1
      shadowIntensity += tilt
      highlightIntensity += tilt
    } else {
      const t = exitProgress
      // Paper springs back slowly
      pressDepth = 1 - t * 0.8 // doesn't fully recover
      shadowIntensity = (1 - t) * 0.9
      highlightIntensity = (1 - t) * 0.7
      overallOpacity = 1 - t * 0.6
    }

    // Build the deboss shadow/highlight effect
    // Top-left light: highlight top-left inner edge, shadow bottom-right
    const depth = pressDepth * 3
    const shadowAlpha = shadowIntensity * 0.45
    const highlightAlpha = highlightIntensity * 0.35

    const debossShadows = [
      // Inner shadow (bottom-right = dark, simulating depth)
      `${depth * 0.8}px ${depth}px ${depth * 0.6}px rgba(0,0,0,${shadowAlpha})`,
      // Inner highlight (top-left = light, where light catches edge)
      `${-depth * 0.6}px ${-depth * 0.7}px ${depth * 0.4}px rgba(255,255,255,${highlightAlpha})`,
      // Ambient occlusion in the pressed valley
      `0 0 ${depth * 2}px rgba(0,0,0,${shadowAlpha * 0.3})`,
    ].join(', ')

    // Per-character press with stagger
    const renderedChars = chars.map((ch, ci) => {
      const charDelay = ci / chars.length * 0.2
      let charDepth = 0

      if (phase === 'enter') {
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.8))
        // Each char bounces in
        charDepth = cp < 0.7
          ? (cp / 0.7) * 1.15 // overshoot
          : 1.15 - ((cp - 0.7) / 0.3) * 0.15 // settle
      } else if (phase === 'hold') {
        charDepth = 1
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.5) / 0.8))
        charDepth = 1 - cp * 0.8
      }

      const charY = charDepth * 2 // slight downward press

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${charY}px)`,
            // Blind deboss: color matches paper but darker (compressed fibers)
            color: `rgba(0,0,0,${charDepth * 0.04})`,
          }}
        >
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
          opacity: overallOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Futura', 'Gill Sans', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(50px, 14vw, 185px)',
            fontWeight: 700,
            letterSpacing: 6,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            textShadow: debossShadows,
            // Blind deboss: text is same color as paper, only shadows make it visible
            color: 'transparent',
          }}
        >
          {renderedChars}
        </div>
        {/* Duplicate layer for the physical pressed-in look */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            fontFamily: "'Futura', 'Gill Sans', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(50px, 14vw, 185px)',
            fontWeight: 700,
            letterSpacing: 6,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            // Slightly darker where paper is compressed
            color: `rgba(0,0,0,${pressDepth * 0.05})`,
            transform: `translate(${pressDepth * 0.3}px, ${pressDepth * 0.4}px)`,
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DebossComponent(props: MotionGraphicProps<DebossConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-deboss',
  title: 'Kinetic Deboss',
  description: 'Blind deboss pressed into thick card stock — no ink, just shadows reveal letterforms as the die pushes paper down',
  tags: ['kinetic', 'typography', 'deboss', 'blind', 'emboss', 'cardstock', 'press', 'minimal'],
  category: 'captions',
  component: DebossComponent as any,
  defaultConfig: {
    words: ['DEPTH', 'PRESS', 'PURE', 'FORM'],
    colors: ['#E8E0D4', '#E8E0D4', '#E8E0D4', '#E8E0D4'],
    bgColor: '#E8E0D4',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPTH', 'PRESS', 'PURE', 'FORM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0D4', '#E8E0D4', '#E8E0D4', '#E8E0D4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8E0D4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
