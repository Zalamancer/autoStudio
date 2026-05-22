import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BufferSpinResolveConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Streaming buffering spinner → content resolves
// The classic YouTube/Netflix buffering circle resolves into the actual content
// Text is the "content" that resolves from behind the spinner

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Background: content thumbnail (blurred/grey) waiting to load
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Simulated content preview strips */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${10 + i * 15}%`,
              height: '10%',
              background: `rgba(255,255,255,${0.02 + rand(i * 7) * 0.02})`,
            }}
          />
        ))}
        {/* Bandwidth indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(100,200,255,0.25)',
            letterSpacing: 1,
          }}
        >
          {Math.floor(0.5 + Math.abs(Math.sin(time * 0.7)) * 8.5).toFixed(1)} Mbps ◦◦◦ BUFFERING
        </div>
        {/* Retry counter */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,200,100,0.18)',
          }}
        >
          CDN: {['Fastly', 'CloudFront', 'Cloudflare'][Math.floor(time * 0.2) % 3]}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const fps_ = 30
    const spinAngle = (f / fps_) * 360 * 1.5 // 1.5 rotations per second

    if (phase === 'enter') {
      // Spinner visible, content hidden behind it, then resolves
      const contentProgress = Math.max(0, (enterProgress - 0.5) / 0.5)
      const spinnerSize = Math.max(0, 1 - (enterProgress - 0.5) / 0.3) * 60 + 20
      const spinnerOpacity = Math.max(0, 1 - (enterProgress - 0.5) * 3)

      return (
        <>
          {/* Buffering spinner */}
          {spinnerOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${spinAngle}deg)`,
                width: spinnerSize,
                height: spinnerSize,
                borderRadius: '50%',
                border: `${Math.max(2, spinnerSize * 0.08)}px solid rgba(255,255,255,0.1)`,
                borderTopColor: color,
                borderRightColor: `${color}88`,
                opacity: spinnerOpacity,
              }}
            />
          )}
          {/* Content resolving */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              opacity: contentProgress,
              filter: contentProgress < 1 ? `blur(${(1 - contentProgress) * 6}px)` : 'none',
              textShadow: `0 0 10px ${color}50`,
            }}
          >
            {word}
          </div>
        </>
      )
    }

    if (phase === 'hold') {
      // Brief re-buffer stutter on hold
      const reBuffer = holdProgress > 0.55 && holdProgress < 0.65
      const reBufferIntensity = reBuffer ? Math.sin(((holdProgress - 0.55) / 0.1) * Math.PI) : 0

      return (
        <>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              opacity: 1 - reBufferIntensity * 0.5,
              filter: reBufferIntensity > 0.3 ? `blur(${reBufferIntensity * 3}px)` : 'none',
              textShadow: `0 0 8px ${color}40`,
            }}
          >
            {word}
          </div>
          {reBuffer && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${spinAngle}deg)`,
                width: 30 * reBufferIntensity,
                height: 30 * reBufferIntensity,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: color,
                opacity: reBufferIntensity,
              }}
            />
          )}
        </>
      )
    }

    // Exit: content goes back to loading state
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          opacity: 1 - exitProgress,
          filter: exitProgress > 0.5 ? `blur(${(exitProgress - 0.5) * 8}px)` : 'none',
        }}
      >
        {word}
      </div>
    )
  },
}

function BufferSpinResolveComponent(props: MotionGraphicProps<BufferSpinResolveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-buffer-spin-resolve',
  title: 'Kinetic Buffer Spin Resolve',
  description:
    'Streaming buffering spinner resolves to content — rotating circle spinner transitions into crisp text with bandwidth readout and CDN indicator',
  tags: ['kinetic', 'typography', 'network', 'buffering', 'spinner', 'stream', 'cdn', 'digital', 'loading'],
  category: 'captions',
  component: BufferSpinResolveComponent as any,
  defaultConfig: {
    words: ['LOADING', 'STREAM', 'RESOLVE', 'CONNECT'],
    colors: ['#FF4499', '#FF2288', '#FF55AA', '#FF3399'],
    bgColor: '#0d000a',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LOADING', 'STREAM', 'RESOLVE', 'CONNECT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4499', '#FF2288', '#FF55AA', '#FF3399'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d000a', group: 'Style' },
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
