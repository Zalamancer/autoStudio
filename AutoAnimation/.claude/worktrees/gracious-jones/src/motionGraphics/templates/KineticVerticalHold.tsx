import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VerticalHoldConfig extends KineticBaseConfig {
  rollSpeed: number
}

/** Eased slow-out for locking */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Vertical roll: text scrolls up continuously during instability
    // The "frame sync" bar — bright horizontal line that rolls with the content
    const rollRate = 40  // percent per second during instability
    const syncBarY = (time * rollRate * 0.5) % 105 - 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.025) 1px, rgba(255,255,255,0.025) 2px)',
            pointerEvents: 'none',
          }}
        />
        {/* Frame sync bar — the bright line that scrolls during vertical hold loss */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${syncBarY}%`,
            height: 16,
            background: 'linear-gradient(0deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.08), transparent)',
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
        {/* Below sync bar: slightly lighter — the "interlace field" below the frame edge */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${syncBarY + 1}%`,
            height: 4,
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const fp = fps ?? 30
    const time = f / fp
    const seed = index * 97 + 23

    // Vertical hold failure: text scrolls upward continuously, then snaps/locks
    // The text wraps: when it rolls off top, it reappears at bottom

    let scrollY = 0    // pixels offset — positive = down
    let opacity = 1
    let locked = false

    if (phase === 'enter') {
      // Rolling fast at start, decelerates and locks
      // enterProgress 0..1: 0=fast scroll, 1=locked
      const rollPhase = 1 - easeOut(enterProgress)
      // Roll speed: 200% of height worth of travel during enter
      scrollY = rollPhase * -200  // scrolls up
      // Also add a snap: near end of enter, a brief overshoot then settle
      if (enterProgress > 0.75) {
        const snapT = (enterProgress - 0.75) / 0.25
        // Spring overshoot: slight bounce down then settle
        const spring = Math.sin(snapT * Math.PI * 3) * (1 - snapT) * 15
        scrollY += spring
      }
      opacity = 0.5 + enterProgress * 0.5
      locked = enterProgress > 0.9
    } else if (phase === 'hold') {
      // Locked — very minor residual jitter (imperfect sync)
      const jitter = Math.sin(holdProgress * Math.PI * 8 + seed) * 1.5 * (1 - holdProgress * 0.8)
      scrollY = jitter
      opacity = 1
      locked = true
    } else {
      // Exit: frame sync lost again — starts scrolling
      const rollOut = easeOut(exitProgress)
      scrollY = rollOut * -160
      opacity = 1 - exitProgress * 0.7
    }

    // Duplicate — the "wrap-around" copy visible when scrolling (text at top and bottom)
    const wrapOffsetY = scrollY > -100 ? scrollY - 100 : scrollY + 100

    return (
      <>
        {/* Wrap-around duplicate — visible during heavy scroll */}
        {!locked && Math.abs(scrollY) > 10 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, calc(-50% + ${wrapOffsetY}%))`,
              opacity: opacity * 0.5,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: 5,
              // Motion blur suggestion — directional blur along scroll direction
              filter: Math.abs(scrollY) > 30 ? `blur(${Math.min(6, Math.abs(scrollY) * 0.03)}px)` : undefined,
            }}
          >
            {word}
          </div>
        )}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${scrollY}%))`,
            opacity,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            filter: Math.abs(scrollY) > 30 ? `blur(${Math.min(4, Math.abs(scrollY) * 0.02)}px)` : undefined,
            textShadow: locked ? `0 0 8px ${color}60` : undefined,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function VerticalHoldComponent(props: MotionGraphicProps<VerticalHoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vertical-hold',
  title: 'Kinetic Vertical Hold',
  description: 'CRT vertical hold failure — text rolls upward continuously with a wrap-around duplicate, then decelerates and snaps locked with a spring bounce',
  tags: ['kinetic', 'typography', 'vertical-hold', 'crt', 'roll', 'sync', 'display', 'hardware', 'retro'],
  category: 'captions',
  component: VerticalHoldComponent as any,
  defaultConfig: {
    words: ['ROLLING', 'SYNC', 'LOCK', 'HOLD'],
    colors: ['#ffffff', '#dddddd', '#ffffff', '#eeeeee'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.6,
    rollSpeed: 40,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ROLLING', 'SYNC', 'LOCK', 'HOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#dddddd', '#ffffff', '#eeeeee'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'rollSpeed', label: 'Roll Speed (%/s)', type: 'number', defaultValue: 40, min: 10, max: 120, group: 'Animation' },
  ],
})
