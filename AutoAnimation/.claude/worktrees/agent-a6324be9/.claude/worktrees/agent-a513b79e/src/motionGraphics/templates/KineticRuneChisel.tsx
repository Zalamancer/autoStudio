import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Ease-in-out sine for smooth chisel strokes
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// Ease-out quart for snap-in
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

interface RuneChiselConfig extends KineticBaseConfig {}

/**
 * Rune Chisel — simulates each letter being carved into stone one stroke at a time.
 *
 * Enter: letters appear sequentially, each "struck" into place with a brief scale
 *        punch (as if a chisel hit), accompanied by a chipped-stone dust offset.
 * Hold:  all letters sit fully carved, with a deep groove shadow.
 * Exit:  the whole word shatters apart — each letter flies outward and fades.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        backgroundImage: [
          // Simulate irregular stone face with overlapping subtle gradients
          'radial-gradient(ellipse 90% 50% at 15% 25%, rgba(255,255,255,0.07) 0%, transparent 55%)',
          'radial-gradient(ellipse 70% 80% at 85% 75%, rgba(0,0,0,0.09) 0%, transparent 50%)',
          'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.03) 0%, transparent 80%)',
          // Fine horizontal grain lines suggesting sedimentary layers
          'repeating-linear-gradient(180deg, transparent 0px, transparent 18px, rgba(0,0,0,0.025) 18px, rgba(0,0,0,0.025) 19px)',
        ].join(', '),
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const chars = word.split('')
    const n = chars.length

    // Overall word opacity wrapper
    let wrapperOpacity = 1
    if (phase === 'enter') wrapperOpacity = Math.min(1, enterProgress * 4)
    if (phase === 'exit') wrapperOpacity = 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: wrapperOpacity,
          display: 'flex',
          gap: '0.02em',
        }}
      >
        {chars.map((char, i) => {
          // Stagger: each character has a window within enterProgress
          const charStart = i / n
          const charEnd = (i + 1) / n
          const localEnter = Math.max(0, Math.min(1, (enterProgress - charStart) / (charEnd - charStart + 0.001)))
          const ep = easeOutQuart(localEnter)

          // Exit: each character flies outward radially from centre
          const exitEp = easeInOutSine(exitProgress)
          const centreIndex = (n - 1) / 2
          const direction = i - centreIndex // negative = left, positive = right

          let translateX = 0
          let translateY = 0
          let scale = 1
          let opacity = 1
          let shadowIntensity = 0

          if (phase === 'enter') {
            // Not-yet-carved: invisible, slightly above
            if (localEnter < 0.01) {
              opacity = 0
              translateY = -8
            } else {
              // Chisel strike: quick scale punch from 1.3 → 1.0, then micro-bounce
              const strikePunch = localEnter < 0.4
                ? 1 + (1 - localEnter / 0.4) * 0.28
                : 1 + Math.sin((localEnter - 0.4) / 0.6 * Math.PI) * 0.05 * (1 - localEnter)
              scale = strikePunch
              // Tiny vertical shake (chisel recoil) that damps out
              const recoil = localEnter < 0.5
                ? Math.sin(localEnter * Math.PI * 4) * (1 - localEnter * 2) * 4
                : 0
              translateY = (1 - ep) * -12 + recoil
              opacity = Math.min(1, localEnter * 3)
              shadowIntensity = ep
            }
          } else if (phase === 'hold') {
            shadowIntensity = 1
          } else if (phase === 'exit') {
            // Shatter outward — horizontal spread + slight upward arc
            translateX = direction * exitEp * 60
            translateY = -exitEp * 30 + exitEp * exitEp * 50 // arc up then fall
            scale = 1 - exitEp * 0.3
            opacity = 1 - exitEp
            shadowIntensity = 1 - exitEp
            // Each char also rotates slightly as it flies
            const exitAngle = direction * exitEp * 18
            // Baked into transform string below
            void exitAngle
          }

          // Carved groove: deep inset-style text shadow
          const grooveColor = 'rgba(0,0,0,' + (shadowIntensity * 0.7).toFixed(2) + ')'
          const highlightColor = 'rgba(255,255,255,' + (shadowIntensity * 0.25).toFixed(2) + ')'
          const textShadow = [
            `1px 2px 3px ${grooveColor}`,
            `-1px -1px 1px ${highlightColor}`,
            `0px 0px ${(shadowIntensity * 6).toFixed(1)}px rgba(0,0,0,${(shadowIntensity * 0.15).toFixed(2)})`,
          ].join(', ')

          // Exit rotation
          const exitAngle = (i - centreIndex) * exitEp * 18

          return (
            <span
              key={i}
              style={{
                fontFamily: "'Georgia', 'Palatino Linotype', 'Times New Roman', serif",
                fontSize: 'clamp(38px, 8vw, 118px)',
                fontWeight: 900,
                letterSpacing: '0.1em',
                color,
                display: 'inline-block',
                opacity,
                transform: `translateX(${translateX.toFixed(2)}px) translateY(${translateY.toFixed(2)}px) scale(${scale.toFixed(4)}) rotate(${exitAngle.toFixed(2)}deg)`,
                textShadow,
                // Slight contrast boost reinforces the carved-into-stone look
                filter: `contrast(${(1 + shadowIntensity * 0.2).toFixed(2)})`,
                lineHeight: 1,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          )
        })}
      </div>
    )
  },
}

function RuneChiselComponent(props: MotionGraphicProps<RuneChiselConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rune-chisel',
  title: 'Rune Chisel',
  description:
    'Letters are struck into stone one by one with a chisel punch — each character snaps in with a recoil bounce and carved groove shadow. On exit the whole word shatters outward.',
  tags: ['kinetic', 'typography', 'archaeology', 'ancient', 'rune', 'chisel', 'stone', 'carve', 'impact'],
  category: 'captions',
  component: RuneChiselComponent as any,
  defaultConfig: {
    words: ['ELDER', 'RUNES', 'CARVED', 'STONE'],
    colors: ['#d4c4a8', '#e0d0b0', '#d4c4a8', '#e0d0b0'],
    bgColor: '#4a3f35',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ELDER', 'RUNES', 'CARVED', 'STONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#d4c4a8', '#e0d0b0', '#d4c4a8', '#e0d0b0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#4a3f35', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.8, max: 5, group: 'Timing' },
  ],
})
