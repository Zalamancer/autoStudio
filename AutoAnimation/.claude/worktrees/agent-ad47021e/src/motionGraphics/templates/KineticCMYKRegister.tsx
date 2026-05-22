import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKRegisterConfig extends KineticBaseConfig {}

/* --- deterministic hash for subtle noise --- */
function hash(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* --- custom ease: smooth overshoot settle --- */
function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (t - 1) * (t - 1) * ((c + 1) * (t - 1) + c)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/* The 4 CMYK channels with their approach directions */
const CMYK_CHANNELS = [
  { color: '#00FFFF', label: 'C', dx: -1, dy: -1 },  // Cyan from top-left
  { color: '#FF00FF', label: 'M', dx: 1, dy: -1 },   // Magenta from top-right
  { color: '#FFFF00', label: 'Y', dx: -1, dy: 1 },   // Yellow from bottom-left
  { color: '#000000', label: 'K', dx: 1, dy: 1 },     // Key from bottom-right
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    /* Paper texture: subtle grain dots */
    const grainCount = 60
    const grains = Array.from({ length: grainCount }, (_, i) => {
      const x = hash(i * 7.3) * 100
      const y = hash(i * 13.1 + 5) * 100
      const size = 1 + hash(i * 3.7) * 2
      const alpha = 0.03 + hash(i * 19.3) * 0.04
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

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Paper texture noise */}
        {grains}
        {/* Registration crosshair marks in corners */}
        {[0, 1, 2, 3].map((corner) => {
          const cx = corner % 2 === 0 ? 20 : width - 20
          const cy = corner < 2 ? 20 : height - 20
          const pulse = 0.3 + Math.sin(time * 4 + corner) * 0.1
          return (
            <div key={`reg-${corner}`} style={{ position: 'absolute', left: cx - 6, top: cy - 6, width: 12, height: 12, opacity: pulse }}>
              <div style={{ position: 'absolute', left: 5, top: 0, width: 2, height: 12, background: 'rgba(255,255,255,0.3)' }} />
              <div style={{ position: 'absolute', left: 0, top: 5, width: 12, height: 2, background: 'rgba(255,255,255,0.3)' }} />
              <div style={{ position: 'absolute', left: 2, top: 2, width: 8, height: 8, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%' }} />
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')

    /* Maximum offset distance for enter/exit */
    const maxOffset = Math.min(width, height) * 0.25

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {CMYK_CHANNELS.map((channel, ci) => {
          /* Per-channel offset calculation */
          let offsetX = 0
          let offsetY = 0
          let opacity = 1

          if (phase === 'enter') {
            /* Stagger each channel slightly */
            const stagger = ci * 0.12
            const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * CMYK_CHANNELS.length * 0.3)))
            const eased = easeOutBack(Math.min(1, p))
            const remaining = 1 - eased
            offsetX = channel.dx * maxOffset * remaining
            offsetY = channel.dy * maxOffset * remaining
            opacity = Math.min(1, p * 3)
          } else if (phase === 'hold') {
            /* Micro-jitter misregistration wobble */
            const jitterAmp = 1.5
            const t = holdProgress * 20 + ci * 2.5
            offsetX = Math.sin(t * 3.7 + ci * 1.1) * jitterAmp * channel.dx
            offsetY = Math.cos(t * 2.9 + ci * 0.7) * jitterAmp * channel.dy
            opacity = 1
          } else {
            /* Exit: layers drift apart again */
            const stagger = (CMYK_CHANNELS.length - 1 - ci) * 0.1
            const p = Math.max(0, Math.min(1, (exitProgress - stagger) / (1 - stagger * CMYK_CHANNELS.length * 0.25)))
            const eased = easeInCubic(p)
            offsetX = channel.dx * maxOffset * eased
            offsetY = channel.dy * maxOffset * eased
            opacity = 1 - p * 0.5
          }

          return (
            <div
              key={ci}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translate(${offsetX}px, ${offsetY}px)`,
                opacity,
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
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
                  color: channel.color,
                  display: 'flex',
                }}
              >
                {chars.map((ch, charIdx) => {
                  /* Per-character micro-offset during hold for extra misregistration feel */
                  let charJitterX = 0
                  let charJitterY = 0
                  if (phase === 'hold') {
                    const seed = holdProgress * 15 + charIdx * 3.3 + ci * 7.1
                    charJitterX = Math.sin(seed * 2.3) * 0.4
                    charJitterY = Math.cos(seed * 1.7) * 0.4
                  }
                  return (
                    <span
                      key={charIdx}
                      style={{
                        display: 'inline-block',
                        transform: `translate(${charJitterX}px, ${charJitterY}px)`,
                      }}
                    >
                      {ch === ' ' ? '\u00A0' : ch}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  },
}

function CMYKRegisterComponent(props: MotionGraphicProps<CMYKRegisterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-register',
  title: 'Kinetic CMYK Register',
  description:
    'CMYK color separation layers slide into registration from four corners. Cyan from top-left, Magenta from top-right, Yellow from bottom-left, Key/Black from bottom-right. Layers converge with overshoot easing, hold with micro-jitter misregistration wobble, then drift apart on exit. Uses multiply blend mode for realistic print overlap.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'registration', 'color-separation', 'overlay'],
  category: 'captions',
  component: CMYKRegisterComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.2,
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
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
