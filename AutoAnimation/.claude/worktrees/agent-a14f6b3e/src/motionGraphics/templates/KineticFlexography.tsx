import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlexographyConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Web-fed paper speed lines
    const feedSpeed = (time * 200) % height
    const webLines: React.ReactNode[] = []
    for (let i = 0; i < 8; i++) {
      const x = hash(i * 47 + 3) * 100
      webLines.push(
        <div
          key={`web-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: 0,
            width: 1,
            height: '100%',
            background: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.015) ${feedSpeed / height * 100}%, transparent)`,
          }}
        />
      )
    }

    // Anilox roller pattern (ink distribution)
    const rollerY = height * 0.35
    const rollerPhase = time * 4

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Substrate (packaging material) texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 6px,
              rgba(0,0,0,0.008) 6px,
              rgba(0,0,0,0.008) 7px
            )`,
          }}
        />
        {/* Web feed motion lines */}
        {webLines}
        {/* UV cure lamp glow */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '15%',
            background: `linear-gradient(to top, rgba(100,50,200,${0.03 + Math.sin(time * 8) * 0.01}), transparent)`,
            pointerEvents: 'none',
          }}
        />
        {/* Registration marks */}
        {['8%', '92%'].map((left, i) => (
          <div
            key={`reg-${i}`}
            style={{
              position: 'absolute',
              left,
              bottom: '5%',
              width: 12,
              height: 12,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '50%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 1,
                background: 'rgba(0,0,0,0.08)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 1,
                background: 'rgba(0,0,0,0.08)',
              }}
            />
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0

    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 61 + index * 37
      // Rubber plate slight squeeze distortion per character
      const squeezeAmount = 0.02 + hash(charSeed + 9) * 0.03
      const inkSpread = 0.3 + hash(charSeed + 17) * 0.4

      let opacity = 0
      let scaleX = 1
      let scaleY = 1
      let inkBleed = 0
      let uvCure = 0

      if (phase === 'enter') {
        // Rubber plate presses fast — slight horizontal squeeze then release
        const cp = Math.max(0, Math.min(1, (enterProgress - ci / chars.length * 0.2) / 0.8))
        const pressP = cp < 0.4 ? cp / 0.4 : 1
        const releaseP = cp < 0.4 ? 0 : (cp - 0.4) / 0.6

        opacity = Math.min(cp / 0.15, 1)
        // Squeeze on contact, then release
        scaleX = 1 + squeezeAmount * pressP * (1 - releaseP * 0.8)
        scaleY = 1 - squeezeAmount * 0.5 * pressP * (1 - releaseP * 0.8)
        inkBleed = pressP * inkSpread * 0.5
        // UV curing flash
        uvCure = cp > 0.7 ? (cp - 0.7) / 0.3 : 0
      } else if (phase === 'hold') {
        opacity = 1
        scaleX = 1 + squeezeAmount * 0.2
        scaleY = 1
        inkBleed = inkSpread * 0.5
        uvCure = 1
      } else {
        // Web-fed speed exit — text scrolls off rapidly
        const cp = Math.max(0, Math.min(1, exitProgress))
        opacity = 1 - cp
        scaleX = 1
        scaleY = 1 - cp * 0.15
        inkBleed = inkSpread * 0.5 * (1 - cp)
        uvCure = 1 - cp
      }

      const shadows = [
        `0 0 ${inkBleed * 2}px rgba(0,0,0,${inkBleed * 0.2})`,
        // Slight halo from UV cure
        uvCure > 0 ? `0 0 ${uvCure * 4}px rgba(130,80,220,${uvCure * 0.08})` : '',
      ].filter(Boolean).join(', ')

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity,
            color,
            transform: `scale(${scaleX}, ${scaleY})`,
            textShadow: shadows || undefined,
            transition: 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    // Web-fed motion: text scrolls up during exit
    const exitY = phase === 'exit' ? exitProgress * -80 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${exitY}px))`,
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(48px, 13vw, 170px)',
          fontWeight: 800,
          letterSpacing: 3,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}
      >
        {renderedChars}
      </div>
    )
  },
}

function FlexographyComponent(props: MotionGraphicProps<FlexographyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flexography',
  title: 'Kinetic Flexography',
  description:
    'Flexographic printing with rubber plate squeeze distortion, quick-dry UV ink cure, web-fed speed motion, and registration marks',
  tags: ['kinetic', 'typography', 'flexo', 'printing', 'packaging', 'UV', 'rubber', 'industrial', 'press'],
  category: 'captions',
  component: FlexographyComponent as any,
  defaultConfig: {
    words: ['FLEX', 'WRAP', 'CURE', 'FEED'],
    colors: ['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e'],
    bgColor: '#f0ede6',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLEX', 'WRAP', 'CURE', 'FEED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f0ede6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
