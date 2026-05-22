import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Position Rhythm 1/4 — Ping-Pong Delay
// Text bounces left→right→left like a stereo ping-pong delay effect

interface PingPongDelayConfig extends KineticBaseConfig {
  delayWidth: number
}

const DELAY_TAPS = 4 // number of visible echoes

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
  }: WordRenderProps) => {
    let mainOpacity = 1
    let mainX = 0

    if (phase === 'enter') {
      mainOpacity = Math.min(1, enterProgress * 2)
      mainX = (1 - enterProgress) * -width * 0.4
    } else if (phase === 'hold') {
      mainOpacity = 1
      // Ping-pong: alternates L and R on each beat
      // Beat freq: 2 per hold cycle → left on beat 1, right on beat 2
      const beatFreq = 2.0
      const beatPhase = (holdProgress * beatFreq * 2) % 2
      const side = beatPhase < 1 ? 1 : -1 // alternates L/R
      const withinBeat = beatPhase % 1
      // Spring to position
      const pos = side * (1 - Math.exp(-withinBeat * 6)) * 0.3 * width
      mainX = pos
    } else {
      mainOpacity = 1 - exitProgress
      mainX = exitProgress * width * 0.3
    }

    // Ghost echoes (delayed copies fading out)
    const ghosts = Array.from({ length: DELAY_TAPS }, (_, i) => {
      const tapDelay = (i + 1) * 0.12
      const ghostPhase = Math.max(0, holdProgress - tapDelay)
      const side = Math.floor((ghostPhase * 4) % 2) === 0 ? 1 : -1
      const pos = side * 0.28 * width
      const ghostOpacity = phase === 'hold'
        ? mainOpacity * Math.pow(0.45, i + 1)
        : 0
      return { x: pos, opacity: ghostOpacity, key: i }
    })

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {/* Ghost echoes */}
        {ghosts.map(({ x, opacity, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(calc(-50% + ${x}px), -50%)`,
              opacity,
              fontSize: 'clamp(48px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              filter: `blur(${key * 0.5}px)`,
            }}
          >
            {word}
          </div>
        ))}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(calc(-50% + ${mainX}px), -50%)`,
            opacity: mainOpacity,
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textShadow: `0 0 30px ${color}60`,
            zIndex: 10,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PingPongDelayComponent(props: MotionGraphicProps<PingPongDelayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ping-pong-delay',
  title: 'Kinetic Ping Pong Delay',
  description:
    'Text bounces left-right-left like a stereo ping-pong delay with fading ghost echoes. Each repetition decays in opacity and blurs.',
  tags: ['kinetic', 'position', 'ping-pong', 'delay', 'echo', 'stereo', 'rhythm', 'music'],
  category: 'captions',
  component: PingPongDelayComponent as any,
  defaultConfig: {
    words: ['PING', 'PONG', 'ECHO'],
    colors: ['#00D9FF', '#0090CC', '#005E99'],
    bgColor: '#040D14',
    cycleDuration: 1.2,
    delayWidth: 0.28,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PING', 'PONG', 'ECHO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00D9FF', '#0090CC', '#005E99'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040D14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
    { key: 'delayWidth', label: 'Delay Width', type: 'number', defaultValue: 0.28, min: 0.05, max: 0.6, group: 'Animation' },
  ],
})
