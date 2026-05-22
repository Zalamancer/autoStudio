import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrackingBreathConfig extends KineticBaseConfig {
  tightTracking: number
  looseTracking: number
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Tracking Breath — letter-spacing slowly expands and contracts in a single
 * slow, meditative wave — as if the word is drawing a deep breath. Unlike
 * Tracking Pulse (which is rhythmic/bass-driven), this is one long inhale
 * (loose) then exhale (tight). The tracking itself is the animation; nothing
 * else moves. Enter sets tracking from 0 to normal; hold breathes; exit
 * collapses tracking to negative then fades.
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
    const fontSize = Math.min(width * 0.12, height * 0.15, 105)

    // Tracking range in em — tight to very loose
    const tightEm = -0.04
    const looseEm = 0.55

    let letterSpacingEm: number
    let opacity: number
    let scaleX: number = 1

    if (phase === 'enter') {
      // From very tight (negative) to natural, with gentle ease
      const t = easeOutQuint(enterProgress)
      letterSpacingEm = tightEm + t * (0.08 - tightEm) // settle at +0.08
      opacity = Math.min(1, enterProgress * 2.5)
      scaleX = 0.96 + t * 0.04
    } else if (phase === 'hold') {
      // One full breath cycle per hold
      // 0..0.4 inhale (expand), 0.4..1.0 exhale (contract)
      let breathT: number
      if (holdProgress < 0.4) {
        breathT = easeInOutSine(holdProgress / 0.4)
      } else {
        breathT = 1 - easeInOutSine((holdProgress - 0.4) / 0.6)
      }
      letterSpacingEm = tightEm + breathT * (looseEm - tightEm)
      opacity = 1
    } else {
      // Exit: snap very tight then fade
      const t = easeInCubic(exitProgress)
      letterSpacingEm = 0.08 - t * (0.08 - tightEm * 3)
      opacity = 1 - exitProgress * exitProgress
    }

    // Tracking as percentage of 1000 for annotation
    const trackingAnnotation = Math.round(letterSpacingEm * 1000)
    const annotOpacity = phase === 'hold' ? 0.16 + Math.sin(holdProgress * Math.PI) * 0.1 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize,
            fontWeight: 300, // ultralight — weight contrast lets spacing shine
            letterSpacing: `${letterSpacingEm.toFixed(4)}em`,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {word}
        </div>
        <div
          style={{
            marginTop: fontSize * 0.28,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.18em',
            color,
            opacity: annotOpacity,
            textTransform: 'uppercase',
          }}
        >
          {trackingAnnotation > 0 ? '+' : ''}{trackingAnnotation}‰
        </div>
      </div>
    )
  },
}

function TrackingBreathComponent(props: MotionGraphicProps<TrackingBreathConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tracking-breath',
  title: 'Tracking Breath',
  description:
    'Letter-spacing performs one slow meditative breath cycle — a long inhale (expanding to very loose) then a full exhale (collapsing tight). The tracking itself IS the animation. Ultralight weight makes the spacing dramatic.',
  tags: ['kinetic', 'typography', 'tracking', 'letter-spacing', 'breathe', 'slow', 'minimal', 'craft', 'spacing'],
  category: 'captions',
  component: TrackingBreathComponent as any,
  defaultConfig: {
    words: ['SPACE', 'AIR', 'OPEN', 'WIDE'],
    colors: ['#2a2a2a', '#555', '#2a2a2a', '#555'],
    bgColor: '#fafaf8',
    cycleDuration: 3.0,
    tightTracking: -40,
    looseTracking: 550,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPACE', 'AIR', 'OPEN', 'WIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a2a2a', '#555', '#2a2a2a', '#555'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fafaf8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 3.0, min: 1.5, max: 6, group: 'Timing' },
    { key: 'tightTracking', label: 'Tight Tracking (‰)', type: 'number', defaultValue: -40, min: -100, max: 0, group: 'Animation' },
    { key: 'looseTracking', label: 'Loose Tracking (‰)', type: 'number', defaultValue: 550, min: 100, max: 900, group: 'Animation' },
  ],
})
