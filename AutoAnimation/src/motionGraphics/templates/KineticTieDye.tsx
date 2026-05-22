import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TieDyeConfig extends KineticBaseConfig {
  swirlSpeed: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const rotation = time * 8

    // Psychedelic rainbow bands
    const bands = [
      '#FF1744', '#FF9100', '#FFEA00', '#00E676',
      '#00B0FF', '#651FFF', '#FF4081', '#FF6D00',
    ]
    const bandWidth = 100 / bands.length

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Spiral tie-dye pattern — concentric rings with rotation */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.max(width, height) * 2,
            height: Math.max(width, height) * 2,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            background: `conic-gradient(from ${rotation}deg, ${bands.map((c, i) => `${c} ${i * bandWidth}% ${(i + 1) * bandWidth}%`).join(', ')})`,
            opacity: 0.15,
            pointerEvents: 'none',
          }}
        />
        {/* Fabric texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Dye bleed — soft radial spots */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${25 + i * 25}%`,
              top: `${30 + Math.sin(time + i * 2) * 10}%`,
              width: '30%',
              height: '30%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${bands[i * 2]}22 0%, transparent 70%)`,
              transform: `rotate(${time * 5 + i * 120}deg)`,
              pointerEvents: 'none',
            }}
          />
        ))}
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
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30 // approximate

    // Spiral rainbow colors for the text
    const rainbowColors = [
      '#FF1744', '#FF9100', '#FFEA00', '#00E676',
      '#00B0FF', '#651FFF', '#FF4081',
    ]

    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / (totalChars + 1)) * 0.5
          let dyeSpread = 0
          let opacity = 1
          let swirlAngle = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.4)))
            dyeSpread = easeOutExpo(p)
            opacity = dyeSpread
            // Spiral outward reveal
            swirlAngle = (1 - p) * 180
          } else if (phase === 'hold') {
            dyeSpread = 1
            opacity = 1
            // Gentle color cycling
            swirlAngle = Math.sin(holdProgress * Math.PI * 2 + ci) * 3
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            dyeSpread = 1
            opacity = 1 - easeOutExpo(p)
            swirlAngle = p * -120
          }

          // Each character gets a cycling rainbow color from the tie-dye spiral
          const colorIdx = (ci + Math.floor(f * 0.03)) % rainbowColors.length
          const charColor = phase === 'hold'
            ? rainbowColors[(ci + Math.floor(holdProgress * rainbowColors.length)) % rainbowColors.length]
            : rainbowColors[colorIdx]

          // Dye absorption ring effect — concentric circles clip
          const ringRadius = dyeSpread * 120

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Dye spread ring behind character */}
              {dyeSpread > 0.05 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: ringRadius,
                    height: ringRadius,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${charColor}44 0%, ${charColor}22 40%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Main character with tie-dye color */}
              <span
                style={{
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(40px, 11vw, 140px)',
                  fontWeight: 900,
                  color: charColor,
                  opacity,
                  display: 'inline-block',
                  transform: `rotate(${swirlAngle}deg) scale(${0.5 + dyeSpread * 0.5})`,
                  textShadow: dyeSpread > 0.5
                    ? `0 0 20px ${charColor}88, 0 0 40px ${charColor}44`
                    : 'none',
                  letterSpacing: 3,
                  lineHeight: 1,
                  // Gradient overlay for multi-color dye effect
                  backgroundImage: dyeSpread > 0.3
                    ? `linear-gradient(${swirlAngle + 90}deg, ${rainbowColors[(colorIdx) % rainbowColors.length]}, ${rainbowColors[(colorIdx + 2) % rainbowColors.length]}, ${rainbowColors[(colorIdx + 4) % rainbowColors.length]})`
                    : 'none',
                  backgroundClip: dyeSpread > 0.3 ? 'text' : undefined,
                  WebkitBackgroundClip: dyeSpread > 0.3 ? 'text' : undefined,
                  WebkitTextFillColor: dyeSpread > 0.3 ? 'transparent' : undefined,
                }}
              >
                {ch}
              </span>
              {/* Fabric fiber bleed — small dye tendrils */}
              {dyeSpread > 0.3 && phase !== 'exit' &&
                Array.from({ length: 5 }, (_, ti) => {
                  const angle = (ti / 5) * Math.PI * 2 + ci * 1.2
                  const dist = 15 + dyeSpread * 20
                  const tx = Math.cos(angle) * dist
                  const ty = Math.sin(angle) * dist
                  return (
                    <div
                      key={ti}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${tx}px)`,
                        top: `calc(50% + ${ty}px)`,
                        width: 3 + dyeSpread * 4,
                        height: 2,
                        background: charColor,
                        opacity: opacity * 0.25,
                        borderRadius: 1,
                        transform: `rotate(${angle * 57.3}deg)`,
                        pointerEvents: 'none',
                      }}
                    />
                  )
                })}
            </div>
          )
        })}
      </div>
    )
  },
}

function TieDyeComponent(props: MotionGraphicProps<TieDyeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tie-dye',
  title: 'Kinetic Tie-Dye',
  description: 'Text color spreads outward in spiral tie-dye pattern with fabric dye absorption and psychedelic rainbow bands',
  tags: ['kinetic', 'typography', 'tie-dye', 'psychedelic', 'rainbow', 'spiral', 'fabric', 'textile', 'hippie', 'craft'],
  category: 'captions',
  component: TieDyeComponent as any,
  defaultConfig: {
    words: ['SWIRL', 'DRIP', 'SOAK', 'BLOOM'],
    colors: ['#FF1744', '#FFEA00', '#00E676', '#651FFF'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.3,
    swirlSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWIRL', 'DRIP', 'SOAK', 'BLOOM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF1744', '#FFEA00', '#00E676', '#651FFF'], group: 'Style' },
    { key: 'bgColor', label: 'Fabric Color', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'swirlSpeed', label: 'Swirl Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
