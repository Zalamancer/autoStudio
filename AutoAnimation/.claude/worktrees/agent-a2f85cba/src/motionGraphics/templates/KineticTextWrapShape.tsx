import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TextWrapShapeConfig extends KineticBaseConfig {
  shapeRadius: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

/**
 * Text Wrap Shape — letters are arranged to wrap around an invisible circle,
 * demonstrating CSS text-wrap-around / shape-outside as kinetic typography.
 * On enter, letters fly in from their scattered positions and settle into
 * the circular arc. The arc itself grows during the animation. During hold,
 * the letters orbit the circle slightly.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* The "invisible" circle — shown as a subtle guide */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: Math.min(width, height) * 0.28,
          height: Math.min(width, height) * 0.28,
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    const letters = word.split('')
    const n = letters.length

    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) * 0.28

    // Letters are placed on an arc (bottom semicircle wrapping around top)
    // Start angle: -Math.PI * 0.7, end angle: Math.PI * 0.7
    // This creates a "wrapping" arc around the circle
    const startAngle = -Math.PI * 0.65
    const endAngle = Math.PI * 0.65
    const fontSize = Math.min(width * 0.07, height * 0.09, 55)

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5
      const angle = startAngle + t * (endAngle - startAngle)

      // Final position on the arc
      const finalX = cx + (radius + fontSize * 0.3) * Math.sin(angle)
      const finalY = cy - (radius + fontSize * 0.3) * Math.cos(angle)
      // Letter rotation to follow the arc tangent
      const finalRotate = (angle * 180) / Math.PI

      // Starting position: scattered radially from center
      const scatterRadius = radius * 2.5
      const seedAngle = angle + ((i * 137.5) % (Math.PI * 0.8) - Math.PI * 0.4) * 0.5
      const scatterX = cx + scatterRadius * Math.sin(seedAngle)
      const scatterY = cy - scatterRadius * Math.cos(seedAngle)

      let x: number, y: number, rotate: number, charOpacity: number, charScale: number

      if (phase === 'enter') {
        // Staggered arrival: letters fly to their arc positions
        const delay = t * 0.4
        const charT = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay)))
        const eased = easeOutElastic(charT)

        x = scatterX + (finalX - scatterX) * eased
        y = scatterY + (finalY - scatterY) * eased
        rotate = finalRotate * eased
        charOpacity = charT > 0 ? Math.min(1, charT * 3) : 0
        charScale = 0.5 + eased * 0.5
      } else if (phase === 'hold') {
        // Subtle orbital drift: letters move slightly along the arc
        const orbitOffset = Math.sin(holdProgress * Math.PI * 2 + i * 0.3) * 0.04
        const orbitAngle = angle + orbitOffset
        x = cx + (radius + fontSize * 0.3) * Math.sin(orbitAngle)
        y = cy - (radius + fontSize * 0.3) * Math.cos(orbitAngle)
        rotate = (orbitAngle * 180) / Math.PI
        charOpacity = 1
        charScale = 1 + Math.sin(holdProgress * Math.PI * 2 + i * 0.5) * 0.02
      } else {
        // Exit: letters converge to center and fade
        const eased = easeInOutQuart(exitProgress)
        x = finalX + (cx - finalX) * eased
        y = finalY + (cy - finalY) * eased
        rotate = finalRotate * (1 - eased)
        charOpacity = 1 - exitProgress * exitProgress
        charScale = 1 - eased * 0.4
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${charScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: 700,
            letterSpacing: '0.02em',
            color,
            opacity: charOpacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {letters[i]}
        </div>
      )
    }

    // Wrap label
    const labelOpacity = phase === 'hold' ? Math.min(1, holdProgress * 4) * 0.18 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          shape-
          <br />
          outside
        </div>
      </div>
    )
  },
}

function TextWrapShapeComponent(props: MotionGraphicProps<TextWrapShapeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-text-wrap-shape',
  title: 'Text Wrap Shape',
  description:
    'Letters are arranged around an invisible circle (simulating CSS shape-outside / text-wrap). On enter, scattered letters fly into their arc positions with staggered elastic easing. During hold, they orbit the shape subtly.',
  tags: ['kinetic', 'typography', 'text-wrap', 'shape-outside', 'arc', 'circular', 'composition', 'layout', 'craft'],
  category: 'captions',
  component: TextWrapShapeComponent as any,
  defaultConfig: {
    words: ['CIRCLE', 'ORBIT', 'WRAP', 'ARC'],
    colors: ['#e8e8ff', '#b0b0ff', '#e8e8ff', '#8888ff'],
    bgColor: '#08080f',
    cycleDuration: 2.4,
    shapeRadius: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CIRCLE', 'ORBIT', 'WRAP', 'ARC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8e8ff', '#b0b0ff', '#e8e8ff', '#8888ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 1.5, max: 6, group: 'Timing' },
    { key: 'shapeRadius', label: 'Shape Radius (px)', type: 'number', defaultValue: 80, min: 40, max: 200, group: 'Layout' },
  ],
})
