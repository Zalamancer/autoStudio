import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrackingPulseConfig extends KineticBaseConfig {
  pulseCount: number
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Tracking Pulse — letter-spacing expands and contracts in rhythmic beats,
 * like a heartbeat or bass hit. Each beat snaps tight then springs wide.
 * The enter uses elastic tracking, the hold pulses in repeating waves,
 * and exit collapses the tracking to zero.
 */
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
    height,
  }: WordRenderProps) => {
    const fontSize = Math.min(width * 0.13, height * 0.16, 110)
    const pulseCount = 3

    let letterSpacingEm: number
    let opacity: number
    let scale: number
    let fontWeight: number

    if (phase === 'enter') {
      // Shoot in from zero tracking, spring open with elastic
      if (enterProgress < 0.25) {
        const t = enterProgress / 0.25
        letterSpacingEm = -0.1 * (1 - t) // tight start
        opacity = t
        scale = 0.8 + t * 0.2
        fontWeight = 400
      } else {
        const t = easeOutElastic((enterProgress - 0.25) / 0.75)
        // Spring from -0.1 → +0.4 with overshoot
        letterSpacingEm = -0.1 + t * 0.5
        opacity = 1
        scale = 1
        fontWeight = Math.round(400 + (enterProgress - 0.25) / 0.75 * 400)
      }
    } else if (phase === 'hold') {
      // Rhythmic pulses: each beat = expand then snap back
      // 3 pulses over hold duration
      const beatT = (holdProgress * pulseCount) % 1
      // Each pulse: quick expand (0–0.3) then snap back (0.3–1.0)
      let pulseValue: number
      if (beatT < 0.25) {
        pulseValue = easeOutQuint(beatT / 0.25)
      } else {
        pulseValue = 1 - easeOutQuint((beatT - 0.25) / 0.75)
      }
      letterSpacingEm = 0.04 + pulseValue * 0.35 // 0.04 → 0.39 → 0.04
      opacity = 1
      scale = 1 + pulseValue * 0.04
      fontWeight = 600 + Math.round(pulseValue * 300) // 600 → 900 on beat peak
    } else {
      // Exit: tracking collapses to zero
      const t = easeInQuad(exitProgress)
      letterSpacingEm = 0.04 - t * 0.14 // down to -0.1
      opacity = 1 - exitProgress
      scale = 1 - t * 0.1
      fontWeight = 600
    }

    // Tracking line indicators (visible lines between letters concept)
    const trackingPx = Math.round(letterSpacingEm * fontSize * 100) / 100

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight,
            letterSpacing: `${letterSpacingEm.toFixed(4)}em`,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            fontVariationSettings: `"wght" ${Math.min(900, fontWeight)}`,
          }}
        >
          {word}
        </div>
        {/* Tracking annotation */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -fontSize * 0.4,
            display: 'flex',
            justifyContent: 'center',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: phase === 'hold' ? 0.22 : 0,
            letterSpacing: '0.08em',
          }}
        >
          tracking +{Math.round(letterSpacingEm * 1000)}‰
        </div>
      </div>
    )
  },
}

function TrackingPulseComponent(props: MotionGraphicProps<TrackingPulseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tracking-pulse',
  title: 'Tracking Pulse',
  description:
    'Letter-spacing expands and contracts in rhythmic beats — like a heartbeat or bass hit. Each pulse snaps tight then springs wide with elastic easing. Font weight peaks on each beat for added impact.',
  tags: ['kinetic', 'typography', 'tracking', 'letter-spacing', 'pulse', 'beat', 'rhythm', 'elastic', 'craft'],
  category: 'captions',
  component: TrackingPulseComponent as any,
  defaultConfig: {
    words: ['PULSE', 'BEAT', 'TRACK', 'SPACE'],
    colors: ['#ffffff', '#ff4466', '#ffffff', '#ff4466'],
    bgColor: '#0d0d0d',
    cycleDuration: 2.0,
    pulseCount: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PULSE', 'BEAT', 'TRACK', 'SPACE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ff4466', '#ffffff', '#ff4466'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 1.0, max: 5, group: 'Timing' },
    { key: 'pulseCount', label: 'Pulses Per Cycle', type: 'number', defaultValue: 3, min: 1, max: 6, group: 'Animation' },
  ],
})
