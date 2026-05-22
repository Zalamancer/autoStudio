import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NoiseGateConfig extends KineticBaseConfig {
  threshold: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Simulate a signal level meter
    const meterWidth = width * 0.6
    const meterHeight = 8
    const meterY = height * 0.78

    // Signal level oscillates, crossing threshold periodically
    const signalLevel =
      0.5 +
      0.3 * Math.sin(time * 2.5) +
      0.15 * Math.sin(time * 4.3) +
      0.1 * Math.cos(time * 7.1)
    const clampedLevel = Math.max(0, Math.min(1, signalLevel))
    const threshold = 0.55
    const gateOpen = clampedLevel > threshold

    // Threshold indicator line
    const thresholdX = threshold * meterWidth

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Gate status indicator */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.12,
            right: width * 0.08,
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            color: gateOpen ? '#FF3333' : '#333333',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {gateOpen ? '● GATE OPEN' : '○ GATE CLOSED'}
        </div>

        {/* Signal level meter background */}
        <div
          style={{
            position: 'absolute',
            left: (width - meterWidth) / 2,
            top: meterY,
            width: meterWidth,
            height: meterHeight,
            background: '#111',
            borderRadius: 2,
          }}
        >
          {/* Signal level fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${clampedLevel * 100}%`,
              height: '100%',
              background: gateOpen
                ? `linear-gradient(90deg, #00AA33, #FFAA00 70%, #FF3333 100%)`
                : '#224422',
              borderRadius: 2,
              transition: 'width 0.03s linear',
            }}
          />
          {/* Threshold marker */}
          <div
            style={{
              position: 'absolute',
              left: thresholdX,
              top: -4,
              width: 2,
              height: meterHeight + 8,
              background: '#FF3333',
              opacity: 0.7,
            }}
          />
          {/* Threshold label */}
          <div
            style={{
              position: 'absolute',
              left: thresholdX - 10,
              top: meterHeight + 8,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: '#FF333399',
              whiteSpace: 'nowrap',
            }}
          >
            THR
          </div>
        </div>

        {/* Horizontal scan lines for hardware feel */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${15 + i * 14}%`,
              height: 1,
              background: 'rgba(255,50,50,0.03)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, frame, index }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // Simulate signal level to determine gate state
    const signalLevel =
      0.5 +
      0.3 * Math.sin(time * 2.5) +
      0.15 * Math.sin(time * 4.3) +
      0.1 * Math.cos(time * 7.1)
    const threshold = 0.55
    const gateOpen = signalLevel > threshold

    let opacity = 0
    let scale = 1
    let clipPercent = 100 // percentage of text visible

    if (phase === 'enter') {
      // Gate snaps open hard when threshold crossed
      if (enterProgress > 0.3) {
        opacity = 1
        scale = 1
        clipPercent = 100
      } else {
        // Below threshold - flicker/attempt
        opacity = enterProgress > 0.15 && rand(f + index) > 0.6 ? 0.3 : 0
        scale = 0.98
      }
    } else if (phase === 'hold') {
      // Gate modulation during hold - text appears/disappears with signal
      if (gateOpen) {
        opacity = 1
        scale = 1
      } else {
        // Gate closed - hard cut
        opacity = 0
        scale = 1
      }
    } else {
      // Exit: gate closes permanently
      if (exitProgress < 0.4) {
        opacity = gateOpen ? 1 : 0
      } else if (exitProgress < 0.7) {
        // Rapid gate chatter
        opacity = rand(f * 3 + index) > 0.5 ? 0.6 : 0
      } else {
        opacity = 0
      }
    }

    // Hard gate = no smooth transitions, but add a tiny attack/release
    const gateAttack = gateOpen ? 1 : 0

    return (
      <>
        {/* Signal strength micro-text */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#FF333366',
            letterSpacing: 3,
            opacity: phase === 'hold' ? 0.5 : 0,
          }}
        >
          {`SIG: ${(Math.max(0, Math.min(1, signalLevel)) * 100).toFixed(0)}% | THR: ${(threshold * 100).toFixed(0)}%`}
        </div>
        {/* Main text - hard gate on/off */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            textShadow: gateOpen
              ? `0 0 20px ${color}80, 0 0 40px ${color}40`
              : 'none',
            zIndex: 10,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function NoiseGateComponent(props: MotionGraphicProps<NoiseGateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-noise-gate',
  title: 'Kinetic Noise Gate',
  description:
    'Audio noise gate effect: text appears/cuts hard when signal exceeds threshold. Includes signal level meter, gate open/closed indicator, and hard on/off text visibility.',
  tags: ['kinetic', 'typography', 'noise', 'gate', 'audio', 'signal', 'threshold', 'hard-cut'],
  category: 'captions',
  component: NoiseGateComponent as any,
  defaultConfig: {
    words: ['GATE', 'OPEN', 'SHUT', 'SNAP'],
    colors: ['#FF3333', '#FF6644', '#FF2222', '#FF4455'],
    bgColor: '#0A0808',
    cycleDuration: 1.2,
    threshold: 0.55,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GATE', 'OPEN', 'SHUT', 'SNAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3333', '#FF6644', '#FF2222', '#FF4455'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
