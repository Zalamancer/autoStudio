import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TurnstileConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * KineticTurnstile
 * The text is mounted on a horizontal bar (like a subway turnstile arm) that
 * rotates 90° around the X-axis to face the viewer. As the bar spins into
 * view, the text flips from edge-on (invisible) to front-facing (readable).
 * A second bar is always 90° behind, carrying the next "ghost" word.
 * Background shows the turnstile post and housing.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const cx = width / 2
    const barY = height / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Central vertical post */}
        <div
          style={{
            position: 'absolute',
            left: cx - 3,
            top: barY - height * 0.28,
            width: 6,
            height: height * 0.56,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 3,
          }}
        />
        {/* Housing cap at top */}
        <div
          style={{
            position: 'absolute',
            left: cx - 20,
            top: barY - height * 0.28 - 10,
            width: 40,
            height: 14,
            borderRadius: 7,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        />
        {/* Housing cap at bottom */}
        <div
          style={{
            position: 'absolute',
            left: cx - 20,
            top: barY + height * 0.28 - 4,
            width: 40,
            height: 14,
            borderRadius: 7,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        />
        {/* Pivot ring */}
        <div
          style={{
            position: 'absolute',
            left: cx - 10,
            top: barY - 10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const barWidth = width * 0.88

    // Turnstile rotates around the X axis (horizontal pivot)
    // rotateX: 90° = bar pointing straight up (edge-on, invisible)
    //           0° = bar pointing straight out at viewer (readable)
    //         -90° = bar pointing straight down
    let rotateX = 90
    let opacity = 1
    let shadowOpacity = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      rotateX = 90 - 90 * eased
      opacity = enterProgress < 0.2 ? enterProgress / 0.2 : 1
      shadowOpacity = eased * 0.4
    } else if (phase === 'hold') {
      rotateX = 0
      shadowOpacity = 0.35
    } else {
      const eased = easeInCubic(exitProgress)
      rotateX = -90 * eased
      opacity = exitProgress > 0.7 ? 1 - (exitProgress - 0.7) / 0.3 : 1
      shadowOpacity = (1 - eased) * 0.35
    }

    // Perspective foreshortening for the bar (scaleY collapses as it goes edge-on)
    const scaleY = Math.abs(Math.cos((rotateX * Math.PI) / 180))
    const brightnessVal = 0.45 + 0.55 * Math.abs(Math.cos((rotateX * Math.PI) / 180))

    // Bar arm lines left and right of post
    const armOpacity = Math.abs(Math.cos((rotateX * Math.PI) / 180)) * 0.4

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Left arm */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '44%',
            height: Math.max(2, 8 * Math.abs(Math.cos((rotateX * Math.PI) / 180))),
            marginLeft: -1,
            marginTop: -Math.max(2, 8 * Math.abs(Math.cos((rotateX * Math.PI) / 180))) / 2,
            background: `rgba(255,255,255,${armOpacity})`,
            borderRadius: 4,
            transformOrigin: 'left center',
          }}
        />
        {/* Right arm */}
        <div
          style={{
            position: 'absolute',
            right: '50%',
            top: '50%',
            width: '44%',
            height: Math.max(2, 8 * Math.abs(Math.cos((rotateX * Math.PI) / 180))),
            marginRight: -1,
            marginTop: -Math.max(2, 8 * Math.abs(Math.cos((rotateX * Math.PI) / 180))) / 2,
            background: `rgba(255,255,255,${armOpacity})`,
            borderRadius: 4,
            transformOrigin: 'right center',
          }}
        />
        {/* Text on the bar face */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: barWidth,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformOrigin: 'center center',
          }}
        >
          <div
            style={{
              transform: `scaleY(${scaleY})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(40px, 10vw, 140px)',
                fontWeight: 800,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                filter: `brightness(${brightnessVal})`,
                textShadow: `0 ${shadowOpacity * 20}px ${shadowOpacity * 30}px rgba(0,0,0,${shadowOpacity})`,
              }}
            >
              {word}
            </span>
          </div>
        </div>
      </div>
    )
  },
}

function TurnstileComponent(props: MotionGraphicProps<TurnstileConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-turnstile',
  title: 'Kinetic Turnstile',
  description:
    'Text flips in on a turnstile bar rotating around the horizontal axis — edge-on to front-facing, like pushing through a subway gate.',
  tags: ['kinetic', 'typography', 'turnstile', 'flip', 'rotate', 'subway', 'mechanical', 'bar'],
  category: 'captions',
  component: TurnstileComponent as any,
  defaultConfig: {
    words: ['PUSH', 'CLICK', 'PASS', 'NEXT'],
    colors: ['#FFDD00', '#FF6600', '#FFFFFF', '#44FF88'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PUSH', 'CLICK', 'PASS', 'NEXT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFDD00', '#FF6600', '#FFFFFF', '#44FF88'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 5, group: 'Timing' },
  ],
})
