import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKOverprintConfig extends KineticBaseConfig {
  wipeSpeed: number
}

// CMYK channels in print order — C first, K last
const CMYK_LAYERS = [
  { color: '#00FFFF', label: 'C', order: 0 },
  { color: '#FF00FF', label: 'M', order: 1 },
  { color: '#FFFF00', label: 'Y', order: 2 },
  { color: '#000000', label: 'K', order: 3 },
]

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const grainShift = Math.floor(t * 10) * 0.7
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Paper grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle 0.6px, rgba(255,255,255,0.035) 100%, transparent 100%)`,
            backgroundSize: '4px 4px',
            backgroundPosition: `${grainShift}px ${grainShift * 0.7}px`,
          }}
        />
        {/* Ink swatch indicators at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            display: 'flex',
            gap: 4,
            opacity: 0.3,
          }}
        >
          {CMYK_LAYERS.map((l) => (
            <div
              key={l.label}
              style={{
                width: 8,
                height: 8,
                background: l.color === '#000000' ? '#444' : l.color,
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const sharedFont: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize: 'clamp(44px, 13vw, 170px)',
      fontWeight: 900,
      whiteSpace: 'nowrap',
      lineHeight: 1,
      letterSpacing: '0.02em',
    }

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {CMYK_LAYERS.map((ch) => {
          const isKey = ch.label === 'K'
          // Each channel wipes in sequentially — 25% of enter time each
          const channelWindow = 0.25
          const channelStart = ch.order * channelWindow
          const channelEnd = channelStart + channelWindow

          let wipeProgress = 0 // 0 = hidden, 1 = fully revealed
          let channelOpacity = 1

          if (phase === 'enter') {
            // Left-to-right screen wipe for this channel
            const rawP = Math.max(0, Math.min(1, (enterProgress - channelStart) / channelWindow))
            wipeProgress = easeOutCubic(rawP)
          } else if (phase === 'hold') {
            wipeProgress = 1
            // Color intensity pulse — channels slightly pulse opacity
            const pulse = Math.sin(holdProgress * Math.PI * 4 + ch.order * 0.8) * 0.08
            channelOpacity = isKey ? 1 : 0.85 + pulse
          } else {
            // Reverse dissolve — K goes first (last to arrive, first to leave)
            const reverseOrder = 3 - ch.order
            const dissolveStart = reverseOrder * channelWindow
            const rawP = Math.max(0, Math.min(1, (exitProgress - dissolveStart) / channelWindow))
            channelOpacity = 1 - easeInQuad(rawP)
            wipeProgress = 1
          }

          // Clip path for left-to-right wipe
          const clipRight = wipeProgress * 100

          return (
            <div
              key={ch.label}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                mixBlendMode: isKey ? 'normal' : 'multiply',
                opacity: channelOpacity,
                clipPath: phase === 'enter'
                  ? `inset(0 ${100 - clipRight}% 0 0)`
                  : undefined,
              }}
            >
              <span style={{ ...sharedFont, color: ch.color, display: 'block' }}>
                {word}
              </span>
            </div>
          )
        })}

        {/* Wipe edge indicator during enter */}
        {phase === 'enter' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${enterProgress * 100}%`,
              width: 2,
              background: 'rgba(255,255,255,0.15)',
              transition: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function CMYKOverprintComponent(props: MotionGraphicProps<CMYKOverprintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-overprint',
  title: 'Kinetic CMYK Overprint',
  description:
    'Sequential screen-wipe overprint. Cyan wipes in from left first, then Magenta overlaps creating purple at intersections, then Yellow mixes in, and finally Key/Black sharpens everything. Hold phase pulses color intensity. Exit dissolves channels in reverse order.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'overprint', 'wipe', 'sequential', 'multiply', 'color', 'layer'],
  category: 'captions',
  component: CMYKOverprintComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.3,
    wipeSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'wipeSpeed', label: 'Wipe Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
