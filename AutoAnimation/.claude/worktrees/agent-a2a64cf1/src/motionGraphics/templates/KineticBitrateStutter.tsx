import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BitrateStutterConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Video bitrate stutter: when bitrate drops suddenly, video freezes on last good frame
// Then catches up in a burst — the "choppy stream" artifact
// Text stutters: freeze → skip forward → freeze → skip

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Bitrate graph — live waveform showing drops and spikes
    const graphWidth = 100
    const graphPoints = Array.from({ length: graphWidth }, (_, i) => {
      const t = time - (graphWidth - i) / fps / 2
      const base = 0.6 + Math.sin(t * 1.3) * 0.2
      const spike = rand(Math.floor(t * 5) * 7 + i) < 0.1 ? 0.9 : 0
      const drop = rand(Math.floor(t * 3) * 11 + i) < 0.05 ? -0.5 : 0
      return Math.max(0.05, Math.min(1, base + spike + drop))
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Bitrate graph */}
        {graphPoints.map((val, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${i}%`,
              bottom: 6,
              width: '1%',
              height: `${val * 16}px`,
              background: val < 0.2 ? 'rgba(255,60,60,0.4)' : 'rgba(80,200,255,0.2)',
            }}
          />
        ))}
        {/* Readout */}
        <div
          style={{
            position: 'absolute',
            bottom: 26,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(80,200,255,0.25)',
            letterSpacing: 1,
          }}
        >
          BITRATE: {Math.floor(Math.max(50, 600 + Math.sin(time * 2) * 500))}kbps
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,100,60,0.2)',
          }}
        >
          DROPPED FRAMES: {Math.floor(Math.abs(Math.sin(time * 0.7)) * 12)} STUTTER: ACTIVE
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const fps_ = 30

    // Stutter pattern: freeze for N frames, then skip forward
    // Creates choppy playback effect
    const stutterPeriod = Math.floor(fps_ * 0.25) // stutter every ~8 frames
    const isStutterFrame = Math.floor(f / stutterPeriod) % 3 === 1

    // During stutter frames: show frozen (previous) progress value
    let displayProgress = phase === 'enter' ? enterProgress : phase === 'hold' ? holdProgress : exitProgress

    // Quantize progress to stutter period
    if (isStutterFrame) {
      displayProgress = Math.floor(displayProgress * 8) / 8
    }

    let opacity = 1
    let scaleX = 1
    let blurAmt = 0

    if (phase === 'enter') {
      opacity = displayProgress
      // On stutter: slight freeze artifact — blurry edges
      blurAmt = isStutterFrame ? 2 : 0
      // After freeze: catch-up jump — slight scale spike
      const catchUp = !isStutterFrame && Math.floor(f / stutterPeriod) % 3 === 2
      scaleX = catchUp ? 1.04 : 1
    } else if (phase === 'hold') {
      opacity = 1
      // Random freeze bursts during hold
      const freezeBurst = holdProgress > 0.5 && holdProgress < 0.6 && isStutterFrame
      blurAmt = freezeBurst ? 3 : 0
    } else {
      opacity = 1 - displayProgress
      blurAmt = isStutterFrame ? 2 : 0
    }

    return (
      <>
        {/* Frozen frame ghost — visible during stutter */}
        {isStutterFrame && phase !== 'exit' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scaleX(${scaleX})`,
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              color: '#888888',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              opacity: opacity * 0.4,
              filter: 'blur(1px)',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Live frame */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX})`,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            opacity,
            filter: blurAmt > 0 ? `blur(${blurAmt}px)` : 'none',
            textShadow: `0 0 8px ${color}50`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function BitrateStutterComponent(props: MotionGraphicProps<BitrateStutterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bitrate-stutter',
  title: 'Kinetic Bitrate Stutter',
  description:
    'Video bitrate stutter artifact — text freezes on dropped frames then catches up in bursts, with live bitrate waveform and dropped frame counter',
  tags: ['kinetic', 'typography', 'glitch', 'codec', 'compression', 'bitrate', 'stutter', 'stream', 'digital'],
  category: 'captions',
  component: BitrateStutterComponent as any,
  defaultConfig: {
    words: ['FREEZE', 'SKIP', 'BUFFER', 'STUTTER'],
    colors: ['#FF8844', '#FF6622', '#FF9955', '#FF7733'],
    bgColor: '#090402',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FREEZE', 'SKIP', 'BUFFER', 'STUTTER'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF8844', '#FF6622', '#FF9955', '#FF7733'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#090402', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
