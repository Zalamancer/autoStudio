import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Scale Pulse 4/4 — Limiter Clip
// Hard limiter hitting 0dB: text slams to max size then gets hard-clipped flat

interface LimiterClipConfig extends KineticBaseConfig {
  clipLevel: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const freq = 1.8
    // Sawtooth rising wave (signal building) + hard clip
    const raw = (t * freq) % 1 // sawtooth 0→1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Clipping indicator at top - red when clipping */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: raw > 0.7 ? 6 : 0,
            background: '#FF0000',
            transition: 'height 0.02s',
          }}
        />
        {/* Signal wave visualization at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '10%',
            right: '10%',
            height: 30,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3,
          }}
        >
          {Array.from({ length: 20 }, (_, i) => {
            const barPhase = (t * freq + i * 0.05) % 1
            const barRaw = barPhase
            const barClipped = Math.min(barRaw, 0.7) / 0.7
            const isClipping = barRaw > 0.7
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${barClipped * 100}%`,
                  background: isClipping ? '#FF4444' : 'rgba(255,255,255,0.3)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.3 + enterProgress * 0.7
    } else if (phase === 'hold') {
      opacity = 1
      // Limiter: signal grows (sawtooth) then gets hard-clipped at max
      const freq = 1.8
      const raw = (holdProgress * freq * 2) % 1 // sawtooth 0→1
      const clipPoint = 0.7
      const clipped = Math.min(raw, clipPoint) / clipPoint

      // Text scale grows with signal, then suddenly locked at max
      // When clipping: slight jitter (distortion artifact)
      const isClipping = raw > clipPoint
      const jitter = isClipping ? (Math.random() - 0.5) * 0.015 : 0
      scale = 0.92 + clipped * 0.18 + jitter
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(50px, 13vw, 170px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          textShadow: `
            0 0 20px ${color}80,
            0 0 40px ${color}50,
            2px 0 0 rgba(255,0,0,0.3),
            -2px 0 0 rgba(0,200,255,0.3)
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function LimiterClipComponent(props: MotionGraphicProps<LimiterClipConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-limiter-clip',
  title: 'Kinetic Limiter Clip',
  description:
    'Hard limiter hitting 0dB ceiling: text grows with sawtooth signal then is hard-clipped at maximum. Clipping indicator bar and distortion jitter.',
  tags: ['kinetic', 'scale', 'limiter', 'clip', 'distortion', 'audio', 'overload', 'music'],
  category: 'captions',
  component: LimiterClipComponent as any,
  defaultConfig: {
    words: ['MAX', 'CLIP', 'LOUD'],
    colors: ['#FF4444', '#FF8800', '#FFFFFF'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.0,
    clipLevel: 0.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MAX', 'CLIP', 'LOUD'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#FF8800', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 4,
      group: 'Timing',
    },
    {
      key: 'clipLevel',
      label: 'Clip Level',
      type: 'number',
      defaultValue: 0.7,
      min: 0.3,
      max: 0.95,
      group: 'Animation',
    },
  ],
})
