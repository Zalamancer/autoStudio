import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Scale Pulse 3/4 — Compressor Squeeze
// Compressor gain-reduction as visual: text squeezes vertically (narrow/tall) on loud peaks

interface CompressorSqueezeConfig extends KineticBaseConfig {
  squeezeRatio: number
}

function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // VU meter-style bars showing gain reduction
    const peakFreq = 1.5
    const peak = Math.abs(Math.sin(t * peakFreq * Math.PI))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* GR meter strip on left side */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: 16,
            width: 8,
            bottom: '20%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* GR indicator: fills from top downward proportional to compression */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${peak * 60}%`,
              background: `linear-gradient(to bottom, #FF4444, #FFAA00)`,
              borderRadius: '4px 4px 0 0',
            }}
          />
        </div>
        {/* Mirror on right */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: 16,
            width: 8,
            bottom: '20%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${peak * 60}%`,
              background: `linear-gradient(to bottom, #FF4444, #FFAA00)`,
              borderRadius: '4px 4px 0 0',
            }}
          />
        </div>
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
  }: WordRenderProps) => {
    let opacity = 1
    let scaleX = 1
    let scaleY = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      const sprung = easeOutElastic(enterProgress)
      scaleX = 0.4 + sprung * 0.6
      scaleY = 1.6 - sprung * 0.6
    } else if (phase === 'hold') {
      opacity = 1
      // Compressor squeeze: gain reduction narrows the text vertically
      const peakFreq = 1.5
      const peak = (Math.sin(holdProgress * peakFreq * Math.PI * 4) + 1) / 2
      // Peak → squeeze (scaleY goes down, scaleX goes up to preserve feel)
      const gr = peak * 0.28 // gain reduction amount
      scaleY = 1 - gr
      scaleX = 1 + gr * 0.35 // slight horizontal expansion under compression
    } else {
      opacity = 1 - exitProgress
      scaleX = 1 + exitProgress * 0.2
      scaleY = 1 - exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
          fontSize: 'clamp(48px, 12vw, 160px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textShadow: `0 2px 20px ${color}50`,
        }}
      >
        {word}
      </div>
    )
  },
}

function CompressorSqueezeComponent(props: MotionGraphicProps<CompressorSqueezeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-compressor-squeeze',
  title: 'Kinetic Compressor Squeeze',
  description:
    'Compressor gain-reduction visualized: text squeezes vertically on loud peaks, expanding horizontally. VU meter side panel shows GR.',
  tags: ['kinetic', 'scale', 'compressor', 'squeeze', 'audio', 'production', 'rhythm', 'music'],
  category: 'captions',
  component: CompressorSqueezeComponent as any,
  defaultConfig: {
    words: ['SQUEEZE', 'PUMP', 'LIMIT'],
    colors: ['#EF476F', '#FFD166', '#06D6A0'],
    bgColor: '#1C1C1E',
    cycleDuration: 1.1,
    squeezeRatio: 0.28,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SQUEEZE', 'PUMP', 'LIMIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#EF476F', '#FFD166', '#06D6A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1C1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 4, group: 'Timing' },
    { key: 'squeezeRatio', label: 'Squeeze Ratio', type: 'number', defaultValue: 0.28, min: 0.05, max: 0.6, group: 'Animation' },
  ],
})
