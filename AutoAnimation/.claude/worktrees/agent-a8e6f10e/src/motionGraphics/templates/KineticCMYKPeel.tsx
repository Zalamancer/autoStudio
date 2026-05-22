import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKPeelConfig extends KineticBaseConfig {}

/* --- deterministic noise --- */
function hash(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* --- easing: smooth peel arc --- */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/*
 * CMYK layers in peel reveal order (enter):
 * K drops in first, then Y peels to reveal M underneath,
 * then M peels to reveal C underneath — building to full color.
 *
 * Layer stacking (bottom to top): C, M, Y, K
 * Enter order: K first, then Y, M, C
 * Exit order: C first, then M, Y, K (reverse peel away)
 */
const CMYK_LAYERS = [
  { color: '#00FFFF', label: 'C', zIndex: 1 },
  { color: '#FF00FF', label: 'M', zIndex: 2 },
  { color: '#FFFF00', label: 'Y', zIndex: 3 },
  { color: '#000000', label: 'K', zIndex: 4 },
]

/* Enter order: K(3) -> Y(2) -> M(1) -> C(0) */
const ENTER_ORDER = [3, 2, 1, 0]
/* Exit order: C(0) -> M(1) -> Y(2) -> K(3) */
const EXIT_ORDER = [0, 1, 2, 3]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    /* Paper texture grain */
    const grainCount = 55
    const grains = Array.from({ length: grainCount }, (_, i) => {
      const x = hash(i * 10.3) * 100
      const y = hash(i * 15.1 + 4) * 100
      const size = 1 + hash(i * 3.9) * 1.5
      const alpha = 0.02 + hash(i * 22.3) * 0.04
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(255,255,255,${alpha})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    /* Peel shadow hint on the background */
    const shadowPulse = 0.03 + Math.sin(time * 2) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {grains}
        {/* Subtle print crop marks */}
        {[
          { x: '5%', y: '5%', rotate: 0 },
          { x: '95%', y: '5%', rotate: 90 },
          { x: '5%', y: '95%', rotate: 270 },
          { x: '95%', y: '95%', rotate: 180 },
        ].map((mark, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: mark.x,
              top: mark.y,
              width: 12,
              height: 12,
              transform: `translate(-50%, -50%) rotate(${mark.rotate}deg)`,
              opacity: shadowPulse + 0.03,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 12,
                height: 1,
                background: 'rgba(255,255,255,0.4)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 1,
                height: 12,
                background: 'rgba(255,255,255,0.4)',
              }}
            />
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, height }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {CMYK_LAYERS.map((layer, layerIdx) => {
          /*
           * Peel mechanics:
           * - Enter: layers arrive in ENTER_ORDER. Each layer drops/peels in from top.
           *   The peel uses a 3D-ish rotation + vertical translation.
           * - Hold: subtle layer breathing (tiny Y oscillation)
           * - Exit: layers peel away in EXIT_ORDER.
           */
          const enterSlot = ENTER_ORDER.indexOf(layerIdx)
          const exitSlot = EXIT_ORDER.indexOf(layerIdx)

          let rotateX = 0 // degrees of peel rotation
          let translateY = 0 // vertical offset
          let layerOpacity = 1
          let shadowOpacity = 0

          if (phase === 'enter') {
            /* Each layer gets ~35% of the timeline, staggered */
            const slotStart = enterSlot * 0.18
            const slotEnd = slotStart + 0.5
            const p = Math.max(0, Math.min(1, (enterProgress - slotStart) / (slotEnd - slotStart)))
            const eased = easeOutCubic(p)

            /* Peel in: starts rotated up and above, drops down flat */
            rotateX = (1 - eased) * -90
            translateY = (1 - eased) * -height * 0.3
            layerOpacity = Math.min(1, p * 2.5)
            shadowOpacity = (1 - eased) * 0.15
          } else if (phase === 'hold') {
            /* Subtle layer breathing: each layer floats slightly */
            const breathe = Math.sin(holdProgress * 8 + layerIdx * 1.4) * 1.2
            translateY = breathe
            rotateX = Math.sin(holdProgress * 6 + layerIdx * 2.1) * 0.3
            layerOpacity = 1
            shadowOpacity = 0.02
          } else {
            /* Exit: peel away in EXIT_ORDER */
            const slotStart = exitSlot * 0.18
            const slotEnd = slotStart + 0.5
            const p = Math.max(0, Math.min(1, (exitProgress - slotStart) / (slotEnd - slotStart)))
            const eased = easeInQuad(p)

            /* Peel up: rotates upward and translates away */
            rotateX = eased * 90
            translateY = eased * -height * 0.4
            layerOpacity = 1 - eased * 0.5
            shadowOpacity = eased * 0.12
          }

          return (
            <div
              key={layerIdx}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: layer.zIndex,
                perspective: '800px',
                pointerEvents: 'none',
              }}
            >
              {/* The peeling layer */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `translateY(${translateY}px) rotateX(${rotateX}deg)`,
                  transformOrigin: 'center top',
                  opacity: layerOpacity,
                  mixBlendMode: 'multiply',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(44px, 13vw, 170px)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    color: layer.color,
                    display: 'flex',
                  }}
                >
                  {chars.map((ch, charIdx) => {
                    /* Per-character stagger for peel wave */
                    let charExtra = 0
                    if (phase === 'enter') {
                      const charDelay = charIdx * 0.04
                      const cp = Math.max(0, Math.min(1, enterProgress - charDelay))
                      charExtra = (1 - easeInOutSine(Math.min(1, cp * 1.5))) * -5
                    } else if (phase === 'exit') {
                      const charDelay = (chars.length - 1 - charIdx) * 0.04
                      const cp = Math.max(0, Math.min(1, exitProgress - charDelay))
                      charExtra = easeInQuad(Math.min(1, cp * 1.5)) * -8
                    }

                    return (
                      <span
                        key={charIdx}
                        style={{
                          display: 'inline-block',
                          transform: `translateY(${charExtra}px)`,
                        }}
                      >
                        {ch === ' ' ? '\u00A0' : ch}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Shadow under the peeling edge */}
              {shadowOpacity > 0.01 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '10%',
                    right: '10%',
                    top: '45%',
                    height: 20,
                    background: `rgba(0,0,0,${shadowOpacity})`,
                    filter: 'blur(8px)',
                    borderRadius: '50%',
                    zIndex: layer.zIndex - 1,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function CMYKPeelComponent(props: MotionGraphicProps<CMYKPeelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-peel',
  title: 'Kinetic CMYK Peel',
  description:
    'CMYK layers peel on and off like stacked color separations. Enter: Key drops in first, then Yellow peels up to reveal Magenta, then Cyan builds to full color. Hold: subtle layer breathing. Exit: layers peel away in reverse order. Each layer uses perspective 3D rotation for a physical peel effect with multiply blend mode.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'peel', 'layers', '3d', 'separation'],
  category: 'captions',
  component: CMYKPeelComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
