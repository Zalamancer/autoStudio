import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlexoPlateConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.4
  const s = p / 4
  return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1
}

// Flexography: flexible rubber/photopolymer plate picks up ink from anilox roll,
// transfers to substrate. The plate FLEXES slightly on impression — key visible artifact
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Corrugated substrate texture — flexo often prints on cardboard/film
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Anilox roll cell pattern — fine diamond grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(60deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 8px),
              repeating-linear-gradient(120deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 8px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Substrate corrugation lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, rgba(200,180,140,0.08) 0px, rgba(200,180,140,0.08) 1px, transparent 1px, transparent 24px)`,
            pointerEvents: 'none',
          }}
        />
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
    const chars = word.split('')

    // Plate impression timing — each letter stamped by rolling plate
    // The plate "kisses" the substrate — too much pressure = ink spread
    const plateSpeed = 1 / chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 4,
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci * 0.08
          let scaleX = 1
          let scaleY = 0
          let opacity = 0
          let inkSpread = 0
          let plateY = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (0.7 - charDelay * 0.3)))
            // Plate descends, makes impression (squash), springs back
            if (p < 0.4) {
              // Plate descending
              plateY = -(1 - p / 0.4) * 60
              scaleY = p / 0.4 * 0.3
              scaleX = 1
              opacity = p / 0.4 * 0.8
              inkSpread = 0
            } else if (p < 0.6) {
              // Impression moment — plate flexes, ink spreads
              const impP = (p - 0.4) / 0.2
              scaleY = 0.3 + impP * 0.7
              scaleX = 1 + impP * 0.08  // Plate flex widens slightly
              plateY = 0
              opacity = 0.8 + impP * 0.2
              inkSpread = impP * 4
            } else {
              // Spring back — elastic bounce
              const springP = easeOutElastic((p - 0.6) / 0.4)
              scaleY = 1 + (springP - 1) * 0.05
              scaleX = 1 - (springP - 1) * 0.02
              plateY = -springP * 3
              opacity = 1
              inkSpread = (1 - (p - 0.6) / 0.4) * 4
            }
          } else if (phase === 'hold') {
            scaleX = 1
            scaleY = 1
            opacity = 1
            // Gentle ink-settle breathing
            const breathe = Math.sin(f * 0.4 + ci * 0.5) * 0.005
            scaleX = 1 + breathe
            inkSpread = 1
            plateY = 0
          } else {
            // Exit: ink lifts with tacky peel
            const p = Math.max(0, Math.min(1, (exitProgress - ci * 0.06) / 0.7))
            scaleY = 1 - p
            opacity = 1 - p * 0.8
            scaleX = 1 + p * 0.05
            plateY = -p * 30
            inkSpread = p * 3
          }

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translateY(${plateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
                transformOrigin: 'center bottom',
                opacity,
              }}
            >
              {/* Ink spread halo */}
              {inkSpread > 0.5 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(52px, 13vw, 180px)',
                    fontWeight: 900,
                    color: color,
                    filter: `blur(${inkSpread}px)`,
                    opacity: 0.3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {ch}
                </span>
              )}
              <span
                style={{
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 180px)',
                  fontWeight: 900,
                  color,
                  display: 'inline-block',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  position: 'relative',
                  // Flexo edge sharpness — slight inner shadow for plate relief effect
                  textShadow: `0 1px 0 rgba(0,0,0,0.2), 0 -1px 0 rgba(255,255,255,0.1)`,
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function FlexoPlateComponent(props: MotionGraphicProps<FlexoPlateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flexo-plate',
  title: 'Kinetic Flexo Plate',
  description: 'Flexible printing plate rolls across substrate, each letter stamped with visible impression squash, ink spread on contact, and elastic spring-back — flexography process animated',
  tags: ['kinetic', 'typography', 'print', 'flexo', 'flexography', 'plate', 'stamp', 'impression', 'process'],
  category: 'captions',
  component: FlexoPlateComponent as any,
  defaultConfig: {
    words: ['FLEX', 'KISS', 'ROLL', 'STAMP'],
    colors: ['#D4270C', '#1A4A8C', '#2E7D32', '#6A0DAD'],
    bgColor: '#F2EBD8',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLEX', 'KISS', 'ROLL', 'STAMP'], group: 'Content' },
    { key: 'colors', label: 'Ink Colors', type: 'text-array', defaultValue: ['#D4270C', '#1A4A8C', '#2E7D32', '#6A0DAD'], group: 'Style' },
    { key: 'bgColor', label: 'Substrate Color', type: 'color', defaultValue: '#F2EBD8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 5, group: 'Timing' },
  ],
})
